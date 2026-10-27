"""
TP1 : Segmentation d'image par Quadtree (Divide and Merge)
Université — Vision par Ordinateur & Traitement d'Images

Ce module implémente fidèlement les étapes requises par le TP :
1. Conversion en niveaux de gris flottants [0, 255]
2. Classe Node et division récursive de l'arbre quadtree
3. Critères d'homogénéité (écart-type 'std' ou étendue 'range')
4. Construction de l'image moyenne
5. Fusion de régions (Merge) par Union-Find avec moyenne pondérée
6. Seuillage d'Otsu
7. Calcul du PSNR et MSE
"""

import math
import numpy as np
from PIL import Image
from skimage.filters import threshold_otsu


class Node:
    """
    Représente un nœud dans l'arbre Quadtree.
    
    Attributs:
        r: rangée (y) du coin supérieur gauche
        c: colonne (x) du coin supérieur gauche
        h: hauteur du bloc
        w: largeur du bloc
        depth: profondeur dans l'arbre (0 pour la racine)
        children: liste des 4 quadrants [NO, NE, SO, SE] ou vide si feuille
        mean: intensité moyenne des pixels dans le bloc
    """
    def __init__(self, r: int, c: int, h: int, w: int, depth: int = 0):
        self.r = r
        self.c = c
        self.h = h
        self.w = w
        self.depth = depth
        self.children = []
        self.mean = 0.0
        self.is_leaf = False

    def __repr__(self):
        return f"Node(r={self.r}, c={self.c}, h={self.h}, w={self.w}, depth={self.depth}, mean={self.mean:.2f})"


def load_grayscale_image(path: str) -> np.ndarray:
    """
    Charge une image depuis le disque et la convertit en matrice flottante [0, 255].
    """
    with Image.open(path) as img:
        img_gray = img.convert('L')
        return np.array(img_gray, dtype=np.float32)


def is_homogeneous(block: np.ndarray, T: float, criterion: str = 'std') -> bool:
    """
    Évalue si un bloc de pixels est homogène selon le seuil T.
    
    Critères disponibles :
    - 'std' : écart-type(block) <= T
    - 'range' : max(block) - min(block) <= T
    """
    if block.size == 0:
        return True
    
    if criterion == 'std':
        return float(np.std(block)) <= T
    elif criterion == 'range':
        return float(np.max(block) - np.min(block)) <= T
    else:
        raise ValueError(f"Critère inconnu '{criterion}'. Utiliser 'std' ou 'range'.")


def split(img: np.ndarray, node: Node, T: float, min_size: int = 4, criterion: str = 'std') -> None:
    """
    Division récursive de l'arbre quadtree.
    
    Pour chaque bloc :
    1. Calcule la moyenne et vérifie l'homogénéité.
    2. Si homogène ou si min_size atteint, marque comme feuille.
    3. Sinon, découpe en 4 quadrants (NO, NE, SO, SE) sans décalage.
    """
    block = img[node.r:node.r + node.h, node.c:node.c + node.w]
    node.mean = float(np.mean(block)) if block.size > 0 else 0.0

    # 1. Vérification de l'homogénéité
    if is_homogeneous(block, T, criterion=criterion):
        node.is_leaf = True
        return

    # 2. Condition d'arrêt sur la taille minimale
    if node.h <= min_size or node.w <= min_size or node.h <= 1 or node.w <= 1:
        node.is_leaf = True
        return

    # 3. Découpage en 4 quadrants (gestion des dimensions impaires)
    h1 = node.h // 2
    h2 = node.h - h1
    w1 = node.w // 2
    w2 = node.w - w1

    if h1 == 0 or w1 == 0 or h2 == 0 or w2 == 0:
        node.is_leaf = True
        return

    depth = node.depth + 1
    no = Node(node.r, node.c, h1, w1, depth=depth)
    ne = Node(node.r, node.c + w1, h1, w2, depth=depth)
    so = Node(node.r + h1, node.c, h2, w1, depth=depth)
    se = Node(node.r + h1, node.c + w1, h2, w2, depth=depth)

    node.children = [no, ne, so, se]

    # Récursion sur chaque quadrant
    for child in node.children:
        split(img, child, T, min_size=min_size, criterion=criterion)


def leaves(node: Node) -> list[Node]:
    """
    Récupère la liste de toutes les feuilles de l'arbre quadtree.
    """
    leaf_list = []
    
    def traverse(curr: Node):
        if curr.is_leaf or len(curr.children) == 0:
            leaf_list.append(curr)
        else:
            for child in curr.children:
                traverse(child)

    traverse(node)
    return leaf_list


def mean_image(img: np.ndarray, leaf_list: list[Node]) -> np.ndarray:
    """
    Construit l'image moyenne en remplissant chaque feuille avec sa moyenne d'intensité.
    """
    output = np.zeros_like(img, dtype=np.float32)
    for leaf in leaf_list:
        output[leaf.r:leaf.r + leaf.h, leaf.c:leaf.c + leaf.w] = leaf.mean
    return output


