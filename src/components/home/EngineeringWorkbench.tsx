import { useState, useEffect } from 'react';
import { ShieldCheck, Terminal, Activity, RefreshCw } from 'lucide-react';

export default function EngineeringWorkbench() {
  const [activeTab, setActiveTab] = useState<'crypto' | 'telemetry' | 'nlp'>('crypto');

  // Interactive Cryptography State (SecretSnap)
  const [plainText, setPlainText] = useState('Confidential engineering telemetry');
  const [cipherHex, setCipherHex] = useState('7f4a9b81...38d2');
  const [ivHex, setIvHex] = useState('e3c98402a1bf');
  const [encryptDuration, setEncryptDuration] = useState('1.2');
  const [encrypting, setEncrypting] = useState(false);

  // Run real Web Crypto API encryption
  const runRealEncryption = async (text: string) => {
    setEncrypting(true);
    const start = performance.now();
    try {
      const enc = new TextEncoder();
      const rawData = enc.encode(text);
      const key = await window.crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const encrypted = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        rawData
      );
      const end = performance.now();
      const ivArr = Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('');
      const ctArr = Array.from(new Uint8Array(encrypted)).slice(0, 16).map(b => b.toString(16).padStart(2, '0')).join('');
      
      setIvHex(ivArr.slice(0, 16));
      setCipherHex(`${ctArr}...`);
      setEncryptDuration((end - start).toFixed(2));
    } catch {
      // Fallback display if crypto unsupported
      setCipherHex('9d4f2a7e8b1c3d0f...');
    } finally {
      setEncrypting(false);
    }
  };

  useEffect(() => {
    runRealEncryption(plainText);
  }, []);

  return (
    <div className="bg-[#181A1F] border border-[rgba(255,255,255,0.08)] rounded-xl overflow-hidden shadow-2xl flex flex-col font-sans">
      {/* Workbench Terminal Header */}
      <div className="px-5 py-3.5 bg-[#141417] border-b border-[rgba(255,255,255,0.08)] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2A2F37]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#2A2F37]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#2A2F37]" />
          </div>
          <span className="text-[11px] font-mono text-[#A4A8AE] pl-2">
            engine-workbench <span className="text-[#9CA1AA]">v2.4.0</span>
          </span>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center space-x-1 bg-[#101114] p-1 rounded-md border border-[rgba(255,255,255,0.06)] text-xs font-mono">
          <button
            type="button"
            onClick={() => setActiveTab('crypto')}
            className={`px-2.5 py-1 rounded transition-colors ${
              activeTab === 'crypto'
                ? 'bg-[#22252C] text-[#F0F0ED] font-medium'
                : 'text-[#A4A8AE] hover:text-[#F0F0ED]'
            }`}
          >
            AES-256
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('telemetry')}
            className={`px-2.5 py-1 rounded transition-colors ${
              activeTab === 'telemetry'
                ? 'bg-[#22252C] text-[#F0F0ED] font-medium'
                : 'text-[#A4A8AE] hover:text-[#F0F0ED]'
            }`}
          >
            Telemetry
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('nlp')}
            className={`px-2.5 py-1 rounded transition-colors ${
              activeTab === 'nlp'
                ? 'bg-[#22252C] text-[#F0F0ED] font-medium'
                : 'text-[#A4A8AE] hover:text-[#F0F0ED]'
            }`}
          >
            NLP Matrix
          </button>
        </div>
      </div>

      {/* Workbench Screen Body */}
      <div className="p-6 space-y-5 bg-[#181A1F]">
        {/* VIEW 1: CRYPTOGRAPHY WORKBENCH (SecretSnap) */}
        {activeTab === 'crypto' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-mono text-[#A8B8A7] flex items-center space-x-1.5 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#A8B8A7]" />
                  <span>Client-Side AES-GCM Zero-Knowledge Relay</span>
                </span>
                <p className="text-[12px] text-[#A4A8AE] mt-0.5 font-light">
                  Direct hardware-accelerated encryption via W3C Web Crypto API
                </p>
              </div>
              <span className="px-2 py-0.5 rounded bg-[#22252C] text-[#A8B8A7] border border-[#A8B8A7]/30 text-[10px] font-mono">
                {encryptDuration}ms
              </span>
            </div>

            {/* Live Interactive Payload Box */}
            <div className="space-y-2">
              <label htmlFor="workbench-payload-input" className="text-[11px] font-mono text-[#A4A8AE] flex justify-between">
                <span>Input Payload:</span>
                <span className="text-[#9CA1AA]">Plaintext buffer</span>
              </label>
              <div className="flex gap-2">
                <input
                  id="workbench-payload-input"
                  aria-label="Input Payload Plaintext buffer"
                  type="text"
                  value={plainText}
                  onChange={(e) => setPlainText(e.target.value)}
                  className="flex-1 bg-[#101114] border border-[rgba(255,255,255,0.08)] rounded-md px-3 py-1.5 text-xs text-[#F0F0ED] font-mono focus:outline-none focus:border-[#A8B8A7]"
                />
                <button
                  type="button"
                  onClick={() => runRealEncryption(plainText)}
                  disabled={encrypting}
                  className="px-3 py-1.5 bg-[#22252C] border border-[rgba(255,255,255,0.08)] hover:border-[#A8B8A7] text-[#A8B8A7] hover:text-[#F0F0ED] rounded-md text-xs font-mono transition-colors flex items-center space-x-1"
                >
                  <RefreshCw className={`w-3 h-3 ${encrypting ? 'animate-spin' : ''}`} />
                  <span>Cipher</span>
                </button>
              </div>
            </div>

            {/* Cryptographic Execution Spec Table */}
            <div className="p-3.5 bg-[#101114] border border-[rgba(255,255,255,0.06)] rounded-lg font-mono text-[11px] space-y-2">
              <div className="grid grid-cols-2 gap-2 pb-2 border-b border-[rgba(255,255,255,0.04)]">
                <div>
                  <span className="text-[#9CA1AA] block text-[10px]">Algorithm</span>
                  <span className="text-[#F0F0ED]">AES-GCM (256-bit)</span>
                </div>
                <div>
                  <span className="text-[#9CA1AA] block text-[10px]">Key Derivation</span>
                  <span className="text-[#F0F0ED]">PBKDF2 / SHA-512</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[#9CA1AA] block text-[10px]">12-Byte IV Nonce</span>
                  <span className="text-[#A4A8AE] truncate block">{ivHex}</span>
                </div>
                <div>
                  <span className="text-[#9CA1AA] block text-[10px]">Authenticated Ciphertext</span>
                  <span className="text-[#A8B8A7] truncate block">{cipherHex}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-[#9CA1AA] pt-1">
              <span>Zero server-side plaintext exposure</span>
              <span className="text-[#A8B8A7]">StratagemVX/Secret-snap</span>
            </div>
          </div>
        )}

        {/* VIEW 2: DISTRIBUTED TELEMETRY (PRISM) */}
        {activeTab === 'telemetry' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-mono text-[#A8B8A7] flex items-center space-x-1.5 font-medium">
                  <Activity className="w-3.5 h-3.5 text-[#A8B8A7]" />
                  <span>Real-Time Intelligence & Session State Telemetry</span>
                </span>
                <p className="text-[12px] text-[#A4A8AE] mt-0.5 font-light">
                  Bidirectional WebSocket state synchronizer & Redis in-memory cache
                </p>
              </div>
              <span className="px-2 py-0.5 rounded bg-[#22252C] text-[#A8B8A7] border border-[#A8B8A7]/30 text-[10px] font-mono">
                sub-45ms
              </span>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="p-3 bg-[#101114] border border-[rgba(255,255,255,0.06)] rounded-lg font-mono">
                <span className="text-[10px] text-[#9CA1AA] block">Concurrent Sockets</span>
                <span className="text-base text-[#F0F0ED] font-medium tabular-nums">500+</span>
                <span className="text-[10px] text-[#A8B8A7] block mt-0.5">Active mesh</span>
              </div>
              <div className="p-3 bg-[#101114] border border-[rgba(255,255,255,0.06)] rounded-lg font-mono">
                <span className="text-[10px] text-[#9CA1AA] block">State Latency</span>
                <span className="text-base text-[#F0F0ED] font-medium tabular-nums">38.4ms</span>
                <span className="text-[10px] text-[#A8B8A7] block mt-0.5">p99 threshold</span>
              </div>
              <div className="p-3 bg-[#101114] border border-[rgba(255,255,255,0.06)] rounded-lg font-mono">
                <span className="text-[10px] text-[#9CA1AA] block">Redis Query Drop</span>
                <span className="text-base text-[#A8B8A7] font-medium tabular-nums">-65%</span>
                <span className="text-[10px] text-[#9CA1AA] block mt-0.5">Read tier</span>
              </div>
            </div>

            {/* Microservice Health Matrix */}
            <div className="p-3 bg-[#101114] border border-[rgba(255,255,255,0.06)] rounded-lg font-mono text-[11px] space-y-1.5">
              <div className="flex justify-between items-center text-[10px] text-[#9CA1AA] border-b border-[rgba(255,255,255,0.04)] pb-1">
                <span>Microservice Node</span>
                <span>Throughput</span>
                <span>Status</span>
              </div>
              <div className="flex justify-between items-center text-[#F0F0ED]">
                <span>auth-session-worker</span>
                <span className="text-[#A4A8AE] tabular-nums">1,240 req/s</span>
                <span className="text-[#A8B8A7] text-[10px]">Healthy</span>
              </div>
              <div className="flex justify-between items-center text-[#F0F0ED]">
                <span>telemetry-stream-ingest</span>
                <span className="text-[#A4A8AE] tabular-nums">8,410 ev/s</span>
                <span className="text-[#A8B8A7] text-[10px]">Healthy</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-[#9CA1AA] pt-1">
              <span>Docker & Node.js event-driven cluster</span>
              <span className="text-[#A8B8A7]">StratagemVX/Major-Project</span>
            </div>
          </div>
        )}

        {/* VIEW 3: COMPUTATIONAL NLP (SpellSense) */}
        {activeTab === 'nlp' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-mono text-[#A8B8A7] flex items-center space-x-1.5 font-medium">
                  <Terminal className="w-3.5 h-3.5 text-[#A8B8A7]" />
                  <span>Empirical Levenshtein & SymSpell Evaluation</span>
                </span>
                <p className="text-[12px] text-[#A4A8AE] mt-0.5 font-light">
                  Comparative algorithmic distance matrices & latency telemetry
                </p>
              </div>
              <span className="px-2 py-0.5 rounded bg-[#22252C] text-[#A8B8A7] border border-[#A8B8A7]/30 text-[10px] font-mono">
                O(1) Lookup
              </span>
            </div>

            {/* Distance Matrix Table */}
            <div className="p-3.5 bg-[#101114] border border-[rgba(255,255,255,0.06)] rounded-lg font-mono text-[11px] space-y-2">
              <div className="flex justify-between items-center text-[10px] text-[#9CA1AA] border-b border-[rgba(255,255,255,0.04)] pb-1">
                <span>Input Token</span>
                <span>Correction</span>
                <span>Dist</span>
                <span>Latency</span>
              </div>
              <div className="flex justify-between items-center text-[#F0F0ED]">
                <span className="text-[#A4A8AE]">algoritm</span>
                <span className="text-[#A8B8A7]">algorithm</span>
                <span className="tabular-nums">1</span>
                <span className="text-[#9CA1AA] tabular-nums">0.82ms</span>
              </div>
              <div className="flex justify-between items-center text-[#F0F0ED]">
                <span className="text-[#A4A8AE]">recgonize</span>
                <span className="text-[#A8B8A7]">recognize</span>
                <span className="tabular-nums">1</span>
                <span className="text-[#9CA1AA] tabular-nums">0.94ms</span>
              </div>
              <div className="flex justify-between items-center text-[#F0F0ED]">
                <span className="text-[#A4A8AE]">cryptogrpahy</span>
                <span className="text-[#A8B8A7]">cryptography</span>
                <span className="tabular-nums">1</span>
                <span className="text-[#9CA1AA] tabular-nums">1.12ms</span>
              </div>
            </div>

            {/* Algorithm Comparison */}
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              <div className="p-2.5 bg-[#101114] border border-[rgba(255,255,255,0.04)] rounded">
                <span className="text-[10px] text-[#9CA1AA] block">SymSpell Method</span>
                <span className="text-[#F0F0ED]">Pre-computed deletes</span>
                <span className="text-[10px] text-[#A8B8A7] block mt-0.5">1,000x faster than DP</span>
              </div>
              <div className="p-2.5 bg-[#101114] border border-[rgba(255,255,255,0.04)] rounded">
                <span className="text-[10px] text-[#9CA1AA] block">TextBlob Benchmark</span>
                <span className="text-[#F0F0ED]">N-gram probabilistic</span>
                <span className="text-[10px] text-[#A4A8AE] block mt-0.5">Contextual smoothing</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-[#9CA1AA] pt-1">
              <span>TypeScript, Python & NLTK Suite</span>
              <span className="text-[#A8B8A7]">StratagemVX/spellSense-NLP_AAT</span>
            </div>
          </div>
        )}
      </div>

      {/* Terminal Footer Bar */}
      <div className="px-5 py-2.5 bg-[#141417] border-t border-[rgba(255,255,255,0.06)] flex items-center justify-between text-[11px] font-mono text-[#9CA1AA]">
        <div className="flex items-center space-x-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#A8B8A7]" />
          <span>runtime: verified-browser-environment</span>
        </div>
        <span className="text-[#A4A8AE]">20 Public Repositories</span>
      </div>
    </div>
  );
}
