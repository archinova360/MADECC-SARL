import { numberToWordsFr } from './numberToWords';

export interface BoqItem {
  id?: string;
  itemNumber: string;
  description: string;
  unit: string;
  quantity: number;
  unitRate: number;
  amount: number;
  notes?: string;
}

export interface BoqSection {
  id?: string;
  sectionCode: string;
  title: string;
  subtotal: number;
  items: BoqItem[];
}

export interface BoqProject {
  id?: string;
  boqReference?: string;
  revisionNumber?: string;
  revisionDate?: string;
  revisionDescription?: string;
  projectName?: string;
  clientName?: string;
  location?: string;
  contractType?: string;
  datePrepared?: string;
  preparedBy?: string;
  qsVerification?: string;
  approvedBy?: string;
  chiefEngineer?: string;
  subtotal?: number;
  overheadPercent?: number;
  overheadAmount?: number;
  contingencyPercent?: number;
  contingencyAmount?: number;
  profitPercent?: number;
  profitAmount?: number;
  taxPercent?: number;
  taxAmount?: number;
  grandTotal?: number;
  currency?: string;
  amountInWords?: string;
  terms?: string;
  notes?: string;
  status?: string;
  sections?: BoqSection[];
  language?: 'en' | 'fr';
  isFrenchVersion?: boolean;
  metadata?: Record<string, any>;
  revisions?: any[];
}

// ----------------------------------------------------------------------
// 1. CIVIL ENGINEERING & QUANTITY SURVEYING BILINGUAL DICTIONARY
// ----------------------------------------------------------------------

const SECTION_TITLE_MAP: Record<string, string> = {
  'preliminaries & general': 'Installations de Chantier & Clauses Préliminaires',
  'preliminaries': 'Installations de Chantier & Préliminaires',
  'site mobilization': 'Mobilisation du Chantier & Études Techniques',
  'substructure': 'Infrastructures & Travaux de Fondations',
  'substructure works': 'Infrastructures & Travaux de Fondations',
  'substructure / foundation works': 'Infrastructures & Travaux de Fondations',
  'foundations': 'Fondations & Travaux Souterrains',
  'foundation works': 'Ouvrages de Fondations & Béton de Propreté',
  'earthworks': 'Terrassements, Fouilles & Nivellement',
  'excavation & earthworks': 'Terrassements, Fouilles & Remblais',
  'superstructure': 'Superstructure & Élévations',
  'superstructure concrete': 'Superstructure & Béton Armé (Poteaux, Poutres, Dalles)',
  'concrete works': 'Ouvrages en Béton Armé',
  'reinforced concrete': 'Béton Armé & Aciers à Haute Adhérence',
  'blockwork': 'Maçonnerie en Agglomérés de Ciment',
  'masonry': 'Maçonnerie, Murs & Élévations',
  'blockwork / masonry': 'Maçonnerie en Agglomérés de Ciment & Cloisons',
  'walling': 'Maçonnerie & Muraillement',
  'roofing & carpentry': 'Charpente, Couverture & Étanchéité',
  'roofing': 'Couverture & Étanchéité de Toiture',
  'carpentry & joinery': 'Charpente Bois & Menuiserie',
  'doors & windows': 'Menuiserie Métallique, Aluminium & Bois (Portes & Fenêtres)',
  'joinery & metal works': 'Menuiserie Bois & Métallique',
  'finishes': 'Revêtements & Finitions Générales',
  'wall & floor finishes': 'Revêtements Muraux & Carrelage Sols',
  'floor finishes': 'Revêtements des Sols & Chapes',
  'wall finishes': 'Enduits & Revêtements Muraux',
  'painting & decoration': 'Peinture, Décoration & Vitrerie',
  'painting & glazing': 'Peinture & Vitrerie',
  'painting': 'Travaux de Peinture & Finitions',
  'plumbing & drainage': 'Plomberie Sanitaire, Évacuations & Assainissement',
  'plumbing & sanitary': 'Plomberie & Installations Sanitaires',
  'sanitary fittings': 'Appareils Sanitaires & Robinetterie',
  'electrical installation': 'Installations Électriques & Courants Faibles',
  'electrical works': 'Électricité Générale & Réseau Électrique',
  'external works': 'Voiries, Réseaux Divers (VRD) & Clôture',
  'external works / drainage': 'VRD, Assainissement Extérieur & Drainage',
  'drainage works': 'Réseaux d\'Assainissement & Caniveaux',
  'landscaping & paving': 'Aménagements Paysagers & Pavage Extérieur',
  'mechanical installations': 'Installations Mécaniques & Climatisation',
  'workshop equipment': 'Équipements & Outillage d\'Atelier Technique',
  'workshop practice materials command': 'Fourniture de Matériaux et Équipements de Travaux Pratiques d\'Atelier'
};

