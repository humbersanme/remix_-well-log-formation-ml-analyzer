import React from 'react';
import { Sliders, RefreshCw, X } from 'lucide-react';
import { MLConfig } from '../types';

interface MLSettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  config: MLConfig;
  onChangeConfig: (newConfig: MLConfig) => void;
  onReset: () => void;
  isDark: boolean;
  depthLimits: { min: number; max: number };
}

export const MLSettingsDrawer: React.FC<MLSettingsDrawerProps> = ({
  isOpen,
  onClose,
  config,
  onChangeConfig,
  onReset,
  isDark,
  depthLimits,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm border-l bg-[#161b22] p-6 text-gray-100 shadow-2xl transition-all border-gray-800">
      <div className="flex items-center justify-between border-b pb-4 border-gray-800">
        <div className="flex items-center space-x-2">
          <Sliders className="h-5 w-5 text-sky-400" />
          <h2 className="font-bold text-base">Parámetros ML KMeans</h2>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-gray-400 hover:bg-gray-800 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-6 space-y-6 text-xs">
        {/* Number of Clusters */}
        <div>
          <div className="flex justify-between font-semibold mb-1">
            <span>Número de Clusters (K)</span>
            <span className="font-mono text-sky-400">{config.nClusters}</span>
          </div>
          <input
            type="range"
            min={2}
            max={10}
            step={1}
            value={config.nClusters}
            onChange={e => onChangeConfig({ ...config, nClusters: Number(e.target.value) })}
            className="w-full accent-sky-500 cursor-pointer"
          />
          <p className="text-[10px] text-gray-400 mt-1">
            Número de agrupamientos geológicos en el espacio ROP_smooth vs TotalGas.
          </p>
        </div>

        {/* Smoothing Window */}
        <div>
          <div className="flex justify-between font-semibold mb-1">
            <span>Ventana de Suavizado ROP (Puntos)</span>
            <span className="font-mono text-sky-400">{config.smoothingWindow}</span>
          </div>
          <input
            type="range"
            min={5}
            max={50}
            step={5}
            value={config.smoothingWindow}
            onChange={e => onChangeConfig({ ...config, smoothingWindow: Number(e.target.value) })}
            className="w-full accent-sky-500 cursor-pointer"
          />
          <p className="text-[10px] text-gray-400 mt-1">
            Rolling mean para filtrar ruido instrumental de perforación en la curva ROP.
          </p>
        </div>

        {/* Min Depth */}
        <div>
          <div className="flex justify-between font-semibold mb-1">
            <span>Profundidad Mínima (MD FT)</span>
            <span className="font-mono text-sky-400">{config.minDepth} FT</span>
          </div>
          <input
            type="range"
            min={depthLimits.min}
            max={config.maxDepth - 200}
            step={100}
            value={config.minDepth}
            onChange={e => onChangeConfig({ ...config, minDepth: Number(e.target.value) })}
            className="w-full accent-sky-500 cursor-pointer"
          />
        </div>

        {/* Max Depth */}
        <div>
          <div className="flex justify-between font-semibold mb-1">
            <span>Profundidad Máxima (MD FT)</span>
            <span className="font-mono text-sky-400">{config.maxDepth} FT</span>
          </div>
          <input
            type="range"
            min={config.minDepth + 200}
            max={depthLimits.max}
            step={100}
            value={config.maxDepth}
            onChange={e => onChangeConfig({ ...config, maxDepth: Number(e.target.value) })}
            className="w-full accent-sky-500 cursor-pointer"
          />
        </div>

        <button
          onClick={onReset}
          className="w-full flex items-center justify-center space-x-2 rounded-xl border border-gray-700 bg-gray-800 py-2.5 font-bold text-gray-200 hover:bg-gray-700"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Restablecer Parámetros</span>
        </button>
      </div>
    </div>
  );
};
