/**
 * Quadtree Image Segmentation Engine (Division récursive & Fusion Union-Find)
 * Implémentation pure TypeScript haute performance pour navigateur et tests.
 */

export interface QuadNode {
  id: number;
  r: number; // Rangée du coin supérieur gauche
  c: number; // Colonne du coin supérieur gauche
  h: number; // Hauteur du bloc
  w: number; // Largeur du bloc
  depth: number;
  children: QuadNode[];
  mean: number;
  std: number;
  minVal: number;
  maxVal: number;
  isLeaf: boolean;
}

export type HomogeneityCriterion = 'std' | 'range';

export interface SegmentationParams {
  T: number;
  min_size: number;
  T_m: number;
  criterion: HomogeneityCriterion;
}

export interface DivisionStats {
  leafCount: number;
  nodeCount: number;
  maxDepth: number;
  minLeafSize: number;
  divisionTimeMs: number;
}

export interface MergeStats {
  initialLeaves: number;
  finalRegions: number;
  mergedCount: number;
  eliminatedPercentage: number;
  mergeTimeMs: number;
}

export interface SegmentationResult {
  params: SegmentationParams;
  imageWidth: number;
  imageHeight: number;
  root: QuadNode;
  leaves: QuadNode[];
  meanImage: Float32Array;
  mergedMeanImage: Float32Array;
  labelMap: Int32Array; // Indice de région finale par pixel
  regionColorMap: Uint8ClampedArray; // RGBA pour chaque pixel
  divisionStats: DivisionStats;
  mergeStats: MergeStats;
  psnrDivision: number;
  psnrMerged: number;
  mseDivision: number;
  mseMerged: number;
  totalTimeMs: number;
}

export interface OtsuResult {
  threshold: number;
  binaryImage: Uint8ClampedArray; // 0 ou 255
  histogram: number[]; // 256 bins
  normalizedVariance: number;
  otsuTimeMs: number;
}

/**
 * Calcule les statistiques d'un bloc (moyenne, écart-type, min, max)
 */
export function computeBlockStats(
  img: Float32Array,
  imgW: number,
  r: number,
  c: number,
  h: number,
  w: number
): { mean: number; std: number; minVal: number; maxVal: number } {
  let sum = 0;
  let sumSq = 0;
  let minVal = Infinity;
  let maxVal = -Infinity;
  const count = h * w;

  if (count <= 0) {
    return { mean: 0, std: 0, minVal: 0, maxVal: 0 };
  }

  for (let row = r; row < r + h; row++) {
    const rowOffset = row * imgW;
    for (let col = c; col < c + w; col++) {
      const val = img[rowOffset + col];
      sum += val;
      sumSq += val * val;
      if (val < minVal) minVal = val;
      if (val > maxVal) maxVal = val;
    }
  }

  const mean = sum / count;
  // Variance = E[X^2] - (E[X])^2 avec protection contre les arrondis négatifs
  const variance = Math.max(0, sumSq / count - mean * mean);
  const std = Math.sqrt(variance);

  return { mean, std, minVal, maxVal };
}

/**
 * Critère d'homogénéité selon le TP :
 * - std: std(block) <= T
 * - range: max(block) - min(block) <= T
 */
export function is_homogeneous(
  stats: { std: number; minVal: number; maxVal: number },
  T: number,
  criterion: HomogeneityCriterion = 'std'
): boolean {
  if (criterion === 'std') {
    return stats.std <= T;
  } else {
    return stats.maxVal - stats.minVal <= T;
  }
}

/**
 * Division récursive de l'arbre Quadtree
 * Respecte les découpes arbitraires et sans perte de pixels (dimensions impaires gérées)
 */