class UnionFind:
    """
    Structure Union-Find pour la fusion des régions avec compression de chemin
    et maintien de la moyenne pondérée par le nombre de pixels.
    """
    def __init__(self, n: int, leaf_list: list[Node]):
        self.parent = list(range(n))
        self.size = [leaf.h * leaf.w for leaf in leaf_list]
        self.sum_intensity = [leaf.mean * (leaf.h * leaf.w) for leaf in leaf_list]

    def find(self, i: int) -> int:
        root = i
        while root != self.parent[root]:
            root = self.parent[root]
        # Compression de chemin
        curr = i
        while curr != root:
            nxt = self.parent[curr]
            self.parent[curr] = root
            curr = nxt
        return root

    def get_mean(self, root: int) -> float:
        s = self.size[root]
        return self.sum_intensity[root] / s if s > 0 else 0.0

    def union(self, i: int, j: int) -> bool:
        root_a = self.find(i)
        root_b = self.find(j)
        if root_a == root_b:
            return False

        # Union par taille
        if self.size[root_a] >= self.size[root_b]:
            self.parent[root_b] = root_a
            self.size[root_a] += self.size[root_b]
            self.sum_intensity[root_a] += self.sum_intensity[root_b]
        else:
            self.parent[root_a] = root_b
            self.size[root_b] += self.size[root_a]
            self.sum_intensity[root_b] += self.sum_intensity[root_a]
        return True


def merge(img: np.ndarray, leaf_list: list[Node], T_m: float) -> tuple[np.ndarray, np.ndarray, int]:
    """
    Fusionne les régions adjacentes similaires selon le seuil T_m.
    
    Retourne:
        - merged_img : Image remplie par les moyennes des régions finales
        - label_map : Carte matricielle des labels de régions entières
        - final_regions_count : Nombre de régions après fusion
    """
    h, w = img.shape
    num_leaves = len(leaf_list)
    if num_leaves == 0:
        return np.zeros_like(img), np.zeros((h, w), dtype=np.int32), 0

    # 1. Carte de labels initiale
    label_map_init = np.zeros((h, w), dtype=np.int32)
    for idx, leaf in enumerate(leaf_list):
        label_map_init[leaf.r:leaf.r + leaf.h, leaf.c:leaf.c + leaf.w] = idx

    # 2. Voisins partageant une arête horizontale ou verticale
    pair_set = set()
    for r in range(h):
        for c in range(w):
            curr = label_map_init[r, c]
            if c + 1 < w:
                right = label_map_init[r, c + 1]
                if curr != right:
                    pair_set.add((min(curr, right), max(curr, right)))
            if r + 1 < h:
                down = label_map_init[r + 1, c]
                if curr != down:
                    pair_set.add((min(curr, down), max(curr, down)))

    # 3. Tri des paires par différence de moyenne initiale croissante
    pairs = list(pair_set)
    pairs.sort(key=lambda p: abs(leaf_list[p[0]].mean - leaf_list[p[1]].mean))

    # 4. Fusion avec Union-Find
    uf = UnionFind(num_leaves, leaf_list)
    for u, v in pairs:
        root_a = uf.find(u)
        root_b = uf.find(v)
        if root_a == root_b:
            continue
        
        # Comparaison des moyennes ACTUELLES des deux régions
        mean_a = uf.get_mean(root_a)
        mean_b = uf.get_mean(root_b)
        if abs(mean_a - mean_b) <= T_m:
            uf.union(root_a, root_b)

    # 5. Construction de l'image résultat et des labels finaux
    root_to_id = {}
    next_id = 0
    for i in range(num_leaves):
        root = uf.find(i)
        if root not in root_to_id:
            root_to_id[root] = next_id
            next_id += 1

    final_regions_count = next_id
    final_means = {reg_id: uf.get_mean(root) for root, reg_id in root_to_id.items()}

    merged_img = np.zeros((h, w), dtype=np.float32)
    label_map = np.zeros((h, w), dtype=np.int32)

    for i, leaf in enumerate(leaf_list):
        root = uf.find(i)
        reg_id = root_to_id[root]
        mean_val = final_means[reg_id]
        merged_img[leaf.r:leaf.r + leaf.h, leaf.c:leaf.c + leaf.w] = mean_val
        label_map[leaf.r:leaf.r + leaf.h, leaf.c:leaf.c + leaf.w] = reg_id

    return merged_img, label_map, final_regions_count


def calculate_psnr(original: np.ndarray, reconstructed: np.ndarray) -> float:
    """
    Calcule le PSNR (Peak Signal-to-Noise Ratio) en décibels.
    """
    mse = float(np.mean((original - reconstructed) ** 2))
    if mse == 0.0:
        return float('inf')
    return float(10 * math.log10((255.0 ** 2) / mse))


def otsu_segmentation(img: np.ndarray) -> tuple[np.ndarray, float]:
    """
    Applique le seuillage global d'Otsu et retourne l'image binaire et le seuil calculé.
    """
    thresh = float(threshold_otsu(img))
    binary = (img >= thresh).astype(np.uint8) * 255
    return binary, thresh


if __name__ == '__main__':
    print("TP1 Quadtree Image Segmentation Module prêt.")
