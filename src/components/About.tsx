import { useState, useEffect } from 'react';
import { 
  Building2, 
  Award, 
  FileText, 
  Download, 
  Calendar, 
  Users, 
  ShieldCheck, 
  HeartHandshake,
  Mail,
  Briefcase,
  GraduationCap,
  MapPin,
  CheckCircle2,
  HardHat,
  Ruler,
  Compass,
  FileCheck2,
  Scale
} from 'lucide-react';
import { CompanyDocument, TeamMember } from '../types.ts';
import { FadeIn, StaggerContainer, StaggerItem, InteractiveCard } from './MotionReveal.tsx';

export default function About() {
  const [documents, setDocuments] = useState<CompanyDocument[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(true);
  const [failedImages, setFailedImages] = useState<Record<number, boolean>>({});

  const DEFAULT_FALLBACK = 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80';

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const res = await fetch('/api/documents');
        if (res.ok) {
          setDocuments(await res.json());
        }
      } catch (err) {
        console.error('Error fetching documents:', err);
      }
    };

    const fetchTeam = async () => {
      try {
        const res = await fetch('/api/team');
        if (res.ok) {
          const membersList = await res.json();
          setTeam(membersList);
        }
      } catch (err) {
        console.error('Error fetching team members:', err);
      } finally {
        setLoadingTeam(false);
      }
    };

    fetchDocs();
    fetchTeam();
  }, []);

  return (
    <div className="font-sans text-slate-200 bg-[#0A0A0B] min-h-screen">
      
      {/* Page Header */}
      <section className="bg-slate-950/80 border-b border-slate-850/60 text-white py-20 relative overflow-hidden" id="about-header">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-3xl">
            <span className="text-xs font-bold font-mono uppercase text-amber-500 tracking-widest bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-md inline-block mb-3">
              Corporate Overview & Engineering Philosophy
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
              About MADECC GROUP Cameroon
            </h1>
            <p className="text-slate-300 text-base sm:text-lg mt-4 leading-relaxed font-normal">
              A multi-disciplinary civil engineering, building construction, and quantity surveying company based in Yaoundé, delivering robust structural execution, transparent cost control, and full regulatory compliance across Cameroon.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content Sections */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          
          {/* Main text block */}
          <div className="lg:col-span-7 space-y-12">
            
            {/* Who We Are */}
            <FadeIn className="space-y-4">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2.5">
                <Building2 className="w-6 h-6 text-amber-500" /> Who We Are
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed">
                MADECC GROUP is a full-service construction, civil engineering, and enterprise consulting company headquartered in Yaoundé Mbankolo, Cameroon. We were established to address the critical need for technical precision, transparent pricing, and rigorous on-site execution in the Central African construction sector.
              </p>
              <p className="text-slate-400 text-sm leading-relaxed">
                Too many property developers, diaspora builders, and institutional investors in Cameroon experience unexpected cost overruns, substandard concrete pours, foundation cracking, or permit disputes. MADECC GROUP bridges this gap by applying disciplined engineering standards (Eurocode 2 and BAEL 91), verified geotechnical testing, and detailed Bills of Quantities (BOQ) with fixed unit rates.
              </p>
            </FadeIn>

            {/* Our Geographical Footprint in Cameroon */}
            <FadeIn delay={0.1} className="space-y-4 bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl hover:border-slate-700 transition-colors">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-amber-500" /> Operational Reach Across Cameroon
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                While our central headquarters is located in <strong>Yaoundé (Centre Region)</strong>, our mobile engineering units and project teams operate across Cameroon's 10 regions:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                <div className="flex items-start gap-2 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Centre Region:</strong> Yaoundé (Mbankolo, Bastos, Odza, Simbock, Nkolbisson, Olembé)</span>
                </div>
                <div className="flex items-start gap-2 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Littoral Region:</strong> Douala (Bonanjo, Bonapriso, Akwa, Bonamoussadi, Yassa, Logbessou)</span>
                </div>
                <div className="flex items-start gap-2 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>South Region:</strong> Kribi (Industrial Port corridor, coastal residential zones)</span>
                </div>
                <div className="flex items-start gap-2 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>West Region:</strong> Bafoussam, Dschang, Bagangté & high-altitude residential hubs</span>
                </div>
                <div className="flex items-start gap-2 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>South-West & North-West:</strong> Limbe, Buea, Bamenda structural projects</span>
                </div>
                <div className="flex items-start gap-2 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Northern Regions:</strong> Garoua, Maroua, Ngaoundéré civil & enterprise infrastructure</span>
                </div>
              </div>
            </FadeIn>

            {/* Core Values grid */}
            <div className="space-y-6 pt-2">
              <h3 className="text-xl font-bold text-white border-b border-slate-800 pb-3">Our Core Corporate Pillars</h3>
              <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <StaggerItem className="p-5 bg-slate-900/50 border border-slate-800/80 rounded-xl shadow-sm space-y-2 hover:border-amber-500/30 transition-colors">
                  <div className="flex items-center gap-2.5 text-amber-500">
                    <Ruler className="w-5 h-5" />
                    <h4 className="font-bold text-white text-sm">Engineering Rigor & Calculation</h4>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">Every structural element is calculated using Eurocode 2 / BAEL 91 formulas. We verify load distributions, rebar bending schedules (BBS), and soil bearing capacities before excavation.</p>
                </StaggerItem>
                
                <StaggerItem className="p-5 bg-slate-900/50 border border-slate-800/80 rounded-xl shadow-sm space-y-2 hover:border-amber-500/30 transition-colors">
                  <div className="flex items-center gap-2.5 text-amber-500">
                    <Scale className="w-5 h-5" />
                    <h4 className="font-bold text-white text-sm">Transparent Quantity Surveying</h4>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">No arbitrary estimations or surprise surcharges. We formulate detailed BOQs with transparent material, labor, and plant itemizations in Central African CFA Francs (FCFA).</p>
                </StaggerItem>

                <StaggerItem className="p-5 bg-slate-900/50 border border-slate-800/80 rounded-xl shadow-sm space-y-2 hover:border-amber-500/30 transition-colors">
                  <div className="flex items-center gap-2.5 text-amber-500">
                    <ShieldCheck className="w-5 h-5" />
                    <h4 className="font-bold text-white text-sm">Zero-Harm QHSE Safety Policy</h4>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">Mandatory PPE on all active sites, scaffold safety checks, harness requirements for height work, and strict compliance with national environmental impact guidelines.</p>
                </StaggerItem>

                <StaggerItem className="p-5 bg-slate-900/50 border border-slate-800/80 rounded-xl shadow-sm space-y-2 hover:border-amber-500/30 transition-colors">
                  <div className="flex items-center gap-2.5 text-amber-500">
                    <HardHat className="w-5 h-5" />
                    <h4 className="font-bold text-white text-sm">Tropical Climate Adaptation</h4>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">We design for Cameroon's heavy equatorial rainfall and high humidity: deep perimeter drainage, multi-coat bitumen foundation waterproofing, and anti-efflorescence plastering.</p>
                </StaggerItem>
              </StaggerContainer>
            </div>

            {/* Who We Build For */}
            <div className="space-y-4 pt-2">
              <h3 className="text-xl font-bold text-white border-b border-slate-800 pb-3">Who Our Services Are For</h3>
              <StaggerContainer className="space-y-3 text-sm text-slate-300">
                <StaggerItem className="flex items-start gap-3 p-3.5 bg-slate-900/30 border border-slate-800/60 rounded-xl hover:border-slate-700 transition-colors">
                  <span className="font-mono text-amber-500 font-bold text-xs bg-amber-500/10 px-2 py-0.5 rounded">01</span>
                  <div>
                    <strong className="text-white block text-xs uppercase tracking-wide">Diaspora Property Developers & Families:</strong>
                    <span className="text-xs text-slate-400">Cameroonians living abroad in France, North America, UK, Germany, and globally who need a trustworthy, accountable partner with weekly video updates, milestone-based banking escrow, and transparent receipts.</span>
                  </div>
                </StaggerItem>
                <StaggerItem className="flex items-start gap-3 p-3.5 bg-slate-900/30 border border-slate-800/60 rounded-xl hover:border-slate-700 transition-colors">
                  <span className="font-mono text-amber-500 font-bold text-xs bg-amber-500/10 px-2 py-0.5 rounded">02</span>
                  <div>
                    <strong className="text-white block text-xs uppercase tracking-wide">Private Landowners & Homebuilders:</strong>
                    <span className="text-xs text-slate-400">Individuals building custom duplexes, contemporary villas, or multi-family rental apartments seeking turnkey design-build excellence without the stress of managing informal labor.</span>
                  </div>
                </StaggerItem>
                <StaggerItem className="flex items-start gap-3 p-3.5 bg-slate-900/30 border border-slate-800/60 rounded-xl hover:border-slate-700 transition-colors">
                  <span className="font-mono text-amber-500 font-bold text-xs bg-amber-500/10 px-2 py-0.5 rounded">03</span>
                  <div>
                    <strong className="text-white block text-xs uppercase tracking-wide">Commercial & Industrial Enterprises:</strong>
                    <span className="text-xs text-slate-400">Companies requiring warehouse logistics hubs, corporate offices, retail complexes, or agricultural processing plants built to strict industrial specifications and load standards.</span>
                  </div>
                </StaggerItem>
                <StaggerItem className="flex items-start gap-3 p-3.5 bg-slate-900/30 border border-slate-800/60 rounded-xl hover:border-slate-700 transition-colors">
                  <span className="font-mono text-amber-500 font-bold text-xs bg-amber-500/10 px-2 py-0.5 rounded">04</span>
                  <div>
                    <strong className="text-white block text-xs uppercase tracking-wide">Public Sector & Institutional Partners:</strong>
                    <span className="text-xs text-slate-400">Organizations issuing public tenders (Appels d'Offres) requiring registered contractors with verified administrative dossiers, tax clearance (Quitus Fiscal), and FIDIC contract adherence.</span>
                  </div>
                </StaggerItem>
              </StaggerContainer>
            </div>

          </div>

          {/* Right sidebar: Technical Standards & Document downloads */}
          <FadeIn direction="left" className="lg:col-span-5 space-y-8">
            
            {/* Technical Framework & Compliance Card */}
            <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800 space-y-5">
              <div className="border-b border-slate-800 pb-3">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-500">Technical Rigor</span>
                <h3 className="font-bold text-lg text-white flex items-center gap-2 mt-0.5">
                  <Award className="w-5 h-5 text-amber-500" /> Engineering Codes & Standards
                </h3>
              </div>
              
              <ul className="space-y-3.5 text-xs leading-relaxed text-slate-300">
                <li className="flex items-start gap-2.5">
                  <div className="p-1 rounded bg-amber-500/10 text-amber-500 shrink-0 mt-0.5">
                    <FileCheck2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <strong className="text-white">Eurocode 2 & BAEL 91:</strong>
                    <p className="text-slate-400 text-[11px] mt-0.5">Structural reinforced concrete design, moment capacity formulas, and rebar lap schedules.</p>
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <div className="p-1 rounded bg-amber-500/10 text-amber-500 shrink-0 mt-0.5">
                    <FileCheck2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <strong className="text-white">Geotechnical Soil Investigations:</strong>
                    <p className="text-slate-400 text-[11px] mt-0.5">Cone Penetrometer Tests (CPT) and standard soil bearing checks across lateritic & coastal clays.</p>
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <div className="p-1 rounded bg-amber-500/10 text-amber-500 shrink-0 mt-0.5">
                    <FileCheck2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <strong className="text-white">28-Day Concrete Cube Compression:</strong>
                    <p className="text-slate-400 text-[11px] mt-0.5">Systematic crush testing in certified laboratories (C25/30 / 350kg/m³ standard dosing).</p>
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <div className="p-1 rounded bg-amber-500/10 text-amber-500 shrink-0 mt-0.5">
                    <FileCheck2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <strong className="text-white">MINDDU & Municipal Permit Alignment:</strong>
                    <p className="text-slate-400 text-[11px] mt-0.5">Complete technical dossiers for Permis de Construire with CUY, CUD, and regional urban councils.</p>
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <div className="p-1 rounded bg-amber-500/10 text-amber-500 shrink-0 mt-0.5">
                    <FileCheck2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <strong className="text-white">FIDIC & Transparent Milestone Contracts:</strong>
                    <p className="text-slate-400 text-[11px] mt-0.5">Standard contract conditions with defined milestone handovers and retention safety guarantees.</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Document downloads card */}
            <div className="bg-[#0E0E10]/90 border border-slate-850 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="border-b border-slate-850 pb-3">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-500">Corporate Documentation</span>
                <h3 className="font-bold text-white text-base flex items-center gap-2 mt-0.5">
                  <FileText className="w-5 h-5 text-amber-500" /> Downloadable Charters & Guides
                </h3>
              </div>
              
              <p className="text-xs text-slate-400 leading-relaxed">
                Access official MADECC GROUP safety manuals, engineering guidelines, and company credentials.
              </p>

              {documents.length > 0 ? (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <a
                      key={doc.id}
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 bg-slate-950 border border-slate-850 hover:border-amber-500 rounded-lg group transition-all"
                      id={`doc-download-${doc.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-slate-900 text-amber-500 rounded border border-slate-800">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="block text-xs font-bold text-slate-200 group-hover:text-amber-500 transition-colors">{doc.title}</span>
                          <span className="block text-[9px] text-slate-500 font-mono">Type: {doc.docType.toUpperCase()} | Vers. {doc.version}</span>
                        </div>
                      </div>
                      <Download className="w-4 h-4 text-slate-500 group-hover:text-amber-500 transition-colors" />
                    </a>
                  ))}
                </div>
              ) : (
                <div className="text-center p-4 bg-slate-950 border border-slate-850 rounded-lg text-xs text-slate-500">
                  Documentation available upon request via our contact portal.
                </div>
              )}
            </div>

            {/* Quick Contact & Consultation Card */}
            <div className="bg-gradient-to-br from-amber-500/10 via-slate-900/60 to-slate-900 border border-amber-500/20 rounded-2xl p-6 space-y-4">
              <h4 className="font-bold text-white text-sm">Need a Technical Consultation in Cameroon?</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Speak directly with a civil engineer or quantity surveyor to review your land title, architectural drawings, or cost estimate.
              </p>
              <div className="pt-1 space-y-2">
                <a 
                  href="tel:+237683316486" 
                  className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 px-4 rounded-xl text-xs transition-all shadow-md hover:shadow-amber-500/20"
                >
                  Direct Call: (+237) 683 31 64 86
                </a>
                <a 
                  href="https://wa.me/237683316486" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all shadow-md"
                >
                  WhatsApp Engineering Line
                </a>
              </div>
            </div>

          </FadeIn>

        </div>

        {/* Our Team Section */}
        <div className="mt-24 border-t border-slate-900 pt-16 space-y-12" id="our-team-section">
          <FadeIn className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold font-mono uppercase text-amber-500 tracking-widest block">
              Professional Engineering Organization
            </span>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">Our Technical Leadership Team</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Our engineering team brings together certified civil engineers, quantity surveyors, architects, and on-site project supervisors committed to execution excellence in Cameroon.
            </p>
          </FadeIn>

          {loadingTeam ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="bg-slate-900/40 border border-slate-850 rounded-2xl p-5 animate-pulse space-y-4">
                  <div className="aspect-square bg-slate-800 rounded-xl w-full" />
                  <div className="h-4 bg-slate-800 rounded w-2/3" />
                  <div className="h-3 bg-slate-800 rounded w-1/2" />
                  <div className="h-3 bg-slate-800 rounded w-5/6" />
                </div>
              ))}
            </div>
          ) : team.length > 0 ? (
            <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {team.map((member) => (
                <StaggerItem
                  key={member.id} 
                  className="bg-slate-900/30 border border-slate-850 hover:border-amber-500/50 rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
                  itemScope 
                  itemType="https://schema.org/Person"
                >
                  <div className="space-y-4">
                    {/* Headshot */}
                    <div className="aspect-square rounded-xl overflow-hidden relative bg-slate-950 border border-slate-850">
                      <img 
                        src={failedImages[member.id] || !member.image ? DEFAULT_FALLBACK : member.image} 
                        alt={member.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        itemProp="image"
                        onError={(e) => {
                          console.error(`[IMAGE_LOAD_ERROR] Failed image for member ID ${member.id} (${member.name}):`, member.image);
                          setFailedImages(prev => ({ ...prev, [member.id]: true }));
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>

                    {/* Meta info */}
                    <div className="space-y-1">
                      <h3 itemProp="name" className="font-bold text-white text-base group-hover:text-amber-400 transition-colors">
                        {member.name}
                      </h3>
                      <p itemProp="jobTitle" className="text-xs font-bold text-amber-500 tracking-wide">
                        {member.role}
                      </p>
                    </div>

                    {/* Specialization & Credentials */}
                    <div className="space-y-2 text-xs text-slate-400 border-t border-slate-850/80 pt-3">
                      <div className="flex items-start gap-2.5">
                        <GraduationCap className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                        <span className="leading-relaxed font-sans">{member.specialization}</span>
                      </div>
                    </div>
                  </div>

                  {/* Contact info */}
                  {member.email && (
                    <div className="pt-4 mt-4 border-t border-slate-850/50">
                      <a 
                        href={`mailto:${member.email}`}
                        className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-amber-400 transition-colors"
                        itemProp="email"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>{member.email}</span>
                      </a>
                    </div>
                  )}
                </StaggerItem>
              ))}
            </StaggerContainer>
          ) : (
            <div className="text-center p-12 bg-slate-900/30 border border-slate-850 rounded-2xl text-slate-500 text-sm">
              Technical leadership profiles available on request.
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