const UNIT_MAP: Record<string, string> = {
  'm2': 'm²',
  'sqm': 'm²',
  'sq.m': 'm²',
  'm²': 'm²',
  'm3': 'm³',
  'cum': 'm³',
  'cu.m': 'm³',
  'm³': 'm³',
  'lm': 'ml',
  'lin.m': 'ml',
  'linear meter': 'ml',
  'meter': 'ml',
  'm': 'ml',
  'no': 'U',
  'no.': 'U',
  'item': 'U',
  'each': 'U',
  'nr': 'U',
  'nr.': 'U',
  'pcs': 'U',
  'unit': 'U',
  'ls': 'Fft',
  'lump sum': 'Fft',
  'sum': 'Fft',
  'fft': 'Fft',
  'kg': 'kg',
  'kg.': 'kg',
  'ton': 't',
  'tonne': 't',
  'tonnes': 't',
  't': 't',
  'day': 'j',
  'days': 'j',
  'hr': 'h',
  'hrs': 'h',
  'hours': 'h',
  'month': 'mois',
  'months': 'mois',
  'bag': 'sac',
  'bags': 'sacs',
  'trip': 'voyage',
  'trips': 'voyages',
  'set': 'lot',
  'lot': 'lot',
  'ens': 'ens'
};

const CONTRACT_TYPE_MAP: Record<string, string> = {
  'UNIT_RATE': 'BORDEREAU DE PRIX UNITAIRES (BPU)',
  'LUMP_SUM': 'MARCHÉ FORFAITAIRE GLOBAL & INVARIABLE',
  'COST_PLUS': 'DÉPENSES CONTRÔLÉES (EN RÉGIE)',
  'MEASURED': 'MÉTRÉ SUR ATTACHEMENT'
};

const STATUS_MAP: Record<string, string> = {
  'DRAFT': 'BROUILLON',
  'PENDING_REVIEW': 'EN ATTENTE DE VALIDATION',
  'APPROVED': 'APPROUVÉ & CERTIFIÉ',
  'REJECTED': 'REJETÉ',
  'REVISED': 'RÉVISÉ'
};

// ----------------------------------------------------------------------
// 2. TECHNICAL PHRASE & VOCABULARY REPLACEMENT RULES
// ----------------------------------------------------------------------

