import React, { useState } from 'react';
import { Code2, Copy, Download, Check, X, Terminal, Folder } from 'lucide-react';
import { REFACTORED_PYTHON_CODE } from '../utils/pythonCode';

interface PythonCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
}

export const PythonCodeModal: React.FC<PythonCodeModalProps> = ({
  isOpen,
  onClose,
  isDark,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(REFACTORED_PYTHON_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([REFACTORED_PYTHON_CODE], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'app_pozos.py';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div
        className={`w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border shadow-2xl transition-all ${
          isDark ? 'border-gray-800 bg-[#0d1117] text-gray-100' : 'border-slate-200 bg-white text-slate-900'
        }`}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b px-6 py-4 border-gray-800">
          <div className="flex items-center space-x-3">
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
              <Code2 className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Código Python Flask Refactorizado (Multi-Pozo)</h2>
              <p className="text-xs text-gray-400">
                Soporte dinámico para archivos CSV en carpetas <code className="text-sky-400 font-mono">Pozo_1_csv</code>, <code className="text-sky-400 font-mono">Pozo_2_csv</code>, etc.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1.5 rounded-lg border border-gray-700 bg-gray-800/80 px-3 py-1.5 text-xs font-semibold text-gray-200 hover:bg-gray-700"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              <span>{copied ? '¡Copiado!' : 'Copiar Código'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center space-x-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-500"
            >
              <Download className="h-4 w-4" />
              <span>Descargar app.py</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Feature Banner */}
        <div className="bg-blue-500/10 border-b border-blue-500/20 px-6 py-2.5 text-xs text-blue-300 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Terminal className="h-4 w-4 text-blue-400 shrink-0" />
            <span>
              <strong>Modificación realizada:</strong> Se reemplazó la ruta estática de archivos por <code className="font-mono bg-blue-900/40 px-1 py-0.5 rounded">discover_well_csv_files(well_dir)</code> y el endpoint dinámico <code className="font-mono bg-blue-900/40 px-1 py-0.5 rounded">/run_analysis?well=Pozo_2_csv</code>.
            </span>
          </div>
        </div>

        {/* Code Content */}
        <div className="flex-1 overflow-y-auto p-6 font-mono text-xs leading-relaxed">
          <pre className="rounded-xl bg-[#161b22] p-4 text-gray-200 border border-gray-800 overflow-x-auto">
            <code>{REFACTORED_PYTHON_CODE}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
