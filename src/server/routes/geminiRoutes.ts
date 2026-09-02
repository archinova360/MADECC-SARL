import express from 'express';
import { getGeminiApiKey, getGeminiClient, normalizeGeminiError, generateGeminiContentWithRetry, retryWithFallback } from '../geminiService.js';
import { Type } from '@google/genai';

  // ==========================================
  
  function getFallbackLetter(letterType: string, subType: string, senderName: string, recipientCompany: string) {
    const sName = senderName || 'Jane Doe';
    const rCompany = recipientCompany || 'MADECC Group';

    if (letterType === 'teaching-jobs') {
      switch (subType) {
        case 'stem-teacher':
          return {
            subject: 'APPLICATION FOR THE POST OF SENIOR MATHEMATICS & PHYSICS TEACHER',
            salutation: 'Dear Sir/Madam,',
            bodyParagraphs: [
              `I am writing to express my strong interest in the Senior Mathematics and Physics teaching vacancy at your esteemed institution. Having followed your school's remarkable academic achievements and commitment to STEM education, I am eager to contribute my pedagogical expertise and passion for educational excellence to your faculty.`,
              `With over eight years of teaching experience, including serving as a Head of Department, I have successfully designed student-centered curriculum frameworks that make complex concepts in calculus, trigonometry, and Newtonian mechanics highly accessible. In my previous role, I guided my classes to a record-breaking 94% pass rate in national examinations.`,
              `Beyond instruction, I am highly committed to fostering a supportive, inclusive learning environment. I have successfully organized region-wide STEM forums, pioneered student coaching circles, and mentored junior educators in implementing digital interactive simulators.`,
              `Thank you for your time and consideration of my application. I look forward to the opportunity to discuss how my teaching credentials align with the academic aspirations of your institution.`
            ],
            signoff: 'Yours faithfully,'
          };
        case 'university-lecturer':
          return {
            subject: 'APPLICATION FOR THE POST OF UNIVERSITY LECTURER / RESEARCH FELLOW',
            salutation: 'Dear Chairman of the Search Committee,',
            bodyParagraphs: [
              `I am pleased to submit my application for the Lecturer/Research Fellow position in your esteemed Faculty. With a strong track record of high-impact research publications and over six years of academic teaching experience, I am prepared to deliver rigorous training to your students and lead state-of-the-art academic investigations.`,
              `My doctoral research focused on structural resilience and sustainable load modeling in sub-tropical zones, resulting in several peer-reviewed articles. In the classroom, I utilize a blended learning approach that combines theoretical engineering and computational mechanics, ensuring students gain both conceptual depth and practical technical skills.`,
              `I am eager to collaborate with your distinguished colleagues on interdisciplinary research grants and to contribute actively to departmental curriculum reviews. I have a proven track record of securing national project funding and supervising undergraduate honors theses.`,
              `Thank you for considering my credentials for this academic post. I look forward to the prospect of discussing my research program and pedagogical vision with your committee.`
            ],
            signoff: 'Yours sincerely,'
          };
        case 'civil-engineer':
          return {
            subject: 'APPLICATION FOR THE POSITION OF SENIOR CIVIL / INFRASTRUCTURE ENGINEER',
            salutation: 'Dear Hiring Director,',
            bodyParagraphs: [
              `It is with great enthusiasm that I submit my application for the Senior Civil Engineer position. Having managed multi-million dollar public infrastructure tenders and geotechnical operations, I am eager to bring my structural expertise and team leadership to your esteemed firm.`,
              `Over the past decade, I have supervised reinforced concrete high-rises and municipal bridge expansions, ensuring strict safety compliance and structural load balancing. By leveraging advanced CAD and Civil 3D load computations, I have consistently optimized steel and material logistics, reducing project overheads by up to 15%.`,
              `My professional background includes extensive collaboration with regulatory boards, executing environmental impact studies, and leading field crews under complex climate constraints. I pride myself on maintaining zero-incident safety records across all managed sites.`,
              `I appreciate your consideration of my professional profile. I would welcome the opportunity to discuss how my infrastructure project management background can add value to your upcoming portfolios.`
            ],
            signoff: 'Yours faithfully,'
          };
        case 'architect':
          return {
            subject: 'APPLICATION FOR THE ROLE OF LEAD ARCHITECT & SPACE DESIGNER',
            salutation: 'Dear Head of Design,',
            bodyParagraphs: [
              `I am writing to express my eager interest in the Lead Architect and Space Designer role at your innovative firm. With a passion for sustainable tropical architecture and a portfolio of award-winning green commercial layouts, I am excited to help elevate your visual and functional design standards.`,
              `My design philosophy merges structural utility with aesthetic boldness, utilizing energy-efficient materials and natural ventilation profiles. I am fully proficient in Revit, SketchUp, and custom structural rendering pipelines, having successfully guided projects from conceptual sketches to final builder drafts.`,
              `I have collaborated with engineering and municipal planning boards to obtain full zoning approvals, and have a proven track record of supervising interior finish work to ensure absolute alignment with high-end client expectations.`,
              `Thank you for reviewing my application and digital portfolio. I am enthusiastic about discussing how my design methodology can bring your clients' architectural visions to life.`
            ],
            signoff: 'Sincerely yours,'
          };
        case 'project-manager':
          return {
            subject: 'APPLICATION FOR THE POSITION OF SENIOR PROJECTS MANAGER',
            salutation: 'Dear Operations Director,',
            bodyParagraphs: [
              `Please accept this letter as my formal application for the Senior Projects Manager vacancy at your company. With over nine years of project management experience leading complex real-estate and utility initiatives, I have the operational expertise to keep your schedules on-time and within budget.`,
              `I specialize in resource dispatch, risk management matrices, and agile project monitoring. In my previous role, I oversaw a multi-disciplinary engineering and contractor workforce, implementing rigorous project milestone reviews that accelerated delivery cycles by 20%.`,
              `My strength lies in seamless stakeholder communications and managing supply chain logistics. I am certified in PMP and have a proven record of negotiating contracts that maximize cost-efficiency while ensuring standard regulatory compliance.`,
              `I look forward to discussing how my operational methodology can drive success for your upcoming projects. Thank you for your time and review of my application.`
            ],
            signoff: 'Yours faithfully,'
          };
        case 'it-developer':
          return {
            subject: 'APPLICATION FOR THE ROLE OF LEAD SYSTEMS & SOFTWARE DEVELOPER',
            salutation: 'Dear Chief Technology Officer,',
            bodyParagraphs: [
              `I am writing to express my strong interest in the Lead Systems and Software Developer position. As a full-stack engineer with over seven years of experience building secure, scalable cloud architectures and enterprise software, I am eager to lead your technology initiatives.`,
              `I have designed high-throughput APIs, optimized database queries, and implemented robust OAuth2 security gateways, reducing server response times by 30%. My technology stack includes React, Node.js, TypeScript, PostgreSQL, and modern container orchestration tools.`,
              `I am highly skilled in mentoring junior developers, conducting rigorous code reviews, and establishing clean CI/CD automated test pipelines to ensure software of the highest reliability.`,
              `Thank you for your time and consideration. I would be thrilled to discuss how my software engineering experience can help scale your digital products.`
            ],
            signoff: 'Yours sincerely,'
          };
        default:
          return {
            subject: 'APPLICATION FOR THE POSITION of CO-WORKER / COLLABORATOR',
            salutation: 'Dear Hiring Manager,',
            bodyParagraphs: [
              `I am writing to formally submit my application for employment opportunities at your company. With a solid professional background and a dedication to continuous growth, I am confident in my ability to make a positive impact on your operations.`,
              `Throughout my career, I have focused on collaboration, problem-solving, and executing tasks to the highest standards. I adapt quickly to new workflows and pride myself on my strong work ethic and attention to detail.`,
              `I would appreciate the chance to discuss how my qualifications align with your company's core objectives. Thank you for your consideration.`
            ],
            signoff: 'Yours faithfully,'
          };
      }
    } else {
      // letterType === 'application'
      switch (subType) {
        case 'general-employment':
          return {
            subject: 'APPLICATION FOR EMPLOYMENT OPPORTUNITY',
            salutation: 'Dear Recruitment Director,',
            bodyParagraphs: [
              `I am writing to formally express my interest in joining your esteemed company. With a diverse range of professional competencies and a strong record of accomplishment, I am confident in my ability to contribute effectively to your organizational goals.`,
              `My professional journey has been defined by a commitment to operational excellence, cross-functional collaboration, and strategic execution. I possess robust communication skills and have successfully navigated corporate and public partnerships to drive measurable growth.`,
              `I admire your company's market leadership and dedication to quality, and I am eager to apply my skills within your dynamic team environment to solve complex challenges.`,
              `Thank you for your time and review of my application documents. I look forward to discussing how my experience can benefit your upcoming initiatives.`
            ],
            signoff: 'Yours faithfully,'
          };
        case 'internship':
          return {
            subject: 'APPLICATION FOR PROFESSIONAL INTERNSHIP PROGRAM',
            salutation: 'Dear Human Resources Team,',
            bodyParagraphs: [
              `I am writing to request a professional internship opportunity at your prestigious organization. As an ambitious and high-achieving student specializing in my field, I am eager to apply my academic foundation to real-world industrial projects under your mentorship.`,
              `During my academic studies, I have gained hands-on experience through project-based coursework, laboratory analyses, and professional modeling software. I have maintained a strong academic record and won student accolades for teamwork and innovation.`,
              `An internship with your company would provide me with invaluable exposure to standard corporate workflows, permitting me to contribute fresh perspectives and enthusiastic support to your active teams.`,
              `Thank you for considering my application for an internship. I am available for an interview at your earliest convenience to discuss how I can assist your projects.`
            ],
            signoff: 'Yours faithfully,'
          };
        case 'promotion':
          return {
            subject: 'APPLICATION FOR INTERNAL PROMOTION & LEADER POST',
            salutation: 'Dear Management Board,',
            bodyParagraphs: [
              `I am writing to formally express my interest in applying for the upcoming internal promotion to the leadership position. Having served proudly within our organization for several years, I am eager to take on this expanded responsibility and lead our team to new heights.`,
              `In my current role, I have consistently exceeded my key performance metrics, successfully streamlined cross-departmental operations, and spearheaded key initiatives that reduced operational bottlenecks. I have also loved mentoring junior staff and fostering a culture of accountability.`,
              `I believe my deep familiarity with our corporate values, combined with my leadership background, makes me uniquely qualified to guide the department through its upcoming growth phases.`,
              `Thank you for your continuous support and for considering my application for this promotion. I look forward to discussing my vision for the role with you.`
            ],
            signoff: 'Sincerely yours,'
          };
        case 'tender-eoi':
          return {
            subject: `EXPRESSION OF INTEREST (EOI) & COVER LETTER FOR ARCHITECTURAL/CONSTRUCTION TENDERS`,
            salutation: 'Dear President of the Tenders Board,',
            bodyParagraphs: [
              `We are pleased to submit our Expression of Interest (EOI) for the upcoming municipal development and construction tender. As a registered contracting firm with extensive regional experience, we are fully prepared to deliver world-class infrastructure engineering on-time and within budget.`,
              `Our technical proposal highlights our specialized competence in structural integrity, eco-friendly materials sourcing, and advanced load-balancing computations. We have successfully completed similar large-scale public initiatives, maintaining strict adherence to international safety regulations.`,
              `We possess a robust fleet of modern heavy machinery, a multidisciplinary team of licensed engineers, and a secure financial line to ensure seamless project execution without logistical delay.`,
              `We appreciate the opportunity to bid on this milestone public contract and look forward to the opening of the technical and financial envelopes. Thank you for your review of our qualifications.`
            ],
            signoff: 'Yours faithfully,'
          };
        case 'corp-collab':
          return {
            subject: 'PROPOSAL FOR CORPORATE COLLABORATION & STRATEGIC PARTNERSHIP',
            salutation: 'Dear Managing Director,',
            bodyParagraphs: [
              `I am writing on behalf of our firm to propose the establishment of a strategic corporate partnership between our organizations. By aligning our respective industry strengths, we believe we can unlock substantial synergy and deliver unprecedented value to our clients.`,
              `Our firm specializes in advanced structural contracting and architectural design, while your company represents excellence in raw materials supply and regional distribution. Together, we can form a highly integrated solution that accelerates execution timelines and lowers cost-overheads.`,
              `We suggest a preliminary meeting next week to explore potential pilot projects where our combined competencies can be immediately deployed to secure upcoming market opportunities.`,
              `Thank you for considering this collaborative proposal. We are highly enthusiastic about the prospect of a long and mutually beneficial relationship.`
            ],
            signoff: 'Yours sincerely,'
          };
        case 'grad-school':
          return {
            subject: 'APPLICATION FOR ADMISSION TO THE POSTGRADUATE PROGRAM',
            salutation: 'Dear Members of the Graduate Admissions Committee,',
            bodyParagraphs: [
              `I am writing to express my eager desire to gain admission into your prestigious Master of Science program. Having graduated at the top of my undergraduate class and developed a keen interest in advanced structural engineering, I believe your curriculum offers the ideal setting for my academic development.`,
              `My undergraduate thesis explored sustainable concrete composites for high-temperature tropical climates, and I am keen to expand this research under your faculty's distinguished supervision. I have already acquired strong foundations in statistical modeling and advanced physics.`,
              `I am highly motivated to participate in your active research seminars, contribute to departmental teaching assistantships, and represent your institution with academic distinction.`,
              `Thank you for your review and consideration of my postgraduate application. I look forward to the opportunity to join your scholarly community.`
            ],
            signoff: 'Yours sincerely,'
          };
        case 'admin-permit':
          return {
            subject: 'APPLICATION FOR ADMINISTRATIVE PERMIT AND CLEARANCE',
            salutation: 'Your Excellency / Honorable Minister,',
            bodyParagraphs: [
              `I have the honor to write to your high office to respectfully request the issuance of an administrative permit and structural clearance for our upcoming municipal infrastructure initiative.`,
              `In strict compliance with current urban zoning codes and environmental safety standards, we have compiled all necessary technical diagrams, soil stability analyses, and community impact reports for your review. Our project aims to expand municipal transport safety and create dozens of local employment opportunities.`,
              `We remain at your disposal to supply any additional documentations or participate in state technical reviews to ensure absolute alignment with national regulations.`,
              `We thank you in advance for your high attention to this request, and pray you accept, Your Excellency, the assurances of our highest respect and consideration.`
            ],
            signoff: 'Yours respectfully,'
          };
        default:
          return {
            subject: 'FORMAL APPLICATION AND LETTER OF CORRESPONDENCE',
            salutation: 'Dear Sir/Madam,',
            bodyParagraphs: [
              `I am writing to bring to your attention a formal request regarding our ongoing business operations. We are dedicated to maintaining positive relations and ensuring all procedures are carried out professionally.`,
              `We have attached the relevant documentation for your records and stand ready to collaborate on any necessary next steps. Our team is fully committed to a smooth and mutually agreeable resolution.`,
              `Thank you for your prompt attention to this matter. We look forward to your feedback.`
            ],
            signoff: 'Yours faithfully,'
          };
      }
    }
    return {
      subject: 'FORMAL CORRESPONDENCE & REQUEST',
      salutation: 'Dear Sir/Madam,',
      bodyParagraphs: [
        `I am writing on behalf of our organization to submit this formal correspondence regarding our scheduled engagements and operational proposals.`,
        `Our team has prepared all preliminary technical specifications and stands ready to provide further details upon request.`,
        `Thank you for your review and consideration.`
      ],
      signoff: 'Yours faithfully,'
    };
  }

  function getFallbackCompanyStatutes(
    companyName?: string,
    legalForm?: string,
    jurisdiction?: string,
    headOffice?: string,
    shareCapital?: string,
    sharesCount?: string,
    shareValue?: string,
    initialManager?: string,
    scopeOfActivity?: string
  ) {
    const activeName = companyName || 'MADECC CIVIL WORKS SARL';
    const activeForm = legalForm || 'SARL (Societe a Responsabilite Limitee)';
    const activeJurisdiction = jurisdiction || 'Cameroon (OHADA Uniform Act) & Worldwide';
    const activeOffice = headOffice || 'Yaounde Mbankolo, Cameroon';
    const activeCapital = shareCapital || '10,000,000 FCFA';
    const activeSharesCount = sharesCount || '1,000';
    const activeShareValue = shareValue || '10,000 FCFA';
    const activeManager = initialManager || 'Dr. Marcel Mbida';
    const activeScope = scopeOfActivity || 'Execution of all civil works, building construction, road infrastructure, hydraulic and maritime engineering, and project supply chain logistics.';

    return {
      title: `ARTICLES OF ASSOCIATION OF ${activeName.toUpperCase()}`,
      metadata: `Governed under the provisions of the OHADA Uniform Act on Commercial Companies and Economic Interest Groups (AUDSCGIE) and applicable international business laws. Jurisdiction: ${activeJurisdiction}. Registered office: ${activeOffice}.`,
      articles: [
        {
          number: 1,
          title: "ARTICLE 1: LEGAL FORM AND DENOMINATION",
          content: `**1.1. Purpose & Scope:** This Article establishes the formal legal existence, corporate form, and denomination of the company to operate within Cameroon and international markets.\n\n**1.2. Legal Authority:** Conforming to Article 1 and Articles 309 to 384 of the OHADA Uniform Act Relating to Commercial Companies and Economic Interest Groups (AUDSCGIE).\n\n**1.3. Corporate Form:** The company is established in the form of a ${activeForm}. It operates as a limited liability entity where the shareholders' liabilities are strictly limited to the amount of their respective contributions to the share capital.\n\n**1.4. Corporate Name:** The company operates under the official corporate denomination: "${activeName}". This name must appear on all deeds, bills, invoices, letters, receipts, and publications issued by the company, followed immediately by its legal form, registered office address, and its registered share capital.\n\n**1.5. Protection & Penalties:** Any unauthorized third-party use of the company name is strictly prohibited and subject to civil and criminal penalties under Cameroonian trade laws. The General Manager is authorized to initiate intellectual property protection filings under OAPI guidelines.`
        },
        {
          number: 2,
          title: "ARTICLE 2: REGISTERED OFFICE (SIEGE SOCIAL) AND DOMICILE",
          content: `**2.1. Purpose & Scope:** Establishing the official address for statutory notices, tax declarations, and legal jurisdictions.\n\n**2.2. Legal Authority:** OHADA AUDSCGIE Articles 24 to 26 and Cameroonian tax residence statutes.\n\n**2.3. Location:** The registered office is located at: ${activeOffice}.\n\n**2.4. Procedures for Transfer:** The registered office designates the legal forum for any notification, administrative filing, or judicial action. The General Manager (Gerant) is authorized to transfer the registered office within the same city or territory by simple management decision. A transfer to a different city or region requires approval from the shareholders through an Extraordinary General Meeting (EGM) and subsequent update of the Trade and Personal Property Credit Register (RCCM).\n\n**2.5. Record Keeping:** All official letters, court writs, and regulatory notifications received at the registered office must be recorded in an incoming mail ledger overseen by the Company Secretary.`
        },
        {
          number: 3,
          title: "ARTICLE 3: CORPORATE PURPOSE (OBJET SOCIAL) AND INDUSTRIAL SPECIFICATIONS",
          content: `**3.1. Purpose & Scope:** Defining the commercial, technical, and engineering bounds of the company's operations.\n\n**3.2. Legal Authority:** OHADA AUDSCGIE Articles 19 to 21.\n\n**3.3. Permissible Construction & Engineering Scope:** The primary corporate purpose of the company consists of high-standard construction, civil engineering, and infrastructure operations, including:\n- 3.3.1. Execution of all civil engineering works, building construction, public works, road networks, bridge building, hydraulic dams, and structural installations.\n- 3.3.2. General contracting, infrastructure development, real estate development, and heavy equipment leasing.\n- 3.3.3. Technical design, architectural procurement, quantity surveying, supply chain logistics, and project management of complex industrial structures.\n- 3.3.4. Participation in public and private tenders, the formation of joint ventures (JVs), consortia, and partnerships.\n- 3.3.5. Any commercial, financial, industrial, or real estate operations directly or indirectly linked to the achievement of this corporate purpose.\n\n**3.4. Exceptions & Exclusions:** The company shall not engage in financial or banking activities reserved for accredited credit institutions under COBAC regulations.`
        },
        {
          number: 4,
          title: "ARTICLE 4: CORPORATE DURATION (DUREE)",
          content: `**4.1. Purpose & Scope:** Defining the legal lifespan of the company and rules for extension or early dissolution.\n\n**4.2. Legal Authority:** OHADA AUDSCGIE Article 28.\n\n**4.3. Lifespan:** The company is established for a duration of ninety-nine (99) years starting from its formal registration in the RCCM of Cameroon.\n\n**4.4. Procedures for Extension:** At least one (1) year prior to the expiration of the company's term, the General Manager must convene an Extraordinary General Meeting of shareholders to decide whether the company's duration should be extended. This decision must be made in accordance with the voting requirements of an EGM and filed with the notary public and the RCCM.\n\n**4.5. Failures and Penalties:** If the Manager fails to convene this meeting, any shareholder may petition the President of the competent commercial court to appoint a corporate representative to hold the meeting, with costs borne by the company.`
        },
        {
          number: 5,
          title: "ARTICLE 5: SHARE CAPITAL AND SHARES DISTRIBUTION",
          content: `**5.1. Purpose & Scope:** Detailing the capital structure, share valuation, and shareholder certificates.\n\n**5.2. Legal Authority:** OHADA AUDSCGIE Articles 311 to 316.\n\n**5.3. Capitalization:** The share capital is fixed at the sum of ${activeCapital}, divided into ${activeSharesCount} equal shares with a nominal value of ${activeShareValue} each, fully subscribed and paid up by the initial founders.\n\n**5.4. Certificates and Share Register:** Shares are nominative and represented by physical or digital Share Certificates signed by the General Manager. All transactions must be recorded in the company's physical and digital Share Transfer Register (Registre des transferts de parts) kept at the registered office.\n\n**5.5. Certificate Replacement:** If a certificate is lost or destroyed, a duplicate is issued upon proof of ownership, a 30-day public notice, and a signed indemnity bond. Capital increases or reductions must be authorized by an EGM.`
        },
        {
          number: 6,
          title: "ARTICLE 6: STATUTORY MANAGEMENT & LIMITATIONS OF POWER (GERANCE)",
          content: `**6.1. Purpose & Scope:** Governing the executive management of the company and limiting the powers of the Gerant.\n\n**6.2. Legal Authority:** OHADA AUDSCGIE Articles 323 to 328.\n\n**6.3. Appointment:** The company is managed and legally bound by its initial General Manager (Gerant): ${activeManager}, appointed for an indefinite term, unless removed by the shareholders.\n\n**6.4. Scope of Authority:** The Gerant has the broadest executive powers to act in all circumstances in the name of the company and conduct civil works operations. However, the Manager's authority is subject to board-approved limits.\n\n**6.5. Mandated Limitations of Power:** The Gerant is strictly prohibited from executing borrowing agreements exceeding 50% of the company's share capital, or selling substantial corporate real estate and assets, without the prior written authorization of the shareholders in a General Meeting. Violations of these limitations shall constitute grounds for immediate dismissal and personal liability for damages.`
        },
        {
          number: 7,
          title: "ARTICLE 7: SHAREHOLDERS' GENERAL MEETINGS (VOTING & NOTICES)",
          content: `**7.1. Purpose & Legal Authority:** Governing all collective decisions of the company's shareholders. Governed strictly under OHADA AUDSCGIE Articles 546 to 561.\n\n**7.2. Annual General Meeting (AGM) Mandates:**\n- 7.2.1. Held mandatorily within six (6) months of the close of each financial year (by June 30th).\n- 7.2.2. Responsibilities: Approval of the annual financial statements; appointment or removal of directors and statutory managers; appointment of external auditors; declaration of dividends; approval of strategic projects and major construction contracts exceeding 50% of capital; and authorizations for capital increases.\n\n**7.3. Extraordinary General Meeting (EGM) Mandates:**\n- 7.3.1. Convened by the Gerant, the statutory auditor, or shareholders representing at least twenty percent (20%) of the share capital in emergency circumstances.\n- 7.3.2. Responsibilities: Authorizing mergers, acquisitions, splits, spin-offs, early voluntary liquidation, amendments to these Articles of Association, sale of substantial corporate real estate or capital assets, and borrowing beyond approved limits.\n\n**7.4. Notice of Meetings & Documents:**\n- 7.4.1. Notice Period: Written notification delivered by hand against signature, registered post with acknowledgment of receipt, or official electronic mail (email) with read-receipt, sent at least fifteen (15) calendar days prior to the meeting date.\n- 7.4.2. Supporting Documents: Convocations must contain a precise Agenda and must be accompanied by draft resolutions, financial statements, the General Manager's report, and the Auditor's report.\n\n**7.5. Quorums, Adjournments & Voting Rights:**\n- 7.5.1. AGM Quorum: On first call, representing at least one-quarter (25%) of the shares. On second call, no quorum is required. Resolutions are passed by a simple majority of votes cast (50% + 1 vote).\n- 7.5.2. EGM Quorum: On first call, representing at least one-half (50%) of the share capital. On second call, representing at least one-quarter (25%) of the share capital. Resolutions require a two-thirds (66.67%) majority of votes present or represented.\n- 7.5.3. Voting Rights: Strictly "one share, one vote". Voting may be executed in person, by proxy to another shareholder, or through secure electronic voting. Ballots may be cast by show of hands, or secret ballot upon request of any shareholder. The Chairman shall have a casting vote only where expressly authorized.\n\n**7.6. Minutes & Record Keeping:** All deliberations must be recorded in formal Minutes (Proces-verbaux), signed by the General Manager/Chairman and the secretary of the assembly, and permanently stored in a sequential, numbered corporate minutes register (Registre des deliberations) preserved at the registered office. Failure to maintain correct records shall incur administrative penalties of 500,000 FCFA per instance.`
        },
        {
          number: 8,
          title: "ARTICLE 8: TRANSFER, TRANSMISSION, AND PLEDGING OF SHARES",
          content: `**8.1. Purpose & Legal Authority:** Regulating any changes in share ownership to maintain corporate stability and protect shareholders' assets under OHADA AUDSCGIE Articles 317 to 322.\n\n**8.2. Right of First Refusal (Pre-emption Right):** Existing shareholders enjoy an absolute right of first refusal. Any shareholder desiring to transfer shares to a non-shareholder third party must submit a written request via registered post to the General Manager, specifying the name of the transferee, the number of shares, and the agreed price. The General Manager shall notify all shareholders within seven (7) business days. Shareholders have thirty (30) calendar days from receipt to exercise their pre-emption rights proportionally.\n\n**8.3. Board Approval (Consent Clause):** Any transfer of shares to a non-shareholder third party requires mandatory prior approval by the General Meeting of shareholders representing at least three-quarters (75%) of the company's capital.\n\n**8.4. Valuation of Shares:** In the event of a dispute over the fair value of shares, the price shall be determined by an independent certified accountant/valuation expert (Expert-Comptable Agree CEMAC) appointed by mutual agreement of the parties or, failing that, by the President of the competent commercial court of Cameroon.\n\n**8.5. Share Certificates & Transfer Register:** Shares are nominative and represented by Share Certificates signed by the General Manager. All transactions must be recorded in the company's physical and digital Share Transfer Register (Registre des transferts de parts). If lost or destroyed, a replacement certificate is issued only after a 30-day public notice period and submission of a sworn indemnity bond.\n\n**8.6. Transmission upon Death of a Shareholder:** Heirs, successions, and executors do not automatically become active voting partners. The company's operations shall continue. Heirs must submit certified probate documents and be formally approved by the remaining shareholders within ninety (90) days. Executor powers are limited to estate preservation until approval.\n\n**8.7. Bankruptcy & Insolvency:** In the event of bankruptcy of a shareholder, the company reserves the right to purchase the bankrupt shareholder's shares at fair market value (determined by an expert) to prevent creditors from seizing voting controls.\n\n**8.8. Compliance Restrictions & Penalties:** Transfers that would create severe conflicts of interest, breach national security laws, violate Cameroonian public procurement regulations, or breach OHADA maximum shareholding guidelines are strictly prohibited and void *ab initio*. Violators shall be penalized via temporary suspension of dividend rights.`
        },
        {
          number: 9,
          title: "ARTICLE 9: ACCOUNTS, FINANCE, AUDIT AND PROFIT DISTRIBUTION",
          content: `**9.1. Purpose & Legal Authority:** Ensuring strict financial transparency, internal control, and compliance with national and international accounting frameworks under SYSCOHADA, IFRS guidelines, and International Standards on Auditing (ISAs).\n\n**9.2. Fiscal Year:** Commences on January 1st and terminates on December 31st of each calendar year.\n\n**9.3. Financial Statements:** The General Manager must establish and submit the annual financial statements within four (4) months of the close of the financial year (by April 30th), including: Statement of Financial Position (Bilan), Income Statement, Cash Flow Statement, Statement of Changes in Equity, and Notes to Accounts (Notes annexes) detailing site contingencies, performance guarantees, and retention money.\n\n**9.4. Construction Financial Controls & Budget Approval:** The company shall maintain robust construction internal controls. The annual operating and capital expenditure (CAPEX & OPEX) budgets must be submitted by the General Manager and approved by the shareholders before December 15th of the preceding fiscal year. All expenditures exceeding 10,000,000 FCFA outside the approved budget require board or general manager approval.\n\n**9.5. External Statutory Audit:** Appointment of an independent External Auditor (Commissaire aux Comptes) enrolled in the One-Order of Chartered Accountants of Cameroon (ONCCA) is mandatory if the company exceeds the statutory OHADA thresholds. The auditor is appointed for a three-year term and is responsible for certifying the accounts and submitting an independent audit report to the AGM.\n\n**9.6. Internal Audit Function:** A dedicated Internal Auditor shall monitor site-level expenditure, material waste, supplier invoices, and compliance with anti-corruption and HSE policies, reporting quarterly directly to the audit committee.\n\n**9.7. Profit Distribution & Reserves:** Net profit consists of total revenues minus operating costs, depreciation, and interest. Distribution Procedures:\n- 1. Deduct ten percent (10%) of net profit to form the mandatory Legal Reserve, until this reserve reaches twenty percent (20%) of the share capital.\n- 2. Allocate a minimum of fifteen percent (15%) to an **Equipment Replacement Reserve** for heavy machinery fleet.\n- 3. Allocate ten percent (10%) to a **Project Emergency Reserve** to cover defects liability and site incidents.\n- 4. Allocate five percent (5%) to a **Reinvestment & Capital Expansion Reserve**.\n- 5. Allocate the remaining balance to Retained Earnings or distribute as **Dividends** as approved by the AGM. Dividend payments must be executed within nine (9) months of approval.\n\n**9.8. Financial Transparency & Confidentiality:** Shareholders have a permanent right to inspect all corporate ledgers, invoices, payroll sheets, and audit reports at the registered office. All inspectors must execute a binding non-disclosure agreement to protect trade secrets and sensitive bidding prices.`
        },
        {
          number: 10,
          title: "ARTICLE 10: DISSOLUTION, LIQUIDATION AND DISPUTE RESOLUTION",
          content: `**10.1. Purpose & Legal Authority:** Managing the orderly winding up, debt settlement, and asset distribution of the company in case of cessation of business under OHADA AUDSCGIE Articles 200 to 241.\n\n**10.2. Grounds for Dissolution:** Voluntary decision by shareholders in an EGM (requiring 75% approval); Judicial court order by the competent court of Cameroon due to persistent insolvency or shareholder deadlock; Merger, acquisition, division, or corporate split; Expiration of the company's 99-year duration without extension.\n\n**10.3. Liquidation Process & Liquidator Appointment:** Dissolution immediately puts the company into "liquidation" status. The EGM shall appoint one or more professional Liquidators (usually a certified receiver or corporate attorney) and define their specific remuneration and powers. Upon appointment, all powers of the General Manager and Board of Directors shall terminate.\n\n**10.4. Liquidator Powers & Debt Settlement:** The liquidator has full power to realize all corporate assets, complete active construction projects under execution, collect outstanding receivables from government contracts, and settle liabilities.\nPriority of Settlement:\n- 1. First Priority: Employee statutory wages, outstanding HSE/accident compensation, and social insurance contributions (CNPS).\n- 2. Second Priority: Legal, liquidation, and court-mandated administrative fees.\n- 3. Third Priority: National tax liabilities, custom duties, and public municipal dues in Cameroon.\n- 4. Fourth Priority: Secured creditors, project bank loans, and supplier invoices.\n- 5. Fifth Priority: Unsecured creditors.\n\n**10.5. Final Accounts & Asset Distribution:** After complete debt settlement, the liquidator shall draft the final accounts. The remaining net assets (boni de liquidation) shall be distributed among the shareholders in proportion to their paid-up share capital.\n\n**10.6. Removal from Registry:** The liquidator must file the closing minutes, register the final accounts, and publish a notice of closure in a Journal of Legal Notices (JAL). The company is then formally removed from the RCCM in Cameroon.`
        },
        {
          number: 11,
          title: "ARTICLE 11: CORPORATE GOVERNANCE & EXECUTIVE MANAGEMENT",
          content: `**11.1. Purpose & Scope:** Establishing a robust, dual-tier corporate governance framework to steer strategic direction and operations.\n\n**11.2. Board of Directors:** Composed of three (3) to twelve (12) members appointed by the AGM for a term of four (4) years. The Board is responsible for defining the strategic direction of the company, approving tenders exceeding 500,000,000 FCFA, and supervising executive management.\n\n**11.3. Managing Director (Directeur General):** Appointed by the Board of Directors to execute daily operations, manage engineering sites, sign commercial agreements, and represent the company vis-a-vis clients and authorities.\n\n**11.4. Company Secretary (Secretaire General):** Responsible for statutory compliance, legal filings, organizing general meetings, ensuring that directors are kept fully informed of their legal duties under Cameroonian and OHADA laws, and preserving physical and digital corporate records.`
        },
        {
          number: 12,
          title: "ARTICLE 12: PUBLIC PROCUREMENT, TENDER PROCEDURES, AND FIDIC CONTRACTS",
          content: `**12.1. Scope & Applicability:** All public contracts, infrastructure tenders, and private engineering agreements under Cameroon MINMAP guidelines.\n\n**12.2. FIDIC Adherence:** All international and high-value domestic construction agreements must utilize standard international construction templates, specifically the International Federation of Consulting Engineers (FIDIC) standard forms (Red, Yellow, or Silver Books depending on the project structure).\n\n**12.3. Joint Ventures (JV) and Consortia:** Participation in tenders through JVs or consortia must be backed by a comprehensive Joint Venture Agreement detailing the division of civil engineering works, percentage of financial participation, mutual indemnities, and joint and several liability (responsabilite solidaire) before Cameroonian authorities.\n\n**12.4. Subcontractors and Consultants:** All subcontractors, consultants, architects, and surveyors must be vetted through a rigorous pre-qualification procurement policy, ensuring compliance with HSE norms, technical capacity, and financial solvency.`
        },
        {
          number: 13,
          title: "ARTICLE 13: SITE OPERATIONS, HSE, AND DEFECTS LIABILITY",
          content: `**13.1. Purpose & Scope:** Establishing standards for physical engineering works, worker safety, and client construction guarantees.\n\n**13.2. Occupational Health, Safety, and Environment (HSE):** The company enforces a zero-accident policy across all active construction sites. Daily site safety briefings, mandatory certified Personal Protective Equipment (PPE), and continuous safety inspections are mandatory.\n\n**13.3. Environmental Protection:** All civil projects must conduct a prior Environmental Impact Assessment (EIA) in compliance with Cameroonian environmental legislation and secure the necessary building permits.\n\n**13.4. Defects Liability Period (DLP) & Warranties:** The company formally guarantees its constructions. Every project shall incorporate a Defects Liability Period of twelve (12) months during which all engineering and technical defects must be repaired at the company's cost.\n\n**13.5. Garanti Decennal (Ten-Year Structural Guarantee):** In accordance with Article 1792 of the Civil Code in force in Cameroon, the company maintains a strict ten-year structural guarantee covering the complete stability and solid foundation of all built infrastructures.`
        },
        {
          number: 14,
          title: "ARTICLE 14: INSURANCE, BANKING AND BORROWING POWERS",
          content: `**14.1. Purpose & Scope:** Managing corporate assets, financial facilities, and operational risk mitigation.\n\n**14.2. Banking & Borrowing:** The company shall maintain dedicated, separate corporate bank accounts with accredited commercial banks in Cameroon under COBAC supervision. Borrowing powers must be exercised responsibly by the executive management within board-authorized thresholds.\n\n**14.3. Insurance Requirements:** To safeguard against operational risks, the company must maintain extensive insurance coverage, including Contractors' All Risks (CAR) insurance, professional indemnity, and mandatory workers' compensation.\n\n**14.4. Guarantees and Bonds:** Execution of performance guarantees, advance payment guarantees, and retention money bonds must be backed by reputable financial institutions in Cameroon.`
        },
        {
          number: 15,
          title: "ARTICLE 15: PROFESSIONAL ETHICS, ANTI-CORRUPTION & ESG",
          content: `**15.1. Purpose & Scope:** Enforcing business integrity, transparency, and sustainable construction values.\n\n**15.2. Anti-Corruption & Anti-Bribery:** Meticulous zero-tolerance policy against any form of bribery, bid-rigging, collusion, or facilitation payments in public or private tenders. Violations shall result in immediate termination of employment.\n\n**15.3. Whistleblower Protection:** Any employee or contractor reporting financial misconduct or safety breaches shall be provided complete anonymity and absolute protection from retaliatory measures.\n\n**15.4. Conflict of Interest:** Directors, engineers, and procurement leads must submit an annual Conflict of Interest disclosure. No director or manager may participate in bids or suppliers where they have a direct or indirect financial interest.\n\n**15.5. ESG Principles:** Commitment to sustainable construction practices, utilization of eco-friendly building materials, reduction of carbon footprint, fair wage structures, and local community development programs in regions of active operations.`
        },
        {
          number: 16,
          title: "ARTICLE 16: DISPUTE RESOLUTION, ARBITRATION, AND GOVERNING LAW",
          content: `**16.1. Purpose & Scope:** Regulating conflicts between shareholders, or between the company and third-party developers.\n\n**16.2. Governing Law:** These Articles, corporate operations, and construction contracts are governed by and construed in accordance with the laws of the Republic of Cameroon and the OHADA Uniform Acts.\n\n**16.3. Amicable Settlement (Mediation):** Any dispute arising from these Articles or corporate operations shall first be submitted to mandatory amicable mediation before a certified corporate mediator within thirty (30) days.\n\n**16.4. Arbitration:** Failing amicable resolution, the dispute shall be finally settled under the Rules of Arbitration of the GICAM Arbitration Center (Centre d'Arbitrage du GICAM) in Douala, or the Common Court of Justice and Arbitration (CCJA) of OHADA in Abidjan, Cote d'Ivoire. Deliberations shall be held in French or English.\n\n**16.5. Force Majeure:** Neither party nor the company shall be liable for delays or failures resulting from acts of God, war, severe civil unrest, regional lockouts, or extreme natural disasters beyond control.`
        }
      ],
      signoff: `Done in good faith and executed by the initial founders on this date.\n\nGeneral Manager: ${activeManager}\nRepresentative Stamp: MADECC COMPLIANCE LEDGER SEAL`
    };
  }