const PHRASE_REPLACEMENTS: [RegExp, string][] = [
  // Core actions
  [/\bSupply and (install|lay|fix|place|erect|apply)\b/gi, 'Fourniture et pose de'],
  [/\bSupply and delivery of\b/gi, 'Fourniture et livraison sur site de'],
  [/\bSupply, transport and installation of\b/gi, 'Fourniture, transport et mise en œuvre de'],
  [/\bSupply of\b/gi, 'Fourniture de'],
  [/\bProvide and place\b/gi, 'Fourniture et mise en place de'],
  [/\bErect and dismantle\b/gi, 'Montage et démontage de'],
  [/\bApply two coats of\b/gi, 'Application de deux couches de'],
  [/\bApply three coats of\b/gi, 'Application de trois couches de'],

  // Earthworks & Substructure
  [/\bSite clearance and grubbing\b/gi, 'Débroussaillage, abattage d\'arbres et décapage de la terre végétale'],
  [/\bSite clearance\b/gi, 'Nettoyage et décapage de l\'emprise du chantier'],
  [/\bExcavation in trenches for strip foundations\b/gi, 'Fouilles en rigoles pour semelles filantes'],
  [/\bExcavation in pit for isolated column footings\b/gi, 'Fouilles en puits pour semelles isolées de poteaux'],
  [/\bExcavate trench in ordinary soil\b/gi, 'Fouilles en rigoles dans terrain de consistance ordinaire'],
  [/\bTrench excavation\b/gi, 'Fouilles en rigoles'],
  [/\bBulk excavation\b/gi, 'Fouilles en pleine masse'],
  [/\bHardcore filling thoroughly compacted\b/gi, 'Remblai en tout-venant sélectionné compacté par couches de 20cm'],
  [/\bBackfilling around foundations\b/gi, 'Remblaiement des fouilles et abords des fondations'],
  [/\bBackfilling\b/gi, 'Remblais et compactage'],
  [/\bBlinding concrete (thickness|thick)? ?50mm\b/gi, 'Béton de propreté dosé à 150 kg/m³ d\'épaisseur 5cm'],
  [/\bBlinding concrete\b/gi, 'Béton de propreté dosé à 150 kg/m³'],
  [/\bDamp proof membrane \(DPM\)\b/gi, 'Film polyane imperméabilisant (étanchéité sous dallage)'],
  [/\bDamp proof course \(DPC\)\b/gi, 'Chape d\'étanchéité arase étanche (DPC)'],

  // Concrete & Reinforcement
  [/\bReinforced concrete grade 25\/30\b/gi, 'Béton armé de classe C25/30 dosé à 350 kg/m³ de ciment CPJ 42.5'],
  [/\bReinforced concrete grade 20\/25\b/gi, 'Béton armé de classe C20/25 dosé à 350 kg/m³'],
  [/\bReinforced concrete in pad footings\b/gi, 'Béton armé pour semelles isolées'],
  [/\bReinforced concrete in ground beams\b/gi, 'Béton armé pour longrines de fondation'],
  [/\bReinforced concrete in columns\b/gi, 'Béton armé coulé pour poteaux porteurs'],
  [/\bReinforced concrete in suspended beams\b/gi, 'Béton armé pour poutres et chaînages suspendus'],
  [/\bReinforced concrete in suspended slab\b/gi, 'Béton armé pour dalle pleine ou corps creux'],
  [/\bMass concrete\b/gi, 'Béton non armé dosé à 250 kg/m³'],
  [/\bHigh tensile steel reinforcement bars \(Y8, Y10, Y12, Y16, Y20\)\b/gi, 'Aciers à haute adhérence FeE400/500 façonnés (HA 8, 10, 12, 16, 20)'],
  [/\bHigh tensile steel reinforcement\b/gi, 'Armatures en aciers à haute adhérence pour béton armé'],
  [/\bMild steel round bars\b/gi, 'Aciers ronds lisses pour cadres et étriers'],
  [/\bBRC mesh fabric reinforcement\b/gi, 'Treillis soudé métallique pour dallage de sol'],
  [/\bSawn timber formwork to sides and soffits\b/gi, 'Coffrage soigné en planches de bois traité pour joues et sous-faces'],
  [/\bFormwork to column sides\b/gi, 'Coffrage soigné des faces de poteaux'],
  [/\bFormwork to slab soffits\b/gi, 'Coffrage des sous-faces de dalles avec étaiement métallique'],
  [/\bFormwork\b/gi, 'Coffrage soigné en bois ou métallique avec étais'],

  // Masonry
  [/\b15cm hollow concrete blocks bedded in cement mortar\b/gi, 'Maçonnerie en agglomérés creux de 15x20x40 cm posés au mortier de ciment dosé à 350 kg/m³'],
  [/\b20cm hollow concrete blocks\b/gi, 'Maçonnerie en agglomérés creux de 20x20x40 cm'],
  [/\b10cm hollow concrete blocks for partitions\b/gi, 'Cloisons en agglos creux de 10x20x40 cm'],
  [/\bSolid concrete blocks 15cm\b/gi, 'Maçonnerie en agglomérés pleins de 15 cm'],
  [/\bCement-sand mortar 1:4\b/gi, 'Mortier de ciment dosé à 350-400 kg/m³'],

  // Roofing & Carpentry
  [/\bTreated hardwood timber trusses\b/gi, 'Fermes de charpente en bois dur traité (Essingan / Bilinga / Iroko)'],
  [/\bHardwood rafters, purlins and wall plates\b/gi, 'Pannes, chevrons et sablières en bois dur traité insecticide et fongicide'],
  [/\bAluzinc roofing corrugated sheets gauge 28\b/gi, 'Couverture en tôles bacs alu-zinc prélaquées 5/10ème (gauge 28)'],
  [/\bCorrugated iron sheets\b/gi, 'Tôles ondulées galvanisées'],
  [/\bRidge caps and valley gutters\b/gi, 'Faîtières en tôle pliée et noues d\'étanchéité'],
  [/\bFascia board in treated timber\b/gi, 'Planches de rive en bois dur raboté et traité'],

  // Openings & Joinery
  [/\bFlush wooden doors\b/gi, 'Portes isoplanes intérieures en bois massif avec chambranles'],
  [/\bHardwood paneled front entrance door\b/gi, 'Porte d\'entrée principale pleine à panneaux en bois dur noble'],
  [/\bGlazed aluminum sliding windows with mosquito mesh\b/gi, 'Fenêtres coulissantes en profilés aluminium laqué vitrées avec moustiquaire'],
  [/\bAluminum sliding doors\b/gi, 'Baies vitrées coulissantes en aluminium laqué'],
  [/\bBurglar proof steel grilles\b/gi, 'Grilles de protection antivol en fer forgé / profilés métalliques'],
  [/\bMortise lockset with handles and brass cylinder\b/gi, 'Serrure à mortaiser de sûreté à canon européen avec poignées'],

  // Finishes
  [/\bCement-sand plastering 15mm thick to internal walls\b/gi, 'Enduit intérieur au mortier de ciment ép. 15mm taloché fin'],
  [/\bExternal weather-resistant cement rendering\b/gi, 'Enduit extérieur au mortier de ciment hydrofugé avec crépi'],
  [/\bInternal plastering\b/gi, 'Enduit intérieur au mortier de ciment'],
  [/\bExternal rendering\b/gi, 'Enduit extérieur imperméabilisé'],
  [/\bCeramic floor tiles 60x60cm\b/gi, 'Revêtement de sol en grès cérame 60x60 cm antidérapant avec plinthes'],
  [/\bCeramic floor tiles\b/gi, 'Carrelage au sol en grès cérame émaillé'],
  [/\bGlazed ceramic wall tiles to wet areas\b/gi, 'Faïence murale vitrifiée pour pièces humides (cuisine et salles d\'eau)'],
  [/\bEmulsion paint on primed surfaces \(two coats\)\b/gi, 'Peinture émulsion acrylique mate deux couches sur primaire d\'accrochage'],
  [/\bOil-based gloss paint to metal and woodwork\b/gi, 'Peinture laquée glycérophtalique satinée pour menuiseries bois et métal'],

  // Plumbing & Sanitaires
  [/\buPVC drainage pipe diameter 110mm\b/gi, 'Canalisation d\'évacuation des eaux usées en PVC Ø110 mm'],
  [/\buPVC drainage pipe diameter 63mm\b/gi, 'Canalisation d\'évacuation en PVC Ø63 mm'],
  [/\bPPR cold and hot water pipe diameter 25mm\b/gi, 'Tuyauterie d\'alimentation en polypropylène réticulé PPR Ø25 mm'],
  [/\bComplete porcelain water closet suite with dual flush\b/gi, 'Ensemble cuvette WC en porcelaine vitrifiée avec réservoir à double commande 3/6L'],
  [/\bPedestal wash hand basin with chrome plated mixer tap\b/gi, 'Lavabo sur colonne en porcelaine vitrifiée avec mitigeur chromé et bonde'],
  [/\bStainless steel double bowl kitchen sink with drainer\b/gi, 'Évier de cuisine à deux bacs avec égouttoir en inox avec mitigeur col de cygne'],
  [/\bSeptic tank and soakaway pit construction\b/gi, 'Construction de fosse septique toutes eaux et puits perdu en béton armé'],

  // Electrical
  [/\bMain distribution board 12-way complete with MCBs and RCCB\b/gi, 'Coffret de distribution principal modulaire équipé de disjoncteurs et différentiel 30mA'],
  [/\bLight point wired with 1.5mm2 copper cable\b/gi, 'Point lumineux câblé sous conduit annelé avec conducteurs TH 1,5 mm²'],
  [/\b16A twin socket outlet point wired with 2.5mm2 cable\b/gi, 'Prise de courant confort 2P+T 16A câblée en fils cuivre 2,5 mm²'],
  [/\bAir conditioner power point with isolator\b/gi, 'Alimentation dédiée pour climatiseur avec disjoncteur différentiel 20A'],
  [/\bLED recessed ceiling spotlight 18W\b/gi, 'Spot LED encastré au plafond 18W haute luminosité'],
  [/\bEarthing installation with copper earth rod\b/gi, 'Prise de terre complète avec piquet de terre en cuivre et barrette de coupure'],

  // General vocabulary
  [/\bAll materials, labor, equipment and hoisting\b/gi, 'Toutes fournitures, main-d\'œuvre qualifiée, matériel et sujétions'],
  [/\bComplete with all accessories and connections\b/gi, 'Complet avec toutes pièces de raccordement, fixations et accessoires'],
  [/\bTesting and commissioning\b/gi, 'Essais, contrôles de conformité et mise en service'],
  [/\bincluding all accessories\b/gi, 'y compris tous accessoires de pose et raccordements'],
  [/\bincluding excavation\b/gi, 'y compris fouilles et terrassements nécessaires'],
  [/\bin accordance with engineering specifications\b/gi, 'conformément aux règles de l\'art et aux prescriptions techniques (CCTP)']
];

