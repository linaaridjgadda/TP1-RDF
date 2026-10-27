import React from 'react';
import { Sliders, RotateCcw, Play, CheckCircle2, Clock } from 'lucide-react';
import { SegmentationParams, HomogeneityCriterion } from '../algorithms/quadtree';

interface ParameterPanelProps {
  params: SegmentationParams;
  onChangeParams: (newParams: SegmentationParams) => void;
  onResetDefaults: () => void;
  onExecute: () => void;
  isProcessing: boolean;
  isDirty: boolean; // Les paramètres ont changé depuis la dernière exécution
  autoApply: boolean;
  onChangeAutoApply: (val: boolean) => void;
  hasImage: boolean;
}

export const ParameterPanel: React.FC<ParameterPanelProps> = ({
  params,
  onChangeParams,
  onResetDefaults,
  onExecute,
  isProcessing,
  isDirty,
  autoApply,
  onChangeAutoApply,
  hasImage,
}) => {
  const updateField = <K extends keyof SegmentationParams>(field: K, value: SegmentationParams[K]) => {
    onChangeParams({
      ...params,
      [field]: value,
    });
  };

  return (
    <div className="bg-slate-900/90 rounded-lg border border-slate-800 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-semibold text-slate-100">
            Paramètres de l'algorithme
          </h2>
        </div>

        <button
          onClick={onResetDefaults}
          disabled={isProcessing}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          title="Rétablir T=20, min_size=8, T_m=15, criterion=std"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Réinitialiser</span>
        </button>
      </div>

      {/* Dirty state indicator banner if user changed sliders without executing */}
      {isDirty && !autoApply && (
        <div className="flex items-center gap-2 px-3 py-2 rounded bg-amber-950/40 border border-amber-800/80 text-amber-300 text-xs">
          <Clock className="w-4 h-4 shrink-0 text-amber-400" />
          <span>
            Paramètres modifiés. Cliquez sur <strong>Lancer la segmentation</strong> pour recalculer les régions.
          </span>
        </div>
      )}

      {/* Parameters grid */}
      <div className="space-y-4 text-xs">
        {/* 1. Homogeneity Criterion */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="font-medium text-slate-300">
              Critère d'homogénéité
            </label>
            <span className="font-mono text-slate-400 text-[11px]">
              {params.criterion === 'std' ? 'std(bloc) ≤ T' : 'max - min ≤ T'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950/60 rounded border border-slate-800">
            <button
              type="button"
              onClick={() => updateField('criterion', 'std')}
              className={`py-1.5 px-3 rounded text-center transition-colors font-medium ${
                params.criterion === 'std'
                  ? 'bg-slate-800 text-cyan-400 shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Écart-type (std)
            </button>
            <button
              type="button"
              onClick={() => updateField('criterion', 'range')}
              className={`py-1.5 px-3 rounded text-center transition-colors font-medium ${
                params.criterion === 'range'
                  ? 'bg-slate-800 text-cyan-400 shadow-sm border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Étendue (range)
            </button>
          </div>
          <p className="text-[11px] text-slate-400">
            {params.criterion === 'std'
              ? "Mesure la dispersion des intensités autour de la moyenne du bloc."
              : "Mesure l'écart extrême absolu entre le pixel le plus clair et le plus sombre."}
          </p>
        </div>

        {/* 2. Seuil T (Division) */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label htmlFor="param-t" className="font-medium text-slate-300 flex items-center gap-1.5">
              <span>Seuil de division (T)</span>
            </label>
            <div className="flex items-center gap-1">
              <input
                id="param-t-num"
                type="number"
                min="0"
                max="100"
                step="1"
                value={params.T}
                onChange={(e) => updateField('T', Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                className="w-14 px-1.5 py-0.5 rounded bg-slate-950 border border-slate-700 text-center font-mono text-cyan-400 text-xs tabular-nums focus:outline-none focus:border-cyan-500"
              />
              <span className="text-slate-500 font-mono text-[10px]">/ 100</span>
            </div>
          </div>

          <input
            id="param-t"
            type="range"
            min="0"
            max="100"
            step="1"
            value={params.T}
            onChange={(e) => updateField('T', Number(e.target.value))}
            className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>0 (sur-segmentation)</span>
            <span>20 (défaut)</span>
            <span>100 (sous-segmentation)</span>
          </div>
        </div>

        {/* 3. Taille minimale (min_size) */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label htmlFor="param-minsize" className="font-medium text-slate-300">
              Taille minimale de bloc (min_size)
            </label>
            <div className="flex items-center gap-1">
              <input
                id="param-minsize-num"
                type="number"
                min="2"
                max="128"
                step="2"
                value={params.min_size}
                onChange={(e) => updateField('min_size', Math.max(2, Math.min(128, Number(e.target.value) || 2)))}
                className="w-14 px-1.5 py-0.5 rounded bg-slate-950 border border-slate-700 text-center font-mono text-cyan-400 text-xs tabular-nums focus:outline-none focus:border-cyan-500"
              />
              <span className="text-slate-500 font-mono text-[10px]">px</span>
            </div>
          </div>

          <input
            id="param-minsize"
            type="range"
            min="2"
            max="64"
            step="2"
            value={params.min_size}
            onChange={(e) => updateField('min_size', Number(e.target.value))}
            className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>2 px</span>
            <span>8 px (défaut)</span>
            <span>64 px</span>
          </div>
        </div>

        {/* 4. Seuil de fusion (T_m) */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label htmlFor="param-tm" className="font-medium text-slate-300">
              Seuil de fusion (T_m)
            </label>
            <div className="flex items-center gap-1">
              <input
                id="param-tm-num"
                type="number"
                min="0"
                max="100"
                step="1"
                value={params.T_m}
                onChange={(e) => updateField('T_m', Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                className="w-14 px-1.5 py-0.5 rounded bg-slate-950 border border-slate-700 text-center font-mono text-emerald-400 text-xs tabular-nums focus:outline-none focus:border-cyan-500"
              />
              <span className="text-slate-500 font-mono text-[10px]">/ 100</span>
            </div>
          </div>

          <input
            id="param-tm"
            type="range"
            min="0"
            max="100"
            step="1"
            value={params.T_m}
            onChange={(e) => updateField('T_m', Number(e.target.value))}
            className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>0 (aucune fusion)</span>
            <span>15 (défaut)</span>
            <span>100 (fusion globale)</span>
          </div>
        </div>

        {/* Auto apply option toggle */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoApply}
              onChange={(e) => onChangeAutoApply(e.target.checked)}
              className="accent-cyan-500 rounded bg-slate-950 border-slate-700"
            />
            <span className="text-xs text-slate-300">Appliquer automatiquement</span>
          </label>
          <span className="text-[10px] text-slate-500 italic">
            {autoApply ? "Exécution instantanée" : "Déclenchement manuel"}
          </span>
        </div>

        {/* Primary Action Button */}
        <button
          type="button"
          onClick={onExecute}
          disabled={!hasImage || isProcessing}
          className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-md font-medium text-xs transition-all shadow-sm ${
            !hasImage
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
              : isProcessing
              ? 'bg-cyan-600 text-white cursor-wait opacity-80'
              : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold shadow-cyan-500/20 active:translate-y-0.5'
          }`}
        >
          {isProcessing ? (
            <>
              <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              <span>Calcul en cours...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Lancer la segmentation</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
