import React from 'react';
import {
  Activity,
  Code2,
  Upload,
  Sparkles,
  Sun,
  Moon,
  SlidersHorizontal,
  FolderTree,
  Network,
} from 'lucide-react';
import { WellInfo } from '../types';

interface HeaderProps {
  wells: WellInfo[];
  selectedWellId: string;
  onSelectWell: (wellId: string) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenPythonCode: () => void;
  onOpenUpload: () => void;
  onOpenAI: () => void;
  onToggleSettings: () => void;
  onOpenCorrelation: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  wells,
  selectedWellId,
  onSelectWell,
  theme,
  onToggleTheme,
  onOpenPythonCode,
  onOpenUpload,
  onOpenAI,
  onToggleSettings,
  onOpenCorrelation,
}) => {
  const isDark = theme === 'dark';

  return (
    <header
      className={`sticky top-0 z-40 border-b backdrop-blur-md transition-colors ${
        isDark
          ? 'border-gray-800 bg-[#0d1117]/90 text-gray-100'
          : 'border-slate-200 bg-white/90 text-slate-900'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Logo & Title */}
        <div className="flex items-center space-x-3">
          <div className="rounded-xl bg-gradient-to-tr from-blue-600 to-sky-400 p-2 text-white shadow-lg shadow-blue-500/20">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-black tracking-tight">ANÁLISIS DE FORMACIÓN POZO</h1>
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                KMeans ML v2.0
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Detección automática de topes geológicos & cromatografía de gas
            </p>
          </div>
        </div>

        {/* Well Selection Dropdown */}
        <div className="flex items-center space-x-2 bg-gray-800/40 border border-gray-700/60 rounded-xl p-1">
          <FolderTree className="h-4 w-4 ml-2 text-sky-400 shrink-0" />
          <select
            value={selectedWellId}
            onChange={e => onSelectWell(e.target.value)}
            className="bg-transparent text-xs font-bold py-1.5 pr-3 pl-1 outline-none cursor-pointer text-sky-300"
          >
            {wells.map(w => (
              <option key={w.id} value={w.id} className="bg-gray-900 text-white font-sans">
                {w.name} ({w.folderName})
              </option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center space-x-2">
          {/* Multi-Well Correlation Button */}
          <button
            onClick={onOpenCorrelation}
            className="flex items-center space-x-1.5 rounded-xl border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 text-xs font-bold text-purple-300 hover:bg-purple-500/20 shadow-sm"
          >
            <Network className="h-4 w-4" />
            <span>Correlación Multi-Pozo</span>
          </button>

          {/* Refactored Python Code Modal Button */}
          <button
            onClick={onOpenPythonCode}
            className="flex items-center space-x-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 shadow-sm"
          >
            <Code2 className="h-4 w-4" />
            <span>Código Python</span>
          </button>

          {/* Custom Upload Button */}
          <button
            onClick={onOpenUpload}
            className="flex items-center space-x-1.5 rounded-xl border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs font-bold text-blue-400 hover:bg-blue-500/20"
          >
            <Upload className="h-4 w-4" />
            <span>Cargar CSVs</span>
          </button>

          {/* AI Geologist Assistant */}
          <button
            onClick={onOpenAI}
            className="flex items-center space-x-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-lg shadow-purple-500/20 hover:from-purple-500 hover:to-indigo-500"
          >
            <Sparkles className="h-4 w-4" />
            <span>IA Geológica</span>
          </button>

          {/* Settings Drawer Toggle */}
          <button
            onClick={onToggleSettings}
            className="rounded-xl border border-gray-700 bg-gray-800/80 p-2 text-gray-300 hover:bg-gray-700 hover:text-white"
            title="Ajustes de Algoritmo ML"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>

          {/* Theme Switcher */}
          <button
            onClick={onToggleTheme}
            className="rounded-xl border border-gray-700 bg-gray-800/80 p-2 text-gray-300 hover:bg-gray-700 hover:text-white"
            title="Cambiar Tema"
          >
            {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-sky-400" />}
          </button>
        </div>
      </div>
    </header>
  );
};
