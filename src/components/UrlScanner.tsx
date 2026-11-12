import React, { useState } from 'react';
import { ScanResult, ThreatIntelligence, User } from '../types';
import { ThreatIntelCard } from './ThreatIntelCard';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Search,
  ExternalLink,
  Copy,
  Check,
  RotateCcw,
  Info,
  Layers,
  Activity,
  Globe,
  Lock,
} from 'lucide-react';

interface UrlScannerProps {
  onScanComplete: (result: ScanResult) => void;
  activeScanResult: ScanResult | null;
  onClearActiveScan: () => void;
  currentUser?: User | null;
  onOpenLogin?: () => void;
}

const PRESET_URLS = [
  { label: 'Google (Legit)', url: 'https://www.google.com', tag: 'Safe' },
  { label: 'GitHub (Legit)', url: 'https://github.com/login', tag: 'Safe' },
  { label: 'Numeric IP Host', url: 'http://192.168.1.10/login.php', tag: 'Suspicious' },
  { label: 'PayPal Spoof', url: 'http://paypal-account-security-update.top/signin', tag: 'Phishing' },
  { label: '@ Redirection', url: 'http://google.com@malicious-portal.com/auth', tag: 'Phishing' },
  { label: 'Punycode Homograph', url: 'http://xn--gogle-pua.com/account', tag: 'Phishing' },
  { label: 'Subdomain Stacking', url: 'http://login.verify.account.security.paypal.com.host-update.xyz', tag: 'Phishing' },
];

