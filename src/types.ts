export interface WellDataPoint {
  MD_ft: number;
  ROP: number;
  ROP_smooth: number;
  TotalGas: number;
  C1: number;
  C2C3: number;
  WOB: number;
  Torque: number;
  MSE: number;
  // Advanced ML & Gas Ratios
  Wh?: number; // Wetness Ratio = (C2+C3+C4)/TotalGas * 100
  Ba?: number; // Balance Ratio = (C1+C2)/(C3+C4)
  Ch?: number; // Character Ratio = (C4+C5)/C3
  FluidType?: 'Dry Gas' | 'Wet Gas' | 'Oil Show' | 'Residual / Tight';
  Cluster?: number;
  Is_Top?: boolean;
}

export interface FormationTop {
  id: string;
  MD_ft: number;
  Confidence: number;
  Cluster?: number;
  Name?: string;
  Lithology?: string;
  ROP_before?: number;
  ROP_after?: number;
  Gas_peak?: number;
  MSE_avg?: number;
  FluidType?: string;
}

export interface WellInfo {
  id: string;
  name: string;
  folderName: string;
  depthRange: { min: number; max: number };
  fileDev: string;
  fileGas: string;
  filePar: string;
}

export interface MLConfig {
  nClusters: number;
  smoothingWindow: number;
  tolerance: number;
  randomState: number;
  minDepth: number;
  maxDepth: number;
  clusteringMethod: 'kmeans' | 'dbscan' | 'hierarchical';
  featureWeights: {
    rop: number;
    gas: number;
    mse: number;
    c1c2: number;
  };
}

export interface MultiWellCorrelationPoint {
  MD_ft: number;
  Pozo_1: number;
  Pozo_2: number;
  Pozo_3: number;
}

export interface CSVColumnMapping {
  depthCol?: string;
  ropCol?: string;
  wobCol?: string;
  torqueCol?: string;
  c1Col?: string;
  c2Col?: string;
  c3Col?: string;
  totalGasCol?: string;
}

export interface AIAnalysisResult {
  summary: string;
  formationBreakdown: Array<{
    depth: number;
    name: string;
    lithology: string;
    potentialHydrocarbons: string;
    drillingRisk: string;
  }>;
  recommendations: string[];
}

