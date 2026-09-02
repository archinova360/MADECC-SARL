import express from 'express';
import { db } from '../../db/index.ts';
import { 
  categories, services, projects, projectProgress, blogPosts, galleryItems, heroBanners, 
  faqCategories, faqs, sustainabilityContent, sustainabilityInitiatives, socialImpactProjects, 
  impactMetrics, pageContents, pageContentRevisions, siteSettings, mediaLibrary, cmsActivityLogs, cmsContentRevisions 
} from '../../db/schema.ts';
import { eq, desc, and, sql, or } from 'drizzle-orm';
import { requireAuth, requireAdmin, requireStaffOrAdmin } from '../../middleware/auth.ts';
import { logAudit } from '../../lib/audit.ts';
import { deleteFileFromCloud } from '../storageService.js';
import { seedDatabase } from '../../db/seed.ts';

  async function ensureFaqDefaults() {
    const existingCats = await db.select().from(faqCategories);
    if (existingCats.length === 0) {
      const insertedCats = await db.insert(faqCategories).values([
        { name: 'General Enquiries', slug: 'general', description: 'General company questions and information', displayOrder: 1 },
        { name: 'Request a Quote & BOQ', slug: 'quote-boq', description: 'Estimations, BOQs and quote request processes', displayOrder: 2 },
        { name: 'Engineering & Construction', slug: 'engineering', description: 'Structural calculations, site supervision and standards', displayOrder: 3 },
        { name: 'Suppliers & Procurement', slug: 'procurement', description: 'Vendor registration, materials and subcontracts', displayOrder: 4 }
      ]).returning();

      const catGeneral = insertedCats.find(c => c.slug === 'general')?.id || insertedCats[0]?.id;
      const catQuote = insertedCats.find(c => c.slug === 'quote-boq')?.id || insertedCats[0]?.id;

      await db.insert(faqs).values([
        {
          question: 'How do I request a formal quotation or BOQ for my project?',
          answer: 'You can submit your project drawings, site location, and requirements via our online Request a Quote portal or email procurement@madeccgroup.com. Our Quantity Surveying team will review and provide a detailed BOQ within 48 hours.',
          categoryId: catQuote,
          categoryName: 'Request a Quote & BOQ',
          tags: ['quote', 'boq', 'estimation'],
          featured: true,
          status: 'PUBLISHED',
          displayOrder: 1
        },
        {
          question: 'What regions in Cameroon and Central Africa does MADECC operate in?',
          answer: 'MADECC covers projects across all 10 regions of Cameroon (Douala, Yaounde, Kribi, Bafoussam, Bamenda, Garoua, etc.) and selected Central African regional hubs (CEMAC region).',
          categoryId: catGeneral,
          categoryName: 'General Enquiries',
          tags: ['location', 'regions', 'coverage'],
          featured: true,
          status: 'PUBLISHED',
          displayOrder: 2
        }
      ]);
    }
  }


  async function ensureSustainabilityDefaults() {
    const existingContent = await db.select().from(sustainabilityContent);
    if (existingContent.length === 0) {
      await db.insert(sustainabilityContent).values({
        title: 'Sustainability & Social Impact Policy',
        heroSubtitle: 'Building Green. Empowering Local Communities. Safeguarding Health & Safety.',
        introduction: 'MADECC Construction & Engineering is committed to sustainable building practices, zero-incident safety protocols, and long-term socio-economic value creation across Central Africa.',
        environmentalPolicy: 'We enforce strict waste recycling, low-carbon cement optimization, digital BIM material takeoff accuracy, and solar integration across site operations.',
        safetyPolicy: 'Our HSE mandate enforces daily toolbox talks, 100% PPE compliance, and zero tolerance for unsafe working conditions.',
        localEconomicCommitment: 'Over 85% of our site workforce and material suppliers are sourced directly from regional Cameroonian businesses.'
      });
    }

    const existingInits = await db.select().from(sustainabilityInitiatives);
    if (existingInits.length === 0) {
      await db.insert(sustainabilityInitiatives).values([
        {
          title: 'Eco-Concrete & Low Carbon Aggregate Formulations',
          category: 'Sustainable Construction',
          description: 'Implementation of pozzolanic industrial byproduct blends to cut embedded CO2 emissions by up to 30% in structural concrete elements.',
          impactSummary: '30% Reduction in Carbon Intensity',
          status: 'PUBLISHED',
          displayOrder: 1
        },
        {
          title: 'Solar Photovoltaic Site Operations & Power Grid Backup',
          category: 'Resource Efficiency',
          description: 'Integrating portable solar PV hybrid generators across remote construction sites in Cameroon to eliminate diesel generator idle time.',
          impactSummary: '65% Fuel Reduction at Remote Sites',
          status: 'PUBLISHED',
          displayOrder: 2
        }
      ]);
    }

    const existingSocial = await db.select().from(socialImpactProjects);
    if (existingSocial.length === 0) {
      await db.insert(socialImpactProjects).values([
        {
          title: 'Douala Youth Masonry & Steel Fixing Skills Academy',
          category: 'Technical Training',
          location: 'Douala, Littoral Region',
          dateCompleted: 'Ongoing 2025-2026',
          description: 'Free certified vocational apprenticeship program for young men and women in structural concrete, rebar bending, and site safety management.',
          impactMetricsText: '150 Youth Trained; 80% Employed on MADECC Projects',
          status: 'PUBLISHED',
          displayOrder: 1
        }
      ]);
    }

    const existingMetrics = await db.select().from(impactMetrics);
    if (existingMetrics.length === 0) {
      await db.insert(impactMetrics).values([
        { label: 'Local Workforce Engagement', value: '85%', category: 'Social Impact', icon: 'Users', displayOrder: 1, status: 'PUBLISHED' },
        { label: 'HSE Zero Major Incidents', value: '1,200+ Days', category: 'Health & Safety', icon: 'ShieldCheck', displayOrder: 2, status: 'PUBLISHED' },
        { label: 'Local Suppliers Supported', value: '120+', category: 'Economy', icon: 'Building2', displayOrder: 3, status: 'PUBLISHED' }
      ]);
    }
  }


  async function ensureHeroBannersDefaults() {
    try {
      const existing = await db.select().from(heroBanners);
      if (existing.length === 0) {
        await db.insert(heroBanners).values([
          {
            title: 'Premier Infrastructure & Civil Engineering in Central Africa',
            subtitle: 'Engineering durable commercial towers, road networks, and state-of-the-art industrial facilities built to international safety and Eurocode standards.',
            imageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=1920&q=85',
            videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
            displayOrder: 1,
            active: true
          },
          {
            title: 'Precision Structural Concrete & Modern Architecture',
            subtitle: 'Turnkey residential and commercial high-rises engineered with certified soil testing and rigorous quality compliance.',
            imageUrl: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1920&q=85',
            videoUrl: 'https://cdn.jsdelivr.net/npm/video-media-samples@1.0.0/big-buck-bunny-480p-30sec.mp4',
            displayOrder: 2,
            active: true
          },
          {
            title: 'Highways, Bridges & Heavy Earthworks',
            subtitle: 'Rapid mobilization and precision execution across Cameroon road corridors and logistics hubs.',
            imageUrl: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=1920&q=85',
            videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
            displayOrder: 3,
            active: true
          }
        ]);
      }
    } catch (e) {
      console.error('[DB Fallback] ensureHeroBannersDefaults error:', e);
    }
  }

