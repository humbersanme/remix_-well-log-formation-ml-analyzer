import React from 'react';
import { FormationTop } from '../types';
import { Download, Layers, Sparkles, Filter } from 'lucide-react';

interface TopsTableProps {
  tops: FormationTop[];
  isDark: boolean;
  selectedTopId?: string | null;
  onSelectTop?: (top: FormationTop) => void;
  onAskAI?: (top: FormationTop) => void;
}

export const TopsTable: React.FC<TopsTableProps> = ({
  tops,
  isDark,
  selectedTopId,
  onSelectTop,
  onAskAI,
}) => {
  const exportTopsCsv = () => {
    const headers = ['MD_ft', 'Confidence', 'Name', 'Lithology', 'ROP_before', 'ROP_after', 'Gas_peak', 'Cluster'];
    const rows = tops.map(t => [
      t.MD_ft,
      t.Confidence,
      `"${t.Name || 'Unassigned'}"`,
      `"${t.Lithology || 'Unknown'}"`,
      t.ROP_before || '',
      t.ROP_after || '',
      t.Gas_peak || '',
      t.Cluster ?? '',
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'tops_detectados_POZO.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className={`rounded-xl border p-5 shadow-lg ${
        isDark ? 'border-gray-800 bg-[#161b22] text-gray-100' : 'border-slate-200 bg-white text-slate-900'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center space-x-2">
          <Layers className="h-5 w-5 text-amber-400" />
          <h3 className="text-base font-bold">Topes de Formación Detectados (KMeans ML)</h3>
          <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-xs font-semibold text-amber-400">
            {tops.length} Contactos
          </span>
        </div>

        <button
          onClick={exportTopsCsv}
          className="flex items-center space-x-1.5 rounded-lg border border-gray-700 bg-gray-800/80 px-3 py-1.5 text-xs font-semibold text-gray-200 hover:bg-gray-700"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Exportar CSV de Topes</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr
              className={`border-b text-gray-400 font-semibold uppercase tracking-wider ${
                isDark ? 'border-gray-800 bg-gray-900/50' : 'border-slate-200 bg-slate-50'
              }`}
            >
              <th className="py-2.5 px-3">Profundidad MD</th>
              <th className="py-2.5 px-3">Confianza ML</th>
              <th className="py-2.5 px-3">Formación / Litología</th>
              <th className="py-2.5 px-3">Salto ROP (ft/hr)</th>
              <th className="py-2.5 px-3">Pico Gas (ppm)</th>
              <th className="py-2.5 px-3">Cluster</th>
              <th className="py-2.5 px-3 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {tops.map(top => {
              const isSelected = top.id === selectedTopId;
              const confPct = Math.round(top.Confidence * 100);

              return (
                <tr
                  key={top.id}
                  onClick={() => onSelectTop && onSelectTop(top)}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-amber-500/10'
                      : isDark
                      ? 'hover:bg-gray-800/40'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <td className="py-2.5 px-3 font-mono font-bold text-sky-400">
                    {top.MD_ft} FT
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-16 h-2 rounded-full bg-gray-700 overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full"
                          style={{ width: `${confPct}%` }}
                        />
                      </div>
                      <span className="font-mono text-[11px] font-semibold text-amber-300">
                        {confPct}%
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 font-medium">
                    <div>{top.Name}</div>
                    <div className="text-[10px] text-gray-400">{top.Lithology}</div>
                  </td>
                  <td className="py-2.5 px-3 font-mono">
                    <span className="text-gray-400">{top.ROP_before}</span>
                    <span className="mx-1 text-sky-400">→</span>
                    <span className="font-bold text-sky-300">{top.ROP_after}</span>
                  </td>
                  <td className="py-2.5 px-3 font-mono font-semibold text-red-400">
                    {top.Gas_peak} ppm
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="rounded bg-gray-800 px-2 py-0.5 text-[10px] font-mono text-gray-300">
                      C#{top.Cluster}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    {onAskAI && (
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          onAskAI(top);
                        }}
                        className="inline-flex items-center space-x-1 rounded bg-purple-500/20 px-2 py-1 text-[11px] font-medium text-purple-300 hover:bg-purple-500/30"
                      >
                        <Sparkles className="h-3 w-3" />
                        <span>Analizar IA</span>
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
