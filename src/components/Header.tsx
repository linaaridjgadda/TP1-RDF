import React from 'react';
import { Eye, Layers, FileText, Code2, Download } from 'lucide-react';

export type SimpleNavTab = 'workbench' | 'otsu' | 'questions' | 'python';
export type NavTab = 'dashboard' | 'segmentation' | 'comparison' | 'experiments' | 'report' | 'code' | 'workbench' | 'otsu' | 'questions' | 'python';

interface HeaderProps {
  currentTab: SimpleNavTab;
  onSelectTab: (tab: SimpleNavTab) => void;
  onQuickDownload?: () => void;
  hasResults: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  onQuickDownload,
  hasResults,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        {/* Logo et Titre simple */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-slate-950 font-bold text-sm shadow-sm">
            QT
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-bold text-slate-100 tracking-tight">
              Quadtree TP1 · Segmentation Facile
            </h1>
          </div>
        </div>

        {/* 4 Onglets Clairs */}
        <nav className="hidden md:flex items-center gap-1.5 text-xs font-semibold">
          <button
            onClick={() => onSelectTab('workbench')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
              currentTab === 'workbench'
                ? 'bg-cyan-500 text-slate-950 shadow-sm font-bold'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>Atelier Visuel (Pas-à-pas)</span>
          </button>

          <button
            onClick={() => onSelectTab('otsu')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
              currentTab === 'otsu'
                ? 'bg-cyan-500 text-slate-950 shadow-sm font-bold'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Comparaison Otsu</span>
          </button>

          <button
            onClick={() => onSelectTab('questions')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
              currentTab === 'questions'
                ? 'bg-cyan-500 text-slate-950 shadow-sm font-bold'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Questions & Réponses</span>
          </button>

          <button
            onClick={() => onSelectTab('python')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
              currentTab === 'python'
                ? 'bg-cyan-500 text-slate-950 shadow-sm font-bold'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Code Python (.py)</span>
          </button>
        </nav>

        {/* Bouton d'action Télécharger */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onQuickDownload}
            disabled={!hasResults}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              hasResults
                ? 'bg-slate-800 hover:bg-slate-750 text-cyan-400 border border-slate-700 hover:border-cyan-500/50'
                : 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Télécharger tout</span>
          </button>
        </div>
      </div>

      {/* Barre de navigation mobile */}
      <div className="flex md:hidden overflow-x-auto gap-1.5 pt-2 border-t border-slate-800/60 mt-2">
        <button
          onClick={() => onSelectTab('workbench')}
          className={`px-2.5 py-1 text-xs rounded-md whitespace-nowrap font-medium ${
            currentTab === 'workbench' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'
          }`}
        >
          Atelier Pas-à-pas
        </button>
        <button
          onClick={() => onSelectTab('otsu')}
          className={`px-2.5 py-1 text-xs rounded-md whitespace-nowrap font-medium ${
            currentTab === 'otsu' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'
          }`}
        >
          Comparaison Otsu
        </button>
        <button
          onClick={() => onSelectTab('questions')}
          className={`px-2.5 py-1 text-xs rounded-md whitespace-nowrap font-medium ${
            currentTab === 'questions' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'
          }`}
        >
          Questions du TP
        </button>
        <button
          onClick={() => onSelectTab('python')}
          className={`px-2.5 py-1 text-xs rounded-md whitespace-nowrap font-medium ${
            currentTab === 'python' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'
          }`}
        >
          Code Python
        </button>
      </div>
    </header>
  );
};