export function split(
  img: Float32Array,
  imgW: number,
  imgH: number,
  node: QuadNode,
  T: number,
  min_size: number,
  criterion: HomogeneityCriterion,
  state: { nextId: number; maxDepth: number; nodeCount: number }
): void {
  state.nodeCount++;
  if (node.depth > state.maxDepth) {
    state.maxDepth = node.depth;
  }

  // 1. Calcul des statistiques
  const stats = computeBlockStats(img, imgW, node.r, node.c, node.h, node.w);
  node.mean = stats.mean;
  node.std = stats.std;
  node.minVal = stats.minVal;
  node.maxVal = stats.maxVal;

  // 2. Si homogène -> feuille
  if (is_homogeneous(stats, T, criterion)) {
    node.isLeaf = true;
    return;
  }

  // 3. Si taille minimale atteinte ou bloc indivisible -> arrêt
  if (node.h <= min_size || node.w <= min_size || node.h <= 1 || node.w <= 1) {
    node.isLeaf = true;
    return;
  }

  // 4. Découpage en 4 quadrants (NO, NE, SO, SE) avec gestion exacte des dimensions impaires
  const h1 = Math.floor(node.h / 2);
  const h2 = node.h - h1;
  const w1 = Math.floor(node.w / 2);
  const w2 = node.w - w1;

  if (h1 <= 0 || w1 <= 0 || h2 <= 0 || w2 <= 0) {
    node.isLeaf = true;
    return;
  }

  const depth = node.depth + 1;

  // NO: Nord-Ouest
  const no: QuadNode = {
    id: state.nextId++,
    r: node.r,
    c: node.c,
    h: h1,
    w: w1,
    depth,
    children: [],
    mean: 0,
    std: 0,
    minVal: 0,
    maxVal: 0,
    isLeaf: false,
  };

  // NE: Nord-Est
  const ne: QuadNode = {
    id: state.nextId++,
    r: node.r,
    c: node.c + w1,
    h: h1,
    w: w2,
    depth,
    children: [],
    mean: 0,
    std: 0,
    minVal: 0,
    maxVal: 0,
    isLeaf: false,
  };

  // SO: Sud-Ouest
  const so: QuadNode = {
    id: state.nextId++,
    r: node.r + h1,
    c: node.c,
    h: h2,
    w: w1,
    depth,
    children: [],
    mean: 0,
    std: 0,
    minVal: 0,
    maxVal: 0,
    isLeaf: false,
  };

  // SE: Sud-Est
  const se: QuadNode = {
    id: state.nextId++,
    r: node.r + h1,
    c: node.c + w1,
    h: h2,
    w: w2,
    depth,
    children: [],
    mean: 0,
    std: 0,
    minVal: 0,
    maxVal: 0,
    isLeaf: false,
  };

  node.children = [no, ne, so, se];

  // Récursion
  split(img, imgW, imgH, no, T, min_size, criterion, state);
  split(img, imgW, imgH, ne, T, min_size, criterion, state);
  split(img, imgW, imgH, so, T, min_size, criterion, state);
  split(img, imgW, imgH, se, T, min_size, criterion, state);
}

/**
 * Récupère la liste de toutes les feuilles de l'arbre
 */
export function leaves(root: QuadNode): QuadNode[] {
  const result: QuadNode[] = [];
  function traverse(n: QuadNode) {
    if (n.isLeaf || n.children.length === 0) {
      result.push(n);
    } else {
      for (const child of n.children) {
        traverse(child);
      }
    }
  }
  traverse(root);
  return result;
}

/**
 * Construit l'image moyenne des feuilles du quadtree
 */
export function mean_image(
  leaf_list: QuadNode[],
  width: number,
  height: number
): Float32Array {
  const output = new Float32Array(width * height);
  for (const leaf of leaf_list) {
    const val = leaf.mean;
    for (let r = leaf.r; r < leaf.r + leaf.h; r++) {
      const rowOffset = r * width;
      for (let c = leaf.c; c < leaf.c + leaf.w; c++) {
        output[rowOffset + c] = val;
      }
    }
  }
  return output;
}

/**
 * Structure Disjoint-Set Union-Find avec compression de chemin
 * et mise à jour de la moyenne pondérée par la superficie (nombre de pixels)
 */
class UnionFind {
  parent: Int32Array;
  size: Int32Array; // Nombre de pixels dans la région
  sumIntensity: Float64Array; // Somme des intensités des pixels dans la région

  constructor(n: number, leafList: QuadNode[]) {
    this.parent = new Int32Array(n);
    this.size = new Int32Array(n);
    this.sumIntensity = new Float64Array(n);

    for (let i = 0; i < n; i++) {
      this.parent[i] = i;
      const count = leafList[i].h * leafList[i].w;
      this.size[i] = count;
      this.sumIntensity[i] = leafList[i].mean * count;
    }
  }

  find(i: number): number {
    let root = i;
    while (root !== this.parent[root]) {
      root = this.parent[root];
    }
    // Compression de chemin
    let curr = i;
    while (curr !== root) {
      const next = this.parent[curr];
      this.parent[curr] = root;
      curr = next;
    }
    return root;
  }

