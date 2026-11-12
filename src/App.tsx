import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { UrlScanner } from './components/UrlScanner';
import { ScanHistory } from './components/ScanHistory';
import { UrlDetailModal } from './components/UrlDetailModal';
import { GmailAuthGate } from './components/GmailAuthGate';
import { ScanResult, User } from './types';
import { evaluateUrl } from './services/detector';

export default function App() {
  const [activeTab, setActiveTab] = useState<'scanner' | 'history'>('scanner');
  const [activeScanResult, setActiveScanResult] = useState<ScanResult | null>(null);
  const [historyList, setHistoryList] = useState<ScanResult[]>([]);
  const [modalScan, setModalScan] = useState<ScanResult | null>(null);

  // User authentication state (restored from localStorage)
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem('url_checker_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Initialize sample history or fetch from server on load
  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch('/api/history');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            // Transform server history records into full ScanResults using local detector
            const hydrated = data
              .map((item: any) => {
                const { result } = evaluateUrl(item.url);
                if (result) {
                  return {
                    ...result,
                    id: item.id || result.id,
                    timestamp: item.timestamp || result.timestamp,
                  };
                }
                return null;
              })
              .filter(Boolean) as ScanResult[];

            if (hydrated.length > 0) {
              setHistoryList(hydrated);
              return;
            }
          }
        }
      } catch (err) {
        console.warn('Could not fetch server history, falling back to local defaults:', err);
      }

      // Fallback default history records
      const defaultSamples = [
        'https://www.google.com',
        'http://192.168.1.10/login.php',
        'http://paypal-account-security-update.top/signin.php',
        'http://google.com@attacker-site.com/auth',
      ];
      const initialScans = defaultSamples
        .map((u) => evaluateUrl(u).result)
        .filter(Boolean) as ScanResult[];
      setHistoryList(initialScans);
    }

    loadHistory();
  }, []);

  const handleScanComplete = (result: ScanResult) => {
    setActiveScanResult(result);
    setHistoryList((prev) => [result, ...prev.filter((p) => p.url !== result.url)]);
  };

  const handleClearHistory = async () => {
    try {
      await fetch('/api/history', { method: 'DELETE' });
    } catch (e) {
      console.warn('Clear history server call failed:', e);
    }
    setHistoryList([]);
  };

  const handleQuickScanAction = () => {
    if (!currentUser) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setActiveTab('scanner');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setActiveTab('scanner');
  };

  const handleLogout = () => {
    localStorage.removeItem('url_checker_user');
    setCurrentUser(null);
    setActiveScanResult(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-blue-500/20 selection:text-blue-900">
      {/* Top Bar Header */}
      <Header
        activeTab={activeTab}
        onSelectTab={(tab) => {
          if (!currentUser) return;
          setActiveTab(tab);
        }}
        onQuickScanAction={handleQuickScanAction}
        currentUser={currentUser}
        onOpenLogin={() => {}}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!currentUser ? (
          /* First Login Gate: User must sign in using Gmail and Password */
          <GmailAuthGate onLoginSuccess={handleLoginSuccess} />
        ) : (
          /* Authenticated Dashboard */
          <>
            {activeTab === 'scanner' && (
              <UrlScanner
                onScanComplete={handleScanComplete}
                activeScanResult={activeScanResult}
                onClearActiveScan={() => setActiveScanResult(null)}
                currentUser={currentUser}
                onOpenLogin={() => {}}
              />
            )}

            {activeTab === 'history' && (
              <ScanHistory
                historyList={historyList}
                onSelectScan={(scan) => setModalScan(scan)}
                onClearHistory={handleClearHistory}
              />
            )}
          </>
        )}
      </main>

      {/* Scan Detail Modal */}
      <UrlDetailModal scan={modalScan} onClose={() => setModalScan(null)} />

      {/* Clean White & Blue Footer */}
      <footer className="border-t border-blue-100 bg-white py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img
              src="/assets/aistudio/images_55d53b86.png"
              alt="URL Checker"
              className="w-6 h-6 rounded-lg object-contain shrink-0 ring-1 ring-blue-500/30 bg-blue-50"
            />
            <span className="font-brand font-black text-slate-900">URL Checker</span>
            <span aria-hidden="true">·</span>
            <span>Cybersecurity Threat Operations Console</span>
          </div>

          <div className="flex items-center gap-4">
            {currentUser ? (
              <>
                <button
                  onClick={() => setActiveTab('scanner')}
                  className="hover:text-blue-600 transition-colors cursor-pointer"
                >
                  URL Scanner
                </button>
                <span aria-hidden="true">·</span>
                <button
                  onClick={() => setActiveTab('history')}
                  className="hover:text-blue-600 transition-colors cursor-pointer"
                >
                  Scan History
                </button>
              </>
            ) : (
              <span className="text-slate-400 font-mono">Authentication Required</span>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
