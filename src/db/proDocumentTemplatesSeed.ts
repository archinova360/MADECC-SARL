export interface VerifiedCompanyProfile {
  companyName?: string;
  tagline?: string;
  website?: string;
  email?: string;
  phone?: string;
  officeYaounde?: string;
  officeDouala?: string;
  legalStatus?: string;
  rccmNumber?: string;
  niuTaxId?: string;
  logoUrl?: string;
  documentDate?: string;
}

type PMNode = {
  type: string;
  attrs?: Record<string, any>;
  content?: PMNode[];
  marks?: { type: string; attrs?: Record<string, any> }[];
  text?: string;
};

const txt = (text: string, marks?: { type: string; attrs?: Record<string, any> }[]): PMNode =>
  marks && marks.length > 0 ? { type: 'text', text, marks } : { type: 'text', text };

const bold = (text: string): PMNode => txt(text, [{ type: 'bold' }]);
const italic = (text: string): PMNode => txt(text, [{ type: 'italic' }]);

const p = (...children: (string | PMNode)[]): PMNode => {
  const content = children
    .filter((c) => c !== '' && c !== undefined && c !== null)
    .map((c) => (typeof c === 'string' ? txt(c) : c));
  return content.length > 0 ? { type: 'paragraph', content } : { type: 'paragraph' };
};

const h = (level: 1 | 2 | 3 | 4, text: string): PMNode => ({
  type: 'heading',
  attrs: { level },
  content: [txt(text)],
});

const ul = (items: (string | (string | PMNode)[])[]): PMNode => ({
  type: 'bulletList',
  content: items.map((item) => ({
    type: 'listItem',
    content: [Array.isArray(item) ? p(...item) : p(item)],
  })),
});

const ol = (items: (string | (string | PMNode)[])[]): PMNode => ({
  type: 'orderedList',
  content: items.map((item) => ({
    type: 'listItem',
    content: [Array.isArray(item) ? p(...item) : p(item)],
  })),
});

const quote = (text: string): PMNode => ({
  type: 'blockquote',
  content: [p(italic(text))],
});

const pageBreakNode = (): PMNode => ({ type: 'pageBreak' });

const table = (headers: string[], rows: (string | PMNode[])[][]): PMNode => ({
  type: 'table',
  content: [
    {
      type: 'tableRow',
      content: headers.map((head) => ({
        type: 'tableHeader',
        content: [p(bold(head))],
      })),
    },
    ...rows.map((row) => ({
      type: 'tableRow',
      content: row.map((cell) => ({
        type: 'tableCell',
        content: [Array.isArray(cell) ? p(...cell) : p(cell)],
      })),
    })),
  ],
});

function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderProseMirrorToHtml(node: PMNode): string {
  if (!node) return '';
  if (node.type === 'text') {
    let out = escapeHtml(node.text || '');
    for (const m of node.marks || []) {
      if (m.type === 'bold') out = `<strong>${out}</strong>`;
      else if (m.type === 'italic') out = `<em>${out}</em>`;
      else if (m.type === 'underline') out = `<u>${out}</u>`;
      else if (m.type === 'link') out = `<a href="${escapeHtml(m.attrs?.href || '#')}">${out}</a>`;
    }
    return out;
  }
  const inner = (node.content || []).map(renderProseMirrorToHtml).join('');
  switch (node.type) {
    case 'doc':
      return inner;
    case 'paragraph':
      return `<p>${inner || '<br>'}</p>`;
    case 'heading': {
      const lvl = Math.min(4, Math.max(1, Number(node.attrs?.level || 2)));
      return `<h${lvl}>${inner}</h${lvl}>`;
    }
    case 'bulletList':
      return `<ul>${inner}</ul>`;
    case 'orderedList':
      return `<ol>${inner}</ol>`;
    case 'listItem':
      return `<li>${inner}</li>`;
    case 'blockquote':
      return `<blockquote>${inner}</blockquote>`;
    case 'pageBreak':
      return `<div data-type="page-break" class="doc-page-break"></div>`;
    case 'table':
      return `<table><tbody>${inner}</tbody></table>`;
    case 'tableRow':
      return `<tr>${inner}</tr>`;
    case 'tableHeader':
      return `<th>${inner}</th>`;
    case 'tableCell':
      return `<td>${inner}</td>`;
    default:
      return inner;
  }
}

