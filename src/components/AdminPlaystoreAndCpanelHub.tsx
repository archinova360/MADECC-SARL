import React, { useState } from 'react';
import {
  Smartphone,
  Server,
  Globe,
  CheckCircle2,
  Copy,
  Check,
  Download,
  ExternalLink,
  ShieldCheck,
  Layers,
  FileCode,
  Terminal,
  ArrowRight,
  Info,
  ChevronDown,
  ChevronUp,
  Cpu,
  Lock,
  RefreshCw,
  Zap
} from 'lucide-react';

export const AdminPlaystoreAndCpanelHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'cpanel' | 'playstore' | 'dns' | 'configs'>('cpanel');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  const copyToClipboard = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2500);
  };

  const htaccessSnippet = `# ==============================================================================
# MADECC GROUP - Production cPanel & Apache / LiteSpeed Configuration (.htaccess)
# ==============================================================================
Options -Indexes
AddDefaultCharset UTF-8

<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # 1. Force HTTPS (Strict SSL)
  RewriteCond %{HTTPS} off
  RewriteCond %{HTTP:X-Forwarded-Proto} !https
  RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

  # 2. Allow Direct Access to Static Assets & Verification Files
  RewriteRule ^\\.well-known/assetlinks\\.json$ - [L]
  RewriteRule ^(robots\\.txt|sitemap\\.xml|ads\\.txt|manifest\\.json)$ - [L]

  # 3. Single Page Application (SPA) Routing Fallback
  RewriteRule ^index\\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

# 4. MIME Types
<IfModule mod_mime.c>
  AddType application/manifest+json   .webmanifest .json
  AddType application/ld+json         .jsonld
  AddType image/svg+xml               .svg
  AddType image/webp                  .webp
  AddType font/woff                   .woff
  AddType font/woff2                  .woff2
</IfModule>

# 5. GZIP Compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/plain text/html text/xml text/css text/javascript
  AddOutputFilterByType DEFLATE application/xml application/javascript application/json application/manifest+json image/svg+xml
</IfModule>

# 6. Browser Caching
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresDefault "access plus 2 days"
  ExpiresByType text/html "access plus 0 seconds"
  ExpiresByType application/json "access plus 0 seconds"
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/webp "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
</IfModule>

# 7. Security Headers
<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set X-Frame-Options "SAMEORIGIN"
  Header set X-XSS-Protection "1; mode=block"
  Header set Referrer-Policy "strict-origin-when-cross-origin"
  <FilesMatch "\\.(webmanifest|json)$">
    Header set Access-Control-Allow-Origin "*"
  </FilesMatch>
</IfModule>`;

  const assetlinksSnippet = `[
  {
    "relation": [
      "delegate_permission/common.handle_all_urls"
    ],
    "target": {
      "namespace": "android_app",
      "package_name": "online.madeccgroup.twa",
      "sha256_cert_fingerprints": [
        "14:6D:E9:7E:0F:52:9C:ED:3E:EE:4F:7E:6D:88:2E:FE:09:A6:49:12:47:8E:B8:38:52:77:E6:BA:61:94:AE:BB"
      ]
    }
  }
]`;

  const manifestSnippet = `{
  "id": "/",
  "name": "MADECC GROUP - Engineering, Construction & Tech",
  "short_name": "MADECC Group",
  "description": "Cameroon's premier civil engineering, construction management, and architectural enterprise.",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait-primary",
  "theme_color": "#0f172a",
  "background_color": "#0f172a",
  "icons": [
    { "src": "/pwa-192x192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "/pwa-512x512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
    { "src": "/pwa-maskable-512x512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ],
  "screenshots": [
    {
      "src": "/screenshot-wide.png",
      "sizes": "1280x720",
      "type": "image/png",
      "form_factor": "wide",
      "label": "MADECC GROUP Civil Engineering & Construction Management Dashboard"
    },
    {
      "src": "/screenshot-narrow.png",
      "sizes": "720x1280",
      "type": "image/png",
      "form_factor": "narrow",
      "label": "MADECC Mobile Project Budget Estimator & Services Portal"
    }
  ]
}`;

  return (
    <div className="rounded-2xl bg-slate-900/95 border-2 border-indigo-500/40 p-5 sm:p-6 shadow-xl space-y-5 my-6">
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs font-mono font-bold uppercase">
              <Smartphone className="w-3.5 h-3.5" /> Google Play Store &amp; cPanel Hosting Hub
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> PRODUCTION READY
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-extrabold text-white">
            Dual Deployment: Google Play Store App + cPanel / Apache Hosting
          </h3>
          <p className="text-xs text-slate-400">
            Everything is prepared: PWA service worker, icons, Google Play Digital Asset Links, and cPanel Apache <code className="text-amber-400 font-mono">.htaccess</code> routing with zero downtime on Netlify / GitHub.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1 cursor-pointer transition"
          >
            <span>{isExpanded ? 'Collapse Hub' : 'Expand Hub'}</span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-6">
          {/* Readiness Status Matrix */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase text-slate-400 flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5 text-indigo-400" /> Play Store (TWA)
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                  READY
                </span>
              </div>
              <div className="text-xs font-bold text-white">PWA &amp; AssetLinks Configured</div>
              <p className="text-[11px] text-slate-400 leading-tight">
                Manifest, 192/512/maskable icons &amp; service worker active.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase text-slate-400 flex items-center gap-1">
                  <Server className="w-3.5 h-3.5 text-amber-400" /> cPanel / Apache
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                  READY
                </span>
              </div>
              <div className="text-xs font-bold text-white">.htaccess SPA Rewrite</div>
              <p className="text-[11px] text-slate-400 leading-tight">
                GZIP compression, mod_expires caching &amp; HTTPS redirects configured.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase text-slate-400 flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-cyan-400" /> GitHub / Netlify
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">
                  LIVE
                </span>
              </div>
              <div className="text-xs font-bold text-white">_redirects Maintained</div>
              <p className="text-[11px] text-slate-400 leading-tight">
                Current hosting keeps running smoothly while you migrate.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase text-slate-400 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-yellow-400" /> Google AdSense
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                  ACTIVE
                </span>
              </div>
              <div className="text-xs font-bold text-white">ca-pub-7227721489757915</div>
              <p className="text-[11px] text-slate-400 leading-tight">
                Direct meta tag &amp; script in head + cookie consent banner.
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
            <button
              onClick={() => setActiveTab('cpanel')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'cpanel'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'bg-slate-800/70 text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Server className="w-3.5 h-3.5" />
              <span>cPanel Deployment Guide</span>
            </button>

            <button
              onClick={() => setActiveTab('playstore')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'playstore'
                  ? 'bg-indigo-500 text-white shadow-md'
                  : 'bg-slate-800/70 text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Google Play Store Guide</span>
            </button>

            <button
              onClick={() => setActiveTab('dns')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'dns'
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'bg-slate-800/70 text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>DNS &amp; Domain Switch</span>
            </button>

            <button
              onClick={() => setActiveTab('configs')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'configs'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'bg-slate-800/70 text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>View &amp; Copy Configs</span>
            </button>
          </div>

          {/* TAB 1: CPANEL GUIDE */}
          {activeTab === 'cpanel' && (
            <div className="space-y-4">
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-xs text-amber-200 flex items-start gap-3">
                <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong>Why your website works flawlessly on cPanel now:</strong> When visitors reload or visit direct URLs like <code className="bg-slate-950 px-1 py-0.5 rounded text-amber-300 font-mono">/services</code> or <code className="bg-slate-950 px-1 py-0.5 rounded text-amber-300 font-mono">/blog</code>, Apache normally gives a 404 error without an SPA rewrite rule. We created a production <code className="bg-slate-950 px-1 py-0.5 rounded text-amber-300 font-mono">.htaccess</code> file that routes all requests to <code className="bg-slate-950 px-1 py-0.5 rounded text-amber-300 font-mono">index.html</code>, enforces HTTPS, and enables GZIP compression.
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase font-mono">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 text-[11px]">1</span>
                    Build &amp; Package Your Code
                  </div>
                  <p className="text-xs text-slate-300">
                    Run the build command in terminal:
                  </p>
                  <pre className="bg-slate-900 p-2.5 rounded-lg text-emerald-400 font-mono text-xs overflow-x-auto">
npm run build
                  </pre>
                  <p className="text-[11px] text-slate-400">
                    This generates the production bundle inside the <code className="text-amber-300">dist/</code> folder including <code className="text-amber-300">.htaccess</code>, <code className="text-amber-300">manifest.json</code>, and <code className="text-amber-300">.well-known/assetlinks.json</code>.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase font-mono">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 text-[11px]">2</span>
                    Compress the dist/ Directory
                  </div>
                  <p className="text-xs text-slate-300">
                    Open the <code className="text-amber-300">dist/</code> folder on your computer, select all files, and compress them into a single zip file (e.g. <code className="text-emerald-400 font-mono">madecc-dist.zip</code>).
                  </p>
                  <p className="text-[11px] text-slate-400">
                    <em>Tip: Make sure the zip contains <code className="text-amber-300">index.html</code> right at its root, not wrapped in an extra subfolder.</em>
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase font-mono">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 text-[11px]">3</span>
                    Upload to cPanel File Manager
                  </div>
                  <ol className="text-xs text-slate-300 space-y-1 list-decimal list-inside">
                    <li>Log into your <strong>cPanel</strong>.</li>
                    <li>Open <strong>File Manager</strong>.</li>
                    <li>Navigate to the <code className="text-amber-300 font-mono">public_html</code> folder (or your addon domain folder).</li>
                    <li>Click <strong>Upload</strong> and upload <code className="text-emerald-400 font-mono">madecc-dist.zip</code>.</li>
                    <li>Right-click the zip file and click <strong>Extract</strong>.</li>
                  </ol>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase font-mono">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 text-[11px]">4</span>
                    Enable Hidden Files &amp; AutoSSL
                  </div>
                  <ol className="text-xs text-slate-300 space-y-1 list-decimal list-inside">
                    <li>In cPanel File Manager, click <strong>Settings</strong> (top right) and check <strong>"Show Hidden Files (dotfiles)"</strong> so <code className="text-amber-300 font-mono">.htaccess</code> is visible.</li>
                    <li>Go to cPanel home &rarr; <strong>SSL/TLS Status</strong> &rarr; Click <strong>Run AutoSSL</strong> to activate your free HTTPS certificate.</li>
                    <li>Test your website at your domain: all routes, modals, and download links will work seamlessly.</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PLAY STORE GUIDE */}
          {activeTab === 'playstore' && (
            <div className="space-y-4">
              <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-4 text-xs text-indigo-200 flex items-start gap-3">
                <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <strong>Google Play Store Distribution (TWA / Trusted Web Activity):</strong> Google allows PWAs to be packaged into standard Android App Bundles (<code className="bg-slate-950 px-1 py-0.5 rounded text-indigo-300 font-mono">.aab</code>) and published on the Google Play Store. The app runs fullscreen with native performance, offline support, and zero browser URL bars.
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-400 uppercase font-mono flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 text-[11px]">1</span>
                      Use PWABuilder (Official Microsoft / Google Tool — 100% Free)
                    </span>
                    <a
                      href="https://www.pwabuilder.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition"
                    >
                      <span>Open PWABuilder</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <p className="text-xs text-slate-300">
                    Visit <strong className="text-white">PWABuilder.com</strong>, enter your live URL (<code className="text-indigo-300 font-mono">https://madeccgroup.online</code>), and click <strong>Start</strong>. It will evaluate your manifest, service worker, and icons—giving you a 100% score.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="text-xs font-bold text-indigo-400 uppercase font-mono flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 text-[11px]">2</span>
                    Package for Android (.aab file)
                  </div>
                  <p className="text-xs text-slate-300">
                    Click <strong>Package for Android</strong> &rarr; enter your Android app package details:
                  </p>
                  <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                    <li>Package ID: <code className="text-indigo-300 font-mono">online.madeccgroup.twa</code></li>
                    <li>App Name: <code className="text-indigo-300 font-mono">MADECC GROUP</code></li>
                    <li>Short Name: <code className="text-indigo-300 font-mono">MADECC Group</code></li>
                    <li>Include notification delegation: <code className="text-indigo-300 font-mono">Yes</code></li>
                  </ul>
                  <p className="text-xs text-slate-300">
                    Click <strong>Generate</strong> to download your signed <code className="text-emerald-400 font-mono">.aab</code> package and your signing key.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="text-xs font-bold text-indigo-400 uppercase font-mono flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 text-[11px]">3</span>
                    Verify Digital Asset Links
                  </div>
                  <p className="text-xs text-slate-300">
                    PWABuilder provides your app's <strong>SHA-256 fingerprint</strong>. Copy it into <code className="text-amber-300 font-mono">public/.well-known/assetlinks.json</code> on your server. This tells Android that <code className="text-indigo-300 font-mono">https://madeccgroup.online</code> owns the app, removing the browser address bar for a 100% native feel!
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="text-xs font-bold text-indigo-400 uppercase font-mono flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 text-[11px]">4</span>
                    Upload to Google Play Console
                  </div>
                  <ol className="text-xs text-slate-300 space-y-1 list-decimal list-inside">
                    <li>Log in to <strong>Google Play Console</strong> (<code className="text-indigo-300 font-mono">play.google.com/console</code>).</li>
                    <li>Click <strong>Create App</strong> &rarr; enter "MADECC GROUP", select Free / Business app.</li>
                    <li>Under <strong>App releases</strong>, upload your generated <code className="text-emerald-400 font-mono">.aab</code> file.</li>
                    <li>Enter your mandatory Privacy Policy URL: <code className="text-emerald-400 font-mono">https://madeccgroup.online/privacy</code> (already live and compliant).</li>
                    <li>Complete the Store Listing with your description, logo (<code className="text-amber-300 font-mono">public/logo.png</code>), and submit for Google review!</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DNS MIGRATION */}
          {activeTab === 'dns' && (
            <div className="space-y-4">
              <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4 text-xs text-cyan-200 flex items-start gap-3">
                <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <strong>Zero-Downtime Migration Strategy:</strong> Your domain <code className="bg-slate-950 px-1 py-0.5 rounded text-cyan-300 font-mono">madeccgroup.online</code> is currently running on GitHub and Netlify. You can keep it running on Netlify while setting up and testing cPanel. Once your cPanel files are uploaded, you simply switch your DNS records!
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-cyan-400 uppercase font-mono">
                  DNS Records Configuration for cPanel
                </h4>
                <p className="text-xs text-slate-300">
                  In your domain registrar dashboard (where you registered <code className="text-cyan-300">madeccgroup.online</code>), update the following DNS records:
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-900 text-slate-300 font-mono text-[11px] uppercase">
                      <tr>
                        <th className="p-2.5 rounded-l-lg">Type</th>
                        <th className="p-2.5">Name / Host</th>
                        <th className="p-2.5">Value / Target</th>
                        <th className="p-2.5 rounded-r-lg">TTL</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300 font-mono">
                      <tr>
                        <td className="p-2.5 text-amber-400 font-bold">A</td>
                        <td className="p-2.5">@ (or leave blank)</td>
                        <td className="p-2.5 text-emerald-400">Your cPanel Shared IP (e.g. 192.0.2.1)</td>
                        <td className="p-2.5">Automatic / 3600</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 text-cyan-400 font-bold">CNAME</td>
                        <td className="p-2.5">www</td>
                        <td className="p-2.5 text-emerald-400">madeccgroup.online</td>
                        <td className="p-2.5">Automatic / 3600</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  * To find your <strong>Shared IP Address</strong> in cPanel: Look at the right sidebar of your cPanel main page under <strong>General Information &rarr; Shared IP Address</strong>.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: VIEW & COPY CONFIGS */}
          {activeTab === 'configs' && (
            <div className="space-y-4">
              {/* .htaccess snippet */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-white font-mono">public/.htaccess (cPanel Apache Config)</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(htaccessSnippet, 'htaccess')}
                    className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1 transition"
                  >
                    {copiedSection === 'htaccess' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSection === 'htaccess' ? 'Copied!' : 'Copy .htaccess'}</span>
                  </button>
                </div>
                <pre className="p-3 rounded-lg bg-slate-900 text-slate-300 font-mono text-[11px] max-h-48 overflow-y-auto">
{htaccessSnippet}
                </pre>
              </div>

              {/* assetlinks.json snippet */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-bold text-white font-mono">public/.well-known/assetlinks.json (Google Play Store)</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(assetlinksSnippet, 'assetlinks')}
                    className="px-2.5 py-1 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-bold flex items-center gap-1 transition"
                  >
                    {copiedSection === 'assetlinks' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSection === 'assetlinks' ? 'Copied!' : 'Copy AssetLinks'}</span>
                  </button>
                </div>
                <pre className="p-3 rounded-lg bg-slate-900 text-slate-300 font-mono text-[11px] max-h-40 overflow-y-auto">
{assetlinksSnippet}
                </pre>
              </div>

              {/* manifest.json snippet */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-white font-mono">public/manifest.json (Web App Manifest)</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(manifestSnippet, 'manifest')}
                    className="px-2.5 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-1 transition"
                  >
                    {copiedSection === 'manifest' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSection === 'manifest' ? 'Copied!' : 'Copy Manifest'}</span>
                  </button>
                </div>
                <pre className="p-3 rounded-lg bg-slate-900 text-slate-300 font-mono text-[11px] max-h-40 overflow-y-auto">
{manifestSnippet}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPlaystoreAndCpanelHub;
