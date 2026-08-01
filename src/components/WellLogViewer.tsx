import React, { useRef, useEffect, useState } from 'react';
import { WellDataPoint, FormationTop } from '../types';
import {
  Activity,
  Flame,
  Gauge,
  Layers,
  Zap,
  Sparkles,
  SlidersHorizontal,
  Compass,
} from 'lucide-react';

interface WellLogViewerProps {
  data: WellDataPoint[];
  tops: FormationTop[];
  theme: 'dark' | 'light';
  onHoverDepth?: (depth: number | null, point: WellDataPoint | null) => void;
  selectedTopId?: string | null;
  onSelectTop?: (top: FormationTop) => void;
}

export const WellLogViewer: React.FC<WellLogViewerProps> = ({
  data,
  tops,
  theme,
  onHoverDepth,
  selectedTopId,
  onSelectTop,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoverDepth, setHoverDepth] = useState<number | null>(null);
  const [hoverPoint, setHoverPoint] = useState<WellDataPoint | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  const isDark = theme === 'dark';

  const BG_COLOR = isDark ? '#0d1117' : '#ffffff';
  const TRACK_BG = isDark ? '#161b22' : '#f8fafc';
  const GRID_COLOR = isDark ? '#30363d' : '#cbd5e1';
  const TEXT_COLOR = isDark ? '#ffffff' : '#0f172a';

  const COLORS = {
    ROP: '#38bdf8', // Bright Sky Blue
    GAS: '#f87171', // Bright Coral Red
    C1: '#4ade80',  // Bright Emerald
    C2C3: '#fb923c',// Bright Amber
    WOB: '#facc15', // Bright Yellow
    TORQUE: '#c084fc',// Bright Purple
    MSE: '#34d399', // Bright Green
    TOP: '#fbbf24', // Golden Amber
    TOP_LINE: 'rgba(56, 189, 248, 0.8)',
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth || 1000;
    // Cap height between 1200px and 2200px to prevent exceeding GPU/browser max canvas dimensions (>16384px)
    const height = Math.min(2200, Math.max(1200, Math.floor(data.length * 0.2)));

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Background
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, width, height);

    const marginHeader = 100; // Expanded header height for maximum track title & scale visibility
    const marginSide = 15;
    const trackGap = 12;
    const totalTracks = 6;
    const availableWidth = width - marginSide * 2 - trackGap * (totalTracks - 1);
    const trackWidth = availableWidth / totalTracks;

    const minDepth = data[0].MD_ft;
    const maxDepth = data[data.length - 1].MD_ft;
    const depthSpan = maxDepth - minDepth || 1;
    const plotHeight = height - marginHeader - 30;

    const depthToY = (md: number) => {
      return marginHeader + ((md - minDepth) / depthSpan) * plotHeight;
    };

    // Calculate max values for scales with NaN safety
    const maxRop = Math.max(100, ...data.map(d => (isNaN(d.ROP_smooth) ? 0 : d.ROP_smooth)));
    const maxGas = Math.max(500, ...data.map(d => (isNaN(d.TotalGas) ? 0 : d.TotalGas)));
    const maxC1 = Math.max(300, ...data.map(d => (isNaN(d.C1) ? 0 : d.C1)));
    const maxC2C3 = Math.max(100, ...data.map(d => (isNaN(d.C2C3) ? 0 : d.C2C3)));
    const maxWob = Math.max(40, ...data.map(d => (isNaN(d.WOB) ? 0 : d.WOB)));
    const maxTorque = Math.max(20, ...data.map(d => (isNaN(d.Torque) ? 0 : d.Torque)));
    const maxMse = Math.max(150, ...data.map(d => (isNaN(d.MSE) ? 0 : Math.min(d.MSE, 300))));

    const tracksConfig = [
      {
        title: 'ROP (ft/hr)',
        color: COLORS.ROP,
        sub: 'Velocidad Perforación',
        minScale: '0',
        maxScale: `${maxRop} ft/h`,
      },
      {
        title: 'Gas Total (%)',
        color: COLORS.GAS,
        sub: 'Escala Logarítmica (%)',
        minScale: '0.001%',
        maxScale: '100%',
      },
      {
        title: 'C1 / C2+C3 (ppm)',
        color: COLORS.C1,
        sub: 'Cromatografía Log (PPM)',
        minScale: '1 ppm',
        maxScale: '100k ppm',
      },
      {
        title: 'WOB / Torque',
        color: COLORS.WOB,
        sub: 'Carga & Torque',
        minScale: 'WOB 0-40',
        maxScale: 'TQ 0-20',
      },
      {
        title: 'MSE (Proxy)',
        color: COLORS.MSE,
        sub: 'Energía Mecánica',
        minScale: '0',
        maxScale: `${maxMse}`,
      },
      {
        title: 'TOPES ML',
        color: COLORS.TOP,
        sub: 'Clusters KMeans',
        minScale: '0%',
        maxScale: '100% Conf',
      },
    ];

    // Render Track Backgrounds & Headers
    for (let i = 0; i < totalTracks; i++) {
      const tx = marginSide + i * (trackWidth + trackGap);

      // Track Container Box
      ctx.fillStyle = TRACK_BG;
      ctx.fillRect(tx, marginHeader, trackWidth, plotHeight);
      ctx.strokeStyle = GRID_COLOR;
      ctx.lineWidth = 1;
      ctx.strokeRect(tx, marginHeader, trackWidth, plotHeight);

      // --- Enhanced High-Visibility Track Header Box in Canvas ---
      const headerBoxY = 10;
      const headerBoxH = 80;
      const headerBg = isDark ? '#161b22' : '#f1f5f9';
      const headerBorder = isDark ? '#30363d' : '#cbd5e1';

      ctx.fillStyle = headerBg;
      ctx.strokeStyle = headerBorder;
      ctx.lineWidth = 1.5;

      if ('roundRect' in ctx) {
        ctx.beginPath();
        (ctx as any).roundRect(tx, headerBoxY, trackWidth, headerBoxH, 8);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillRect(tx, headerBoxY, trackWidth, headerBoxH);
        ctx.strokeRect(tx, headerBoxY, trackWidth, headerBoxH);
      }

      // Track Badge Pill (e.g. TRACK 1)
      const pillW = 68;
      const pillH = 18;
      const pillX = tx + (trackWidth - pillW) / 2;
      const pillY = headerBoxY + 8;

      ctx.fillStyle = isDark ? '#1f2937' : '#e2e8f0';
      ctx.strokeStyle = tracksConfig[i].color;
      ctx.lineWidth = 1.5;

      if ('roundRect' in ctx) {
        ctx.beginPath();
        (ctx as any).roundRect(pillX, pillY, pillW, pillH, 6);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillRect(pillX, pillY, pillW, pillH);
        ctx.strokeRect(pillX, pillY, pillW, pillH);
      }

      ctx.fillStyle = tracksConfig[i].color;
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`TRACK ${i + 1}`, tx + trackWidth / 2, pillY + 12);

      // Header Title
      ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
      ctx.font = 'bold 13px Inter, sans-serif';
      ctx.fillText(tracksConfig[i].title, tx + trackWidth / 2, headerBoxY + 42);

      // Subtitle
      ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
      ctx.font = '10px Inter, sans-serif';
      ctx.fillText(tracksConfig[i].sub, tx + trackWidth / 2, headerBoxY + 56);

      // Scale range text at bottom of header box
      ctx.fillStyle = tracksConfig[i].color;
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(tracksConfig[i].minScale, tx + 6, headerBoxY + 72);
      ctx.textAlign = 'right';
      ctx.fillText(tracksConfig[i].maxScale, tx + trackWidth - 6, headerBoxY + 72);

      // Horizontal Depth Grid Lines
      ctx.strokeStyle = GRID_COLOR;
      ctx.lineWidth = 0.5;
      const stepMD = Math.ceil(depthSpan / 20 / 100) * 100 || 100;

      for (let md = Math.ceil(minDepth / stepMD) * stepMD; md <= maxDepth; md += stepMD) {
        const y = depthToY(md);
        ctx.beginPath();
        ctx.moveTo(tx, y);
        ctx.lineTo(tx + trackWidth, y);
        ctx.stroke();

        // Depth label on track 0 left
        if (i === 0) {
          ctx.fillStyle = isDark ? '#94a3b8' : '#475569';
          ctx.font = 'bold 11px monospace';
          ctx.textAlign = 'right';
          ctx.fillText(`${md}ft`, tx - 4, y + 4);
        }
      }
    }

    // --- TRACK 0: ROP ---
    const tx0 = marginSide + 0 * (trackWidth + trackGap);
    ctx.beginPath();
    data.forEach((d, idx) => {
      const y = depthToY(d.MD_ft);
      const x = tx0 + Math.min(1, (d.ROP_smooth || 0) / maxRop) * trackWidth;
      if (idx === 0) ctx.moveTo(tx0, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = COLORS.ROP;
    ctx.lineWidth = 2.0;
    ctx.stroke();

    // ROP Fill
    ctx.beginPath();
    ctx.moveTo(tx0, depthToY(minDepth));
    data.forEach(d => {
      const y = depthToY(d.MD_ft);
      const x = tx0 + Math.min(1, (d.ROP_smooth || 0) / maxRop) * trackWidth;
      ctx.lineTo(x, y);
    });
    ctx.lineTo(tx0, depthToY(maxDepth));
    ctx.closePath();
    ctx.fillStyle = `${COLORS.ROP}33`; // Alpha fill
    ctx.fill();

    // --- TRACK 1: Total Gas (%) Log Scale ---
    const tx1 = marginSide + 1 * (trackWidth + trackGap);
    // Log10 scale for Gas Total in % from 0.001% (10 ppm) to 100% (100,000 ppm)
    const getGasPctX = (ppmVal: number) => {
      const pct = Math.max(0.001, Math.min(100, (ppmVal || 0) / 10000));
      const logVal = Math.log10(pct);
      const frac = Math.max(0, Math.min(1, (logVal - (-3)) / 5)); // log range -3 (0.001%) to +2 (100%)
      return tx1 + frac * trackWidth;
    };

    ctx.beginPath();
    data.forEach((d, idx) => {
      const y = depthToY(d.MD_ft);
      const x = getGasPctX(d.TotalGas || 0);
      if (idx === 0) ctx.moveTo(tx1, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = COLORS.GAS;
    ctx.lineWidth = 1.8;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(tx1, depthToY(minDepth));
    data.forEach(d => {
      const y = depthToY(d.MD_ft);
      const x = getGasPctX(d.TotalGas || 0);
      ctx.lineTo(x, y);
    });
    ctx.lineTo(tx1, depthToY(maxDepth));
    ctx.closePath();
    ctx.fillStyle = `${COLORS.GAS}33`;
    ctx.fill();

    // --- TRACK 2: C1 & C2+C3 Log Scale (PPM) ---
    const tx2 = marginSide + 2 * (trackWidth + trackGap);
    // Log10 scale for chromatography PPM from 1 ppm (10^0) to 100,000 ppm (10^5)
    const getChromPpmX = (ppmVal: number) => {
      const clampedPpm = Math.max(1, Math.min(100000, ppmVal || 0));
      const logVal = Math.log10(clampedPpm);
      const frac = Math.max(0, Math.min(1, (logVal - 0) / 5)); // log range 0 (1 ppm) to 5 (100,000 ppm)
      return tx2 + frac * trackWidth;
    };

    // C1 Curve
    ctx.beginPath();
    data.forEach((d, idx) => {
      const y = depthToY(d.MD_ft);
      const x = getChromPpmX(d.C1 || 0);
      if (idx === 0) ctx.moveTo(tx2, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = COLORS.C1;
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // C2+C3 Curve
    ctx.beginPath();
    data.forEach((d, idx) => {
      const y = depthToY(d.MD_ft);
      const x = getChromPpmX(d.C2C3 || 0);
      if (idx === 0) ctx.moveTo(tx2, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = COLORS.C2C3;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.stroke();
    ctx.setLineDash([]);

    // --- TRACK 3: WOB & Torque ---
    const tx3 = marginSide + 3 * (trackWidth + trackGap);
    // WOB
    ctx.beginPath();
    data.forEach((d, idx) => {
      const y = depthToY(d.MD_ft);
      const x = tx3 + Math.min(1, (d.WOB || 0) / maxWob) * trackWidth;
      if (idx === 0) ctx.moveTo(tx3, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = COLORS.WOB;
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Torque
    ctx.beginPath();
    data.forEach((d, idx) => {
      const y = depthToY(d.MD_ft);
      const x = tx3 + Math.min(1, (d.Torque || 0) / maxTorque) * trackWidth;
      if (idx === 0) ctx.moveTo(tx3, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = COLORS.TORQUE;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 2]);
    ctx.stroke();
    ctx.setLineDash([]);

    // --- TRACK 4: MSE Proxy ---
    const tx4 = marginSide + 4 * (trackWidth + trackGap);
    ctx.beginPath();
    data.forEach((d, idx) => {
      const y = depthToY(d.MD_ft);
      const mseClamped = Math.min(d.MSE || 0, maxMse);
      const x = tx4 + (mseClamped / maxMse) * trackWidth;
      if (idx === 0) ctx.moveTo(tx4, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = COLORS.MSE;
    ctx.lineWidth = 1.8;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(tx4, depthToY(minDepth));
    data.forEach(d => {
      const y = depthToY(d.MD_ft);
      const mseClamped = Math.min(d.MSE || 0, maxMse);
      const x = tx4 + (mseClamped / maxMse) * trackWidth;
      ctx.lineTo(x, y);
    });
    ctx.lineTo(tx4, depthToY(maxDepth));
    ctx.closePath();
    ctx.fillStyle = `${COLORS.MSE}22`;
    ctx.fill();

    // --- TRACK 5: ML Tops ---
    const tx5 = marginSide + 5 * (trackWidth + trackGap);
    tops.forEach(top => {
      const y = depthToY(top.MD_ft);

      // Horizontal boundary line across ALL tracks
      ctx.strokeStyle = COLORS.TOP_LINE;
      ctx.lineWidth = top.id === selectedTopId ? 3.0 : 1.2;
      ctx.setLineDash([5, 3]);
      ctx.beginPath();
      ctx.moveTo(marginSide, y);
      ctx.lineTo(width - marginSide, y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Bar on Track 5
      const barWidth = top.Confidence * trackWidth;
      ctx.fillStyle = top.id === selectedTopId ? '#f97316' : COLORS.TOP;
      ctx.fillRect(tx5, y - 6, barWidth, 12);

      // Label
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`${top.MD_ft}ft (${Math.round(top.Confidence * 100)}%)`, tx5 + barWidth + 4, y + 3);
    });

    // =========================================================
    // OVERLAY: HIGH-VISIBILITY DEPTH NUMBERS OVER ALL 6 TRACKS
    // =========================================================
    const stepMD = Math.ceil(depthSpan / 16 / 50) * 50 || 50;

    for (let md = Math.ceil(minDepth / stepMD) * stepMD; md <= maxDepth; md += stepMD) {
      const y = depthToY(md);

      // High visibility depth line across all 6 tracks
      ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.4)' : 'rgba(2, 132, 199, 0.4)';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(marginSide, y);
      ctx.lineTo(width - marginSide, y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Render Depth Badges ON TOP of every track
      for (let i = 0; i < totalTracks; i++) {
        const tx = marginSide + i * (trackWidth + trackGap);
        const centerX = tx + trackWidth / 2;

        const pillW = 68;
        const pillH = 18;
        const pillX = centerX - pillW / 2;
        const pillY = y - pillH / 2;

        // High contrast pill background
        ctx.fillStyle = isDark ? '#090d16' : '#ffffff';
        ctx.strokeStyle = isDark ? '#38bdf8' : '#0284c7';
        ctx.lineWidth = 1.2;

        if ('roundRect' in ctx) {
          ctx.beginPath();
          (ctx as any).roundRect(pillX, pillY, pillW, pillH, 5);
          ctx.fill();
          ctx.stroke();
        } else {
          ctx.fillRect(pillX, pillY, pillW, pillH);
          ctx.strokeRect(pillX, pillY, pillW, pillH);
        }

        // Depth number text
        ctx.fillStyle = isDark ? '#38bdf8' : '#0369a1';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${md} FT`, centerX, y + 4);
      }
    }

    // Active mouse hover depth line & badges on canvas
    if (hoverDepth) {
      const hy = depthToY(hoverDepth);

      // Bright amber hover line across canvas
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.0;
      ctx.setLineDash([4, 2]);
      ctx.beginPath();
      ctx.moveTo(marginSide, hy);
      ctx.lineTo(width - marginSide, hy);
      ctx.stroke();
      ctx.setLineDash([]);

      // Floating cursor depth badges on every track
      for (let i = 0; i < totalTracks; i++) {
        const tx = marginSide + i * (trackWidth + trackGap);
        const centerX = tx + trackWidth / 2;

        const badgeW = 78;
        const badgeH = 20;
        const badgeX = centerX - badgeW / 2;
        const badgeY = hy - badgeH / 2;

        ctx.fillStyle = '#f59e0b'; // Amber background
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;

        if ('roundRect' in ctx) {
          ctx.beginPath();
          (ctx as any).roundRect(badgeX, badgeY, badgeW, badgeH, 6);
          ctx.fill();
          ctx.stroke();
        } else {
          ctx.fillRect(badgeX, badgeY, badgeW, badgeH);
          ctx.strokeRect(badgeX, badgeY, badgeW, badgeH);
        }

        ctx.fillStyle = '#0f172a'; // Dark text
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`► ${hoverDepth} FT`, centerX, hy + 4);
      }
    }

  }, [data, tops, theme, selectedTopId, hoverDepth]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const x = e.clientX - rect.left;

    const marginHeader = 100;
    const minDepth = data[0].MD_ft;
    const maxDepth = data[data.length - 1].MD_ft;
    const depthSpan = maxDepth - minDepth || 1;
    const plotHeight = canvas.clientHeight - marginHeader - 30;

    if (y < marginHeader || y > canvas.clientHeight - 30) {
      setHoverDepth(null);
      setHoverPoint(null);
      setMousePos(null);
      if (onHoverDepth) onHoverDepth(null, null);
      return;
    }

    const depth = minDepth + ((y - marginHeader) / plotHeight) * depthSpan;
    const closest = data.reduce((prev, curr) =>
      Math.abs(curr.MD_ft - depth) < Math.abs(prev.MD_ft - depth) ? curr : prev
    );

    setHoverDepth(closest.MD_ft);
    setHoverPoint(closest);
    setMousePos({ x, y });

    if (onHoverDepth) onHoverDepth(closest.MD_ft, closest);
  };

  const handleMouseLeave = () => {
    setHoverDepth(null);
    setHoverPoint(null);
    setMousePos(null);
    if (onHoverDepth) onHoverDepth(null, null);
  };

  const handleClick = () => {
    if (!hoverDepth) return;
    const nearestTop = tops.find(t => Math.abs(t.MD_ft - hoverDepth) < 30);
    if (nearestTop && onSelectTop) {
      onSelectTop(nearestTop);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-2xl border p-4 shadow-2xl transition-colors ${
        isDark
          ? 'border-gray-800 bg-[#0d1117] text-gray-100'
          : 'border-slate-300 bg-white text-slate-900'
      }`}
    >
      <div className="min-w-[1000px]">
        {/* Prominent Sticky HTML Header Panel with 6 High-Visibility Track Cards */}
        <div
          className={`sticky top-0 z-30 mb-4 rounded-2xl border p-3.5 shadow-xl backdrop-blur-md transition-colors ${
            isDark
              ? 'border-gray-800 bg-[#161b22]/95 text-gray-100 shadow-black/60'
              : 'border-slate-300 bg-white/95 text-slate-900 shadow-slate-200'
          }`}
        >
          <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-gray-800/60 text-xs">
            <div className="flex items-center space-x-2 font-bold uppercase tracking-wider text-purple-400">
              <SlidersHorizontal className="h-4 w-4 text-purple-400" />
              <span>Panel Control de Tracks Geológicos (6 Columnas de Registro)</span>
            </div>
            <div className="text-[11px] font-mono flex items-center space-x-4">
              <span className="text-gray-400">
                Léctura Activa:{' '}
                <strong className="text-sky-400">
                  {hoverPoint ? `${hoverPoint.MD_ft} FT MD` : 'Pase el cursor sobre la gráfica'}
                </strong>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-6 gap-3 px-[15px]">
            {/* TRACK 1 */}
            <div
              className={`rounded-xl border p-2.5 flex flex-col justify-between transition-all ${
                isDark
                  ? 'border-sky-500/40 bg-sky-950/20 hover:border-sky-500/70'
                  : 'border-sky-300 bg-sky-50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded bg-sky-500/20 border border-sky-500/40 px-1.5 py-0.5 text-[10px] font-mono font-bold text-sky-300">
                    TRACK 1
                  </span>
                  <Gauge className="h-3.5 w-3.5 text-sky-400" />
                </div>
                <div className="mt-1.5 font-bold text-xs text-sky-300 truncate">ROP (ft/hr)</div>
                <div className="text-[10px] text-gray-400 truncate">Velocidad Perforación</div>
              </div>
              <div className="mt-2 pt-2 border-t border-sky-500/20 flex items-center justify-between font-mono text-[11px]">
                <span className="text-gray-400">Lectura:</span>
                <span className="font-bold text-sky-400">
                  {hoverPoint ? `${hoverPoint.ROP_smooth} ft/h` : '---'}
                </span>
              </div>
            </div>

            {/* TRACK 2 */}
            <div
              className={`rounded-xl border p-2.5 flex flex-col justify-between transition-all ${
                isDark
                  ? 'border-red-500/40 bg-red-950/20 hover:border-red-500/70'
                  : 'border-red-300 bg-red-50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded bg-red-500/20 border border-red-500/40 px-1.5 py-0.5 text-[10px] font-mono font-bold text-red-300">
                    TRACK 2
                  </span>
                  <Flame className="h-3.5 w-3.5 text-red-400" />
                </div>
                <div className="mt-1.5 font-bold text-xs text-red-300 truncate">Gas Total (%)</div>
                <div className="text-[10px] text-gray-400 truncate">Escala Logarítmica (%)</div>
              </div>
              <div className="mt-2 pt-2 border-t border-red-500/20 flex items-center justify-between font-mono text-[11px]">
                <span className="text-gray-400">Lectura:</span>
                <span className="font-bold text-red-400 text-[10px]">
                  {hoverPoint ? `${((hoverPoint.TotalGas || 0) / 10000).toFixed(3)}% (${hoverPoint.TotalGas} ppm)` : '---'}
                </span>
              </div>
            </div>

            {/* TRACK 3 */}
            <div
              className={`rounded-xl border p-2.5 flex flex-col justify-between transition-all ${
                isDark
                  ? 'border-emerald-500/40 bg-emerald-950/20 hover:border-emerald-500/70'
                  : 'border-emerald-300 bg-emerald-50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded bg-emerald-500/20 border border-emerald-500/40 px-1.5 py-0.5 text-[10px] font-mono font-bold text-emerald-300">
                    TRACK 3
                  </span>
                  <Layers className="h-3.5 w-3.5 text-emerald-400" />
                </div>
                <div className="mt-1.5 font-bold text-xs text-emerald-300 truncate">C1 / C2+C3 (ppm)</div>
                <div className="text-[10px] text-gray-400 truncate">Escala Logarítmica (PPM)</div>
              </div>
              <div className="mt-2 pt-2 border-t border-emerald-500/20 flex items-center justify-between font-mono text-[10px]">
                <span className="text-emerald-400 font-bold">
                  {hoverPoint ? `C1:${hoverPoint.C1}ppm` : 'C1'}
                </span>
                <span className="text-amber-400 font-bold">
                  {hoverPoint ? `C2+:${hoverPoint.C2C3}ppm` : 'C2+C3'}
                </span>
              </div>
            </div>

            {/* TRACK 4 */}
            <div
              className={`rounded-xl border p-2.5 flex flex-col justify-between transition-all ${
                isDark
                  ? 'border-yellow-500/40 bg-yellow-950/20 hover:border-yellow-500/70'
                  : 'border-yellow-300 bg-yellow-50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded bg-yellow-500/20 border border-yellow-500/40 px-1.5 py-0.5 text-[10px] font-mono font-bold text-yellow-300">
                    TRACK 4
                  </span>
                  <Compass className="h-3.5 w-3.5 text-yellow-400" />
                </div>
                <div className="mt-1.5 font-bold text-xs text-yellow-300 truncate">WOB / Torque</div>
                <div className="text-[10px] text-gray-400 truncate">klbs / kft-lbs</div>
              </div>
              <div className="mt-2 pt-2 border-t border-yellow-500/20 flex items-center justify-between font-mono text-[10px]">
                <span className="text-yellow-400 font-bold">
                  {hoverPoint ? `WOB:${hoverPoint.WOB}` : 'WOB'}
                </span>
                <span className="text-purple-400 font-bold">
                  {hoverPoint ? `TQ:${hoverPoint.Torque}` : 'Torque'}
                </span>
              </div>
            </div>

            {/* TRACK 5 */}
            <div
              className={`rounded-xl border p-2.5 flex flex-col justify-between transition-all ${
                isDark
                  ? 'border-green-500/40 bg-green-950/20 hover:border-green-500/70'
                  : 'border-green-300 bg-green-50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded bg-green-500/20 border border-green-500/40 px-1.5 py-0.5 text-[10px] font-mono font-bold text-green-300">
                    TRACK 5
                  </span>
                  <Zap className="h-3.5 w-3.5 text-green-400" />
                </div>
                <div className="mt-1.5 font-bold text-xs text-green-300 truncate">MSE (Proxy)</div>
                <div className="text-[10px] text-gray-400 truncate">Energía Mecánica</div>
              </div>
              <div className="mt-2 pt-2 border-t border-green-500/20 flex items-center justify-between font-mono text-[11px]">
                <span className="text-gray-400">Lectura:</span>
                <span className="font-bold text-green-400">
                  {hoverPoint ? `${hoverPoint.MSE}` : '---'}
                </span>
              </div>
            </div>

            {/* TRACK 6 */}
            <div
              className={`rounded-xl border p-2.5 flex flex-col justify-between transition-all ${
                isDark
                  ? 'border-amber-500/40 bg-amber-950/20 hover:border-amber-500/70'
                  : 'border-amber-300 bg-amber-50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded bg-amber-500/20 border border-amber-500/40 px-1.5 py-0.5 text-[10px] font-mono font-bold text-amber-300">
                    TRACK 6
                  </span>
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                </div>
                <div className="mt-1.5 font-bold text-xs text-amber-300 truncate">TOPES ML</div>
                <div className="text-[10px] text-gray-400 truncate">KMeans Clusters</div>
              </div>
              <div className="mt-2 pt-2 border-t border-amber-500/20 flex items-center justify-between font-mono text-[11px]">
                <span className="text-gray-400">Cluster:</span>
                <span className="font-bold text-amber-300">
                  {hoverPoint && hoverPoint.Cluster !== undefined ? `C#${hoverPoint.Cluster}` : '---'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Geological 6-Track Log Canvas */}
        <canvas
          ref={canvasRef}
          onClick={handleClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="cursor-crosshair w-full block rounded-xl shadow-inner"
          style={{ minHeight: '1200px' }}
        />

        {/* Dynamic Synchronized Hover Line Indicator Bar */}
        {mousePos && hoverPoint && (
          <div
            className="pointer-events-none absolute left-0 right-0 z-20 flex items-center px-4"
            style={{ top: `${mousePos.y + 16}px` }}
          >
            <div
              className={`flex items-center space-x-4 rounded-xl border px-3.5 py-1.5 text-xs shadow-2xl backdrop-blur-md ${
                isDark
                  ? 'border-sky-500/40 bg-gray-900/95 text-sky-200 shadow-black/80'
                  : 'border-sky-400 bg-white/95 text-slate-800'
              }`}
            >
              <span className="font-mono font-bold text-sky-400 text-sm">
                {hoverPoint.MD_ft} FT MD
              </span>
              <span>
                ROP: <strong className="text-sky-300">{hoverPoint.ROP_smooth} ft/h</strong>
              </span>
              <span>
                Gas: <strong className="text-red-400">{hoverPoint.TotalGas} ppm</strong>
              </span>
              <span>
                C1: <strong className="text-emerald-400">{hoverPoint.C1}</strong>
              </span>
              <span>
                C2+: <strong className="text-amber-400">{hoverPoint.C2C3}</strong>
              </span>
              <span>
                WOB: <strong className="text-yellow-400">{hoverPoint.WOB} klbs</strong>
              </span>
              <span>
                Torque: <strong className="text-purple-400">{hoverPoint.Torque} kft-lb</strong>
              </span>
              <span>
                MSE: <strong className="text-green-400">{hoverPoint.MSE}</strong>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