// ----------------------------------------------------------------------
// 3. TRANSLATION LOGIC
// ----------------------------------------------------------------------

export function translateTextToFrench(text: string): string {
  if (!text || typeof text !== 'string') return '';
  let result = text.trim();

  // 1. Direct dictionary check
  const lower = result.toLowerCase();
  if (SECTION_TITLE_MAP[lower]) {
    return SECTION_TITLE_MAP[lower];
  }

  // 2. Apply civil engineering regex patterns
  for (const [pattern, replacement] of PHRASE_REPLACEMENTS) {
    result = result.replace(pattern, replacement);
  }

  // Common keyword fallback replacements
  result = result
    .replace(/\bExcavation\b/gi, 'Fouille')
    .replace(/\bReinforced concrete\b/gi, 'Béton armé')
    .replace(/\bFormwork\b/gi, 'Coffrage')
    .replace(/\bReinforcement\b/gi, 'Ferraillage')
    .replace(/\bMasonry\b/gi, 'Maçonnerie')
    .replace(/\bPlastering\b/gi, 'Enduit intérieur')
    .replace(/\bRendering\b/gi, 'Enduit extérieur')
    .replace(/\bPainting\b/gi, 'Peinture')
    .replace(/\bTiling\b/gi, 'Carrelage')
    .replace(/\bPlumbing\b/gi, 'Plomberie')
    .replace(/\bElectrical\b/gi, 'Électricité')
    .replace(/\bCarpentry\b/gi, 'Charpente')
    .replace(/\bRoofing\b/gi, 'Couverture')
    .replace(/\bDrainage\b/gi, 'Assainissement')
    .replace(/\bFoundation\b/gi, 'Fondation')
    .replace(/\bSubstructure\b/gi, 'Infrastructure')
    .replace(/\bSuperstructure\b/gi, 'Superstructure')
    .replace(/\bExternal works\b/gi, 'VRD & Aménagements extérieurs')
    .replace(/\bworkshop practice materials\b/gi, 'matériaux pour travaux pratiques d\'atelier')
    .replace(/\bcutting-edge G\+1-story residential Villa\b/gi, 'Villa Résidentielle Contemporaine R+1')
    .replace(/\bcutting-edge G\+1-story-story residential Villa\b/gi, 'Villa Résidentielle Contemporaine R+1')
    .replace(/\bResidential project\b/gi, 'Projet Résidentiel Moderne')
    .replace(/\bWorkshop practice materials command\b/gi, 'Commande de Fournitures d\'Atelier & Travaux Pratiques')
    .replace(/\bELOHIM ACADEMIC COMPLEX\b/gi, 'COMPLEXE SCOLAIRE ET ACADÉMIQUE ELOHIM')
    .replace(/\bArthur Sterling\b/gi, 'M. Arthur Sterling')
    .replace(/\bMm Violet Fuh Ngwa\b/gi, 'Mme Violet Fuh Ngwa');

  return result;
}

