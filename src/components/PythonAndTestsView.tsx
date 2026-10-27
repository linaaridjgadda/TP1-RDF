import React, { useState } from 'react';
import { Code2, Play, CheckCircle2, XCircle, Download, Terminal, FileCode, Check } from 'lucide-react';
import { runAllAlgorithmTests, TestCaseResult } from '../algorithms/tests';
import { downloadTextFile } from '../utils/imageUtils';

export const PythonAndTestsView: React.FC = () => {
  const [testResults, setTestResults] = useState<TestCaseResult[]>([]);
  const [hasRunTests, setHasRunTests] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [activeCodeTab, setActiveCodeTab] = useState<'tp1' | 'test' | 'req'>('tp1');
  const [copied, setCopied] = useState(false);

  const handleRunTests = () => {
    setIsRunning(true);
    setTimeout(() => {
      const res = runAllAlgorithmTests();
      setTestResults(res);
      setHasRunTests(true);
      setIsRunning(false);
    }, 50);
  };

  const handleDownloadFile = async (type: 'tp1' | 'test' | 'req') => {
    let filename = '';
    let path = '';
    if (type === 'tp1') {
      filename = 'tp1_quadtree.py';
      path = '/tp1_quadtree.py';
    } else if (type === 'test') {
      filename = 'test_quadtree.py';
      path = '/test_quadtree.py';
    } else {
      filename = 'requirements.txt';
      path = '/requirements.txt';
    }

    try {
      const res = await fetch(path);
      const content = await res.text();
      downloadTextFile(content, filename);
    } catch {
      // fallback
    }
  };

  const totalPassed = testResults.filter((t) => t.passed).length;
  const allPassed = hasRunTests && totalPassed === testResults.length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-lg bg-slate-900/90 border border-slate-800">
        <div>
          <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <Code2 className="w-5 h-5 text-cyan-400" />
            Implémentation Python & Banc de tests automatisés
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Téléchargez le code Python officiel requis pour votre TP ou exécutez la validation des 8 cas d'évaluation.
          </p>
        </div>

        <button
          onClick={handleRunTests}
          disabled={isRunning}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-all shadow-sm ${
            isRunning
              ? 'bg-cyan-600 text-white cursor-wait opacity-80'
              : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/20 active:translate-y-0.5'
          }`}
        >
          {isRunning ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              <span>Vérification en cours...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Exécuter les 8 tests d'invariants</span>
            </>
          )}
        </button>
      </div>

      {/* Tests Results Section */}
      {hasRunTests && (
        <div className="p-4 rounded-lg bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              {allPassed ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-400" />
              )}
              <h3 className="text-sm font-semibold text-slate-100">
                Résultat de la suite de tests : {totalPassed} / {testResults.length} réussis
              </h3>
            </div>
            <span className={`text-xs font-mono px-2 py-0.5 rounded border ${
              allPassed
                ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                : 'bg-rose-950/60 border-rose-800 text-rose-300'
            }`}>
              {allPassed ? 'TOUS LES INVARIANTS SONT RESPECTÉS' : 'DES INVARIANTS ONT ÉCHOUÉ'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {testResults.map((t) => (
              <div
                key={t.id}
                className="p-3 rounded bg-slate-950/70 border border-slate-800/80 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {t.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <span className="font-semibold text-slate-200">{t.name}</span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-400 tabular-nums">
                    {t.durationMs.toFixed(1)} ms
                  </span>
                </div>

                <p className="text-slate-400 text-[11px]">{t.description}</p>

                <div className="space-y-1 pt-1.5 border-t border-slate-800/60 font-mono text-[10px]">
                  {t.invariants.map((inv, idx) => (
                    <div key={idx} className="flex items-center justify-between text-slate-300">
                      <span>• {inv.name}</span>
                      <span className={inv.passed ? 'text-emerald-400' : 'text-rose-400'}>
                        {inv.detail}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Python Code & Instructions Section */}
      <div className="p-4 rounded-lg bg-slate-900/90 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-slate-100">
              Fichiers sources Python pour le rendu universitaire
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDownloadFile('tp1')}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>tp1_quadtree.py</span>
            </button>
            <button
              onClick={() => handleDownloadFile('test')}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>test_quadtree.py</span>
            </button>
            <button
              onClick={() => handleDownloadFile('req')}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>requirements.txt</span>
            </button>
          </div>
        </div>

        {/* Execution guide in terminal style */}
        <div className="bg-slate-950 rounded-lg p-3.5 border border-slate-800 font-mono text-xs space-y-2 text-slate-300">
          <div className="flex items-center justify-between text-slate-400 pb-1.5 border-b border-slate-800 text-[11px]">
            <span>Exécution locale sous Linux / macOS / Windows</span>
            <span>Bash</span>
          </div>
          <pre className="text-cyan-300 leading-relaxed overflow-x-auto">
{`# 1. Créer et activer un environnement virtuel Python
python3 -m venv venv
source venv/bin/activate  # ou venv\\Scripts\\activate sous Windows

# 2. Installer les bibliothèques scientifiques requises
pip install -r requirements.txt

# 3. Lancer la suite de tests automatisés pytest
pytest test_quadtree.py -v`}
          </pre>
        </div>

        {/* Code tabs */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 border-b border-slate-800 text-xs">
            <button
              onClick={() => setActiveCodeTab('tp1')}
              className={`px-3 py-2 border-b-2 font-medium transition-colors ${
                activeCodeTab === 'tp1'
                  ? 'border-cyan-400 text-cyan-400 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              tp1_quadtree.py (Algorithme principal)
            </button>
            <button
              onClick={() => setActiveCodeTab('test')}
              className={`px-3 py-2 border-b-2 font-medium transition-colors ${
                activeCodeTab === 'test'
                  ? 'border-cyan-400 text-cyan-400 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              test_quadtree.py (Tests pytest)
            </button>
            <button
              onClick={() => setActiveCodeTab('req')}
              className={`px-3 py-2 border-b-2 font-medium transition-colors ${
                activeCodeTab === 'req'
                  ? 'border-cyan-400 text-cyan-400 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              requirements.txt
            </button>
          </div>

          <div className="bg-slate-950 rounded p-4 font-mono text-[11px] text-slate-300 max-h-96 overflow-auto border border-slate-800 leading-relaxed">
            {activeCodeTab === 'tp1' && (
              <pre>{`class Node:
    def __init__(self, r: int, c: int, h: int, w: int, depth: int = 0):
        self.r, self.c, self.h, self.w = r, c, h, w
        self.depth = depth
        self.children = []
        self.mean = 0.0
        self.is_leaf = False

def is_homogeneous(block: np.ndarray, T: float, criterion: str = 'std') -> bool:
    if criterion == 'std':
        return float(np.std(block)) <= T
    elif criterion == 'range':
        return float(np.max(block) - np.min(block)) <= T

def split(img: np.ndarray, node: Node, T: float, min_size: int = 4, criterion: str = 'std') -> None:
    block = img[node.r:node.r + node.h, node.c:node.c + node.w]
    node.mean = float(np.mean(block)) if block.size > 0 else 0.0
    if is_homogeneous(block, T, criterion=criterion) or node.h <= min_size or node.w <= min_size:
        node.is_leaf = True
        return
    h1, h2 = node.h // 2, node.h - node.h // 2
    w1, w2 = node.w // 2, node.w - node.w // 2
    depth = node.depth + 1
    node.children = [
        Node(node.r, node.c, h1, w1, depth),
        Node(node.r, node.c + w1, h1, w2, depth),
        Node(node.r + h1, node.c, h2, w1, depth),
        Node(node.r + h1, node.c + w1, h2, w2, depth)
    ]
    for child in node.children:
        split(img, child, T, min_size=min_size, criterion=criterion)

def merge(img: np.ndarray, leaf_list: list[Node], T_m: float):
    # Union-Find avec pondération par taille et parcours des arêtes adjacentes
    ... (voir fichier complet tp1_quadtree.py)`}</pre>
            )}

            {activeCodeTab === 'test' && (
              <pre>{`def test_1_constant_image():
    img = np.full((128, 128), 120.0, dtype=np.float32)
    root = Node(0, 0, 128, 128)
    split(img, root, T=10, min_size=4)
    leaf_list = leaves(root)
    assert len(leaf_list) == 1
    assert calculate_psnr(img, mean_image(img, leaf_list)) == float('inf')

def test_odd_dimensions_invariants():
    img = np.random.uniform(0, 255, (101, 87)).astype(np.float32)
    root = Node(0, 0, 101, 87)
    split(img, root, T=25, min_size=4)
    # Vérification que chaque pixel est couvert exactement une fois sans trou ni chevauchement
    ...`}</pre>
            )}

            {activeCodeTab === 'req' && (
              <pre>{`numpy>=1.24.0
scipy>=1.10.0
scikit-image>=0.20.0
Pillow>=9.5.0
matplotlib>=3.7.0
pytest>=7.3.0
fastapi>=0.100.0
uvicorn>=0.22.0`}</pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
