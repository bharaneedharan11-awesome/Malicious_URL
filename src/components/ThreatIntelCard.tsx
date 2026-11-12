import React from 'react';
import { ThreatIntelligence } from '../types';
import { AlertTriangle, CheckCircle2, ShieldCheck, Sparkles, AlertOctagon, Terminal } from 'lucide-react';

interface ThreatIntelCardProps {
  intel?: ThreatIntelligence;
  isLoading: boolean;
  onRequestIntel: () => void;
}

export const ThreatIntelCard: React.FC<ThreatIntelCardProps> = ({
  intel,
  isLoading,
  onRequestIntel,
}) => {
  if (!intel && !isLoading) {
    return (
      <div className="border border-blue-100 bg-white rounded-xl p-5 mt-6 shadow-sm shadow-blue-500/5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <h4 className="text-sm font-semibold text-slate-900">Advanced AI Threat Intelligence</h4>
            </div>
            <p className="text-xs text-slate-600 mt-1 max-w-xl">
              Augment static security scanning with deep contextual threat intelligence (powered by server-side Gemini 3.8 Flash). Inspects deceptive social engineering cues, impersonated entities, and targeted defense advice.
            </p>
          </div>
          <button
            onClick={onRequestIntel}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 border border-blue-600 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 cursor-pointer shadow-sm shadow-blue-500/20"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-200" />
            <span>Run Deep Threat Intel</span>
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="border border-blue-100 bg-white rounded-xl p-6 mt-6 animate-pulse shadow-sm shadow-blue-500/5">
        <div className="flex items-center gap-2 text-blue-600 text-sm font-semibold mb-3">
          <Sparkles className="w-4 h-4 animate-spin" />
          <span>Generating Contextual Threat Intelligence...</span>
        </div>
        <p className="text-xs text-slate-500">
          Correlating URL tokens against credential harvesting vectors, social engineering patterns, and brand authority...
        </p>
        <div className="h-4 bg-blue-100/60 rounded mt-4 w-3/4"></div>
        <div className="h-4 bg-blue-100/60 rounded mt-2 w-1/2"></div>
      </div>
    );
  }

  if (!intel) return null;

  const isPhishing = intel.verdict === 'PHISHING' || intel.verdict === 'MALICIOUS';
  const isSuspicious = intel.verdict === 'SUSPICIOUS';

  return (
    <div className="border border-blue-100 bg-white rounded-xl p-6 mt-6 shadow-sm shadow-blue-500/5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <h4 className="text-sm font-semibold text-slate-900">Deep Threat Intelligence Evaluation</h4>
            <span className="text-xs text-slate-400 font-mono">· AI & Security Context</span>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Complementary threat intelligence analysis distinguishing social engineering lures from benign patterns.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs text-slate-500 block">Verdict</span>
            <div className="flex items-center gap-1.5 font-bold text-sm">
              {isPhishing ? (
                <>
                  <AlertOctagon className="w-4 h-4 text-rose-600" />
                  <span className="text-rose-600 font-mono">{intel.verdict}</span>
                </>
              ) : isSuspicious ? (
                <>
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span className="text-amber-600 font-mono">{intel.verdict}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-600 font-mono">{intel.verdict}</span>
                </>
              )}
            </div>
          </div>
          {intel.confidenceScore !== undefined && (
            <div className="text-right pl-3 border-l border-slate-200">
              <span className="text-xs text-slate-500 block">Confidence</span>
              <span className="text-sm font-bold font-mono text-slate-800 tabular-nums">
                {intel.confidenceScore}%
              </span>
            </div>
          )}
        </div>
      </div>

      {intel.threatSummary && (
        <div className="mb-4">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Threat Synthesis
          </span>
          <p className="text-sm text-slate-700 leading-relaxed bg-blue-50/60 p-3 rounded-lg border border-blue-100">
            {intel.threatSummary}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* Left Column: Impersonation & Tactics */}
        <div className="space-y-3">
          {intel.targetedBrand && intel.targetedBrand !== 'None' && (
            <div>
              <span className="font-semibold text-slate-600 block mb-1">Targeted Entity / Brand</span>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 font-mono">
                {intel.targetedBrand}
              </div>
            </div>
          )}

          {intel.socialEngineeringTactics && intel.socialEngineeringTactics.length > 0 && (
            <div>
              <span className="font-semibold text-slate-600 block mb-1">Social Engineering Vectors</span>
              <ul className="space-y-1">
                {intel.socialEngineeringTactics.map((tactic, idx) => (
                  <li key={idx} className="flex items-start gap-1.5 text-slate-700">
                    <span className="text-blue-600 font-mono">▸</span>
                    <span>{tactic}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right Column: IOCs & Mitigations */}
        <div className="space-y-3">
          {intel.indicatorsOfCompromise && intel.indicatorsOfCompromise.length > 0 && (
            <div>
              <span className="font-semibold text-slate-600 block mb-1">Observed Structural IOCs</span>
              <ul className="space-y-1">
                {intel.indicatorsOfCompromise.map((ioc, idx) => (
                  <li key={idx} className="flex items-start gap-1.5 text-slate-700">
                    <Terminal className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                    <span className="font-mono text-[11px] text-slate-800">{ioc}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {intel.mitigationSteps && intel.mitigationSteps.length > 0 && (
            <div>
              <span className="font-semibold text-slate-600 block mb-1">Protective Actions</span>
              <ul className="space-y-1">
                {intel.mitigationSteps.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-1.5 text-slate-700">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
