import { useState, useEffect, FormEvent } from 'react';
import { 
  Key, 
  Copy, 
  CheckCircle2, 
  AlertCircle, 
  ShieldAlert, 
  Trash2, 
  Eye, 
  Lock 
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import type { HashedRecruiterToken } from '../../../server/types';

export default function PrivateRecruiterAccessSection() {
  const [tokens, setTokens] = useState<HashedRecruiterToken[]>([]);
  const [recipientLabel, setRecipientLabel] = useState('');
  const [expiresInDays, setExpiresInDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // One-time reveal modal/banner for the plaintext secret
  const [createdSecret, setCreatedSecret] = useState<{ rawToken: string; label: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadTokens();
  }, []);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 6000);
  };

  const loadTokens = async () => {
    try {
      const res = await apiClient.getRecruiterTokens();
      setTokens(res.tokens);
    } catch {
      // Ignore
    }
  };

  const handleCreateToken = async (e: FormEvent) => {
    e.preventDefault();
    if (!recipientLabel.trim()) {
      showFeedback('error', 'Please provide a recipient label (e.g. "Google Technical Recruiter").');
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.createRecruiterToken(recipientLabel.trim(), expiresInDays);
      setCreatedSecret({
        rawToken: res.rawToken,
        label: res.token.label
      });
      setRecipientLabel('');
      setCopied(false);
      showFeedback('success', 'Private recruiter invitation generated.');
      loadTokens();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showFeedback('error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeToken = async (id: string) => {
    if (!window.confirm('Permanently revoke this recruiter invitation?')) return;
    try {
      const res = await apiClient.revokeRecruiterToken(id);
      showFeedback('success', res.message);
      loadTokens();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showFeedback('error', msg);
    }
  };

  const handleCopySecret = () => {
    if (!createdSecret) return;
    navigator.clipboard.writeText(createdSecret.rawToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="bg-[#181A1F] border border-[rgba(255,255,255,0.08)] rounded-lg p-7 space-y-7 font-mono text-xs">
      {/* Header & Architecture Explanation */}
      <div className="border-b border-[rgba(255,255,255,0.08)] pb-5 space-y-2">
        <div className="flex items-center space-x-2 text-[#A8B8A7]">
          <Key className="w-4 h-4" />
          <h3 className="font-display text-lg font-medium text-[#F0F0ED]">Private Recruiter Access</h3>
        </div>
        <p className="text-[#A4A8AE] text-xs leading-relaxed font-sans font-light">
          Create temporary, read-only invitation links for selected recruiters to access materials that are not part of the public portfolio.
        </p>
      </div>

      {/* Global Feedback */}
      {feedback && (
        <div className={`p-3.5 rounded flex items-center space-x-2 ${
          feedback.type === 'success' 
            ? 'bg-[#101114] border border-[#A8B8A7]/40 text-[#A8B8A7]' 
            : 'bg-red-950/30 border border-red-500/40 text-red-400'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Transparency & Recruiter Tiers Callout */}
      <div className="p-4 bg-[#101114] border border-[rgba(255,255,255,0.06)] rounded-lg space-y-2 text-[11px] text-[#A4A8AE]">
        <div className="flex items-center space-x-1.5 text-[#F0F0ED] font-semibold">
          <Eye className="w-3.5 h-3.5 text-[#A8B8A7]" />
          <span>Public Transparency Guarantee:</span>
        </div>
        <p>
          Visiting technical recruiters and engineering managers can browse your full public portfolio, projects, evidence matrix, recruiter brief, academics, and résumé with zero gatekeeping or login walls. Private tokens exist solely for confidential out-of-band case study previews or expedited direct communication channels.
        </p>
      </div>

      {/* One-Time Plaintext Secret Reveal Modal / Banner */}
      {createdSecret && (
        <div className="p-5 bg-[#101114] border border-[#A8B8A7]/50 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[#A8B8A7] font-semibold text-xs flex items-center space-x-2">
              <Lock className="w-4 h-4" />
              <span>SINGLE-USE INVITATION SECRET REVEAL</span>
            </span>
            <button
              onClick={() => setCreatedSecret(null)}
              className="text-[#A4A8AE] hover:text-[#F0F0ED]"
            >
              Dismiss
            </button>
          </div>

          <p className="text-[#A4A8AE] text-[11px]">
            Save and copy this invitation token now. For cryptographic safety, only the SHA-256 hash is retained on the server. The raw token secret cannot be recovered once dismissed.
          </p>

          <div className="p-3 bg-[#181A1F] border border-[rgba(255,255,255,0.1)] rounded flex items-center justify-between font-mono text-sm text-[#F0F0ED] select-all">
            <span className="tracking-wider">{createdSecret.rawToken}</span>
            <button
              onClick={handleCopySecret}
              className="px-3 py-1 bg-[#A8B8A7] text-[#101114] font-medium rounded hover:bg-[#BDCCBA] text-xs flex items-center space-x-1.5 transition-colors"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-3 h-3" />
                  <span>COPIED</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>COPY INVITATION</span>
                </>
              )}
            </button>
          </div>

          <span className="text-[10px] text-[#A4A8AE] block">
            Target recipient: <strong className="text-[#F0F0ED]">{createdSecret.label}</strong>
          </span>
        </div>
      )}

      {/* Issue Invitation Form */}
      <form onSubmit={handleCreateToken} className="space-y-4 max-w-2xl bg-[#101114] p-5 rounded border border-[rgba(255,255,255,0.06)]">
        <span className="text-[#F0F0ED] font-medium text-xs block">Issue New Private Recruiter Invitation</span>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-[#A4A8AE] text-[11px] mb-1">Recipient Label / Organization</label>
            <input
              type="text"
              value={recipientLabel}
              onChange={(e) => setRecipientLabel(e.target.value)}
              placeholder="e.g. Senior Technical Recruiter at Company X"
              className="w-full bg-[#181A1F] border border-[rgba(255,255,255,0.08)] rounded p-2 text-[#F0F0ED] text-xs focus:outline-none focus:border-[#A8B8A7]"
            />
          </div>

          <div>
            <label className="block text-[#A4A8AE] text-[11px] mb-1">Expires After</label>
            <select
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(Number(e.target.value))}
              className="w-full bg-[#181A1F] border border-[rgba(255,255,255,0.08)] rounded p-2 text-[#F0F0ED] text-xs focus:outline-none focus:border-[#A8B8A7]"
            >
              <option value={7}>7 Days</option>
              <option value={14}>14 Days</option>
              <option value={30}>30 Days</option>
              <option value={60}>60 Days</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 bg-[#A8B8A7] text-[#101114] font-medium rounded hover:bg-[#BDCCBA] transition-colors disabled:opacity-50 text-xs flex items-center space-x-2"
        >
          <span>{loading ? 'GENERATING SECURE TOKEN...' : '+ ISSUE CRYPTOGRAPHIC INVITATION'}</span>
        </button>
      </form>

      {/* Tokens Table */}
      <div className="space-y-3">
        <span className="text-[#A8B8A7] font-semibold text-[11px]">ACTIVE & HISTORICAL INVITATIONS</span>

        {tokens.length === 0 ? (
          <div className="p-6 bg-[#101114] border border-[rgba(255,255,255,0.06)] rounded text-center text-[#A4A8AE] text-xs">
            No private invitations currently on record.
          </div>
        ) : (
          <div className="overflow-x-auto border border-[rgba(255,255,255,0.08)] rounded">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#22252C] text-[#A4A8AE] border-b border-[rgba(255,255,255,0.08)]">
                <tr>
                  <th className="py-2.5 px-4 font-medium">Token Prefix</th>
                  <th className="py-2.5 px-4 font-medium">Recipient Label</th>
                  <th className="py-2.5 px-4 font-medium">Reads</th>
                  <th className="py-2.5 px-4 font-medium">Status</th>
                  <th className="py-2.5 px-4 font-medium">Created (IST)</th>
                  <th className="py-2.5 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(255,255,255,0.06)] bg-[#101114]">
                {tokens.map(t => (
                  <tr key={t.id}>
                    <td className="py-2.5 px-4 text-[#A8B8A7] font-mono">{t.tokenPrefix}</td>
                    <td className="py-2.5 px-4 text-[#F0F0ED]">{t.label}</td>
                    <td className="py-2.5 px-4 text-[#A4A8AE]">{t.accessCount} visits</td>
                    <td className="py-2.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${
                        t.status === 'Active' ? 'bg-[#A8B8A7]/10 text-[#A8B8A7]' : 'bg-red-950/40 text-red-400'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-[#A4A8AE]">{t.createdAtIST}</td>
                    <td className="py-2.5 px-4 text-right">
                      {t.status === 'Active' && (
                        <button
                          onClick={() => handleRevokeToken(t.id)}
                          className="text-red-400 hover:underline text-[11px] flex items-center space-x-1 ml-auto"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Revoke</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Advisory */}
      <div className="p-4 bg-[#101114] border border-[rgba(255,255,255,0.06)] rounded text-[11px] text-[#A4A8AE] space-y-1">
        <div className="flex items-center space-x-1 text-amber-400 font-semibold">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Security & Principle of Least Privilege:</span>
        </div>
        <p>
          Recruiter tokens are strictly read-only. Under no circumstances can a recruiter token grant administrative access, trigger repository syncs, or access owner security configurations.
        </p>
      </div>
    </div>
  );
}
