import { WellDataPoint, FormationTop, WellInfo } from '../types';

interface WellDataBundle {
  well: WellInfo;
  processedData: WellDataPoint[];
  tops: FormationTop[];
}

export function generateCorrelationPNG(
  wellsData: WellDataBundle[],
  isDark: boolean = true
): string {
  const canvas = document.createElement('canvas');
  const width = 1600;
  const height = 900;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Theme Colors
  const bgColor = isDark ? '#0d1117' : '#f8fafc';
  const cardBg = isDark ? '#161b22' : '#ffffff';
  const cardBorder = isDark ? '#30363d' : '#cbd5e1';
  const textColor = isDark ? '#ffffff' : '#0f172a';
  const subTextColor = isDark ? '#94a3b8' : '#64748b';
  const gridColor = isDark ? '#21262d' : '#e2e8f0';

  // Curve Colors
  const ropColor = '#38bdf8'; // Sky Blue
  const gasColor = '#f87171'; // Coral Red
  const c1Color = '#4ade80';  // Emerald
  const topColor = '#f59e0b'; // Amber Gold

  // Fill Canvas Background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);

  // --- HEADER SECTION ---
  ctx.fillStyle = isDark ? '#161b22' : '#ffffff';
  ctx.fillRect(0, 0, width, 100);
  ctx.strokeStyle = cardBorder;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 100);
  ctx.lineTo(width, 100);
  ctx.stroke();

  // Header Title
  ctx.fillStyle = textColor;
  ctx.font = 'bold 24px Inter, system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('ESTUDIO DE CORRELACIÓN ESTRATIGRÁFICA MULTI-POZO (ML KMEANS)', 40, 42);

  // Header Subtitle
  ctx.fillStyle = subTextColor;
  ctx.font = '14px Inter, system-ui, sans-serif';
  ctx.fillText(
    'Alineación Estratigráfica de Registros ROP, Gas Total y Contactos de Formación | Campo Acacias - Chichimene',
    40,
    72
  );

  // Badge / Date timestamp
  ctx.fillStyle = isDark ? '#1f2937' : '#e2e8f0';
  ctx.fillRect(width - 280, 25, 240, 50);
  ctx.strokeStyle = isDark ? '#8b5cf6' : '#7c3aed';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(width - 280, 25, 240, 50);

  ctx.fillStyle = '#a78bfa';
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('PYTHON MATPLOTLIB ENGINE', width - 160, 46);
  ctx.fillStyle = subTextColor;
  ctx.font = '11px monospace';
  ctx.fillText(new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' }), width - 160, 64);

  // --- 3 WELL PANELS LAYOUT ---
  const marginX = 40;
  const marginY = 130;
  const totalAreaWidth = width - marginX * 2;
  const panelGap = 40;
  const panelWidth = (totalAreaWidth - panelGap * 2) / 3;
  const panelHeight = 680;

  const minDepth = 2500;
  const maxDepth = 12500;
  const depthSpan = maxDepth - minDepth;

  const depthToY = (md: number) => {
    return marginY + 60 + ((md - minDepth) / depthSpan) * (panelHeight - 80);
  };

  // Collect formation tops for correlation lines across wells
  const wellTopsMap: { [wellIdx: number]: { [topName: string]: number } } = { 0: {}, 1: {}, 2: {} };

  wellsData.forEach((bundle, idx) => {
    const px = marginX + idx * (panelWidth + panelGap);

    // Panel Outer Box
    ctx.fillStyle = cardBg;
    ctx.strokeStyle = cardBorder;
    ctx.lineWidth = 1.5;
    ctx.fillRect(px, marginY, panelWidth, panelHeight);
    ctx.strokeRect(px, marginY, panelWidth, panelHeight);

    // Panel Header Box
    ctx.fillStyle = isDark ? '#1f2937' : '#f1f5f9';
    ctx.fillRect(px, marginY, panelWidth, 50);
    ctx.strokeStyle = cardBorder;
    ctx.strokeRect(px, marginY, panelWidth, 50);

    // Well Title
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 15px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(bundle.well.name, px + panelWidth / 2, marginY + 24);

    // Depth Range Subtitle
    ctx.fillStyle = subTextColor;
    ctx.font = '11px monospace';
    ctx.fillText(
      `PROFUNDIDAD: ${bundle.well.depthRange.min} - ${bundle.well.depthRange.max} FT MD`,
      px + panelWidth / 2,
      marginY + 42
    );

    // Grid Depth Lines
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    for (let md = 3000; md <= 12000; md += 1000) {
      const y = depthToY(md);
      ctx.beginPath();
      ctx.moveTo(px, y);
      ctx.lineTo(px + panelWidth, y);
      ctx.stroke();

      // Depth Label
      ctx.fillStyle = subTextColor;
      ctx.font = '10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`${md} FT`, px + 6, y - 3);
    }

    // --- CURVE PLOTTING ---
    const data = bundle.processedData;
    if (data && data.length > 0) {
      // 1. ROP Curve (Sky Blue)
      const maxRop = Math.max(100, ...data.map(d => d.ROP_smooth || 0));
      ctx.strokeStyle = ropColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      data.forEach((d, i) => {
        const y = depthToY(d.MD_ft);
        const x = px + 10 + ((d.ROP_smooth || 0) / maxRop) * (panelWidth * 0.45);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // 2. Total Gas Curve (Coral Red) - Log Scale in %
      ctx.strokeStyle = gasColor;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      data.forEach((d, i) => {
        const y = depthToY(d.MD_ft);
        const pct = Math.max(0.001, Math.min(100, (d.TotalGas || 0) / 10000));
        const logVal = Math.log10(pct);
        const frac = Math.max(0, Math.min(1, (logVal - (-3)) / 5));
        const x = px + panelWidth - 10 - frac * (panelWidth * 0.45);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }

    // --- FORMATION TOPS ---
    bundle.tops.forEach((top) => {
      const y = depthToY(top.MD_ft);

      // Save top for inter-well correlation
      if (top.Name) {
        wellTopsMap[idx][top.Name] = y;
      }

      // Horizontal Formation Top line
      ctx.strokeStyle = topColor;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 3]);
      ctx.beginPath();
      ctx.moveTo(px, y);
      ctx.lineTo(px + panelWidth, y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Top Tag Badge
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(px + 4, y - 10, 140, 20);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 10px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${top.Name} (${top.MD_ft} FT)`, px + 8, y + 4);
    });
  });

  // --- INTER-WELL STRATIGRAPHIC CORRELATION LINES & FILLS ---
  const formationNames = [
    'Formación A',
    'Formación B',
    'Formación C',
    'Formación D',
    'Formación E',
    'Formación F',
    'Formación G',
    'Formación H',
  ];

  const correlationColors = [
    'rgba(56, 189, 248, 0.6)',  // Sky Blue
    'rgba(248, 113, 113, 0.6)',  // Red
    'rgba(250, 204, 21, 0.6)',   // Yellow
    'rgba(192, 132, 252, 0.6)',  // Purple
    'rgba(52, 211, 153, 0.6)',   // Green
  ];

  formationNames.forEach((fname, fIdx) => {
    // Find tops matching this formation in well 0, 1, 2
    const y0 = Object.entries(wellTopsMap[0]).find(([k]) => k.startsWith(fname) || k.includes(fname))?.[1];
    const y1 = Object.entries(wellTopsMap[1]).find(([k]) => k.startsWith(fname) || k.includes(fname))?.[1];
    const y2 = Object.entries(wellTopsMap[2]).find(([k]) => k.startsWith(fname) || k.includes(fname))?.[1];

    const color = correlationColors[fIdx % correlationColors.length];

    // Correlation line Well 0 -> Well 1
    if (y0 !== undefined && y1 !== undefined) {
      const p0x = marginX + panelWidth;
      const p1x = marginX + panelWidth + panelGap;

      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(p0x, y0);
      ctx.lineTo(p1x, y1);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Correlation line Well 1 -> Well 2
    if (y1 !== undefined && y2 !== undefined) {
      const p1x = marginX + panelWidth * 2 + panelGap;
      const p2x = marginX + panelWidth * 2 + panelGap * 2;

      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(p1x, y1);
      ctx.lineTo(p2x, y2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  });

  // --- FOOTER & LEGEND SECTION ---
  const footerY = height - 50;
  ctx.fillStyle = isDark ? '#161b22' : '#ffffff';
  ctx.fillRect(0, footerY, width, 50);
  ctx.strokeStyle = cardBorder;
  ctx.lineWidth = 1;
  ctx.strokeRect(0, footerY, width, 50);

  // Legend Items
  ctx.textAlign = 'left';
  ctx.font = 'bold 12px Inter, sans-serif';

  // Item 1: ROP Curve
  ctx.fillStyle = ropColor;
  ctx.fillRect(60, footerY + 18, 20, 12);
  ctx.fillStyle = textColor;
  ctx.fillText('ROP (ft/hr)', 88, footerY + 28);

  // Item 2: Total Gas Curve
  ctx.fillStyle = gasColor;
  ctx.fillRect(220, footerY + 18, 20, 12);
  ctx.fillStyle = textColor;
  ctx.fillText('Gas Total (%, Log)', 248, footerY + 28);

  // Item 3: Formation Top
  ctx.fillStyle = topColor;
  ctx.fillRect(400, footerY + 18, 20, 12);
  ctx.fillStyle = textColor;
  ctx.fillText('Topes de Formación ML', 428, footerY + 28);

  // Item 4: Correlation Line
  ctx.strokeStyle = '#a78bfa';
  ctx.lineWidth = 3;
  ctx.setLineDash([4, 2]);
  ctx.beginPath();
  ctx.moveTo(620, footerY + 24);
  ctx.lineTo(650, footerY + 24);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = textColor;
  ctx.fillText('Línea de Correlación Estratigráfica', 658, footerY + 28);

  // Copyright / Software info on right
  ctx.fillStyle = subTextColor;
  ctx.font = '11px monospace';
  ctx.textAlign = 'right';
  ctx.fillText('ANÁLISIS DE FORMACIÓN POZO v2.0 • Exportación PNG de Alta Resolución', width - 40, footerY + 28);

  return canvas.toDataURL('image/png');
}
