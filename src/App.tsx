/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Upload,
  Download,
  RotateCcw,
  Sliders,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  FileCode,
} from 'lucide-react';
import {
  SAMPLE_BENCHMARKS,
  LoadedImage,
  processImageUrl,
  processImageFile,
  renderGrayscaleToCanvas,
  renderBinaryToCanvas,
  downloadCanvasAsPng,
  downloadTextFile,
} from './utils/imageUtils';
import {
  runSegmentationPipeline,
  calculate_otsu,
  SegmentationResult,
  OtsuResult,
} from './algorithms/quadtree';

type DisplayMode = 'original' | 'quadtree' | 'mean' | 'merged' | 'otsu';

export default function App() {
  const [image, setImage] = useState<LoadedImage | null>(null);
  const [result, setResult] = useState<SegmentationResult | null>(null);
  const [otsu, setOtsu] = useState<OtsuResult | null>(null);
  const [displayMode, setDisplayMode] = useState<DisplayMode>('merged');
  const [isProcessing, setIsProcessing] = useState(false);

  // 2 curseurs simples
  const [tThreshold, setTThreshold] = useState<number>(20); // Seuil de découpage T
  const [tmThreshold, setTmThreshold] = useState<number>(15); // Seuil de fusion Tm

  // Accordéon questions TP
  const [showQuestions, setShowQuestions] = useState(false);
  const [copiedQ, setCopiedQ] = useState<number | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Exécution de l'algorithme
  const runAlgorithm = useCallback((img: LoadedImage, tVal: number, tmVal: number) => {
    setIsProcessing(true);
    setTimeout(() => {
      try {
        const segRes = runSegmentationPipeline(img.grayscale, img.width, img.height, {
          T: tVal,
          min_size: 8,
          T_m: tmVal,
          criterion: 'std',
        });
        setResult(segRes);

        const otsuRes = calculate_otsu(img.grayscale, img.width, img.height);
        setOtsu(otsuRes);
      } catch (e) {
        console.error(e);
      } finally {
        setIsProcessing(false);
      }
    }, 20);
  }, []);

  // Chargement de l'image par défaut
  useEffect(() => {
    async function loadDefault() {
      try {
        const img = await processImageUrl(SAMPLE_BENCHMARKS[0].url, SAMPLE_BENCHMARKS[0].title);
        setImage(img);
        runAlgorithm(img, 20, 15);
      } catch (err) {
        console.error(err);
      }
    }
    loadDefault();
  }, [runAlgorithm]);

  // Dessin sur le canvas selon le mode choisi
  useEffect(() => {
    if (!image || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const w = image.width;
    const h = image.height;

    if (displayMode === 'original') {
      renderGrayscaleToCanvas(canvas, image.grayscale, w, h);
    } else if (displayMode === 'quadtree' && result) {
      renderGrayscaleToCanvas(canvas, image.grayscale, w, h, {
        drawLeaves: result.leaves,
        borderColor: '#06b6d4',
        borderWidth: 1.5,
      });
    } else if (displayMode === 'mean' && result) {
      renderGrayscaleToCanvas(canvas, result.meanImage, w, h);
    } else if (displayMode === 'merged' && result) {
      renderGrayscaleToCanvas(canvas, result.mergedMeanImage, w, h);
    } else if (displayMode === 'otsu' && otsu) {
      renderBinaryToCanvas(canvas, otsu.binaryImage, w, h);
    }
  }, [image, result, otsu, displayMode]);

  // Changement d'un curseur
  const handleSliderChange = (newT: number, newTm: number) => {
    setTThreshold(newT);
    setTmThreshold(newTm);
    if (image) {
      runAlgorithm(image, newT, newTm);
    }
  };

  // Choix d'une image d'exemple
  const handleSelectSample = async (sample: typeof SAMPLE_BENCHMARKS[0]) => {
    try {
      const img = await processImageUrl(sample.url, sample.title);
      setImage(img);
      runAlgorithm(img, tThreshold, tmThreshold);
    } catch (err) {
      console.error(err);
    }
  };

  // Upload d'image personnalisée
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const img = await processImageFile(e.target.files[0]);
        setImage(img);
        runAlgorithm(img, tThreshold, tmThreshold);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Télécharger l'image affichée
  const handleDownloadImage = () => {
    if (canvasRef.current) {
      downloadCanvasAsPng(canvasRef.current, `quadtree_${displayMode}.png`);
    }
  };

  // Télécharger le script Python
  const handleDownloadPython = async () => {
    try {
      const res = await fetch('/tp1_quadtree.py');
      const text = await res.text();
      downloadTextFile(text, 'tp1_quadtree.py', 'text/x-python');
    } catch {
      // fallback
    }
  };

  const handleCopyQuestion = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedQ(idx);
    setTimeout(() => setCopiedQ(null), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* 1. Header ultra simple */}
      <header className="border-b border-slate-800 bg-slate-900/80 px-4 py-3 sticky top-0 z-20 backdrop-blur">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-cyan-500 text-slate-950 font-black text-sm flex items-center justify-center">
              Q
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold text-slate-100">
                Quadtree Facile (TP1)
              </h1>
              <p className="text-[11px] text-slate-400 -mt-0.5 hidden sm:block">
                Découpage en carrés et fusion des couleurs similaires
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPython}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 text-xs font-semibold transition-colors"
              title="Télécharger le code Python pour votre rendu de TP"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Télécharger .py</span>
            </button>

            <button
              onClick={handleDownloadImage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shadow-sm"
              title="Enregistrer l'image affichée"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Sauvegarder l'image</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Contenu principal épuré et centré */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-5">
        {/* Choix de l'image en 1 clic */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <span>Image à tester :</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {SAMPLE_BENCHMARKS.slice(0, 3).map((b) => (
              <button
                key={b.id}
                onClick={() => handleSelectSample(b)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                  image?.name === b.title
                    ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300'
                    : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <img src={b.url} alt={b.title} className="w-4 h-4 rounded-full object-cover" />
                <span>{b.id === 'cameraman' ? 'Cameraman' : b.id === 'facade' ? 'Bâtiment' : 'Pelouse'}</span>
              </button>
            ))}

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleUpload}
              accept="image/*"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition-colors"
            >
              <Upload className="w-3 h-3 text-cyan-400" />
              <span>Importer une photo</span>
            </button>
          </div>
        </div>

        {/* Boutons pour changer la vue de l'image */}
        <div className="flex items-center justify-center p-1 bg-slate-900 rounded-xl border border-slate-800 overflow-x-auto gap-1">
          <button
            onClick={() => setDisplayMode('original')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              displayMode === 'original'
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            1. Image normale
          </button>
          <button
            onClick={() => setDisplayMode('quadtree')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              displayMode === 'quadtree'
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            2. Découpage en carrés
          </button>
          <button
            onClick={() => setDisplayMode('mean')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              displayMode === 'mean'
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            3. Image moyenne
          </button>
          <button
            onClick={() => setDisplayMode('merged')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              displayMode === 'merged'
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            4. Après fusion (Résultat final)
          </button>
          <button
            onClick={() => setDisplayMode('otsu')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              displayMode === 'otsu'
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            5. Otsu (Noir & Blanc)
          </button>
        </div>

        {/* Le Grand Visualiseur Central */}
        <div className="relative rounded-2xl bg-slate-900 border border-slate-800 p-3 sm:p-4 shadow-xl flex flex-col items-center justify-center">
          <div className="w-full h-[360px] sm:h-[420px] bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center p-2 border border-slate-800/80">
            <canvas
              ref={canvasRef}
              className="max-h-full max-w-full rounded object-contain shadow-md"
            />
          </div>

          {/* Phrase d'explication sous l'image */}
          <div className="w-full mt-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-center text-xs text-slate-300">
            {displayMode === 'original' && (
              <p>📷 <strong>Image d'origine :</strong> Photo en niveaux de gris (noir à blanc).</p>
            )}
            {displayMode === 'quadtree' && (
              <p>🔲 <strong>Découpage :</strong> Les contours bleus montrent les <span className="text-cyan-400 font-bold font-mono">{result?.divisionStats.leafCount} carrés</span> créés automatiquement.</p>
            )}
            {displayMode === 'mean' && (
              <p>🎨 <strong>Image moyenne :</strong> Chaque carré est peint de façon uniforme avec sa couleur moyenne.</p>
            )}
            {displayMode === 'merged' && (
              <p>✨ <strong>Après fusion :</strong> Les carrés voisins de même couleur se sont collés : il ne reste que <span className="text-emerald-400 font-bold font-mono">{result?.mergeStats.finalRegions} grandes régions</span> !</p>
            )}
            {displayMode === 'otsu' && (
              <p>⬛⬜ <strong>Seuillage d'Otsu :</strong> Méthode classique qui sépare tout bêtement en Noir ou Blanc (seuil calculé = <span className="text-amber-400 font-bold font-mono">{otsu?.threshold}</span>).</p>
            )}
          </div>
        </div>

        {/* Les 2 seuls curseurs pour tester en direct */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              Régler le découpage et la fusion
            </h2>
            <button
              onClick={() => handleSliderChange(20, 15)}
              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Valeurs normales (T=20, Tm=15)</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Curseur 1 : Découpage T */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-cyan-400">1. Découpage (T = {tThreshold})</span>
                <span className="text-[10px] text-slate-500 font-mono">Sensibilité</span>
              </div>
              <input
                type="range"
                min="5"
                max="50"
                step="1"
                value={tThreshold}
                onChange={(e) => handleSliderChange(Number(e.target.value), tmThreshold)}
                className="w-full accent-cyan-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>◀ Beaucoup de petits carrés</span>
                <span>Gros carrés ▶</span>
              </div>
            </div>

            {/* Curseur 2 : Fusion Tm */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-emerald-400">2. Fusion (Tm = {tmThreshold})</span>
                <span className="text-[10px] text-slate-500 font-mono">Tolérance</span>
              </div>
              <input
                type="range"
                min="0"
                max="40"
                step="1"
                value={tmThreshold}
                onChange={(e) => handleSliderChange(tThreshold, Number(e.target.value))}
                className="w-full accent-emerald-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>◀ Peu de fusion</span>
                <span>Forte fusion des régions ▶</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section Repliable : Les Réponses aux 6 Questions du TP */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
          <button
            onClick={() => setShowQuestions(!showQuestions)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-850 transition-colors"
          >
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-cyan-400" />
              <span className="text-xs sm:text-sm font-bold text-slate-200">
                Besoin des réponses pour votre compte-rendu de TP ? (Cliquez ici)
              </span>
            </div>
            {showQuestions ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {showQuestions && (
            <div className="p-4 sm:p-5 pt-0 space-y-3 text-xs border-t border-slate-800 bg-slate-950/40">
              <p className="text-slate-400 text-[11px] mb-2">
                Voici les 6 réponses rédigées simplement que vous pouvez copier dans votre devoir :
              </p>

              {[
                {
                  id: 1,
                  q: "Q1. Profondeur maximale pour une image 512 × 512 avec min_size = 4 ?",
                  a: "La profondeur maximale est de 7. En divisant 512 par 2 successivement (512 → 256 → 128 → 64 → 32 → 16 → 8 → 4), on effectue exactement 7 divisions car 512 / (2^7) = 4.",
                },
                {
                  id: 2,
                  q: "Q2. Combien de feuilles un arbre de profondeur d peut-il avoir au plus ?",
                  a: "Au plus 4^d feuilles, car chaque division coupe un carré en 4 enfants (NO, NE, SO, SE).",
                },
                {
                  id: 3,
                  q: "Q3. Que se passe-t-il quand T est très petit ? Très grand ?",
                  a: "Si T est très petit (ex: 2), l'algorithme découpe tout en minuscules morceaux. Si T est très grand (ex: 50), il ne découpe presque rien et l'image reste en gros pavés.",
                },
                {
                  id: 4,
                  q: "Q4. Pourquoi la division donne des « blocs » et en quoi la fusion aide-t-elle ?",
                  a: "La division ne sait faire que des carrés rigides (effet escalier). La fusion résout ce problème en collant ensemble les carrés voisins qui ont la même couleur pour retrouver les vraies formes des objets.",
                },
                {
                  id: 5,
                  q: "Q5. Comparaison avec le seuillage d'Otsu ?",
                  a: "Otsu coupe l'image bêtement en tout Noir ou tout Blanc (2 classes) sans regarder la position des pixels. Le Quadtree forme de vraies régions avec leurs nuances de gris.",
                },
                {
                  id: 6,
                  q: "Q6. Pourquoi l'herbe produit beaucoup de carrés ? Quel meilleur critère ?",
                  a: "L'herbe est pleine de petits détails et d'ombres : l'écart-type est donc toujours fort. Pour faire mieux, il faudrait analyser la texture (ondelettes ou filtres de texture) plutôt que le simple contraste.",
                },
              ].map((item) => (
                <div key={item.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-cyan-300 font-bold">
                    <span>{item.q}</span>
                    <button
                      onClick={() => handleCopyQuestion(`${item.q}\n${item.a}`, item.id)}
                      className="text-[10px] text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800 flex items-center gap-1"
                    >
                      {copiedQ === item.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedQ === item.id ? 'Copié' : 'Copier'}</span>
                    </button>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed pt-0.5">
                    👉 {item.a}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer minimal */}
      <footer className="border-t border-slate-900 py-3 text-center text-[11px] text-slate-500">
        Quadtree (Divide and Merge) · TP1 Université · Conçu pour comprendre en un coup d'œil
      </footer>
    </div>
  );
}
