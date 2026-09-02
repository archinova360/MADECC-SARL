import React, { useState } from 'react';
import { 
  X, 
  Share2, 
  ExternalLink, 
  Copy, 
  Check, 
  QrCode, 
  ShieldCheck, 
  Sparkles, 
  MessageCircle, 
  Radio, 
  Users, 
  Settings,
  Bell,
  Heart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSiteSettings } from '../lib/SiteSettingsContext.tsx';

interface FollowUsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToAdminCms?: () => void;
  isAdmin?: boolean;
}

export default function FollowUsModal({ 
  isOpen, 
  onClose, 
  onNavigateToAdminCms,
  isAdmin = false 
}: FollowUsModalProps) {
  const { settings } = useSiteSettings();
  const [activeTab, setActiveTab] = useState<'channels' | 'qrcode' | 'share'>('channels');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [selectedNetworkForQr, setSelectedNetworkForQr] = useState<string>('all');

  if (!isOpen) return null;

  const socialChannels = [
    {
      id: 'linkedin',
      name: 'LinkedIn Corporate',
      category: 'B2B & Engineering Whitepapers',
      handle: '@madeccgroup',
      url: settings?.linkedinUrl || 'https://linkedin.com/company/madeccgroup',
      color: 'bg-blue-600/10 text-blue-400 border-blue-500/30 hover:bg-blue-600/20',
      badgeColor: 'bg-blue-500/20 text-blue-300',
      iconText: 'in',
      followers: '12.4K+ Followers',
      verified: true,
      actionText: 'Follow Company',
      description: 'Official corporate announcements, executive hiring, infrastructure whitepapers & CEMAC tenders.'
    },
    {
      id: 'facebook',
      name: 'Facebook Community',
      category: 'Project News & Site Photos',
      handle: '@madeccgroup',
      url: settings?.facebookUrl || 'https://facebook.com/madeccgroup',
      color: 'bg-blue-700/10 text-blue-400 border-blue-600/30 hover:bg-blue-700/20',
      badgeColor: 'bg-blue-600/20 text-blue-300',
      iconText: 'fb',
      followers: '28.5K+ Followers',
      verified: true,
      actionText: 'Follow Page',
      description: 'Live site photo albums, groundbreaking ceremonies, client handovers & community news.'
    },
    {
      id: 'youtube',
      name: 'YouTube Channel',
      category: 'Drone Corridors & Engineering TV',
      handle: '@madeccgroup',
      url: settings?.youtubeUrl || 'https://youtube.com/@madeccgroup',
      color: 'bg-red-600/10 text-red-400 border-red-500/30 hover:bg-red-600/20',
      badgeColor: 'bg-red-500/20 text-red-300',
      iconText: '▶',
      followers: '8.9K+ Subscribers',
      verified: true,
      actionText: 'Subscribe',
      description: '4K aerial drone tours, structural loading tests, civil documentary shorts & site timelapses.'
    },
    {
      id: 'twitter',
      name: 'X (Twitter)',
      category: 'Real-Time Tenders & Corridors',
      handle: '@madeccgroup',
      url: settings?.twitterUrl || 'https://x.com/madeccgroup',
      color: 'bg-slate-700/10 text-slate-300 border-slate-600/30 hover:bg-slate-700/20',
      badgeColor: 'bg-slate-700/40 text-slate-200',
      iconText: '𝕏',
      followers: '15.1K+ Followers',
      verified: true,
      actionText: 'Follow @madeccgroup',
      description: 'Instant press bulletins, MINTP procurement updates, highway progress & technical notes.'
    },
    {
      id: 'instagram',
      name: 'Instagram Visuals',
      category: 'Architecture & 3D Render Portfolios',
      handle: '@madeccgroup',
      url: settings?.instagramUrl || 'https://instagram.com/madeccgroup',
      color: 'bg-pink-600/10 text-pink-400 border-pink-500/30 hover:bg-pink-600/20',
      badgeColor: 'bg-pink-500/20 text-pink-300',
      iconText: '📷',
      followers: '19.8K+ Followers',
      verified: true,
      actionText: 'Follow on IG',
      description: 'Photorealistic architectural 3D visualizations, facade detailing, luxury villa tours & site reels.'
    },
    {
      id: 'tiktok',
      name: 'TikTok Official',
      category: 'Heavy Machinery & Site Shorts',
      handle: '@madeccgroup',
      url: settings?.tiktokUrl || 'https://tiktok.com/@madeccgroup',
      color: 'bg-emerald-600/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-600/20',
      badgeColor: 'bg-emerald-500/20 text-emerald-300',
      iconText: '♪',
      followers: '34.2K+ Fans',
      verified: true,
      actionText: 'Watch on TikTok',
      description: 'Excavators, massive concrete pouring marathons, cranes in action & site engineering tips.'
    },
    {
      id: 'pinterest',
      name: 'Pinterest Blueprint Hub',
      category: 'Modern Interior & Structural Design',
      handle: '@madeccgroup',
      url: settings?.pinterestUrl || 'https://pinterest.com/madeccgroup',
      color: 'bg-rose-700/10 text-rose-400 border-rose-600/30 hover:bg-rose-700/20',
      badgeColor: 'bg-rose-600/20 text-rose-300',
      iconText: '📌',
      followers: '6.4K+ Pinners',
      verified: true,
      actionText: 'Save Pins',
      description: 'Curated architectural boards, foundation blueprints, structural finishes & interior aesthetics.'
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp Official Channel',
      category: 'Instant Tenders & Direct Dispatch',
      handle: '+237 683 316 486',
      url: `https://wa.me/237683316486?text=${encodeURIComponent('Hello MADECC GROUP, I would like to join your official broadcast updates & inquire about construction services.')}`,
      color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20',
      badgeColor: 'bg-emerald-500/20 text-emerald-300',
      iconText: '💬',
      followers: '45K+ Community',
      verified: true,
      actionText: 'Join WhatsApp',
      description: 'Direct dispatch with our senior engineering team, instant BOQ answers & emergency civil hotline.'
    }
  ];

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleShareApp = async () => {
    const shareData = {
      title: settings?.shareHeadline || 'MADECC GROUP — Premier Construction & Civil Engineering Firm',
      text: settings?.shareDescription || 'Check out MADECC GROUP for certified civil engineering, structural calculations, digital BOQs, and heavy construction in Cameroon.',
      url: window.location.origin
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // User cancelled or share failed
      }
    } else {
      handleCopy(window.location.origin, 'native_url');
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      id="follow-us-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="bg-[#0D0E12] border border-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        id="follow-us-modal-dialog"
      >
        {/* Top Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-[#13141B] to-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 shadow-inner">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                  Follow & Connect with <span className="text-amber-400">{settings?.siteName || 'MADECC GROUP'}</span>
                </h3>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="w-3 h-3" /> Official Channels
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Stay updated with live construction site cameras, tender bulletins, drone footage & engineering insights.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && onNavigateToAdminCms && (
              <button
                onClick={() => {
                  onClose();
                  onNavigateToAdminCms();
                }}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
                title="Customize social handles in Admin Dashboard"
              >
                <Settings className="w-3.5 h-3.5 text-amber-400" />
                <span>Edit in CMS</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              id="btn-close-follow-modal"
              aria-label="Close social modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub Navigation Bar */}
        <div className="px-6 py-2.5 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between text-xs font-semibold shrink-0">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('channels')}
              className={`px-3.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'channels'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Social Networks ({socialChannels.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('qrcode')}
              className={`px-3.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'qrcode'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>QR Mobile Pass</span>
            </button>
            <button
              onClick={() => setActiveTab('share')}
              className={`px-3.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'share'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share Portal</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-slate-500 font-mono text-[11px]">
            <Bell className="w-3.5 h-3.5 text-amber-500 animate-bounce" />
            <span>Over 160K+ Engineers & Clients Connected</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-grow space-y-4">
          
          {/* TAB 1: ALL CHANNELS GRID */}
          {activeTab === 'channels' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {socialChannels.map((channel) => {
                const isCopied = copiedKey === channel.id;
                return (
                  <div
                    key={channel.id}
                    className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between group hover:bg-slate-900/80 shadow-md"
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center font-bold text-base transition-transform group-hover:scale-105 shadow-inner ${channel.color}`}>
                            {channel.iconText}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                                {channel.name}
                              </h4>
                              {channel.verified && (
                                <span className="text-sky-400 text-xs" title="Verified Corporate Profile">
                                  ✓
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] font-mono text-slate-400 block">
                              {channel.handle}
                            </span>
                          </div>
                        </div>

                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${channel.badgeColor}`}>
                          {channel.followers}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
                        {channel.description}
                      </p>
                    </div>

                    {/* Action Bar */}
                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleCopy(channel.url, channel.id)}
                        className="flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-amber-400 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-amber-500/30 transition-all"
                        title="Copy profile link"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400 font-bold">Link Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Link</span>
                          </>
                        )}
                      </button>

                      <a
                        href={channel.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all group-hover:shadow-amber-500/20"
                      >
                        <span>{channel.actionText}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: QR CODE SCANNER PASS */}
          {activeTab === 'qrcode' && (
            <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl flex flex-col md:flex-row items-center gap-8">
              <div className="p-4 bg-white rounded-2xl shadow-2xl flex flex-col items-center justify-center shrink-0 border-4 border-amber-500/20">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                    selectedNetworkForQr === 'all' 
                      ? window.location.origin 
                      : (socialChannels.find(c => c.id === selectedNetworkForQr)?.url || window.location.origin)
                  )}&color=0b0f19&bgcolor=ffffff&margin=1`}
                  alt="MADECC Social QR Code"
                  className="w-48 h-48 rounded-lg"
                />
                <span className="text-[10px] font-mono font-bold text-slate-800 mt-2 uppercase tracking-widest">
                  Scan With Phone Camera
                </span>
              </div>

              <div className="space-y-4 text-left">
                <div>
                  <span className="text-[11px] font-mono font-bold text-amber-400 uppercase tracking-wider block">
                    Instant Mobile Social Portal
                  </span>
                  <h4 className="text-lg font-bold text-white mt-1">
                    Scan on Android / iOS to Follow Instantly
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Point your camera to instantly open our verified profiles, subscribe to video reels, and join our direct WhatsApp dispatch group.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Select Channel for QR Code</label>
                  <select
                    value={selectedNetworkForQr}
                    onChange={(e) => setSelectedNetworkForQr(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                  >
                    <option value="all">Main Official Hub (Website Portal)</option>
                    {socialChannels.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.handle})</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={() => handleCopy(
                      selectedNetworkForQr === 'all' 
                        ? window.location.origin 
                        : (socialChannels.find(c => c.id === selectedNetworkForQr)?.url || window.location.origin),
                      'qr_url'
                    )}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold border border-slate-700 transition-colors"
                  >
                    {copiedKey === 'qr_url' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedKey === 'qr_url' ? 'URL Copied!' : 'Copy Target Link'}</span>
                  </button>

                  <a
                    href={selectedNetworkForQr === 'all' ? window.location.origin : (socialChannels.find(c => c.id === selectedNetworkForQr)?.url || window.location.origin)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors"
                  >
                    <span>Launch Link Directly</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SHARE PORTAL */}
          {activeTab === 'share' && (
            <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-6">
              <div>
                <span className="text-[11px] font-mono font-bold text-amber-400 uppercase tracking-wider block">
                  Share MADECC GROUP With Partners
                </span>
                <h4 className="text-lg font-bold text-white mt-1">
                  Recommend Our Engineering & Construction Services
                </h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Share our certified capabilities, live calculators, and project portfolios with colleagues, real estate developers, and international partners.
                </p>
              </div>

              {/* Share Preview Card */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-white">
                      {settings?.shareHeadline || 'MADECC GROUP — Leading Civil Engineering & Construction'}
                    </h5>
                    <span className="text-[11px] font-mono text-slate-400">
                      {window.location.origin}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-400 italic">
                  "{settings?.shareDescription || 'Check out MADECC GROUP for certified civil engineering, structural design, cost calculators, and turnkey construction.'}"
                </p>
              </div>

              {/* Share Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleShareApp}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg transition-all"
                  id="btn-native-share"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share via Native Device Apps</span>
                </button>

                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    `${settings?.shareHeadline || 'MADECC GROUP'}\n${window.location.origin}\n\n${settings?.shareDescription || ''}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Share to WhatsApp</span>
                </a>

                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.origin)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors"
                >
                  <span>Share on LinkedIn</span>
                </a>

                <button
                  onClick={() => handleCopy(window.location.origin, 'copy_site_url')}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors border border-slate-700"
                >
                  {copiedKey === 'copy_site_url' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedKey === 'copy_site_url' ? 'URL Copied!' : 'Copy Portal URL'}</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer Note */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] font-mono text-slate-500 shrink-0">
          <div className="flex items-center gap-2">
            <Heart className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>Engineered with integrity &bull; Yaoundé & Douala, Cameroon</span>
          </div>
          <div>
            <span>All profiles managed & verified by MADECC Executive Directorate</span>
          </div>
        </div>

      </motion.div>
    </div>
  );
}
