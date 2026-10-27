import React, { useRef, useEffect, useState } from 'react';
import {
  Upload,
  Play,
  RotateCcw,
  Sparkles,
  Download,
  Info,
  Maximize2,
  ArrowRight,
  Palette,
  Check,
} from 'lucide-react';
import { LoadedImage, SAMPLE_BENCHMARKS, renderGrayscaleToCanvas, renderRgbaToCanvas, downloadCanvasAsPng } from '../utils/imageUtils';
import { SegmentationParams, SegmentationResult } from '../algorithms/quadtree';

interface SimpleWorkbenchProps {
  image: LoadedImage | null;
  onImageLoaded: (img: LoadedImage) => void;
  result: SegmentationResult | null;
  params: SegmentationParams;
  onChangeParams: (p: SegmentationParams) => void;
  onResetParams: () => void;
  onRunSegmentation: () => void;
  isProcessing: boolean;
  onSelectSample: (b: typeof SAMPLE_BENCHMARKS[0]) => void;
}

export const SimpleWorkbench: React.FC<SimpleWorkbenchProps> = ({
  image,
  onImageLoaded,
  result,
  params,
  onChangeParams,
  onResetParams,
  onRunSegmentation,
  isProcessing,
  onSelectSample,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showColorLabels, setShowColorLabels] = useState(false);
  const [activeZoomModal, setActiveZoomModal] = useState<string | null>(null);

  // Références Canvas pour les 4 étapes
  const canvasStep1 = useRef<HTMLCanvasElement>(null);
  const canvasStep2 = useRef<HTMLCanvasElement>(null);
  const canvasStep3 = useRef<HTMLCanvasElement>(null);
  const canvasStep4 = useRef<HTMLCanvasElement>(null);
  const canvasModalRef = useRef<HTMLCanvasElement>(null);

  // Rendu synchronisé des 4 étapes visuelles
  useEffect(() => {
    if (!image) return;
    const w = image.width;
    const h = image.height;

    // Étape 1 : Image originale
    if (canvasStep1.current) {
      renderGrayscaleToCanvas(canvasStep1.current, image.grayscale, w, h);
    }

    // Étape 2 : Découpage Quadtree (Originale + Bordures de feuilles)
    if (canvasStep2.current && result) {
      renderGrayscaleToCanvas(canvasStep2.current, image.grayscale, w, h, {
        drawLeaves: result.leaves,
        borderColor: 'rgba(6, 182, 212, 0.85)',
        borderWidth: 1,
      });
    }

    // Étape 3 : Image moyenne de la division
    if (canvasStep3.current && result) {
      renderGrayscaleToCanvas(canvasStep3.current, result.meanImage, w, h);
    }

    // Étape 4 : Après fusion (soit moyenne fusionnée, soit labels colorés)
    if (canvasStep4.current && result) {
      if (showColorLabels) {
        renderRgbaToCanvas(canvasStep4.current, result.regionColorMap, w, h);
      } else {
        renderGrayscaleToCanvas(canvasStep4.current, result.mergedMeanImage, w, h);
      }
    }
  }, [image, result, showColorLabels]);

  // Modal zoom
  useEffect(() => {
    if (!activeZoomModal || !image || !result || !canvasModalRef.current) return;
    const w = image.width;
    const h = image.height;
    if (activeZoomModal === 'step1') {
      renderGrayscaleToCanvas(canvasModalRef.current, image.grayscale, w, h);
    } else if (activeZoomModal === 'step2') {
      renderGrayscaleToCanvas(canvasModalRef.current, image.grayscale, w, h, {
        drawLeaves: result.leaves,
        borderColor: 'rgba(6, 182, 212, 0.85)',
        borderWidth: 1.5,
      });
    } else if (activeZoomModal === 'step3') {
      renderGrayscaleToCanvas(canvasModalRef.current, result.meanImage, w, h);
    } else if (activeZoomModal === 'step4') {
      if (showColorLabels) {
        renderRgbaToCanvas(canvasModalRef.current, result.regionColorMap, w, h);
      } else {
        renderGrayscaleToCanvas(canvasModalRef.current, result.mergedMeanImage, w, h);
      }
    }
  }, [activeZoomModal, image, result, showColorLabels]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const w = img.naturalWidth || img.width;
          const h = img.naturalHeight || img.height;
          const cvs = document.createElement('canvas');
          cvs.width = w;
          cvs.height = h;
          const ctx = cvs.getContext('2d');
          if (!ctx) return;
          ctx.drawImage(img, 0, 0);
          const data = ctx.getImageData(0, 0, w, h).data;
          const gray = new Float32Array(w * h);
          for (let i = 0, j = 0; i < data.length; i += 4, j++) {
            gray[j] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          }
          onImageLoaded({
            name: file.name,
            width: w,
            height: h,
            channels: 3,
            sizeBytes: file.size,
            grayscale: gray,
            dataUrl: reader.result as string,
          });
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Sélection simple de l'image */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 font-bold text-xs flex items-center justify-center">
                1
              </span>
              Choisissez une image pour tester
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Cliquez sur une image d'exemple ou importez votre propre fichier.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
            >
              <Upload className="w-3.5 h-3.5 text-cyan-400" />
              <span>Importer une photo</span>
            </button>
          </div>
        </div>

        {/* Boutons d'exemples faciles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {SAMPLE_BENCHMARKS.map((b) => (
            <button
              key={b.id}
              onClick={() => onSelectSample(b)}
              className={`flex items-center gap-2.5 p-2 rounded-lg border text-left transition-all ${
                image?.name === b.title
                  ? 'bg-cyan-950/40 border-cyan-500 text-white shadow-sm'
                  : 'bg-slate-950/60 hover:bg-slate-800/80 border-slate-800 text-slate-300'
              }`}
            >
              <img
                src={b.url}
                alt={b.title}
                className="w-10 h-10 rounded object-cover border border-slate-700 shrink-0"
              />
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate">{b.title.split(' ')[0]}</p>
                <p className="text-[10px] text-slate-400 truncate">
                  {b.id === 'cameraman' ? 'Cameraman classique' : b.id === 'texture_grass' ? 'Herbe (texture)' : b.id === 'facade' ? 'Bâtiment' : 'Formes simples'}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Les 3 Réglages Clairs & Compréhensibles */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 font-bold text-xs flex items-center justify-center">
                2
              </span>
              Ajustez les paramètres de segmentation
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Trois réglages simples suffisent pour tout contrôler.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onResetParams}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors"
              title="Remettre les valeurs recommandées"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Réinitialiser</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* Curseur T */}
          <div className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-xs text-cyan-300">
                1. Seuil de division (T)
              </span>
              <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-400 font-mono text-xs font-bold">
                {params.T}
              </span>
            </div>
            <input
              type="range"
              min="2"
              max="60"
              step="1"
              value={params.T}
              onChange={(e) => onChangeParams({ ...params, T: Number(e.target.value) })}
              className="w-full accent-cyan-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
            />
            <p className="text-[11px] text-slate-400 leading-snug">
              💡 <strong>Plus T est petit</strong> (ex: 5), plus on découpe en petits carrés. <strong>Plus T est grand</strong> (ex: 40), plus les blocs restent gros.
            </p>
          </div>

          {/* Curseur min_size */}
          <div className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-xs text-slate-200">
                2. Taille mini d'un bloc (min_size)
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200 font-mono text-xs font-bold">
                {params.min_size} px
              </span>
            </div>
            <input
              type="range"
              min="2"
              max="32"
              step="2"
              value={params.min_size}
              onChange={(e) => onChangeParams({ ...params, min_size: Number(e.target.value) })}
              className="w-full accent-cyan-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
            />
            <p className="text-[11px] text-slate-400 leading-snug">
              💡 Taille minimale en pixels sous laquelle l'algorithme s'arrête de couper les carrés en quatre.
            </p>
          </div>

          {/* Curseur T_m */}
          <div className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-xs text-emerald-400">
                3. Seuil de fusion (T_m)
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-400 font-mono text-xs font-bold">
                {params.T_m}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="1"
              value={params.T_m}
              onChange={(e) => onChangeParams({ ...params, T_m: Number(e.target.value) })}
              className="w-full accent-emerald-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
            />
            <p className="text-[11px] text-slate-400 leading-snug">
              💡 Si deux carrés voisins ont des couleurs proches (écart ≤ {params.T_m}), ils <strong>fusionnent</strong> ensemble.
            </p>
          </div>
        </div>

        {/* Bouton pour lancer */}
        <div className="flex items-center justify-between pt-1">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-cyan-400" />
            <span>Critère d'homogénéité : Écart-type (std ≤ T)</span>
          </div>

          <button
            onClick={onRunSegmentation}
            disabled={isProcessing}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 active:translate-y-0.5 transition-all"
          >
            {isProcessing ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Calcul en cours...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Appliquer et recalculer</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Résumé clair en français de ce qui s'est passé */}
      {result && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 to-cyan-950/30 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Check className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold text-slate-200">
                Résultat expliqué simplement :
              </p>
              <p className="text-slate-300 mt-0.5">
                L'arbre a d'abord découpé l'image en <strong className="text-cyan-400 font-mono">{result.divisionStats.leafCount} blocs (feuilles)</strong>.
                Ensuite, la fusion a regroupé les blocs similaires : il ne reste que <strong className="text-emerald-400 font-mono">{result.mergeStats.finalRegions} régions finales</strong> !
                ({result.mergeStats.eliminatedPercentage.toFixed(0)}% des blocs ont été assemblés en {result.totalTimeMs.toFixed(0)} ms).
              </p>
            </div>
          </div>

          {/* Toggle pour voir en couleur */}
          <button
            onClick={() => setShowColorLabels(!showColorLabels)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors shrink-0 ${
              showColorLabels
                ? 'bg-purple-950/60 border-purple-500 text-purple-300'
                : 'bg-slate-800 hover:bg-slate-750 border-slate-700 text-slate-300'
            }`}
          >
            <Palette className="w-3.5 h-3.5 text-purple-400" />
            <span>{showColorLabels ? 'Mode couleur activé' : 'Colorer les régions'}</span>
          </button>
        </div>
      )}

      {/* 3. Les 4 Étapes Visuelles Claires Côte-à-Côte */}
      <div className="space-y-2">
        <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 font-bold text-xs flex items-center justify-center">
            3
          </span>
          Visualisez les 4 étapes de l'algorithme
        </h2>
        <p className="text-xs text-slate-400">
          Chaque étape montre exactement ce que calcule le programme. Cliquez sur la loupe pour voir une étape en grand.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Étape 1 */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-3 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-200">1. Image originale</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveZoomModal('step1')}
                className="p-1 text-slate-400 hover:text-cyan-400 rounded"
                title="Agrandir"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => canvasStep1.current && downloadCanvasAsPng(canvasStep1.current, '1_originale.png')}
                className="p-1 text-slate-400 hover:text-cyan-400 rounded"
                title="Télécharger"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="h-56 bg-slate-950 rounded-lg overflow-hidden flex items-center justify-center p-1 border border-slate-800">
            <canvas ref={canvasStep1} className="max-h-full max-w-full rounded object-contain" />
          </div>

          <p className="text-[11px] text-slate-400">
            L'image de départ convertie en niveaux de gris (valeurs de 0 à 255).
          </p>
        </div>

        {/* Étape 2 */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-3 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-cyan-400">2. Découpage Quadtree</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveZoomModal('step2')}
                className="p-1 text-slate-400 hover:text-cyan-400 rounded"
                title="Agrandir"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => canvasStep2.current && downloadCanvasAsPng(canvasStep2.current, '2_decoupage_quadtree.png')}
                className="p-1 text-slate-400 hover:text-cyan-400 rounded"
                title="Télécharger"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="h-56 bg-slate-950 rounded-lg overflow-hidden flex items-center justify-center p-1 border border-slate-800">
            <canvas ref={canvasStep2} className="max-h-full max-w-full rounded object-contain" />
          </div>

          <p className="text-[11px] text-slate-400">
            Les lignes bleues montrent les <strong className="text-cyan-300 font-mono">{result?.divisionStats.leafCount ?? '—'} blocs</strong> découpés récursivement.
          </p>
        </div>

        {/* Étape 3 */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-3 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-cyan-300">3. Image moyenne</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveZoomModal('step3')}
                className="p-1 text-slate-400 hover:text-cyan-400 rounded"
                title="Agrandir"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => canvasStep3.current && downloadCanvasAsPng(canvasStep3.current, '3_image_moyenne.png')}
                className="p-1 text-slate-400 hover:text-cyan-400 rounded"
                title="Télécharger"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="h-56 bg-slate-950 rounded-lg overflow-hidden flex items-center justify-center p-1 border border-slate-800">
            <canvas ref={canvasStep3} className="max-h-full max-w-full rounded object-contain" />
          </div>

          <p className="text-[11px] text-slate-400">
            Chaque carré est rempli avec sa couleur moyenne (effet « pixelisé » par blocs).
          </p>
        </div>

        {/* Étape 4 */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-3 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-emerald-400">4. Après fusion (Final)</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveZoomModal('step4')}
                className="p-1 text-slate-400 hover:text-cyan-400 rounded"
                title="Agrandir"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => canvasStep4.current && downloadCanvasAsPng(canvasStep4.current, '4_apres_fusion.png')}
                className="p-1 text-slate-400 hover:text-cyan-400 rounded"
                title="Télécharger"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="h-56 bg-slate-950 rounded-lg overflow-hidden flex items-center justify-center p-1 border border-slate-800">
            <canvas ref={canvasStep4} className="max-h-full max-w-full rounded object-contain" />
          </div>

          <p className="text-[11px] text-slate-400">
            {showColorLabels ? (
              <span>Chaque couleur représente une région distincte trouvée (<strong className="text-purple-300 font-mono">{result?.mergeStats.finalRegions}</strong> au total).</span>
            ) : (
              <span>Les carrés voisins de teinte proche sont réunis (<strong className="text-emerald-400 font-mono">{result?.mergeStats.finalRegions}</strong> régions finales).</span>
            )}
          </p>
        </div>
      </div>

      {/* Modal Zoom en Grand */}
      {activeZoomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100">
                {activeZoomModal === 'step1' && 'Étape 1 : Image originale'}
                {activeZoomModal === 'step2' && 'Étape 2 : Découpage Quadtree avec bordures'}
                {activeZoomModal === 'step3' && 'Étape 3 : Image moyenne des feuilles'}
                {activeZoomModal === 'step4' && 'Étape 4 : Image finale après fusion des régions'}
              </h3>
              <button
                onClick={() => setActiveZoomModal(null)}
                className="text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 text-xs"
              >
                Fermer ✕
              </button>
            </div>

            <div className="h-[480px] bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center p-2 border border-slate-800">
              <canvas ref={canvasModalRef} className="max-h-full max-w-full rounded object-contain" />
            </div>

            <div className="flex justify-between items-center text-xs text-slate-400 pt-1">
              <span>{image?.width} × {image?.height} pixels</span>
              <button
                onClick={() => {
                  if (canvasModalRef.current) {
                    downloadCanvasAsPng(canvasModalRef.current, `${activeZoomModal}_zoom.png`);
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Télécharger cette image</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
