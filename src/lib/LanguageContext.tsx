import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'fr';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navbar
    nav_home: 'Home',
    nav_about: 'About Us',
    nav_projects: 'Projects & Contracts',
    nav_blog: 'Insights Portal',
    nav_contact: 'Contact Us',
    nav_booking: 'Schedule Bid',
    nav_admin: 'HQ Terminal',
    nav_login: 'HQ Log In',
    nav_logout: 'Log Out',
    nav_dashboard: 'Admin Dashboard',

    // Hero
    hero_badge: 'Enterprise Construction & Engineering',
    hero_title: 'Engineering the Future of African Infrastructure',
    hero_subtitle: 'MADECC Group delivers world-class civil engineering, structural design, and construction project management with total safety compliance and OHADA regulatory standards.',
    hero_cta_booking: 'Schedule Engineering Bid',
    hero_cta_projects: 'Explore Active Tenders',

    // General Words
    all: 'All',
    category: 'Category',
    loading: 'Loading...',
    back: 'Back',
    submit: 'Submit',

    // Contact Page
    contact_header_title: 'Contact Our Corporate Offices',
    contact_header_subtitle: 'Inquire about state tenders, general contracting services, safety compliance, or custom residential blueprint bids.',
    office_directory: 'Office Directory',
    headquarters_location: 'Headquarters Location',
    registered_address: 'Registered Address',
    corporate_hotlines: 'Corporate Hotlines',
    digital_inboxes: 'Digital Inboxes',
    working_hours: 'Working Operations Hours',
    send_message: 'Send Office Message',
    send_message_desc: 'Submit an immediate inquiry. We respond to all contract bids and tender inquiries within 24 working hours.',
    full_name: 'Your Full Name',
    email_address: 'Email Address',
    subject: 'Subject of Inquiry',
    message_text: 'Inquiry Message',
    antibot_title: 'Anti-Bot Human Verification',
    submit_btn: 'Dispatch Office Message',
    submitting_btn: 'Dispatching Message...',
    success_msg: 'Message Dispatched!',
    success_desc: 'Your message was successfully submitted to our office. Our directors will review it shortly.',
    submit_another: 'Submit Another Message',

    // Footer
    footer_tagline: 'MADECC GROUP is Cameroon\'s premier enterprise civil engineering contractor, constructing high-safety commercial infrastructure, transport networks, and urban developments.',
    footer_quick_links: 'Quick Navigation',
    footer_services: 'Corporate Divisions',
    footer_contact_info: 'Direct HQ Registry',
    footer_all_rights: 'MADECC GROUP. All project development rights reserved. Regulated under OHADA Construction Guidelines.'
  },
  fr: {
    // Navbar
    nav_home: 'Accueil',
    nav_about: 'À Propos',
    nav_projects: 'Projets & Marchés',
    nav_blog: 'Portail d\'Actualités',
    nav_contact: 'Contactez-Nous',
    nav_booking: 'Planifier Appel d\'Offre',
    nav_admin: 'Terminal QG',
    nav_login: 'Connexion QG',
    nav_logout: 'Déconnexion',
    nav_dashboard: 'Tableau de Bord',

    // Hero
    hero_badge: 'Construction et Ingénierie d\'Entreprise',
    hero_title: 'Concevoir l\'Avenir de l\'Infrastructure Africaine',
    hero_subtitle: 'MADECC Group fournit des services d\'ingénierie civile, de conception structurelle et de gestion de projets de construction de classe mondiale, dans le respect total des normes de sécurité et de la réglementation OHADA.',
    hero_cta_booking: 'Planifier Appel d\'Offre',
    hero_cta_projects: 'Découvrir les Marchés Actifs',

    // General Words
    all: 'Tout',
    category: 'Catégorie',
    loading: 'Chargement...',
    back: 'Retour',
    submit: 'Soumettre',

    // Contact Page
    contact_header_title: 'Contactez Nos Bureaux Nationaux',
    contact_header_subtitle: 'Renseignez-vous sur les appels d\'offres publics, les contrats généraux, la conformité de sécurité ou les plans résidentiels sur mesure.',
    office_directory: 'Annuaire des Bureaux',
    headquarters_location: 'Siège Social Principal',
    registered_address: 'Adresse Enregistrée',
    corporate_hotlines: 'Hotlines d\'Entreprise',
    digital_inboxes: 'Boîtes Réception Numériques',
    working_hours: 'Heures d\'Ouverture Opérationnelles',
    send_message: 'Envoyer un Message au Bureau',
    send_message_desc: 'Soumettez une demande immédiate. Nous répondons à toutes les offres et demandes d\'informations sous 24 heures ouvrables.',
    full_name: 'Votre Nom Complet',
    email_address: 'Adresse E-mail',
    subject: 'Sujet de votre Demande',
    message_text: 'Message de votre Demande',
    antibot_title: 'Vérification Humaine Anti-Robot',
    submit_btn: 'Expédier le Message',
    submitting_btn: 'Expédition du message...',
    success_msg: 'Message Envoyé !',
    success_desc: 'Votre message a été transmis avec succès à notre bureau. Nos directeurs l\'examineront sous peu.',
    submit_another: 'Envoyer un Nouveau Message',

    // Footer
    footer_tagline: 'MADECC GROUP est le premier entrepreneur en génie civil d\'entreprise du Cameroun, construisant des infrastructures commerciales de haute sécurité, des réseaux de transport et des développements urbains.',
    footer_quick_links: 'Navigation Rapide',
    footer_services: 'Divisions d\'Entreprise',
    footer_contact_info: 'Enregistrement Direct QG',
    footer_all_rights: 'MADECC GROUP. Tous droits de développement réservés. Réglementé selon les directives de construction de l\'OHADA.'
  }
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    // Default to English or browser language
    const browserLang = navigator.language.substring(0, 2);
    if (browserLang === 'fr') {
      setLanguageState('fr');
    } else {
      setLanguageState('en');
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    document.documentElement.lang = lang;
  };

  const t = (key: string): string => {
    return translations[language][key] || translations['en'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