export function setupCmsRoutes(app: express.Express) {
  // --- CATEGORIES ENDPOINTS ---
  // ==========================================
  app.get('/api/categories', async (req, res) => {
    try {
      const allCategories = await db.select().from(categories);
      res.json(allCategories);
    } catch (error: any) {
      console.warn('[DB Fallback] /api/categories:', error.message || error);
      res.json([
        { id: 1, name: 'Residential Construction', slug: 'residential' },
        { id: 2, name: 'Commercial Development', slug: 'commercial' },
        { id: 3, name: 'Infrastructure & Civil', slug: 'infrastructure' },
        { id: 4, name: 'Industrial & Warehouses', slug: 'industrial' }
      ]);
    }
  });

  app.post('/api/categories', requireAdmin, async (req: any, res) => {
    const { name, slug } = req.body;
    if (!name || !slug) return res.status(400).json({ error: 'Missing name or slug' });
    try {
      const result = await db.insert(categories).values({ name, slug }).returning();
      await logAudit(req.dbUser.uid, req.dbUser.email, 'CREATE_CATEGORY', `Created category ${name}`);
      res.json(result[0]);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });


  // ==========================================
  // --- SERVICES CMS ENDPOINTS ---
  // ==========================================
  app.get('/api/services', async (req, res) => {
    try {
      const { admin } = req.query;
      let allServices = await db.select().from(services);

      // If public caller, return PUBLISHED services or fallback
      if (!admin || admin !== 'true') {
        const publishedOnly = allServices.filter(s => s.status === 'PUBLISHED');
        if (publishedOnly.length > 0) {
          return res.json(publishedOnly);
        }
      }
      res.json(allServices);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/services/:idOrSlug', async (req, res) => {
    try {
      const param = req.params.idOrSlug;
      const isNum = !isNaN(Number(param));

      let record;
      if (isNum) {
        const records = await db.select().from(services).where(eq(services.id, Number(param)));
        record = records[0];
      } else {
        const records = await db.select().from(services).where(eq(services.slug, param));
        record = records[0];
      }

      if (!record) {
        return res.status(404).json({ error: 'Service record not found.' });
      }
      res.json(record);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/services', requireAdmin, async (req: any, res) => {
    const b = req.body;
    if (!b.name) {
      return res.status(400).json({ error: 'Missing required service name' });
    }
    try {
      const result = await db.insert(services).values({
        slug: b.slug || b.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        name: b.name,
        serviceCode: b.serviceCode || `MD-SRV-${Date.now()}`,
        shortDescription: b.shortDescription || b.description || '',
        description: b.description || b.shortDescription || b.name,
        fullDescription: b.fullDescription || '',
        category: b.category || 'Construction & Execution',
        status: b.status || 'DRAFT',
        featured: Boolean(b.featured),
        displayOrder: b.displayOrder ? Number(b.displayOrder) : 1,
        priceRange: b.priceRange || null,
        icon: b.icon || 'Building2',
        coverImage: b.coverImage || null,
        gallery: b.gallery || [],
        supportingDocuments: b.supportingDocuments || [],
        seoTitle: b.seoTitle || null,
        metaDescription: b.metaDescription || null,
        keywords: b.keywords || null,
        canonicalSlug: b.canonicalSlug || null,
        socialTitle: b.socialTitle || null,
        socialDescription: b.socialDescription || null,
        socialImage: b.socialImage || null,
        overview: b.overview || null,
        whatWeDeliver: b.whatWeDeliver || [],
        deliverables: b.deliverables || [],
        processSteps: b.processSteps || [],
        typicalProjects: b.typicalProjects || [],
        industriesServed: b.industriesServed || [],
        faqs: b.faqs || [],
        relatedProjects: b.relatedProjects || [],
        relatedInsights: b.relatedInsights || [],
        sections: b.sections || [],
        ctaText: b.ctaText || 'Request a Quote',
        ctaDestination: b.ctaDestination || 'request-a-quote',
        details: b.details || null,
        updatedAt: new Date()
      }).returning();
      
      await logAudit(req.dbUser.uid, req.dbUser.email, 'CREATE_SERVICE', `Created service ${b.name}`);
      res.status(201).json(result[0]);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/services/:id', requireAdmin, async (req: any, res) => {
    const serviceId = parseInt(req.params.id);
    const b = req.body;
    try {
      const result = await db.update(services)
        .set({
          slug: b.slug,
          name: b.name,
          serviceCode: b.serviceCode,
          shortDescription: b.shortDescription,
          description: b.description || b.shortDescription || b.name,
          fullDescription: b.fullDescription,
          category: b.category,
          status: b.status,
          featured: Boolean(b.featured),
          displayOrder: b.displayOrder ? Number(b.displayOrder) : 1,
          priceRange: b.priceRange,
          icon: b.icon,
          coverImage: b.coverImage,
          gallery: b.gallery,
          supportingDocuments: b.supportingDocuments,
          seoTitle: b.seoTitle,
          metaDescription: b.metaDescription,
          keywords: b.keywords,
          canonicalSlug: b.canonicalSlug,
          socialTitle: b.socialTitle,
          socialDescription: b.socialDescription,
          socialImage: b.socialImage,
          overview: b.overview,
          whatWeDeliver: b.whatWeDeliver,
          deliverables: b.deliverables,
          processSteps: b.processSteps,
          typicalProjects: b.typicalProjects,
          industriesServed: b.industriesServed,
          faqs: b.faqs,
          relatedProjects: b.relatedProjects,
          relatedInsights: b.relatedInsights,
          sections: b.sections,
          ctaText: b.ctaText,
          ctaDestination: b.ctaDestination,
          details: b.details,
          updatedAt: new Date()
        })
        .where(eq(services.id, serviceId))
        .returning();
      
      await logAudit(req.dbUser.uid, req.dbUser.email, 'UPDATE_SERVICE', `Updated service ${b.name} (ID: ${serviceId})`);
      res.json(result[0]);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/services/:id', requireAdmin, async (req: any, res) => {
    const serviceId = parseInt(req.params.id);
    try {
      const deleted = await db.delete(services).where(eq(services.id, serviceId)).returning();
      await logAudit(req.dbUser.uid, req.dbUser.email, 'DELETE_SERVICE', `Deleted service ID: ${serviceId}`);
      res.json(deleted[0]);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });


  // ==========================================
  // --- PROJECTS & PROGRESS ENDPOINTS ---
  // ==========================================
  app.get('/api/projects', async (req, res) => {
    const { categoryId } = req.query;
    try {
      let query = db.select().from(projects);
      if (categoryId) {
        // Filter by category
        const catId = parseInt(categoryId as string);
        const filtered = await db.select().from(projects).where(eq(projects.categoryId, catId)).orderBy(desc(projects.createdAt));
        return res.json(filtered);
      }
      const allProjects = await query.orderBy(desc(projects.createdAt));
      res.json(allProjects);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/projects/:id', async (req, res) => {
    const projId = parseInt(req.params.id);
    try {
      const proj = await db.select().from(projects).where(eq(projects.id, projId)).limit(1);
      if (proj.length === 0) return res.status(404).json({ error: 'Project not found' });

      const progressList = await db.select().from(projectProgress).where(eq(projectProgress.projectId, projId)).orderBy(projectProgress.id);
      
      res.json({
        ...proj[0],
        progress: progressList,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/projects', requireAdmin, async (req: any, res) => {
    let { title, description, budget, location, startDate, endDate, status, categoryId, image, videoUrl } = req.body;
    if (!title || !description || !location) {
      return res.status(400).json({ error: 'Missing required project fields (title, description, location)' });
    }
    const finalImage = (image && image.trim()) ? image.trim() : (videoUrl || 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=1200');
    try {
      const result = await db.insert(projects).values({
        title,
        description,
        budget,
        location,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        status: status || 'planning',
        categoryId: categoryId ? parseInt(categoryId) : null,
        image: finalImage,
        videoUrl: videoUrl || null,
      }).returning();

      // Seed standard starting progress milestones for new project
      await db.insert(projectProgress).values([
        { projectId: result[0].id, milestoneName: 'Initial Consultation', percentage: 100, status: 'completed', description: 'Met with client to outline project blueprints and scope.' },
        { projectId: result[0].id, milestoneName: 'Site Planning & Surveying', percentage: 0, status: 'pending', description: 'Obtaining council permits and running soil resilience testing.' }
      ]);

      await logAudit(req.dbUser.uid, req.dbUser.email, 'CREATE_PROJECT', `Created project: ${title}`);
      res.json(result[0]);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/projects/:id', requireAdmin, async (req: any, res) => {
    const projId = parseInt(req.params.id);
    let { title, description, budget, location, startDate, endDate, status, categoryId, image, videoUrl } = req.body;
    const finalImage = (image && image.trim()) ? image.trim() : (videoUrl || 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=1200');
    try {
      // Fetch existing record to perform asset replacement check
      const existing = await db.select().from(projects).where(eq(projects.id, projId)).limit(1);
      if (existing.length > 0) {
        if (finalImage && finalImage !== existing[0].image) {
          await deleteFileFromCloud(existing[0].image);
        }
        if (videoUrl !== undefined && videoUrl !== existing[0].videoUrl) {
          await deleteFileFromCloud(existing[0].videoUrl);
        }
      }

      const result = await db.update(projects)
        .set({
          title,
          description,
          budget,
          location,
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
          status,
          categoryId: categoryId ? parseInt(categoryId) : null,
          image: finalImage,
          videoUrl: videoUrl || null,
        })
        .where(eq(projects.id, projId))
        .returning();

      await logAudit(req.dbUser.uid, req.dbUser.email, 'UPDATE_PROJECT', `Updated project: ${title} (ID: ${projId})`);
      res.json(result[0]);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/projects/:id', requireAdmin, async (req: any, res) => {
    const projId = parseInt(req.params.id);
    try {
      const deleted = await db.delete(projects).where(eq(projects.id, projId)).returning();
      if (deleted.length > 0) {
        await deleteFileFromCloud(deleted[0].image);
        await deleteFileFromCloud(deleted[0].videoUrl);
      }
      await logAudit(req.dbUser.uid, req.dbUser.email, 'DELETE_PROJECT', `Deleted project ID: ${projId}`);
      res.json(deleted[0]);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Project Milestones Progress
  app.post('/api/projects/:id/progress', requireAdmin, async (req: any, res) => {
    const projId = parseInt(req.params.id);
    const { milestoneName, percentage, description, status } = req.body;
    if (!milestoneName || !description) return res.status(400).json({ error: 'Missing milestone fields' });

    try {
      const result = await db.insert(projectProgress).values({
        projectId: projId,
        milestoneName,
        percentage: percentage ? parseInt(percentage) : 0,
        description,
        status: status || 'pending',
      }).returning();

      await logAudit(req.dbUser.uid, req.dbUser.email, 'ADD_MILESTONE', `Added milestone ${milestoneName} to project ID: ${projId}`);
      res.json(result[0]);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/projects/progress/:progressId', requireAdmin, async (req: any, res) => {
    const progId = parseInt(req.params.progressId);
    const { milestoneName, percentage, description, status } = req.body;
    try {
      const result = await db.update(projectProgress)
        .set({
          milestoneName,
          percentage: percentage !== undefined ? parseInt(percentage) : undefined,
          description,
          status,
        })
        .where(eq(projectProgress.id, progId))
        .returning();

      await logAudit(req.dbUser.uid, req.dbUser.email, 'UPDATE_MILESTONE', `Updated milestone ID: ${progId}`);
      res.json(result[0]);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/projects/progress/:progressId', requireAdmin, async (req: any, res) => {
    const progId = parseInt(req.params.progressId);
    try {
      const deleted = await db.delete(projectProgress).where(eq(projectProgress.id, progId)).returning();
      await logAudit(req.dbUser.uid, req.dbUser.email, 'DELETE_MILESTONE', `Deleted milestone ID: ${progId}`);
      res.json(deleted[0]);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });


  // ==========================================
  // --- BLOG ENDPOINTS ---
  // ==========================================
  app.get('/api/blogs', async (req, res) => {
    try {
      const posts = await db.select().from(blogPosts).orderBy(desc(blogPosts.publishedAt));
      res.json(posts);
    } catch (error: any) {
      console.warn('[DB Fallback] /api/blogs:', error.message || error);
      res.json([]);
    }
  });

  app.get('/api/blogs/:id', async (req, res) => {
    const blogId = parseInt(req.params.id);
    try {
      const post = await db.select().from(blogPosts).where(eq(blogPosts.id, blogId)).limit(1);
      if (post.length === 0) return res.status(404).json({ error: 'Blog post not found' });
      res.json(post[0]);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/blogs', requireAdmin, async (req: any, res) => {
    let { title, content, image, videoUrl, summary, category } = req.body;
    if (!title || !content || !summary || !category) {
      return res.status(400).json({ error: 'Missing blog fields (title, content, summary, or category)' });
    }
    const finalImage = (image && image.trim()) ? image.trim() : (videoUrl || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1200');
    try {
      const result = await db.insert(blogPosts).values({
        title,
        content,
        image: finalImage,
        videoUrl: videoUrl || null,
        summary,
        category,
        authorId: req.dbUser.id,
      }).returning();

      await logAudit(req.dbUser.uid, req.dbUser.email, 'CREATE_BLOG', `Created blog post: ${title}`);
      res.json(result[0]);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/blogs/:id', requireAdmin, async (req: any, res) => {
    const blogId = parseInt(req.params.id);
    let { title, content, image, videoUrl, summary, category } = req.body;
    const finalImage = (image && image.trim()) ? image.trim() : (videoUrl || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1200');
    try {
      // Fetch existing record to perform asset replacement check
      const existing = await db.select().from(blogPosts).where(eq(blogPosts.id, blogId)).limit(1);
      if (existing.length > 0) {
        if (finalImage && finalImage !== existing[0].image) {
          await deleteFileFromCloud(existing[0].image);
        }
        if (videoUrl !== undefined && videoUrl !== existing[0].videoUrl) {
          await deleteFileFromCloud(existing[0].videoUrl);
        }
      }

      const result = await db.update(blogPosts)
        .set({ title, content, image: finalImage, videoUrl: videoUrl || null, summary, category })
        .where(eq(blogPosts.id, blogId))
        .returning();

      await logAudit(req.dbUser.uid, req.dbUser.email, 'UPDATE_BLOG', `Updated blog ID: ${blogId}`);
      res.json(result[0]);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/blogs/:id', requireAdmin, async (req: any, res) => {
    const blogId = parseInt(req.params.id);
    try {
      const deleted = await db.delete(blogPosts).where(eq(blogPosts.id, blogId)).returning();
      if (deleted.length > 0) {
        await deleteFileFromCloud(deleted[0].image);
        await deleteFileFromCloud(deleted[0].videoUrl);
      }
      await logAudit(req.dbUser.uid, req.dbUser.email, 'DELETE_BLOG', `Deleted blog ID: ${blogId}`);
      res.json(deleted[0]);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });



  // --- GALLERY ENDPOINTS ---
  // ==========================================
  app.get('/api/gallery', async (req, res) => {
    try {
      const items = await db.select().from(galleryItems).orderBy(desc(galleryItems.createdAt));
      res.json(items);
    } catch (error: any) {
      console.warn('[DB Fallback] /api/gallery:', error.message || error);
      res.json([]);
    }
  });

  app.post('/api/gallery', requireAdmin, async (req: any, res) => {
    let { title, imageUrl, videoUrl, category } = req.body;
    if (!title || !category) return res.status(400).json({ error: 'Missing title or category field' });
    const finalImageUrl = (imageUrl && imageUrl.trim()) ? imageUrl.trim() : (videoUrl || 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=1200');
    try {
      const result = await db.insert(galleryItems).values({ 
        title, 
        imageUrl: finalImageUrl, 
        videoUrl: videoUrl || null,
        category 
      }).returning();
      await logAudit(req.dbUser.uid, req.dbUser.email, 'ADD_GALLERY', `Added item to gallery: ${title}`);
      res.json(result[0]);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/gallery/:id', requireAdmin, async (req: any, res) => {
    const itemId = parseInt(req.params.id);
    try {
      const deleted = await db.delete(galleryItems).where(eq(galleryItems.id, itemId)).returning();
      if (deleted.length > 0) {
        await deleteFileFromCloud(deleted[0].imageUrl);
        await deleteFileFromCloud(deleted[0].videoUrl);
      }
      await logAudit(req.dbUser.uid, req.dbUser.email, 'DELETE_GALLERY', `Deleted gallery item ID: ${itemId}`);
      res.json(deleted[0]);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/gallery/:id', requireAdmin, async (req: any, res) => {
    const itemId = parseInt(req.params.id);
    let { title, imageUrl, videoUrl, category } = req.body;
    if (!title || !category) return res.status(400).json({ error: 'Missing title or category field' });
    const finalImageUrl = (imageUrl && imageUrl.trim()) ? imageUrl.trim() : (videoUrl || 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=1200');
    try {
      // Fetch existing record to perform asset replacement check
      const existing = await db.select().from(galleryItems).where(eq(galleryItems.id, itemId)).limit(1);
      if (existing.length > 0) {
        if (finalImageUrl && finalImageUrl !== existing[0].imageUrl) {
          await deleteFileFromCloud(existing[0].imageUrl);
        }
        if (videoUrl !== undefined && videoUrl !== existing[0].videoUrl) {
          await deleteFileFromCloud(existing[0].videoUrl);
        }
      }

      const updated = await db.update(galleryItems).set({
        title,
        imageUrl: finalImageUrl,
        videoUrl: videoUrl || null,
        category
      }).where(eq(galleryItems.id, itemId)).returning();
      await logAudit(req.dbUser.uid, req.dbUser.email, 'UPDATE_GALLERY', `Updated gallery item: ${title}`);
      res.json(updated[0]);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==========================================

  // --- FAQ CMS ENDPOINTS ---
  // ==========================================
  app.get('/api/admin/faqs', requireStaffOrAdmin, async (req, res) => {
    try {
      await ensureFaqDefaults();
      const allFaqs = await db.select().from(faqs).orderBy(faqs.displayOrder);
      const allCategories = await db.select().from(faqCategories).orderBy(faqCategories.displayOrder);
      const logs = await db.select().from(cmsActivityLogs).where(eq(cmsActivityLogs.module, 'FAQ')).orderBy(desc(cmsActivityLogs.timestamp)).limit(50);
      res.json({
        success: true,
        faqs: allFaqs,
        categories: allCategories,
        auditLogs: logs
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/admin/faqs', requireStaffOrAdmin, async (req: any, res) => {
    try {
      const data = req.body;
      let resultRecord;
      if (data.id) {
        const updated = await db.update(faqs).set({
          question: data.question,
          answer: data.answer,
          categoryId: data.categoryId || null,
          categoryName: data.categoryName || 'General',
          tags: data.tags || [],
          featured: Boolean(data.featured),
          displayOrder: Number(data.displayOrder) || 1,
          status: data.status || 'PUBLISHED',
          seoTitle: data.seoTitle || null,
          seoDescription: data.seoDescription || null,
          relatedService: data.relatedService || null,
          relatedPage: data.relatedPage || null,
          updatedAt: new Date()
        }).where(eq(faqs.id, Number(data.id))).returning();
        resultRecord = updated[0];
      } else {
        const inserted = await db.insert(faqs).values({
          question: data.question,
          answer: data.answer,
          categoryId: data.categoryId || null,
          categoryName: data.categoryName || 'General',
          tags: data.tags || [],
          featured: Boolean(data.featured),
          displayOrder: Number(data.displayOrder) || 1,
          status: data.status || 'PUBLISHED',
          author: req.dbUser?.displayName || req.dbUser?.email || 'MADECC Admin',
          seoTitle: data.seoTitle || null,
          seoDescription: data.seoDescription || null,
          relatedService: data.relatedService || null,
          relatedPage: data.relatedPage || null
        }).returning();
        resultRecord = inserted[0];
      }

      await db.insert(cmsActivityLogs).values({
        module: 'FAQ',
        action: data.id ? 'EDIT' : 'CREATE',
        recordId: String(resultRecord.id),
        recordTitle: resultRecord.question.slice(0, 60),
        performedBy: req.dbUser?.email || 'Admin',
        details: `${data.id ? 'Updated' : 'Created'} FAQ item #${resultRecord.id}`
      });

      res.json({ success: true, faq: resultRecord });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch('/api/admin/faqs/:id/status', requireStaffOrAdmin, async (req: any, res) => {
    try {
      const id = Number(req.params.id);
      const { status } = req.body;
      await db.update(faqs).set({ status, updatedAt: new Date() }).where(eq(faqs.id, id));
      await db.insert(cmsActivityLogs).values({
        module: 'FAQ',
        action: 'STATUS_CHANGE',
        recordId: String(id),
        recordTitle: `FAQ #${id}`,
        performedBy: req.dbUser?.email || 'Admin',
        details: `Status updated to ${status}`
      });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/admin/faqs/:id', requireStaffOrAdmin, async (req: any, res) => {
    try {
      const id = Number(req.params.id);
      await db.delete(faqs).where(eq(faqs.id, id));
      await db.insert(cmsActivityLogs).values({
        module: 'FAQ',
        action: 'DELETE',
        recordId: String(id),
        recordTitle: `FAQ #${id}`,
        performedBy: req.dbUser?.email || 'Admin',
        details: `Deleted FAQ #${id}`
      });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/admin/faqs/categories', requireStaffOrAdmin, async (req: any, res) => {
    try {
      const { id, name, slug, description, displayOrder } = req.body;
      const cleanSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      let result;
      if (id) {
        const updated = await db.update(faqCategories).set({
          name,
          slug: cleanSlug,
          description: description || null,
          displayOrder: Number(displayOrder) || 1
        }).where(eq(faqCategories.id, Number(id))).returning();
        result = updated[0];
      } else {
        const inserted = await db.insert(faqCategories).values({
          name,
          slug: cleanSlug,
          description: description || null,
          displayOrder: Number(displayOrder) || 1
        }).returning();
        result = inserted[0];
      }
      res.json({ success: true, category: result });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/public/faqs', async (req, res) => {
    try {
      await ensureFaqDefaults();
      const publishedFaqs = await db.select().from(faqs).where(eq(faqs.status, 'PUBLISHED')).orderBy(faqs.displayOrder);
      res.json({ success: true, faqs: publishedFaqs });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/public/faqs/submit-question', async (req, res) => {
    try {
      const { name, email, phone, category, question } = req.body;
      if (!question) return res.status(400).json({ error: 'Question text is required' });

      const inserted = await db.insert(faqs).values({
        question,
        answer: 'Thank you for your question. Our engineering desk is reviewing it and will publish a detailed response shortly.',
        categoryName: category || 'General',
        status: 'PENDING_REVIEW',
        author: name || email || 'Website Visitor',
        seoDescription: `Submitted by ${name} (${email}, ${phone})`
      }).returning();

      res.json({ success: true, id: inserted[0].id, message: 'Question received and pending review' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Helper function to auto-seed Sustainability defaults

  // --- SUSTAINABILITY CMS ENDPOINTS ---
  // ==========================================
  app.get('/api/admin/sustainability', requireStaffOrAdmin, async (req, res) => {
    try {
      await ensureSustainabilityDefaults();
      const contentRecords = await db.select().from(sustainabilityContent);
      const inits = await db.select().from(sustainabilityInitiatives).orderBy(sustainabilityInitiatives.displayOrder);
      const socials = await db.select().from(socialImpactProjects).orderBy(socialImpactProjects.displayOrder);
      const mets = await db.select().from(impactMetrics).orderBy(impactMetrics.displayOrder);
      const logs = await db.select().from(cmsActivityLogs).where(eq(cmsActivityLogs.module, 'SUSTAINABILITY')).orderBy(desc(cmsActivityLogs.timestamp)).limit(50);

      res.json({
        success: true,
        content: contentRecords[0] || {},
        initiatives: inits,
        socialProjects: socials,
        metrics: mets,
        auditLogs: logs
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/admin/sustainability/overview', requireStaffOrAdmin, async (req: any, res) => {
    try {
      const data = req.body;
      const existing = await db.select().from(sustainabilityContent).limit(1);
      let updated;
      if (existing.length > 0) {
        updated = await db.update(sustainabilityContent).set({
          title: data.title,
          heroSubtitle: data.heroSubtitle,
          introduction: data.introduction,
          environmentalPolicy: data.environmentalPolicy,
          safetyPolicy: data.safetyPolicy,
          localEconomicCommitment: data.localEconomicCommitment,
          documents: data.documents || [],
          updatedBy: req.dbUser?.email || 'Admin',
          updatedAt: new Date()
        }).where(eq(sustainabilityContent.id, existing[0].id)).returning();
      } else {
        updated = await db.insert(sustainabilityContent).values({
          title: data.title || 'Sustainability & Social Impact',
          heroSubtitle: data.heroSubtitle || 'Building responsibly.',
          introduction: data.introduction || '',
          environmentalPolicy: data.environmentalPolicy || null,
          safetyPolicy: data.safetyPolicy || null,
          localEconomicCommitment: data.localEconomicCommitment || null,
          documents: data.documents || [],
          updatedBy: req.dbUser?.email || 'Admin'
        }).returning();
      }

      await db.insert(cmsActivityLogs).values({
        module: 'SUSTAINABILITY',
        action: 'EDIT',
        recordId: 'OVERVIEW',
        recordTitle: 'Sustainability Overview Content',
        performedBy: req.dbUser?.email || 'Admin',
        details: 'Updated sustainability overview and policies'
      });

      res.json({ success: true, content: updated[0] });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/admin/sustainability/initiatives', requireStaffOrAdmin, async (req: any, res) => {
    try {
      const data = req.body;
      let record;
      if (data.id) {
        const updated = await db.update(sustainabilityInitiatives).set({
          title: data.title,
          category: data.category || 'Sustainable Construction',
          description: data.description,
          impactSummary: data.impactSummary || null,
          image: data.image || null,
          documents: data.documents || [],
          displayOrder: Number(data.displayOrder) || 1,
          status: data.status || 'PUBLISHED',
          featured: Boolean(data.featured),
          updatedBy: req.dbUser?.email || 'Admin',
          updatedAt: new Date()
        }).where(eq(sustainabilityInitiatives.id, Number(data.id))).returning();
        record = updated[0];
      } else {
        const inserted = await db.insert(sustainabilityInitiatives).values({
          title: data.title,
          category: data.category || 'Sustainable Construction',
          description: data.description,
          impactSummary: data.impactSummary || null,
          image: data.image || null,
          documents: data.documents || [],
          displayOrder: Number(data.displayOrder) || 1,
          status: data.status || 'PUBLISHED',
          featured: Boolean(data.featured),
          createdBy: req.dbUser?.email || 'Admin'
        }).returning();
        record = inserted[0];
      }

      res.json({ success: true, initiative: record });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/admin/sustainability/initiatives/:id', requireStaffOrAdmin, async (req: any, res) => {
    try {
      const id = Number(req.params.id);
      await db.delete(sustainabilityInitiatives).where(eq(sustainabilityInitiatives.id, id));
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/admin/sustainability/social-projects', requireStaffOrAdmin, async (req: any, res) => {
    try {
      const data = req.body;
      let record;
      if (data.id) {
        const updated = await db.update(socialImpactProjects).set({
          title: data.title,
          category: data.category || 'Community Participation',
          location: data.location || 'Douala, Cameroon',
          dateCompleted: data.dateCompleted || null,
          description: data.description,
          impactMetricsText: data.impactMetricsText || null,
          image: data.image || null,
          gallery: data.gallery || [],
          documents: data.documents || [],
          displayOrder: Number(data.displayOrder) || 1,
          status: data.status || 'PUBLISHED',
          featured: Boolean(data.featured),
          updatedBy: req.dbUser?.email || 'Admin',
          updatedAt: new Date()
        }).where(eq(socialImpactProjects.id, Number(data.id))).returning();
        record = updated[0];
      } else {
        const inserted = await db.insert(socialImpactProjects).values({
          title: data.title,
          category: data.category || 'Community Participation',
          location: data.location || 'Douala, Cameroon',
          dateCompleted: data.dateCompleted || null,
          description: data.description,
          impactMetricsText: data.impactMetricsText || null,
          image: data.image || null,
          gallery: data.gallery || [],
          documents: data.documents || [],
          displayOrder: Number(data.displayOrder) || 1,
          status: data.status || 'PUBLISHED',
          featured: Boolean(data.featured),
          createdBy: req.dbUser?.email || 'Admin'
        }).returning();
        record = inserted[0];
      }

      res.json({ success: true, project: record });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/admin/sustainability/social-projects/:id', requireStaffOrAdmin, async (req: any, res) => {
    try {
      const id = Number(req.params.id);
      await db.delete(socialImpactProjects).where(eq(socialImpactProjects.id, id));
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/admin/sustainability/metrics', requireStaffOrAdmin, async (req: any, res) => {
    try {
      const data = req.body;
      let record;
      if (data.id) {
        const updated = await db.update(impactMetrics).set({
          label: data.label,
          value: data.value,
          category: data.category || 'Social Impact',
          icon: data.icon || 'Users',
          displayOrder: Number(data.displayOrder) || 1,
          status: data.status || 'PUBLISHED',
          updatedBy: req.dbUser?.email || 'Admin',
          updatedAt: new Date()
        }).where(eq(impactMetrics.id, Number(data.id))).returning();
        record = updated[0];
      } else {
        const inserted = await db.insert(impactMetrics).values({
          label: data.label,
          value: data.value,
          category: data.category || 'Social Impact',
          icon: data.icon || 'Users',
          displayOrder: Number(data.displayOrder) || 1,
          status: data.status || 'PUBLISHED'
        }).returning();
        record = inserted[0];
      }

      res.json({ success: true, metric: record });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/admin/sustainability/metrics/:id', requireStaffOrAdmin, async (req: any, res) => {
    try {
      const id = Number(req.params.id);
      await db.delete(impactMetrics).where(eq(impactMetrics.id, id));
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/public/sustainability', async (req, res) => {
    try {
      await ensureSustainabilityDefaults();
      const contentRecords = await db.select().from(sustainabilityContent);
      const inits = await db.select().from(sustainabilityInitiatives).where(eq(sustainabilityInitiatives.status, 'PUBLISHED')).orderBy(sustainabilityInitiatives.displayOrder);
      const socials = await db.select().from(socialImpactProjects).where(eq(socialImpactProjects.status, 'PUBLISHED')).orderBy(socialImpactProjects.displayOrder);
      const mets = await db.select().from(impactMetrics).where(eq(impactMetrics.status, 'PUBLISHED')).orderBy(impactMetrics.displayOrder);

      res.json({
        success: true,
        content: contentRecords[0] || {},
        initiatives: inits,
        socialProjects: socials,
        metrics: mets
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });


  // --- FULL-STACK CMS MANAGEMENT ENGINE ---
  // ==========================================

  // 1. CMS Site Settings
  app.get('/api/cms/settings', async (req, res) => {
    try {
      const settings = await db.select().from(siteSettings).limit(1);
      if (settings.length > 0) {
        return res.json({ success: true, settings: settings[0] });
      }
      // Fallback if not yet seeded
      return res.json({
        success: true,
        settings: {
          siteName: 'MADECC Group',
          tagline: 'Premier Construction, Civil Engineering & Project Management in Cameroon',
          phone: '+237 670 00 00 00',
          emergencyPhone: '+237 690 00 00 00',
          email: 'contact@madeccgroup.com',
          officeAddressYaounde: 'Mbankolo, Yaounde, Centre Region, Cameroon',
          officeAddressDouala: 'Akwa, Douala, Littoral Region, Cameroon',
          businessHours: 'Mon - Fri: 08:00 - 18:00 | Sat: 08:30 - 14:00 (GMT+1)',
          whatsappNumber: '+237670000000',
          facebookUrl: 'https://facebook.com/madeccgroup',
          linkedinUrl: 'https://linkedin.com/company/madecc-group',
          instagramUrl: 'https://instagram.com/madeccgroup',
          youtubeUrl: 'https://youtube.com/@madeccgroup',
          twitterUrl: 'https://x.com/madeccgroup',
          globalSeo: {
            seoTitle: 'MADECC Group -- Premier Construction & Civil Engineering in Cameroon',
            metaDescription: 'Leading Cameroonian construction and engineering firm. Eurocode 2 standards, certified concrete batching, and turnkey execution.',
            robotsIndex: true
          }
        }
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/cms/settings', requireStaffOrAdmin, async (req: any, res) => {
    try {
      const data = req.body;
      const existing = await db.select().from(siteSettings).limit(1);
      let updatedRecord;
      if (existing.length > 0) {
        const updated = await db.update(siteSettings)
          .set({
            siteName: data.siteName !== undefined ? data.siteName : existing[0].siteName,
            tagline: data.tagline !== undefined ? data.tagline : existing[0].tagline,
            developerName: data.developerName !== undefined ? data.developerName : existing[0].developerName,
            phone: data.phone !== undefined ? data.phone : existing[0].phone,
            phoneSecondary: data.phoneSecondary !== undefined ? data.phoneSecondary : existing[0].phoneSecondary,
            phoneTertiary: data.phoneTertiary !== undefined ? data.phoneTertiary : existing[0].phoneTertiary,
            emergencyPhone: data.emergencyPhone !== undefined ? data.emergencyPhone : existing[0].emergencyPhone,
            email: data.email !== undefined ? data.email : existing[0].email,
            secondaryEmail: data.secondaryEmail !== undefined ? data.secondaryEmail : existing[0].secondaryEmail,
            officeAddressYaounde: data.officeAddressYaounde !== undefined ? data.officeAddressYaounde : existing[0].officeAddressYaounde,
            officeAddressDouala: data.officeAddressDouala !== undefined ? data.officeAddressDouala : existing[0].officeAddressDouala,
            businessHours: data.businessHours !== undefined ? data.businessHours : existing[0].businessHours,
            whatsappNumber: data.whatsappNumber !== undefined ? data.whatsappNumber : existing[0].whatsappNumber,
            whatsappSecondary: data.whatsappSecondary !== undefined ? data.whatsappSecondary : existing[0].whatsappSecondary,
            paymentMtnNumbers: data.paymentMtnNumbers !== undefined ? data.paymentMtnNumbers : existing[0].paymentMtnNumbers,
            paymentOrangeNumbers: data.paymentOrangeNumbers !== undefined ? data.paymentOrangeNumbers : existing[0].paymentOrangeNumbers,
            paymentInstructions: data.paymentInstructions !== undefined ? data.paymentInstructions : existing[0].paymentInstructions,
            facebookUrl: data.facebookUrl !== undefined ? data.facebookUrl : existing[0].facebookUrl,
            linkedinUrl: data.linkedinUrl !== undefined ? data.linkedinUrl : existing[0].linkedinUrl,
            instagramUrl: data.instagramUrl !== undefined ? data.instagramUrl : existing[0].instagramUrl,
            youtubeUrl: data.youtubeUrl !== undefined ? data.youtubeUrl : existing[0].youtubeUrl,
            twitterUrl: data.twitterUrl !== undefined ? data.twitterUrl : existing[0].twitterUrl,
            tiktokUrl: data.tiktokUrl !== undefined ? data.tiktokUrl : existing[0].tiktokUrl,
            pinterestUrl: data.pinterestUrl !== undefined ? data.pinterestUrl : existing[0].pinterestUrl,
            rccmNumber: data.rccmNumber !== undefined ? data.rccmNumber : existing[0].rccmNumber,
            niuTaxId: data.niuTaxId !== undefined ? data.niuTaxId : existing[0].niuTaxId,
            legalStatus: data.legalStatus !== undefined ? data.legalStatus : existing[0].legalStatus,
            shareHeadline: data.shareHeadline !== undefined ? data.shareHeadline : existing[0].shareHeadline,
            shareDescription: data.shareDescription !== undefined ? data.shareDescription : existing[0].shareDescription,
            logoUrl: data.logoUrl !== undefined ? data.logoUrl : existing[0].logoUrl,
            faviconUrl: data.faviconUrl !== undefined ? data.faviconUrl : existing[0].faviconUrl,
            themeSettings: data.themeSettings !== undefined ? data.themeSettings : existing[0].themeSettings,
            globalSeo: data.globalSeo !== undefined ? data.globalSeo : existing[0].globalSeo,
            navigationLinks: data.navigationLinks !== undefined ? data.navigationLinks : existing[0].navigationLinks,
            footerContent: data.footerContent !== undefined ? data.footerContent : existing[0].footerContent,
            emergencyBanner: data.emergencyBanner !== undefined ? data.emergencyBanner : existing[0].emergencyBanner,
            updatedBy: req.dbUser?.displayName || req.dbUser?.email || 'MADECC Executive Admin',
            updatedAt: new Date()
          })
          .where(eq(siteSettings.id, existing[0].id))
          .returning();
        updatedRecord = updated[0];
      } else {
        const inserted = await db.insert(siteSettings).values({
          ...data,
          updatedBy: req.dbUser?.displayName || req.dbUser?.email || 'MADECC Executive Admin'
        }).returning();
        updatedRecord = inserted[0];
      }

      await db.insert(cmsActivityLogs).values({
        module: 'SITE_SETTINGS',
        action: 'UPDATE',
        recordId: String(updatedRecord.id),
        recordTitle: 'Global Site Settings',
        performedBy: req.dbUser?.email || 'Admin',
        details: 'Updated global site settings & branding'
      }).catch(e => console.warn('[CMS_LOG]', e));

      res.json({ success: true, settings: updatedRecord });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 2. CMS Pages List
  app.get('/api/cms/pages', async (req, res) => {
    try {
      let pages = await db.select({
        id: pageContents.id,
        slug: pageContents.slug,
        title: pageContents.title,
        status: pageContents.status,
        version: pageContents.version,
        lastSavedBy: pageContents.lastSavedBy,
        publishedAt: pageContents.publishedAt,
        updatedAt: pageContents.updatedAt
      }).from(pageContents).orderBy(pageContents.slug);

      // Auto-seed default pages if table is empty
      if (pages.length === 0) {
        const DEFAULT_PAGE_TEMPLATES = [
          { slug: 'home', title: 'Home Page' },
          { slug: 'about', title: 'About Us' },
          { slug: 'services', title: 'Services & Engineering' },
          { slug: 'projects', title: 'Major Projects & Corridors' },
          { slug: 'sustainability', title: 'Sustainability & ESG' },
          { slug: 'tenders', title: 'Procurement & Tenders' },
          { slug: 'suppliers', title: 'Supplier Registration' },
          { slug: 'careers', title: 'Careers & Talent' },
          { slug: 'contact', title: 'Contact & Offices' },
          { slug: 'privacy-policy', title: 'Privacy Policy' },
          { slug: 'terms', title: 'Terms of Service' }
        ];

        for (const pt of DEFAULT_PAGE_TEMPLATES) {
          try {
            await db.insert(pageContents).values({
              slug: pt.slug,
              title: pt.title,
              status: 'PUBLISHED',
              version: 1,
              heroConfig: {
                title: pt.slug === 'home' ? "MADECC Group -- Building Cameroon's Future" : `${pt.title} | MADECC Group`,
                subtitle: 'Excellence in Civil Engineering, Infrastructure, and Commercial Complex Construction in Cameroon.',
                eyebrow: 'Construction & Civil Engineering -- Cameroon',
                mediaType: 'video',
                videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-construction-site-with-cranes-and-workers-40915-large.mp4',
                posterUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=1920&q=80',
                imageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=1920&q=80',
                videoSettings: {
                  autoplay: true,
                  muted: true,
                  loop: true,
                  playsInline: true,
                  disableOnMobile: false,
                  overlayOpacity: 75
                },
                primaryCta: { text: 'Request a Free Quote', link: '/contact', visible: true },
                secondaryCta: { text: 'Calculate Budget (FCFA)', link: '/budget-calculator', visible: true },
                tertiaryCta: { text: 'Schedule Consultation ->', link: '/contact', visible: true }
              },
              sections: [
                {
                  id: `sec-${pt.slug}-1`,
                  type: 'services',
                  title: 'Core Capabilities & Heavy Engineering',
                  subtitle: 'High-standard construction across Yaounde, Douala, and nationwide',
                  enabled: true,
                  displayOrder: 1
                }
              ],
              seo: {
                seoTitle: `${pt.title} | MADECC Group Cameroon`,
                metaDescription: `Official ${pt.title} page for MADECC Group, leading civil engineering and building contractor in Cameroon.`,
                keywords: 'construction cameroon, yaounde builder, civil engineering',
                robotsIndex: true
              },
              lastSavedBy: 'MADECC System Auto-Initializer',
              publishedAt: new Date(),
              updatedAt: new Date()
            });
          } catch (seedErr) {
            console.warn('[CMS_PAGE_SEED_WARN]', seedErr);
          }
        }

        pages = await db.select({
          id: pageContents.id,
          slug: pageContents.slug,
          title: pageContents.title,
          status: pageContents.status,
          version: pageContents.version,
          lastSavedBy: pageContents.lastSavedBy,
          publishedAt: pageContents.publishedAt,
          updatedAt: pageContents.updatedAt
        }).from(pageContents).orderBy(pageContents.slug);
      }

      res.json({ success: true, pages });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 3. CMS Page Details (Live vs Draft)
  app.get('/api/cms/pages/:slug', async (req, res) => {
    try {
      const { slug } = req.params;
      const { mode } = req.query; // 'draft' or 'live' (default)

      let pages = await db.select().from(pageContents).where(eq(pageContents.slug, slug)).limit(1);
      
      // If page not found, auto-create a clean initial page record
      if (pages.length === 0) {
        const formattedTitle = slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' ');
        const inserted = await db.insert(pageContents).values({
          slug,
          title: formattedTitle,
          status: 'PUBLISHED',
          version: 1,
          heroConfig: {
            title: slug === 'home' ? "MADECC Group -- Building Cameroon's Future" : `${formattedTitle} | MADECC Group`,
            subtitle: 'Excellence in Civil Engineering, Infrastructure, and Commercial Complex Construction in Cameroon.',
            eyebrow: 'Construction & Civil Engineering -- Cameroon',
            mediaType: 'video',
            videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
            posterUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=1920&q=80',
            imageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=1920&q=80',
            videoSettings: {
              autoplay: true,
              muted: true,
              loop: true,
              playsInline: true,
              disableOnMobile: false,
              overlayOpacity: 75
            },
            primaryCta: { text: 'Request a Free Quote', link: '/contact', visible: true },
            secondaryCta: { text: 'Calculate Budget (FCFA)', link: '/budget-calculator', visible: true },
            tertiaryCta: { text: 'Schedule Consultation ->', link: '/contact', visible: true }
          },
          sections: [
            {
              id: `sec-${slug}-1`,
              type: 'services',
              title: 'Core Capabilities & Heavy Engineering',
              subtitle: 'High-standard construction across Yaounde, Douala, and nationwide',
              enabled: true,
              displayOrder: 1
            }
          ],
          seo: {
            seoTitle: `${formattedTitle} | MADECC Group Cameroon`,
            metaDescription: `Official ${formattedTitle} page for MADECC Group, leading civil engineering and building contractor in Cameroon.`,
            keywords: 'construction cameroon, yaounde builder, civil engineering',
            robotsIndex: true
          },
          lastSavedBy: 'MADECC System Auto-Initializer',
          publishedAt: new Date(),
          updatedAt: new Date()
        }).returning();

        if (inserted.length > 0) {
          pages = inserted;
        }
      }

      if (pages.length === 0) {
        return res.status(404).json({ error: `Page with slug "${slug}" not found` });
      }

      const page = pages[0];
      let pageData: any = {};

      if (mode === 'draft') {
        pageData = page.draftData || page.publishedData || {
          heroConfig: page.heroConfig,
          sections: page.sections,
          seo: page.seo
        };
      } else {
        pageData = page.publishedData || {
          heroConfig: page.heroConfig,
          sections: page.sections,
          seo: page.seo
        };
      }

      res.json({
        success: true,
        id: page.id,
        slug: page.slug,
        title: page.title,
        status: page.status,
        version: page.version,
        lastSavedBy: page.lastSavedBy,
        publishedAt: page.publishedAt,
        updatedAt: page.updatedAt,
        heroConfig: pageData.heroConfig || page.heroConfig,
        sections: pageData.sections || page.sections || [],
        seo: pageData.seo || page.seo || {},
        draftData: page.draftData,
        publishedData: page.publishedData
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 4. Save Page Draft (does not affect live site)
  app.put('/api/cms/pages/:slug/draft', requireStaffOrAdmin, async (req: any, res) => {
    try {
      const { slug } = req.params;
      const { heroConfig, sections, seo, title } = req.body;

      const existing = await db.select().from(pageContents).where(eq(pageContents.slug, slug)).limit(1);
      const draftPayload = {
        heroConfig,
        sections,
        seo
      };

      let pageRecord;
      if (existing.length > 0) {
        const updated = await db.update(pageContents)
          .set({
            title: title || existing[0].title,
            draftData: draftPayload,
            status: existing[0].status === 'PUBLISHED' ? 'DRAFT' : existing[0].status,
            lastSavedBy: req.dbUser?.displayName || req.dbUser?.email || 'MADECC Admin',
            updatedAt: new Date()
          })
          .where(eq(pageContents.id, existing[0].id))
          .returning();
        pageRecord = updated[0];
      } else {
        const inserted = await db.insert(pageContents).values({
          slug,
          title: title || slug.toUpperCase(),
          status: 'DRAFT',
          heroConfig,
          sections,
          seo,
          draftData: draftPayload,
          version: 1,
          lastSavedBy: req.dbUser?.displayName || req.dbUser?.email || 'MADECC Admin'
        }).returning();
        pageRecord = inserted[0];
      }

      await db.insert(cmsActivityLogs).values({
        module: 'PAGE_BUILDER',
        action: 'DRAFT_SAVE',
        recordId: String(pageRecord.id),
        recordTitle: `Page: ${pageRecord.title} (${slug})`,
        performedBy: req.dbUser?.email || 'Admin',
        details: `Saved draft for page ${slug}`
      }).catch(e => console.warn('[CMS_LOG]', e));

      res.json({ success: true, page: pageRecord });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 5. Publish Page (makes draft live, bumps version, records revision snapshot)
  app.post('/api/cms/pages/:slug/publish', requireStaffOrAdmin, async (req: any, res) => {
    try {
      const { slug } = req.params;
      const { heroConfig, sections, seo, changeSummary } = req.body;

      const existing = await db.select().from(pageContents).where(eq(pageContents.slug, slug)).limit(1);
      if (existing.length === 0) {
        return res.status(404).json({ error: `Page "${slug}" not found to publish` });
      }

      const currentPage = existing[0];
      const liveHero = heroConfig || (currentPage.draftData as any)?.heroConfig || currentPage.heroConfig;
      const liveSections = sections || (currentPage.draftData as any)?.sections || currentPage.sections;
      const liveSeo = seo || (currentPage.draftData as any)?.seo || currentPage.seo;

      const publishPayload = {
        heroConfig: liveHero,
        sections: liveSections,
        seo: liveSeo
      };

      const newVersion = (currentPage.version || 1) + 1;
      const now = new Date();

      // 1. Update Page record
      const updated = await db.update(pageContents)
        .set({
          heroConfig: liveHero,
          sections: liveSections,
          seo: liveSeo,
          publishedData: publishPayload,
          draftData: publishPayload,
          status: 'PUBLISHED',
          version: newVersion,
          lastSavedBy: req.dbUser?.displayName || req.dbUser?.email || 'MADECC Admin',
          publishedAt: now,
          updatedAt: now
        })
        .where(eq(pageContents.id, currentPage.id))
        .returning();

      // 2. Save revision snapshot for Undo / Restore
      await db.insert(pageContentRevisions).values({
        pageSlug: slug,
        version: newVersion,
        title: `${currentPage.title} - Version ${newVersion}`,
        snapshotData: publishPayload,
        changeSummary: changeSummary || `Published version ${newVersion} via CMS Admin`,
        author: req.dbUser?.displayName || req.dbUser?.email || 'MADECC Admin',
        isPublished: true,
        createdAt: now
      });

      // 3. Log activity
      await db.insert(cmsActivityLogs).values({
        module: 'PAGE_BUILDER',
        action: 'PUBLISH',
        recordId: String(currentPage.id),
        recordTitle: `Page: ${currentPage.title} (${slug}) v${newVersion}`,
        performedBy: req.dbUser?.email || 'Admin',
        details: `Published live version ${newVersion} with ${Array.isArray(liveSections) ? liveSections.length : 0} sections`
      }).catch(e => console.warn('[CMS_LOG]', e));

      res.json({ success: true, page: updated[0], version: newVersion });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 6. Unpublish Page
  app.post('/api/cms/pages/:slug/unpublish', requireStaffOrAdmin, async (req: any, res) => {
    try {
      const { slug } = req.params;
      const updated = await db.update(pageContents)
        .set({ status: 'UNPUBLISHED', updatedAt: new Date() })
        .where(eq(pageContents.slug, slug))
        .returning();

      if (updated.length === 0) {
        return res.status(404).json({ error: `Page "${slug}" not found` });
      }

      await db.insert(cmsActivityLogs).values({
        module: 'PAGE_BUILDER',
        action: 'UNPUBLISH',
        recordId: String(updated[0].id),
        recordTitle: `Page: ${updated[0].title} (${slug})`,
        performedBy: req.dbUser?.email || 'Admin',
        details: `Unpublished page ${slug}`
      }).catch(e => console.warn('[CMS_LOG]', e));

      res.json({ success: true, page: updated[0] });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 7. Get Page Revisions (Version History)
  app.get('/api/cms/pages/:slug/revisions', requireStaffOrAdmin, async (req: any, res) => {
    try {
      const { slug } = req.params;
      const revisions = await db.select()
        .from(pageContentRevisions)
        .where(eq(pageContentRevisions.pageSlug, slug))
        .orderBy(desc(pageContentRevisions.createdAt));

      res.json({ success: true, revisions });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 8. Restore Revision Snapshot
  app.post('/api/cms/pages/:slug/restore/:revisionId', requireStaffOrAdmin, async (req: any, res) => {
    try {
      const { slug, revisionId } = req.params;
      const rev = await db.select()
        .from(pageContentRevisions)
        .where(and(eq(pageContentRevisions.id, Number(revisionId)), eq(pageContentRevisions.pageSlug, slug)))
        .limit(1);

      if (rev.length === 0) {
        return res.status(404).json({ error: 'Revision not found' });
      }

      const snapshot = rev[0].snapshotData as any;
      if (!snapshot) {
        return res.status(400).json({ error: 'Selected revision has no snapshot data' });
      }

      const updated = await db.update(pageContents)
        .set({
          draftData: snapshot,
          status: 'DRAFT',
          lastSavedBy: req.dbUser?.displayName || req.dbUser?.email || 'MADECC Admin',
          updatedAt: new Date()
        })
        .where(eq(pageContents.slug, slug))
        .returning();

      await db.insert(cmsActivityLogs).values({
        module: 'PAGE_BUILDER',
        action: 'RESTORE_REVISION',
        recordId: String(revisionId),
        recordTitle: `Page: ${slug} restored to revision #${revisionId} (v${rev[0].version})`,
        performedBy: req.dbUser?.email || 'Admin',
        details: `Restored snapshot from ${new Date(rev[0].createdAt).toLocaleDateString()}`
      }).catch(e => console.warn('[CMS_LOG]', e));

      res.json({ success: true, page: updated[0], restoredRevision: rev[0] });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 9. Media Library Management Endpoints
  app.get('/api/cms/media', async (req, res) => {
    try {
      const { category, fileType, search } = req.query;
      let items = await db.select().from(mediaLibrary).orderBy(desc(mediaLibrary.createdAt));

      // Auto-seed initial media assets if empty
      if (items.length === 0) {
        const DEFAULT_MEDIA_ASSETS = [
          {
            title: 'Cinematic Construction & Crane Aerial Video Reel',
            filename: 'mixkit-construction-site-cranes.mp4',
            fileUrl: 'https://assets.mixkit.co/videos/preview/mixkit-construction-site-with-cranes-and-workers-40915-large.mp4',
            fileType: 'video',
            mimeType: 'video/mp4',
            fileSize: 14500000,
            altText: 'Active Cameroonian construction corridor with cranes',
            caption: 'Heavy civil infrastructure & crane operations in Yaounde',
            category: 'Hero Media',
            tags: ['video', 'hero', 'construction', 'cranes', 'civil engineering']
          },
          {
            title: 'Modern Commercial Tower Structural Concrete',
            filename: 'commercial-building-framework.jpg',
            fileUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=1920&q=80',
            fileType: 'image',
            mimeType: 'image/jpeg',
            fileSize: 2400000,
            altText: 'Commercial building concrete structural work',
            caption: 'Reinforced concrete engineering meeting Eurocode 2 & 8 standards',
            category: 'Projects',
            tags: ['building', 'commercial', 'structural', 'concrete']
          },
          {
            title: 'Highway Corridors & Asphalt Paving Roadwork',
            filename: 'highway-infrastructure-asphalt.jpg',
            fileUrl: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=1920&q=80',
            fileType: 'image',
            mimeType: 'image/jpeg',
            fileSize: 3100000,
            altText: 'Heavy road paving machinery and asphalt surfacing',
            caption: 'Inter-urban expressway and arterial road infrastructure',
            category: 'Projects',
            tags: ['roads', 'infrastructure', 'asphalt', 'civil engineering']
          },
          {
            title: 'MADECC Group Official Corporate Vector Mark',
            filename: 'madecc-group-logo.png',
            fileUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
            fileType: 'logo',
            mimeType: 'image/png',
            fileSize: 450000,
            altText: 'MADECC Group Construction & Engineering Branding',
            caption: 'Official corporate logo for tender submissions and digital portals',
            category: 'Logos',
            tags: ['logo', 'branding', 'corporate']
          },
          {
            title: 'Industrial Heavy Machinery & Fleet Excavators',
            filename: 'heavy-equipment-fleet.jpg',
            fileUrl: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1920&q=80',
            fileType: 'image',
            mimeType: 'image/jpeg',
            fileSize: 2800000,
            altText: 'Excavators and earthmoving machinery on site',
            caption: 'Mechanized earthworks, deep excavation, and foundation grading',
            category: 'Services',
            tags: ['machinery', 'earthworks', 'fleet', 'equipment']
          }
        ];

        for (const asset of DEFAULT_MEDIA_ASSETS) {
          try {
            await db.insert(mediaLibrary).values({
              ...asset,
              status: 'ACTIVE',
              uploadedBy: 'MADECC Media Auto-Initializer'
            });
          } catch (mErr) {
            console.warn('[MEDIA_SEED_WARN]', mErr);
          }
        }

        items = await db.select().from(mediaLibrary).orderBy(desc(mediaLibrary.createdAt));
      }

      let filtered = items;
      if (category && String(category).toLowerCase() !== 'all') {
        filtered = filtered.filter(item => item.category?.toLowerCase() === String(category).toLowerCase());
      }
      if (fileType && String(fileType).toLowerCase() !== 'all') {
        filtered = filtered.filter(item => item.fileType?.toLowerCase() === String(fileType).toLowerCase());
      }
      if (search) {
        const s = String(search).toLowerCase();
        filtered = filtered.filter(item => 
          item.title?.toLowerCase().includes(s) || 
          item.filename?.toLowerCase().includes(s) || 
          item.altText?.toLowerCase().includes(s) ||
          item.caption?.toLowerCase().includes(s)
        );
      }

      res.json({ success: true, media: filtered, total: filtered.length });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/cms/media', requireStaffOrAdmin, async (req: any, res) => {
    try {
      const data = req.body;
      if (!data.fileUrl || !data.title) {
        return res.status(400).json({ error: 'Title and fileUrl are required' });
      }

      const inserted = await db.insert(mediaLibrary).values({
        title: data.title,
        filename: data.filename || data.title.toLowerCase().replace(/[^a-z0-9.]+/g, '-'),
        fileUrl: data.fileUrl,
        fileType: data.fileType || 'image',
        mimeType: data.mimeType || 'image/jpeg',
        fileSize: Number(data.fileSize) || 0,
        dimensions: data.dimensions || null,
        altText: data.altText || data.title,
        caption: data.caption || null,
        category: data.category || 'General',
        tags: data.tags || [],
        usedIn: data.usedIn || [],
        status: data.status || 'ACTIVE',
        uploadedBy: req.dbUser?.displayName || req.dbUser?.email || 'MADECC Media Admin'
      }).returning();

      await db.insert(cmsActivityLogs).values({
        module: 'MEDIA_LIBRARY',
        action: 'UPLOAD',
        recordId: String(inserted[0].id),
        recordTitle: inserted[0].title,
        performedBy: req.dbUser?.email || 'Admin',
        details: `Added media asset "${inserted[0].title}" (${inserted[0].fileType})`
      }).catch(e => console.warn('[CMS_LOG]', e));

      res.json({ success: true, media: inserted[0] });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/cms/media/:id', requireStaffOrAdmin, async (req: any, res) => {
    try {
      const id = Number(req.params.id);
      const data = req.body;

      const updated = await db.update(mediaLibrary)
        .set({
          title: data.title,
          altText: data.altText,
          caption: data.caption,
          category: data.category,
          tags: data.tags,
          usedIn: data.usedIn,
          status: data.status,
          updatedAt: new Date()
        })
        .where(eq(mediaLibrary.id, id))
        .returning();

      if (updated.length === 0) {
        return res.status(404).json({ error: 'Media asset not found' });
      }

      res.json({ success: true, media: updated[0] });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/cms/media/:id', requireStaffOrAdmin, async (req: any, res) => {
    try {
      const id = Number(req.params.id);
      const deleted = await db.delete(mediaLibrary).where(eq(mediaLibrary.id, id)).returning();
      if (deleted.length === 0) {
        return res.status(404).json({ error: 'Media asset not found' });
      }

      await db.insert(cmsActivityLogs).values({
        module: 'MEDIA_LIBRARY',
        action: 'DELETE',
        recordId: String(id),
        recordTitle: deleted[0].title,
        performedBy: req.dbUser?.email || 'Admin',
        details: `Deleted media asset #${id}`
      }).catch(e => console.warn('[CMS_LOG]', e));

      res.json({ success: true, message: 'Media asset deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Re-seed CMS defaults if needed
  app.post('/api/cms/seed-defaults', requireAdmin, async (req: any, res) => {
    try {
      await seedDatabase();
      res.json({ success: true, message: 'CMS defaults seeded and synced successfully' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });


  // ==========================================
  // --- HERO BANNERS ENDPOINTS ---
  // ==========================================


  app.get('/api/banners', async (req, res) => {
    try {
      await ensureHeroBannersDefaults();
      const banners = await db.select().from(heroBanners).where(eq(heroBanners.active, true)).orderBy(heroBanners.displayOrder);
      res.json(banners);
    } catch (error: any) {
      console.warn('[DB Fallback] /api/banners:', error.message || error);
      res.json([]);
    }
  });

  app.get('/api/banners/all', requireAdmin, async (req, res) => {
    try {
      await ensureHeroBannersDefaults();
      const banners = await db.select().from(heroBanners).orderBy(heroBanners.displayOrder);
      res.json(banners);
    } catch (error: any) {
      console.warn('[DB Fallback] /api/banners/all:', error.message || error);
      res.json([]);
    }
  });

  app.post('/api/banners', requireAdmin, async (req: any, res) => {
    const { title, subtitle, imageUrl, videoUrl, displayOrder, active } = req.body;
    if (!title || !imageUrl) return res.status(400).json({ error: 'Title and image are required' });
    try {
      const result = await db.insert(heroBanners).values({
        title,
        subtitle,
        imageUrl,
        videoUrl: videoUrl || null,
        displayOrder: displayOrder ? parseInt(displayOrder) : 0,
        active: active !== false,
      }).returning();
      await logAudit(req.dbUser.uid, req.dbUser.email, 'CREATE_BANNER', `Created banner: ${title}`);
      res.json(result[0]);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/banners/:id', requireAdmin, async (req: any, res) => {
    const bannerId = parseInt(req.params.id);
    const { title, subtitle, imageUrl, videoUrl, displayOrder, active } = req.body;
    try {
      // Fetch existing record to perform asset replacement check
      const existing = await db.select().from(heroBanners).where(eq(heroBanners.id, bannerId)).limit(1);
      if (existing.length > 0) {
        if (imageUrl && imageUrl !== existing[0].imageUrl) {
          await deleteFileFromCloud(existing[0].imageUrl);
        }
        if (videoUrl !== undefined && videoUrl !== existing[0].videoUrl) {
          await deleteFileFromCloud(existing[0].videoUrl);
        }
      }

      const result = await db.update(heroBanners)
        .set({
          title,
          subtitle,
          imageUrl,
          videoUrl: videoUrl || null,
          displayOrder: displayOrder !== undefined ? parseInt(displayOrder) : undefined,
          active,
        })
        .where(eq(heroBanners.id, bannerId))
        .returning();
      await logAudit(req.dbUser.uid, req.dbUser.email, 'UPDATE_BANNER', `Updated banner ID: ${bannerId}`);
      res.json(result[0]);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/banners/:id', requireAdmin, async (req: any, res) => {
    const bannerId = parseInt(req.params.id);
    try {
      const deleted = await db.delete(heroBanners).where(eq(heroBanners.id, bannerId)).returning();
      if (deleted.length > 0) {
        await deleteFileFromCloud(deleted[0].imageUrl);
        await deleteFileFromCloud(deleted[0].videoUrl);
      }
      await logAudit(req.dbUser.uid, req.dbUser.email, 'DELETE_BANNER', `Deleted banner ID: ${bannerId}`);
      res.json(deleted[0]);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });



}
