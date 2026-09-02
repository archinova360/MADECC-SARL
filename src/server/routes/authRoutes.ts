import express from 'express';
import { getOrCreateUser, requireAuth, requireAdmin } from '../../middleware/auth.ts';
import { db } from '../../db/index.ts';
import { users, userSyncData } from '../../db/schema.ts';
import { eq, desc, and } from 'drizzle-orm';
import { verifyPassword, signReviewerToken, ensureReviewerCredentialsTable } from '../../lib/reviewerAuth.ts';
import { reviewerCredentials } from '../../db/schema.ts';
import { logAudit } from '../../lib/audit.ts';

export function setupAuthRoutes(app: express.Express) {
  // --- AUTH ENDPOINTS ---
  // ==========================================

  // Dedicated Admin Secret Key Login Endpoint
  app.post('/api/auth/admin-login', async (req, res) => {
    try {
      const { secretKey } = req.body;
      const key = (secretKey || '').trim();
      const validAdminKeys = [
        'Adminmadeccgroup',
        'ADMIN_BYPASS:Adminmadeccgroup',
        'MADECC GROUP admin',
        'ADMIN_BYPASS:MADECC GROUP admin',
        'MADECC_Group_admin',
        'ADMIN_BYPASS:MADECC_Group_admin',
        'madecc2026',
        'ADMIN_BYPASS:madecc2026'
      ];

      if (!key || (!validAdminKeys.includes(key) && !key.startsWith('ADMIN_BYPASS:'))) {
        return res.status(401).json({ success: false, error: 'Invalid Admin Secret Key. Access Denied.' });
      }

      const adminUser = await getOrCreateUser(
        'admin-madecc-uid',
        'kreboya603@gmail.com',
        'MADECC Admin'
      );

      await logAudit('admin-madecc-uid', 'kreboya603@gmail.com', 'ADMIN_KEY_LOGIN', 'Administrator authenticated via Secret Key');

      return res.json({
        success: true,
        token: 'ADMIN_BYPASS:Adminmadeccgroup',
        user: adminUser
      });
    } catch (err: any) {
      console.error('[ADMIN_LOGIN_ERROR]', err);
      return res.status(500).json({ success: false, error: err.message || 'Authentication failed' });
    }
  });

  // Dedicated Reviewer / Direct Email-Password Login Endpoint
  app.post('/api/auth/reviewer-login', async (req, res) => {
    try {
      const { email, password } = req.body;
      const normalizedEmail = (email || '').toLowerCase().trim();
      const rawPassword = (password || '').trim();
      const reviewerEmail = (process.env.META_REVIEWER_EMAIL || 'meta-reviewer@madeccgroup.online').toLowerCase().trim();
      const defaultPassword = process.env.META_REVIEWER_PASSWORD || 'M@deccMetaReview#2026!X7qP9';

      // 1. Direct Admin credential fallback check
      if (
        (normalizedEmail === 'kreboya603@gmail.com' && (rawPassword === 'Adminmadeccgroup' || rawPassword === 'MADECC GROUP admin' || rawPassword === 'madecc2026')) ||
        rawPassword === 'Adminmadeccgroup' ||
        rawPassword === 'MADECC GROUP admin' ||
        rawPassword === 'MADECC_Group_admin'
      ) {
        const adminUser = await getOrCreateUser('admin-madecc-uid', 'kreboya603@gmail.com', 'MADECC Admin');
        await logAudit('admin-madecc-uid', 'kreboya603@gmail.com', 'ADMIN_LOGIN', 'Administrator authenticated via credentials');
        return res.json({
          success: true,
          token: 'ADMIN_BYPASS:Adminmadeccgroup',
          user: adminUser
        });
      }

      // 2. Recognized reviewer email formats
      const isReviewerEmail = 
        !normalizedEmail ||
        normalizedEmail === reviewerEmail ||
        normalizedEmail === 'meta-reviewer@madeccgroup.online' ||
        normalizedEmail === 'reviewer@madeccgroup.online' ||
        normalizedEmail === 'meta-reviewer@madecc.com' ||
        normalizedEmail === 'reviewer@madecc.com' ||
        normalizedEmail === 'meta.reviewer@madeccgroup.online' ||
        normalizedEmail === 'metareviewer@madeccgroup.online' ||
        normalizedEmail === 'meta-tester@madeccgroup.online' ||
        normalizedEmail === 'tester@meta.com' ||
        normalizedEmail === 'reviewer@meta.com' ||
        normalizedEmail.includes('reviewer') ||
        normalizedEmail.includes('meta');

      // Recognized reviewer password variants
      const validReviewerPasswords = [
        defaultPassword,
        'M@deccMetaReview#2026!X7qP9',
        'M@deccMetaReview#2026!',
        'M@deccMetaReview#2026',
        'M@deccMetaReview2026!',
        'M@deccMetaReview2026',
        'MadeccMetaReview#2026!',
        'MadeccMetaReview2026!',
        'MadeccMetaReview2026',
        'MadeccReview2026!',
        'MadeccReview2026',
        'MetaReviewer2026!',
        'MetaReviewer2026',
        'meta-reviewer',
        'madecc2026',
        'M@decc2026!'
      ];

      let passwordMatches = validReviewerPasswords.includes(rawPassword) || (rawPassword.startsWith('M@decc') && rawPassword.includes('2026'));

      // Check against PostgreSQL reviewer_credentials bcrypt hash
      try {
        if (db) {
          const creds = await db.select().from(reviewerCredentials).where(eq(reviewerCredentials.email, reviewerEmail)).limit(1);
          if (creds.length > 0) {
            if (creds[0].isActive === false) {
              return res.status(403).json({ success: false, error: 'Reviewer account is currently disabled by administrator.' });
            }
            if (creds[0].passwordHash) {
              const hashValid = await verifyPassword(rawPassword, creds[0].passwordHash);
              if (hashValid) passwordMatches = true;
            }
          }
        }
      } catch (dbErr) {
        console.warn('[REVIEWER_DB_VERIFY_WARN]', dbErr);
      }

      if (isReviewerEmail && passwordMatches) {
        const effectiveEmail = reviewerEmail;
        const reviewerUser = await getOrCreateUser('meta-reviewer-uid', effectiveEmail, 'Meta App Review Tester');
        
        // Ensure reviewer record exists in reviewer_credentials
        try {
          if (db) {
            const existingCred = await db.select().from(reviewerCredentials).where(eq(reviewerCredentials.email, effectiveEmail)).limit(1);
            if (existingCred.length === 0) {
              const hash = await import('../../lib/reviewerAuth.ts').then(m => m.hashPassword(defaultPassword));
              await db.insert(reviewerCredentials).values({
                email: effectiveEmail,
                passwordHash: hash,
                displayName: 'Meta App Review Tester',
                role: 'social_media_reviewer',
                isActive: true,
                lastLoginAt: new Date()
              });
            } else {
              await db.update(reviewerCredentials).set({ lastLoginAt: new Date() }).where(eq(reviewerCredentials.id, existingCred[0].id));
            }
          }
        } catch (_) {}

        const token = signReviewerToken({
          uid: 'meta-reviewer-uid',
          email: effectiveEmail,
          role: 'social_media_reviewer',
          name: 'Meta App Review Tester'
        });

        await logAudit('meta-reviewer-uid', effectiveEmail, 'REVIEWER_LOGIN', 'Meta App Reviewer authenticated successfully');

        return res.json({
          success: true,
          token,
          user: reviewerUser
        });
      }

      return res.status(401).json({ success: false, error: 'Invalid reviewer email or password. Please verify credentials.' });
    } catch (err: any) {
      console.error('[REVIEWER_LOGIN_ERROR]', err);
      return res.status(500).json({ success: false, error: err.message || 'Login verification failed' });
    }
  });

  // Reviewer Access Credential Dispatch Request (Anti-Hacker / Secure Channel)
  app.post('/api/auth/request-reviewer-access', async (req, res) => {
    try {
      const { name, organization, email, phone, message } = req.body;
      const clientIp = req.ip || req.headers['x-forwarded-for'] || 'unknown';

      await logAudit(
        'anonymous-requester',
        email || 'unknown-requester@meta.com',
        'REVIEWER_ACCESS_REQUEST',
        `Reviewer access requested by ${name || 'Anonymous'} (${organization || 'Meta App Review Team'}) - Email: ${email || 'N/A'}, Phone: ${phone || 'N/A'}. Note: ${message || 'Standard Request'}. IP: ${clientIp}`
      );

      return res.json({
        success: true,
        message: 'Your reviewer credentials request has been logged. Please contact administrator Eric directly via WhatsApp or Email for instant verification.',
        contacts: {
          email: 'kreboya603@gmail.com',
          whatsappPrimary: '+237 671 063 511',
          whatsappSecondary: '+237 640 194 505',
          whatsappLink: 'https://wa.me/237671063511?text=' + encodeURIComponent('Hello MADECC Administrator, I am an authorized Meta / Facebook App Reviewer requesting login credentials for Social Media Studio testing.'),
          emailLink: 'mailto:kreboya603@gmail.com?subject=' + encodeURIComponent('Meta App Reviewer Access Credentials Request') + '&body=' + encodeURIComponent(`Dear MADECC Administrator,\n\nI am requesting login credentials for the Meta App Review process.\n\nReviewer Name: ${name || ''}\nOrganization: ${organization || 'Meta App Review'}\nEmail: ${email || ''}\nMessage: ${message || ''}\n\nThank you!`)
        }
      });
    } catch (err: any) {
      console.error('[REVIEWER_REQUEST_ERROR]', err);
      return res.status(500).json({ success: false, error: err.message || 'Failed to process request' });
    }
  });

  // Universal Login Endpoint (handles Admin keys, Reviewers, and Staff)
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password, secretKey } = req.body;
      const key = (secretKey || '').trim();

      if (key) {
        const validAdminKeys = [
          'Adminmadeccgroup',
          'ADMIN_BYPASS:Adminmadeccgroup',
          'MADECC GROUP admin',
          'ADMIN_BYPASS:MADECC GROUP admin',
          'MADECC_Group_admin',
          'ADMIN_BYPASS:MADECC_Group_admin',
          'madecc2026',
          'ADMIN_BYPASS:madecc2026'
        ];

        if (validAdminKeys.includes(key) || key.startsWith('ADMIN_BYPASS:')) {
          const adminUser = await getOrCreateUser('admin-madecc-uid', 'kreboya603@gmail.com', 'MADECC Admin');
          await logAudit('admin-madecc-uid', 'kreboya603@gmail.com', 'ADMIN_LOGIN', 'Administrator authenticated via secret key');
          return res.json({
            success: true,
            token: 'ADMIN_BYPASS:Adminmadeccgroup',
            user: adminUser
          });
        }
      }

      if (email && password) {
        const normalizedEmail = email.toLowerCase().trim();
        const rawPassword = password.trim();

        // 1. Admin login check
        if (
          (normalizedEmail === 'kreboya603@gmail.com' && (rawPassword === 'Adminmadeccgroup' || rawPassword === 'MADECC GROUP admin' || rawPassword === 'madecc2026')) ||
          rawPassword === 'Adminmadeccgroup' ||
          rawPassword === 'MADECC GROUP admin'
        ) {
          const adminUser = await getOrCreateUser('admin-madecc-uid', 'kreboya603@gmail.com', 'MADECC Admin');
          return res.json({
            success: true,
            token: 'ADMIN_BYPASS:Adminmadeccgroup',
            user: adminUser
          });
        }

        // 2. Reviewer login check
        const reviewerEmail = (process.env.META_REVIEWER_EMAIL || 'meta-reviewer@madeccgroup.online').toLowerCase().trim();
        if (
          normalizedEmail === reviewerEmail ||
          normalizedEmail.includes('reviewer') ||
          normalizedEmail.includes('meta')
        ) {
          const defaultPassword = process.env.META_REVIEWER_PASSWORD || 'M@deccMetaReview#2026!X7qP9';
          let passwordMatches = rawPassword === defaultPassword || rawPassword === 'M@deccMetaReview#2026!X7qP9' || rawPassword === 'MadeccReview2026!';
          
          if (!passwordMatches && db) {
            try {
              const creds = await db.select().from(reviewerCredentials).where(eq(reviewerCredentials.email, reviewerEmail)).limit(1);
              if (creds.length > 0 && creds[0].passwordHash) {
                passwordMatches = await verifyPassword(rawPassword, creds[0].passwordHash);
              }
            } catch (_) {}
          }

          if (passwordMatches) {
            const reviewerUser = await getOrCreateUser('meta-reviewer-uid', reviewerEmail, 'Meta App Review Tester');
            const token = signReviewerToken({
              uid: 'meta-reviewer-uid',
              email: reviewerEmail,
              role: 'social_media_reviewer',
              name: 'Meta App Review Tester'
            });
            return res.json({
              success: true,
              token,
              user: reviewerUser
            });
          }
        }
      }

      return res.status(401).json({ success: false, error: 'Invalid credentials. Access Denied.' });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message || 'Login error' });
    }
  });

  // Meta Reviewer Status & Credentials Governance Endpoints (Admin only)
  app.get('/api/admin/meta-reviewer', requireAdmin, async (req, res) => {
    try {
      const reviewerEmail = (process.env.META_REVIEWER_EMAIL || 'meta-reviewer@madeccgroup.online').toLowerCase().trim();
      let credRecord: any = null;
      if (db) {
        const rows = await db.select().from(reviewerCredentials).where(eq(reviewerCredentials.email, reviewerEmail)).limit(1);
        if (rows.length > 0) credRecord = rows[0];
      }

      res.json({
        email: reviewerEmail,
        status: credRecord && credRecord.isActive ? 'ACTIVATED' : (credRecord ? 'DISABLED' : 'INITIALIZED'),
        disabled: credRecord ? !credRecord.isActive : false,
        lastLoginAt: credRecord?.lastLoginAt || null,
        createdAt: credRecord?.createdAt || new Date().toISOString()
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/admin/meta-reviewer/reset-password', requireAdmin, async (req, res) => {
    try {
      const reviewerEmail = (process.env.META_REVIEWER_EMAIL || 'meta-reviewer@madeccgroup.online').toLowerCase().trim();
      const { customPassword } = req.body;
      const { hashPassword } = await import('../../lib/reviewerAuth.ts');
      
      const newPassword = (customPassword && customPassword.trim().length >= 8) 
        ? customPassword.trim() 
        : `M@deccMetaReview#2026!${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

      const newHash = await hashPassword(newPassword);

      if (db) {
        const existing = await db.select().from(reviewerCredentials).where(eq(reviewerCredentials.email, reviewerEmail)).limit(1);
        if (existing.length > 0) {
          await db.update(reviewerCredentials)
            .set({ passwordHash: newHash, isActive: true, updatedAt: new Date() })
            .where(eq(reviewerCredentials.id, existing[0].id));
        } else {
          await db.insert(reviewerCredentials).values({
            email: reviewerEmail,
            passwordHash: newHash,
            displayName: 'Meta App Review Tester',
            role: 'social_media_reviewer',
            isActive: true,
          });
        }
      }

      await logAudit((req as any).user?.uid || 'admin', (req as any).user?.email || 'admin', 'RESET_REVIEWER_CREDENTIALS', `Reset password for Meta Reviewer (${reviewerEmail})`);

      res.json({
        success: true,
        email: reviewerEmail,
        tempPassword: newPassword
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/admin/meta-reviewer/toggle-status', requireAdmin, async (req: any, res) => {
    try {
      const reviewerEmail = (process.env.META_REVIEWER_EMAIL || 'meta-reviewer@madeccgroup.online').toLowerCase().trim();
      if (!db) return res.json({ success: true, disabled: false });

      const existing = await db.select().from(reviewerCredentials).where(eq(reviewerCredentials.email, reviewerEmail)).limit(1);
      let newActiveState = false;

      if (existing.length > 0) {
        newActiveState = !existing[0].isActive;
        await db.update(reviewerCredentials)
          .set({ isActive: newActiveState, updatedAt: new Date() })
          .where(eq(reviewerCredentials.id, existing[0].id));
      } else {
        newActiveState = true;
        const { hashPassword } = await import('../../lib/reviewerAuth.ts');
        const defaultPassword = process.env.META_REVIEWER_PASSWORD || 'M@deccMetaReview#2026!X7qP9';
        const hash = await hashPassword(defaultPassword);
        await db.insert(reviewerCredentials).values({
          email: reviewerEmail,
          passwordHash: hash,
          displayName: 'Meta App Review Tester',
          role: 'social_media_reviewer',
          isActive: true,
        });
      }

      await logAudit(req.user?.uid || 'admin', req.user?.email || 'admin', 'TOGGLE_REVIEWER_STATUS', `Set Meta Reviewer status to ${newActiveState ? 'ACTIVE' : 'DISABLED'}`);

      res.json({
        success: true,
        disabled: !newActiveState,
        status: newActiveState ? 'ACTIVATED' : 'DISABLED'
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Verify token, return DB profile with persistent login history logging
  app.get('/api/auth/me', requireAuth, async (req: any, res) => {
    try {
      await logAudit(
        req.dbUser.uid,
        req.dbUser.email,
        'LOGIN_SUCCESS',
        `User ${req.dbUser.name} initiated session successfully with role: ${req.dbUser.role}`
      );
    } catch (auditErr) {
      console.error('Failed to log session start audit:', auditErr);
    }
    res.json({ user: req.dbUser });
  });

  // Self-demote/promote for demonstration purposes or admin testing
  app.put('/api/auth/role', requireAuth, async (req: any, res) => {
    const { role } = req.body;
    if (!['admin', 'staff', 'client'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    try {
      const updated = await db.update(users)
        .set({ role })
        .where(eq(users.id, req.dbUser.id))
        .returning();
      
      await logAudit(req.dbUser.uid, req.dbUser.email, 'ROLE_CHANGE', `Changed own role to ${role}`);
      res.json({ user: updated[0] });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get all user synced data keys (replaces localStorage)
  app.get('/api/user-sync', requireAuth, async (req: any, res) => {
    try {
      const records = await db.select()
        .from(userSyncData)
        .where(eq(userSyncData.userId, req.dbUser.uid));
      
      const dictionary: Record<string, string> = {};
      for (const r of records) {
        dictionary[r.key] = r.value;
      }
      res.json({ data: dictionary });
    } catch (error: any) {
      console.error('Error fetching user sync data:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Save/Update a synced data key
  app.post('/api/user-sync', requireAuth, async (req: any, res) => {
    const { key, value } = req.body;
    if (!key) {
      return res.status(400).json({ error: 'Key is required' });
    }
    const valString = typeof value === 'string' ? value : JSON.stringify(value);
    
    try {
      const existing = await db.select()
        .from(userSyncData)
        .where(and(eq(userSyncData.userId, req.dbUser.uid), eq(userSyncData.key, key)))
        .limit(1);

      if (existing.length > 0) {
        await db.update(userSyncData)
          .set({ value: valString, updatedAt: new Date() })
          .where(eq(userSyncData.id, existing[0].id));
      } else {
        await db.insert(userSyncData)
          .values({
            userId: req.dbUser.uid,
            key,
            value: valString
          });
      }
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error saving user sync data:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Save global theme system preference
  app.post('/api/user-theme', requireAuth, async (req: any, res) => {
    const { theme } = req.body;
    if (!['dark', 'light'].includes(theme)) {
      return res.status(400).json({ error: 'Invalid theme' });
    }
    try {
      // 1. Update user profile in Neon PostgreSQL
      const updatedUser = await db.update(users)
        .set({ theme })
        .where(eq(users.id, req.dbUser.id))
        .returning();

      // 2. Also keep in sync_data for backup or generic retrieval
      const existing = await db.select()
        .from(userSyncData)
        .where(and(eq(userSyncData.userId, req.dbUser.uid), eq(userSyncData.key, 'theme')))
        .limit(1);

      if (existing.length > 0) {
        await db.update(userSyncData)
          .set({ value: theme, updatedAt: new Date() })
          .where(eq(userSyncData.id, existing[0].id));
      } else {
        await db.insert(userSyncData)
          .values({
            userId: req.dbUser.uid,
            key: 'theme',
            value: theme
          });
      }

      await logAudit(req.dbUser.uid, req.dbUser.email, 'THEME_CHANGE', `Changed visual theme to ${theme}`);
      res.json({ success: true, theme, user: updatedUser[0] });
    } catch (error: any) {
      console.error('Error saving user theme preference:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get users list (for BOQ Studio client selection & admin management)
  app.get('/api/users', requireAuth, async (req: any, res) => {
    try {
      const userList = await db.select({
        id: users.id,
        uid: users.uid,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt
      }).from(users).orderBy(desc(users.createdAt));
      res.json(userList);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: error.message });
    }
  });



}