export function resolveVerifiedProfile(company?: VerifiedCompanyProfile | null) {
  const companyName = company?.companyName?.trim() || 'MADECC GROUP';
  const website = company?.website?.trim() || 'https://madeccgroup.online';
  const email = company?.email?.trim() || '[Verified Company Email Pending]';
  const phone = company?.phone?.trim() || '[Verified Company Phone Pending]';
  const addressParts = [company?.officeYaounde?.trim(), company?.officeDouala?.trim()].filter(Boolean);
  const address = addressParts.length > 0 ? addressParts.join(' | ') : '[Verified Office Address in Site Settings]';
  const rccm = company?.rccmNumber?.trim() || '[RCCM To Be Verified in Settings]';
  const niu = company?.niuTaxId?.trim() || '[NIU To Be Verified in Settings]';
  const legalStatus = company?.legalStatus?.trim() || 'Limited Liability Company';
  const documentDate =
    company?.documentDate ||
    new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });

  return { companyName, website, email, phone, address, rccm, niu, legalStatus, documentDate };
}

export function buildStrategicInvestmentProposalContent(company?: VerifiedCompanyProfile | null) {
  const v = resolveVerifiedProfile(company);

  const nodes: PMNode[] = [
    h(1, 'STRATEGIC INVESTMENT PARTNERSHIP PROPOSAL'),
    p(bold('Prepared by: '), `${v.companyName} (${v.legalStatus})`),
    p(bold('Official Website: '), v.website),
    p(bold('Official Contact: '), `${v.email} | ${v.phone}`),
    p(bold('Office Locations: '), v.address),
    p(bold('Document Date: '), v.documentDate),
    p(bold('Prepared for: '), '[Prospective Strategic Investor / Investment Committee — Details To Be Inserted]'),
    quote(
      'STATUS & DISCLAIMER: This Strategic Investment Partnership Proposal is strictly confidential and non-binding. It is prepared solely for discussion, preliminary evaluation, and mutual exploration of potential investment collaboration. Nothing herein constitutes an offer of securities, a binding financial commitment, a guarantee of returns, or a binding contractual obligation until definitive legal agreements are negotiated and duly executed by both parties.'
    ),

    h(2, '1. Executive Summary'),
    p(
      `${v.companyName} presents this Strategic Investment Partnership Proposal to establish a structured, transparent, and performance-aligned capital partnership in the construction, civil engineering, real estate, and strategic infrastructure value chain.`
    ),
    p(
      'The objective of this partnership is to combine disciplined capital deployment with on-ground engineering governance, procurement oversight, cost control, and project execution capabilities—creating measurable real-asset value while protecting principal capital through milestone-based controls and documented risk mitigation.'
    ),
    p(
      'All proposed capital allocations, fee mechanics, profit-sharing splits, governance thresholds, and target asset classes summarized herein remain indicative and subject to mutual due diligence and definitive documentation.'
    ),

    h(2, '2. About MADECC Group'),
    p(
      `${v.companyName} operates in civil engineering, construction project management, cost estimation (BOQ), structural engineering advisory, and turnkey infrastructure delivery.`
    ),
    table(
      ['Corporate Attribute', 'Verified Record Details'],
      [
        ['Company Name', v.companyName],
        ['Legal Form', v.legalStatus],
        ['Registration (RCCM)', v.rccm],
        ['Tax Identifier (NIU)', v.niu],
        ['Website', v.website],
        ['Headquarters / Offices', v.address],
        ['Verified Contact Channels', `${v.email} | ${v.phone}`],
      ]
    ),

    h(2, '3. Proposed Investment Portfolio'),
    p(
      'The proposed portfolio is designed to balance defensive cash-generative construction engagements with asset-backed development and strategic materials supply opportunities. Capital deployment across tranches is subject to project-specific underwriting approved by the Investor:'
    ),
    table(
      ['Portfolio Pillar', 'Illustrative Scope', 'Capital Ownership & Governance', 'Allocation Status'],
      [
        ['1. Turnkey Building & Commercial Developments', 'Residential estates, commercial complexes, and institutional structures', 'Ring-fenced project account / SPV', '[To Be Agreed]'],
        ['2. Civil Works & Subcontract Packages', 'Site works, drainage, concrete structures, road & utility subcontracts', 'Milestone-backed contract execution', '[To Be Agreed]'],
        ['3. Construction Materials & Equipment Supply', 'Batch procurement, aggregate sourcing, and machinery deployment', 'Inventory & asset-backed control', '[To Be Agreed]'],
        ['4. Engineering & Feasibility Pipeline Co-Development', 'Land acquisition structuring, permitting, design-build readiness', 'Pre-agreed feasibility cap', '[To Be Agreed]'],
      ]
    ),

    h(2, '4. Proposed Investment Implementation Strategy'),
    p(
      'Every investment initiative follows a gated five-stage engineering and financial control cycle prior to full capital disbursement:'
    ),
    ol([
      [bold('Stage 1 — Origination & Pre-Screening: '), 'Site inspection, preliminary technical assessment, title verification, and commercial demand check.'],
      [bold('Stage 2 — Feasibility, BOQ & Financial Modeling: '), 'Full architectural/structural concept, itemized Bill of Quantities (BOQ), timeline scheduling, and stress-tested sensitivity analysis.'],
      [bold('Stage 3 — Investor Review & Capital Approval: '), 'Written investment memorandum submitted to the Investor; no capital committed without documented sign-off.'],
      [bold('Stage 4 — Milestone-Gated Execution: '), 'Disbursement in controlled tranches tied to certified engineering progress reports and independent quantity verification.'],
      [bold('Stage 5 — Exit, Yield Collection & Reconciliation: '), 'Asset handover, revenue distribution, post-completion audit, and capital reinvestment or repatriation per Investor instruction.'],
    ]),

    h(2, '5. Role of MADECC Group'),
    p(
      `${v.companyName} acts as the technical, operational, and local execution partner, assuming day-to-day responsibility for project delivery, compliance, and transparent reporting:`
    ),
    ul([
      'Sourcing, screening, and structuring vetted construction and infrastructure opportunities.',
      'Preparing engineering designs, Eurocode-aligned structural calculations, itemized BOQs, and realistic execution schedules.',
      'Managing contractor procurement, supplier vetting, site supervision, health & safety (QHSE), and quality assurance.',
      'Maintaining organized accounting ledgers, invoice substantiation, progress photography, and periodic executive reporting to the Investor.',
      'Safeguarding project assets, statutory permits, and contractual remedies under local and international best practices.',
    ]),

    h(2, '6. Proposed Partnership and Remuneration Structure'),
    p(
      'The commercial partnership is structured to prioritize Investor principal preservation while aligning execution incentives with verified net project performance. All commercial percentages, hurdles, and fee schedules remain strictly open for negotiation in definitive agreements:'
    ),
    table(
      ['Commercial Component', 'Proposed Framework (Non-Binding Indicative Basis)', 'Status'],
      [
        ['Capital Contribution', 'Provided by Investor into designated segregated project/escrow account(s)', '[To Be Agreed]'],
        ['Technical & Project Management Fee', 'Agreed cost-recovery or fixed management allowance covering active site supervision', '[To Be Agreed — No Preset Fee]'],
        ['Priority Return / Capital Recovery', 'Agreed preference waterfall ensuring Investor principal return prior to performance split', '[To Be Agreed]'],
        ['Performance Profit Split', 'Net realized profit shared between Investor and ' + v.companyName + ' post audited reconciliation', '[To Be Agreed]'],
        ['Governance & Veto Rights', 'Major disbursements, contracts, and disposals require joint/Investor authorization', 'Mandatory Safeguard'],
      ]
    ),

    pageBreakNode(),
    h(2, '7. Investment Management and Financial Transparency'),
    p(
      'Institutional-grade financial governance underpins the partnership. Each approved project operates with dedicated reporting and audit traceability:'
    ),
    ul([
      'Segregated project accounting with zero commingling of Investor capital across unrelated engagements.',
      'Tranche-based budget drawdowns supported by vendor quotations, delivery notes, and certified IPCs (Interim Payment Certificates).',
      'Monthly financial & engineering progress packs including budget-vs-actual variance, cashflow forecasts, and site media verification.',
      'Right of inspection and independent third-party audit by the Investor or their appointed financial and technical advisors at any reasonable time.',
    ]),

    h(2, '8. Risk Management and Due Diligence'),
    p(
      'No commitment is undertaken without documented legal, technical, and market due diligence covering:'
    ),
    ul([
      [bold('Title & Legal Risk: '), 'Independent land registry, encumbrance, zoning, and statutory permit verification prior to mobilization.'],
      [bold('Cost & Inflation Risk: '), 'Fixed-price supplier framework contracts, contingency reserves, and bulk procurement locks where prudent.'],
      [bold('Execution & Quality Risk: '), 'Contractual performance bonds, retention clauses, HSE compliance, and phased engineering sign-offs.'],
      [bold('Counterparty & Governance Risk: '), 'Dual-signatory financial controls, anti-bribery compliance, and transparent conflict-of-interest disclosures.'],
    ]),

    h(2, '9. Proposed Initial Market Focus'),
    p(
      'Initial deployment focuses on resilient, high-demand segments where engineering control and clear exit economics are demonstrable:'
    ),
    ul([
      'Urban mixed-use commercial and residential infill construction in high-occupancy corridors.',
      'Pre-leased corporate facilities, warehousing, and light-industrial civil infrastructure.',
      'Public-private or institutional subcontract packages with verified sovereign or corporate payment guarantees.',
    ]),

    h(2, '10. First 90-Day Action Plan'),
    table(
      ['Horizon', 'Key Deliverables & Governance Milestones', 'Owner'],
      [
        ['Days 1 – 30', 'NDA execution, Investor criteria alignment, corporate KYC/KYB exchange, and initial opportunity pipeline briefing', 'Joint (Investor & ' + v.companyName + ')'],
        ['Days 31 – 60', 'On-site technical inspections, full BOQ costing, legal title checks, and financial feasibility validation on 1–2 shortlist assets', v.companyName + ' & Independent Advisors'],
        ['Days 61 – 90', 'Negotiation of definitive Partnership / SPV Agreement, governance bank setup, and conditional approval of Pilot Project #1', 'Investor Approval & Joint Sign-Off'],
      ]
    ),

    h(2, '11. Information Required from the Investor'),
    p(
      'To tailor the shortlist pipeline and commercial model accurately without assumption, the following non-binding inputs are respectfully requested from the Investor:'
    ),
    ul([
      'Legal entity name, domicile jurisdiction, and authorized representative contact details: [To Be Provided by Investor].',
      'Indicative capital mandate range and preferred currency denomination: [To Be Provided by Investor].',
      'Target investment horizon, liquidity preferences, and minimum acceptable return profile: [To Be Provided by Investor].',
      'Preferred legal structuring vehicle (Direct JV, Dedicated SPV, Project Debt/Equity Hybrid): [To Be Provided by Investor].',
      'Any sector exclusions, ESG mandates, or compliance reporting requirements: [To Be Provided by Investor].',
    ]),

    h(2, '12. Proposed Partnership Agreement'),
    p(
      'Upon mutual selection of an investment opportunity and completion of satisfactory due diligence, both parties intend to negotiate and execute formal, legally binding definitive agreements prepared by competent legal counsel, encompassing:'
    ),
    ol([
      'A Framework Strategic Partnership / Joint Venture Agreement defining governance, reporting, intellectual property, and dispute resolution.',
      'Project-Specific Investment & Execution Schedules specifying approved budget, milestones, drawdown triggers, remuneration/profit waterfall, and exit rights.',
      'Escrow or Controlled Bank Mandate Protocols governing all capital inflows and disbursements.',
    ]),

    h(2, '13. Conclusion'),
    p(
      `${v.companyName} welcomes the opportunity to partner with forward-looking investors seeking disciplined, engineering-led participation in high-value construction and infrastructure projects. We remain fully available for an executive briefing, technical review, and transparent collaborative structuring.`
    ),

    h(2, '14. Acknowledgement and Expression of Interest'),
    p(
      'NON-BINDING ACKNOWLEDGEMENT: Signature or written acknowledgement below indicates only receipt of this confidential proposal and mutual willingness to enter preliminary exploratory discussions under appropriate confidentiality terms. It does not create any binding obligation to invest, lend, pay fees, or enter any definitive contract.'
    ),
    table(
      ['Party', 'Authorized Signatory Name & Title', 'Organization & Date', 'Signature / Initials'],
      [
        ['Proposing Partner (' + v.companyName + ')', '[Name & Title To Be Inserted]', v.companyName + ' — ' + v.documentDate, '________________________'],
        ['Prospective Investor', '[Investor Name & Title To Be Inserted]', '[Investor Entity — Date To Be Inserted]', '________________________'],
      ]
    ),
  ];

  const docJson: PMNode = { type: 'doc', content: nodes };
  return {
    contentJson: docJson,
    contentHtml: renderProseMirrorToHtml(docJson),
  };
}

