import React, { useRef, useEffect, useState } from 'react';
import { Layers, Download, CheckCircle2, ArrowRight } from 'lucide-react';
import { LoadedImage, renderGrayscaleToCanvas, renderBinaryToCanvas, downloadCanvasAsPng } from '../utils/imageUtils';
import { SegmentationResult, OtsuResult, calculate_otsu } from '../algorithms/quadtree';

interface SimpleOtsuCompareProps {
  image: LoadedImage | null;
  result: SegmentationResult | null;
}

export const SimpleOtsuCompare: React.FC<SimpleOtsuCompareProps> = ({
  image,
  result,
}) => {
  const [otsu, setOtsu] = useState<OtsuResult | null>(null);

  const canvasQuadtreeRef = useRef<HTMLCanvasElement>(null);
  const canvasOtsuRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!image) return;
    const res = calculate_otsu(image.grayscale, image.width, image.height);
    setOtsu(res);
  }, [image?.name]);

  useEffect(() => {
    if (!image) return;
    const w = image.width;
    const h = image.height;

    if (canvasQuadtreeRef.current && result) {
      renderGrayscaleToCanvas(canvasQuadtreeRef.current, result.mergedMeanImage, w, h);
    }
    if (canvasOtsuRef.current && otsu) {
      renderBinaryToCanvas(canvasOtsuRef.current, otsu.binaryImage, w, h);
    }
  }, [image, result, otsu]);

  if (!image) {
    return (
      <div className="p-8 text-center text-slate-500 bg-slate-900 rounded-xl border border-slate-800">
        <p className="text-sm">Veuillez charger une image pour afficher la comparaison.</p>
      </div>
    );
  }

  const maxHist = otsu ? Math.max(...otsu.histogram) : 1;

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 space-y-2">
        <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <Layers className="w-5 h-5 text-cyan-400" />
          Comprendre la différence : Quadtree vs Otsu
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          C'est la question fondamentale du TP5 : que fait chaque méthode et pourquoi leurs résultats sont-ils si différents ?
        </p>
      </div>

      {/* Les deux images face-à-face */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Méthode 1 : Quadtree */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div>
              <span className="text-xs font-mono text-cyan-400 uppercase font-bold">Méthode spatiale</span>
              <h3 className="text-sm font-bold text-slate-100">Quadtree (Divide & Merge)</h3>
            </div>
            <button
              onClick={() => canvasQuadtreeRef.current && downloadCanvasAsPng(canvasQuadtreeRef.current, 'quadtree_fusion.png')}
              className="p-1.5 text-slate-400 hover:text-cyan-400 rounded bg-slate-800"
              title="Télécharger l'image"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>

          <div className="h-64 sm:h-72 bg-slate-950 rounded-lg overflow-hidden flex items-center justify-center p-2 border border-slate-800">
            <canvas ref={canvasQuadtreeRef} className="max-h-full max-w-full rounded object-contain" />
          </div>

          <div className="space-y-1.5 text-xs text-slate-300 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
            <div className="flex items-center gap-1.5 text-cyan-400 font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Régions et formes préservées</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Découpe l'espace géométrique en blocs puis recolle les voisins de couleur proche.
              On obtient <strong className="text-cyan-300 font-mono">{result?.mergeStats.finalRegions ?? 'plusieurs'} régions</strong> avec différentes intensités de gris.
            </p>
          </div>
        </div>

        {/* Méthode 2 : Otsu */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div>
              <span className="text-xs font-mono text-amber-400 uppercase font-bold">Seuillage binaire</span>
              <h3 className="text-sm font-bold text-slate-100">Seuillage d'Otsu (Seuil = {otsu?.threshold ?? '—'})</h3>
            </div>
            <button
              onClick={() => canvasOtsuRef.current && downloadCanvasAsPng(canvasOtsuRef.current, 'otsu_binaire.png')}
              className="p-1.5 text-slate-400 hover:text-cyan-400 rounded bg-slate-800"
              title="Télécharger l'image"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>

          <div className="h-64 sm:h-72 bg-slate-950 rounded-lg overflow-hidden flex items-center justify-center p-2 border border-slate-800">
            <canvas ref={canvasOtsuRef} className="max-h-full max-w-full rounded object-contain" />
          </div>

          <div className="space-y-1.5 text-xs text-slate-300 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
            <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Strictement 2 couleurs : Noir ou Blanc</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Calcule un seuil global unique (ici <strong className="text-amber-400 font-mono">T* = {otsu?.threshold}</strong>).
              Tous les pixels en-dessous deviennent Noirs (0), tous ceux au-dessus deviennent Blancs (255). Aucune notion de voisinage ou de forme.
            </p>
          </div>
        </div>
      </div>

      {/* Résumé simple pour le TP */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
        <h3 className="text-sm font-bold text-slate-100">
          Ce qu'il faut retenir pour votre compte-rendu :
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-300">
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <strong className="text-cyan-400 block mb-1">Pourquoi le Quadtree est supérieur pour segmenter des objets ?</strong>
            Parce qu'il tient compte de la position spatiale des pixels. Deux objets de même couleur situés à deux endroits différents forment deux régions distinctes.
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <strong className="text-amber-400 block mb-1">Pourquoi Otsu ne peut pas séparer plusieurs objets de gris différents ?</strong>
            Parce qu'Otsu ne sait faire que du binaire (2 classes : avant-plan / arrière-plan) et ne regarde jamais où se trouvent les pixels dans l'image.
          </div>
        </div>
      </div>
    </div>
  );
};
