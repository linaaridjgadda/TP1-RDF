import React, { useState } from 'react';
import { BarChart3, Play, Download, CheckCircle2, RotateCcw, AlertTriangle, Layers } from 'lucide-react';
import { LoadedImage, downloadTextFile } from '../utils/imageUtils';
import { runSegmentationPipeline, SegmentationParams, HomogeneityCriterion } from '../algorithms/quadtree';

export interface ExperimentRow {
  experiment: 'A' | 'B' | 'C' | 'D';
  label: string;
  T: number;
  min_size: number;
  T_m: number;
  criterion: HomogeneityCriterion;
  leafCount: number;
  maxDepth: number;
  finalRegions: number;
  psnr: number;
  timeMs: number;
}

interface ExperimentsViewProps {
  image: LoadedImage | null;
  baseParams: SegmentationParams;
}

export const ExperimentsView: React.FC<ExperimentsViewProps> = ({
  image,
  baseParams,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number; label: string } | null>(null);
  const [results, setResults] = useState<ExperimentRow[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'A' | 'B' | 'C' | 'D'>('all');

  const runAllExperiments = async () => {
    if (!image) return;
    setIsRunning(true);
    setResults([]);

    const suite: {
      exp: 'A' | 'B' | 'C' | 'D';
      label: string;
      params: SegmentationParams;
    }[] = [
      // Exp A: Varier T (5, 10, 20, 40) avec min_size=8, T_m=15, criterion=std
      { exp: 'A', label: 'Exp A (T=5)', params: { T: 5, min_size: 8, T_m: 15, criterion: 'std' } },
      { exp: 'A', label: 'Exp A (T=10)', params: { T: 10, min_size: 8, T_m: 15, criterion: 'std' } },
      { exp: 'A', label: 'Exp A (T=20)', params: { T: 20, min_size: 8, T_m: 15, criterion: 'std' } },
      { exp: 'A', label: 'Exp A (T=40)', params: { T: 40, min_size: 8, T_m: 15, criterion: 'std' } },

      // Exp B: Varier min_size (4, 8, 16, 32) avec T=20, T_m=15, criterion=std
      { exp: 'B', label: 'Exp B (min_size=4)', params: { T: 20, min_size: 4, T_m: 15, criterion: 'std' } },
      { exp: 'B', label: 'Exp B (min_size=8)', params: { T: 20, min_size: 8, T_m: 15, criterion: 'std' } },
      { exp: 'B', label: 'Exp B (min_size=16)', params: { T: 20, min_size: 16, T_m: 15, criterion: 'std' } },
      { exp: 'B', label: 'Exp B (min_size=32)', params: { T: 20, min_size: 32, T_m: 15, criterion: 'std' } },

      // Exp C: Varier T_m (5, 15, 30) avec T=20, min_size=8, criterion=std
      { exp: 'C', label: 'Exp C (T_m=5)', params: { T: 20, min_size: 8, T_m: 5, criterion: 'std' } },
      { exp: 'C', label: 'Exp C (T_m=15)', params: { T: 20, min_size: 8, T_m: 15, criterion: 'std' } },
      { exp: 'C', label: 'Exp C (T_m=30)', params: { T: 20, min_size: 8, T_m: 30, criterion: 'std' } },

      // Exp D: Comparer critères std vs range
      { exp: 'D', label: 'Exp D (Critère: std, T=20)', params: { T: 20, min_size: 8, T_m: 15, criterion: 'std' } },
      { exp: 'D', label: 'Exp D (Critère: range, T=40)', params: { T: 40, min_size: 8, T_m: 15, criterion: 'range' } },
    ];

    const collected: ExperimentRow[] = [];

    // Exécution asynchrone pour ne pas figer l'interface et afficher la progression en temps réel
    for (let i = 0; i < suite.length; i++) {
      const item = suite[i];
      setProgress({
        current: i + 1,
        total: suite.length,
        label: `${item.label} en cours...`,
      });

      // Laisser respirer la boucle d'événements du navigateur
      await new Promise((resolve) => setTimeout(resolve, 30));

      const start = performance.now();
      const res = runSegmentationPipeline(
        image.grayscale,
        image.width,
        image.height,
        item.params
      );
      const timeMs = performance.now() - start;

      collected.push({
        experiment: item.exp,
        label: item.label,
        T: item.params.T,
        min_size: item.params.min_size,
        T_m: item.params.T_m,
        criterion: item.params.criterion,
        leafCount: res.divisionStats.leafCount,
        maxDepth: res.divisionStats.maxDepth,
        finalRegions: res.mergeStats.finalRegions,
        psnr: res.psnrMerged,
        timeMs,
      });

      setResults([...collected]);
    }

    setProgress(null);
    setIsRunning(false);
  };

  const handleExportCsv = () => {
    if (results.length === 0) return;
    const headers = [
      'Experience',
      'Configuration',
      'T',
      'min_size',
      'T_m',
      'Critere',
      'Nombre_Feuilles',
      'Profondeur_Max',
      'Regions_Finales',
      'PSNR_dB',
      'Temps_ms',
    ];

    const lines = results.map((r) =>
      [
        r.experiment,
        `"${r.label}"`,
        r.T,
        r.min_size,
        r.T_m,
        r.criterion,
        r.leafCount,
        r.maxDepth,
        r.finalRegions,
        isFinite(r.psnr) ? r.psnr.toFixed(2) : 'Infinity',
        r.timeMs.toFixed(1),
      ].join(',')
    );

    const csvContent = [headers.join(','), ...lines].join('\n');
    downloadTextFile(csvContent, `quadtree_experiences_${image?.name ?? 'run'}.csv`, 'text/csv');
  };

  // Filtrage des résultats par onglet
  const filteredResults = activeTab === 'all'
    ? results
    : results.filter((r) => r.experiment === activeTab);

  // Données pour le tracé graphique Exp A (Varier T)
  const expARows = results.filter((r) => r.experiment === 'A');

  if (!image) {
    return (
      <div className="p-8 text-center text-slate-500 bg-slate-900/60 rounded-lg border border-slate-800">
        <BarChart3 className="w-12 h-12 mx-auto mb-3 text-slate-600" />
        <p className="text-sm font-medium text-slate-400">Aucune image chargée pour les expériences</p>
        <p className="text-xs text-slate-500 mt-1">Veuillez charger une image dans la section Segmentation.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner and Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-lg bg-slate-900/90 border border-slate-800">
        <div>
          <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            Banc d'essais & Expérimentations paramétriques
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Exécute les séries d'expériences du TP (variations de T, min_size, T_m et comparaison de critères).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={runAllExperiments}
            disabled={isRunning}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-all shadow-sm ${
              isRunning
                ? 'bg-cyan-600 text-white cursor-wait opacity-80'
                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/20 active:translate-y-0.5'
            }`}
          >
            {isRunning ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Calcul en cours...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Lancer toutes les expériences</span>
              </>
            )}
          </button>

          <button
            onClick={handleExportCsv}
            disabled={results.length === 0}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs rounded-md border transition-colors ${
              results.length > 0
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                : 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed'
            }`}
            title="Exporter les résultats actuels au format CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exporter CSV</span>
          </button>
        </div>
      </div>

      {/* Progress Bar when running */}
      {progress && (
        <div className="p-3 bg-slate-900/90 rounded-lg border border-cyan-800/60 space-y-1.5">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-cyan-300">{progress.label}</span>
            <span className="text-slate-400">
              {progress.current} / {progress.total} ({( (progress.current / progress.total) * 100 ).toFixed(0)}%)
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-400 transition-all duration-150"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Scientific SVG Charts (Dual-Axis Curves following guidelines) */}
      {expARows.length >= 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Chart 1: Leaves & Regions vs T */}
          <div className="bg-slate-900/90 rounded-lg border border-slate-800 p-4 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-200">
                Évolution de la subdivision selon le seuil T (Exp A)
              </span>
              <span className="font-mono text-[10px] text-slate-400">min_size=8 · T_m=15</span>
            </div>

            <div className="h-44 w-full bg-slate-950 rounded p-2 flex flex-col justify-between border border-slate-800">
              <svg className="w-full h-36" viewBox="0 0 320 120" preserveAspectRatio="none">
                {/* Axes and grid */}
                <line x1="30" y1="10" x2="30" y2="105" stroke="#334155" strokeWidth="1" />
                <line x1="30" y1="105" x2="310" y2="105" stroke="#334155" strokeWidth="1" />
                <line x1="30" y1="57" x2="310" y2="57" stroke="#1e293b" strokeDasharray="2,2" strokeWidth="1" />

                {/* Plot points for Leaf Count (Cyan) & Final Regions (Emerald) */}
                {(() => {
                  const maxLeaves = Math.max(...expARows.map((r) => r.leafCount), 1);
                  const pointsLeaves = expARows.map((r, i) => {
                    const x = 40 + (i / (expARows.length - 1)) * 260;
                    const y = 100 - (r.leafCount / maxLeaves) * 85;
                    return `${x},${y}`;
                  }).join(' ');

                  const pointsRegions = expARows.map((r, i) => {
                    const x = 40 + (i / (expARows.length - 1)) * 260;
                    const y = 100 - (r.finalRegions / maxLeaves) * 85;
                    return `${x},${y}`;
                  }).join(' ');

                  return (
                    <>
                      {/* Leaf Count Line */}
                      <polyline fill="none" stroke="#06b6d4" strokeWidth="2" points={pointsLeaves} />
                      {/* Final Regions Line */}
                      <polyline fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="4,3" points={pointsRegions} />

                      {/* Data Dots */}
                      {expARows.map((r, i) => {
                        const x = 40 + (i / (expARows.length - 1)) * 260;
                        const yL = 100 - (r.leafCount / maxLeaves) * 85;
                        const yR = 100 - (r.finalRegions / maxLeaves) * 85;
                        return (
                          <g key={i}>
                            <circle cx={x} cy={yL} r="3" fill="#06b6d4" />
                            <circle cx={x} cy={yR} r="3" fill="#10b981" />
                            <text x={x} y="116" fill="#94a3b8" fontSize="9" textAnchor="middle" fontFamily="var(--font-mono)">
                              T={r.T}
                            </text>
                          </g>
                        );
                      })}
                    </>
                  );
                })()}
              </svg>

              <div className="flex justify-center items-center gap-6 text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-800">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-0.5 bg-cyan-400 inline-block" />
                  Feuilles quadtree
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-0.5 bg-emerald-400 inline-block border-b border-dashed" />
                  Régions finales après fusion
                </span>
              </div>
            </div>
          </div>

          {/* Chart 2: PSNR vs T */}
          <div className="bg-slate-900/90 rounded-lg border border-slate-800 p-4 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-200">
                Qualité de reconstruction (PSNR en dB) selon T
              </span>
              <span className="font-mono text-[10px] text-slate-400">Évaluation de fidélité</span>
            </div>

            <div className="h-44 w-full bg-slate-950 rounded p-2 flex flex-col justify-between border border-slate-800">
              <svg className="w-full h-36" viewBox="0 0 320 120" preserveAspectRatio="none">
                <line x1="30" y1="10" x2="30" y2="105" stroke="#334155" strokeWidth="1" />
                <line x1="30" y1="105" x2="310" y2="105" stroke="#334155" strokeWidth="1" />
                <line x1="30" y1="57" x2="310" y2="57" stroke="#1e293b" strokeDasharray="2,2" strokeWidth="1" />

                {(() => {
                  const validPsnrs = expARows.map((r) => isFinite(r.psnr) ? r.psnr : 45);
                  const minPsnr = Math.max(10, Math.min(...validPsnrs) - 3);
                  const maxPsnr = Math.max(...validPsnrs) + 3;
                  const range = maxPsnr - minPsnr || 1;

                  const points = expARows.map((r, i) => {
                    const x = 40 + (i / (expARows.length - 1)) * 260;
                    const val = isFinite(r.psnr) ? r.psnr : 45;
                    const y = 100 - ((val - minPsnr) / range) * 85;
                    return `${x},${y}`;
                  }).join(' ');

                  return (
                    <>
                      <polyline fill="none" stroke="#f59e0b" strokeWidth="2" points={points} />
                      {expARows.map((r, i) => {
                        const x = 40 + (i / (expARows.length - 1)) * 260;
                        const val = isFinite(r.psnr) ? r.psnr : 45;
                        const y = 100 - ((val - minPsnr) / range) * 85;
                        return (
                          <g key={i}>
                            <circle cx={x} cy={y} r="3" fill="#f59e0b" />
                            <text x={x} y={y - 6} fill="#f59e0b" fontSize="9" textAnchor="middle" fontFamily="var(--font-mono)">
                              {isFinite(r.psnr) ? `${r.psnr.toFixed(1)}dB` : '∞'}
                            </text>
                            <text x={x} y="116" fill="#94a3b8" fontSize="9" textAnchor="middle" fontFamily="var(--font-mono)">
                              T={r.T}
                            </text>
                          </g>
                        );
                      })}
                    </>
                  );
                })()}
              </svg>

              <div className="flex justify-center items-center gap-2 text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-800">
                <span className="w-2.5 h-0.5 bg-amber-400 inline-block" />
                <span>PSNR en dB (Une valeur plus élevée indique une fidélité accrue aux pixels d'origine)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Experiment filter tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-lg border border-slate-800 overflow-x-auto text-xs">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1.5 rounded font-medium transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'all' ? 'bg-slate-800 text-cyan-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Toutes les expériences ({results.length})
        </button>
        <button
          onClick={() => setActiveTab('A')}
          className={`px-3 py-1.5 rounded font-medium transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'A' ? 'bg-slate-800 text-cyan-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Exp A : Varier T
        </button>
        <button
          onClick={() => setActiveTab('B')}
          className={`px-3 py-1.5 rounded font-medium transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'B' ? 'bg-slate-800 text-cyan-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Exp B : Varier min_size
        </button>
        <button
          onClick={() => setActiveTab('C')}
          className={`px-3 py-1.5 rounded font-medium transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'C' ? 'bg-slate-800 text-cyan-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Exp C : Varier T_m
        </button>
        <button
          onClick={() => setActiveTab('D')}
          className={`px-3 py-1.5 rounded font-medium transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'D' ? 'bg-slate-800 text-cyan-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Exp D : Critère std vs range
        </button>
      </div>

      {/* Experimental Data Table */}
      <div className="bg-slate-900/90 rounded-lg border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-4 py-3 font-semibold">Expérience</th>
                <th className="px-4 py-3 font-semibold">T</th>
                <th className="px-4 py-3 font-semibold">min_size</th>
                <th className="px-4 py-3 font-semibold">T_m</th>
                <th className="px-4 py-3 font-semibold">Critère</th>
                <th className="px-4 py-3 font-semibold text-right">Feuilles</th>
                <th className="px-4 py-3 font-semibold text-right">Prof. Max</th>
                <th className="px-4 py-3 font-semibold text-right">Régions Finales</th>
                <th className="px-4 py-3 font-semibold text-right">PSNR (dB)</th>
                <th className="px-4 py-3 font-semibold text-right">Temps (ms)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
              {filteredResults.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-slate-500 font-sans">
                    Aucune mesure enregistrée. Cliquez sur <strong>Lancer toutes les expériences</strong> pour calculer les données réelles sur cette image.
                  </td>
                </tr>
              ) : (
                filteredResults.map((r, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-2.5 font-medium text-slate-200 font-sans">
                      {r.label}
                    </td>
                    <td className="px-4 py-2.5 text-cyan-400">{r.T}</td>
                    <td className="px-4 py-2.5">{r.min_size} px</td>
                    <td className="px-4 py-2.5 text-emerald-400">{r.T_m}</td>
                    <td className="px-4 py-2.5 text-slate-400">{r.criterion}</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-cyan-300 tabular-nums">
                      {r.leafCount}
                    </td>
                    <td className="px-4 py-2.5 text-right text-slate-400 tabular-nums">
                      {r.maxDepth}
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold text-emerald-300 tabular-nums">
                      {r.finalRegions}
                    </td>
                    <td className="px-4 py-2.5 text-right text-amber-300 tabular-nums">
                      {isFinite(r.psnr) ? r.psnr.toFixed(2) : '∞'}
                    </td>
                    <td className="px-4 py-2.5 text-right text-slate-400 tabular-nums">
                      {r.timeMs.toFixed(1)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
