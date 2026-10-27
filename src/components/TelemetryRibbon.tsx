import React from 'react';
import { LoadedImage } from '../utils/imageUtils';
import { SegmentationResult } from '../algorithms/quadtree';

interface TelemetryRibbonProps {
  image: LoadedImage | null;
  result: SegmentationResult | null;
  isProcessing: boolean;
}

export const TelemetryRibbon: React.FC<TelemetryRibbonProps> = ({
  image,
  result,
  isProcessing,
}) => {
  return (
    <div className="bg-slate-900/90 border-b border-slate-800/80 px-4 lg:px-8 py-2 text-xs text-slate-400">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-y-1.5 gap-x-4">
        {/* Left Telemetry Zone */}
        <div className="flex items-center gap-2 font-mono flex-wrap">
          <span className="text-slate-300 font-semibold uppercase tracking-wider text-[11px]">
            Statut du système :
          </span>
          <span className={isProcessing ? 'text-amber-400 font-medium' : image ? 'text-emerald-400 font-medium' : 'text-slate-500'}>
            {isProcessing ? 'En cours de calcul...' : image ? 'Image chargée' : 'En attente d\'image'}
          </span>

          {image && (
            <>
              <span className="text-slate-600" aria-hidden="true">·</span>
              <span className="text-slate-300 truncate max-w-[180px] sm:max-w-[240px]" title={image.name}>
                {image.name}
              </span>
              <span className="text-slate-600" aria-hidden="true">·</span>
              <span className="text-cyan-400 font-medium tabular-nums">
                {image.width} × {image.height} px
              </span>
              <span className="text-slate-600" aria-hidden="true">·</span>
              <span className="tabular-nums">
                {(image.grayscale.length / 1000).toFixed(1)} kpx
              </span>
            </>
          )}
        </div>

        {/* Right Telemetry Zone: Computation metrics if available */}
        {result && (
          <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400 flex-wrap">
            <span>
              Feuilles : <strong className="text-cyan-300 tabular-nums">{result.divisionStats.leafCount}</strong>
            </span>
            <span className="text-slate-600" aria-hidden="true">·</span>
            <span>
              Régions finales : <strong className="text-emerald-400 tabular-nums">{result.mergeStats.finalRegions}</strong>
            </span>
            <span className="text-slate-600" aria-hidden="true">·</span>
            <span>
              PSNR : <strong className="text-slate-200 tabular-nums">{isFinite(result.psnrMerged) ? `${result.psnrMerged.toFixed(2)} dB` : '∞'}</strong>
            </span>
            <span className="text-slate-600" aria-hidden="true">·</span>
            <span>
              Temps : <strong className="text-cyan-300 tabular-nums">{result.totalTimeMs.toFixed(1)} ms</strong>
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