export function translateUnitToFrench(unit: string): string {
  if (!unit) return 'U';
  const clean = unit.trim().toLowerCase();
  return UNIT_MAP[clean] || unit;
}

export function translateContractTypeToFrench(contractType: string): string {
  if (!contractType) return 'BORDEREAU DE PRIX UNITAIRES (BPU)';
  return CONTRACT_TYPE_MAP[contractType.toUpperCase()] || contractType;
}

export function translateStatusToFrench(status: string): string {
  if (!status) return 'BROUILLON';
  return STATUS_MAP[status.toUpperCase()] || status;
}

export function translateLocationToFrench(loc: string): string {
  if (!loc) return 'Douala, Région du Littoral, Cameroun';
  return loc
    .replace(/Cameroon/gi, 'Cameroun')
    .replace(/Littoral Region/gi, 'Région du Littoral')
    .replace(/Centre Region/gi, 'Région du Centre')
    .replace(/North West Region/gi, 'Région du Nord-Ouest')
    .replace(/South West Region/gi, 'Région du Sud-Ouest')
    .replace(/West Region/gi, 'Région de l\'Ouest');
}

/**
 * Converts any BOQ object into an authentic French DQE (Devis Quantitatif et Estimatif).
 * All section names, item descriptions, units, contract terms, amounts in words,
 * audit notes, and engineer seals are adapted to Cameroon / CEMAC BTP standards.
 */
