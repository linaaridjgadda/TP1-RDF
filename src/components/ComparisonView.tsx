import React, { useRef, useEffect, useState } from 'react';
import { Layers, Sliders, Info, Download, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { LoadedImage, renderGrayscaleToCanvas, renderBinaryToCanvas, downloadCanvasAsPng } from '../utils/imageUtils';
import { SegmentationResult, OtsuResult, calculate_otsu } from '../algorithms/quadtree';

interface ComparisonViewProps {
  image: LoadedImage | null;
  result: SegmentationResult | null;
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({
  image,
  result,
}) => {
  const [otsu, setOtsu] = useState<OtsuResult | null>(null);
  const [zoom, setZoom] = useState(1);

  const canvasOrigRef = useRef<HTMLCanvasElement>(null);
  const canvasMeanRef = useRef<HTMLCanvasElement>(null);
  const canvasMergedRef = useRef<HTMLCanvasElement>(null);
  const canvasOtsuRef = useRef<HTMLCanvasElement>(null);

  // Calcul du seuil d'Otsu lorsque l'image change
  useEffect(() => {
    if (!image) {
      setOtsu(null);
      return;
    }
    const res = calculate_otsu(image.grayscale, image.width, image.height);
    setOtsu(res);
  }, [image?.name]);

  // Rendu des 4 Canvas synchronisés
  useEffect(() => {
    if (!image) return;
    const w = image.width;
    const h = image.height;

    if (canvasOrigRef.current) {
      renderGrayscaleToCanvas(canvasOrigRef.current, image.grayscale, w, h);
    }

    if (canvasMeanRef.current) {
      const meanData = result ? result.meanImage : image.grayscale;
      renderGrayscaleToCanvas(canvasMeanRef.current, meanData, w, h);
    }

    if (canvasMergedRef.current) {
      const mergedData = result ? result.mergedMeanImage : image.grayscale;
      renderGrayscaleToCanvas(canvasMergedRef.current, mergedData, w, h);
    }

    if (canvasOtsuRef.current && otsu) {
      renderBinaryToCanvas(canvasOtsuRef.current, otsu.binaryImage, w, h);
    }
  }, [image, result, otsu]);

  if (!image) {
    return (
      <div className="p-8 text-center text-slate-500 bg-slate-900/60 rounded-lg border border-slate-800">
        <Layers className="w-12 h-12 mx-auto mb-3 text-slate-600" />
        <p className="text-sm font-medium text-slate-400">Aucune image chargée pour la comparaison</p>
        <p className="text-xs text-slate-500 mt-1">Veuillez charger une image dans la section Segmentation.</p>
      </div>
    );
  }

  // Calcul de la hauteur maximale pour le tracé de l'histogramme
  const maxHist = otsu ? Math.max(...otsu.histogram) : 1;

  return (
    <div className="space-y-6">
      {/* Header and Context */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-lg bg-slate-900/90 border border-slate-800">
        <div>
          <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            Comparaison multi-vues : Quadtree vs Seuillage d'Otsu
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Analyse comparative synchrone des représentations continues, partitionnées et binaires.
          </p>
        </div>

        {/* Global zoom control for the 4 synchronized panels */}
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <span className="text-slate-400 font-mono">Zoom synchronisé :</span>
          <div className="flex items-center bg-slate-950 rounded border border-slate-800 p-0.5">
            <button
              onClick={() => setZoom((z) => Math.max(0.4, z * 0.85))}
              className="p-1 hover:text-white"
              title="Zoom arrière"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-[11px] px-1 text-cyan-400 min-w-[44px] text-center tabular-nums">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(3, z * 1.15))}
              className="p-1 hover:text-white"
              title="Zoom avant"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom(1)}
              className="p-1 hover:text-white text-slate-400"
              title="Réinitialiser (100%)"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Synchronized 4-Panel Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Panel 1: Image originale */}
        <div className="bg-slate-900/90 rounded-lg border border-slate-800 p-3 flex flex-col">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs">
            <span className="font-semibold text-slate-200">1. Image originale (Niveaux de gris)</span>
            <button
              onClick={() => canvasOrigRef.current && downloadCanvasAsPng(canvasOrigRef.current, `${image.name}_original.png`)}
              className="text-slate-400 hover:text-cyan-400 p-1"
              title="Télécharger l'originale"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="h-[280px] overflow-auto flex items-center justify-center bg-slate-950 rounded p-2">
            <div style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}>
              <canvas ref={canvasOrigRef} className="rounded shadow max-w-none" />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-mono">
            {image.width} × {image.height} px · Grayscale ITU-R BT.601 [0, 255]
          </p>
        </div>

        {/* Panel 2: Image moyenne (Division seule) */}
        <div className="bg-slate-900/90 rounded-lg border border-slate-800 p-3 flex flex-col">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs">
            <span className="font-semibold text-cyan-300">2. Image moyenne (Division récursive)</span>
            <button
              onClick={() => canvasMeanRef.current && downloadCanvasAsPng(canvasMeanRef.current, `${image.name}_quadtree_mean.png`)}
              className="text-slate-400 hover:text-cyan-400 p-1"
              title="Télécharger l'image moyenne"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="h-[280px] overflow-auto flex items-center justify-center bg-slate-950 rounded p-2">
            <div style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}>
              <canvas ref={canvasMeanRef} className="rounded shadow max-w-none" />
            </div>
          </div>
          <div className="flex justify-between items-center text-[11px] text-slate-400 mt-2 font-mono">
            <span>Feuilles : <strong className="text-cyan-400">{result?.divisionStats.leafCount ?? '—'}</strong></span>
            <span>PSNR : <strong className="text-slate-300">{result ? `${result.psnrDivision.toFixed(2)} dB` : '—'}</strong></span>
          </div>
        </div>

        {/* Panel 3: Après fusion (Union-Find) */}
        <div className="bg-slate-900/90 rounded-lg border border-slate-800 p-3 flex flex-col">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs">
            <span className="font-semibold text-emerald-400">3. Après fusion des régions (Merge Union-Find)</span>
            <button
              onClick={() => canvasMergedRef.current && downloadCanvasAsPng(canvasMergedRef.current, `${image.name}_quadtree_merged.png`)}
              className="text-slate-400 hover:text-cyan-400 p-1"
              title="Télécharger l'image fusionnée"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="h-[280px] overflow-auto flex items-center justify-center bg-slate-950 rounded p-2">
            <div style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}>
              <canvas ref={canvasMergedRef} className="rounded shadow max-w-none" />
            </div>
          </div>
          <div className="flex justify-between items-center text-[11px] text-slate-400 mt-2 font-mono">
            <span>Régions finales : <strong className="text-emerald-400">{result?.mergeStats.finalRegions ?? '—'}</strong></span>
            <span>PSNR : <strong className="text-slate-300">{result ? `${result.psnrMerged.toFixed(2)} dB` : '—'}</strong></span>
          </div>
        </div>

        {/* Panel 4: Seuillage d'Otsu */}
        <div className="bg-slate-900/90 rounded-lg border border-slate-800 p-3 flex flex-col">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs">
            <span className="font-semibold text-amber-400">4. Seuillage d'Otsu (Binarisation globale)</span>
            <button
              onClick={() => canvasOtsuRef.current && downloadCanvasAsPng(canvasOtsuRef.current, `${image.name}_otsu_binary.png`)}
              className="text-slate-400 hover:text-cyan-400 p-1"
              title="Télécharger l'image Otsu"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="h-[280px] overflow-auto flex items-center justify-center bg-slate-950 rounded p-2">
            <div style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}>
              <canvas ref={canvasOtsuRef} className="rounded shadow max-w-none" />
            </div>
          </div>
          <div className="flex justify-between items-center text-[11px] text-slate-400 mt-2 font-mono">
            <span>Seuil calculé T* : <strong className="text-amber-400">{otsu?.threshold ?? '—'} / 255</strong></span>
            <span>Classes : <strong>2 (0 ou 255)</strong></span>
          </div>
        </div>
      </div>

      {/* Otsu Histogram and Theoretical Comparison Discussion */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Histogram with Otsu Threshold line */}
        <div className="bg-slate-900/90 rounded-lg border border-slate-800 p-4 lg:col-span-1 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-200">
              Histogramme & Seuil d'Otsu
            </h3>
            {otsu && (
              <span className="text-[11px] font-mono text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40">
                T* = {otsu.threshold}
              </span>
            )}
          </div>

          {otsu && (
            <div className="space-y-2">
              <div className="relative h-28 w-full bg-slate-950 rounded p-1 flex items-end border border-slate-800">
                {/* SVG histogram */}
                <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 256 100">
                  {otsu.histogram.map((count, i) => {
                    const barHeight = (count / maxHist) * 95;
                    return (
                      <rect
                        key={i}
                        x={i}
                        y={100 - barHeight}
                        width="1"
                        height={barHeight}
                        fill={i < otsu.threshold ? '#06b6d4' : '#f59e0b'}
                        opacity="0.8"
                      />
                    );
                  })}
                  {/* Seuil optimal vertical line */}
                  <line
                    x1={otsu.threshold}
                    y1="0"
                    x2={otsu.threshold}
                    y2="100"
                    stroke="#ef4444"
                    strokeWidth="1.5"
                    strokeDasharray="2,2"
                  />
                </svg>

                {/* Marker label */}
                <div
                  className="absolute top-1 pointer-events-none -translate-x-1/2 text-[9px] font-mono text-rose-400 bg-slate-950/90 px-1 rounded border border-rose-800/60"
                  style={{ left: `${(otsu.threshold / 256) * 100}%` }}
                >
                  T*={otsu.threshold}
                </div>
              </div>

              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0 (Noir)</span>
                <span className="text-cyan-400">Classe C0 (&lt; T*)</span>
                <span className="text-amber-400">Classe C1 (≥ T*)</span>
                <span>255 (Blanc)</span>
              </div>
            </div>
          )}
        </div>

        {/* Scientific Analysis in French (Strict requirement) */}
        <div className="bg-slate-900/90 rounded-lg border border-slate-800 p-4 lg:col-span-2 space-y-3 text-xs leading-relaxed">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-cyan-400" />
            <h3 className="font-semibold text-slate-200">
              Analyse comparative théorique (Question Q5 du TP)
            </h3>
          </div>

          <div className="space-y-2 text-slate-300">
            <p>
              <strong>1. Seuillage global d'Otsu :</strong> L'algorithme d'Otsu opère uniquement sur l'espace d'intensité globale (l'histogramme à 256 niveaux), sans aucune considération spatiale de contiguïté. Il recherche le seuil scalaire <code className="text-amber-400 font-mono">T*</code> qui maximise la variance inter-classe <code className="text-amber-400 font-mono">σ²_B(t) = ω₀(t)ω₁(t)(μ₀ - μ₁)²</code>. Le résultat est une séparation strictement binaire en deux ensembles de pixels disjoints (souvent interprétés comme avant-plan et arrière-plan).
            </p>

            <p>
              <strong>2. Segmentation par Quadtree (Divide & Merge) :</strong> À l'inverse, l'approche quadtree est une segmentation topologique et spatiale. Elle partitionne l'image en blocs multi-échelles adaptés à la variance locale. La phase de division préserve la topologie locale, tandis que la phase de fusion (Union-Find) regroupe les régions spatialement adjacentes dont les moyennes sont proches (<code className="text-cyan-400 font-mono">|μ_A - μ_B| ≤ T_m</code>).
            </p>

            <div className="p-2.5 rounded bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400">
              <strong className="text-slate-200">Différence clé :</strong> Otsu ignore complètement la connectivité spatiale (deux pixels isolés à l'opposé de l'image de même intensité reçoivent le même label binaire). Le quadtree produit quant à lui des composantes connexes distinctes de formes et d'intensités continues variées, adaptées aux contours naturels des objets.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
