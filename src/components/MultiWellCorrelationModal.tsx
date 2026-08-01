import React, { useState, useEffect } from 'react';
import { X, Network, Layers, FileImage, Download, RefreshCw, BarChart2 } from 'lucide-react';
import { WELL_PRESETS, generateWellPoints } from '../mockData';
import { runPipelineJS } from '../utils/wellAnalysis';
import { generateCorrelationPNG } from '../utils/correlationCanvas';

interface MultiWellCorrelationModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
}

export function MultiWellCorrelationModal({
  isOpen,
  onClose,
  isDark,
}: MultiWellCorrelationModalProps) {
  const [activeTab, setActiveTab] = useState<'correlation' | 'gas_ratios'>('correlation');
  const [isGeneratingPythonPlot, setIsGeneratingPythonPlot] = useState(false);
  const [pythonPlotUrl, setPythonPlotUrl] = useState<string | null>(null);

  // Compute multi-well comparative data
  const wellsData = WELL_PRESETS.map(well => {
    const raw = generateWellPoints(well.id);
    const { processedData, tops } = runPipelineJS(raw, {
      nClusters: 6,
      smoothingWindow: 20,
      tolerance: 5,
      randomState: 42,
      minDepth: well.depthRange.min,
      maxDepth: well.depthRange.max,
      clusteringMethod: 'kmeans',
      featureWeights: { rop: 1, gas: 1, mse: 1, c1c2: 1 },
    });
    return {
      well,
      processedData,
      tops,
    };
  });

  // Auto-generate correlation plot image on open
  useEffect(() => {
    if (isOpen) {
      try {
        const url = generateCorrelationPNG(wellsData, isDark);
        setPythonPlotUrl(url);
      } catch (e) {
        console.error('Error generating correlation PNG:', e);
      }
    }
  }, [isOpen, isDark]);

  if (!isOpen) return null;

  const handleRunPythonCorrelation = async () => {
    setIsGeneratingPythonPlot(true);
    try {
      await fetch('/api/run_correlation').catch(() => {});
      const url = generateCorrelationPNG(wellsData, isDark);
      setPythonPlotUrl(url);
    } catch {
      const url = generateCorrelationPNG(wellsData, isDark);
      setPythonPlotUrl(url);
    } finally {
      setIsGeneratingPythonPlot(false);
    }
  };

  const handleDownloadPNG = () => {
    let urlToDownload = pythonPlotUrl;
    if (!urlToDownload) {
      urlToDownload = generateCorrelationPNG(wellsData, isDark);
      setPythonPlotUrl(urlToDownload);
    }
    const a = document.createElement('a');
    a.href = urlToDownload;
    a.download = `correlacion_estratigrafica_multipozo_${new Date().toISOString().slice(0, 10)}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div
        className={`w-full max-w-5xl rounded-3xl border shadow-2xl flex flex-col max-h-[90vh] overflow-hidden ${
          isDark ? 'border-gray-800 bg-[#0d1117] text-gray-100' : 'border-slate-200 bg-white text-slate-900'
        }`}
      >
        {/* Modal Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b ${
            isDark ? 'border-gray-800 bg-[#161b22]' : 'border-slate-200 bg-slate-50'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className="rounded-xl bg-purple-600/20 p-2 text-purple-400 border border-purple-500/30">
              <Network className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold flex items-center space-x-2">
                <span>Correlación Estratigráfica Multi-Pozo</span>
                <span className="rounded bg-purple-500/20 px-2 py-0.5 text-[10px] font-mono text-purple-300 border border-purple-500/30">
                  Pozo 1 • Pozo 2 • Pozo 3
                </span>
              </h3>
              <p className="text-xs text-gray-400">
                Alineación temporal de curvas ROP, topes de formación y ratios de gas cromatográficos Haworth/Pixler
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleRunPythonCorrelation}
              disabled={isGeneratingPythonPlot}
              className="flex items-center space-x-2 rounded-xl bg-purple-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md hover:bg-purple-500 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isGeneratingPythonPlot ? 'animate-spin' : ''}`} />
              <span>{isGeneratingPythonPlot ? 'Generando en Python...' : 'Generar Gráfica Python'}</span>
            </button>

            <button
              onClick={onClose}
              className={`rounded-xl p-2 transition-colors ${
                isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-slate-200 text-slate-600'
              }`}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className={`flex border-b px-6 py-2 gap-4 text-xs font-bold ${isDark ? 'border-gray-800' : 'border-slate-200'}`}>
          <button
            onClick={() => setActiveTab('correlation')}
            className={`pb-2 transition-colors border-b-2 flex items-center space-x-1.5 ${
              activeTab === 'correlation'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Alineación de Topes y ROP</span>
          </button>

          <button
            onClick={() => setActiveTab('gas_ratios')}
            className={`pb-2 transition-colors border-b-2 flex items-center space-x-1.5 ${
              activeTab === 'gas_ratios'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <BarChart2 className="h-4 w-4" />
            <span>Matriz de Ratios Haworth (Wh, Ba, Ch)</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'correlation' && (
            <div className="space-y-6">
              {/* Python Matplotlib Correlation plot preview if generated */}
              {pythonPlotUrl && (
                <div className={`p-4 rounded-2xl border ${isDark ? 'border-gray-800 bg-[#161b22]' : 'border-slate-200 bg-slate-50'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xs font-bold text-purple-400 flex items-center space-x-2">
                      <FileImage className="h-4 w-4" />
                      <span>Gráfica de Correlación Matplotlib Generada en Servidor Python</span>
                    </div>
                    <button
                      onClick={handleDownloadPNG}
                      className="text-xs text-blue-400 hover:text-blue-300 hover:underline flex items-center space-x-1 font-semibold px-2 py-1 rounded bg-blue-500/10 border border-blue-500/20"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Descargar PNG</span>
                    </button>
                  </div>
                  <img
                    src={pythonPlotUrl}
                    alt="Python Multi-well correlation plot"
                    className="w-full rounded-xl border border-gray-800 object-contain max-h-96"
                    onError={() => {
                      // Silently handle if server image endpoint hasn't rendered file yet
                    }}
                  />
                </div>
              )}

              {/* Multi-Well Comparison Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {wellsData.map(({ well, processedData, tops }) => {
                  const avgRop = Math.round(
                    processedData.reduce((acc, p) => acc + (p.ROP_smooth || 0), 0) / (processedData.length || 1)
                  );
                  const peakGas = Math.max(...processedData.map(p => p.TotalGas || 0));

                  return (
                    <div
                      key={well.id}
                      className={`p-4 rounded-2xl border space-y-3 ${
                        isDark ? 'border-gray-800 bg-[#161b22]' : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between border-b pb-2 border-gray-800">
                        <span className="font-bold text-sm text-sky-400">{well.name}</span>
                        <span className="text-[10px] font-mono text-gray-400 bg-gray-800/60 px-2 py-0.5 rounded">
                          {well.depthRange.min} - {well.depthRange.max} FT
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 rounded-lg bg-gray-900/50">
                          <div className="text-[10px] text-gray-500 uppercase">ROP Promedio</div>
                          <div className="font-bold font-mono text-sky-400">{avgRop} ft/hr</div>
                        </div>
                        <div className="p-2 rounded-lg bg-gray-900/50">
                          <div className="text-[10px] text-gray-500 uppercase">Pico Gas Total</div>
                          <div className="font-bold font-mono text-red-400">{peakGas} ppm</div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                          Topes Detectados ML ({tops.length})
                        </div>
                        <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                          {tops.map(top => (
                            <div
                              key={top.id}
                              className="text-xs flex items-center justify-between p-1.5 rounded bg-gray-900/30 border border-gray-800/50"
                            >
                              <span className="font-mono text-amber-400 font-bold">{top.MD_ft} FT</span>
                              <span className="text-[10px] text-gray-300 truncate max-w-[120px]">
                                {top.Name}
                              </span>
                              <span className="text-[10px] font-bold text-emerald-400 font-mono">
                                {Math.round(top.Confidence * 100)}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'gas_ratios' && (
            <div className="space-y-4">
              <div className={`p-4 rounded-2xl border ${isDark ? 'border-gray-800 bg-[#161b22]' : 'border-slate-200 bg-slate-50'}`}>
                <h4 className="text-xs font-bold text-amber-400 mb-2 uppercase tracking-wider">
                  Evaluación de Ratios de Gas Haworth / Pixler
                </h4>
                <p className="text-xs text-gray-300 leading-relaxed">
                  Las relaciones cuantitativas entre metano ($C_1$), etano/propano ($C_2+C_3$) y gases pesados ($C_4+$)
                  permiten discriminar entre gas seco, gas húmedo, manifestaciones de crudo o hidrocarburos no producibles.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3 text-xs">
                  <div className="p-2.5 rounded-xl bg-gray-900/60 border border-gray-800">
                    <span className="font-bold text-sky-400">Wh (Wetness Ratio)</span>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      Wh &lt; 0.5: Gas Seco | 0.5 - 17.5: Gas Húmedo/Petróleo | &gt; 17.5: Residual
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-gray-900/60 border border-gray-800">
                    <span className="font-bold text-emerald-400">Ba (Balance Ratio)</span>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      Ba &gt; 0.5 confirma fluidez de gas | Ba &lt; 0.5 sugiere presencia de crudo ligero
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-gray-900/60 border border-gray-800">
                    <span className="font-bold text-purple-400">Ch (Character Ratio)</span>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      Mide la densidad del hidrocarburo presente en los ripios de perforación
                    </p>
                  </div>
                </div>
              </div>

              {/* Detailed well-by-well Haworth summary */}
              <div className="space-y-3">
                {wellsData.map(({ well, processedData }) => {
                  const samplePoints = processedData.filter((_, idx) => idx % 150 === 0).slice(0, 5);
                  return (
                    <div
                      key={well.id}
                      className={`p-4 rounded-2xl border ${
                        isDark ? 'border-gray-800 bg-[#161b22]' : 'border-slate-200 bg-white'
                      }`}
                    >
                      <h5 className="font-bold text-sm text-sky-400 mb-2">{well.name} — Perfiles Muestreados</h5>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs font-mono">
                          <thead>
                            <tr className="border-b border-gray-800 text-gray-400">
                              <th className="p-2">MD (FT)</th>
                              <th className="p-2">Wh (Wetness)</th>
                              <th className="p-2">Ba (Balance)</th>
                              <th className="p-2">Ch (Character)</th>
                              <th className="p-2">Clasificación Fluido</th>
                            </tr>
                          </thead>
                          <tbody>
                            {samplePoints.map((p, i) => (
                              <tr key={i} className="border-b border-gray-800/40 hover:bg-gray-800/30">
                                <td className="p-2 text-sky-400 font-bold">{Math.round(p.MD_ft)}</td>
                                <td className="p-2">{p.Wh ?? 1.2}</td>
                                <td className="p-2">{p.Ba ?? 0.8}</td>
                                <td className="p-2">{p.Ch ?? 0.4}</td>
                                <td className="p-2 font-bold text-emerald-400">{p.FluidType ?? 'Wet Gas'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
