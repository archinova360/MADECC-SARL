import { pool, db, getOrInitPool } from './index.ts';
import { siteSettings } from './schema.ts';
import { eq } from 'drizzle-orm';

export interface SiteSettingsData {
  id?: number;
  siteName?: string;
  tagline?: string;
  developerName?: string;
  phone?: string;
  phoneSecondary?: string;
  phoneTertiary?: string;
  emergencyPhone?: string;
  email?: string;
  secondaryEmail?: string;
  officeAddressYaounde?: string;
  officeAddressDouala?: string;
  businessHours?: string;
  whatsappNumber?: string;
  whatsappSecondary?: string;
  paymentMtnNumbers?: string;
  paymentOrangeNumbers?: string;
  paymentInstructions?: string;
  facebookUrl?: string;
  linkedinUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  twitterUrl?: string;
  tiktokUrl?: string;
  pinterestUrl?: string;
  shareHeadline?: string;
  shareDescription?: string;
  logoUrl?: string | null;
  faviconUrl?: string | null;
  legalStatus?: string;
  rccmNumber?: string;
  niuTaxId?: string;
  themeSettings?: any;
  globalSeo?: any;
  navigationLinks?: any;
  footerContent?: any;
  emergencyBanner?: any;
  updatedBy?: string;
  updatedAt?: string | Date;
}

export const CANONICAL_SITE_SETTINGS: Required<Omit<SiteSettingsData, 'id' | 'updatedAt'>> = {
  siteName: 'MADECC GROUP',
  tagline: 'Premier Engineering, Construction & Project Management in Cameroon',
  developerName: 'Kasah Rodrick Reboya',
  phone: '+237 683 31 64 86',
  phoneSecondary: '+237 671 063 511',
  phoneTertiary: '+237 640 194 505',
  emergencyPhone: '+237 683 31 64 86',
  email: 'kreboya603@gmail.com',
  secondaryEmail: 'Infomadeccconstruction@gmail.com',
  officeAddressYaounde: 'Mbankolo, Yaoundé, Centre Region, Cameroon',
  officeAddressDouala: 'Akwa, Douala, Littoral Region, Cameroon',
  businessHours: 'Mon - Fri: 08:00 - 18:00 | Sat: 08:30 - 14:00 (GMT+1)',
  whatsappNumber: '+237 683 31 64 86',
  whatsappSecondary: '+237 671 063 511',
  paymentMtnNumbers: '671063511, 683316486, 671289643',
  paymentOrangeNumbers: '689115595, 640194505',
  paymentInstructions: 'Send payment via MTN Mobile Money or Orange Money to any of our official merchant/business accounts. Retain the transaction ID for instant verification.',
  facebookUrl: 'https://facebook.com/madeccgroup',
  linkedinUrl: 'https://linkedin.com/company/madecc-group',
  instagramUrl: 'https://instagram.com/madeccgroup',
  youtubeUrl: 'https://youtube.com/@madeccgroup',
  twitterUrl: 'https://x.com/madeccgroup',
  tiktokUrl: 'https://tiktok.com/@madeccgroup',
  pinterestUrl: 'https://pinterest.com/madeccgroup',
  shareHeadline: 'MADECC GROUP — Premier Construction & Engineering',
  shareDescription: 'Leading Cameroonian construction, civil engineering and project management firm.',
  logoUrl: '/uploads/madecc-logo.png',
  faviconUrl: '/favicon.ico',
  legalStatus: 'SARL (Société à Responsabilité Limitée)',
  rccmNumber: 'RC/YAO/2023/B/1458',
  niuTaxId: 'M072318492019A',
  themeSettings: {
    primaryColor: '#002B49',
    accentColor: '#D99B26',
    fontHeading: 'Cabinet Grotesk',
    fontBody: 'Inter',
    borderRadius: '8px'
  },
  globalSeo: {
    seoTitle: 'MADECC GROUP — Premier Construction & Civil Engineering in Cameroon',
    metaDescription: 'Leading Cameroonian construction and engineering firm. Eurocode 2 standards, certified concrete batching, and turnkey execution.',
    robotsIndex: true
  },
  navigationLinks: [],
  footerContent: {
    aboutText: 'MADECC GROUP is a premier engineering, construction and project delivery conglomerate in Cameroon.',
    copyrightText: '© 2026 MADECC GROUP. All Rights Reserved.'
  },
  emergencyBanner: {
    enabled: false,
    message: '',
    badgeType: 'INFO'
  },
  updatedBy: 'Kasah Rodrick Reboya'
};

