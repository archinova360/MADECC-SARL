import { eq } from 'drizzle-orm';
import { socialMediaChannels } from '../../db/schema.js';
import { decryptToken, encryptToken, getProviderCredentials } from '../socialOAuth.js';
import { getPlatformCapabilities } from '../socialOAuth.js';

export interface TokenValidationResult {
  valid: boolean;
  token: string | null;
  platform: string;
  channelId?: number;
  accountId?: string;
  accountHandle?: string;
  channelName?: string;
  expiresAt?: Date | null;
  isExpired?: boolean;
  requiresReauth?: boolean;
  reason?: string;
  errorCode?: string;
}

export interface ConnectionHealthSummary {
  channelId?: number;
  platform: string;
  channelName: string;
  status: string;
  healthStatus: string;
  requiresReauthorization: boolean;
  isExpired: boolean;
  daysUntilExpiry: number | null;
  tokenExpiresAt: string | null;
  lastCheckedAt: string | null;
  scopes: string[];
  capabilities: string[];
  issues: string[];
  actionRequired?: string;
}

export interface MaintenanceReport {
  processed: number;
  refreshed: number;
  expired: number;
  reauthRequired: number;
  errors: number;
  timestamp: string;
  details: Array<{
    platform: string;
    channelId: number;
    action: string;
    status: string;
    detail?: string;
  }>;
}

/**
 * Mutex lock to prevent concurrent token refresh races on the same channel
 */
const refreshLocks = new Map<number, Promise<any>>();

