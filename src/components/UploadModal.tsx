import React, { useState } from 'react';
import Papa from 'papaparse';
import { Upload, FileText, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { WellDataPoint, CSVColumnMapping } from '../types';
import { cleanVal, findCol } from '../utils/wellAnalysis';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataLoaded: (wellName: string, data: WellDataPoint[]) => void;
  isDark: boolean;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onDataLoaded,
  isDark,
}) => {
  const [wellName, setWellName] = useState('POZO PERSONALIZADO');
  const [gasFile, setGasFile] = useState<File | null>(null);
  const [parFile, setParFile] = useState<File | null>(null);
  const [devFile, setDevFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleProcess = async () => {
    if (!parFile && !gasFile) {
      setError('Por favor sube al menos un archivo CSV de Parámetros o de Gas.');
      return;
    }

    try {
      setError(null);
      setStatus('Procesando y alineando datos por profundidad MD...');

      let parData: any[] = [];
      let gasData: any[] = [];

      if (parFile) {
        parData = await parseCsv(parFile);
      }
      if (gasFile) {
        gasData = await parseCsv(gasFile);
      }

      // Column detection for Par file
      const parHeaders = parData.length > 0 ? Object.keys(parData[0]) : [];
      const cDepthPar = findCol(parHeaders, ['depth', 'md', 'profundidad', 'prof', 'md_ft', 'prof_ft']);
      const cRop = findCol(parHeaders, ['rop', 'velocidad', 'rop_smooth', 'rop_avg']);
      const cWob = findCol(parHeaders, ['wob', 'peso', 'weight', 'cargas']);
      const cTorque = findCol(parHeaders, ['torque', 'torq', 'tq']);

      // Column detection for Gas file
      const gasHeaders = gasData.length > 0 ? Object.keys(gasData[0]) : [];
      const cDepthGas = findCol(gasHeaders, ['depth', 'md', 'profundidad', 'prof', 'md_ft', 'prof_ft']);
      const cC1 = findCol(gasHeaders, ['c1 out', 'c1', 'methane', 'metano']);
      const cC2 = findCol(gasHeaders, ['c2 out', 'c2', 'ethane', 'etano']);
      const cC3 = findCol(gasHeaders, ['c3 out', 'c3', 'propane', 'propano']);
      const cTotalGas = findCol(gasHeaders, ['totalgas', 'gas total', 'total_gas', 'tg', 'total gas', 'gas_total', 'gas']);

      // Create depth index map
      const combinedPoints: WellDataPoint[] = [];

      if (parData.length > 0) {
        parData.forEach((row) => {
          const md = cleanVal(row[cDepthPar || '']);
          if (isNaN(md)) return;

          const rop = cleanVal(row[cRop || '']) || 30;
          const wob = cleanVal(row[cWob || '']) || 20;
          const torque = cleanVal(row[cTorque || '']) || 8;

          // Find closest gas match
          let gasPoint = gasData.find(g => Math.abs(cleanVal(g[cDepthGas || '']) - md) <= 10);
          const c1 = gasPoint ? cleanVal(gasPoint[cC1 || '']) || 100 : 100;
          const c2 = gasPoint ? cleanVal(gasPoint[cC2 || '']) || 20 : 20;
          const c3 = gasPoint ? cleanVal(gasPoint[cC3 || '']) || 10 : 10;
          const totGas = gasPoint ? (cleanVal(gasPoint[cTotalGas || '']) || c1 + c2 + c3) : c1 + c2 + c3;

          combinedPoints.push({
            MD_ft: Math.round(md),
            ROP: rop,
            ROP_smooth: rop,
            TotalGas: totGas,
            C1: c1,
            C2C3: c2 + c3,
            WOB: wob,
            Torque: torque,
            MSE: Number(((wob + torque * 100) / (rop || 1)).toFixed(1)),
          });
        });
      } else if (gasData.length > 0) {
        // Handle case where ONLY Gas CSV was provided
        gasData.forEach((row) => {
          const md = cleanVal(row[cDepthGas || '']);
          if (isNaN(md)) return;

          const c1 = cleanVal(row[cC1 || '']) || 100;
          const c2 = cleanVal(row[cC2 || '']) || 20;
          const c3 = cleanVal(row[cC3 || '']) || 10;
          const totGas = cleanVal(row[cTotalGas || '']) || (c1 + c2 + c3);

          combinedPoints.push({
            MD_ft: Math.round(md),
            ROP: 35,
            ROP_smooth: 35,
            TotalGas: totGas,
            C1: c1,
            C2C3: c2 + c3,
            WOB: 22,
            Torque: 9,
            MSE: 12,
          });
        });
      }

      if (combinedPoints.length === 0) {
        throw new Error('No se pudieron extraer registros válidos de profundidad MD_ft de los archivos CSV.');
      }

      combinedPoints.sort((a, b) => a.MD_ft - b.MD_ft);
      onDataLoaded(wellName.toUpperCase(), combinedPoints);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al procesar los archivos CSV.');
    } finally {
      setStatus(null);
    }
  };

  const parseCsv = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        encoding: 'latin1',
        complete: results => resolve(results.data),
        error: err => reject(err),
      });
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div
        className={`w-full max-w-2xl rounded-2xl border p-6 shadow-2xl transition-all ${
          isDark ? 'border-gray-800 bg-[#161b22] text-gray-100' : 'border-slate-200 bg-white text-slate-900'
        }`}
      >
        <div className="flex items-center justify-between border-b pb-4 border-gray-800">
          <div className="flex items-center space-x-3">
            <div className="rounded-lg bg-blue-500/10 p-2 text-blue-400">
              <Upload className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Cargar Archivos CSV de Pozo</h2>
              <p className="text-xs text-gray-400">
                Sube los registros de perforación y gases para análisis automático de formación.
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

        <div className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">
              Nombre del Pozo
            </label>
            <input
              type="text"
              value={wellName}
              onChange={e => setWellName(e.target.value)}
              className={`w-full rounded-lg border px-3 py-2 text-sm font-medium ${
                isDark ? 'border-gray-700 bg-gray-900 text-white' : 'border-slate-300 bg-slate-50'
              }`}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Parámetros CSV */}
            <div className="rounded-xl border border-dashed p-3 text-center border-gray-700 bg-gray-900/50">
              <FileText className="mx-auto h-6 w-6 text-sky-400 mb-1" />
              <div className="text-xs font-bold">Parámetros (ROP/WOB)</div>
              <div className="text-[10px] text-gray-400 mt-0.5">
                {parFile ? parFile.name : 'Seleccionar .csv'}
              </div>
              <input
                type="file"
                accept=".csv"
                onChange={e => setParFile(e.target.files?.[0] || null)}
                className="mt-2 text-[10px] w-full text-gray-400"
              />
            </div>

            {/* Gases CSV */}
            <div className="rounded-xl border border-dashed p-3 text-center border-gray-700 bg-gray-900/50">
              <FileText className="mx-auto h-6 w-6 text-red-400 mb-1" />
              <div className="text-xs font-bold">Gases (Total/C1/C2)</div>
              <div className="text-[10px] text-gray-400 mt-0.5">
                {gasFile ? gasFile.name : 'Seleccionar .csv'}
              </div>
              <input
                type="file"
                accept=".csv"
                onChange={e => setGasFile(e.target.files?.[0] || null)}
                className="mt-2 text-[10px] w-full text-gray-400"
              />
            </div>

            {/* Desviación CSV */}
            <div className="rounded-xl border border-dashed p-3 text-center border-gray-700 bg-gray-900/50">
              <FileText className="mx-auto h-6 w-6 text-emerald-400 mb-1" />
              <div className="text-xs font-bold">Desviación / Dev</div>
              <div className="text-[10px] text-gray-400 mt-0.5">
                {devFile ? devFile.name : 'Opcional (.csv)'}
              </div>
              <input
                type="file"
                accept=".csv"
                onChange={e => setDevFile(e.target.files?.[0] || null)}
                className="mt-2 text-[10px] w-full text-gray-400"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center space-x-2 rounded-lg bg-red-500/10 p-3 text-xs text-red-400 border border-red-500/20">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {status && (
            <div className="flex items-center space-x-2 rounded-lg bg-blue-500/10 p-3 text-xs text-blue-400 border border-blue-500/20">
              <CheckCircle2 className="h-4 w-4 shrink-0 animate-pulse" />
              <span>{status}</span>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end space-x-3 border-t pt-4 border-gray-800">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white"
          >
            Cancelar
          </button>
          <button
            onClick={handleProcess}
            className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-500"
          >
            Procesar Registros de Pozo
          </button>
        </div>
      </div>
    </div>
  );
};
