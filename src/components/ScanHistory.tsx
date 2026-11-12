import React, { useState } from 'react';
import { ScanResult } from '../types';
import {
  History,
  Search,
  Trash2,
  Download,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';

interface ScanHistoryProps {
  historyList: ScanResult[];
  onSelectScan: (scan: ScanResult) => void;
  onClearHistory: () => void;
}

export const ScanHistory: React.FC<ScanHistoryProps> = ({
  historyList,
  onSelectScan,
  onClearHistory,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState<'All' | 'Low' | 'Medium' | 'High'>('All');
  const [sortBy, setSortBy] = useState<'newest' | 'score_desc' | 'score_asc'>('newest');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const filtered = historyList
    .filter((item) => {
      const matchSearch = item.url.toLowerCase().includes(searchTerm.toLowerCase());
      const matchRisk = riskFilter === 'All' || item.riskLevel === riskFilter;
      return matchSearch && matchRisk;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      }
      if (sortBy === 'score_desc') {
        return b.riskScore - a.riskScore;
      }
      return a.riskScore - b.riskScore;
    });

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(historyList, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `url_checker_history_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="bg-white border border-blue-100 rounded-2xl p-6 sm:p-8 shadow-sm shadow-blue-500/5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <History className="w-6 h-6 text-blue-600" />
              <span>Scan Audit History</span>
            </h1>
            <p className="text-slate-600 text-sm mt-1">
              Review and audit previous URL evaluations, risk scores, and detected security flags.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {historyList.length > 0 && (
              <>
                <button
                  onClick={handleExportJson}
                  className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5 text-blue-600" />
                  <span>Export JSON</span>
                </button>

                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="px-3.5 py-2 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Clear History</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="mt-6 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by URL (e.g. paypal, 192.168, google)..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-blue-200 rounded-xl text-slate-900 text-xs font-mono placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Risk filter */}
            <div className="flex items-center p-0.5 bg-slate-50 border border-blue-200 rounded-xl text-xs">
              {(['All', 'Low', 'Medium', 'High'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setRiskFilter(level)}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    riskFilter === level
                      ? 'bg-blue-600 text-white font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>

            {/* Sort selector */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 border border-blue-200 rounded-xl text-slate-700 text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="score_desc">Sort: Highest Risk Score</option>
              <option value="score_asc">Sort: Lowest Risk Score</option>
            </select>
          </div>
        </div>
      </section>

      {/* History Table */}
      <section className="bg-white border border-blue-100 rounded-xl p-6 shadow-sm shadow-blue-500/5">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs space-y-2">
            <History className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="text-slate-700 text-sm font-medium">No scan history matches your filter.</p>
            <p className="text-slate-500">Try clearing your search query or run a new scan from the URL Scanner tab.</p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-blue-100 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-blue-100 text-slate-600 font-semibold">
                  <th className="py-3 px-4">Risk Level</th>
                  <th className="py-3 px-4">Risk Score</th>
                  <th className="py-3 px-4">Target URL</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Indicators Flagged</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-50 font-mono">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-blue-50/50 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-bold ${
                          item.riskLevel === 'High'
                            ? 'text-rose-600'
                            : item.riskLevel === 'Medium'
                            ? 'text-amber-600'
                            : 'text-emerald-600'
                        }`}
                      >
                        {item.riskLevel === 'High' && <AlertOctagon className="w-3.5 h-3.5" />}
                        {item.riskLevel === 'Medium' && <AlertTriangle className="w-3.5 h-3.5" />}
                        {item.riskLevel === 'Low' && <CheckCircle2 className="w-3.5 h-3.5" />}
                        <span>{item.riskLevel}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold tabular-nums text-slate-800">
                      {item.riskScore}/100
                    </td>
                    <td className="py-3 px-4 max-w-sm truncate text-slate-800 font-medium" title={item.url}>
                      {item.url}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                      {new Date(item.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-[11px] whitespace-nowrap">
                      {item.triggeredCount} indicator(s)
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap font-sans">
                      <button
                        onClick={() => onSelectScan(item)}
                        className="text-blue-600 hover:text-blue-700 font-semibold text-xs cursor-pointer"
                      >
                        Inspect Details →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-blue-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2 rounded-xl bg-rose-50 border border-rose-200">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Clear All Scan History?</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              This will remove all saved URL scan records and SQLite table entries. This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onClearHistory();
                  setShowClearConfirm(false);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors cursor-pointer shadow-sm shadow-rose-500/20"
              >
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
