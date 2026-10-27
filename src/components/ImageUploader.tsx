import React, { useRef, useState } from 'react';
import { Upload, Image as ImageIcon, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { LoadedImage, formatBytes, SAMPLE_BENCHMARKS, processImageFile, processImageUrl } from '../utils/imageUtils';

interface ImageUploaderProps {
  currentImage: LoadedImage | null;
  onImageLoaded: (img: LoadedImage) => void;
  isProcessing: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  currentImage,
  onImageLoaded,
  isProcessing,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoadingSample, setIsLoadingSample] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setErrorMessage(null);
    if (!file.type.match(/^image\/(jpeg|jpg|png|webp|bmp|gif)$/i)) {
      setErrorMessage("Format non supporté. Veuillez sélectionner une image JPG, PNG, WEBP ou BMP.");
      return;
    }

    try {
      const loaded = await processImageFile(file);
      onImageLoaded(loaded);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur lors du décodage de l'image";
      setErrorMessage(msg);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleSampleSelect = async (benchmark: typeof SAMPLE_BENCHMARKS[0]) => {
    setErrorMessage(null);
    setIsLoadingSample(true);
    try {
      const loaded = await processImageUrl(benchmark.url, benchmark.title);
      onImageLoaded(loaded);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur de chargement de l'image de test";
      setErrorMessage(msg);
    } finally {
      setIsLoadingSample(false);
    }
  };

  return (
    <div className="bg-slate-900/90 rounded-lg border border-slate-800 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-cyan-400" />
            Image d'entrée (Laboratoire)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Téléversez une image personnalisée ou sélectionnez une référence académique.
          </p>
        </div>

        {currentImage && (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Remplacer l'image
          </button>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFile(e.target.files[0]);
          }
        }}
        accept="image/png,image/jpeg,image/jpg,image/webp,image/bmp"
        className="hidden"
      />

      {/* Drag & Drop Zone if no image or when replacing */}
      {!currentImage && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-cyan-400 bg-cyan-950/20'
              : 'border-slate-700/80 hover:border-slate-600 bg-slate-950/40 hover:bg-slate-950/70'
          }`}
        >
          <div className="w-10 h-10 mx-auto rounded-full bg-slate-800/80 flex items-center justify-center text-cyan-400 mb-3">
            <Upload className="w-5 h-5" />
          </div>
          <p className="text-sm font-medium text-slate-200">
            Glissez-déposez une image ici ou <span className="text-cyan-400 underline underline-offset-2">parcourez vos fichiers</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">
            PNG, JPG, JPEG, WEBP, BMP · Dimensions et ratios arbitraires supportés
          </p>
        </div>
      )}

      {/* Error notification */}
      {errorMessage && (
        <div className="flex items-center gap-2 p-2.5 rounded bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Active Image Metadata Details */}
      {currentImage && (
        <div className="flex flex-col sm:flex-row items-center gap-4 p-3 bg-slate-950/60 rounded border border-slate-800/80">
          <div className="relative w-20 h-20 rounded overflow-hidden shrink-0 bg-slate-800 border border-slate-700">
            <img
              src={currentImage.dataUrl}
              alt={currentImage.name}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1 min-w-0 space-y-1 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-slate-200 truncate" title={currentImage.name}>
                {currentImage.name}
              </span>
              <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-800/40">
                {currentImage.width} × {currentImage.height} px
              </span>
            </div>

            <div className="flex items-center gap-2 text-slate-400 text-[11px] font-mono">
              <span>Canaux : 1 (Niveaux de gris [0, 255])</span>
              <span className="text-slate-600" aria-hidden="true">·</span>
              <span>Taille : {formatBytes(currentImage.sizeBytes)}</span>
            </div>

            <p className="text-[11px] text-slate-400 italic">
              Conversion flottante normalisée sans déformation ni recadrage artificiel.
            </p>
          </div>
        </div>
      )}

      {/* Sample Benchmarks Quick Selection */}
      <div className="pt-2 border-t border-slate-800/60">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Images de référence du TP :</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {SAMPLE_BENCHMARKS.map((b) => (
            <button
              key={b.id}
              onClick={() => handleSampleSelect(b)}
              disabled={isProcessing || isLoadingSample}
              className="flex items-center gap-2 p-1.5 rounded bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/40 text-left transition-colors group"
            >
              <img
                src={b.url}
                alt={b.title}
                className="w-8 h-8 rounded object-cover shrink-0 border border-slate-700"
              />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium text-slate-300 truncate group-hover:text-cyan-300">
                  {b.title.split(' ')[0]}
                </p>
                <p className="text-[9px] text-slate-500 truncate">
                  {b.id === 'cameraman' ? 'Cameraman' : b.id === 'texture_grass' ? 'Herbe (Q6)' : b.id === 'facade' ? 'Façade' : 'Formes'}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
