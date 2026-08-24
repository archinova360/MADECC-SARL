import React, { useState, useEffect, useRef } from 'react';
import { fetchUserSyncData, saveUserSyncData } from '../lib/syncService.ts';
import { 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  Square, 
  SkipForward, 
  Settings, 
  X, 
  MessageSquareText, 
  Volume1, 
  Mic, 
  Headphones, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// At least 25 unique professional scripts promoting MADECC Group
const NARRATION_SCRIPTS = [
  "Welcome to MADECC Group, where cutting-edge engineering excellence meets sustainable infrastructure solutions. We are dedicated to shaping the future of African innovation with global standards.",
  "At MADECC Group, we power digital transformation and modern construction technologies to deliver unparalleled business development consultancy across the globe.",
  "Driven by a commitment to renewable energy and sustainable civil engineering, MADECC Group provides professional services designed to exceed customer satisfaction.",
  "Welcome to the vanguard of industrial growth. MADECC Group blends advanced technology, professional consultancy, and architectural mastery to turn bold visions into landmark realities.",
  "Our mission at MADECC Group is simple: to establish new benchmarks for quality, safety, and performance in civil works, technology systems, and clean energy deployment.",
  "With deep-seated expertise in renewable resources, MADECC Group empowers public and private sectors to achieve rapid, eco-friendly infrastructural transformation.",
  "Experience the power of premium consultancy with MADECC Group. We guide ambitious enterprises through high-impact business development, technological upgrades, and optimized asset management.",
  "MADECC Group is a premier partner for civil infrastructure, engineering design, and digital systems. Together, we build sturdy foundations for a brighter tomorrow.",
  "Harnessing the spirit of African innovation, MADECC Group integrates smart building materials and smart grid solutions to deliver durable, cost-effective, and high-performance projects.",
  "Our global workforce at MADECC Group combines decades of experience in real estate development, green energy planning, and state-of-the-art construction management.",
  "MADECC Group stands at the intersection of heavy engineering and digital intelligence, accelerating sustainable industrialization and carbon-neutral infrastructure.",
  "By adhering strictly to rigorous quality and compliance standards, MADECC Group guarantees elite project execution from initial feasibility study to operational hand-off.",
  "Welcome to MADECC Group. We help you capitalize on clean energy markets, resilient architectural designs, and forward-looking digital assets to scale your enterprise successfully.",
  "MADECC Group is your trusted advisor for complex engineering projects. We offer end-to-end solutions that elevate efficiency, reduce waste, and secure community-wide benefits.",
  "Our passion for craftsmanship and smart engineering fuels MADECC Group. We create sustainable corporate structures, residential complexes, and power plants of the future.",
  "Through our specialized business development and tech consultancy, MADECC Group guides modern corporations to achieve high-performance standards in dynamic global markets.",
  "At MADECC Group, we design resilient engineering frameworks, robust software platforms, and clean energy solutions to prepare your organization for the next decade of growth.",
  "Step into a world of zero-harm engineering and innovative construction with MADECC Group, where customer trust and sustainable execution are our highest priority.",
  "MADECC Group delivers premier structural and environmental engineering, bringing sophisticated digital automation to major civic works and urban developments.",
  "We believe in the power of professional services to transform lives. MADECC Group is proud to pioneer sustainable architectural designs and clean technology networks.",
  "MADECC Group provides world-class project supervision, contract management, and technical advisory services that consistently exceed the industry's highest expectations.",
  "By combining advanced computing, IoT integration, and classic structural mechanics, MADECC Group crafts the highly optimized infrastructure of tomorrow.",
  "MADECC Group translates complex technical challenges into simple, elegant, and highly profitable assets for communities, investors, and governments.",
  "Empower your projects with MADECC Group's multidisciplinary team, delivering superior quality in civil construction, corporate advisory, and power grid optimization.",
  "Welcome to MADECC Group, the leading platform for premium engineering, sustainable technology, and professional consultancy. We are building the future, together."
];

export default function FloatingVoiceAssistant() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [rate, setRate] = useState(1.0);
  const [scriptIndex, setScriptIndex] = useState(0);
  const [showPanel, setShowPanel] = useState(false);
  const [showCaptions, setShowCaptions] = useState(true);
  const [autoplayEnabled, setAutoplayEnabled] = useState(true);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>('');
  const [isSynthesizingSupported, setIsSynthesizingSupported] = useState(true);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const fadeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize SpeechSynthesis and check browser support
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      setIsSynthesizingSupported(false);
      return;
    }

    // Load voices
    const loadVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      // Filter for English voices or typical default ones
      const englishVoices = allVoices.filter(v => v.lang.startsWith('en') || v.lang.startsWith('fr'));
      setVoices(englishVoices.length > 0 ? englishVoices : allVoices);

      // Attempt to pick a premium natural sounding English voice
      const preferred = allVoices.find(v => 
        v.name.includes('Google US English') || 
        v.name.includes('Natural') || 
        v.name.includes('Microsoft David') ||
        v.lang === 'en-US'
      );
      if (preferred) {
        setSelectedVoiceName(preferred.name);
      } else if (allVoices.length > 0) {
        setSelectedVoiceName(allVoices[0].name);
      }
    };

    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    // Load saved preferences from Neon database with local cache fallback
    let syncActive = true;
    const loadDbPreferences = async () => {
      const syncData = await fetchUserSyncData();
      if (!syncActive) return;

      const dbVol = syncData['voice_volume'];
      if (dbVol !== undefined) setVolume(parseFloat(dbVol));

      const dbRate = syncData['voice_rate'];
      if (dbRate !== undefined) setRate(parseFloat(dbRate));

      const dbAutoplay = syncData['voice_autoplay'];
      if (dbAutoplay !== undefined) setAutoplayEnabled(dbAutoplay === 'true');

      const dbMuted = syncData['voice_muted'];
      if (dbMuted !== undefined) setIsMuted(dbMuted === 'true');
    };

    loadDbPreferences();

    // Clean up on unmount
    return () => {
      syncActive = false;
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
    };
  }, []);

  // Sync auto-pause when other media elements (video, audio) start playing
  useEffect(() => {
    const handleMediaPlay = () => {
      if (isPlaying && !isPaused) {
        pauseNarration();
      }
    };

    // Listen on the capture phase for any video/audio 'play' events
    window.addEventListener('play', handleMediaPlay, true);
    return () => {
      window.removeEventListener('play', handleMediaPlay, true);
    };
  }, [isPlaying, isPaused]);

  // Handle Autoplay when component loads (only if permitted & enabled)
  useEffect(() => {
    if (!isSynthesizingSupported || !autoplayEnabled) return;

    // Browser security blocks speech synthesis until first user interaction
    // We register a one-time document click listener to start speaking when they interact
    const triggerAutoplayOnInteraction = () => {
      if (autoplayEnabled && !isPlaying && !isPaused) {
        // Select a random script to start
        const randIndex = Math.floor(Math.random() * NARRATION_SCRIPTS.length);
        setScriptIndex(randIndex);
        speakScript(randIndex);
      }
      document.removeEventListener('click', triggerAutoplayOnInteraction);
    };

    document.addEventListener('click', triggerAutoplayOnInteraction);
    return () => {
      document.removeEventListener('click', triggerAutoplayOnInteraction);
    };
  }, [isSynthesizingSupported, autoplayEnabled, isPlaying, isPaused]);

  // Volume fader helper (smoothly transitions volume)
  const fadeVolume = (targetVolume: number, duration = 300, onComplete?: () => void) => {
    if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
    if (!utteranceRef.current || !window.speechSynthesis.speaking) {
      if (onComplete) onComplete();
      return;
    }

    const steps = 10;
    const intervalTime = duration / steps;
    const currentVol = utteranceRef.current.volume;
    const stepDiff = (targetVolume - currentVol) / steps;
    let currentStep = 0;

    fadeIntervalRef.current = setInterval(() => {
      if (utteranceRef.current) {
        const nextVol = Math.max(0, Math.min(1, utteranceRef.current.volume + stepDiff));
        utteranceRef.current.volume = nextVol;
      }
      currentStep++;
      if (currentStep >= steps) {
        if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
        if (utteranceRef.current) utteranceRef.current.volume = targetVolume;
        if (onComplete) onComplete();
      }
    }, intervalTime);
  };

  const speakScript = (index: number) => {
    if (!isSynthesizingSupported) return;

    window.speechSynthesis.cancel();
    if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);

    const text = NARRATION_SCRIPTS[index];
    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    // Apply voice
    if (selectedVoiceName) {
      const voice = voices.find(v => v.name === selectedVoiceName);
      if (voice) utterance.voice = voice;
    }

    utterance.volume = isMuted ? 0 : volume;
    utterance.rate = rate;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      // Intelligently loop: play next script randomly when complete
      const nextIndex = (index + 1) % NARRATION_SCRIPTS.length;
      setScriptIndex(nextIndex);
      // Wait a brief 3 seconds pause between scripts
      setTimeout(() => {
        speakScript(nextIndex);
      }, 3000);
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis utterance error:', e);
      if (e.error !== 'interrupted') {
        setIsPlaying(false);
        setIsPaused(false);
      }
    };

    window.speechSynthesis.speak(utterance);
    
    // Smooth volume fade-in at the start
    utterance.volume = 0;
    fadeVolume(isMuted ? 0 : volume, 500);
  };

  const playNarration = () => {
    if (isPaused && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
    } else {
      speakScript(scriptIndex);
    }
  };

  const pauseNarration = () => {
    fadeVolume(0, 300, () => {
      window.speechSynthesis.pause();
      setIsPaused(true);
    });
  };

  const stopNarration = () => {
    fadeVolume(0, 200, () => {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setIsPaused(false);
    });
  };

  const skipNext = () => {
    const nextIndex = Math.floor(Math.random() * NARRATION_SCRIPTS.length);
    setScriptIndex(nextIndex);
    speakScript(nextIndex);
  };

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    saveUserSyncData('voice_muted', String(newMuted));
    
    if (utteranceRef.current) {
      utteranceRef.current.volume = newMuted ? 0 : volume;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    saveUserSyncData('voice_volume', String(val));
    if (utteranceRef.current) {
      utteranceRef.current.volume = isMuted ? 0 : val;
    }
  };

  const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setRate(val);
    saveUserSyncData('voice_rate', String(val));
    // Restart to apply rate changes smoothly
    if (isPlaying && !isPaused) {
      speakScript(scriptIndex);
    }
  };

  const handleAutoplayToggle = () => {
    const nextVal = !autoplayEnabled;
    setAutoplayEnabled(nextVal);
    saveUserSyncData('voice_autoplay', String(nextVal));
  };

  if (!isSynthesizingSupported) {
    return null; // Don't crash if browser lacks synthesis support
  }

  return (
    <div className="fixed bottom-6 left-6 z-40 font-sans" id="ai-voice-assistant-root">
      
      {/* Subtitle Caption Strip for Web Accessibility Compliance */}
      <AnimatePresence>
        {isPlaying && !isPaused && showCaptions && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 max-w-xl w-[90vw] md:w-full bg-slate-950/90 border border-amber-500/30 text-white backdrop-blur px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3.5"
            id="narration-caption-strip"
          >
            <div className="bg-amber-500/10 p-2 rounded-lg text-amber-500 animate-pulse">
              <Mic className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <span className="text-[9px] font-mono font-bold text-amber-500 block uppercase tracking-wider mb-0.5">MADECC Voice Assistant Subtitles</span>
              <p className="text-xs font-medium text-slate-200 leading-normal line-clamp-2">
                "{NARRATION_SCRIPTS[scriptIndex]}"
              </p>
            </div>
            <button 
              onClick={() => setShowCaptions(false)}
              className="text-slate-400 hover:text-white"
              title="Hide captions"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Trigger Hub Balloon Button */}
      <div className="flex items-center gap-3">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowPanel(!showPanel)}
          className={`h-14 w-14 rounded-full flex items-center justify-center border shadow-2xl cursor-pointer relative z-50 transition-colors ${
            isPlaying && !isPaused
              ? 'bg-amber-500 text-slate-950 border-amber-400'
              : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
          }`}
          id="voice-assistant-bubble-btn"
          title="Voice Assistant Portal"
        >
          {isPlaying && !isPaused ? (
            <div className="flex items-center gap-0.5" id="audio-visualizer-wave">
              <div className="w-1 h-3.5 bg-slate-950 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
              <div className="w-1 h-5.5 bg-slate-950 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              <div className="w-1 h-4 bg-slate-950 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
              <div className="w-1 h-2 bg-slate-950 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
            </div>
          ) : (
            <Headphones className="w-6 h-6 animate-pulse" />
          )}

          {/* Indicator dot */}
          {autoplayEnabled && (
            <span className="absolute top-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border border-slate-950" />
          )}
        </motion.button>

        {/* Quick Speak State Banner */}
        {isPlaying && !isPaused && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="bg-slate-900/90 border border-slate-800 text-slate-300 px-3 py-1.5 rounded-lg text-[10px] font-mono tracking-wide backdrop-blur hidden sm:flex items-center gap-2"
          >
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
            <span>AI Narration Active...</span>
          </motion.div>
        )}
      </div>

      {/* Control Console Panel Overlay */}
      <AnimatePresence>
        {showPanel && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 15 }}
            className="absolute bottom-18 left-0 w-80 bg-[#0E0E11]/95 border border-slate-800 rounded-2xl shadow-2xl p-5 text-slate-200 backdrop-blur z-50 space-y-4"
            id="voice-assistant-console"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="bg-amber-500/10 p-1.5 rounded-lg text-amber-500">
                  <Headphones className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Background Voice Narrator</h3>
                  <span className="text-[9px] text-slate-500 font-mono">Enterprise AI Assistant v2.2</span>
                </div>
              </div>
              <button 
                onClick={() => setShowPanel(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-900 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Script card selection info */}
            <div className="bg-slate-950/60 border border-slate-900 p-3.5 rounded-xl space-y-2">
              <div className="flex justify-between items-center text-[9px] font-mono">
                <span className="text-amber-500 uppercase font-black">Active Narration Script</span>
                <span className="text-slate-500">#{scriptIndex + 1} of {NARRATION_SCRIPTS.length}</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-3 italic">
                "{NARRATION_SCRIPTS[scriptIndex]}"
              </p>
            </div>

            {/* Core Control Buttons */}
            <div className="grid grid-cols-4 gap-2">
              {isPlaying && !isPaused ? (
                <button
                  onClick={pauseNarration}
                  className="bg-amber-500 text-slate-950 p-2.5 rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-amber-400 transition-colors"
                  title="Pause Narration"
                >
                  <Pause className="w-4 h-4" />
                  <span className="text-[8px] font-mono font-bold uppercase">Pause</span>
                </button>
              ) : (
                <button
                  onClick={playNarration}
                  className="bg-slate-900 text-slate-200 border border-slate-800 p-2.5 rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-slate-850 hover:text-white transition-colors"
                  title="Play Narration"
                >
                  <Play className="w-4 h-4 text-emerald-400" />
                  <span className="text-[8px] font-mono font-bold uppercase">Play</span>
                </button>
              )}

              <button
                onClick={stopNarration}
                className="bg-slate-900 text-slate-200 border border-slate-800 p-2.5 rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-slate-850 hover:text-white transition-colors"
                title="Stop Narration"
              >
                <Square className="w-4 h-4 text-rose-500" />
                <span className="text-[8px] font-mono font-bold uppercase">Stop</span>
              </button>

              <button
                onClick={skipNext}
                className="bg-slate-900 text-slate-200 border border-slate-800 p-2.5 rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-slate-850 hover:text-white transition-colors"
                title="Next Script"
              >
                <SkipForward className="w-4 h-4 text-sky-400" />
                <span className="text-[8px] font-mono font-bold uppercase">Next</span>
              </button>

              <button
                onClick={toggleMute}
                className={`border p-2.5 rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors ${
                  isMuted 
                    ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' 
                    : 'bg-slate-900 text-slate-200 border-slate-800 hover:bg-slate-850'
                }`}
                title="Toggle Mute"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                <span className="text-[8px] font-mono font-bold uppercase">{isMuted ? 'Muted' : 'Mute'}</span>
              </button>
            </div>

            {/* Slider parameters (Volume & Speed Rate) */}
            <div className="space-y-3 pt-2">
              {/* Volume Slider */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                  <span className="flex items-center gap-1">
                    <Volume1 className="w-3 h-3" /> Volume
                  </span>
                  <span>{Math.round(volume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-full accent-amber-500 bg-slate-900 h-1.5 rounded-lg appearance-none cursor-pointer"
                  disabled={isMuted}
                />
              </div>

              {/* Speed rate Slider */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                  <span className="flex items-center gap-1">
                    <Settings className="w-3 h-3" /> Narrator Speed
                  </span>
                  <span>{rate.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.7"
                  max="1.5"
                  step="0.1"
                  value={rate}
                  onChange={handleRateChange}
                  className="w-full accent-amber-500 bg-slate-900 h-1.5 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>

            {/* Subtitles & Autoplay Toggles */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800/80">
              {/* Captions Toggle */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showCaptions}
                  onChange={() => setShowCaptions(!showCaptions)}
                  className="rounded bg-slate-900 border-slate-800 accent-amber-500 h-3.5 w-3.5 text-amber-500 focus:ring-0"
                />
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Subtitles</span>
              </label>

              {/* Autoplay Toggle */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoplayEnabled}
                  onChange={handleAutoplayToggle}
                  className="rounded bg-slate-900 border-slate-800 accent-amber-500 h-3.5 w-3.5 text-amber-500 focus:ring-0"
                />
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Autoplay</span>
              </label>
            </div>

            {/* Custom Voice Select */}
            {voices.length > 0 && (
              <div className="space-y-1 pt-1.5">
                <label className="block text-[10px] font-mono text-slate-500 uppercase">Voice Accent Engine</label>
                <select
                  value={selectedVoiceName}
                  onChange={(e) => {
                    setSelectedVoiceName(e.target.value);
                    if (isPlaying && !isPaused) {
                      speakScript(scriptIndex);
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg p-1.5 text-[10px] font-mono text-slate-300 outline-none focus:border-amber-500"
                >
                  {voices.map(voice => (
                    <option key={voice.name} value={voice.name}>
                      {voice.name} ({voice.lang})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
