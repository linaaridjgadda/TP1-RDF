/**
 * Suite de tests unitaires et validation des invariants en TypeScript.
 * Exécute en direct les 8 cas d'évaluation requis par le TP.
 */

import {
  QuadNode,
  split,
  leaves,
  mean_image,
  merge,
  calculate_psnr,
  calculate_otsu,
  runSegmentationPipeline,
} from './quadtree';

export interface TestCaseResult {
  id: string;
  name: string;
  description: string;
  passed: boolean;
  durationMs: number;
  invariants: {
    name: string;
    passed: boolean;
    detail: string;
  }[];
  metrics: Record<string, string | number>;
}

export function runAllAlgorithmTests(): TestCaseResult[] {
  const results: TestCaseResult[] = [];

  // 1. Image constante (128x128 à 140.0)
  {
    const start = performance.now();
    const w = 128, h = 128;
    const img = new Float32Array(w * h).fill(140.0);
    const root: QuadNode = {
      id: 0, r: 0, c: 0, h, w, depth: 0, children: [],
      mean: 0, std: 0, minVal: 0, maxVal: 0, isLeaf: false
    };
    split(img, w, h, root, 10, 4, 'std', { nextId: 1, maxDepth: 0, nodeCount: 0 });
    const leafList = leaves(root);
    const meanImg = mean_image(leafList, w, h);
    const { psnr, mse } = calculate_psnr(img, meanImg);

    const inv1 = leafList.length === 1;
    const inv2 = Math.abs(leafList[0].mean - 140.0) < 1e-4;
    const inv3 = mse < 1e-6;

    results.push({
      id: 'test-1',
      name: '1. Image à intensité constante',
      description: 'Matrice 128×128 avec valeur uniforme 140.0. Aucune subdivision requise.',
      passed: inv1 && inv2 && inv3,
      durationMs: performance.now() - start,
      invariants: [
        { name: 'Arbre à feuille unique (pas de découpe superflue)', passed: inv1, detail: `Feuilles: ${leafList.length} (attendu: 1)` },
        { name: 'Moyenne exacte de la feuille', passed: inv2, detail: `Moyenne: ${leafList[0]?.mean.toFixed(2)}` },
        { name: 'Reconstruction parfaite (MSE=0, PSNR=∞)', passed: inv3, detail: `MSE: ${mse.toFixed(4)}, PSNR: ${isFinite(psnr) ? psnr.toFixed(1) + ' dB' : '∞'}` },
      ],
      metrics: { 'Feuilles': leafList.length, 'Profondeur': 0, 'MSE': mse.toFixed(6) }
    });
  }

  // 2. Image en dégradé continu (64x64)
  {
    const start = performance.now();
    const w = 64, h = 64;
    const img = new Float32Array(w * h);
    for (let r = 0; r < h; r++) {
      for (let c = 0; c < w; c++) {
        img[r * w + c] = (c / (w - 1)) * 255;
      }
    }
    const res = runSegmentationPipeline(img, w, h, { T: 15, min_size: 4, T_m: 10, criterion: 'std' });

    const inv1 = res.leaves.length > 1;
    const inv2 = res.mergeStats.finalRegions <= res.leaves.length;
    const inv3 = res.psnrDivision > 20.0;

    results.push({
      id: 'test-2',
      name: '2. Image en dégradé continu',
      description: 'Rampe linéaire horizontale 0-255 sur 64×64. Subdivision progressive.',
      passed: inv1 && inv2 && inv3,
      durationMs: performance.now() - start,
      invariants: [
        { name: 'Subdivision adaptée au gradient', passed: inv1, detail: `${res.leaves.length} feuilles créées` },
        { name: 'Régions finales ≤ Feuilles initiales', passed: inv2, detail: `Régions: ${res.mergeStats.finalRegions} ≤ ${res.leaves.length}` },
        { name: 'Fidélité de reconstruction acceptable', passed: inv3, detail: `PSNR: ${res.psnrDivision.toFixed(2)} dB (> 20 dB)` },
      ],
      metrics: { 'Feuilles': res.leaves.length, 'Régions': res.mergeStats.finalRegions, 'PSNR': `${res.psnrDivision.toFixed(2)} dB` }
    });
  }

  // 3. Image à fort contraste (Binaire 32x32 avec deux bandes)
  {
    const start = performance.now();
    const w = 32, h = 32;
    const img = new Float32Array(w * h);
    for (let r = 0; r < h; r++) {
      for (let c = 0; c < w; c++) {
        img[r * w + c] = r < 16 ? 255 : 0;
      }
    }
    const res = runSegmentationPipeline(img, w, h, { T: 5, min_size: 4, T_m: 15, criterion: 'std' });

    const inv1 = res.leaves.length === 4;
    const inv2 = res.mergeStats.finalRegions === 2; // Deux régions (haut 255 et bas 0)

    results.push({
      id: 'test-3',
      name: '3. Image à fort contraste (Deux bandes nettes)',
      description: 'Image 32×32 divisée en 4 quadrants (deux à 255, deux à 0).',
      passed: inv1 && inv2,
      durationMs: performance.now() - start,
      invariants: [
        { name: 'Division en 4 feuilles homogènes', passed: inv1, detail: `Feuilles: ${res.leaves.length} (attendu: 4)` },
        { name: 'Fusion exacte des quadrants adjacents de même intensité', passed: inv2, detail: `Régions finales: ${res.mergeStats.finalRegions} (attendu: 2)` },
      ],
      metrics: { 'Feuilles': res.leaves.length, 'Régions': res.mergeStats.finalRegions }
    });
  }

  // 4. Image non-carrée (73 x 115)
  {
    const start = performance.now();
    const w = 115, h = 73;
    const img = new Float32Array(w * h);
    for (let i = 0; i < img.length; i++) {
      img[i] = (i * 37) % 256;
    }
    const res = runSegmentationPipeline(img, w, h, { T: 25, min_size: 8, T_m: 15, criterion: 'std' });

    let areaSum = 0;
    let allInBounds = true;
    for (const leaf of res.leaves) {
      areaSum += leaf.h * leaf.w;
      if (leaf.r < 0 || leaf.c < 0 || leaf.r + leaf.h > h || leaf.c + leaf.w > w) {
        allInBounds = false;
      }
    }
    const inv1 = areaSum === w * h;
    const inv2 = allInBounds;
    const inv3 = res.labelMap.length === w * h;

    results.push({
      id: 'test-4',
      name: '4. Image non-carrée (73 × 115)',
      description: 'Dimensions rectangulaires arbitraires sans aucune déformation.',
      passed: inv1 && inv2 && inv3,
      durationMs: performance.now() - start,
      invariants: [
        { name: 'Conservation de la superficie totale', passed: inv1, detail: `Somme aires: ${areaSum} = ${w * h}` },
        { name: 'Confinement strict dans les limites', passed: inv2, detail: 'Toutes les feuilles restent dans le cadre' },
        { name: 'Dimensions de sortie conformes', passed: inv3, detail: `Taille matrice: ${res.labelMap.length} pixels` },
      ],
      metrics: { 'Dimensions': `${w}×${h}`, 'Feuilles': res.leaves.length, 'Régions': res.mergeStats.finalRegions }
    });
  }

  // 5. Dimensions impaires et exhaustivité des pixels (101 x 87)
  {
    const start = performance.now();
    const w = 87, h = 101;
    const img = new Float32Array(w * h);
    for (let i = 0; i < img.length; i++) {
      img[i] = (Math.sin(i) * 0.5 + 0.5) * 255;
    }
    const res = runSegmentationPipeline(img, w, h, { T: 20, min_size: 4, T_m: 12, criterion: 'std' });

    const pixelCover = new Int16Array(w * h);
    for (const leaf of res.leaves) {
      for (let r = leaf.r; r < leaf.r + leaf.h; r++) {
        for (let c = leaf.c; c < leaf.c + leaf.w; c++) {
          pixelCover[r * w + c]++;
        }
      }
    }

    let exactCoverage = true;
    for (let i = 0; i < pixelCover.length; i++) {
      if (pixelCover[i] !== 1) {
        exactCoverage = false;
        break;
      }
    }

    results.push({
      id: 'test-5',
      name: '5. Dimensions impaires (87 × 101)',
      description: 'Découpe exacte sans chevauchement ni pixel orphelin.',
      passed: exactCoverage,
      durationMs: performance.now() - start,
      invariants: [
        { name: 'Partition exacte (chaque pixel visité 1 fois)', passed: exactCoverage, detail: 'Aucun chevauchement ni vide' },
      ],
      metrics: { 'Pixels totaux': w * h, 'Feuilles': res.leaves.length }
    });
  }

  // 6. Image plus petite que min_size (3x3 avec min_size=8)
  {
    const start = performance.now();
    const w = 3, h = 3;
    const img = new Float32Array([10, 50, 90, 120, 150, 180, 210, 230, 255]);
    const res = runSegmentationPipeline(img, w, h, { T: 5, min_size: 8, T_m: 10, criterion: 'std' });

    const inv1 = res.leaves.length === 1;
    const inv2 = res.leaves[0].h === 3 && res.leaves[0].w === 3;

    results.push({
      id: 'test-6',
      name: '6. Image inférieure à min_size (3 × 3)',
      description: 'min_size = 8 > taille image. Doit s\'arrêter sans récursion infinie.',
      passed: inv1 && inv2,
      durationMs: performance.now() - start,
      invariants: [
        { name: 'Arrêt immédiat sans subdivision', passed: inv1, detail: `Feuilles: ${res.leaves.length} (attendu: 1)` },
        { name: 'Dimensions de la feuille préservées', passed: inv2, detail: `Feuille: ${res.leaves[0]?.w}×${res.leaves[0]?.h}` },
      ],
      metrics: { 'Feuilles': res.leaves.length, 'Régions': res.mergeStats.finalRegions }
    });
  }

  // 7. Texture bruitée (64x64 bruit aléatoire)
  {
    const start = performance.now();
    const w = 64, h = 64;
    const img = new Float32Array(w * h);
    // Bruit pseudo-aléatoire déterministe
    for (let i = 0; i < img.length; i++) {
      img[i] = Math.abs(Math.sin(i * 12.9898 + 78.233)) * 255;
    }
    const res = runSegmentationPipeline(img, w, h, { T: 10, min_size: 4, T_m: 35, criterion: 'std' });

    const inv1 = res.leaves.length > 50;
    const inv2 = res.mergeStats.finalRegions < res.leaves.length;

    results.push({
      id: 'test-7',
      name: '7. Texture bruitée à haute fréquence',
      description: 'Variance locale élevée causant un fort découpage en quadtree.',
      passed: inv1 && inv2,
      durationMs: performance.now() - start,
      invariants: [
        { name: 'Subdivision dense due à l\'hétérogénéité', passed: inv1, detail: `${res.leaves.length} feuilles générées` },
        { name: 'Agrégation efficace en fusion', passed: inv2, detail: `Réduction de ${res.mergeStats.eliminatedPercentage.toFixed(1)}% des régions` },
      ],
      metrics: { 'Feuilles': res.leaves.length, 'Régions après fusion': res.mergeStats.finalRegions, 'Réduction': `${res.mergeStats.eliminatedPercentage.toFixed(1)}%` }
    });
  }

  // 8. Bimodalité & Invariants Otsu (64x64)
  {
    const start = performance.now();
    const w = 64, h = 64;
    const img = new Float32Array(w * h);
    for (let r = 0; r < h; r++) {
      for (let c = 0; c < w; c++) {
        img[r * w + c] = r < 32 ? 40 : 210;
      }
    }
    const otsu = calculate_otsu(img, w, h);

    const inv1 = otsu.threshold >= 40 && otsu.threshold <= 210;
    let isPureBinary = true;
    for (let i = 0; i < otsu.binaryImage.length; i++) {
      const v = otsu.binaryImage[i];
      if (v !== 0 && v !== 255) {
        isPureBinary = false;
        break;
      }
    }

    results.push({
      id: 'test-8',
      name: '8. Image bimodale & Validation Otsu',
      description: 'Distribution bimodale distincte (40 et 210). Validation du seuil d\'Otsu.',
      passed: inv1 && isPureBinary,
      durationMs: performance.now() - start,
      invariants: [
        { name: 'Seuil optimal entre les deux pics', passed: inv1, detail: `Seuil calculé: ${otsu.threshold} (attendu: ~125)` },
        { name: 'Image strictement binaire {0, 255}', passed: isPureBinary, detail: 'Validation des valeurs de sortie' },
      ],
      metrics: { 'Seuil Otsu': otsu.threshold, 'Variance normalisée': otsu.normalizedVariance.toFixed(3) }
    });
  }

  return results;
}
