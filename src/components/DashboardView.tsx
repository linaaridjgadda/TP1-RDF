import React from 'react';
import {
  Sliders,
  Layers,
  BarChart3,
  FileText,
  Code2,
  ArrowRight,
  Sparkles,
  Zap,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { LoadedImage, SAMPLE_BENCHMARKS } from '../utils/imageUtils';
import { SegmentationResult } from '../algorithms/quadtree';
import { NavTab } from './Header';

interface DashboardViewProps {
  image: LoadedImage | null;
  result: SegmentationResult | null;
  onSelectTab: (tab: NavTab) => void;
  onLoadBenchmark: (benchmark: typeof SAMPLE_BENCHMARKS[0]) => void;
  isProcessing: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  image,
  result,
  onSelectTab,
  onLoadBenchmark,
  isProcessing,
}) => {
  return (
    <div className="space-y-6">
      {/* Hero Presentation Card */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 border border-slate-800 p-6 sm:p-8">
        <div className="max-w-3xl space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 font-semibold tracking-wider uppercase">
            <span>Laboratoire Virtuel de Vision par Ordinateur</span>
            <span>·</span>
            <span>TP1 Université</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold font-display text-slate-100 tracking-tight">
            Segmentation d'image par Quadtree (Divide and Merge)
          </h1>

          <p className="text-sm text-slate-400 leading-relaxed">
            Plateforme interactive complète de traitement d'images dédiée à l'étude des algorithmes de partitionnement récursif multi-échelles et de fusion connexe par structures d'ensembles disjoints (Union-Find).
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onSelectTab('segmentation')}
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition-all shadow-sm shadow-cyan-500/20 active:translate-y-0.5"
            >
              <span>Accéder à la segmentation</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onSelectTab('experiments')}
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors border border-slate-700"
            >
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              <span>Banc d'expériences (A, B, C, D)</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Telemetry Strip (if segmentation has been run) */}
      {result && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Feuilles initiales</span>
            <div className="text-xl font-bold font-mono text-cyan-400 tabular-nums mt-0.5">
              {result.divisionStats.leafCount}
            </div>
            <span className="text-[10px] text-slate-500">Arbre de division</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Profondeur Max</span>
            <div className="text-xl font-bold font-mono text-slate-200 tabular-nums mt-0.5">
              {result.divisionStats.maxDepth}
            </div>
            <span className="text-[10px] text-slate-500">Niveaux récursifs</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Régions finales</span>
            <div className="text-xl font-bold font-mono text-emerald-400 tabular-nums mt-0.5">
              {result.mergeStats.finalRegions}
            </div>
            <span className="text-[10px] text-slate-500">Après Union-Find</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Taux d'agrégation</span>
            <div className="text-xl font-bold font-mono text-emerald-400 tabular-nums mt-0.5">
              {result.mergeStats.eliminatedPercentage.toFixed(1)}%
            </div>
            <span className="text-[10px] text-slate-500">Feuilles fusionnées</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Fidélité PSNR</span>
            <div className="text-xl font-bold font-mono text-amber-400 tabular-nums mt-0.5">
              {isFinite(result.psnrMerged) ? `${result.psnrMerged.toFixed(2)} dB` : '∞'}
            </div>
            <span className="text-[10px] text-slate-500">Reconstruction image</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Temps d'exécution</span>
            <div className="text-xl font-bold font-mono text-cyan-300 tabular-nums mt-0.5">
              {result.totalTimeMs.toFixed(1)} ms
            </div>
            <span className="text-[10px] text-slate-500">Pipeline complet</span>
          </div>
        </div>
      )}

      {/* 4 Interactive Process Steps of the TP */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div
          onClick={() => onSelectTab('segmentation')}
          className="p-4 rounded-lg bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all space-y-2 group"
        >
          <div className="w-8 h-8 rounded bg-cyan-950/60 border border-cyan-800/60 flex items-center justify-center text-cyan-400 text-xs font-mono font-bold">
            01
          </div>
          <h3 className="text-sm font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors">
            Division récursive
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Subdivision en quadrants dyadiques (NO, NE, SO, SE) selon le critère d'écart-type ou d'étendue et arrêt à <code className="text-cyan-400">min_size</code>.
          </p>
        </div>

        <div
          onClick={() => onSelectTab('segmentation')}
          className="p-4 rounded-lg bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all space-y-2 group"
        >
          <div className="w-8 h-8 rounded bg-cyan-950/60 border border-cyan-800/60 flex items-center justify-center text-cyan-400 text-xs font-mono font-bold">
            02
          </div>
          <h3 className="text-sm font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors">
            Fusion (Union-Find)
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Parcours des voisins adjacents (arêtes H et V), tri par différence de moyenne et fusion ordonnée pondérée par la superficie.
          </p>
        </div>

        <div
          onClick={() => onSelectTab('comparison')}
          className="p-4 rounded-lg bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all space-y-2 group"
        >
          <div className="w-8 h-8 rounded bg-cyan-950/60 border border-cyan-800/60 flex items-center justify-center text-cyan-400 text-xs font-mono font-bold">
            03
          </div>
          <h3 className="text-sm font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors">
            Seuillage d'Otsu
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Comparaison avec la binarisation globale maximisant la variance inter-classe sans contrainte spatiale.
          </p>
        </div>

        <div
          onClick={() => onSelectTab('report')}
          className="p-4 rounded-lg bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all space-y-2 group"
        >
          <div className="w-8 h-8 rounded bg-cyan-950/60 border border-cyan-800/60 flex items-center justify-center text-cyan-400 text-xs font-mono font-bold">
            04
          </div>
          <h3 className="text-sm font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors">
            Rapport & Métriques
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Rapport complet avec réponses éditables aux 6 questions théoriques, figures, et export imprimable.
          </p>
        </div>
      </div>

      {/* Quick Launch Benchmark Image Selector */}
      <div className="p-4 rounded-lg bg-slate-900/90 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-semibold text-slate-100">
              Chargement direct d'une image de référence académique
            </h2>
          </div>
          <span className="text-xs text-slate-500">1-clic pour charger et tester</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {SAMPLE_BENCHMARKS.map((b) => (
            <div
              key={b.id}
              onClick={() => {
                onLoadBenchmark(b);
                onSelectTab('segmentation');
              }}
              className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-cyan-500/50 cursor-pointer transition-all group flex flex-col justify-between space-y-2"
            >
              <div className="aspect-square w-full rounded overflow-hidden bg-slate-900 border border-slate-800">
                <img
                  src={b.url}
                  alt={b.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors">
                  {b.title}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                  {b.description}
                </p>
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-cyan-400 pt-1 border-t border-slate-800/60">
                <span>Charger dans le lab</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
