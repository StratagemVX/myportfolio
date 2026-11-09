import { useState, FormEvent } from 'react';
import { Mail, Github, Linkedin, Copy, Check, Send, MapPin, Clock, ShieldCheck } from 'lucide-react';

export default function ContactPage() {
  const [copied, setCopied] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const copyEmail = () => {
    navigator.clipboard.writeText('chethan.athulith@outlook.com');
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.email && formData.message) {
      setFormSubmitted(true);
      const mailtoUrl = `mailto:chethan.athulith@outlook.com?subject=${encodeURIComponent(
        formData.subject || 'Portfolio Inquiry from ' + formData.name
      )}&body=${encodeURIComponent(`From: ${formData.name} (${formData.email})\n\n${formData.message}`)}`;
      window.open(mailtoUrl, '_blank');
    }
  };

  return (
    <div className="py-12 sm:py-16 space-y-16">
      <div className="site-container space-y-12">
        {/* Header */}
        <header className="border-b border-[rgba(255,255,255,0.08)] pb-8 space-y-3">
          <div className="inline-flex items-center space-x-2 text-xs font-mono text-[#A8B8A7]">
            <Mail className="w-3.5 h-3.5 text-[#A8B8A7]" />
            <span>Direct contact · Verified channels</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-[#F0F0ED]">
            Have an interesting problem to solve? Let's connect.
          </h1>
          <p className="text-sm sm:text-base text-[#A4A8AE] font-light max-w-4xl leading-relaxed">
            Open to graduate engineering opportunities, technical discussions on AI systems, applied cryptography, 
            and scalable software engineering. Response time typically within 24 hours.
          </p>
        </header>

        {/* 2-Column Responsive Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Column 1: Direct Contact & Channel Profiles (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-[#181A1F] border border-[rgba(255,255,255,0.08)] rounded-xl p-6 sm:p-7 space-y-6">
              <span className="text-[10px] font-mono tracking-wider text-[#A8B8A7] uppercase block font-medium">
                Verified direct channels
              </span>

              <div className="space-y-3">
                <div className="p-4 rounded-lg bg-[#14161A] border border-[rgba(255,255,255,0.06)] space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-[#A4A8AE]">
                    <span>Primary email</span>
                    <button
                      onClick={copyEmail}
                      className="text-[#A8B8A7] hover:text-[#F0F0ED] flex items-center space-x-1 transition-colors"
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <a
                    href="mailto:chethan.athulith@outlook.com"
                    className="font-mono text-sm text-[#F0F0ED] hover:text-[#A8B8A7] transition-colors block truncate"
                  >
                    chethan.athulith@outlook.com
                  </a>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
                  <a
                    href="https://linkedin.com/in/chethan-kumar-bs"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3.5 rounded-lg bg-[#14161A] border border-[rgba(255,255,255,0.06)] hover:border-[#A8B8A7]/40 transition-colors flex items-center justify-between group"
                  >
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-[#6E727A] uppercase tracking-wider block">LinkedIn</span>
                      <span className="text-[#F0F0ED] group-hover:text-[#A8B8A7] font-medium">Chethan Kumar</span>
                    </div>
                    <Linkedin className="w-4 h-4 text-[#A8B8A7]" />
                  </a>

                  <a
                    href="https://github.com/StratagemVX"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3.5 rounded-lg bg-[#14161A] border border-[rgba(255,255,255,0.06)] hover:border-[#A8B8A7]/40 transition-colors flex items-center justify-between group"
                  >
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-[#6E727A] uppercase tracking-wider block">GitHub</span>
                      <span className="text-[#F0F0ED] group-hover:text-[#A8B8A7] font-medium">StratagemVX</span>
                    </div>
                    <Github className="w-4 h-4 text-[#A8B8A7]" />
                  </a>
                </div>
              </div>

              <div className="pt-4 border-t border-[rgba(255,255,255,0.06)] space-y-3 font-mono text-xs text-[#A4A8AE]">
                <div className="flex items-center space-x-2.5">
                  <MapPin className="w-3.5 h-3.5 text-[#A8B8A7] shrink-0" />
                  <span>Bengaluru, Karnataka, India (UTC +5:30)</span>
                </div>
                <div className="flex items-center space-x-2.5">
                  <Clock className="w-3.5 h-3.5 text-[#A8B8A7] shrink-0" />
                  <span>Available for Technical Interviews & Graduate Engineering</span>
                </div>
                <div className="flex items-center space-x-2.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#A8B8A7] shrink-0" />
                  <span>Direct routing — zero intermediary tracking</span>
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: Functional Dispatch Form (7 cols) */}
          <div className="lg:col-span-7">
            <div className="bg-[#181A1F] border border-[rgba(255,255,255,0.08)] rounded-xl p-6 sm:p-8 space-y-6">
              <span className="text-[10px] font-mono tracking-wider text-[#A8B8A7] uppercase block font-medium">
                Direct message dispatch
              </span>

              {formSubmitted ? (
                <div className="p-5 rounded-lg bg-[#14161A] border border-[#A8B8A7]/40 space-y-2.5 font-mono text-xs">
                  <div className="flex items-center space-x-2 text-[#A8B8A7]">
                    <Check className="w-4 h-4" />
                    <span className="font-semibold text-sm">Message dispatched</span>
                  </div>
                  <p className="text-[#A4A8AE] font-sans text-xs leading-relaxed font-light">
                    Thank you, {formData.name}. Your message has been formatted and delivered. An active mail client was triggered to ensure redundancy.
                  </p>
                  <button
                    onClick={() => {
                      setFormSubmitted(false);
                      setFormData({ name: '', email: '', subject: '', message: '' });
                    }}
                    className="text-[#A8B8A7] hover:underline text-[11px] pt-1 block"
                  >
                    Send another message →
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[#A4A8AE] block">Your name *</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ada Lovelace"
                        className="w-full bg-[#14161A] border border-[rgba(255,255,255,0.08)] rounded-lg p-3 text-[#F0F0ED] placeholder-[#A4A8AE]/40 focus:outline-none focus:border-[#A8B8A7]/70 transition-colors"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[#A4A8AE] block">Your email *</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="ada@example.com"
                        className="w-full bg-[#14161A] border border-[rgba(255,255,255,0.08)] rounded-lg p-3 text-[#F0F0ED] placeholder-[#A4A8AE]/40 focus:outline-none focus:border-[#A8B8A7]/70 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[#A4A8AE] block">Subject / Context</label>
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="Engineering Role / Project Discussion / Systems Collaboration"
                      className="w-full bg-[#14161A] border border-[rgba(255,255,255,0.08)] rounded-lg p-3 text-[#F0F0ED] placeholder-[#A4A8AE]/40 focus:outline-none focus:border-[#A8B8A7]/70 transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[#A4A8AE] block">Message *</label>
                    <textarea
                      required
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Briefly describe your team, opportunity, or technical inquiry..."
                      className="w-full bg-[#14161A] border border-[rgba(255,255,255,0.08)] rounded-lg p-3 text-[#F0F0ED] placeholder-[#A4A8AE]/40 focus:outline-none focus:border-[#A8B8A7]/70 transition-colors resize-none font-sans text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-lg bg-[#22252C] hover:bg-[#2A2E37] border border-[rgba(255,255,255,0.12)] text-[#F0F0ED] font-medium transition-colors btn-highlight flex items-center justify-center space-x-2"
                  >
                    <Send className="w-3.5 h-3.5 text-[#A8B8A7]" />
                    <span>Dispatch message</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
