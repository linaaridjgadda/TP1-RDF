import React, { useState } from 'react';
import { Download, Sliders, Layers, Eye, CheckCircle2, Clock, GitMerge, TreePine } from 'lucide-react';
import { LoadedImage, downloadCanvasAsPng } from '../utils/imageUtils';
import { SegmentationResult, SegmentationParams } from '../algorithms/quadtree';
import { ImageUploader } from './ImageUploader';
import { ParameterPanel } from './ParameterPanel';
import { ImageViewer, ViewMode } from './ImageViewer';

interface SegmentationViewProps {
  image: LoadedImage | null;
  onImageLoaded: (img: LoadedImage) => void;
  result: SegmentationResult | null;
  params: SegmentationParams;
  onChangeParams: (newParams: SegmentationParams) => void;
  onResetDefaults: () => void;
  onExecute: () => void;
  isProcessing: boolean;
  isDirty: boolean;
  autoApply: boolean;
  onChangeAutoApply: (val: boolean) => void;
}

export const SegmentationView: React.FC<SegmentationViewProps> = ({
  image,
  onImageLoaded,
  result,
  params,
  onChangeParams,
  onResetDefaults,
  onExecute,
  isProcessing,
  isDirty,
  autoApply,
  onChangeAutoApply,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('boundaries');
  const [showBoundariesOverlay, setShowBoundariesOverlay] = useState(true);
  const [boundaryColor, setBoundaryColor] = useState('rgba(6, 182, 212, 0.85)');

  return (
    <div className="space-y-6">
      {/* 2-Column Responsive Split Console Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Image Selector & Parameter Controls (lg:col-span-4 or 5) */}
        <div className="lg:col-span-4 space-y-4">
          <ImageUploader
            currentImage={image}
            onImageLoaded={onImageLoaded}
            isProcessing={isProcessing}
          />

          <ParameterPanel
            params={params}
            onChangeParams={onChangeParams}
            onResetDefaults={onResetDefaults}
            onExecute={onExecute}
            isProcessing={isProcessing}
            isDirty={isDirty}
            autoApply={autoApply}
            onChangeAutoApply={onChangeAutoApply}
            hasImage={!!image}
          />
        </div>

        {/* Right Column: Main Image Viewport & Metrics (lg:col-span-8 or 7) */}
        <div className="lg:col-span-8 space-y-4">
          <ImageViewer
            image={image}
            result={result}
            viewMode={viewMode}
            onChangeViewMode={setViewMode}
            showBoundariesOverlay={showBoundariesOverlay}
            onToggleBoundariesOverlay={() => setShowBoundariesOverlay(!showBoundariesOverlay)}
            boundaryColor={boundaryColor}
            onChangeBoundaryColor={setBoundaryColor}
          />

          {/* Division & Merging Real Computation Statistics Cards */}
          {result && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Division Stats Card */}
              <div className="p-4 rounded-lg bg-slate-900/90 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <TreePine className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-xs font-semibold text-slate-100 uppercase tracking-wider font-mono">
                      Statistiques de Division
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono text-cyan-400 tabular-nums">
                    {result.divisionStats.divisionTimeMs.toFixed(1)} ms
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Nombre de feuilles :</span>
                    <strong className="text-sm text-cyan-300 tabular-nums">{result.divisionStats.leafCount}</strong>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Profondeur max :</span>
                    <strong className="text-sm text-slate-200 tabular-nums">{result.divisionStats.maxDepth}</strong>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Total nœuds créés :</span>
                    <span className="text-slate-300 tabular-nums">{result.divisionStats.nodeCount}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Taille min feuille :</span>
                    <span className="text-slate-300 tabular-nums">{result.divisionStats.minLeafSize} px</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/60 flex justify-between text-[11px] text-slate-400 font-mono">
                  <span>PSNR Division :</span>
                  <strong className="text-slate-200 tabular-nums">{result.psnrDivision.toFixed(2)} dB</strong>
                </div>
              </div>

              {/* Merge Stats Card */}
              <div className="p-4 rounded-lg bg-slate-900/90 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <GitMerge className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-xs font-semibold text-slate-100 uppercase tracking-wider font-mono">
                      Statistiques de Fusion
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400 tabular-nums">
                    {result.mergeStats.mergeTimeMs.toFixed(1)} ms
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Régions initiales :</span>
                    <span className="text-slate-300 tabular-nums">{result.mergeStats.initialLeaves}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Régions finales :</span>
                    <strong className="text-sm text-emerald-400 tabular-nums">{result.mergeStats.finalRegions}</strong>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Feuilles absorbées :</span>
                    <span className="text-slate-300 tabular-nums">{result.mergeStats.mergedCount}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Taux de réduction :</span>
                    <strong className="text-emerald-400 tabular-nums">{result.mergeStats.eliminatedPercentage.toFixed(1)}%</strong>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/60 flex justify-between text-[11px] text-slate-400 font-mono">
                  <span>PSNR Fusionné :</span>
                  <strong className="text-slate-200 tabular-nums">{result.psnrMerged.toFixed(2)} dB</strong>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