  getMean(root: number): number {
    const s = this.size[root];
    return s > 0 ? this.sumIntensity[root] / s : 0;
  }

  union(i: number, j: number): boolean {
    const rootA = this.find(i);
    const rootB = this.find(j);
    if (rootA === rootB) return false;

    // Union par taille
    if (this.size[rootA] >= this.size[rootB]) {
      this.parent[rootB] = rootA;
      this.size[rootA] += this.size[rootB];
      this.sumIntensity[rootA] += this.sumIntensity[rootB];
    } else {
      this.parent[rootA] = rootB;
      this.size[rootB] += this.size[rootA];
      this.sumIntensity[rootB] += this.sumIntensity[rootA];
    }
    return true;
  }
}

/**
 * Algorithme de fusion de régions (Merge)
 * Conforme au cahier des charges TP1 :
 * - Carte de labels initiale
 * - Voisins partageant une arête horizontale ou verticale (pas de diagonale)
 * - Tri des paires par différence de moyenne initiale
 * - Comparaison des moyennes RÉELLES des régions au moment de la fusion : abs(mean(A) - mean(B)) <= T_m
 * - Mise à jour de la moyenne pondérée
 */
export function merge(
  leaf_list: QuadNode[],
  width: number,
  height: number,
  T_m: number
): {
  mergedMeanImage: Float32Array;
  labelMap: Int32Array;
  regionColorMap: Uint8ClampedArray;
  finalRegions: number;
} {
  const numLeaves = leaf_list.length;
  if (numLeaves === 0) {
    return {
      mergedMeanImage: new Float32Array(width * height),
      labelMap: new Int32Array(width * height),
      regionColorMap: new Uint8ClampedArray(width * height * 4),
      finalRegions: 0,
    };
  }

  // 1. Carte de labels initiale pixel -> index de feuille
  const initialMap = new Int32Array(width * height);
  for (let i = 0; i < numLeaves; i++) {
    const leaf = leaf_list[i];
    for (let r = leaf.r; r < leaf.r + leaf.h; r++) {
      const rowOffset = r * width;
      for (let c = leaf.c; c < leaf.c + leaf.w; c++) {
        initialMap[rowOffset + c] = i;
      }
    }
  }

  // 2. Détection des paires adjacentes (horizontal et vertical)
  // Utilisation d'un ensemble de paires uniques (u < v)
  const pairSet = new Set<number>();
  const addPair = (u: number, v: number) => {
    if (u === v) return;
    const min = u < v ? u : v;
    const max = u < v ? v : u;
    // Encodage 32-bit unique pour min < 65536 et max < 65536
    // Pour gérer les grands nombres de feuilles :
    // (u << 20) + v si < 1M
    pairSet.add(min * 1000000 + max);
  };

  for (let r = 0; r < height; r++) {
    const rowOffset = r * width;
    for (let c = 0; c < width; c++) {
      const curr = initialMap[rowOffset + c];
      // Voisin droit (horizontal)
      if (c + 1 < width) {
        const right = initialMap[rowOffset + c + 1];
        if (curr !== right) addPair(curr, right);
      }
      // Voisin bas (vertical)
      if (r + 1 < height) {
        const down = initialMap[(r + 1) * width + c];
        if (curr !== down) addPair(curr, down);
      }
    }
  }

  // 3. Liste des paires avec différence de moyenne
  interface EdgePair {
    u: number;
    v: number;
    diff: number;
  }
  const pairs: EdgePair[] = [];
  pairSet.forEach((key) => {
    const min = Math.floor(key / 1000000);
    const max = key % 1000000;
    const diff = Math.abs(leaf_list[min].mean - leaf_list[max].mean);
    pairs.push({ u: min, v: max, diff });
  });

  // Tri croissant selon la différence de moyenne
  pairs.sort((a, b) => a.diff - b.diff);

  // 4. Union-Find
  const uf = new UnionFind(numLeaves, leaf_list);

  for (const pair of pairs) {
    const rootA = uf.find(pair.u);
    const rootB = uf.find(pair.v);
    if (rootA === rootB) continue;

    // Comparaison des moyennes ACTUELLES des deux régions
    const meanA = uf.getMean(rootA);
    const meanB = uf.getMean(rootB);
    if (Math.abs(meanA - meanB) <= T_m) {
      uf.union(rootA, rootB);
    }
  }

  // 5. Normalisation des régions finales
  const rootToRegionId = new Map<number, number>();
  let nextRegionId = 0;

  for (let i = 0; i < numLeaves; i++) {
    const root = uf.find(i);
    if (!rootToRegionId.has(root)) {
      rootToRegionId.set(root, nextRegionId++);
    }
  }
  const finalRegionsCount = nextRegionId;

  // Calcul des moyennes finales par région
  const finalRegionMeans = new Float32Array(finalRegionsCount);
  rootToRegionId.forEach((regId, root) => {
    finalRegionMeans[regId] = uf.getMean(root);
  });

  // Génération de la palette de couleurs distinctes pour la visualisation des labels
  // On utilise le Golden Ratio HSV pour espacer au maximum les teintes adjacentes
  const regionColors = generateDistinctPalette(finalRegionsCount);

  const mergedMeanImage = new Float32Array(width * height);
  const labelMap = new Int32Array(width * height);
  const regionColorMap = new Uint8ClampedArray(width * height * 4);

  for (let i = 0; i < numLeaves; i++) {
    const leaf = leaf_list[i];
    const root = uf.find(i);
    const regId = rootToRegionId.get(root)!;
    const meanVal = finalRegionMeans[regId];
    const [colorR, colorG, colorB] = regionColors[regId % regionColors.length];

    for (let r = leaf.r; r < leaf.r + leaf.h; r++) {
      const rowOffset = r * width;
      for (let c = leaf.c; c < leaf.c + leaf.w; c++) {
        const idx = rowOffset + c;
        mergedMeanImage[idx] = meanVal;
        labelMap[idx] = regId;

        const rgbaIdx = idx * 4;
        regionColorMap[rgbaIdx] = colorR;
        regionColorMap[rgbaIdx + 1] = colorG;
        regionColorMap[rgbaIdx + 2] = colorB;
        regionColorMap[rgbaIdx + 3] = 255;
      }
    }
  }

  return {
    mergedMeanImage,
    labelMap,
    regionColorMap,
    finalRegions: finalRegionsCount,
  };
}

