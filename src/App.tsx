import React, { useState, useEffect, useMemo } from 'react';
import { WellDataPoint, FormationTop, MLConfig, WellInfo } from './types';
import { WELL_PRESETS, generateWellPoints } from './mockData';
import { runPipelineJS } from './utils/wellAnalysis';
import { Header } from './components/Header';
import { WellLogViewer } from './components/WellLogViewer';
import { TopsTable } from './components/TopsTable';
import { PythonCodeModal } from './components/PythonCodeModal';
import { UploadModal } from './components/UploadModal';
import { AIAssistantModal } from './components/AIAssistantModal';
import { MLSettingsDrawer } from './components/MLSettingsDrawer';
import { MultiWellCorrelationModal } from './components/MultiWellCorrelationModal';
import {
  Activity,
  Flame,
  Gauge,
  Layers,
  Code2,
  Sparkles,
  Info,
  CheckCircle2,
  FileSpreadsheet,
  Network,
} from 'lucide-react';

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [selectedWellId, setSelectedWellId] = useState<string>('pozo_1');
  const [customWellName, setCustomWellName] = useState<string | null>(null);
  const [rawPoints, setRawPoints] = useState<WellDataPoint[]>([]);

  // Modals state
  const [isPythonModalOpen, setIsPythonModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCorrelationOpen, setIsCorrelationOpen] = useState(false);

  const [selectedTop, setSelectedTop] = useState<FormationTop | null>(null);

  // Active well info
  const activeWellInfo = useMemo(() => {
    return WELL_PRESETS.find(w => w.id === selectedWellId) || WELL_PRESETS[0];
  }, [selectedWellId]);

  // ML Config
  const [mlConfig, setMlConfig] = useState<MLConfig>({
    nClusters: 6,
    smoothingWindow: 20,
    tolerance: 5,
    randomState: 42,
    minDepth: activeWellInfo.depthRange.min,
    maxDepth: activeWellInfo.depthRange.max,
  });

  // Load dataset when active well changes
  useEffect(() => {
    const points = generateWellPoints(selectedWellId);
    setRawPoints(points);
    setCustomWellName(null);
    setMlConfig(prev => ({
      ...prev,
      minDepth: activeWellInfo.depthRange.min,
      maxDepth: activeWellInfo.depthRange.max,
    }));
  }, [selectedWellId, activeWellInfo]);

  // Handle custom data upload
  const handleCustomDataLoaded = (name: string, points: WellDataPoint[]) => {
    setCustomWellName(name);
    setRawPoints(points);
    if (points.length > 0) {
      setMlConfig(prev => ({
        ...prev,
        minDepth: points[0].MD_ft,
        maxDepth: points[points.length - 1].MD_ft,
      }));
    }
  };

  // Run pipeline
  const { processedData, tops } = useMemo(() => {
    if (rawPoints.length === 0) return { processedData: [], tops: [] };
    return runPipelineJS(rawPoints, mlConfig);
  }, [rawPoints, mlConfig]);

  // Key KPI stats
  const kpis = useMemo(() => {
    if (processedData.length === 0) return { avgRop: 0, peakGas: 0, avgMse: 0, depthSpan: 0 };

    const avgRop = Math.round(
      processedData.reduce((acc, p) => acc + (p.ROP_smooth || 0), 0) / processedData.length
    );
    const peakGas = Math.max(...processedData.map(p => p.TotalGas || 0));
    const avgMse = Math.round(
      processedData.reduce((acc, p) => acc + (p.MSE || 0), 0) / processedData.length
    );
    const depthSpan =
      processedData[processedData.length - 1].MD_ft - processedData[0].MD_ft;

    return { avgRop, peakGas, avgMse, depthSpan };
  }, [processedData]);

  const displayName = customWellName || activeWellInfo.name;
  const isDark = theme === 'dark';

  return (
    <div
      className={`min-h-screen transition-colors ${
        isDark ? 'bg-[#0d1117] text-gray-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Top Header Navigation */}
      <Header
        wells={WELL_PRESETS}
        selectedWellId={selectedWellId}
        onSelectWell={setSelectedWellId}
        theme={theme}
        onToggleTheme={() => setTheme(t => (t === 'dark' ? 'light' : 'dark'))}
        onOpenPythonCode={() => setIsPythonModalOpen(true)}
        onOpenUpload={() => setIsUploadModalOpen(true)}
        onOpenAI={() => setIsAIModalOpen(true)}
        onToggleSettings={() => setIsSettingsOpen(!isSettingsOpen)}
        onOpenCorrelation={() => setIsCorrelationOpen(true)}
      />

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Banner highlighting ML & Multi-well features */}
        <div
          className={`rounded-2xl border p-4 flex flex-wrap items-center justify-between gap-4 shadow-lg ${
            isDark
              ? 'border-purple-500/30 bg-purple-500/10 text-purple-200'
              : 'border-purple-200 bg-purple-50 text-purple-900'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className="rounded-xl bg-purple-600 p-2.5 text-white shadow-md">
              <Code2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold flex items-center space-x-2">
                <span>Modelos de ML & Estudio Completo de Data de Pozos</span>
                <span className="rounded bg-purple-600/30 px-2 py-0.5 text-[10px] uppercase tracking-wider text-purple-300 font-mono">
                  Python Flask Optimizado
                </span>
              </h2>
              <p className="text-xs text-purple-300/80 mt-0.5">
                Clustering KMeans con estandarización de variables (ROP, TotalGas, MSE), evaluación de ratios cromatográficos de Haworth ($W_h, B_a, C_h$) y correlación estratigráfica multi-pozo.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsCorrelationOpen(true)}
              className="flex items-center space-x-2 rounded-xl bg-purple-600 px-3.5 py-2 text-xs font-bold text-white shadow-md hover:bg-purple-500 transition-colors"
            >
              <Network className="h-4 w-4" />
              <span>Correlación Multi-Pozo</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            className={`rounded-2xl border p-4 shadow-lg flex items-center justify-between ${
              isDark ? 'border-gray-800 bg-[#161b22]' : 'border-slate-200 bg-white'
            }`}
          >
            <div>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Intervalo Perforado
              </div>
              <div className="text-2xl font-black font-mono text-sky-400 mt-1">
                {kpis.depthSpan} <span className="text-sm font-normal text-gray-400">FT</span>
              </div>
              <div className="text-[11px] text-gray-500 mt-1">
                {mlConfig.minDepth} FT a {mlConfig.maxDepth} FT MD
              </div>
            </div>
            <div className="rounded-xl bg-sky-500/10 p-3 text-sky-400">
              <Activity className="h-6 w-6" />
            </div>
          </div>

          <div
            className={`rounded-2xl border p-4 shadow-lg flex items-center justify-between ${
              isDark ? 'border-gray-800 bg-[#161b22]' : 'border-slate-200 bg-white'
            }`}
          >
            <div>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Topes ML Detectados
              </div>
              <div className="text-2xl font-black font-mono text-amber-400 mt-1">
                {tops.length} <span className="text-sm font-normal text-gray-400">Contactos</span>
              </div>
              <div className="text-[11px] text-gray-500 mt-1">
                Clustering KMeans (K={mlConfig.nClusters})
              </div>
            </div>
            <div className="rounded-xl bg-amber-500/10 p-3 text-amber-400">
              <Layers className="h-6 w-6" />
            </div>
          </div>

          <div
            className={`rounded-2xl border p-4 shadow-lg flex items-center justify-between ${
              isDark ? 'border-gray-800 bg-[#161b22]' : 'border-slate-200 bg-white'
            }`}
          >
            <div>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Pico de Gas Total
              </div>
              <div className="text-2xl font-black font-mono text-red-400 mt-1">
                {kpis.peakGas} <span className="text-sm font-normal text-gray-400">PPM</span>
              </div>
              <div className="text-[11px] text-gray-500 mt-1">
                Anomalías cromatográficas C1/C2+
              </div>
            </div>
            <div className="rounded-xl bg-red-500/10 p-3 text-red-400">
              <Flame className="h-6 w-6" />
            </div>
          </div>

          <div
            className={`rounded-2xl border p-4 shadow-lg flex items-center justify-between ${
              isDark ? 'border-gray-800 bg-[#161b22]' : 'border-slate-200 bg-white'
            }`}
          >
            <div>
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Promedio ROP / MSE
              </div>
              <div className="text-2xl font-black font-mono text-emerald-400 mt-1">
                {kpis.avgRop} <span className="text-sm font-normal text-gray-400">ft/hr</span>
              </div>
              <div className="text-[11px] text-gray-500 mt-1">
                MSE Proxy: {kpis.avgMse}
              </div>
            </div>
            <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-400">
              <Gauge className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* 6-Track Interactive Well Log Visualizer */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold flex items-center space-x-2">
              <span>Registro Geológico 6-Tracks — {displayName}</span>
            </h2>
            <span className="text-xs text-gray-400">
              Desplaza el cursor sobre el gráfico para inspeccionar datos a cada profundidad MD
            </span>
          </div>

          <WellLogViewer
            data={processedData}
            tops={tops}
            theme={theme}
            selectedTopId={selectedTop?.id}
            onSelectTop={top => {
              setSelectedTop(top);
              setIsAIModalOpen(true);
            }}
          />
        </div>

        {/* Tops Table */}
        <TopsTable
          tops={tops}
          isDark={isDark}
          selectedTopId={selectedTop?.id}
          onSelectTop={setSelectedTop}
          onAskAI={top => {
            setSelectedTop(top);
            setIsAIModalOpen(true);
          }}
        />
      </main>

      {/* Modals & Drawers */}
      <PythonCodeModal
        isOpen={isPythonModalOpen}
        onClose={() => setIsPythonModalOpen(false)}
        isDark={isDark}
      />

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onDataLoaded={handleCustomDataLoaded}
        isDark={isDark}
      />

      <AIAssistantModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        wellName={displayName}
        selectedTop={selectedTop}
        tops={tops}
        data={processedData}
        isDark={isDark}
      />

      <MLSettingsDrawer
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={mlConfig}
        onChangeConfig={setMlConfig}
        onReset={() =>
          setMlConfig({
            nClusters: 6,
            smoothingWindow: 20,
            tolerance: 5,
            randomState: 42,
            minDepth: activeWellInfo.depthRange.min,
            maxDepth: activeWellInfo.depthRange.max,
            clusteringMethod: 'kmeans',
            featureWeights: { rop: 1, gas: 1, mse: 1, c1c2: 1 },
          })
        }
        isDark={isDark}
        depthLimits={activeWellInfo.depthRange}
      />

      <MultiWellCorrelationModal
        isOpen={isCorrelationOpen}
        onClose={() => setIsCorrelationOpen(false)}
        isDark={isDark}
      />
    </div>
  );
}
