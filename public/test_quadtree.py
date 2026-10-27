"""
Tests automatisés pytest pour le module Quadtree TP1
Vérifie les 8 cas requis et tous les invariants algorithmiques.
"""

import numpy as np
import pytest
from tp1_quadtree import (
    Node, is_homogeneous, split, leaves, mean_image, merge, calculate_psnr, otsu_segmentation
)


def test_1_constant_image():
    """Image à intensité constante : l'arbre ne doit pas se diviser (1 seule feuille)."""
    img = np.full((128, 128), 120.0, dtype=np.float32)
    root = Node(0, 0, 128, 128)
    split(img, root, T=10, min_size=4)
    leaf_list = leaves(root)

    assert len(leaf_list) == 1
    assert leaf_list[0].mean == 120.0
    rec = mean_image(img, leaf_list)
    assert np.allclose(img, rec)
    assert calculate_psnr(img, rec) == float('inf')


def test_2_gradient_image():
    """Image en dégradé continu."""
    x = np.linspace(0, 255, 64)
    img = np.tile(x, (64, 1)).astype(np.float32)
    root = Node(0, 0, 64, 64)
    split(img, root, T=15, min_size=4)
    leaf_list = leaves(root)
    assert len(leaf_list) > 1

    rec = mean_image(img, leaf_list)
    assert rec.shape == (64, 64)
    psnr_val = calculate_psnr(img, rec)
    assert psnr_val > 20.0


def test_3_high_contrast_stripes():
    """Image à fort contraste binaire avec bandes nettes."""
    img = np.zeros((32, 32), dtype=np.float32)
    img[:16, :] = 255.0  # Haut = 255
    img[16:, :] = 0.0    # Bas = 0
    root = Node(0, 0, 32, 32)
    split(img, root, T=5, min_size=4)
    leaf_list = leaves(root)

    # Doit isoler les 4 quadrants de 16x16
    assert len(leaf_list) == 4
    merged, labels, reg_count = merge(img, leaf_list, T_m=10)
    # Les deux quadrants du haut (255) fusionnent entre eux, les deux du bas (0) fusionnent entre eux
    assert reg_count == 2  # 2 régions finales (haut et bas)


def test_4_non_square_image():
    """Image non carrée (rectangulaire)."""
    img = np.random.uniform(50, 200, (73, 115)).astype(np.float32)
    root = Node(0, 0, 73, 115)
    split(img, root, T=20, min_size=8)
    leaf_list = leaves(root)

    # Invariant : somme des aires égale l'aire totale
    total_area = sum(leaf.h * leaf.w for leaf in leaf_list)
    assert total_area == 73 * 115

    merged, labels, reg_count = merge(img, leaf_list, T_m=15)
    assert merged.shape == (73, 115)
    assert labels.shape == (73, 115)
    assert reg_count <= len(leaf_list)


def test_5_odd_dimensions_invariants():
    """Image de dimensions impaires sans perte de pixels."""
    img = np.random.uniform(0, 255, (101, 87)).astype(np.float32)
    root = Node(0, 0, 101, 87)
    split(img, root, T=25, min_size=4)
    leaf_list = leaves(root)

    pixel_coverage = np.zeros((101, 87), dtype=int)
    for leaf in leaf_list:
        assert leaf.r >= 0 and leaf.r + leaf.h <= 101
        assert leaf.c >= 0 and leaf.c + leaf.w <= 87
        pixel_coverage[leaf.r:leaf.r + leaf.h, leaf.c:leaf.c + leaf.w] += 1

    # Chaque pixel doit être couvert exactement 1 fois
    assert np.all(pixel_coverage == 1)


def test_6_smaller_than_min_size():
    """Image plus petite que min_size."""
    img = np.array([[10, 20], [30, 40]], dtype=np.float32)
    root = Node(0, 0, 2, 2)
    split(img, root, T=5, min_size=8)
    leaf_list = leaves(root)

    assert len(leaf_list) == 1
    assert leaf_list[0].h == 2 and leaf_list[0].w == 2


def test_7_noisy_texture():
    """Texture bruitée gaussienne."""
    np.random.seed(42)
    img = np.random.normal(128, 30, (64, 64)).astype(np.float32)
    img = np.clip(img, 0, 255)

    root = Node(0, 0, 64, 64)
    split(img, root, T=10, min_size=4)
    leaf_list = leaves(root)

    # Beaucoup de feuilles à cause de la variance élevée
    assert len(leaf_list) > 30

    # Fusion avec seuil large
    merged, labels, reg_count = merge(img, leaf_list, T_m=20)
    assert reg_count < len(leaf_list)


def test_8_otsu_and_invariants():
    """Test de segmentation Otsu et invariants généraux."""
    img = np.zeros((50, 50), dtype=np.float32)
    img[:25, :] = 50.0
    img[25:, :] = 200.0

    binary, thresh = otsu_segmentation(img)
    assert 50 < thresh < 200
    assert set(np.unique(binary)).issubset({0, 255})