export function convertBoqToFrench(originalBoq: any): BoqProject {
  if (!originalBoq) {
    throw new Error('BOQ object is required for conversion');
  }

  // Deep clone to prevent mutating original
  const boq: BoqProject = JSON.parse(JSON.stringify(originalBoq));

  // 1. Language Flags & Reference
  boq.language = 'fr';
  boq.isFrenchVersion = true;
  const originalRef = boq.boqReference || 'MADECC-BOQ-2026-0001';
  // If not already flagged with FR, add suffix
  if (!originalRef.includes('-FR')) {
    boq.boqReference = `${originalRef}-FR`;
  }

  // 2. Project Metadata
  boq.projectName = translateTextToFrench(boq.projectName || 'Projet de Génie Civil & Bâtiment');
  boq.location = translateLocationToFrench(boq.location || 'Douala, Région du Littoral, Cameroun');
  boq.contractType = translateContractTypeToFrench(boq.contractType || 'UNIT_RATE');
  boq.status = translateStatusToFrench(boq.status || 'DRAFT');

  boq.preparedBy = 'Ingénieur Métreur Vérificateur (MADECC SARL)';
  boq.qsVerification = 'Direction Technique & Économie de la Construction';
  boq.approvedBy = boq.approvedBy || 'Ing. Marcel Mbida, Ingénieur Principal ONIGC 4092';
  boq.chiefEngineer = boq.chiefEngineer || 'Ing. Marcel Mbida, Ingénieur de Conception BTP';

  boq.revisionDescription = 'Devis Quantitatif et Estimatif Certifié (DQE - Version Française)';

  // 3. Sections & Items
  if (Array.isArray(boq.sections)) {
    boq.sections = boq.sections.map((sec, sIdx) => {
      const frTitle = translateTextToFrench(sec.title || `Lot Technique ${sIdx + 1}`);
      const frItems: BoqItem[] = (sec.items || []).map((item, iIdx) => {
        const frDesc = translateTextToFrench(item.description || `Poste de travail ${iIdx + 1}`);
        const frUnit = translateUnitToFrench(item.unit || 'U');
        return {
          ...item,
          description: frDesc,
          unit: frUnit,
          notes: item.notes ? translateTextToFrench(item.notes) : undefined
        };
      });

      return {
        ...sec,
        title: frTitle,
        items: frItems
      };
    });
  }

  // 4. Amount in Words in French
  const currency = boq.currency || 'XAF';
  const grandTotal = Number(boq.grandTotal || 0);
  boq.amountInWords = `Arrêté le présent Devis Quantitatif et Estimatif (DQE) à la somme toutes taxes comprises de : ${numberToWordsFr(grandTotal, currency)}`;

  // 5. Statutory Terms & Conditions in French
  boq.terms = [
    '1. VALIDITÉ DE L\'OFFRE : Le présent Devis Quantitatif et Estimatif (DQE) demeure ferme et non révisable pour une durée de 90 jours à compter de sa date d\'émission officielle.',
    '2. MODALITÉS DE RÈGLEMENT : Échelonnement standard conforme aux normes de passation des marchés de MADECC Group SARL :',
    '   - 30% d\'acompte au démarrage pour approvisionnement des matériaux nobles et installation du chantier;',
    '   - 40% répartis par situations mensuelles d\'avancement des travaux (gros-œuvre et second-œuvre);',
    '   - 20% à l\'achèvement des travaux de finition et pré-réception technique;',
    '   - 10% à la réception provisoire avec retenue de garantie légale (levée sous 12 mois à la réception définitive).',
    '3. CONFORMITÉ TECHNIQUE : Tous les ouvrages seront exécutés selon les Règles de l\'Art, les Cahiers des Clauses Techniques Particulières (CCTP) et les Normes Techniques applicables en République du Cameroun (CSI / DTU / Eurocodes).',
    '4. CLAUSE D\'IMPRÉVUS : Tout travail modificatif ou supplémentaire non prescrit fera l\'objet d\'un avenant écrit préalable et d\'une fiche d\'attachement contradictoire approuvée par le Maître d\'Ouvrage.',
    '5. JURIDICTION : En cas de différend relatif à l\'exécution des présentes, compétence expresse est attribuée aux tribunaux compétents du siège de MADECC Group SARL.'
  ].join('\n\n');

  boq.notes = 'Ce document constitue le Devis Quantitatif et Estimatif (DQE) certifié par les ingénieurs économistes de la construction de MADECC Group SARL. Toute reproduction sans visa officiel est nulle et non avenue.';

  return boq;
}