export class SocialTokenManager {
  /**
   * Retrieves and verifies a valid decrypted access token for a given channel or platform.
   * Seamlessly triggers a proactive refresh if the token is close to expiry (< 2 hours for OAuth tokens).
   */
  static async getValidConnectionToken(params: {
    connectionId?: number;
    platform?: string;
    db?: any;
    forceRefresh?: boolean;
  }): Promise<TokenValidationResult> {
    const { connectionId, platform, db, forceRefresh = false } = params;
    const targetPlatform = platform?.toLowerCase();

    if (!db) {
      // Offline fallback
      return {
        valid: false,
        token: null,
        platform: targetPlatform || 'unknown',
        requiresReauth: true,
        reason: 'Database unavailable to retrieve encrypted credentials.'
      };
    }

    try {
      let chan: any = null;
      if (connectionId) {
        const found = await db.select().from(socialMediaChannels).where(eq(socialMediaChannels.id, connectionId));
        if (found.length > 0) chan = found[0];
      } else if (targetPlatform) {
        const found = await db.select().from(socialMediaChannels).where(eq(socialMediaChannels.platform, targetPlatform));
        if (found.length > 0) chan = found[0];
      }

      if (!chan) {
        return {
          valid: false,
          token: null,
          platform: targetPlatform || 'unknown',
          requiresReauth: true,
          reason: `No connected account found for ${targetPlatform || 'channel ' + connectionId}.`,
          errorCode: `${(targetPlatform || 'CHANNEL').toUpperCase()}_NOT_CONNECTED`
        };
      }

      const chanPlatform = chan.platform?.toLowerCase();
      const channelId = chan.id;

      // Check if channel is already explicitly flagged as requiring re-authorization
      const meta = chan.metadata || {};
      if (chan.status === 'REAUTH_REQUIRED' || chan.status === 'TOKEN_EXPIRED' || meta.requiresReauthorization) {
        return {
          valid: false,
          token: null,
          platform: chanPlatform,
          channelId,
          accountId: chan.accountId || undefined,
          accountHandle: chan.accountHandle || undefined,
          channelName: chan.channelName,
          expiresAt: chan.tokenExpiresAt ? new Date(chan.tokenExpiresAt) : null,
          isExpired: true,
          requiresReauth: true,
          reason: chan.lastErrorMessage || 'OAuth access token expired or revoked. Re-authorization required in Connection Center.',
          errorCode: chan.lastErrorCode || `${chanPlatform.toUpperCase()}_ERR_190`
        };
      }

      // Decrypt stored access token
      let decryptedToken: string | null = null;
      if (chan.accessTokenEncrypted) {
        decryptedToken = decryptToken(chan.accessTokenEncrypted);
      } else if (chan.apiKeyOrToken && chan.apiKeyOrToken !== '[TOKEN_ENCRYPTED_SERVER_SIDE]') {
        decryptedToken = chan.apiKeyOrToken;
      }

      if (!decryptedToken || decryptedToken === '[TOKEN_ENCRYPTED_SERVER_SIDE]') {
        await this.markConnectionRequiresReauthorization(
          channelId,
          'No valid encrypted token payload present on server.',
          `${chanPlatform.toUpperCase()}_TOKEN_MISSING`,
          db
        );
        return {
          valid: false,
          token: null,
          platform: chanPlatform,
          channelId,
          accountId: chan.accountId || undefined,
          accountHandle: chan.accountHandle || undefined,
          channelName: chan.channelName,
          requiresReauth: true,
          reason: 'Access token missing or encrypted payload corrupted.',
          errorCode: `${chanPlatform.toUpperCase()}_TOKEN_MISSING`
        };
      }

      // Check expiration status
      const now = Date.now();
      const expiresAt = chan.tokenExpiresAt ? new Date(chan.tokenExpiresAt) : null;
      const isExpired = expiresAt ? expiresAt.getTime() <= now : false;
      const isNearExpiry = expiresAt ? (expiresAt.getTime() - now < 2 * 60 * 60 * 1000) : false; // < 2 hours

      // If token is expired or nearing expiry, attempt automatic refresh if refresh token exists
      if ((isExpired || isNearExpiry || forceRefresh) && chan.refreshTokenEncrypted) {
        console.log(`[TOKEN_MANAGER] Attempting proactive token refresh for ${chanPlatform} (channel ${channelId})...`);
        const refreshOutcome = await this.refreshTokenIfNeeded(chan, db);
        if (refreshOutcome.refreshed && refreshOutcome.token) {
          return {
            valid: true,
            token: refreshOutcome.token,
            platform: chanPlatform,
            channelId,
            accountId: chan.accountId || undefined,
            accountHandle: chan.accountHandle || undefined,
            channelName: chan.channelName,
            expiresAt: refreshOutcome.expiresAt || null,
            isExpired: false,
            requiresReauth: false
          };
        } else if (isExpired && !refreshOutcome.refreshed) {
          // Token is strictly expired and refresh failed
          await this.markConnectionRequiresReauthorization(
            channelId,
            refreshOutcome.error || 'Token refresh failed and access token is expired.',
            `${chanPlatform.toUpperCase()}_ERR_190`,
            db
          );
          return {
            valid: false,
            token: null,
            platform: chanPlatform,
            channelId,
            accountId: chan.accountId || undefined,
            accountHandle: chan.accountHandle || undefined,
            channelName: chan.channelName,
            expiresAt,
            isExpired: true,
            requiresReauth: true,
            reason: refreshOutcome.error || 'Access token has expired and could not be refreshed. Please re-authorize.',
            errorCode: `${chanPlatform.toUpperCase()}_ERR_190`
          };
        }
      }

      // For Meta / Facebook: if marked expired without refresh token
      if (isExpired && !chan.refreshTokenEncrypted) {
        await this.markConnectionRequiresReauthorization(
          channelId,
          'Meta long-lived access token has expired. User re-authorization is required.',
          'FB_ERR_190',
          db
        );
        return {
          valid: false,
          token: null,
          platform: chanPlatform,
          channelId,
          accountId: chan.accountId || undefined,
          accountHandle: chan.accountHandle || undefined,
          channelName: chan.channelName,
          expiresAt,
          isExpired: true,
          requiresReauth: true,
          reason: 'The OAuth access token for Facebook has expired or was revoked. Re-authorization is required.',
          errorCode: 'FB_ERR_190'
        };
      }

      return {
        valid: true,
        token: decryptedToken,
        platform: chanPlatform,
        channelId,
        accountId: chan.accountId || undefined,
        accountHandle: chan.accountHandle || undefined,
        channelName: chan.channelName,
        expiresAt,
        isExpired: false,
        requiresReauth: false
      };
    } catch (err: any) {
      console.error('[TOKEN_MANAGER_GET_ERROR]', err?.message || err);
      return {
        valid: false,
        token: null,
        platform: targetPlatform || 'unknown',
        requiresReauth: true,
        reason: `Internal token manager error: ${err?.message || 'Unknown error'}`
      };
    }
  }

  /**
   * Helper method matching `ensureValidToken`
   */
  static async ensureValidToken(
    platformOrId: string | number,
    db?: any
  ): Promise<TokenValidationResult> {
    if (typeof platformOrId === 'number') {
      return this.getValidConnectionToken({ connectionId: platformOrId, db });
    }
    return this.getValidConnectionToken({ platform: String(platformOrId), db });
  }