function makeSimpleTemplate(nodes: PMNode[]) {
  const docJson: PMNode = { type: 'doc', content: nodes };
  return {
    contentJson: docJson,
    contentHtml: renderProseMirrorToHtml(docJson),
  };
}

export function getSeedTemplates(company?: VerifiedCompanyProfile | null) {
  const v = resolveVerifiedProfile(company);
  const strategic = buildStrategicInvestmentProposalContent(company);

  return [
    {
      name: 'Strategic Investment Partnership Proposal',
      slug: 'strategic-investment-partnership-proposal',
      category: 'Partnership & Investment',
      description: '14-section confidential, non-binding strategic capital and construction investment partnership proposal with structured portfolio, remuneration, 90-day plan, and acknowledgement blocks.',
      defaultOrientation: 'portrait',
      defaultVisibility: 'PRIVATE',
      defaultHeaderText: `${v.companyName} | Strategic Investment Partnership Proposal (Confidential & Non-Binding)`,
      defaultFooterText: `CONFIDENTIAL — Prepared by ${v.companyName} (${v.website}) | Non-Binding Proposal`,
      isConfidential: true,
      isSystem: true,
      ...strategic,
    },
    {
      name: 'Business Partnership Proposal',
      slug: 'business-partnership-proposal',
      category: 'Partnership & Investment',
      description: 'Structured commercial joint-venture and business collaboration proposal for B2B engineering, procurement, and consortium alliances.',
      defaultOrientation: 'portrait',
      defaultVisibility: 'PRIVATE',
      defaultHeaderText: `${v.companyName} | Business Partnership & Consortium Proposal`,
      defaultFooterText: `CONFIDENTIAL — ${v.companyName} | ${v.website}`,
      isConfidential: true,
      isSystem: true,
      ...makeSimpleTemplate([
        h(1, 'BUSINESS PARTNERSHIP & COLLABORATION PROPOSAL'),
        p(bold('Issuing Organization: '), `${v.companyName} — ${v.website}`),
        p(bold('Date: '), v.documentDate),
        p(bold('Prepared For: '), '[Prospective Partner Organization — Insert Details]'),
        quote('This proposal outlines a non-binding framework for commercial collaboration subject to formal legal review.'),
        h(2, '1. Purpose & Strategic Rationale'),
        p(`This proposal outlines a mutually beneficial operational alliance between ${v.companyName} and [Partner Organization] to jointly pursue and deliver commercial engineering, infrastructure, and supply mandates.`),
        h(2, '2. Complementary Capabilities'),
        table(
          ['Area of Responsibility', v.companyName + ' Contribution', 'Partner Contribution'],
          [
            ['Engineering & Design', 'Civil engineering, structural design, BOQ quantification', '[Specify Partner Scope]'],
            ['Project Delivery & HSE', 'Site management, quality assurance, scheduling', '[Specify Partner Scope]'],
            ['Commercial & Client Relations', 'Bid preparation, client reporting, contract administration', '[Specify Partner Scope]'],
          ]
        ),
        h(2, '3. Proposed Governance & Commercial Terms'),
        p('Revenue allocation, cost sharing, liability caps, and consortium governance shall be codified in a project-specific Joint Venture / Teaming Agreement prior to bid submission.'),
        h(2, '4. Next Steps'),
        ol(['Confirm mutual NDA execution.', 'Hold joint technical & commercial alignment workshop.', 'Draft consortium Memorandum of Understanding (MoU).']),
      ]),
    },
    {
      name: 'Construction Project Proposal',
      slug: 'construction-project-proposal',
      category: 'Construction Proposal',
      description: 'Comprehensive technical & commercial construction tender proposal covering methodology, HSE, timeline, and commercial terms.',
      defaultOrientation: 'portrait',
      defaultVisibility: 'PRIVATE',
      defaultHeaderText: `${v.companyName} | Technical & Commercial Construction Proposal`,
      defaultFooterText: `${v.companyName} — Engineering & Construction Services | ${v.website}`,
      isConfidential: true,
      isSystem: true,
      ...makeSimpleTemplate([
        h(1, 'TECHNICAL & COMMERCIAL CONSTRUCTION PROJECT PROPOSAL'),
        p(bold('Contractor: '), `${v.companyName} (${v.rccm})`),
        p(bold('Client: '), '[Client Name / Institution — Insert Details]'),
        p(bold('Project Title & Site Location: '), '[Project Title & Location]'),
        p(bold('Proposal Date: '), v.documentDate),
        h(2, '1. Executive Project Overview'),
        p(`${v.companyName} is pleased to submit this comprehensive technical and commercial proposal for turnkey execution of the referenced works in strict compliance with applicable structural codes and client specifications.`),
        h(2, '2. Scope of Works & Technical Methodology'),
        ul([
          'Site mobilization, topographic setting-out, hoarding, and geotechnical verification.',
          'Substructure foundations, reinforced concrete framing, masonry, and waterproofing.',
          'MEP (Mechanical, Electrical, Plumbing), architectural finishes, testing, and commissioning.',
        ]),
        h(2, '3. Preliminary Construction Schedule'),
        table(
          ['Phase', 'Key Work Package', 'Estimated Duration', 'Deliverable'],
          [
            ['Phase 1', 'Mobilization & Earthworks', '[Weeks]', 'Cleared & pegged site'],
            ['Phase 2', 'Foundations & Superstructure', '[Weeks]', 'Certified structural frame'],
            ['Phase 3', 'MEP, Finishes & Handover', '[Weeks]', 'As-built dossier & handover'],
          ]
        ),
        h(2, '4. Quality Assurance & QHSE Commitment'),
        p('All concrete mixes, reinforcement steel grades, and site safety measures comply with Eurocode 2 and national occupational health standards.'),
        h(2, '5. Commercial Summary & Validity'),
        p('Detailed itemized pricing is attached in the accompanying Bill of Quantities (BOQ). Proposal validity: [30 / 60 Days — Confirm].'),
      ]),
    },
    {
      name: 'Construction Quotation',
      slug: 'construction-quotation',
      category: 'Quotation & Commercial',
      description: 'Itemized engineering & construction cost quotation with unit rates, subtotals, VAT/taxes, and payment milestones.',
      defaultOrientation: 'portrait',
      defaultVisibility: 'PRIVATE',
      defaultHeaderText: `${v.companyName} | Official Construction Quotation`,
      defaultFooterText: `${v.companyName} — ${v.email} | ${v.phone}`,
      isConfidential: true,
      isSystem: true,
      ...makeSimpleTemplate([
        h(1, 'OFFICIAL CONSTRUCTION QUOTATION (DEVIS ESTIMATIF)'),
        p(bold('Issued By: '), `${v.companyName} — ${v.address}`),
        p(bold('Quotation Date: '), v.documentDate),
        p(bold('Client / Addressee: '), '[Client Name, Organization & Contact]'),
        p(bold('Project Reference: '), '[Project Name & Location]'),
        h(2, '1. Itemized Schedule of Rates & Quantities'),
        table(
          ['Item', 'Description of Works / Materials', 'Unit', 'Qty', 'Unit Price', 'Total Amount'],
          [
            ['1.0', 'Site Mobilization, Clearing & Setting Out', 'Lump Sum', '1', '[Rate]', '[Amount]'],
            ['2.0', 'Excavation & Reinforced Concrete Foundations', 'm³', '[Qty]', '[Rate]', '[Amount]'],
            ['3.0', 'Structural Superstructure & Masonry Works', 'm²', '[Qty]', '[Rate]', '[Amount]'],
            ['4.0', 'Roofing, Waterproofing & Exterior Finishes', 'm²', '[Qty]', '[Rate]', '[Amount]'],
            ['5.0', 'Electrical, Plumbing & Finishing Works', 'Lot', '1', '[Rate]', '[Amount]'],
          ]
        ),
        h(2, '2. Financial Summary'),
        table(
          ['Summary Line', 'Amount / Notes'],
          [
            ['Subtotal (Excl. Taxes)', '[Insert Calculated Total]'],
            ['Applicable Taxes / VAT', '[As Applicable per Tax Jurisdiction]'],
            ['Grand Total Quoted', '[Insert Grand Total & Currency]'],
          ]
        ),
        h(2, '3. Commercial Terms & Validity'),
        ul([
          'Quotation validity: [Specify validity period, e.g., 30 days from date of issue].',
          'Payment tranches: [To be agreed upon formal purchase order / contract signing].',
          'Exclusions: Works not explicitly listed above shall be quoted separately as approved variations.',
        ]),
      ]),
    },
    {
      name: 'Project Feasibility Report',
      slug: 'project-feasibility-report',
      category: 'Engineering & Feasibility',
      description: 'Multi-disciplinary technical, environmental, regulatory, and financial feasibility study template for civil & real estate projects.',
      defaultOrientation: 'portrait',
      defaultVisibility: 'PRIVATE',
      defaultHeaderText: `${v.companyName} | Technical & Financial Feasibility Study`,
      defaultFooterText: `CONFIDENTIAL — Engineering Feasibility Assessment | ${v.companyName}`,
      isConfidential: true,
      isSystem: true,
      ...makeSimpleTemplate([
        h(1, 'PROJECT FEASIBILITY STUDY REPORT'),
        p(bold('Prepared By: '), `${v.companyName} — Civil Engineering & Advisory Directorate`),
        p(bold('Date: '), v.documentDate),
        p(bold('Project Subject: '), '[Project Name, Site Parcel & Sponsor]'),
        h(2, '1. Executive Feasibility Verdict'),
        p('Summarize overall technical viability, zoning permissibility, capex range, schedule realism, and key go/no-go conditions.'),
        h(2, '2. Site, Geotechnical & Topographic Evaluation'),
        p('Document soil bearing characteristics, drainage conditions, access roads, utility availability (water, grid power, telecom), and flood risk.'),
        h(2, '3. Regulatory, Zoning & Environmental Review'),
        p('Review land title documentation, building permit requirements, setbacks, height limits, and environmental screening obligations.'),
        h(2, '4. Preliminary Capex & Schedule Benchmark'),
        table(
          ['Cost Category', 'Basis of Estimate', 'Indicative Value', 'Confidence Band'],
          [
            ['Site Prep & Substructure', 'Preliminary BOQ / Geotechnical data', '[Insert Amount]', '[±15%]'],
            ['Superstructure & Envelope', 'Benchmark rate per m²', '[Insert Amount]', '[±15%]'],
            ['MEP, External Works & Contingency', 'Engineering allowance', '[Insert Amount]', '[±15%]'],
          ]
        ),
        h(2, '5. Key Risks & Recommendations'),
        ol(['Complete invasive geotechnical boreholes prior to final foundation design.', 'Confirm utility tie-in approvals with municipal authorities.', 'Lock core material procurement schedules ahead of peak season.']),
      ]),
    },
    {
      name: 'Investment Assessment Report',
      slug: 'investment-assessment-report',
      category: 'Engineering & Feasibility',
      description: 'Independent investment underwriting, cost verification, return sensitivity, and risk scoring report for project sponsors and lenders.',
      defaultOrientation: 'portrait',
      defaultVisibility: 'PRIVATE',
      defaultHeaderText: `${v.companyName} | Investment Underwriting & Assessment Report`,
      defaultFooterText: `CONFIDENTIAL — Investment Assessment | ${v.companyName}`,
      isConfidential: true,
      isSystem: true,
      ...makeSimpleTemplate([
        h(1, 'INVESTMENT ASSESSMENT & UNDERWRITING REPORT'),
        p(bold('Assessment Firm: '), `${v.companyName}`),
        p(bold('Report Date: '), v.documentDate),
        p(bold('Evaluated Asset / Opportunity: '), '[Asset Name & Location]'),
        h(2, '1. Opportunity Snapshot & Thesis'),
        p('Objective overview of the proposed asset, capital demand, sponsor background, and value creation drivers.'),
        h(2, '2. Capital Stack & Unit Economics Check'),
        table(
          ['Metric / Parameter', 'Sponsor Assumption', 'Assessed / Stress-Tested View', 'Variance / Note'],
          [
            ['Total Development Cost', '[Insert Figure]', '[Insert Assessed Figure]', '[Note]'],
            ['Construction Duration', '[Months]', '[Assessed Months]', '[Note]'],
            ['Projected Gross Revenue / Yield', '[Insert Figure]', '[Conservative Case]', '[Note]'],
          ]
        ),
        h(2, '3. Technical & Cost Audit Findings'),
        p('Verification of BOQ completeness, structural design maturity, contractor capability, and contingency adequacy.'),
        h(2, '4. Risk Matrix & Conditions Precedent'),
        ul(['Verified clear title and unencumbered collateral.', 'Independent engineer sign-off before each tranche release.', 'Performance security / retention clause incorporated into EPC contract.']),
      ]),
    },
    {
      name: 'Business Agreement',
      slug: 'business-agreement',
      category: 'Legal Agreement',
      description: 'Formal commercial services, engineering consultancy, or project delivery agreement template ready for legal review and execution.',
      defaultOrientation: 'portrait',
      defaultVisibility: 'PRIVATE',
      defaultHeaderText: `${v.companyName} | Commercial Services & Business Agreement`,
      defaultFooterText: `LEGAL INSTRUMENT — Subject to Legal Counsel Review | ${v.companyName}`,
      isConfidential: true,
      isSystem: true,
      ...makeSimpleTemplate([
        h(1, 'COMMERCIAL BUSINESS & SERVICES AGREEMENT'),
        p(`This Agreement is entered into as of ${v.documentDate} by and between:`),
        p(bold('FIRST PARTY: '), `${v.companyName}, having offices at ${v.address}, registration ${v.rccm} ("Service Partner"); and`),
        p(bold('SECOND PARTY: '), '[Counterparty Legal Name, Registration No., and Registered Address] ("Client / Counterparty").'),
        h(2, 'Article 1 — Scope of Services & Deliverables'),
        p('The Service Partner agrees to perform the engineering, construction, or advisory services specified in Schedule A with due professional skill and care.'),
        h(2, 'Article 2 — Commercial Consideration & Invoicing'),
        p('Fees, milestones, invoicing cadence, and currency terms shall be strictly governed by Schedule B as mutually agreed in writing.'),
        h(2, 'Article 3 — Confidentiality & Intellectual Property'),
        p('All proprietary drawings, financial models, BOQs, and commercial records exchanged under this Agreement shall remain strictly confidential.'),
        h(2, 'Article 4 — Term, Termination & Dispute Resolution'),
        p('Either party may terminate for material uncured breach following written notice. Disputes shall first undergo amicable executive mediation prior to arbitration or competent court jurisdiction.'),
      ]),
    },
    {
      name: 'Official Business Letter',
      slug: 'official-business-letter',
      category: 'Official Correspondence',
      description: 'Formal executive letterhead template for government submissions, bank correspondence, notices, and client communications.',
      defaultOrientation: 'portrait',
      defaultVisibility: 'INTERNAL',
      defaultHeaderText: `${v.companyName} | Official Executive Correspondence`,
      defaultFooterText: `${v.companyName} | ${v.address} | ${v.website}`,
      isConfidential: false,
      isSystem: true,
      ...makeSimpleTemplate([
        h(1, 'OFFICIAL CORRESPONDENCE'),
        p(bold('From: '), `${v.companyName} — ${v.address}`),
        p(bold('Contact: '), `${v.email} | ${v.phone} | ${v.website}`),
        p(bold('Date: '), v.documentDate),
        p(bold('Our Reference: '), '[REF/CODE/YYYY]'),
        p(''),
        p(bold('To: '), '[Recipient Name & Title]'),
        p('[Recipient Organization & Street Address]'),
        p(''),
        h(2, 'SUBJECT: [INSERT CLEAR FORMAL SUBJECT LINE]'),
        p('Dear [Sir / Madam / Title & Surname],'),
        p('We write on behalf of ' + v.companyName + ' regarding [state clear purpose of correspondence, contract reference, or submission details].'),
        p('[Body paragraph 2: Provide factual dates, technical points, enclosure references, or requested actions cleanly and concisely.]'),
        p('Please do not hesitate to contact the undersigned should additional documentation or clarification be required.'),
        p('Yours faithfully,'),
      ]),
    },
    {
      name: 'Project Progress Report',
      slug: 'project-progress-report',
      category: 'Progress Report',
      description: 'Executive site progress report tracking physical % completion, milestones, HSE incidents, budget burn, and next-period actions.',
      defaultOrientation: 'portrait',
      defaultVisibility: 'PRIVATE',
      defaultHeaderText: `${v.companyName} | Executive Site Progress Report`,
      defaultFooterText: `${v.companyName} — Project Management Office | Confidential`,
      isConfidential: true,
      isSystem: true,
      ...makeSimpleTemplate([
        h(1, 'EXECUTIVE CONSTRUCTION PROGRESS REPORT'),
        p(bold('Reporting Organization: '), v.companyName),
        p(bold('Reporting Date: '), v.documentDate),
        p(bold('Project Name & Client: '), '[Project Name — Client Organization]'),
        p(bold('Reporting Period: '), '[Week / Month Start – End Date]'),
        h(2, '1. Overall Progress & Schedule Status'),
        table(
          ['Work Package / Trade', 'Planned %', 'Actual %', 'Status', 'Remarks'],
          [
            ['Substructure & Earthworks', '[%]', '[%]', '[On Track / Delayed]', '[Brief note]'],
            ['Reinforced Concrete Frame', '[%]', '[%]', '[On Track / Delayed]', '[Brief note]'],
            ['Masonry & Finishes', '[%]', '[%]', '[Pending / Active]', '[Brief note]'],
            ['MEP & Utilities', '[%]', '[%]', '[Pending / Active]', '[Brief note]'],
          ]
        ),
        h(2, '2. Health, Safety & Environment (HSE) Summary'),
        p('Total site man-hours: [Hours] | Lost-Time Injuries (LTI): [0] | Toolbox talks conducted: [Count].'),
        h(2, '3. Bottlenecks, Variations & Client Decisions Needed'),
        ul(['[Specify any material lead-time items or pending RFI approvals]']),
        h(2, '4. Planned Activities for Next Reporting Period'),
        ol(['[Primary site objective 1]', '[Primary site objective 2]', '[Inspection / concrete pour schedule]']),
      ]),
    },
    {
      name: 'Company Profile',
      slug: 'company-profile',
      category: 'Corporate Profile',
      description: 'Corporate capability statement & engineering dossier introducing leadership, technical disciplines, quality standards, and contact channels.',
      defaultOrientation: 'portrait',
      defaultVisibility: 'PUBLIC',
      defaultHeaderText: `${v.companyName} | Corporate Profile & Engineering Capabilities`,
      defaultFooterText: `${v.companyName} | ${v.website} | ${v.email}`,
      isConfidential: false,
      isSystem: true,
      ...makeSimpleTemplate([
        h(1, `${v.companyName} — CORPORATE PROFILE & CAPABILITY STATEMENT`),
        p(bold('Tagline: '), company?.tagline?.trim() || 'Civil Engineering, Construction & Infrastructure Excellence'),
        p(bold('Official Website: '), v.website),
        p(bold('Issued: '), v.documentDate),
        h(2, '1. Who We Are'),
        p(
          `${v.companyName} is a civil engineering, construction management, and turnkey infrastructure firm delivering residential, commercial, institutional, and civil works engineered for durability, compliance, and cost certainty.`
        ),
        h(2, '2. Core Service Disciplines'),
        ul([
          'Turnkey Building & Commercial Construction (Design-Build & General Contracting)',
          'Civil Engineering, Roads, Drainage & Reinforced Concrete Structures',
          'Quantity Surveying (BOQ), Cost Estimation & Construction Value Engineering',
          'Structural Engineering Design & Project Feasibility Advisory',
          'Owner Representation, Site Supervision & Quality / HSE Audits',
        ]),
        h(2, '3. Corporate Registration & Contact Directory'),
        table(
          ['Corporate Record', 'Details'],
          [
            ['Legal Entity', `${v.companyName} (${v.legalStatus})`],
            ['RCCM Registration', v.rccm],
            ['NIU Tax Reference', v.niu],
            ['Office Locations', v.address],
            ['Email & Direct Line', `${v.email} | ${v.phone}`],
            ['Web Portal', v.website],
          ]
        ),
      ]),
    },
  ];
}
