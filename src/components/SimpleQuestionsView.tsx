import React, { useState } from 'react';
import { FileText, Copy, Check, Printer, Sparkles } from 'lucide-react';
import { LoadedImage } from '../utils/imageUtils';
import { SegmentationResult } from '../algorithms/quadtree';

interface SimpleQuestionsViewProps {
  image: LoadedImage | null;
  result: SegmentationResult | null;
}

export const SimpleQuestionsView: React.FC<SimpleQuestionsViewProps> = ({
  image,
  result,
}) => {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const questions = [
    {
      id: 1,
      title: "Q1. Quelle est la profondeur maximale pour une image 512 × 512 avec min_size = 4 ?",
      shortAnswer: "La profondeur maximale est de 7.",
      explanation: "À chaque niveau de division, la taille du bloc est divisée par 2 : 512 → 256 → 128 → 64 → 32 → 16 → 8 → 4. On s'arrête quand la taille atteint 4. Le nombre de divisions successives est donc log₂(512 / 4) = log₂(128) = 7.",
    },
    {
      id: 2,
      title: "Q2. Combien de feuilles un arbre de profondeur d peut-il avoir au plus ?",
      shortAnswer: "Un arbre complet de profondeur d a au plus 4^d feuilles.",
      explanation: "Puisque chaque division coupe un carré en exactement 4 sous-quadrants (NO, NE, SO, SE), à la profondeur d, il y a au maximum 4^d feuilles (par exemple pour d = 7 : 4^7 = 16 384 feuilles).",
    },
    {
      id: 3,
      title: "Q3. Que se passe-t-il quand T est très petit ? Très grand ?",
      shortAnswer: "T petit = sur-découpage en minuscules blocs. T grand = sous-découpage en énormes blocs.",
      explanation: "• Si T est très petit (ex: T = 2) : l'algorithme est hyper exigeant, presque aucun bloc n'est considéré homogène. Il découpe tout jusqu'à atteindre la taille min_size (trop de feuilles).\n• Si T est très grand (ex: T = 50) : l'algorithme tolère de fortes variations, il s'arrête très vite de découper et l'image est grossièrement simplifiée en gros pavés.",
    },
    {
      id: 4,
      title: "Q4. Pourquoi la division seule donne des régions « en blocs » ? En quoi la fusion aide-t-elle ?",
      shortAnswer: "La division impose une grille artificielle de carrés. La fusion recolle les carrés voisins pour reformer les vrais objets.",
      explanation: "La division par quadtree ne sait faire que des carrés ou rectangles dyadiques, ce qui crée un effet « escalier / mosaïque ». La phase de fusion (Merge) parcourt tous les blocs voisins : s'ils ont une couleur similaire, elle les assemble en une même région continue, ce qui fait disparaître les fausses frontières de la grille.",
    },
    {
      id: 5,
      title: "Q5. Comparez avec le seuillage d'Otsu : que produit chaque méthode ?",
      shortAnswer: "Otsu = noir et blanc global (2 classes). Quadtree = plusieurs régions spatiales avec leurs niveaux de gris.",
      explanation: "• Otsu analyse uniquement l'histogramme global pour trouver un seuil et colorier l'image en 2 couleurs : 0 (noir) ou 255 (blanc). Il ne sait pas où sont situés les pixels.\n• Le Quadtree tient compte de la géométrie spatiale : il regroupe des blocs voisins pour former des dizaines de régions connectées tout en conservant leurs nuances de gris d'origine.",
    },
    {
      id: 6,
      title: "Q6. Pourquoi l'herbe produit-elle beaucoup de petites régions ? Proposez un meilleur critère.",
      shortAnswer: "L'herbe est une texture avec plein de micro-détails (brins, ombres) qui font exploser l'écart-type.",
      explanation: "L'écart-type std(bloc) mesure les variations de contraste. Comme une pelouse est pleine d'ombres et de brins d'herbe rapprochés, chaque bloc a une variance élevée et se fait découper jusqu'au bout.\n👉 Meilleure solution : utiliser un filtre de texture (analyse d'énergie fréquentielle, ondelettes, ou matrice de co-occurrence de Haralick) plutôt qu'un simple écart-type de luminosité.",
    },
  ];

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Entête */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-xl bg-slate-900 border border-slate-800">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            Réponses simples et claires aux 6 questions du TP
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Idéal pour réviser, comprendre l'algorithme et compléter votre compte-rendu.
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
        >
          <Printer className="w-4 h-4 text-cyan-400" />
          <span>Imprimer le compte-rendu</span>
        </button>
      </div>

      {/* Données actuelles si disponibles */}
      {result && (
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
          <span className="text-slate-300 font-medium">
            Valeurs calculées pour l'image actuelle ({image?.name}) :
          </span>
          <div className="flex items-center gap-4 font-mono text-slate-400">
            <span>T = <strong className="text-cyan-400">{result.params.T}</strong></span>
            <span>min_size = <strong className="text-slate-200">{result.params.min_size}px</strong></span>
            <span>Feuilles = <strong className="text-cyan-400">{result.divisionStats.leafCount}</strong></span>
            <span>Régions = <strong className="text-emerald-400">{result.mergeStats.finalRegions}</strong></span>
          </div>
        </div>
      )}

      {/* Liste des 6 questions */}
      <div className="space-y-4">
        {questions.map((q, idx) => (
          <div
            key={q.id}
            className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3 hover:border-slate-700 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-400 font-mono text-xs flex items-center justify-center shrink-0">
                  {q.id}
                </span>
                {q.title}
              </h3>

              <button
                onClick={() => handleCopy(`${q.title}\n\n${q.shortAnswer}\n\n${q.explanation}`, idx)}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs shrink-0 transition-colors"
                title="Copier la réponse"
              >
                {copiedIdx === idx ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copié !</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copier</span>
                  </>
                )}
              </button>
            </div>

            {/* Réponse courte mise en avant */}
            <div className="p-2.5 rounded-lg bg-cyan-950/40 border border-cyan-800/60 text-xs font-semibold text-cyan-200">
              👉 {q.shortAnswer}
            </div>

            {/* Explication détaillée facile à lire */}
            <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line pl-1">
              {q.explanation}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
