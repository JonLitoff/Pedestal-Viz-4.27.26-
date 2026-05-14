import React, { useState, useRef } from 'react';
import { PedestalInputs, CalculatedData } from '../types/pedestal';
import { getBarData } from '../utils/aciData';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { hapticFeedback, isMobile } from '../utils/mobileFeatures';

interface ElevationViewProps {
  inputs: PedestalInputs;
  data: CalculatedData;
}

const ElevationView: React.FC<ElevationViewProps> = ({ inputs, data }) => {
  const [viewMode, setViewMode] = useState<'length' | 'width'>('length');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  const padding = 60;
  const width = 800;
  const height = 600;

  const isLengthView = viewMode === 'length';
  const viewDim = isLengthView ? inputs.pedestalLength : inputs.pedestalWidth;
  const totalHeight = inputs.pedestalHeight + inputs.boltProjection;

  // Scale factor to fit pedestal in the view
  const maxDim = Math.max(viewDim, totalHeight);
  const baseScale = (height - 2 * padding) / maxDim;
  const scale = baseScale * zoom;

  const toPx = (val: number) => val * scale;
  const centerX = width / 2 + pan.x;
  const bottomY = height - padding + pan.y;

  const vBar = getBarData(inputs.verticalBarSize);
  const tBar = getBarData(inputs.tieBarSize);

  // Filter bars visible in this view
  const visibleBars = data.verticalBars.filter(bar => 
    isLengthView ? Math.abs(bar.y) === Math.max(...data.verticalBars.map(b => Math.abs(b.y))) :
                   Math.abs(bar.x) === Math.max(...data.verticalBars.map(b => Math.abs(b.x)))
  );

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(z => Math.min(Math.max(z * delta, 0.5), 5));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    if (isMobile()) hapticFeedback('light');
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({ x: touch.clientX - pan.x, y: touch.clientY - pan.y });
      hapticFeedback('light');
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setPan({ x: touch.clientX - dragStart.x, y: touch.clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsDragging(false);
  const handleTouchEnd = () => setIsDragging(false);

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className="w-full h-full flex flex-col bg-white">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom(z => Math.min(z * 1.2, 5))}
            className="p-1.5 bg-white border border-slate-200 rounded hover:bg-slate-100"
            title="Zoom In"
          >
            <ZoomIn size={16} />
          </button>
          <button
            onClick={() => setZoom(z => Math.max(z * 0.8, 0.5))}
            className="p-1.5 bg-white border border-slate-200 rounded hover:bg-slate-100"
            title="Zoom Out"
          >
            <ZoomOut size={16} />
          </button>
          <button
            onClick={resetView}
            className="p-1.5 bg-white border border-slate-200 rounded hover:bg-slate-100"
            title="Reset View"
          >
            <RotateCcw size={16} />
          </button>
          <span className="text-xs text-slate-500 ml-2">{Math.round(zoom * 100)}%</span>
        </div>
        <span className="text-xs text-slate-400">Scroll to zoom, drag to pan</span>
      </div>

      <div className="flex items-center gap-4 px-4 py-2 bg-slate-50 border-b border-slate-200">
        <button
          onClick={() => setViewMode('length')}
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
            viewMode === 'length' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Length Face View
        </button>
        <button
          onClick={() => setViewMode('width')}
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
            viewMode === 'width' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Width Face View
        </button>
      </div>

      <div 
        className="flex-1 overflow-hidden cursor-grab active:cursor-grabbing"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <svg
          ref={svgRef}
          id="elevation-svg"
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full drop-shadow-sm"
          style={{ minWidth: width, minHeight: height }}
        >
          {/* Pedestal Concrete */}
          <rect
            x={centerX - toPx(viewDim / 2)}
            y={bottomY - toPx(inputs.pedestalHeight)}
            width={toPx(viewDim)}
            height={toPx(inputs.pedestalHeight)}
            fill="#f1f5f9"
            stroke="#cbd5e1"
            strokeWidth="2"
          />

          {/* Grout Layer */}
          <rect
            x={centerX - toPx(viewDim / 2)}
            y={bottomY - toPx(inputs.pedestalHeight + inputs.groutThickness)}
            width={toPx(viewDim)}
            height={toPx(inputs.groutThickness)}
            fill="#fef3c7"
            stroke="#f59e0b"
            strokeWidth="1"
          />

          {/* Baseplate */}
          <rect
            x={centerX - toPx((isLengthView ? inputs.baseplateLength : inputs.baseplateWidth) / 2)}
            y={bottomY - toPx(inputs.pedestalHeight + inputs.groutThickness + inputs.baseplateThickness)}
            width={toPx(isLengthView ? inputs.baseplateLength : inputs.baseplateWidth)}
            height={toPx(inputs.baseplateThickness)}
            fill="#475569"
            stroke="#1e293b"
            strokeWidth="1"
          />

          {/* Vertical Rebar */}
          {visibleBars.map((bar, idx) => (
            <rect
              key={idx}
              x={centerX + toPx(isLengthView ? bar.x : bar.y) - toPx(vBar.diameter / 2)}
              y={bottomY - toPx(inputs.pedestalHeight)}
              width={toPx(vBar.diameter)}
              height={toPx(inputs.pedestalHeight)}
              fill="#3b82f6"
              stroke="#1d4ed8"
              strokeWidth="0.5"
            />
          ))}

          {/* Ties */}
          {data.ties.map((tie, idx) => {
            if (tie.type === 'outer') {
              return (
                <g key={idx}>
                  <line
                    x1={centerX - toPx((isLengthView ? tie.length! : tie.width!) / 2)}
                    y1={bottomY - toPx(tie.z)}
                    x2={centerX + toPx((isLengthView ? tie.length! : tie.width!) / 2)}
                    y2={bottomY - toPx(tie.z)}
                    stroke="#1e40af"
                    strokeWidth={toPx(tBar.diameter)}
                    strokeLinecap="round"
                  />
                  <path
                    d={`M ${centerX - toPx((isLengthView ? tie.length! : tie.width!) / 2)} ${bottomY - toPx(tie.z)} 
                       L ${centerX - toPx((isLengthView ? tie.length! : tie.width!) / 2) + 10} ${bottomY - toPx(tie.z) + 10}`}
                    stroke="#1e40af"
                    strokeWidth={toPx(tBar.diameter)}
                    fill="none"
                  />
                </g>
              );
            } else if (tie.type === 'crosstie_x' && isLengthView) {
              return (
                <line
                  key={idx}
                  x1={centerX + toPx(tie.startX!)}
                  y1={bottomY - toPx(tie.z)}
                  x2={centerX + toPx(tie.endX!)}
                  y2={bottomY - toPx(tie.z)}
                  stroke="#1e40af"
                  strokeWidth={toPx(tBar.diameter)}
                  strokeLinecap="round"
                />
              );
            } else if (tie.type === 'crosstie_y' && !isLengthView) {
              return (
                <line
                  key={idx}
                  x1={centerX + toPx(tie.startY!)}
                  y1={bottomY - toPx(tie.z)}
                  x2={centerX + toPx(tie.endY!)}
                  y2={bottomY - toPx(tie.z)}
                  stroke="#1e40af"
                  strokeWidth={toPx(tBar.diameter)}
                  strokeLinecap="round"
                />
              );
            } else if (tie.type === 'crosstie_y' && isLengthView) {
              return (
                <circle
                  key={idx}
                  cx={centerX + toPx(tie.x!)}
                  cy={bottomY - toPx(tie.z)}
                  r={toPx(tBar.diameter / 2)}
                  fill="#1e40af"
                />
              );
            } else if (tie.type === 'crosstie_x' && !isLengthView) {
              return (
                <circle
                  key={idx}
                  cx={centerX + toPx(tie.y!)}
                  cy={bottomY - toPx(tie.z)}
                  r={toPx(tBar.diameter / 2)}
                  fill="#1e40af"
                />
              );
            } else if (tie.type === 'user_c_tie' && tie.points && tie.points.length === 2) {
              const p1 = tie.points[0];
              const p2 = tie.points[1];
              const isParallelToX = Math.abs(p1.y - p2.y) < 0.01;
              
              if (isParallelToX && isLengthView) {
                return (
                  <line
                    key={idx}
                    x1={centerX + toPx(Math.min(p1.x, p2.x))}
                    y1={bottomY - toPx(tie.z)}
                    x2={centerX + toPx(Math.max(p1.x, p2.x))}
                    y2={bottomY - toPx(tie.z)}
                    stroke="#1e40af"
                    strokeWidth={toPx(tBar.diameter)}
                    strokeLinecap="round"
                  />
                );
              } else if (!isParallelToX && !isLengthView) {
                return (
                  <line
                    key={idx}
                    x1={centerX + toPx(Math.min(p1.y, p2.y))}
                    y1={bottomY - toPx(tie.z)}
                    x2={centerX + toPx(Math.max(p1.y, p2.y))}
                    y2={bottomY - toPx(tie.z)}
                    stroke="#1e40af"
                    strokeWidth={toPx(tBar.diameter)}
                    strokeLinecap="round"
                  />
                );
              } else if (!isParallelToX && isLengthView) {
                return (
                  <circle
                    key={idx}
                    cx={centerX + toPx(p1.x)}
                    cy={bottomY - toPx(tie.z)}
                    r={toPx(tBar.diameter / 2)}
                    fill="#1e40af"
                  />
                );
              } else if (isParallelToX && !isLengthView) {
                return (
                  <circle
                    key={idx}
                    cx={centerX + toPx(p1.y)}
                    cy={bottomY - toPx(tie.z)}
                    r={toPx(tBar.diameter / 2)}
                    fill="#1e40af"
                  />
                );
              }
            } else if (tie.type === 'user_closed' && tie.points && tie.points.length === 4) {
              const minX = Math.min(...tie.points.map(p => p.x));
              const maxX = Math.max(...tie.points.map(p => p.x));
              const minY = Math.min(...tie.points.map(p => p.y));
              const maxY = Math.max(...tie.points.map(p => p.y));
              
              if (isLengthView) {
                return (
                  <g key={idx}>
                    <line
                      x1={centerX + toPx(minX)}
                      y1={bottomY - toPx(tie.z)}
                      x2={centerX + toPx(maxX)}
                      y2={bottomY - toPx(tie.z)}
                      stroke="#1e40af"
                      strokeWidth={toPx(tBar.diameter)}
                      strokeLinecap="round"
                    />
                  </g>
                );
              } else {
                return (
                  <g key={idx}>
                    <line
                      x1={centerX + toPx(minY)}
                      y1={bottomY - toPx(tie.z)}
                      x2={centerX + toPx(maxY)}
                      y2={bottomY - toPx(tie.z)}
                      stroke="#1e40af"
                      strokeWidth={toPx(tBar.diameter)}
                      strokeLinecap="round"
                    />
                  </g>
                );
              }
            }
            return null;
          })}

          {/* Anchor Bolts */}
          {inputs.bolts.map((bolt, idx) => {
            const boltPos = isLengthView ? bolt.x : bolt.y;
            const boltTop = bottomY - toPx(inputs.pedestalHeight + inputs.boltProjection);
            const boltBottom = boltTop + toPx(inputs.boltTotalLength);
            const boltDia = typeof inputs.boltDiameter === 'number' ? inputs.boltDiameter : 1.0;
            const nutHeight = boltDia;
            const nutWidth = boltDia * 1.5;
            
            const topNutY = bottomY - toPx(inputs.pedestalHeight + inputs.groutThickness + inputs.baseplateThickness) - toPx(nutHeight);
            const bottomNutY = boltBottom - toPx(inputs.threadLengthAtBottom);

            return (
              <g key={idx}>
                <rect
                  x={centerX + toPx(boltPos) - toPx(boltDia / 2)}
                  y={boltTop}
                  width={toPx(boltDia)}
                  height={toPx(inputs.boltTotalLength)}
                  fill="#f97316"
                  stroke="#ea580c"
                  strokeWidth="0.5"
                />
                {/* Top Nut */}
                <rect
                  x={centerX + toPx(boltPos) - toPx(nutWidth / 2)}
                  y={topNutY}
                  width={toPx(nutWidth)}
                  height={toPx(nutHeight)}
                  fill="#94a3b8"
                  stroke="#475569"
                  strokeWidth="1"
                />
                {/* Bottom Nut */}
                <rect
                  x={centerX + toPx(boltPos) - toPx(nutWidth / 2)}
                  y={bottomNutY}
                  width={toPx(nutWidth)}
                  height={toPx(nutHeight)}
                  fill="#94a3b8"
                  stroke="#475569"
                  strokeWidth="1"
                />
                {/* Embedment Label */}
                {idx === 0 && (
                  <g>
                    {/* Total Bolt Length (Left side of bolt) */}
                    <line
                      x1={centerX + toPx(boltPos) - 15}
                      y1={boltTop}
                      x2={centerX + toPx(boltPos) - 15}
                      y2={boltBottom}
                      stroke="#ea580c"
                      strokeWidth="1"
                    />
                    {/* Ticks for Total Bolt Length */}
                    <line x1={centerX + toPx(boltPos) - 20} y1={boltTop} x2={centerX + toPx(boltPos) - 10} y2={boltTop} stroke="#ea580c" strokeWidth="1" />
                    <line x1={centerX + toPx(boltPos) - 20} y1={boltBottom} x2={centerX + toPx(boltPos) - 10} y2={boltBottom} stroke="#ea580c" strokeWidth="1" />
                    <text
                      x={centerX + toPx(boltPos) - 25}
                      y={boltTop + toPx(inputs.boltTotalLength / 2)}
                      fontSize="10"
                      className="fill-orange-600 font-bold"
                      textAnchor="middle"
                      transform={`rotate(-90, ${centerX + toPx(boltPos) - 25}, ${boltTop + toPx(inputs.boltTotalLength / 2)})`}
                    >
                      Total Length = {inputs.boltTotalLength.toFixed(2)}"
                    </text>

                    {/* Embedment Depth (Right side of bolt) */}
                    <line
                      x1={centerX + toPx(boltPos) + 15}
                      y1={bottomY - toPx(inputs.pedestalHeight)}
                      x2={centerX + toPx(boltPos) + 15}
                      y2={bottomY - toPx(inputs.pedestalHeight) + toPx(data.boltEmbedment)}
                      stroke="#ea580c"
                      strokeWidth="1"
                    />
                    {/* Ticks for Embedment Depth */}
                    <line x1={centerX + toPx(boltPos) + 10} y1={bottomY - toPx(inputs.pedestalHeight)} x2={centerX + toPx(boltPos) + 20} y2={bottomY - toPx(inputs.pedestalHeight)} stroke="#ea580c" strokeWidth="1" />
                    <line x1={centerX + toPx(boltPos) + 10} y1={bottomY - toPx(inputs.pedestalHeight) + toPx(data.boltEmbedment)} x2={centerX + toPx(boltPos) + 20} y2={bottomY - toPx(inputs.pedestalHeight) + toPx(data.boltEmbedment)} stroke="#ea580c" strokeWidth="1" />
                    <text
                      x={centerX + toPx(boltPos) + 25}
                      y={bottomY - toPx(inputs.pedestalHeight) + toPx(data.boltEmbedment / 2)}
                      fontSize="10"
                      className="fill-orange-600 font-bold"
                      textAnchor="middle"
                      transform={`rotate(90, ${centerX + toPx(boltPos) + 25}, ${bottomY - toPx(inputs.pedestalHeight) + toPx(data.boltEmbedment / 2)})`}
                    >
                      Embedment = {data.boltEmbedment.toFixed(2)}"
                    </text>

                    {/* Thread Length at Bottom (Right side of bolt, below embedment) */}
                    <line
                      x1={centerX + toPx(boltPos) + 15}
                      y1={bottomY - toPx(inputs.pedestalHeight) + toPx(data.boltEmbedment)}
                      x2={centerX + toPx(boltPos) + 15}
                      y2={boltBottom}
                      stroke="#ea580c"
                      strokeWidth="1"
                    />
                    {/* Tick for bottom of thread length */}
                    <line x1={centerX + toPx(boltPos) + 10} y1={boltBottom} x2={centerX + toPx(boltPos) + 20} y2={boltBottom} stroke="#ea580c" strokeWidth="1" />
                    <text
                      x={centerX + toPx(boltPos) + 25}
                      y={bottomY - toPx(inputs.pedestalHeight) + toPx(data.boltEmbedment) + toPx(inputs.threadLengthAtBottom / 2)}
                      fontSize="10"
                      className="fill-orange-600 font-bold"
                      textAnchor="middle"
                      transform={`rotate(90, ${centerX + toPx(boltPos) + 25}, ${bottomY - toPx(inputs.pedestalHeight) + toPx(data.boltEmbedment) + toPx(inputs.threadLengthAtBottom / 2)})`}
                    >
                      Thread = {inputs.threadLengthAtBottom.toFixed(2)}"
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* XYZ Axis Indicator */}
          <g transform="translate(30, 30)">
            <rect x="-5" y="-5" width="75" height="75" fill="white" fillOpacity="0.85" stroke="#e2e8f0" rx="4" />
            {/* Origin dot */}
            <circle cx="8" cy="55" r="3" fill="#1e293b" />
            {/* Horizontal axis arrow (X for length view, Z for width view) */}
            <line x1="8" y1="55" x2="58" y2="55" stroke={isLengthView ? "#ef4444" : "#3b82f6"} strokeWidth="2" />
            <polygon points="58,51 66,55 58,59" fill={isLengthView ? "#ef4444" : "#3b82f6"} />
            <text x="50" y="50" fontSize="9" fontWeight="bold" className={isLengthView ? "fill-red-500" : "fill-blue-500"}>{isLengthView ? "X" : "Z"}</text>
            {/* Y axis arrow (up = vertical) */}
            <line x1="8" y1="55" x2="8" y2="10" stroke="#22c55e" strokeWidth="2" />
            <polygon points="4,10 8,2 12,10" fill="#22c55e" />
            <text x="14" y="14" fontSize="9" fontWeight="bold" className="fill-green-500">Y</text>
          </g>

          {/* Dimensions */}
          <g className="dimensions">
            {/* Height */}
            <line x1={centerX - toPx(viewDim / 2) - 30} y1={bottomY} x2={centerX - toPx(viewDim / 2) - 30} y2={bottomY - toPx(inputs.pedestalHeight)} stroke="black" strokeWidth="1" />
            <text x={centerX - toPx(viewDim / 2) - 45} y={bottomY - toPx(inputs.pedestalHeight / 2)} textAnchor="middle" fontSize="12" transform={`rotate(-90, ${centerX - toPx(viewDim / 2) - 45}, ${bottomY - toPx(inputs.pedestalHeight / 2)})`}>H = {inputs.pedestalHeight}"</text>
            
            {/* Grout + Baseplate */}
            <line x1={centerX - toPx(viewDim / 2) - 30} y1={bottomY - toPx(inputs.pedestalHeight)} x2={centerX - toPx(viewDim / 2) - 30} y2={bottomY - toPx(inputs.pedestalHeight + inputs.groutThickness + inputs.baseplateThickness)} stroke="black" strokeWidth="1" />
            
            {/* Projection */}
            <line x1={centerX + toPx(viewDim / 2) + 30} y1={bottomY - toPx(inputs.pedestalHeight)} x2={centerX + toPx(viewDim / 2) + 30} y2={bottomY - toPx(totalHeight)} stroke="black" strokeWidth="1" />
            <text x={centerX + toPx(viewDim / 2) + 45} y={bottomY - toPx(totalHeight - inputs.boltProjection / 2)} textAnchor="middle" fontSize="10" transform={`rotate(90, ${centerX + toPx(viewDim / 2) + 45}, ${bottomY - toPx(totalHeight - inputs.boltProjection / 2)})`}>Proj = {inputs.boltProjection}"</text>
          </g>
        </svg>
      </div>
    </div>
  );
};

export default ElevationView;