/**
 * Génère une palette de couleurs contrastées pour la carte des régions
 */
export function generateDistinctPalette(count: number): [number, number, number][] {
  const palette: [number, number, number][] = [];
  const goldenRatio = 0.618033988749895;
  let h = 0.15; // Point de départ cyan/bleu scientifique

  for (let i = 0; i < count; i++) {
    h = (h + goldenRatio) % 1.0;
    // Saturation et luminosité dynamiques pour un rendu clair et scientifique
    const s = 0.65 + 0.25 * ((i % 3) / 2);
    const v = 0.8 + 0.15 * ((i % 2) / 1);

    // Conversion HSV -> RGB
    const iH = Math.floor(h * 6);
    const f = h * 6 - iH;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);

    let r = 0, g = 0, b = 0;
    switch (iH % 6) {
      case 0: r = v; g = t; b = p; break;
      case 1: r = q; g = v; b = p; break;
      case 2: r = p; g = v; b = t; break;
      case 3: r = p; g = q; b = v; break;
      case 4: r = t; g = p; b = v; break;
      case 5: r = v; g = p; b = q; break;
    }

    palette.push([
      Math.round(r * 255),
      Math.round(g * 255),
      Math.round(b * 255),
    ]);
  }

  return palette;
}

/**
 * Calcul du MSE et PSNR entre l'image originale et l'image reconstruite
 */
export function calculate_psnr(
  original: Float32Array,
  reconstructed: Float32Array
): { mse: number; psnr: number } {
  let sumSqErr = 0;
  const len = original.length;
  if (len === 0) return { mse: 0, psnr: Infinity };

  for (let i = 0; i < len; i++) {
    const err = original[i] - reconstructed[i];
    sumSqErr += err * err;
  }

  const mse = sumSqErr / len;
  if (mse <= 1e-10) {
    return { mse: 0, psnr: Infinity };
  }

  const psnr = 10 * Math.log10((255 * 255) / mse);
  return { mse, psnr };
}

/**
 * Algorithme de seuillage d'Otsu
 * Maximise la variance inter-classe pour trouver le seuil global optimal
 */