export function setupGeminiRoutes(app: express.Express) {
  // --- SERVER-SIDE GEMINI DIAGNOSTIC ENDPOINTS ---
  // ==========================================
  app.get('/api/admin/gemini-status', async (req, res) => {
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      return res.json({
        provider: 'gemini',
        configured: false,
        valid: false,
        errorCode: 'GEMINI_NOT_CONFIGURED',
        message: 'GEMINI_API_KEY is not defined in server environment variables.',
        checkedAt: new Date().toISOString()
      });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.json({
        provider: 'gemini',
        configured: false,
        valid: false,
        errorCode: 'GEMINI_NOT_CONFIGURED',
        message: 'Unable to initialize Gemini client.',
        checkedAt: new Date().toISOString()
      });
    }

    const modelToTest = 'gemini-3.7-flash';
    try {
      const probeResponse = await ai.models.generateContent({
        model: modelToTest,
        contents: 'Ping test. Respond with: PONG',
      });

      if (probeResponse && probeResponse.text) {
        return res.json({
          provider: 'gemini',
          configured: true,
          valid: true,
          model: modelToTest,
          checkedAt: new Date().toISOString()
        });
      }

      return res.json({
        provider: 'gemini',
        configured: true,
        valid: false,
        errorCode: 'PROVIDER_ERROR',
        message: 'Empty response returned from Google Generative AI probe.',
        checkedAt: new Date().toISOString()
      });
    } catch (err: any) {
      const norm = normalizeGeminiError(err);
      return res.json({
        provider: 'gemini',
        configured: true,
        valid: false,
        errorCode: norm.code,
        message: norm.message,
        checkedAt: new Date().toISOString()
      });
    }
  });

  app.get('/api/ai/status', async (req, res) => {
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      return res.json({
        provider: 'gemini',
        configured: false,
        valid: false,
        errorCode: 'GEMINI_NOT_CONFIGURED',
        message: 'GEMINI_API_KEY is not configured in server environment.',
        checkedAt: new Date().toISOString()
      });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.json({
        provider: 'gemini',
        configured: false,
        valid: false,
        errorCode: 'GEMINI_NOT_CONFIGURED',
        message: 'Unable to initialize Gemini client.',
        checkedAt: new Date().toISOString()
      });
    }

    try {
      const probeResponse = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: 'Ping test',
      });
      return res.json({
        provider: 'gemini',
        configured: true,
        valid: Boolean(probeResponse && probeResponse.text),
        model: 'gemini-3.7-flash',
        checkedAt: new Date().toISOString()
      });
    } catch (err: any) {
      const norm = normalizeGeminiError(err);
      return res.json({
        provider: 'gemini',
        configured: true,
        valid: false,
        errorCode: norm.code,
        message: norm.message,
        checkedAt: new Date().toISOString()
      });
    }
  });

  // --- CHATBOT (GEMINI) ENDPOINT ---
  // ==========================================
  app.post('/api/chat', async (req, res) => {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const gemini = getGeminiClient();
    if (!gemini) {
      return res.json({ 
        reply: "Thank you for reaching out to MADECC Group! Our AI virtual assistant is currently offline for scheduled maintenance. Please feel free to contact our direct customer support desk at +237 683 316 486 (or on WhatsApp) or email us at kreboya603@gmail.com. We look forward to assisting you with your construction and engineering needs!" 
      });
    }

    try {
      const systemInstruction = `You are "MADECC Bot", a virtual assistant representing MADECC Group, a premier construction and civil engineering firm in Cameroon.
Your role is to assist website visitors with their construction inquiries in a polite, highly informative, and professional manner.

MADECC Group Corporate Profiles:
- Headquarters: Yaounde Mbankolo, Cameroon. (Operating nationwide everywhere in Cameroon and across Africa).
- Phone Numbers for customer calls & Whatsapp:
  * +237 683 316 486 (General & WhatsApp)
  * +237 671 063 511 (Operations)
  * +237 689 115 595 (Projects)
  * +237 671 289 643 (Administration)
  * +237 640 194 505 (Customer Support)
- Official Email Contacts: kreboya603@gmail.com, madecccons@gmail.com
- Main Services: General Contracting, Architectural & Interior Design, Civil Infrastructure Planning, Green & Sustainable Building.
- Core Iconic Projects in Cameroon:
  * MADECC Eco-HQ Tower (Douala, Budget: 14.7 Billion FCFA) - A cutting-edge 6-story commercial office building in Douala featuring zero-carbon building design adapted for tropical climates.
  * Kribi Beachfront Luxury Estates (Kribi, Budget: 8.5 Billion FCFA) - A premium smart-grid residential complex of 12 custom net-zero luxury homes.
  * The Sanaga Bridge Corridor (Eda, Budget: 43.2 Billion FCFA) - A critical civil infrastructure highway and suspension bridge spanning the Sanaga River.
  * Douala Port Logistics Terminal (Douala Port, Budget: 22.8 Billion FCFA) - Modern industrial warehouse for automated Central African logistics.
- Currency: Central African CFA franc (FCFA / XAF).
- Human Support: If they request direct human assistance or custom engineering estimates, kindly invite them to submit their inquiry via our interactive contact form or schedule an appointment. You can also offer our direct phone, WhatsApp, or email desk channels for immediate personal service.

Answer customer inquiries professionally, explaining materials, safety compliance, estimates, and engineering processes. Always suggest booking a free consultation using our appointment scheduler or contact form, and offer them the direct phone numbers or WhatsApp link. Keep explanations helpful, concise, and professional. Respond in English or French depending on the user's language.`;

      const response = await retryWithFallback(async (modelName) => {
        const chatSession = gemini.chats.create({
          model: modelName,
          config: {
            systemInstruction,
          }
        });
        return await chatSession.sendMessage({ message });
      });

      res.json({ reply: response.text });
    } catch (error: any) {
      console.error('[CHAT_API_ERROR] Chat failed after all retries:', error);
      res.status(500).json({ error: 'Failed to communicate with virtual assistant.' });
    }
  });


  // ==========================================
  // --- CAREER STUDIO GENERATOR ENDPOINT ---

  app.post('/api/career/generate-letter', async (req, res) => {
    const {
      letterType,
      subType,
      senderName,
      senderTitle,
      senderEmail,
      senderPhone,
      senderAddress,
      recipientName,
      recipientTitle,
      recipientCompany,
      recipientAddress,
      customPrompt
    } = req.body;

    const gemini = getGeminiClient();
    
    if (!gemini) {
      console.warn('[GEMINI] Offline. Using fallback pre-crafted letters.');
      const fallback = getFallbackLetter(letterType, subType, senderName, recipientCompany);
      return res.json(fallback);
    }

    try {
      const systemInstruction = `You are an expert executive resume writer and career coach specializing in professional cover letters and official corporate/administrative application letters in Cameroon and internationally.

Your task is to write a highly professional, realistic, and persuasive cover letter or application letter based on the user's input.
Generate a structured JSON object containing:
1. "subject" - A bold, professional subject line (e.g. "APPLICATION FOR THE POSITION OF...")
2. "salutation" - An appropriate formal salutation (e.g. "Dear Mr. President,", "Dear Hiring Manager,", "Dear Sir/Madam,")
3. "bodyParagraphs" - An array of 3 to 4 distinct paragraphs. The first paragraph should state the intent to apply and enthusiasm, the middle paragraphs should highlight specific experience, technical skills, and value proposition tailored to the firm/industry, and the final paragraph should conclude with a call to action and a polite thank you.
4. "signoff" - A polite closing sign-off (e.g. "Yours faithfully,", "Sincerely,")

Choose high-quality, professional vocabulary, and tailor the letter carefully according to the requested letterType, subType, and any user accomplishments. Keep the letters fully realistic, referring to professional standards (like ONIGC, local municipal bridge projects, or corporate bid procedures in Cameroon where applicable if relevant to the sender/recipient).`;

      const userPrompt = `Generate a letter of type "${letterType}" (sub-type: "${subType}").
Sender details:
- Name: ${senderName || 'N/A'}
- Title: ${senderTitle || 'N/A'}
- Email: ${senderEmail || 'N/A'}
- Phone: ${senderPhone || 'N/A'}
- Address: ${senderAddress || 'N/A'}

Recipient details:
- Name: ${recipientName || 'N/A'}
- Title: ${recipientTitle || 'N/A'}
- Company/Institution: ${recipientCompany || 'N/A'}
- Address: ${recipientAddress || 'N/A'}

Additional highlights / Custom instructions from applicant:
"${customPrompt || 'None provided. Generate a highly persuasive, stellar letter.'}"`;

      const response = await retryWithFallback(async (modelName) => {
        return await gemini.models.generateContent({
          model: modelName,
          contents: userPrompt,
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                subject: { type: Type.STRING },
                salutation: { type: Type.STRING },
                bodyParagraphs: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                signoff: { type: Type.STRING }
              },
              required: ["subject", "salutation", "bodyParagraphs", "signoff"]
            }
          }
        });
      });

      const parsed = JSON.parse(response.text.trim());
      res.json(parsed);
    } catch (err: any) {
      console.warn('[Gemini Info] Falling back to offline cover letter generator:', err.message || err);
      // Fallback
      const fallback = getFallbackLetter(letterType, subType, senderName, recipientCompany);
      res.json(fallback);
    }
  });


  function getFallbackArticles(
    companyName: string,
    legalForm: string,
    jurisdiction: string,
    headOffice: string,
    shareCapital: string,
    sharesCount: string,
    shareValue: string,
    initialManager: string,
    scopeOfActivity: string
  ) {

  app.post('/api/documents/generate-articles', async (req, res) => {
    const {
      companyName,
      legalForm,
      jurisdiction,
      headOffice,
      durationYears,
      shareCapital,
      sharesCount,
      shareValue,
      initialManager,
      scopeOfActivity,
      customPrompt
    } = req.body;

    const gemini = getGeminiClient();
    
    if (!gemini) {
      console.warn('[GEMINI] Offline. Using fallback pre-crafted articles of association.');
      const fallback = getFallbackArticles(
        companyName,
        legalForm,
        jurisdiction,
        headOffice,
        shareCapital,
        sharesCount,
        shareValue,
        initialManager,
        scopeOfActivity
      );
      return res.json(fallback);
    }

    try {
      const systemInstruction = `You are a premier international corporate attorney and a leading expert in Central African OHADA company law, specializing in drafting Articles of Association (Statuts constitutifs) for construction, civil engineering, public works, logistics, and real estate development corporations in Cameroon and internationally.

Your task is to draft a highly professional, exhaustive, and legally compliant set of Articles of Association based on the user's input.
Generate a structured JSON object containing:
1. "title" - A formal title (e.g., "ARTICLES OF ASSOCIATION OF [COMPANY NAME]")
2. "metadata" - An introductory paragraph referencing legal governance (e.g. "Governed under the provisions of the OHADA Uniform Act on Commercial Companies and Economic Interest Groups (AUDSCGIE) and applicable international business laws.")
3. "articles" - An array of exactly 16 distinct, highly detailed articles. Each article object must contain:
   - "number" - Integer (1 to 16)
   - "title" - Short uppercase title of the article (e.g. "ARTICLE 7: SHAREHOLDERS' GENERAL MEETINGS", "ARTICLE 8: TRANSFER AND TRANSMISSION OF SHARES")
   - "content" - 1-2 robust, realistic, and legally-worded paragraphs explaining the specific stipulations, meticulously using correct financial terms, regulatory frameworks, local/international court jurisdiction, and corporate governance protocols.
   
The articles MUST include:
- ARTICLE 1: LEGAL FORM AND DENOMINATION
- ARTICLE 2: REGISTERED OFFICE (SIEGE SOCIAL)
- ARTICLE 3: CORPORATE PURPOSE (OBJET SOCIAL) AND TECHNICAL SPECIALIZATIONS
- ARTICLE 4: CORPORATE DURATION (DUREE)
- ARTICLE 5: SHARE CAPITAL AND SHARES DISTRIBUTION
- ARTICLE 6: STATUTORY MANAGEMENT & LIMITS OF AUTHORITY (GERANCE)
- ARTICLE 7: SHAREHOLDERS' GENERAL MEETINGS (VOTING & NOTICES) (detailed rules on notices, quorums, AGMs/EGMs, and voting rights)
- ARTICLE 8: TRANSFER AND TRANSMISSION OF SHARES (including Right of First Refusal, Board Consent, and transmission upon death or bankruptcy)
- ARTICLE 9: ACCOUNTS, FINANCE, AUDIT AND PROFIT DISTRIBUTION (including SYSCOHADA standards, internal controls, statutory audit, equipment replacement reserves, and dividends)
- ARTICLE 10: DISSOLUTION, LIQUIDATION AND DISPUTE RESOLUTION (including voluntary/involuntary dissolution, liquidator powers, and priority of debt settlement)
- ARTICLE 11: CORPORATE GOVERNANCE & EXECUTIVE MANAGEMENT (Board of Directors, Managing Director, Company Secretary)
- ARTICLE 12: PUBLIC PROCUREMENT, TENDER PROCEDURES, AND FIDIC CONTRACTS (FIDIC Books, Joint Ventures, subcontractor pre-qualification)
- ARTICLE 13: SITE OPERATIONS, HSE, AND DEFECTS LIABILITY (HSE policy, environmental impact, 12-month Defects Liability, 10-year Garant Decennal)
- ARTICLE 14: INSURANCE, BANKING AND BORROWING POWERS (CAR insurance, banking, performance bonds)
- ARTICLE 15: PROFESSIONAL ETHICS, ANTI-CORRUPTION & ESG (zero-tolerance bribery, Whistleblower protection, Conflicts of Interest, ESG)
- ARTICLE 16: DISPUTE RESOLUTION, ARBITRATION, AND GOVERNING LAW (Mediation, GICAM / CCJA Arbitration, Force Majeure)

4. "signoff" - A polite closing execution clause and stamp block (e.g., "Executed in Douala/Yaounde, Cameroon...").

Maintain strict professional legal vocabulary, incorporating standard notary-grade language and corporate rules. Ensure the capital, shares, and managers are fully integrated.`;

      const userPrompt = `Generate a set of construction company Articles of Association with these inputs:
- Company Name: ${companyName || 'N/A'}
- Legal Form: ${legalForm || 'SARL'}
- Primary Jurisdiction: ${jurisdiction || 'Cameroon (OHADA)'}
- Head Office: ${headOffice || 'N/A'}
- Duration of Company: ${durationYears || '99'} years
- Share Capital: ${shareCapital || 'N/A'}
- Total Number of Shares: ${sharesCount || 'N/A'}
- Nominal Value per Share: ${shareValue || 'N/A'}
- Initial Managing Director / CEO: ${initialManager || 'N/A'}
- Scope of Construction Activities: ${scopeOfActivity || 'Civil engineering, building construction, public works, road infrastructure, and related logistics.'}

Additional requirements or custom legal clauses:
"${customPrompt || 'None. Generate a comprehensive and standard set of Articles of Association.'}"`;

      const response = await retryWithFallback(async (modelName) => {
        return await gemini.models.generateContent({
          model: modelName,
          contents: userPrompt,
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                metadata: { type: Type.STRING },
                articles: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      number: { type: Type.INTEGER },
                      title: { type: Type.STRING },
                      content: { type: Type.STRING }
                    },
                    required: ["number", "title", "content"]
                  }
                },
                signoff: { type: Type.STRING }
              },
              required: ["title", "metadata", "articles", "signoff"]
            }
          }
        });
      });

      const parsed = JSON.parse(response.text.trim());
      res.json(parsed);
    } catch (err: any) {
      console.warn('[Gemini Info] Falling back to offline company articles generator:', err.message || err);
      const fallback = getFallbackArticles(
        companyName,
        legalForm,
        jurisdiction,
        headOffice,
        shareCapital,
        sharesCount,
        shareValue,
        initialManager,
        scopeOfActivity
      );
      res.json(fallback);
    }
  });

  app.post('/api/proposals/ai-assist', async (req, res) => {
    const {
      action,
      templateType,
      sectionName,
      currentContent,
      companyDetails,
      clientDetails,
      customPrompt
    } = req.body;

    const gemini = getGeminiClient();

    // Setup fallback responses in case Gemini API is offline or missing
    const getFallbackResponse = () => {
      const coName = companyDetails?.name || 'MADECC Group';
      const clName = clientDetails?.name || 'Ministry of Public Works';
      const projVal = clientDetails?.projectValue || '500,000,000 FCFA';
      const loc = clientDetails?.location || 'Douala, Cameroon';

      if (action === 'improve') {
        return `[REWRITTEN & IMPROVED BY MADECC AI]
The technical scope of work for this project has been fully audited and enhanced. ${currentContent || 'Initial draft'} is hereby revised to meet Cameroon public contracting standards and FIDIC Red Book regulations. We commit to executing all operations using state-of-the-art materials, certified technical engineering personnel, and under strict compliance with ISO 9001 quality guidelines and the Ministry of Public Works structural guidelines.`;
      }

      if (action === 'boq') {
        return JSON.stringify({
          items: [
            { id: "1", item: "1.1", description: "Site Mobilization & Preliminary Studies (Soil Tests, Topography)", unit: "LS", qty: 1, rate: 2500000, total: 2500000 },
            { id: "2", item: "1.2", description: "Excavation and Earthworks (Excavator CAT 320D)", unit: "m3", qty: 1500, rate: 8500, total: 12750000 },
            { id: "3", item: "1.3", description: "Reinforced Concrete Foundation (HA 12/14/16 Steel, Portland Cement)", unit: "m3", qty: 320, rate: 185000, total: 59200000 },
            { id: "4", item: "1.4", description: "Masonry work & Superstructure (Hollow Blocks 20x20x40)", unit: "m2", qty: 2400, rate: 22000, total: 52800000 },
            { id: "5", item: "1.5", description: "High-Efficiency Solar Power Installation (30kVA Hybrid System)", unit: "Set", qty: 1, rate: 18500000, total: 18500000 },
            { id: "6", item: "1.6", description: "Plumbing, Drainage, and Borehole Drilling (120m Depth)", unit: "LS", qty: 1, rate: 12000000, total: 12000000 },
            { id: "7", item: "1.7", description: "HSE Supervision & PPE Kits for Site Workers", unit: "LS", qty: 1, rate: 4500000, total: 4500000 }
          ],
          currency: "FCFA",
          totalEstimate: "162,250,000 FCFA"
        });
      }

      if (action === 'timeline') {
        return JSON.stringify({
          schedule: [
            { id: "t1", phase: "Phase 1: Mobilization", duration: "15 Days", dates: "Days 1-15", status: "Pending", description: "Transport heavy machinery (excavators, loaders), install temporary site offices, complete geotechnical and topographic surveys." },
            { id: "t2", phase: "Phase 2: Earthworks & Excavation", duration: "30 Days", dates: "Days 16-45", status: "Pending", description: "Excavation of foundation pits, leveling of terrain, compaction of backfill soil." },
            { id: "t3", phase: "Phase 3: Structural Masonry", duration: "45 Days", dates: "Days 46-90", status: "Pending", description: "Erection of reinforced concrete columns, beams, laying concrete blocks, pouring floor slabs." },
            { id: "t4", phase: "Phase 4: MEP & Technical Installations", duration: "25 Days", dates: "Days 91-115", status: "Pending", description: "Laying electrical conduits, plumbing pipes, installing hybrid solar panels, battery banks." },
            { id: "t5", phase: "Phase 5: Finishing & QA/QC", duration: "20 Days", dates: "Days 116-135", status: "Pending", description: "Plastering, painting, testing water quality, commissioning solar grid, final structural inspection." },
            { id: "t6", phase: "Phase 6: Clean Up & Handover", duration: "10 Days", dates: "Days 136-145", status: "Pending", description: "De-mobilization of heavy equipment, final cleaning of the site, official client handover ceremony." }
          ]
        });
      }

      if (action === 'risk-assessment') {
        return JSON.stringify({
          risks: [
            { id: "r1", description: "Heavy Rainfall/Flooding during Earthworks (Cameroon Rainy Season)", probability: "High", impact: "Medium", severity: "High", mitigation: "Schedule major excavation in dry season; establish high-capacity site dewatering pumps.", responsibility: "Project Engineer" },
            { id: "r2", description: "Material Price Fluctuations (Cement, Reinforcement Steel)", probability: "Medium", impact: "High", severity: "High", mitigation: "Procure 60% of critical structural materials upfront; lock in pricing with local suppliers.", responsibility: "Procurement Officer" },
            { id: "r3", description: "Workplace Accidents & Machinery Failure", probability: "Low", impact: "Critical", severity: "Medium", mitigation: "Daily safety briefs; mandatory full PPE; on-site HSE supervisor; weekly equipment checkups.", responsibility: "HSE Coordinator" },
            { id: "r4", description: "Delay in Government Permits & Authorizations", probability: "Medium", impact: "High", severity: "Medium", mitigation: "Submit all architectural & structural designs to municipal council 30 days before mobilization.", responsibility: "Liaison Officer" }
          ]
        });
      }

      // Default: 'generate-full'
      return `### ${sectionName.toUpperCase()}
#### Prepared by ${coName} for ${clName}
**Project Location:** ${loc}
**Project Estimate:** ${projVal}

1. **Executive Context**
Our proposed approach to the **${templateType || 'General Construction'}** project for **${clName}** is designed to satisfy all specified technical, financial, and structural goals. We combine decades of local experience in Cameroon with international engineering standards (FIDIC, Eurocodes).

2. **Technical Methodology**
- **Geotechnical Foundations:** All excavation and structural base designs will be backed by comprehensive soil mechanic tests.
- **Sustainable Procurement:** Sourcing of structural materials (steel, Portland cement, eco-friendly concrete aggregates) from certified local producers.
- **HSE Excellence:** Operating under a zero-accident paradigm, maintaining mandatory PPE, and continuous safety audits.

3. **Strategic Alignment**
We align our delivery with the national infrastructure acceleration programs (SND30) of Cameroon, ensuring the project creates local employment and respects the environmental regulations of MINEPDED.`;
    };

    if (!gemini) {
      console.warn('[GEMINI] Offline/Missing Key. Using premium proposal fallbacks.');
      return res.json({ result: getFallbackResponse() });
    }

    try {
      const coName = companyDetails?.name || 'MADECC Group';
      const clName = clientDetails?.name || 'Ministry of Public Works';
      const projVal = clientDetails?.projectValue || '500,000,000 FCFA';
      const loc = clientDetails?.location || 'Douala, Cameroon';

      const systemInstruction = `You are an elite International Construction Consultant, Technical Proposal Specialist, and Senior Estimator with over 30 years of experience writing multi-million dollar public and private sector tenders (FIDIC standards) for projects in West/Central Africa (especially Cameroon) and worldwide.
      
Your task is to generate highly technical, realistic, persuasive, and professionally written content for a construction company proposal.
Use clear formatting, markdown headers, and professional tables/lists where appropriate. Meticulously incorporate specific regional parameters (such as Cameroonian regulations, local currencies like FCFA, environmental concerns, local sourcing, and safety standards like HSE).`;

      let prompt = '';
      if (action === 'improve') {
        prompt = `You are asked to professionally rewrite and improve the following section: "${sectionName}" of a "${templateType}" proposal.
Company: ${coName}
Client: ${clName}
Project Value: ${projVal}
Location: ${loc}

Current Section Draft to Audit & Improve:
"${currentContent || 'No draft provided'}"

Instructions:
1. Rewrite this draft to make it highly professional, technical, persuasive, and legally compliant with construction industry norms.
2. Fix all grammatical, technical, or formatting issues.
3. Enhance vocabulary with words like "rigorous", "structural integrity", "state-of-the-art", "compliance", "optimization", "sustainable".
4. Add 2-3 detailed paragraphs or bullet points to significantly enrich the depth.
5. Focus heavily on actual civil engineering practices.`;
      } else if (action === 'boq') {
        prompt = `Generate a complete Bill of Quantities (BOQ) and materials estimate for a "${templateType}" project.
Company: ${coName}
Client: ${clName}
Project Value: ${projVal}
Location: ${loc}
User request notes: ${customPrompt || 'Generate standard realistic items'}

Generate a structured JSON response containing:
1. "items": An array of realistic, highly detailed item objects. Each item must contain:
   - "id": A unique string ID (e.g. "1")
   - "item": A standard numbering system string (e.g., "1.1", "1.2")
   - "description": Realistic description of civil works, mobilization, materials, or installations
   - "unit": Valid civil works units (e.g., "m3", "m2", "LM", "LS", "Tons", "Set")
   - "qty": Realistic numeric quantity
   - "rate": Realistic unit price in FCFA (or applicable currency)
   - "total": The calculated total (qty * rate)
2. "currency": "FCFA" or specified currency
3. "totalEstimate": Clean string representing the sum total.

Ensure all entries are fully realistic for this kind of project. Do not include placeholder texts.`;
      } else if (action === 'timeline') {
        prompt = `Generate a realistic construction schedule / project timeline for a "${templateType}" project.
Company: ${coName}
Client: ${clName}
Project Value: ${projVal}
Location: ${loc}
User request notes: ${customPrompt || 'Generate standard realistic stages'}

Generate a structured JSON response containing:
1. "schedule": An array of phase objects. Each phase object must contain:
   - "id": Unique string (e.g. "t1")
   - "phase": Name of the phase (e.g., "Phase 1: Soil Mechanics & Site Clearing")
   - "duration": Duration string (e.g. "14 Days", "3 Weeks")
   - "dates": Day range or sequence (e.g. "Days 1-14", "Days 15-45")
   - "status": "Pending"
   - "description": A highly detailed description of actions, personnel involved, and heavy machinery deployed in this phase.

Ensure the timeline is logically ordered and engineering-accurate.`;
      } else if (action === 'risk-assessment') {
        prompt = `Generate a comprehensive Risk Register & Safety Assessment for a "${templateType}" project.
Company: ${coName}
Client: ${clName}
Location: ${loc}

Generate a structured JSON response containing:
1. "risks": An array of risk objects. Each object must contain:
   - "id": Unique string (e.g., "r1")
   - "description": A highly specific construction risk (e.g., soil collapse, rainy season flooding in Cameroon, price spikes)
   - "probability": "Low" | "Medium" | "High"
   - "impact": "Low" | "Medium" | "High" | "Critical"
   - "severity": "Low" | "Medium" | "High"
   - "mitigation": Detailed, actionable engineering or management mitigation strategy
   - "responsibility": Role responsible (e.g. Project Manager, HSE Supervisor, HSE Coordinator)

Ensure the risks are highly specific to construction and civil engineering.`;
      } else {
        // default: 'generate-full'
        prompt = `Generate the complete technical content for the section "${sectionName}" of a "${templateType}" proposal.
Company: ${coName}
Client: ${clName}
Project Value: ${projVal}
Location: ${loc}
Custom Request details: "${customPrompt || 'Create a comprehensive professional section.'}"

Provide an outstanding, comprehensive technical document styled beautifully in Markdown with sections, lists, and clear headers. Ensure the depth is sufficient for a formal public tender (AO - Appel d'Offres) submission to ministries, public corporations, or private enterprises in Cameroon or globally. Integrate industry guidelines (like Eurocodes, BAEL, NF standards, and FIDIC contracts).`;
      }

      const responseMimeType = (action === 'boq' || action === 'timeline' || action === 'risk-assessment') ? "application/json" : "text/plain";

      const response = await retryWithFallback(async (modelName) => {
        return await gemini.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            systemInstruction,
            responseMimeType
          }
        });
      });

      res.json({ result: response.text.trim() });
    } catch (err: any) {
      console.warn('[Gemini Info] Falling back to offline proposal assistant:', err.message || err);
      res.json({ result: getFallbackResponse() });
    }
  });
}
}

