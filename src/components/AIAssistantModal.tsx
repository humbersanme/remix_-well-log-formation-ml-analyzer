import React, { useState, useEffect } from 'react';
import { Sparkles, Bot, AlertTriangle, CheckCircle, X, RefreshCw } from 'lucide-react';
import { FormationTop, WellDataPoint, AIAnalysisResult } from '../types';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  wellName: string;
  selectedTop?: FormationTop | null;
  tops: FormationTop[];
  data: WellDataPoint[];
  isDark: boolean;
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isOpen,
  onClose,
  wellName,
  selectedTop,
  tops,
  data,
  isDark,
}) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchAIAnalysis();
    }
  }, [isOpen, selectedTop, wellName]);

  const fetchAIAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/ai-interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wellName,
          selectedTop,
          tops: tops.slice(0, 8),
          sampleData: data.filter((_, i) => i % 10 === 0).slice(0, 30),
        }),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'Error al conectar con la API de IA.');
      }
      setResult(resData);
    } catch (err: any) {
      setError(err.message || 'Error analizando la formación.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div
        className={`w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl border shadow-2xl transition-all ${
          isDark ? 'border-gray-800 bg-[#161b22] text-gray-100' : 'border-slate-200 bg-white text-slate-900'
        }`}
      >
        <div className="flex items-center justify-between border-b px-6 py-4 border-gray-800">
          <div className="flex items-center space-x-3">
            <div className="rounded-lg bg-purple-500/10 p-2 text-purple-400">
              <Sparkles className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Asistente Geológico de Mudlogging IA</h2>
              <p className="text-xs text-gray-400">
                Interpretación geológica de topes, cambios de ROP y relaciones de gas C1/C2+C3 en {wellName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <RefreshCw className="h-8 w-8 text-purple-400 animate-spin" />
              <p className="text-xs font-semibold text-purple-300">
                Analizando patrones de KMeans, ROP Break y Cromatografía de Gas con Gemini IA...
              </p>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-300 text-xs">
              <strong>Error de Análisis:</strong> {error}
            </div>
          )}

          {result && !loading && (
            <>
              {/* Executive Summary */}
              <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4 space-y-2">
                <div className="flex items-center space-x-2 text-purple-300 font-bold text-xs">
                  <Bot className="h-4 w-4" />
                  <span>Resumen Geológico & Operativo</span>
                </div>
                <p className="text-xs leading-relaxed text-gray-300">{result.summary}</p>
              </div>

              {/* Formations Breakdown */}
              {result.formationBreakdown && result.formationBreakdown.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                    Desglose por Formación Detectada
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {result.formationBreakdown.map((item, i) => (
                      <div
                        key={i}
                        className="rounded-xl border border-gray-800 bg-gray-900/60 p-3.5 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-sky-400">{item.depth} FT</span>
                          <span className="text-xs font-bold text-amber-300">{item.name}</span>
                        </div>
                        <div className="text-xs text-gray-300">
                          <strong>Litología:</strong> {item.lithology}
                        </div>
                        <div className="text-xs text-emerald-400">
                          <strong>Hidrocarburos:</strong> {item.potentialHydrocarbons}
                        </div>
                        <div className="text-[11px] text-red-400">
                          <strong>Riesgo Perforación:</strong> {item.drillingRisk}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {result.recommendations && result.recommendations.length > 0 && (
                <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-4">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Recomendaciones para Muestreo & Geonavegación
                  </h3>
                  <ul className="list-disc list-inside space-y-1.5 text-xs text-gray-300">
                    {result.recommendations.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex justify-between items-center border-t px-6 py-3 border-gray-800">
          <span className="text-[11px] text-gray-500">Impulsado por Google Gemini 2.5/3 API</span>
          <button
            onClick={fetchAIAnalysis}
            disabled={loading}
            className="rounded-lg bg-purple-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-purple-500 disabled:opacity-50"
          >
            Re-analizar Registros
          </button>
        </div>
      </div>
    </div>
  );
};
