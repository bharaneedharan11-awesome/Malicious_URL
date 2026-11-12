import React, { useState } from 'react';
import { ScanResult } from '../types';
import {
  X,
  Copy,
  Check,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Layers,
  FileCode,
  Info,
  Calendar,
} from 'lucide-react';

interface UrlDetailModalProps {
  scan: ScanResult | null;
  onClose: () => void;
}

export const UrlDetailModal: React.FC<UrlDetailModalProps> = ({ scan, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!scan) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-blue-200 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  scan.riskLevel === 'High'
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : scan.riskLevel === 'Medium'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}
              >
                {scan.riskLevel} Risk Profile
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                <Calendar className="w-3 h-3" />
                <span>{new Date(scan.timestamp).toLocaleString()}</span>
              </span>
            </div>
            <h2 className="text-base font-bold font-mono text-slate-900 break-all">{scan.url}</h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCopy(scan.url)}
              className="p-1.5 text-slate-500 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
              title="Copy URL"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Score & Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 border border-blue-100 rounded-xl text-center">
            <span className="text-xs text-slate-500 block">Risk Score</span>
            <span
              className={`text-3xl font-extrabold font-mono tabular-nums ${
                scan.riskLevel === 'High'
                  ? 'text-rose-600'
                  : scan.riskLevel === 'Medium'
                  ? 'text-amber-600'
                  : 'text-emerald-600'
              }`}
            >
              {scan.riskScore}
            </span>
            <span className="text-[11px] text-slate-400 block">out of 100 max</span>
          </div>

          <div className="sm:col-span-2 p-4 bg-slate-50 border border-blue-100 rounded-xl space-y-1.5">
            <span className="text-xs font-semibold text-slate-600 block uppercase tracking-wider">
              Scan Summary
            </span>
            <p className="text-xs sm:text-sm text-slate-700">{scan.summary}</p>
            <p className="text-xs text-blue-600 font-medium pt-1">
              <strong>Action:</strong> {scan.recommendation}
            </p>
          </div>
        </div>

        {/* Decomposition */}
        <div>
          <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>Parsed Components</span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
            <div className="p-2.5 bg-slate-50 border border-blue-100 rounded-lg">
              <span className="text-[10px] text-slate-500 font-sans block">Hostname</span>
              <span className="truncate block text-slate-800">{scan.decomposition.hostname}</span>
            </div>
            <div className="p-2.5 bg-slate-50 border border-blue-100 rounded-lg">
              <span className="text-[10px] text-slate-500 font-sans block">Domain</span>
              <span className="truncate block text-slate-800">{scan.decomposition.registeredDomain}</span>
            </div>
            <div className="p-2.5 bg-slate-50 border border-blue-100 rounded-lg">
              <span className="text-[10px] text-slate-500 font-sans block">Entropy</span>
              <span className="text-slate-800">{scan.decomposition.entropy} bits</span>
            </div>
            <div className="p-2.5 bg-slate-50 border border-blue-100 rounded-lg">
              <span className="text-[10px] text-slate-500 font-sans block">Port</span>
              <span className="text-slate-800">:{scan.decomposition.port}</span>
            </div>
          </div>
        </div>

        {/* Security Risk Flags */}
        <div>
          <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-blue-600" />
            <span>Security Risk Flags ({scan.triggeredCount})</span>
          </h3>

          <div className="border border-blue-100 rounded-xl overflow-hidden divide-y divide-blue-50">
            {scan.rules
              .filter((r) => r.triggered)
              .map((rule) => (
                <div key={rule.id} className="p-3.5 bg-white flex items-start justify-between gap-3 text-xs">
                  <div>
                    <div className="font-semibold text-slate-900 flex items-center gap-2">
                      <span>{rule.name}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 text-rose-700 bg-rose-50 border border-rose-200 rounded">
                        Flagged
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1">{rule.description}</p>
                    <div className="mt-1.5 text-[11px] font-mono text-slate-700">
                      Finding: <code className="text-blue-700 bg-blue-50 px-1 py-0.5 rounded">{rule.evidence}</code>
                    </div>
                  </div>
                </div>
              ))}
            {scan.triggeredCount === 0 && (
              <div className="p-4 text-center text-xs text-emerald-600 font-medium">
                ✓ No security risk flags detected for this URL.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-slate-100 pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer shadow-sm shadow-blue-500/20"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
