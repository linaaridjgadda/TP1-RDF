import React from 'react';
import { X, Download, FileImage, FileSpreadsheet, FileCode, Printer } from 'lucide-react';
import { LoadedImage, renderGrayscaleToCanvas, renderRgbaToCanvas, renderBinaryToCanvas, downloadCanvasAsPng, downloadTextFile } from '../utils/imageUtils';
import { SegmentationResult, calculate_otsu } from '../algorithms/quadtree';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  image: LoadedImage | null;
  result: SegmentationResult | null;
  onOpenReport: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  image,
  result,
  onOpenReport,
}) => {
  if (!isOpen || !image) return null;

  const baseName = image.name.replace(/\.[^/.]+$/, '');

  const downloadOriginal = () => {
    const canvas = document.createElement('canvas');
    renderGrayscaleToCanvas(canvas, image.grayscale, image.width, image.height);
    downloadCanvasAsPng(canvas, `${baseName}_original_grayscale.png`);
  };

  const downloadBoundaries = () => {
    if (!result) return;
    const canvas = document.createElement('canvas');
    renderGrayscaleToCanvas(canvas, image.grayscale, image.width, image.height, {
      drawLeaves: result.leaves,
      borderColor: 'rgba(6, 182, 212, 0.9)',
      borderWidth: 1,
    });
    downloadCanvasAsPng(canvas, `${baseName}_quadtree_boundaries.png`);
  };

  const downloadMeanImage = () => {
    if (!result) return;
    const canvas = document.createElement('canvas');
    renderGrayscaleToCanvas(canvas, result.meanImage, image.width, image.height);
    downloadCanvasAsPng(canvas, `${baseName}_quadtree_mean.png`);
  };

  const downloadMergedImage = () => {
    if (!result) return;
    const canvas = document.createElement('canvas');
    renderGrayscaleToCanvas(canvas, result.mergedMeanImage, image.width, image.height);
    downloadCanvasAsPng(canvas, `${baseName}_quadtree_merged.png`);
  };

  const downloadColorLabels = () => {
    if (!result) return;
    const canvas = document.createElement('canvas');
    renderRgbaToCanvas(canvas, result.regionColorMap, image.width, image.height);
    downloadCanvasAsPng(canvas, `${baseName}_regions_colormap.png`);
  };

  const downloadOtsuBinary = () => {
    const otsu = calculate_otsu(image.grayscale, image.width, image.height);
    const canvas = document.createElement('canvas');
    renderBinaryToCanvas(canvas, otsu.binaryImage, image.width, image.height);
    downloadCanvasAsPng(canvas, `${baseName}_otsu_binary_T${otsu.threshold}.png`);
  };

  const downloadPythonCode = async () => {
    try {
      const res = await fetch('/tp1_quadtree.py');
      const text = await res.text();
      downloadTextFile(text, 'tp1_quadtree.py', 'text/x-python');
    } catch {
      // fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-xl w-full p-6 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-semibold text-slate-100">
              Centre de téléchargement des résultats (TP1)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <p className="text-slate-400">
            Exportez individuellement les images traitées en haute résolution PNG, les codes sources ou le rapport de laboratoire.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* 1. Image originale */}
            <button
              onClick={downloadOriginal}
              className="flex items-center justify-between p-2.5 rounded bg-slate-950/80 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-left transition-colors"
            >
              <div className="flex items-center gap-2">
                <FileImage className="w-4 h-4 text-slate-400" />
                <span className="font-medium text-slate-200">Image originale (Gris)</span>
              </div>
              <Download className="w-3.5 h-3.5 text-cyan-400" />
            </button>

            {/* 2. Bords des régions */}
            <button
              onClick={downloadBoundaries}
              disabled={!result}
              className="flex items-center justify-between p-2.5 rounded bg-slate-950/80 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-left transition-colors disabled:opacity-50"
            >
              <div className="flex items-center gap-2">
                <FileImage className="w-4 h-4 text-cyan-400" />
                <span className="font-medium text-slate-200">Grille Quadtree (Bords)</span>
              </div>
              <Download className="w-3.5 h-3.5 text-cyan-400" />
            </button>

            {/* 3. Image moyenne division */}
            <button
              onClick={downloadMeanImage}
              disabled={!result}
              className="flex items-center justify-between p-2.5 rounded bg-slate-950/80 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-left transition-colors disabled:opacity-50"
            >
              <div className="flex items-center gap-2">
                <FileImage className="w-4 h-4 text-cyan-400" />
                <span className="font-medium text-slate-200">Image moyenne (Division)</span>
              </div>
              <Download className="w-3.5 h-3.5 text-cyan-400" />
            </button>

            {/* 4. Après fusion */}
            <button
              onClick={downloadMergedImage}
              disabled={!result}
              className="flex items-center justify-between p-2.5 rounded bg-slate-950/80 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-left transition-colors disabled:opacity-50"
            >
              <div className="flex items-center gap-2">
                <FileImage className="w-4 h-4 text-emerald-400" />
                <span className="font-medium text-slate-200">Image après fusion (Moyenne)</span>
              </div>
              <Download className="w-3.5 h-3.5 text-cyan-400" />
            </button>

            {/* 5. Carte couleur de labels */}
            <button
              onClick={downloadColorLabels}
              disabled={!result}
              className="flex items-center justify-between p-2.5 rounded bg-slate-950/80 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-left transition-colors disabled:opacity-50"
            >
              <div className="flex items-center gap-2">
                <FileImage className="w-4 h-4 text-purple-400" />
                <span className="font-medium text-slate-200">Carte des labels colorés</span>
              </div>
              <Download className="w-3.5 h-3.5 text-cyan-400" />
            </button>

            {/* 6. Binarisation Otsu */}
            <button
              onClick={downloadOtsuBinary}
              className="flex items-center justify-between p-2.5 rounded bg-slate-950/80 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-left transition-colors"
            >
              <div className="flex items-center gap-2">
                <FileImage className="w-4 h-4 text-amber-400" />
                <span className="font-medium text-slate-200">Image binaire Otsu</span>
              </div>
              <Download className="w-3.5 h-3.5 text-cyan-400" />
            </button>

            {/* 7. Code Python */}
            <button
              onClick={downloadPythonCode}
              className="flex items-center justify-between p-2.5 rounded bg-slate-950/80 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-left transition-colors"
            >
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-cyan-400" />
                <span className="font-medium text-slate-200">Code Python (tp1_quadtree.py)</span>
              </div>
              <Download className="w-3.5 h-3.5 text-cyan-400" />
            </button>

            {/* 8. Ouvrir le rapport complet */}
            <button
              onClick={() => {
                onClose();
                onOpenReport();
              }}
              className="flex items-center justify-between p-2.5 rounded bg-cyan-950/40 hover:bg-cyan-950/70 border border-cyan-800/80 text-left transition-colors"
            >
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-cyan-400" />
                <span className="font-medium text-cyan-300">Rapport complet (PDF / Print)</span>
              </div>
              <span className="text-[10px] font-mono text-cyan-400 uppercase">Voir →</span>
            </button>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