let tableEnsured = false;

/**
 * Ensures that the site_settings table exists with all required columns,
 * runs safe additive schema migrations, and guarantees the singleton row ID 1 is initialized.
 */
export async function ensureSiteSettingsTable(): Promise<void> {
  const activePool = pool || getOrInitPool();
  if (!activePool) {
    console.warn('[SITE_SETTINGS] No active database pool available to verify table.');
    return;
  }

  try {
    const client = await activePool.connect();
    try {
      // 1. Create table if not present
      await client.query(`
        CREATE TABLE IF NOT EXISTS site_settings (
          id SERIAL PRIMARY KEY,
          site_name TEXT NOT NULL DEFAULT 'MADECC GROUP',
          tagline TEXT DEFAULT 'Premier Engineering, Construction & Project Management in Cameroon',
          developer_name TEXT DEFAULT 'Kasah Rodrick Reboya',
          phone TEXT DEFAULT '+237 683 31 64 86',
          phone_secondary TEXT DEFAULT '+237 671 063 511',
          phone_tertiary TEXT DEFAULT '+237 640 194 505',
          emergency_phone TEXT DEFAULT '+237 683 31 64 86',
          email TEXT DEFAULT 'kreboya603@gmail.com',
          secondary_email TEXT DEFAULT 'Infomadeccconstruction@gmail.com',
          office_address_yaounde TEXT DEFAULT 'Mbankolo, Yaoundé, Centre Region, Cameroon',
          office_address_douala TEXT DEFAULT 'Akwa, Douala, Littoral Region, Cameroon',
          business_hours TEXT DEFAULT 'Mon - Fri: 08:00 - 18:00 | Sat: 08:30 - 14:00 (GMT+1)',
          whatsapp_number TEXT DEFAULT '+237 683 31 64 86',
          whatsapp_secondary TEXT DEFAULT '+237 671 063 511',
          payment_mtn_numbers TEXT DEFAULT '671063511, 683316486, 671289643',
          payment_orange_numbers TEXT DEFAULT '689115595, 640194505',
          payment_instructions TEXT DEFAULT 'Send payment via MTN Mobile Money or Orange Money to any of our official merchant/business accounts. Retain the transaction ID for instant verification.',
          facebook_url TEXT DEFAULT 'https://facebook.com/madeccgroup',
          linkedin_url TEXT DEFAULT 'https://linkedin.com/company/madecc-group',
          instagram_url TEXT DEFAULT 'https://instagram.com/madeccgroup',
          youtube_url TEXT DEFAULT 'https://youtube.com/@madeccgroup',
          twitter_url TEXT DEFAULT 'https://x.com/madeccgroup',
          tiktok_url TEXT DEFAULT 'https://tiktok.com/@madeccgroup',
          pinterest_url TEXT DEFAULT 'https://pinterest.com/madeccgroup',
          share_headline TEXT DEFAULT 'MADECC GROUP — Premier Construction & Engineering',
          share_description TEXT DEFAULT 'Leading Cameroonian construction, civil engineering and project management firm.',
          logo_url TEXT,
          favicon_url TEXT,
          legal_status TEXT DEFAULT 'SARL (Société à Responsabilité Limitée)',
          rccm_number TEXT DEFAULT 'RC/YAO/2023/B/1458',
          niu_tax_id TEXT DEFAULT 'M072318492019A',
          theme_settings JSONB DEFAULT '{}'::jsonb,
          global_seo JSONB DEFAULT '{"seoTitle":"MADECC GROUP — Premier Construction & Civil Engineering","metaDescription":"Leading Cameroonian construction and engineering firm. Eurocode 2 standards, certified concrete batching, and turnkey execution.","robotsIndex":true}'::jsonb,
          navigation_links JSONB DEFAULT '[]'::jsonb,
          footer_content JSONB DEFAULT '{"aboutText":"MADECC GROUP is a premier engineering, construction and project delivery conglomerate in Cameroon.","copyrightText":"© 2026 MADECC GROUP. All Rights Reserved."}'::jsonb,
          emergency_banner JSONB DEFAULT '{"enabled":false,"message":"","badgeType":"INFO"}'::jsonb,
          updated_by TEXT DEFAULT 'Kasah Rodrick Reboya',
          updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL
        );
      `);

      // 2. Safe incremental column additions for backwards compatibility with any existing tables
      const columnsToAdd = [
        "site_name TEXT DEFAULT 'MADECC GROUP'",
        "tagline TEXT DEFAULT 'Premier Engineering, Construction & Project Management in Cameroon'",
        "developer_name TEXT DEFAULT 'Kasah Rodrick Reboya'",
        "phone TEXT DEFAULT '+237 683 31 64 86'",
        "phone_secondary TEXT DEFAULT '+237 671 063 511'",
        "phone_tertiary TEXT DEFAULT '+237 640 194 505'",
        "emergency_phone TEXT DEFAULT '+237 683 31 64 86'",
        "email TEXT DEFAULT 'kreboya603@gmail.com'",
        "secondary_email TEXT DEFAULT 'Infomadeccconstruction@gmail.com'",
        "office_address_yaounde TEXT DEFAULT 'Mbankolo, Yaoundé, Centre Region, Cameroon'",
        "office_address_douala TEXT DEFAULT 'Akwa, Douala, Littoral Region, Cameroon'",
        "business_hours TEXT DEFAULT 'Mon - Fri: 08:00 - 18:00 | Sat: 08:30 - 14:00 (GMT+1)'",
        "whatsapp_number TEXT DEFAULT '+237 683 31 64 86'",
        "whatsapp_secondary TEXT DEFAULT '+237 671 063 511'",
        "payment_mtn_numbers TEXT DEFAULT '671063511, 683316486, 671289643'",
        "payment_orange_numbers TEXT DEFAULT '689115595, 640194505'",
        "payment_instructions TEXT DEFAULT 'Send payment via MTN Mobile Money or Orange Money to any of our official merchant/business accounts. Retain the transaction ID for instant verification.'",
        "facebook_url TEXT DEFAULT 'https://facebook.com/madeccgroup'",
        "linkedin_url TEXT DEFAULT 'https://linkedin.com/company/madecc-group'",
        "instagram_url TEXT DEFAULT 'https://instagram.com/madeccgroup'",
        "youtube_url TEXT DEFAULT 'https://youtube.com/@madeccgroup'",
        "twitter_url TEXT DEFAULT 'https://x.com/madeccgroup'",
        "tiktok_url TEXT DEFAULT 'https://tiktok.com/@madeccgroup'",
        "pinterest_url TEXT DEFAULT 'https://pinterest.com/madeccgroup'",
        "share_headline TEXT DEFAULT 'MADECC GROUP — Premier Construction & Engineering'",
        "share_description TEXT DEFAULT 'Leading Cameroonian construction, civil engineering and project management firm.'",
        "logo_url TEXT",
        "favicon_url TEXT",
        "legal_status TEXT DEFAULT 'SARL (Société à Responsabilité Limitée)'",
        "rccm_number TEXT DEFAULT 'RC/YAO/2023/B/1458'",
        "niu_tax_id TEXT DEFAULT 'M072318492019A'",
        "theme_settings JSONB DEFAULT '{}'::jsonb",
        "global_seo JSONB DEFAULT '{\"seoTitle\":\"MADECC GROUP — Premier Construction & Civil Engineering\",\"metaDescription\":\"Leading Cameroonian construction and engineering firm. Eurocode 2 standards, certified concrete batching, and turnkey execution.\",\"robotsIndex\":true}'::jsonb",
        "navigation_links JSONB DEFAULT '[]'::jsonb",
        "footer_content JSONB DEFAULT '{\"aboutText\":\"MADECC GROUP is a premier engineering, construction and project delivery conglomerate in Cameroon.\",\"copyrightText\":\"© 2026 MADECC GROUP. All Rights Reserved.\"}'::jsonb",
        "emergency_banner JSONB DEFAULT '{\"enabled\":false,\"message\":\"\",\"badgeType\":\"INFO\"}'::jsonb",
        "updated_by TEXT DEFAULT 'Kasah Rodrick Reboya'",
        "updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()"
      ];

      for (const colDef of columnsToAdd) {
        const colName = colDef.split(' ')[0];
        await client.query(`ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS ${colName} ${colDef.substring(colName.length)};`);
      }

      // 3. Ensure singleton record with ID = 1 exists
      await client.query(`
        INSERT INTO site_settings (
          id, site_name, tagline, developer_name, phone, phone_secondary, phone_tertiary,
          emergency_phone, email, secondary_email, office_address_yaounde, office_address_douala,
          business_hours, whatsapp_number, whatsapp_secondary, payment_mtn_numbers,
          payment_orange_numbers, payment_instructions, facebook_url, linkedin_url,
          instagram_url, youtube_url, twitter_url, tiktok_url, pinterest_url,
          share_headline, share_description, logo_url, favicon_url, legal_status,
          rccm_number, niu_tax_id, theme_settings, global_seo, navigation_links,
          footer_content, emergency_banner, updated_by
        ) VALUES (
          1,
          'MADECC GROUP',
          'Premier Engineering, Construction & Project Management in Cameroon',
          'Kasah Rodrick Reboya',
          '+237 683 31 64 86',
          '+237 671 063 511',
          '+237 640 194 505',
          '+237 683 31 64 86',
          'kreboya603@gmail.com',
          'Infomadeccconstruction@gmail.com',
          'Mbankolo, Yaoundé, Centre Region, Cameroon',
          'Akwa, Douala, Littoral Region, Cameroon',
          'Mon - Fri: 08:00 - 18:00 | Sat: 08:30 - 14:00 (GMT+1)',
          '+237 683 31 64 86',
          '+237 671 063 511',
          '671063511, 683316486, 671289643',
          '689115595, 640194505',
          'Send payment via MTN Mobile Money or Orange Money to any of our official merchant/business accounts. Retain the transaction ID for instant verification.',
          'https://facebook.com/madeccgroup',
          'https://linkedin.com/company/madecc-group',
          'https://instagram.com/madeccgroup',
          'https://youtube.com/@madeccgroup',
          'https://x.com/madeccgroup',
          'https://tiktok.com/@madeccgroup',
          'https://pinterest.com/madeccgroup',
          'MADECC GROUP — Premier Construction & Engineering',
          'Leading Cameroonian construction, civil engineering and project management firm.',
          '/uploads/madecc-logo.png',
          '/favicon.ico',
          'SARL (Société à Responsabilité Limitée)',
          'RC/YAO/2023/B/1458',
          'M072318492019A',
          '{"primaryColor":"#002B49","accentColor":"#D99B26","fontHeading":"Cabinet Grotesk","fontBody":"Inter","borderRadius":"8px"}'::jsonb,
          '{"seoTitle":"MADECC GROUP — Premier Construction & Civil Engineering in Cameroon","metaDescription":"Leading Cameroonian construction and engineering firm. Eurocode 2 standards, certified concrete batching, and turnkey execution.","robotsIndex":true}'::jsonb,
          '[]'::jsonb,
          '{"aboutText":"MADECC GROUP is a premier engineering, construction and project delivery conglomerate in Cameroon.","copyrightText":"© 2026 MADECC GROUP. All Rights Reserved."}'::jsonb,
          '{"enabled":false,"message":"","badgeType":"INFO"}'::jsonb,
          'Kasah Rodrick Reboya'
        )
        ON CONFLICT (id) DO NOTHING;
      `);

      tableEnsured = true;
      console.log('✅ [DATABASE] site_settings table schema verified and initialized.');
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error('⚠️ [DATABASE ERROR] Failed verifying site_settings table:', err.message);
  }
}

/**
 * Transforms a raw database row (snake_case) into a camelCase siteSettings object
 */
export function formatSiteSettingsRow(row: any): SiteSettingsData {
  if (!row) {
    return { id: 1, ...CANONICAL_SITE_SETTINGS };
  }
  return {
    id: row.id ?? 1,
    siteName: row.site_name ?? row.siteName ?? CANONICAL_SITE_SETTINGS.siteName,
    tagline: row.tagline ?? CANONICAL_SITE_SETTINGS.tagline,
    developerName: row.developer_name ?? row.developerName ?? CANONICAL_SITE_SETTINGS.developerName,
    phone: row.phone ?? CANONICAL_SITE_SETTINGS.phone,
    phoneSecondary: row.phone_secondary ?? row.phoneSecondary ?? CANONICAL_SITE_SETTINGS.phoneSecondary,
    phoneTertiary: row.phone_tertiary ?? row.phoneTertiary ?? CANONICAL_SITE_SETTINGS.phoneTertiary,
    emergencyPhone: row.emergency_phone ?? row.emergencyPhone ?? CANONICAL_SITE_SETTINGS.emergencyPhone,
    email: row.email ?? CANONICAL_SITE_SETTINGS.email,
    secondaryEmail: row.secondary_email ?? row.secondaryEmail ?? CANONICAL_SITE_SETTINGS.secondaryEmail,
    officeAddressYaounde: row.office_address_yaounde ?? row.officeAddressYaounde ?? CANONICAL_SITE_SETTINGS.officeAddressYaounde,
    officeAddressDouala: row.office_address_douala ?? row.officeAddressDouala ?? CANONICAL_SITE_SETTINGS.officeAddressDouala,
    businessHours: row.business_hours ?? row.businessHours ?? CANONICAL_SITE_SETTINGS.businessHours,
    whatsappNumber: row.whatsapp_number ?? row.whatsappNumber ?? CANONICAL_SITE_SETTINGS.whatsappNumber,
    whatsappSecondary: row.whatsapp_secondary ?? row.whatsappSecondary ?? CANONICAL_SITE_SETTINGS.whatsappSecondary,
    paymentMtnNumbers: row.payment_mtn_numbers ?? row.paymentMtnNumbers ?? CANONICAL_SITE_SETTINGS.paymentMtnNumbers,
    paymentOrangeNumbers: row.payment_orange_numbers ?? row.paymentOrangeNumbers ?? CANONICAL_SITE_SETTINGS.paymentOrangeNumbers,
    paymentInstructions: row.payment_instructions ?? row.paymentInstructions ?? CANONICAL_SITE_SETTINGS.paymentInstructions,
    facebookUrl: row.facebook_url ?? row.facebookUrl ?? CANONICAL_SITE_SETTINGS.facebookUrl,
    linkedinUrl: row.linkedin_url ?? row.linkedinUrl ?? CANONICAL_SITE_SETTINGS.linkedinUrl,
    instagramUrl: row.instagram_url ?? row.instagramUrl ?? CANONICAL_SITE_SETTINGS.instagramUrl,
    youtubeUrl: row.youtube_url ?? row.youtubeUrl ?? CANONICAL_SITE_SETTINGS.youtubeUrl,
    twitterUrl: row.twitter_url ?? row.twitterUrl ?? CANONICAL_SITE_SETTINGS.twitterUrl,
    tiktokUrl: row.tiktok_url ?? row.tiktokUrl ?? CANONICAL_SITE_SETTINGS.tiktokUrl,
    pinterestUrl: row.pinterest_url ?? row.pinterestUrl ?? CANONICAL_SITE_SETTINGS.pinterestUrl,
    shareHeadline: row.share_headline ?? row.shareHeadline ?? CANONICAL_SITE_SETTINGS.shareHeadline,
    shareDescription: row.share_description ?? row.shareDescription ?? CANONICAL_SITE_SETTINGS.shareDescription,
    logoUrl: row.logo_url ?? row.logoUrl ?? CANONICAL_SITE_SETTINGS.logoUrl,
    faviconUrl: row.favicon_url ?? row.faviconUrl ?? CANONICAL_SITE_SETTINGS.faviconUrl,
    legalStatus: row.legal_status ?? row.legalStatus ?? CANONICAL_SITE_SETTINGS.legalStatus,
    rccmNumber: row.rccm_number ?? row.rccmNumber ?? CANONICAL_SITE_SETTINGS.rccmNumber,
    niuTaxId: row.niu_tax_id ?? row.niuTaxId ?? CANONICAL_SITE_SETTINGS.niuTaxId,
    themeSettings: row.theme_settings ?? row.themeSettings ?? CANONICAL_SITE_SETTINGS.themeSettings,
    globalSeo: row.global_seo ?? row.globalSeo ?? CANONICAL_SITE_SETTINGS.globalSeo,
    navigationLinks: row.navigation_links ?? row.navigationLinks ?? CANONICAL_SITE_SETTINGS.navigationLinks,
    footerContent: row.footer_content ?? row.footerContent ?? CANONICAL_SITE_SETTINGS.footerContent,
    emergencyBanner: row.emergency_banner ?? row.emergencyBanner ?? CANONICAL_SITE_SETTINGS.emergencyBanner,
    updatedBy: row.updated_by ?? row.updatedBy ?? CANONICAL_SITE_SETTINGS.updatedBy,
    updatedAt: row.updated_at ?? row.updatedAt ?? new Date()
  };
}

/**
 * Retrieves the singleton site settings record.
 * Guarantees that if the table or row does not exist, it initializes it automatically.
 */
export async function getSiteSettings(): Promise<SiteSettingsData> {
  if (!tableEnsured) {
    await ensureSiteSettingsTable();
  }

  const activePool = pool || getOrInitPool();
  try {
    if (activePool) {
      const result = await activePool.query('SELECT * FROM site_settings ORDER BY id ASC LIMIT 1;');
      if (result.rows.length > 0) {
        return formatSiteSettingsRow(result.rows[0]);
      }
    } else {
      const records = await db.select().from(siteSettings).limit(1);
      if (records.length > 0) {
        return formatSiteSettingsRow(records[0]);
      }
    }
  } catch (err: any) {
    console.warn('[SITE_SETTINGS] Query failed, attempting auto-repair:', err.message);
    await ensureSiteSettingsTable();
    const retryPool = pool || getOrInitPool();
    if (retryPool) {
      const retryResult = await retryPool.query('SELECT * FROM site_settings ORDER BY id ASC LIMIT 1;');
      if (retryResult.rows.length > 0) {
        return formatSiteSettingsRow(retryResult.rows[0]);
      }
    }
  }

  return { id: 1, ...CANONICAL_SITE_SETTINGS };
}

/**
 * Atomically upserts the singleton site settings record (id = 1).
 */
export async function upsertSiteSettings(
  inputData: Partial<SiteSettingsData>,
  updatedBy: string = 'Kasah Rodrick Reboya'
): Promise<SiteSettingsData> {
  if (!tableEnsured) {
    await ensureSiteSettingsTable();
  }

  // Retrieve current settings to blend partial updates
  const current = await getSiteSettings();

  const merged = {
    siteName: inputData.siteName !== undefined ? inputData.siteName : current.siteName,
    tagline: inputData.tagline !== undefined ? inputData.tagline : current.tagline,
    developerName: inputData.developerName !== undefined ? inputData.developerName : current.developerName,
    phone: inputData.phone !== undefined ? inputData.phone : current.phone,
    phoneSecondary: inputData.phoneSecondary !== undefined ? inputData.phoneSecondary : current.phoneSecondary,
    phoneTertiary: inputData.phoneTertiary !== undefined ? inputData.phoneTertiary : current.phoneTertiary,
    emergencyPhone: inputData.emergencyPhone !== undefined ? inputData.emergencyPhone : current.emergencyPhone,
    email: inputData.email !== undefined ? inputData.email : current.email,
    secondaryEmail: inputData.secondaryEmail !== undefined ? inputData.secondaryEmail : current.secondaryEmail,
    officeAddressYaounde: inputData.officeAddressYaounde !== undefined ? inputData.officeAddressYaounde : current.officeAddressYaounde,
    officeAddressDouala: inputData.officeAddressDouala !== undefined ? inputData.officeAddressDouala : current.officeAddressDouala,
    businessHours: inputData.businessHours !== undefined ? inputData.businessHours : current.businessHours,
    whatsappNumber: inputData.whatsappNumber !== undefined ? inputData.whatsappNumber : current.whatsappNumber,
    whatsappSecondary: inputData.whatsappSecondary !== undefined ? inputData.whatsappSecondary : current.whatsappSecondary,
    paymentMtnNumbers: inputData.paymentMtnNumbers !== undefined ? inputData.paymentMtnNumbers : current.paymentMtnNumbers,
    paymentOrangeNumbers: inputData.paymentOrangeNumbers !== undefined ? inputData.paymentOrangeNumbers : current.paymentOrangeNumbers,
    paymentInstructions: inputData.paymentInstructions !== undefined ? inputData.paymentInstructions : current.paymentInstructions,
    facebookUrl: inputData.facebookUrl !== undefined ? inputData.facebookUrl : current.facebookUrl,
    linkedinUrl: inputData.linkedinUrl !== undefined ? inputData.linkedinUrl : current.linkedinUrl,
    instagramUrl: inputData.instagramUrl !== undefined ? inputData.instagramUrl : current.instagramUrl,
    youtubeUrl: inputData.youtubeUrl !== undefined ? inputData.youtubeUrl : current.youtubeUrl,
    twitterUrl: inputData.twitterUrl !== undefined ? inputData.twitterUrl : current.twitterUrl,
    tiktokUrl: inputData.tiktokUrl !== undefined ? inputData.tiktokUrl : current.tiktokUrl,
    pinterestUrl: inputData.pinterestUrl !== undefined ? inputData.pinterestUrl : current.pinterestUrl,
    shareHeadline: inputData.shareHeadline !== undefined ? inputData.shareHeadline : current.shareHeadline,
    shareDescription: inputData.shareDescription !== undefined ? inputData.shareDescription : current.shareDescription,
    logoUrl: inputData.logoUrl !== undefined ? inputData.logoUrl : current.logoUrl,
    faviconUrl: inputData.faviconUrl !== undefined ? inputData.faviconUrl : current.faviconUrl,
    legalStatus: inputData.legalStatus !== undefined ? inputData.legalStatus : current.legalStatus,
    rccmNumber: inputData.rccmNumber !== undefined ? inputData.rccmNumber : current.rccmNumber,
    niuTaxId: inputData.niuTaxId !== undefined ? inputData.niuTaxId : current.niuTaxId,
    themeSettings: inputData.themeSettings !== undefined ? inputData.themeSettings : current.themeSettings,
    globalSeo: inputData.globalSeo !== undefined ? inputData.globalSeo : current.globalSeo,
    navigationLinks: inputData.navigationLinks !== undefined ? inputData.navigationLinks : current.navigationLinks,
    footerContent: inputData.footerContent !== undefined ? inputData.footerContent : current.footerContent,
    emergencyBanner: inputData.emergencyBanner !== undefined ? inputData.emergencyBanner : current.emergencyBanner,
    updatedBy: updatedBy || current.updatedBy,
  };

  const activePool = pool || getOrInitPool();
  if (activePool) {
    const query = `
      INSERT INTO site_settings (
        id, site_name, tagline, developer_name, phone, phone_secondary, phone_tertiary,
        emergency_phone, email, secondary_email, office_address_yaounde, office_address_douala,
        business_hours, whatsapp_number, whatsapp_secondary, payment_mtn_numbers,
        payment_orange_numbers, payment_instructions, facebook_url, linkedin_url,
        instagram_url, youtube_url, twitter_url, tiktok_url, pinterest_url,
        share_headline, share_description, logo_url, favicon_url, legal_status,
        rccm_number, niu_tax_id, theme_settings, global_seo, navigation_links,
        footer_content, emergency_banner, updated_by, updated_at
      ) VALUES (
        1, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
        $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34,
        $35, $36, $37, NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        site_name = EXCLUDED.site_name,
        tagline = EXCLUDED.tagline,
        developer_name = EXCLUDED.developer_name,
        phone = EXCLUDED.phone,
        phone_secondary = EXCLUDED.phone_secondary,
        phone_tertiary = EXCLUDED.phone_tertiary,
        emergency_phone = EXCLUDED.emergency_phone,
        email = EXCLUDED.email,
        secondary_email = EXCLUDED.secondary_email,
        office_address_yaounde = EXCLUDED.office_address_yaounde,
        office_address_douala = EXCLUDED.office_address_douala,
        business_hours = EXCLUDED.business_hours,
        whatsapp_number = EXCLUDED.whatsapp_number,
        whatsapp_secondary = EXCLUDED.whatsapp_secondary,
        payment_mtn_numbers = EXCLUDED.payment_mtn_numbers,
        payment_orange_numbers = EXCLUDED.payment_orange_numbers,
        payment_instructions = EXCLUDED.payment_instructions,
        facebook_url = EXCLUDED.facebook_url,
        linkedin_url = EXCLUDED.linkedin_url,
        instagram_url = EXCLUDED.instagram_url,
        youtube_url = EXCLUDED.youtube_url,
        twitter_url = EXCLUDED.twitter_url,
        tiktok_url = EXCLUDED.tiktok_url,
        pinterest_url = EXCLUDED.pinterest_url,
        share_headline = EXCLUDED.share_headline,
        share_description = EXCLUDED.share_description,
        logo_url = EXCLUDED.logo_url,
        favicon_url = EXCLUDED.favicon_url,
        legal_status = EXCLUDED.legal_status,
        rccm_number = EXCLUDED.rccm_number,
        niu_tax_id = EXCLUDED.niu_tax_id,
        theme_settings = EXCLUDED.theme_settings,
        global_seo = EXCLUDED.global_seo,
        navigation_links = EXCLUDED.navigation_links,
        footer_content = EXCLUDED.footer_content,
        emergency_banner = EXCLUDED.emergency_banner,
        updated_by = EXCLUDED.updated_by,
        updated_at = NOW()
      RETURNING *;
    `;

    const values = [
      merged.siteName,
      merged.tagline,
      merged.developerName,
      merged.phone,
      merged.phoneSecondary,
      merged.phoneTertiary,
      merged.emergencyPhone,
      merged.email,
      merged.secondaryEmail,
      merged.officeAddressYaounde,
      merged.officeAddressDouala,
      merged.businessHours,
      merged.whatsappNumber,
      merged.whatsappSecondary,
      merged.paymentMtnNumbers,
      merged.paymentOrangeNumbers,
      merged.paymentInstructions,
      merged.facebookUrl,
      merged.linkedinUrl,
      merged.instagramUrl,
      merged.youtubeUrl,
      merged.twitterUrl,
      merged.tiktokUrl,
      merged.pinterestUrl,
      merged.shareHeadline,
      merged.shareDescription,
      merged.logoUrl,
      merged.faviconUrl,
      merged.legalStatus,
      merged.rccmNumber,
      merged.niuTaxId,
      typeof merged.themeSettings === 'object' ? JSON.stringify(merged.themeSettings) : merged.themeSettings,
      typeof merged.globalSeo === 'object' ? JSON.stringify(merged.globalSeo) : merged.globalSeo,
      typeof merged.navigationLinks === 'object' ? JSON.stringify(merged.navigationLinks) : merged.navigationLinks,
      typeof merged.footerContent === 'object' ? JSON.stringify(merged.footerContent) : merged.footerContent,
      typeof merged.emergencyBanner === 'object' ? JSON.stringify(merged.emergencyBanner) : merged.emergencyBanner,
      merged.updatedBy
    ];

    try {
      const res = await activePool.query(query, values);
      return formatSiteSettingsRow(res.rows[0]);
    } catch (err: any) {
      console.warn('[SITE_SETTINGS] Raw upsert failed, retrying after table repair:', err.message);
      await ensureSiteSettingsTable();
      const retryPool = pool || getOrInitPool();
      const retryRes = retryPool ? await retryPool.query(query, values) : await activePool.query(query, values);
      return formatSiteSettingsRow(retryRes.rows[0]);
    }
  }

  // Fallback to Drizzle if pool not directly available
  const existing = await db.select().from(siteSettings).where(eq(siteSettings.id, 1)).limit(1);
  if (existing.length > 0) {
    const updated = await db.update(siteSettings)
      .set({
        ...merged,
        updatedAt: new Date()
      })
      .where(eq(siteSettings.id, 1))
      .returning();
    return formatSiteSettingsRow(updated[0]);
  } else {
    const inserted = await db.insert(siteSettings).values({
      id: 1,
      ...merged,
      updatedAt: new Date()
    }).returning();
    return formatSiteSettingsRow(inserted[0]);
  }
}