  /**
   * Refreshes a channel's access token using the provider's official OAuth token endpoint.
   * Safely acquires a lock to prevent concurrent duplicate refresh requests.
   */
  static async refreshTokenIfNeeded(
    channel: any,
    db: any
  ): Promise<{ refreshed: boolean; token: string | null; expiresAt?: Date | null; error?: string }> {
    const channelId = channel.id;
    const platform = channel.platform?.toLowerCase();

    // Check mutex lock
    if (refreshLocks.has(channelId)) {
      try {
        return await refreshLocks.get(channelId);
      } catch (lockErr: any) {
        return { refreshed: false, token: null, error: lockErr?.message };
      }
    }

    const refreshPromise = (async () => {
      try {
        if (!channel.refreshTokenEncrypted) {
          return { refreshed: false, token: null, error: 'No refresh token stored for this channel.' };
        }

        const rawRefreshToken = decryptToken(channel.refreshTokenEncrypted);
        if (!rawRefreshToken) {
          return { refreshed: false, token: null, error: 'Could not decrypt refresh token.' };
        }

        const creds = getProviderCredentials(platform);
        let newAccessToken: string | null = null;
        let newRefreshToken: string | null = rawRefreshToken;
        let expiresAt: Date | null = null;

        // 1. YouTube (Google OAuth 2.0)
        if (platform === 'youtube') {
          if (!creds.clientId || !creds.clientSecret) {
            return { refreshed: false, token: null, error: 'Missing YouTube OAuth Client ID or Secret.' };
          }
          const res = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              client_id: creds.clientId,
              client_secret: creds.clientSecret,
              refresh_token: rawRefreshToken,
              grant_type: 'refresh_token'
            })
          });
          const data = await res.json();
          if (data.error) {
            return { refreshed: false, token: null, error: `Google OAuth Error: ${data.error_description || data.error}` };
          }
          if (data.access_token) {
            newAccessToken = data.access_token;
            if (data.refresh_token) newRefreshToken = data.refresh_token;
            if (data.expires_in) expiresAt = new Date(Date.now() + data.expires_in * 1000);
          }
        }
        // 2. Facebook / Instagram / Meta exchange token
        else if (platform === 'facebook' || platform === 'instagram' || platform === 'whatsapp') {
          if (!creds.clientId || !creds.clientSecret) {
            return { refreshed: false, token: null, error: 'Missing Meta App ID or Secret.' };
          }
          const res = await fetch(
            `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${creds.clientId}&client_secret=${creds.clientSecret}&fb_exchange_token=${encodeURIComponent(rawRefreshToken)}`
          );
          const data = await res.json();
          if (data.error) {
            return { refreshed: false, token: null, error: `Meta OAuth Error: ${data.error.message || 'Exchange failed'}` };
          }
          if (data.access_token) {
            newAccessToken = data.access_token;
            if (data.expires_in) expiresAt = new Date(Date.now() + data.expires_in * 1000);
          }
        }
        // 3. TikTok
        else if (platform === 'tiktok') {
          if (!creds.clientId || !creds.clientSecret) {
            return { refreshed: false, token: null, error: 'Missing TikTok Client Key or Secret.' };
          }
          const res = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              client_key: creds.clientId,
              client_secret: creds.clientSecret,
              grant_type: 'refresh_token',
              refresh_token: rawRefreshToken
            })
          });
          const data = await res.json();
          if (data.error && data.error.code !== 'ok') {
            return { refreshed: false, token: null, error: `TikTok OAuth Error: ${data.error.message || 'Refresh failed'}` };
          }
          if (data.data?.access_token) {
            newAccessToken = data.data.access_token;
            if (data.data.refresh_token) newRefreshToken = data.data.refresh_token;
            if (data.data.expires_in) expiresAt = new Date(Date.now() + data.data.expires_in * 1000);
          }
        }
        // 4. LinkedIn
        else if (platform === 'linkedin') {
          if (!creds.clientId || !creds.clientSecret) {
            return { refreshed: false, token: null, error: 'Missing LinkedIn Client ID or Secret.' };
          }
          const res = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              grant_type: 'refresh_token',
              refresh_token: rawRefreshToken,
              client_id: creds.clientId,
              client_secret: creds.clientSecret
            })
          });
          const data = await res.json();
          if (data.error) {
            return { refreshed: false, token: null, error: `LinkedIn OAuth Error: ${data.error_description || data.error}` };
          }
          if (data.access_token) {
            newAccessToken = data.access_token;
            if (data.refresh_token) newRefreshToken = data.refresh_token;
            if (data.expires_in) expiresAt = new Date(Date.now() + data.expires_in * 1000);
          }
        }
        // 5. Twitter / X (PKCE OAuth 2.0)
        else if (platform === 'twitter' || platform === 'x') {
          if (!creds.clientId) {
            return { refreshed: false, token: null, error: 'Missing Twitter/X Client ID.' };
          }
          const headers: Record<string, string> = { 'Content-Type': 'application/x-www-form-urlencoded' };
          if (creds.clientSecret) {
            const basicAuth = Buffer.from(`${creds.clientId}:${creds.clientSecret}`).toString('base64');
            headers['Authorization'] = `Basic ${basicAuth}`;
          }
          const res = await fetch('https://api.twitter.com/2/oauth2/token', {
            method: 'POST',
            headers,
            body: new URLSearchParams({
              grant_type: 'refresh_token',
              refresh_token: rawRefreshToken,
              client_id: creds.clientId
            })
          });
          const data = await res.json();
          if (data.error) {
            return { refreshed: false, token: null, error: `Twitter OAuth Error: ${data.error_description || data.error}` };
          }
          if (data.access_token) {
            newAccessToken = data.access_token;
            if (data.refresh_token) newRefreshToken = data.refresh_token;
            if (data.expires_in) expiresAt = new Date(Date.now() + data.expires_in * 1000);
          }
        }

        if (!newAccessToken) {
          return { refreshed: false, token: null, error: 'Provider returned empty access token upon refresh.' };
        }

        // Encrypt and persist new tokens in DB
        const encAccess = encryptToken(newAccessToken);
        const encRefresh = newRefreshToken ? encryptToken(newRefreshToken) : channel.refreshTokenEncrypted;

        await this.updateConnectionTokens(
          channelId,
          {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken || undefined,
            expiresAt,
            metadata: {
              ...channel.metadata,
              lastRefreshedAt: new Date().toISOString(),
              requiresReauthorization: false
            }
          },
          db
        );

        console.log(`[TOKEN_MANAGER] Successfully refreshed and encrypted access token for ${platform} (channel ${channelId}).`);
        return { refreshed: true, token: newAccessToken, expiresAt };
      } catch (err: any) {
        console.error(`[TOKEN_MANAGER_REFRESH_FATAL] ${platform}:`, err?.message || err);
        return { refreshed: false, token: null, error: err?.message || 'Token refresh failed.' };
      }
    })();

    refreshLocks.set(channelId, refreshPromise);
    try {
      return await refreshPromise;
    } finally {
      refreshLocks.delete(channelId);
    }
  }

  /**
   * Safely updates encrypted credentials and metadata for a connection
   */
  static async updateConnectionTokens(
    channelId: number,
    tokenData: {
      accessToken?: string;
      refreshToken?: string;
      expiresAt?: Date | null;
      metadata?: any;
    },
    db: any
  ): Promise<void> {
    if (!db || !channelId) return;

    try {
      const updates: any = {
        updatedAt: new Date(),
        lastSuccessfulApiCheck: new Date(),
        status: 'CONNECTED',
        healthStatus: 'HEALTHY',
        lastErrorCode: null,
        lastErrorMessage: null
      };

      if (tokenData.accessToken) {
        updates.accessTokenEncrypted = encryptToken(tokenData.accessToken);
        updates.apiKeyOrToken = '[TOKEN_ENCRYPTED_SERVER_SIDE]';
      }
      if (tokenData.refreshToken) {
        updates.refreshTokenEncrypted = encryptToken(tokenData.refreshToken);
      }
      if (tokenData.expiresAt !== undefined) {
        updates.tokenExpiresAt = tokenData.expiresAt;
      }
      if (tokenData.metadata) {
        updates.metadata = tokenData.metadata;
      }

      await db.update(socialMediaChannels).set(updates).where(eq(socialMediaChannels.id, channelId));
    } catch (err: any) {
      console.error('[TOKEN_MANAGER_UPDATE_ERROR]', err?.message || err);
    }
  }

  /**
   * Marks a connection as requiring explicit reauthorization by the user.
   * Safely updates database status, error codes, and health flags.
   */
  static async markConnectionRequiresReauthorization(
    channelId: number,
    reason: string,
    errorCode: string = 'AUTH_EXPIRED',
    db: any
  ): Promise<void> {
    if (!db || !channelId) return;

    try {
      const existing = await db.select().from(socialMediaChannels).where(eq(socialMediaChannels.id, channelId));
      const current = existing[0] || {};
      const updatedMetadata = {
        ...(current.metadata || {}),
        requiresReauthorization: true,
        reauthorizationReason: reason,
        reauthorizationFlaggedAt: new Date().toISOString()
      };

      await db
        .update(socialMediaChannels)
        .set({
          status: 'REAUTH_REQUIRED',
          healthStatus: 'EXPIRED',
          lastErrorCode: errorCode,
          lastErrorMessage: reason,
          metadata: updatedMetadata,
          updatedAt: new Date()
        })
        .where(eq(socialMediaChannels.id, channelId));

      console.warn(`[TOKEN_MANAGER] Channel ${channelId} (${current.platform || 'unknown'}) marked REAUTH_REQUIRED: ${errorCode} - ${reason}`);
    } catch (err: any) {
      console.error('[TOKEN_MANAGER_MARK_REAUTH_ERROR]', err?.message || err);
    }
  }

  /**
   * Returns a detailed health assessment for a single connection or platform
   */
  static async runConnectionDiagnostics(
    channelIdOrPlatform: number | string,
    db: any
  ): Promise<ConnectionHealthSummary> {
    const isNum = typeof channelIdOrPlatform === 'number' || !isNaN(parseInt(String(channelIdOrPlatform), 10));
    let chan: any = null;

    if (db) {
      try {
        if (isNum) {
          const numId = typeof channelIdOrPlatform === 'number' ? channelIdOrPlatform : parseInt(String(channelIdOrPlatform), 10);
          const found = await db.select().from(socialMediaChannels).where(eq(socialMediaChannels.id, numId));
          if (found.length > 0) chan = found[0];
        } else {
          const found = await db.select().from(socialMediaChannels).where(eq(socialMediaChannels.platform, String(channelIdOrPlatform).toLowerCase()));
          if (found.length > 0) chan = found[0];
        }
      } catch (dbErr) {
        console.warn('[DIAGNOSTICS_DB_WARN]', dbErr);
      }
    }

    const platform = chan?.platform?.toLowerCase() || (typeof channelIdOrPlatform === 'string' ? channelIdOrPlatform.toLowerCase() : 'unknown');
    const capabilities = getPlatformCapabilities(platform);

    if (!chan) {
      return {
        platform,
        channelName: `MADECC ${platform.toUpperCase()}`,
        status: 'NOT_CONNECTED',
        healthStatus: 'ERROR',
        requiresReauthorization: true,
        isExpired: true,
        daysUntilExpiry: null,
        tokenExpiresAt: null,
        lastCheckedAt: new Date().toISOString(),
        scopes: [],
        capabilities,
        issues: [`No connected channel found for ${platform}.`],
        actionRequired: `Authorize ${platform} in Social Account Connection Center.`
      };
    }

    const now = Date.now();
    const tokenExpiresAt = chan.tokenExpiresAt ? new Date(chan.tokenExpiresAt) : null;
    const daysUntilExpiry = tokenExpiresAt ? Math.round((tokenExpiresAt.getTime() - now) / (1000 * 60 * 60 * 24)) : null;
    const isExpired = tokenExpiresAt ? tokenExpiresAt.getTime() <= now : false;
    const meta = chan.metadata || {};
    const requiresReauth = chan.status === 'REAUTH_REQUIRED' || chan.status === 'TOKEN_EXPIRED' || Boolean(meta.requiresReauthorization) || isExpired;

    const issues: string[] = [];
    if (requiresReauth) {
      issues.push(chan.lastErrorMessage || `OAuth access token for ${platform} is expired or requires re-authorization.`);
    }
    if (chan.lastErrorCode) {
      issues.push(`Last provider code: ${chan.lastErrorCode}`);
    }

    let actionRequired: string | undefined;
    if (requiresReauth) {
      actionRequired = `Click "Re-authorize ${platform.toUpperCase()}" in Social Account Connection Center to grant fresh OAuth permissions.`;
    }

    return {
      channelId: chan.id,
      platform,
      channelName: chan.channelName || `MADECC ${platform.toUpperCase()}`,
      status: chan.status,
      healthStatus: chan.healthStatus || (requiresReauth ? 'EXPIRED' : 'HEALTHY'),
      requiresReauthorization: requiresReauth,
      isExpired,
      daysUntilExpiry,
      tokenExpiresAt: tokenExpiresAt ? tokenExpiresAt.toISOString() : null,
      lastCheckedAt: chan.lastSuccessfulApiCheck ? new Date(chan.lastSuccessfulApiCheck).toISOString() : new Date().toISOString(),
      scopes: Array.isArray(chan.scopes) ? chan.scopes : [],
      capabilities,
      issues,
      actionRequired
    };
  }

  /**
   * Runs proactive background token maintenance across all connected channels
   */
  static async runProactiveTokenMaintenance(db: any): Promise<MaintenanceReport> {
    const report: MaintenanceReport = {
      processed: 0,
      refreshed: 0,
      expired: 0,
      reauthRequired: 0,
      errors: 0,
      timestamp: new Date().toISOString(),
      details: []
    };

    if (!db) return report;

    try {
      const channels = await db.select().from(socialMediaChannels);
      report.processed = channels.length;

      for (const chan of channels) {
        const platform = chan.platform?.toLowerCase();
        const channelId = chan.id;

        if (chan.isCustom) continue;

        const now = Date.now();
        const expiresAt = chan.tokenExpiresAt ? new Date(chan.tokenExpiresAt) : null;
        const isExpired = expiresAt ? expiresAt.getTime() <= now : false;
        const isNearExpiry = expiresAt ? (expiresAt.getTime() - now < 24 * 60 * 60 * 1000) : false; // < 24h

        if (chan.refreshTokenEncrypted && (isExpired || isNearExpiry)) {
          const outcome = await this.refreshTokenIfNeeded(chan, db);
          if (outcome.refreshed) {
            report.refreshed++;
            report.details.push({
              platform,
              channelId,
              action: 'REFRESH_SUCCESS',
              status: 'HEALTHY',
              detail: `Token refreshed; new expiry: ${outcome.expiresAt?.toISOString() || 'Extended'}`
            });
          } else {
            report.reauthRequired++;
            report.details.push({
              platform,
              channelId,
              action: 'REFRESH_FAILED',
              status: 'REAUTH_REQUIRED',
              detail: outcome.error
            });
          }
        } else if (isExpired && !chan.refreshTokenEncrypted) {
          await this.markConnectionRequiresReauthorization(
            channelId,
            'Token expired and cannot be refreshed automatically. Re-authorization required.',
            `${platform.toUpperCase()}_ERR_190`,
            db
          );
          report.expired++;
          report.reauthRequired++;
          report.details.push({
            platform,
            channelId,
            action: 'MARKED_EXPIRED',
            status: 'REAUTH_REQUIRED',
            detail: 'Non-refreshable token expired.'
          });
        } else {
          report.details.push({
            platform,
            channelId,
            action: 'MAINTAINED',
            status: chan.healthStatus || 'HEALTHY',
            detail: expiresAt ? `Expires in ${Math.round((expiresAt.getTime() - now) / 86400000)} days` : 'Permanent / Healthy'
          });
        }
      }
    } catch (err: any) {
      console.error('[PROACTIVE_MAINTENANCE_ERROR]', err?.message || err);
      report.errors++;
    }

    return report;
  }
}

// Export singleton convenience functions
export const getValidConnectionToken = SocialTokenManager.getValidConnectionToken.bind(SocialTokenManager);
export const ensureValidToken = SocialTokenManager.ensureValidToken.bind(SocialTokenManager);
export const refreshTokenIfNeeded = SocialTokenManager.refreshTokenIfNeeded.bind(SocialTokenManager);
export const markConnectionRequiresReauthorization = SocialTokenManager.markConnectionRequiresReauthorization.bind(SocialTokenManager);
export const updateConnectionTokens = SocialTokenManager.updateConnectionTokens.bind(SocialTokenManager);
export const runConnectionDiagnostics = SocialTokenManager.runConnectionDiagnostics.bind(SocialTokenManager);
export const runProactiveTokenMaintenance = SocialTokenManager.runProactiveTokenMaintenance.bind(SocialTokenManager);
