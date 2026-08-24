import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Phone, 
  Send, 
  X, 
  Mail, 
  ChevronUp, 
  Clock, 
  ShieldCheck, 
  Zap,
  Users,
  MessageCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
  time: string;
}

export default function FloatingContactHub() {
  const [isOpen, setIsOpen] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'bot',
      text: 'Hello! Welcome to MADECC Group Cameroon. I am your Gemini-powered virtual assistant. How can I assist you with your construction, architectural design, or civil engineering inquiries today?',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, showChat]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const userMsgText = chatMessage;
    const userMsg: ChatMessage = {
      sender: 'user',
      text: userMsgText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setChatMessage('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsgText })
      });

      if (response.ok) {
        const data = await response.json();
        const botMsg: ChatMessage = {
          sender: 'bot',
          text: data.reply || 'Thank you for your message. How can I assist you further?',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, botMsg]);
      } else {
        throw new Error('Chat API returned error');
      }
    } catch (err) {
      console.error('Chat error:', err);
      const botMsg: ChatMessage = {
        sender: 'bot',
        text: 'I apologize, I am experiencing a temporary connection issue. Please feel free to call our direct lines directly at +237 683 316 486 or email us at kreboya603@gmail.com.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const phoneNumbers = [
    { label: 'General & WhatsApp', number: '+237 683 316 486', url: 'tel:237683316486' },
    { label: 'Operations Department', number: '+237 671 063 511', url: 'tel:237671063511' },
    { label: 'Project Management', number: '+237 689 115 595', url: 'tel:237689115595' },
    { label: 'Administration Desk', number: '+237 671 289 643', url: 'tel:237671289643' },
    { label: 'Customer Support Desk', number: '+237 640 194 505', url: 'tel:237640194505' },
  ];

  const emails = [
    { label: 'Tenders & Estimates', email: 'kreboya603@gmail.com' },
    { label: 'General Construction Services', email: 'madecccons@gmail.com' }
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 font-sans">
      
      {/* 1. Quick Floating WhatsApp Launcher */}
      <AnimatePresence>
        {!isOpen && !showChat && (
          <motion.a
            href="https://wa.me/237683316486?text=Hello%20MADECC%20Group%20Cameroon,%20I%20would%20like%20to%20inquire%20about%20your%20services."
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-full shadow-xl transition-all duration-300 border border-emerald-500 hover:shadow-emerald-900/40 hover:-translate-y-1"
            id="floating-whatsapp-trigger"
          >
            <MessageCircle className="w-5 h-5 animate-bounce" />
            <span className="text-xs tracking-wider uppercase">WhatsApp Us</span>
          </motion.a>
        )}
      </AnimatePresence>

      {/* 2. Interactive Dialog Panel */}
      <AnimatePresence>
        {(isOpen || showChat) && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            className="w-80 md:w-96 bg-[#0E0E11] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[550px]"
            id="floating-hub-panel"
          >
            {/* Panel Header */}
            <div className="bg-gradient-to-r from-slate-900 via-[#121215] to-slate-900 p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping absolute -top-0.5 -right-0.5" />
                  <div className="w-9 h-9 bg-amber-500/10 rounded-lg flex items-center justify-center border border-amber-500/20 text-amber-500">
                    <Zap className="w-4.5 h-4.5" />
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-white tracking-wide">MADECC Live Hub</h4>
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">Cameroon Division</span>
                </div>
              </div>
              <button 
                onClick={() => {
                  setIsOpen(false);
                  setShowChat(false);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/60 transition-colors"
                id="close-floating-panel"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Toggle tabs */}
            <div className="grid grid-cols-2 border-b border-slate-800 text-xs font-bold uppercase tracking-widest font-mono text-center">
              <button
                onClick={() => {
                  setShowChat(false);
                  setIsOpen(true);
                }}
                className={`py-3 transition-colors ${!showChat ? 'border-b-2 border-amber-500 text-amber-500 bg-slate-900/40' : 'text-slate-400 hover:text-slate-200 bg-transparent'}`}
                id="tab-direct-directory"
              >
                Directory
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setShowChat(true);
                }}
                className={`py-3 transition-colors ${showChat ? 'border-b-2 border-amber-500 text-amber-500 bg-slate-900/40' : 'text-slate-400 hover:text-slate-200 bg-transparent'}`}
                id="tab-virtual-assistant"
              >
                Gemini AI
              </button>
            </div>

            {/* Panel Body: Directory Tab */}
            {!showChat && (
              <div className="p-5 overflow-y-auto space-y-5 divide-y divide-slate-850">
                
                {/* Phones Section */}
                <div className="space-y-3">
                  <span className="text-[10px] font-mono tracking-wider text-amber-500 uppercase font-bold block">Direct Dial Call Center</span>
                  <div className="space-y-2">
                    {phoneNumbers.map((phone, idx) => (
                      <a 
                        key={idx}
                        href={phone.url}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/50 hover:bg-slate-850 border border-slate-850 hover:border-slate-800 transition-all text-left group"
                      >
                        <div>
                          <p className="text-[11px] text-slate-400 font-medium group-hover:text-amber-500 transition-colors">{phone.label}</p>
                          <p className="text-xs font-bold font-mono text-white mt-0.5">{phone.number}</p>
                        </div>
                        <div className="w-7 h-7 bg-amber-500/5 rounded-md flex items-center justify-center border border-amber-500/10 text-amber-500 group-hover:bg-amber-500/15 transition-all">
                          <Phone className="w-3.5 h-3.5" />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>

                {/* Emails Section */}
                <div className="space-y-3 pt-4">
                  <span className="text-[10px] font-mono tracking-wider text-amber-500 uppercase font-bold block">Email Desks</span>
                  <div className="space-y-2">
                    {emails.map((mail, idx) => (
                      <a 
                        key={idx}
                        href={`mailto:${mail.email}`}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/50 hover:bg-slate-850 border border-slate-850 hover:border-slate-800 transition-all text-left group"
                      >
                        <div>
                          <p className="text-[11px] text-slate-400 font-medium group-hover:text-amber-500 transition-colors">{mail.label}</p>
                          <p className="text-xs font-bold font-mono text-white mt-0.5">{mail.email}</p>
                        </div>
                        <div className="w-7 h-7 bg-amber-500/5 rounded-md flex items-center justify-center border border-amber-500/10 text-amber-500 group-hover:bg-amber-500/15 transition-all">
                          <Mail className="w-3.5 h-3.5" />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>

                {/* Secure Gateway info */}
                <div className="pt-3 flex items-center gap-2 text-[9px] text-slate-500 font-mono uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-amber-500" />
                  <span>Verified Corporate Directory</span>
                </div>
              </div>
            )}

            {/* Panel Body: AI Assistant Tab */}
            {showChat && (
              <div className="flex-grow flex flex-col min-h-[350px] bg-[#0A0A0C]">
                
                {/* Messages Panel */}
                <div className="flex-grow p-4 overflow-y-auto space-y-3 scrollbar-thin">
                  {messages.map((msg, idx) => (
                    <div 
                      key={idx}
                      className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                        msg.sender === 'user' 
                          ? 'bg-amber-500 text-slate-950 rounded-tr-none font-medium' 
                          : 'bg-slate-900 text-slate-200 rounded-tl-none border border-slate-850'
                      }`}>
                        <p>{msg.text}</p>
                      </div>
                      <span className="text-[8px] font-mono text-slate-600 mt-1 px-1">{msg.time}</span>
                    </div>
                  ))}

                  {isTyping && (
                    <div className="flex flex-col items-start">
                      <div className="bg-slate-900 text-slate-400 rounded-2xl rounded-tl-none px-4 py-3 border border-slate-850 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="text-[8px] font-mono text-slate-600 mt-1">Gemini Thinking...</span>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Input box */}
                <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-850 bg-[#0E0E11] flex gap-2">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="Ask about budgets, estimates, materials..."
                    className="flex-grow bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 transition-colors placeholder:text-slate-600"
                    id="chat-message-input"
                  />
                  <button 
                    type="submit"
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 p-2 rounded-xl transition-colors shadow"
                    id="send-chat-message"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>

                {/* Tech info badge */}
                <div className="px-4 py-1.5 bg-slate-950/80 border-t border-slate-850 text-[8px] font-mono uppercase tracking-widest text-slate-500 text-center flex items-center justify-center gap-1.5">
                  <Zap className="w-3 h-3 text-amber-500 animate-pulse" />
                  <span>Google Gemini API Active &bull; Instant Support</span>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Central Launcher Button */}
      <motion.button
        onClick={() => {
          if (isOpen || showChat) {
            setIsOpen(false);
            setShowChat(false);
          } else {
            setIsOpen(true);
          }
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-14 h-14 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-2xl hover:bg-amber-400 border border-amber-400 focus:outline-none transition-all relative group"
        id="floating-live-hub-toggle"
      >
        <AnimatePresence mode="wait">
          {isOpen || showChat ? (
            <motion.div
              key="close"
              initial={{ rotate: -45, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 45, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 45, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -45, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="relative"
            >
              <MessageSquare className="w-6 h-6" />
              <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-600 border border-slate-950 text-[8px] text-white font-extrabold items-center justify-center font-mono">5</span>
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
      
    </div>
  );
}