export function calculate_otsu(
  img: Float32Array,
  width: number,
  height: number
): OtsuResult {
  const startTime = performance.now();
  const totalPixels = width * height;
  const histogram = new Array(256).fill(0);

  // Construction de l'histogramme
  for (let i = 0; i < totalPixels; i++) {
    const val = Math.max(0, Math.min(255, Math.round(img[i])));
    histogram[val]++;
  }

  let sumAll = 0;
  for (let t = 0; t < 256; t++) {
    sumAll += t * histogram[t];
  }

  let w0 = 0;
  let sum0 = 0;
  let maxVarBetween = -1;
  let optimalThreshold = 128;

  for (let t = 0; t < 256; t++) {
    w0 += histogram[t];
    if (w0 === 0) continue;
    const w1 = totalPixels - w0;
    if (w1 === 0) break;

    sum0 += t * histogram[t];
    const m0 = sum0 / w0;
    const m1 = (sumAll - sum0) / w1;

    // Variance inter-classe : w0 * w1 * (m0 - m1)^2
    const varBetween = w0 * w1 * (m0 - m1) * (m0 - m1);

    if (varBetween > maxVarBetween) {
      maxVarBetween = varBetween;
      optimalThreshold = t;
    }
  }

  // Création de l'image binaire résultante
  const binaryImage = new Uint8ClampedArray(totalPixels);
  for (let i = 0; i < totalPixels; i++) {
    binaryImage[i] = img[i] >= optimalThreshold ? 255 : 0;
  }

  const otsuTimeMs = performance.now() - startTime;

  return {
    threshold: optimalThreshold,
    binaryImage,
    histogram,
    normalizedVariance: maxVarBetween / (totalPixels * totalPixels),
    otsuTimeMs,
  };
}

/**
 * Exécute le pipeline complet de segmentation Quadtree (Division + Fusion)
 */
export function runSegmentationPipeline(
  img: Float32Array,
  width: number,
  height: number,
  params: SegmentationParams
): SegmentationResult {
  const overallStart = performance.now();

  // 1. Division récursive
  const divStart = performance.now();
  const root: QuadNode = {
    id: 0,
    r: 0,
    c: 0,
    h: height,
    w: width,
    depth: 0,
    children: [],
    mean: 0,
    std: 0,
    minVal: 0,
    maxVal: 0,
    isLeaf: false,
  };

  const splitState = { nextId: 1, maxDepth: 0, nodeCount: 0 };
  split(img, width, height, root, params.T, params.min_size, params.criterion, splitState);
  const leafList = leaves(root);
  const divTime = performance.now() - divStart;

  // Trouver la taille minimale de feuille
  let minLeafSize = Infinity;
  for (const leaf of leafList) {
    const s = Math.min(leaf.w, leaf.h);
    if (s < minLeafSize) minLeafSize = s;
  }
  if (minLeafSize === Infinity) minLeafSize = 0;

  // 2. Image moyenne de la division
  const meanImage = mean_image(leafList, width, height);
  const { mse: mseDivision, psnr: psnrDivision } = calculate_psnr(img, meanImage);

  // 3. Fusion de régions (Merge)
  const mergeStart = performance.now();
  const mergeRes = merge(leafList, width, height, params.T_m);
  const mergeTime = performance.now() - mergeStart;

  const { mse: mseMerged, psnr: psnrMerged } = calculate_psnr(img, mergeRes.mergedMeanImage);

  const totalTime = performance.now() - overallStart;

  const eliminatedCount = leafList.length - mergeRes.finalRegions;
  const eliminatedPercentage = leafList.length > 0 ? (eliminatedCount / leafList.length) * 100 : 0;

  return {
    params,
    imageWidth: width,
    imageHeight: height,
    root,
    leaves: leafList,
    meanImage,
    mergedMeanImage: mergeRes.mergedMeanImage,
    labelMap: mergeRes.labelMap,
    regionColorMap: mergeRes.regionColorMap,
    divisionStats: {
      leafCount: leafList.length,
      nodeCount: splitState.nodeCount,
      maxDepth: splitState.maxDepth,
      minLeafSize,
      divisionTimeMs: divTime,
    },
    mergeStats: {
      initialLeaves: leafList.length,
      finalRegions: mergeRes.finalRegions,
      mergedCount: eliminatedCount,
      eliminatedPercentage,
      mergeTimeMs: mergeTime,
    },
    psnrDivision,
    psnrMerged,
    mseDivision,
    mseMerged,
    totalTimeMs: totalTime,
  };
}
