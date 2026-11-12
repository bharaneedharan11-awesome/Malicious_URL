import React from 'react';
import { Shield, ShieldAlert, LogIn, LogOut, User as UserIcon } from 'lucide-react';
import { User } from '../types';

interface HeaderProps {
  activeTab: 'scanner' | 'history';
  onSelectTab: (tab: 'scanner' | 'history') => void;
  onQuickScanAction: () => void;
  currentUser: User | null;
  onOpenLogin: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  onQuickScanAction,
  currentUser,
  onOpenLogin,
  onLogout,
}) => {
  return (
    <header className="border-b border-blue-100 bg-white/95 backdrop-blur-md sticky top-0 z-40 shadow-sm shadow-blue-500/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand wordmark (single element) */}
        <div className="flex items-center gap-3 shrink-0">
          <img
            src="/assets/aistudio/images_55d53b86.png"
            alt="URL Checker Logo"
            className="w-9 h-9 rounded-xl object-contain shrink-0 ring-1 ring-blue-500/30 bg-blue-50 shadow-md shadow-blue-500/10"
          />
          <button
            onClick={() => onSelectTab('scanner')}
            className="font-brand text-xl font-black tracking-tight text-slate-900 hover:text-blue-600 transition-colors whitespace-nowrap text-left flex items-center gap-1.5 cursor-pointer"
          >
            <span className="tracking-tight">URL</span>
            <span className="text-blue-600 font-black tracking-tight">Checker</span>
          </button>
        </div>

        {/* Zone 2: Concise single-line navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <button
            onClick={() => onSelectTab('scanner')}
            className={`whitespace-nowrap transition-colors pb-0.5 ${
              activeTab === 'scanner'
                ? 'text-blue-600 border-b-2 border-blue-600 font-semibold'
                : 'hover:text-blue-600 text-slate-500'
            }`}
          >
            URL Scanner
          </button>
          <button
            onClick={() => onSelectTab('history')}
            className={`whitespace-nowrap transition-colors pb-0.5 ${
              activeTab === 'history'
                ? 'text-blue-600 border-b-2 border-blue-600 font-semibold'
                : 'hover:text-blue-600 text-slate-500'
            }`}
          >
            Scan History
          </button>
        </nav>

        {/* Zone 3: 1 primary action + Auth Status */}
        <div className="flex items-center gap-3 shrink-0">
          {currentUser ? (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-xs font-mono text-slate-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-slate-800 truncate max-w-[170px]" title={currentUser.email}>
                  {currentUser.email}
                </span>
              </div>
              <button
                onClick={onLogout}
                className="px-2.5 py-1.5 text-xs text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-200 transition-colors flex items-center gap-1 cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-blue-600 bg-white hover:bg-blue-50 border border-blue-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <LogIn className="w-3.5 h-3.5 text-blue-600" />
              <span>Sign In</span>
            </button>
          )}

          <button
            onClick={onQuickScanAction}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap shadow-sm shadow-blue-500/20 flex items-center gap-1.5 cursor-pointer"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>New Scan</span>
          </button>
        </div>
      </div>
    </header>
  );
};