export const UrlScanner: React.FC<UrlScannerProps> = ({
  onScanComplete,
  activeScanResult,
  onClearActiveScan,
  currentUser,
  onOpenLogin,
}) => {
  const [inputUrl, setInputUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [copied, setCopied] = useState(false);

  // Deep Threat Intel state
  const [threatIntel, setThreatIntel] = useState<ThreatIntelligence | undefined>(
    activeScanResult?.threatIntel
  );
  const [isThreatIntelLoading, setIsThreatIntelLoading] = useState(false);

  const handleScan = async (targetUrl?: string) => {
    const urlToTest = (targetUrl || inputUrl).trim();
    if (!urlToTest) {
      setError('Please enter a web address to scan (e.g. https://example.com).');
      return;
    }

    setError(null);
    setIsScanning(true);
    setThreatIntel(undefined);

    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlToTest }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to scan URL.');
      }

      onScanComplete(data.result);
      if (targetUrl) {
        setInputUrl(targetUrl);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred during scanning.';
      setError(msg);
    } finally {
      setIsScanning(false);
    }
  };

  const handleRequestThreatIntel = async () => {
    if (!activeScanResult) return;
    setIsThreatIntelLoading(true);

    try {
      const response = await fetch('/api/threat-intel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: activeScanResult.url,
          heuristicSummary: activeScanResult.summary,
        }),
      });

      const data = await response.json();
      setThreatIntel(data);
    } catch (err) {
      console.error('Threat intel fetch error:', err);
    } finally {
      setIsThreatIntelLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Scanner Input Header */}
      <section className="bg-white border border-blue-100 rounded-2xl p-6 sm:p-8 shadow-sm shadow-blue-500/5">
        <div className="max-w-3xl">
          <div className="flex items-center gap-3.5">
            <img
              src="/assets/aistudio/images_55d53b86.png"
              alt="URL Checker Logo"
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl object-contain shrink-0 ring-1 ring-blue-500/30 bg-blue-50 p-1 shadow-md shadow-blue-500/10"
            />
            <div>
              <h1 className="font-brand text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>URL</span>
                <span className="text-blue-600">Checker</span>
              </h1>
            </div>
          </div>
          <p className="text-slate-600 text-sm sm:text-base mt-2.5">
            Advanced URL security inspection engine for identifying deceptive hosts, brand spoofing, malicious domains, and credential harvesting threats.
          </p>

          {/* Session Banner */}
          {currentUser ? (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-mono text-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Authenticated Analyst: {currentUser.email}</span>
            </div>
          ) : (
            <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Sign in required to inspect URLs.</span>
              <button
                type="button"
                onClick={onOpenLogin}
                className="text-blue-600 hover:text-blue-700 font-medium underline underline-offset-2 cursor-pointer"
              >
                Sign in with Gmail & password
              </button>
            </div>
          )}
        </div>

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleScan();
          }}
          className="mt-6"
        >
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Globe className="w-4 h-4 text-blue-500" />
              </div>
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => {
                  setInputUrl(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Enter URL to inspect (e.g. https://paypal.com or http://192.168.1.10/login)..."
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-blue-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 font-mono transition-all"
                disabled={isScanning}
              />
              {inputUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setInputUrl('');
                    onClearActiveScan();
                  }}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 text-xs font-medium cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={isScanning}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white font-semibold text-sm rounded-xl transition-colors whitespace-nowrap shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              {isScanning ? (
                <>
                  <Activity className="w-4 h-4 animate-spin" />
                  <span>Scanning URL...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Scan URL</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Error Feedback */}
        {error && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Quick Presets */}
        <div className="mt-5 pt-5 border-t border-slate-100 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Quick Test Scenarios:</span>
          {PRESET_URLS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setInputUrl(preset.url);
                handleScan(preset.url);
              }}
              className="px-2.5 py-1 text-xs rounded-md bg-blue-50/70 hover:bg-blue-100/80 border border-blue-200/70 text-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer font-mono text-[11px]"
            >
              <span>{preset.label}</span>
              <span
                className={`text-[9px] uppercase px-1 rounded ${
                  preset.tag === 'Safe'
                    ? 'text-emerald-700 bg-emerald-100'
                    : preset.tag === 'Phishing'
                    ? 'text-rose-700 bg-rose-100'
                    : 'text-amber-700 bg-amber-100'
                }`}
              >
                {preset.tag}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Scan Results View */}
      {activeScanResult && (
        <div className="space-y-6">
          {/* Main Risk Assessment Banner */}
          <section
            className={`border rounded-2xl p-6 sm:p-8 bg-white transition-all shadow-sm ${
              activeScanResult.riskLevel === 'High'
                ? 'border-rose-200 shadow-rose-500/10'
                : activeScanResult.riskLevel === 'Medium'
                ? 'border-amber-200 shadow-amber-500/10'
                : 'border-blue-200 shadow-blue-500/10'
            }`}
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-100 pb-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                      activeScanResult.riskLevel === 'High'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : activeScanResult.riskLevel === 'Medium'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {activeScanResult.riskLevel} Risk Profile
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    · {new Date(activeScanResult.timestamp).toLocaleTimeString()}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base sm:text-lg font-mono font-bold text-slate-900 break-all">
                    {activeScanResult.url}
                  </h2>
                  <button
                    onClick={() => handleCopy(activeScanResult.url)}
                    className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                    title="Copy URL"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <p className="text-xs sm:text-sm text-slate-600">{activeScanResult.summary}</p>
              </div>

              {/* Numerical Risk Score Gauge */}
              <div className="flex items-center gap-4 bg-slate-50 border border-blue-100 rounded-xl p-4 self-start lg:self-auto shrink-0 shadow-sm">
                <div className="text-right">
                  <span className="text-xs text-slate-500 block font-medium">Risk Score</span>
                  <div className="flex items-baseline gap-1">
                    <span
                      className={`text-3xl sm:text-4xl font-extrabold font-mono tabular-nums ${
                        activeScanResult.riskLevel === 'High'
                          ? 'text-rose-600'
                          : activeScanResult.riskLevel === 'Medium'
                          ? 'text-amber-600'
                          : 'text-emerald-600'
                      }`}
                    >
                      {activeScanResult.riskScore}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">/100</span>
                  </div>
                </div>

                <div className="w-12 h-12 rounded-xl flex items-center justify-center border border-blue-200 bg-white shadow-xs">
                  {activeScanResult.riskLevel === 'High' ? (
                    <ShieldAlert className="w-6 h-6 text-rose-600" />
                  ) : activeScanResult.riskLevel === 'Medium' ? (
                    <AlertTriangle className="w-6 h-6 text-amber-600" />
                  ) : (
                    <ShieldCheck className="w-6 h-6 text-emerald-600" />
                  )}
                </div>
              </div>
            </div>

            {/* Recommendation Box */}
            <div className="mt-4 p-4 rounded-xl bg-blue-50/70 border border-blue-100 flex items-start gap-3">
              <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
              <div className="text-xs sm:text-sm text-slate-700">
                <strong className="text-slate-900">Safety Recommendation:</strong>{' '}
                {activeScanResult.recommendation}
              </div>
            </div>

            {/* Security Notice */}
            <div className="mt-3 text-[11px] text-slate-400 italic">
              Notice: Security analysis results are algorithmic assessments based on structural and lexical indicators. Never claim 100% detection accuracy.
            </div>
          </section>

          {/* URL Component Decomposition Grid */}
          <section className="bg-white border border-blue-100 rounded-xl p-6 shadow-sm shadow-blue-500/5">
            <div className="flex items-center gap-2 mb-4">
              <Layers className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                URL Structural Decomposition
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
              <div className="p-3 bg-slate-50 border border-blue-100 rounded-lg">
                <span className="text-slate-500 block text-[11px]">Protocol</span>
                <span className="font-mono text-slate-800 font-semibold">
                  {activeScanResult.decomposition.protocol}://
                </span>
              </div>
              <div className="p-3 bg-slate-50 border border-blue-100 rounded-lg">
                <span className="text-slate-500 block text-[11px]">Host / IP</span>
                <span className="font-mono text-slate-800 font-semibold truncate block" title={activeScanResult.decomposition.hostname}>
                  {activeScanResult.decomposition.hostname}
                </span>
              </div>
              <div className="p-3 bg-slate-50 border border-blue-100 rounded-lg">
                <span className="text-slate-500 block text-[11px]">Port</span>
                <span className="font-mono text-slate-800 font-semibold">
                  {activeScanResult.decomposition.port}
                </span>
              </div>
              <div className="p-3 bg-slate-50 border border-blue-100 rounded-lg">
                <span className="text-slate-500 block text-[11px]">TLD</span>
                <span className="font-mono text-slate-800 font-semibold">
                  .{activeScanResult.decomposition.topLevelDomain || 'none'}
                </span>
              </div>
              <div className="p-3 bg-slate-50 border border-blue-100 rounded-lg">
                <span className="text-slate-500 block text-[11px]">Length</span>
                <span className="font-mono text-slate-800 font-semibold tabular-nums">
                  {activeScanResult.decomposition.urlLength} chars
                </span>
              </div>
              <div className="p-3 bg-slate-50 border border-blue-100 rounded-lg">
                <span className="text-slate-500 block text-[11px]">Entropy</span>
                <span className="font-mono text-slate-800 font-semibold tabular-nums">
                  {activeScanResult.decomposition.entropy} bits
                </span>
              </div>
            </div>
          </section>

          {/* Deep AI Threat Intelligence Card */}
          <ThreatIntelCard
            intel={threatIntel}
            isLoading={isThreatIntelLoading}
            onRequestIntel={handleRequestThreatIntel}
          />
        </div>
      )}
    </div>
  );
};
