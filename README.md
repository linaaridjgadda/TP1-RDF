# Quadtree Image Segmentation Studio (TP1: Division & Fusion)

Application web interactive de segmentation d'images par **Quadtree (Divide and Merge)** avec comparaison **Otsu**, banc d'expérimentation paramétrique et générateur de rapport universitaire.

Conforme aux spécifications du **TP1 : Image Segmentation by Quadtree — Divide and Merge**.

---

## Fonctionnalités principales

1. **Chargement et prétraitement d'images** :
   - Supporte tout format d'image (JPG, PNG, WEBP, BMP) de dimensions arbitraires (non carrées, impaires, etc.).
   - 4 images de référence académiques incluses (*Cameraman MIT*, *Façade géométrique*, *Texture d'herbe haute fréquence*, *Formes géométriques étalonnées*).
   - Normalisation en niveaux de gris flottants ITU-R BT.601 [0.0, 255.0].

2. **Division récursive par Quadtree** :
   - Classe `Node` avec coordonnées `(r, c)`, dimensions `(h, w)`, profondeur, moyenne locale et enfants `[NO, NE, SO, SE]`.
   - Deux critères d'homogénéité configurables :
     - Écart-type : $\text{std}(\text{bloc}) \le T$
     - Étendue d'intensité : $\max(\text{bloc}) - \min(\text{bloc}) \le T$
   - Arrêt automatique dès qu'un bloc est homogène ou que $\min(w, h) \le \text{min\_size}$.
   - Découpe dyadique exacte sans chevauchement ni omission de pixels sur les dimensions impaires.

3. **Visualisation multi-modes** :
   - Image originale en niveaux de gris.
   - Superposition des bordures du quadtree (couleur et opacité paramétrables).
   - Image moyenne de la division.
   - Image moyenne après fusion.
   - Carte de pseudo-couleurs des labels de régions (palette contrastée par nombre d'or).
   - Curseur interactif *Avant / Après* (Split compare).
   - Sonde HUD de coordonnées et intensité $(x, y, I)$.
   - Zoom interactif (de 20% à 800%) et déplacement libre (pan).

4. **Fusion de régions par Union-Find (Merge)** :
   - Construction de la carte matricielle des labels de feuilles.
   - Détection des feuilles voisines par arêtes horizontales et verticales partagées (contact orthogonal strict, les diagonales ne comptent pas).
   - Tri des arêtes par différence de moyenne croissante.
   - Structure *Disjoint-Set Union-Find* avec compression de chemin et mise à jour de la moyenne pondérée par la superficie en pixels.
   - Condition de fusion sur les moyennes actuelles : $|\mu_A - \mu_B| \le T_m$.

5. **Comparaison avec le seuillage global d'Otsu** :
   - Calcul en direct du seuil optimal $T^*$ maximisant la variance inter-classe $\sigma_B^2(t)$.
   - Affichage de l'histogramme des intensités avec ligne de démarcation du seuil optimal.
   - Comparaison synchrone à 4 panneaux (Originale, Moyenne Quadtree, Fusion, Binaire Otsu).
   - Explication théorique des différences fondamentales (topologie spatiale vs histogramme global).

6. **Banc d'essais paramétrique (Expériences A, B, C, D)** :
   - **Exp A** : Variation du seuil de division $T \in [5, 10, 20, 40]$.
   - **Exp B** : Variation de la taille minimale $\text{min\_size} \in [4, 8, 16, 32]$.
   - **Exp C** : Variation du seuil de fusion $T_m \in [5, 15, 30]$.
   - **Exp D** : Comparaison des critères $\text{std}$ vs $\text{range}$.
   - Courbes graphiques scientifiques SVG interactives.
   - Calcul du PSNR (Peak Signal-to-Noise Ratio) en dB :
     $$\text{MSE} = \frac{1}{N} \sum (I - \hat{I})^2, \quad \text{PSNR} = 10 \log_{10}\left(\frac{255^2}{\text{MSE}}\right)$$
   - Export des données au format CSV.

7. **Rapport académique universitaire** :
   - Rapport complet structuré pour la remise du TP.
   - Réponses rédigées et modifiables aux 6 questions du TP (Q1 à Q6).
   - Intégration automatique des dimensions, métriques réelles et statistiques d'expériences.
   - Feuille de style dédiée pour impression ou sauvegarde PDF directe (`window.print()`).

8. **Code Python & Suite de tests automatisés** :
   - Fichiers `tp1_quadtree.py`, `test_quadtree.py` et `requirements.txt` téléchargeables directement.
   - Validateur de 8 cas de tests d'invariants exécuté en direct dans le navigateur.

---

## Installation et exécution

### 1. Application Web (React + Vite + TypeScript)

```bash
# Installation des dépendances
npm install

# Démarrage du serveur de développement (Port 3000)
npm run dev

# Construction pour la production
npm run build
```

### 2. Exécution des scripts Python et des tests pytest

```bash
# Créer et activer un environnement virtuel
python3 -m venv venv
source venv/bin/activate  # Sous Windows : venv\Scripts\activate

# Installer les dépendances scientifiques
pip install -r public/requirements.txt

# Lancer la suite de tests automatisés
pytest public/test_quadtree.py -v
```

---

## Questions du TP incluses

- **Q1** : Profondeur maximale pour une image $512 \times 512$ avec $\text{min\_size} = 4$ $\rightarrow$ $d = \log_2(512/4) = 7$.
- **Q2** : Nombre maximal de feuilles à la profondeur $d$ $\rightarrow$ $4^d$.
- **Q3** : Comportement quand $T$ est très petit (sur-segmentation) vs très grand (sous-segmentation).
- **Q4** : Justification de l'effet « blocs » de la division et rôle réparateur de la fusion.
- **Q5** : Comparaison avec le seuillage global d'Otsu (bimodalité sans contrainte spatiale vs partitionnement topologique).
- **Q6** : Analyse du comportement sur textures haute fréquence (herbe) et proposition de prédicats avancés (matrices GLCM, bancs de filtres de Gabor).
