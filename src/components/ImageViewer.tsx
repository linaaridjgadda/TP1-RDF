import React, { useRef, useEffect, useState } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Download,
  Eye,
  SlidersHorizontal,
  Palette,
  Crosshair,
} from 'lucide-react';
import { LoadedImage, renderGrayscaleToCanvas, renderRgbaToCanvas, downloadCanvasAsPng } from '../utils/imageUtils';
import { SegmentationResult } from '../algorithms/quadtree';

export type ViewMode = 'original' | 'boundaries' | 'mean' | 'merged' | 'regions_color' | 'split_compare';

interface ImageViewerProps {
  image: LoadedImage | null;
  result: SegmentationResult | null;
  viewMode: ViewMode;
  onChangeViewMode: (mode: ViewMode) => void;
  showBoundariesOverlay: boolean;
  onToggleBoundariesOverlay: () => void;
  boundaryColor: string;
  onChangeBoundaryColor: (color: string) => void;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({
  image,
  result,
  viewMode,
  onChangeViewMode,
  showBoundariesOverlay,
  onToggleBoundariesOverlay,
  boundaryColor,
  onChangeBoundaryColor,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const compareCanvasRef = useRef<HTMLCanvasElement>(null);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [hoverCoord, setHoverCoord] = useState<{ x: number; y: number; val: number } | null>(null);
  const [splitPos, setSplitPos] = useState(50); // Pourcentage du slider split compare

  // Reset zoom & pan when image changes
  useEffect(() => {
    if (image) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }
  }, [image?.name]);

  // Redessiner le canvas principal selon le mode sélectionné
  useEffect(() => {
    if (!image || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const w = image.width;
    const h = image.height;

    if (viewMode === 'original') {
      renderGrayscaleToCanvas(canvas, image.grayscale, w, h);
    } else if (viewMode === 'boundaries') {
      // Image originale avec les bordures du quadtree
      const leavesToDraw = result?.leaves || [];
      renderGrayscaleToCanvas(canvas, image.grayscale, w, h, {
        drawLeaves: leavesToDraw,
        borderColor: boundaryColor,
        borderWidth: 1,
      });
    } else if (viewMode === 'mean') {
      // Image moyenne après division
      const data = result ? result.meanImage : image.grayscale;
      const leavesToDraw = showBoundariesOverlay && result ? result.leaves : undefined;
      renderGrayscaleToCanvas(canvas, data, w, h, {
        drawLeaves: leavesToDraw,
        borderColor: boundaryColor,
        borderWidth: 1,
      });
    } else if (viewMode === 'merged') {
      // Image moyenne après fusion des régions
      const data = result ? result.mergedMeanImage : image.grayscale;
      const leavesToDraw = showBoundariesOverlay && result ? result.leaves : undefined;
      renderGrayscaleToCanvas(canvas, data, w, h, {
        drawLeaves: leavesToDraw,
        borderColor: boundaryColor,
        borderWidth: 1,
      });
    } else if (viewMode === 'regions_color') {
      // Carte colorée des régions fusionnées
      if (result) {
        renderRgbaToCanvas(canvas, result.regionColorMap, w, h);
      } else {
        renderGrayscaleToCanvas(canvas, image.grayscale, w, h);
      }
    } else if (viewMode === 'split_compare') {
      // Rendu de l'original sur le canvas principal
      renderGrayscaleToCanvas(canvas, image.grayscale, w, h);
      // Et le résultat fusionné ou moyen sur le second canvas
      if (compareCanvasRef.current && result) {
        renderGrayscaleToCanvas(compareCanvasRef.current, result.mergedMeanImage, w, h);
      }
    }
  }, [image, result, viewMode, showBoundariesOverlay, boundaryColor]);

  // Gestion du zoom à la molette
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 0.85;
    setZoom((prev) => Math.min(8, Math.max(0.2, prev * factor)));
  };

  // Gestion du pan (glissement)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsPanning(true);
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - startPan.x, y: e.clientY - startPan.y });
    }

    if (canvasRef.current && image) {
      const rect = canvasRef.current.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;
      const scaleX = image.width / rect.width;
      const scaleY = image.height / rect.height;
      const imgX = Math.floor(clientX * scaleX);
      const imgY = Math.floor(clientY * scaleY);

      if (imgX >= 0 && imgX < image.width && imgY >= 0 && imgY < image.height) {
        const val = image.grayscale[imgY * image.width + imgX];
        setHoverCoord({ x: imgX, y: imgY, val: Math.round(val) });
      } else {
        setHoverCoord(null);
      }
    }
  };

  const handleMouseUp = () => setIsPanning(false);

  const resetZoomAndFit = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleDownloadCurrentView = () => {
    if (!canvasRef.current || !image) return;
    const baseName = image.name.replace(/\.[^/.]+$/, '');
    const filename = `${baseName}_${viewMode}_quadtree.png`;
    downloadCanvasAsPng(canvasRef.current, filename);
  };

  if (!image) {
    return (
      <div className="h-[460px] lg:h-[540px] bg-slate-900/60 rounded-lg border border-slate-800 flex flex-col items-center justify-center p-6 text-center text-slate-500">
        <Eye className="w-12 h-12 mb-3 text-slate-600 stroke-[1.5]" />
        <p className="text-sm font-medium text-slate-400">Aucune image chargée dans le visualiseur</p>
        <p className="text-xs text-slate-500 mt-1">Sélectionnez une image de test ou importez un fichier pour inspecter la segmentation.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/90 rounded-lg border border-slate-800 flex flex-col overflow-hidden">
      {/* Visualizer Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-950/70 border-b border-slate-800/80">
        {/* View Mode Segmented Tabs */}
        <div className="flex items-center gap-1 p-0.5 bg-slate-900 rounded border border-slate-800/80 overflow-x-auto max-w-full">
          <button
            onClick={() => onChangeViewMode('original')}
            className={`px-2.5 py-1 text-xs rounded font-medium transition-colors whitespace-nowrap shrink-0 ${
              viewMode === 'original' ? 'bg-slate-800 text-cyan-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Originale
          </button>
          <button
            onClick={() => onChangeViewMode('boundaries')}
            className={`px-2.5 py-1 text-xs rounded font-medium transition-colors whitespace-nowrap shrink-0 ${
              viewMode === 'boundaries' ? 'bg-slate-800 text-cyan-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Bords des régions
          </button>
          <button
            onClick={() => onChangeViewMode('mean')}
            className={`px-2.5 py-1 text-xs rounded font-medium transition-colors whitespace-nowrap shrink-0 ${
              viewMode === 'mean' ? 'bg-slate-800 text-cyan-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Image moyenne
          </button>
          <button
            onClick={() => onChangeViewMode('merged')}
            className={`px-2.5 py-1 text-xs rounded font-medium transition-colors whitespace-nowrap shrink-0 ${
              viewMode === 'merged' ? 'bg-slate-800 text-cyan-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Après fusion
          </button>
          <button
            onClick={() => onChangeViewMode('regions_color')}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded font-medium transition-colors whitespace-nowrap shrink-0 ${
              viewMode === 'regions_color' ? 'bg-slate-800 text-cyan-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Visualisation pseudo-couleur des régions après fusion"
          >
            <Palette className="w-3 h-3 text-cyan-400" />
            Labels colorés
          </button>
          <button
            onClick={() => onChangeViewMode('split_compare')}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded font-medium transition-colors whitespace-nowrap shrink-0 ${
              viewMode === 'split_compare' ? 'bg-slate-800 text-cyan-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Curseur interactif Avant / Après"
          >
            <SlidersHorizontal className="w-3 h-3 text-cyan-400" />
            Avant / Après
          </button>
        </div>

        {/* View Actions & Controls */}
        <div className="flex items-center gap-1.5 text-xs text-slate-300">
          {/* Overlay Toggle */}
          {(viewMode === 'mean' || viewMode === 'merged') && (
            <button
              onClick={onToggleBoundariesOverlay}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs border ${
                showBoundariesOverlay
                  ? 'bg-cyan-950/60 border-cyan-700 text-cyan-300'
                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
              title="Superposer la grille des feuilles quadtree"
            >
              <Eye className="w-3 h-3" />
              <span>Grille</span>
            </button>
          )}

          {/* Color boundary selector */}
          {(viewMode === 'boundaries' || showBoundariesOverlay) && (
            <div className="flex items-center gap-1 px-1.5 py-1 bg-slate-900 rounded border border-slate-800">
              <span className="text-[10px] text-slate-400">Ligne:</span>
              <button
                type="button"
                onClick={() => onChangeBoundaryColor('rgba(6, 182, 212, 0.85)')}
                className={`w-3.5 h-3.5 rounded-full bg-cyan-400 ${boundaryColor.includes('182') ? 'ring-2 ring-white' : ''}`}
                title="Cyan laser"
              />
              <button
                type="button"
                onClick={() => onChangeBoundaryColor('rgba(245, 158, 11, 0.9)')}
                className={`w-3.5 h-3.5 rounded-full bg-amber-500 ${boundaryColor.includes('158') ? 'ring-2 ring-white' : ''}`}
                title="Ambre télémétrie"
              />
              <button
                type="button"
                onClick={() => onChangeBoundaryColor('rgba(239, 68, 68, 0.9)')}
                className={`w-3.5 h-3.5 rounded-full bg-rose-500 ${boundaryColor.includes('68') ? 'ring-2 ring-white' : ''}`}
                title="Rouge contraste"
              />
            </div>
          )}

          {/* Zoom controls */}
          <div className="flex items-center gap-0.5 bg-slate-900 rounded border border-slate-800 p-0.5">
            <button
              onClick={() => setZoom((z) => Math.max(0.2, z * 0.8))}
              className="p-1 hover:text-white rounded"
              title="Zoom arrière (-)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-[11px] px-1 text-slate-400 min-w-[42px] text-center tabular-nums">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(8, z * 1.25))}
              className="p-1 hover:text-white rounded"
              title="Zoom avant (+)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={resetZoomAndFit}
              className="p-1 hover:text-white rounded text-slate-400 hover:text-cyan-400"
              title="Ajuster (100%)"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Download button for current view */}
          <button
            onClick={handleDownloadCurrentView}
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 transition-colors"
            title="Télécharger cette vue en PNG haute résolution"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Exporter vue</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Stage with Canvas */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          setIsPanning(false);
          setHoverCoord(null);
        }}
        className="relative h-[480px] lg:h-[580px] w-full overflow-hidden bg-slate-950 flex items-center justify-center cursor-crosshair select-none"
      >
        {/* Subtle coordinate grid background */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(#38bdf8 1px, transparent 1px), linear-gradient(90deg, #38bdf8 1px, transparent 1px)`,
            backgroundSize: '32px 32px',
          }}
        />

        {/* Viewport Transform Group */}
        <div
          className="relative transition-transform duration-75 ease-out shadow-2xl rounded"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
          }}
        >
          {/* Main Canvas */}
          <canvas
            ref={canvasRef}
            className="block max-w-none rounded border border-slate-800 shadow-lg"
          />

          {/* Split comparison overlay if in split_compare mode */}
          {viewMode === 'split_compare' && (
            <div
              className="absolute inset-0 overflow-hidden pointer-events-none rounded border-r-2 border-cyan-400 shadow-xl"
              style={{ width: `${splitPos}%` }}
            >
              <canvas
                ref={compareCanvasRef}
                className="block max-w-none"
              />
              <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-slate-950/80 text-[10px] font-mono text-cyan-400 border border-slate-700">
                Originale
              </span>
            </div>
          )}

          {viewMode === 'split_compare' && (
            <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-slate-950/80 text-[10px] font-mono text-emerald-400 border border-slate-700 pointer-events-none">
              Après fusion
            </span>
          )}
        </div>

        {/* Split slider control when in split mode */}
        {viewMode === 'split_compare' && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 bg-slate-900/90 px-4 py-2 rounded-full border border-slate-700 shadow-lg backdrop-blur">
            <span className="text-[11px] font-mono text-cyan-400">Originale</span>
            <input
              type="range"
              min="0"
              max="100"
              value={splitPos}
              onChange={(e) => setSplitPos(Number(e.target.value))}
              className="w-36 accent-cyan-400 h-1.5 bg-slate-800 rounded cursor-pointer"
            />
            <span className="text-[11px] font-mono text-emerald-400">Fusionnée</span>
          </div>
        )}

        {/* Live Coordinate & Luminance HUD Probe */}
        {hoverCoord && (
          <div className="absolute top-3 left-3 pointer-events-none bg-slate-900/95 border border-slate-700 px-2.5 py-1.5 rounded font-mono text-[11px] text-slate-300 shadow-md flex items-center gap-2.5 backdrop-blur">
            <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
            <span className="tabular-nums">
              X: <strong className="text-white">{hoverCoord.x}</strong> Y: <strong className="text-white">{hoverCoord.y}</strong>
            </span>
            <span className="text-slate-600" aria-hidden="true">|</span>
            <span className="tabular-nums">
              Intensité: <strong className="text-cyan-300">{hoverCoord.val}</strong> / 255
            </span>
          </div>
        )}

        {/* Bottom Dimension & Zoom Status */}
        <div className="absolute bottom-3 right-3 pointer-events-none bg-slate-950/80 border border-slate-800 px-2 py-1 rounded font-mono text-[10px] text-slate-400 flex items-center gap-2">
          <span>{image.width} × {image.height} px</span>
          <span className="text-slate-600">·</span>
          <span>Zoom: {Math.round(zoom * 100)}%</span>
        </div>
      </div>
    </div>
  );
};
