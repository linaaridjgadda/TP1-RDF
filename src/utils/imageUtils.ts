/**
 * Utilitaires pour le chargement, la manipulation d'images,
 * le rendu Canvas et l'export PNG / CSV.
 */

import { QuadNode } from '../algorithms/quadtree';

export interface LoadedImage {
  name: string;
  width: number;
  height: number;
  channels: number;
  sizeBytes: number;
  grayscale: Float32Array; // [0, 255]
  dataUrl: string; // Image originale pour affichage
}

/**
 * Charge un fichier image et extrait ses dimensions et valeurs de gris flottantes [0, 255]
 */
export async function processImageFile(file: File): Promise<LoadedImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Erreur de lecture du fichier"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Format d'image non supporté ou fichier corrompu"));
      img.onload = () => {
        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;

        if (width === 0 || height === 0) {
          reject(new Error("L'image possède des dimensions nulles."));
          return;
        }

        // Limitation raisonnable pour la fluidité interactive sans perte de qualité
        // Si l'image dépasse 1600px sur un côté, on prévient ou on peut la traiter directement
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error("Impossible d'initialiser le contexte Canvas 2D."));
          return;
        }

        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, width, height);
        const rgba = imgData.data;
        const grayscale = new Float32Array(width * height);

        // Formule standard ITU-R BT.601 pour niveaux de gris : Y = 0.299 R + 0.587 G + 0.114 B
        for (let i = 0, j = 0; i < rgba.length; i += 4, j++) {
          const r = rgba[i];
          const g = rgba[i + 1];
          const b = rgba[i + 2];
          grayscale[j] = 0.299 * r + 0.587 * g + 0.114 * b;
        }

        resolve({
          name: file.name,
          width,
          height,
          channels: 3,
          sizeBytes: file.size,
          grayscale,
          dataUrl: reader.result as string,
        });
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Charge une image à partir d'une URL locale
 */
export async function processImageUrl(url: string, name: string): Promise<LoadedImage> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onerror = () => reject(new Error(`Impossible de charger l'image d'exemple : ${name}`));
    img.onload = () => {
      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error("Erreur de contexte 2D"));
        return;
      }
      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, width, height);
      const rgba = imgData.data;
      const grayscale = new Float32Array(width * height);

      for (let i = 0, j = 0; i < rgba.length; i += 4, j++) {
        grayscale[j] = 0.299 * rgba[i] + 0.587 * rgba[i + 1] + 0.114 * rgba[i + 2];
      }

      resolve({
        name,
        width,
        height,
        channels: 3,
        sizeBytes: width * height * 3,
        grayscale,
        dataUrl: canvas.toDataURL('image/png'),
      });
    };
    img.src = url;
  });
}

/**
 * Rend un tampon flottant de niveaux de gris [0, 255] sur un Canvas HTML5
 */
export function renderGrayscaleToCanvas(
  canvas: HTMLCanvasElement,
  data: Float32Array,
  width: number,
  height: number,
  options?: {
    drawLeaves?: QuadNode[];
    borderColor?: string;
    borderWidth?: number;
  }
) {
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const imgData = ctx.createImageData(width, height);
  const rgba = imgData.data;

  for (let i = 0, j = 0; i < data.length; i++, j += 4) {
    const val = Math.max(0, Math.min(255, Math.round(data[i])));
    rgba[j] = val;
    rgba[j + 1] = val;
    rgba[j + 2] = val;
    rgba[j + 3] = 255;
  }

  ctx.putImageData(imgData, 0, 0);

  // Tracé des bordures du quadtree par-dessus si demandé
  if (options?.drawLeaves && options.drawLeaves.length > 0) {
    ctx.strokeStyle = options.borderColor || 'rgba(6, 182, 212, 0.75)'; // Laser Cyan
    ctx.lineWidth = options.borderWidth || 1;
    ctx.beginPath();
    for (const leaf of options.drawLeaves) {
      ctx.rect(leaf.c + 0.5, leaf.r + 0.5, leaf.w, leaf.h);
    }
    ctx.stroke();
  }
}

/**
 * Rend un tampon RGBA sur un Canvas
 */
export function renderRgbaToCanvas(
  canvas: HTMLCanvasElement,
  rgbaData: Uint8ClampedArray,
  width: number,
  height: number
) {
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const imgData = new ImageData(new Uint8ClampedArray(rgbaData), width, height);
  ctx.putImageData(imgData, 0, 0);
}

/**
 * Rend une image binaire (0 ou 255) sur un Canvas
 */
export function renderBinaryToCanvas(
  canvas: HTMLCanvasElement,
  binaryData: Uint8ClampedArray,
  width: number,
  height: number
) {
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const imgData = ctx.createImageData(width, height);
  const rgba = imgData.data;

  for (let i = 0, j = 0; i < binaryData.length; i++, j += 4) {
    const val = binaryData[i];
    rgba[j] = val;
    rgba[j + 1] = val;
    rgba[j + 2] = val;
    rgba[j + 3] = 255;
  }

  ctx.putImageData(imgData, 0, 0);
}

/**
 * Télécharge le contenu d'un canvas en tant qu'image PNG
 */
export function downloadCanvasAsPng(canvas: HTMLCanvasElement, filename: string) {
  const link = document.createElement('a');
  link.download = filename.endsWith('.png') ? filename : `${filename}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

/**
 * Télécharge un fichier texte ou CSV
 */
export function downloadTextFile(content: string, filename: string, mimeType: string = 'text/plain') {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Formate un nombre d'octets en unité lisible
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Octets';
  const k = 1024;
  const sizes = ['Octets', 'Ko', 'Mo', 'Go'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Données d'images exemples universitaires
 */
export const SAMPLE_BENCHMARKS = [
  {
    id: 'cameraman',
    title: 'Photographe & Skyline (MIT Benchmark)',
    description: 'Image de référence classique : contrastes nets, ciel uniforme, contours et sol détaillé.',
    url: '/src/assets/images/sample_cameraman_1793122793960.jpg',
  },
  {
    id: 'facade',
    title: 'Façade Architecturale & Grille',
    description: 'Structure géométrique régulière avec fenêtres, lignes orthogonales et toiture inclinée.',
    url: '/src/assets/images/sample_facade_1793122870998.jpg',
  },
  {
    id: 'texture_grass',
    title: 'Pelouse & Texture Végétale',
    description: 'Texture haute fréquence à forte variance locale (idéal pour étudier la question Q6).',
    url: '/src/assets/images/sample_grass_texture_1793122796023.jpg',
  },
  {
    id: 'geometric',
    title: 'Formes Géométriques & Paliers',
    description: 'Formes simples à paliers d\'intensité discrets (0, 64, 128, 192, 255) et contours nets.',
    url: '/src/assets/images/sample_geometric_1793122794189.jpg',
  },
];
