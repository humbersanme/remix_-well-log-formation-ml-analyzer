import { WellDataPoint, WellInfo } from './types';

export const WELL_PRESETS: WellInfo[] = [
  {
    id: 'pozo_1',
    name: 'Pozo 1',
    folderName: 'Pozo_1_csv',
    depthRange: { min: 3000, max: 10702 },
    fileDev: 'Datos_desviacion _POZO_1.csv',
    fileGas: 'Gases_acacias_Pozo1_final_SUP_A_10702_FT.csv',
    filePar: 'Parametros_profundidad_POZO_1_0702ft_2.csv',
  },
  {
    id: 'pozo_2',
    name: 'Pozo 2',
    folderName: 'Pozo_2_csv',
    depthRange: { min: 2800, max: 11200 },
    fileDev: 'Datos_desviacion_POZO_2.csv',
    fileGas: 'Gases_acacias_Pozo2_11200_FT.csv',
    filePar: 'Parametros_profundidad_POZO_2.csv',
  },
  {
    id: 'pozo_3',
    name: 'Pozo 3',
    folderName: 'Pozo_3_csv',
    depthRange: { min: 3500, max: 12500 },
    fileDev: 'Datos_desviacion_POZO_3.csv',
    fileGas: 'Gases_chichimene_Pozo3_12500_FT.csv',
    filePar: 'Parametros_profundidad_POZO_3.csv',
  },
];

export function generateWellPoints(wellId: string): WellDataPoint[] {
  const well = WELL_PRESETS.find(w => w.id === wellId) || WELL_PRESETS[0];
  const startMD = well.depthRange.min;
  const endMD = well.depthRange.max;
  const step = 15;

  const points: WellDataPoint[] = [];

  for (let depth = startMD; depth <= endMD; depth += step) {
    // Geological zone simulation
    let baseROP = 45;
    let baseGas = 180;
    let c1 = 120;
    let c2c3 = 30;
    let wob = 22;
    let torque = 8.5;

    // Formation 1: 3000 - 4500 ft (Upper Sand/Shale sequence)
    if (depth < 4500) {
      baseROP = 65 + Math.sin(depth / 80) * 15;
      baseGas = 120 + Math.cos(depth / 100) * 40;
      c1 = baseGas * 0.8;
      c2c3 = baseGas * 0.15;
      wob = 18 + Math.sin(depth / 200) * 4;
      torque = 6.5 + Math.cos(depth / 150) * 1.5;
    } 
    // Formation 2: 4500 - 6800 ft (Dense Shale - Low ROP, Gas peaks)
    else if (depth < 6800) {
      baseROP = 28 + Math.sin(depth / 50) * 10;
      baseGas = 450 + Math.sin(depth / 120) * 220;
      c1 = baseGas * 0.65;
      c2c3 = baseGas * 0.30;
      wob = 26 + Math.cos(depth / 180) * 5;
      torque = 11.0 + Math.sin(depth / 100) * 2.5;
    } 
    // Formation 3: 6800 - 8900 ft (High permeability Reservoir - Fast ROP, High C1/C2C3 ratio)
    else if (depth < 8900) {
      baseROP = 85 + Math.cos(depth / 60) * 25;
      baseGas = 850 + Math.sin(depth / 90) * 400;
      c1 = baseGas * 0.75;
      c2c3 = baseGas * 0.22;
      wob = 20 + Math.sin(depth / 140) * 3;
      torque = 9.0 + Math.cos(depth / 120) * 2.0;
    } 
    // Formation 4: 8900 - 10702+ ft (Basement / Carbonates - Hard drilling, high MSE)
    else {
      baseROP = 20 + Math.sin(depth / 40) * 8;
      baseGas = 320 + Math.cos(depth / 110) * 150;
      c1 = baseGas * 0.70;
      c2c3 = baseGas * 0.25;
      wob = 32 + Math.sin(depth / 160) * 6;
      torque = 14.5 + Math.cos(depth / 90) * 3.5;
    }

    // Add geological noise and gas kicks
    const noiseRop = (Math.random() - 0.5) * 8;
    const noiseGas = (Math.random() - 0.5) * 40;

    const rop = Math.max(5, Math.round(baseROP + noiseRop));
    const totalGas = Math.max(10, Math.round(baseGas + noiseGas));
    const finalC1 = Math.max(5, Math.round(c1 + (Math.random() - 0.5) * 20));
    const finalC2C3 = Math.max(2, Math.round(c2c3 + (Math.random() - 0.5) * 10));
    const finalWob = Math.max(5, Number((wob + (Math.random() - 0.5) * 1.5).toFixed(1)));
    const finalTorque = Math.max(1, Number((torque + (Math.random() - 0.5) * 0.8).toFixed(1)));

    const mse = Number(((finalWob + finalTorque * 100) / rop).toFixed(1));

    points.push({
      MD_ft: depth,
      ROP: rop,
      ROP_smooth: rop, // Will be smoothed in pipeline
      TotalGas: totalGas,
      C1: finalC1,
      C2C3: finalC2C3,
      WOB: finalWob,
      Torque: finalTorque,
      MSE: mse,
    });
  }

  return points;
}
