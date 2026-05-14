import React, { useState, useRef, useEffect } from 'react';
import { PedestalInputs, CalculatedData } from '../types/pedestal';
import { getBarData } from '../utils/aciData';
import { generateDefaultUserTies } from '../utils/autoFillTies';

import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { hapticFeedback, isMobile } from '../utils/mobileFeatures';

interface PlanViewProps {
  inputs: PedestalInputs;
  data: CalculatedData;
  setInputs: React.Dispatch<React.SetStateAction<PedestalInputs>>;
}

const PlanView: React.FC<PlanViewProps> = ({ inputs, data, setInputs }) => {
  const [selectedBars, setSelectedBars] = useState<number[]>([]);
  const [editMode, setEditMode] = useState(false);
  const padding = 40;
  const width = 600;
  const height = 600;

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  // Scale factor to fit pedestal in the view
  const maxDim = Math.max(inputs.pedestalLength, inputs.pedestalWidth);
  const baseScale = (width - 2 * padding) / maxDim;
  const scale = baseScale * zoom;

  const toPx = (val: number) => val * scale;
  const centerX = width / 2 + pan.x;
  const centerY = height / 2 + pan.y;

  const vBar = getBarData(inputs.verticalBarSize);
  const tBar = getBarData(inputs.tieBarSize);

  // Find the top-left bolt (most negative x and y)
  const topLeftBolt = inputs.bolts.reduce((min, bolt) => 
    (bolt.x < min.x || (bolt.x === min.x && bolt.y < min.y)) ? bolt : min
  , inputs.bolts[0]);

  // Calculate distances from top-left bolt to each rebar
  const rebarDistances = data.verticalBars.map(bar => {
    const dx = bar.x - topLeftBolt.x;
    const dy = bar.y - topLeftBolt.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return { bar, distance, dx, dy };
  });

  // Filter rebar that are within embedment/3
  const embedmentThird = data.boltEmbedment / 3;
  const showDimension = rebarDistances.filter(r => r.distance <= embedmentThird);

  // Calculate rebar clearance dimension
  let rebarClearance = 0;
  let rebarClearanceP1 = { x: 0, y: 0 };
  let rebarClearanceP2 = { x: 0, y: 0 };
  let showRebarClearance = false;

  if (inputs.barsAlongLength > 1) {
    const vRadius = vBar.diameter / 2;
    const xMax = inputs.pedestalLength / 2 - inputs.clearance - vRadius;
    const yMax = inputs.pedestalWidth / 2 - inputs.clearance - vRadius;
    const xStep = (2 * xMax) / (inputs.barsAlongLength - 1);
    
    rebarClearance = xStep - vBar.diameter;
    rebarClearanceP1 = { x: -xMax + vRadius, y: yMax };
    rebarClearanceP2 = { x: -xMax + xStep - vRadius, y: yMax };
    showRebarClearance = true;
  } else if (inputs.barsAlongWidth > 1) {
    const vRadius = vBar.diameter / 2;
    const xMax = inputs.pedestalLength / 2 - inputs.clearance - vRadius;
    const yMax = inputs.pedestalWidth / 2 - inputs.clearance - vRadius;
    const yStep = (2 * yMax) / (inputs.barsAlongWidth - 1);
    
    rebarClearance = yStep - vBar.diameter;
    rebarClearanceP1 = { x: xMax, y: -yMax + vRadius };
    rebarClearanceP2 = { x: xMax, y: -yMax + yStep - vRadius };
    showRebarClearance = true;
  }

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
    <div className="w-full h-full flex flex-col bg-white relative">
      
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
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setEditMode(!editMode);
              setSelectedBars([]);
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${editMode ? 'bg-blue-100 text-blue-700 border border-blue-300' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            {editMode ? 'Exit Tie Editor' : 'Edit Ties'}
          </button>
        </div>
      </div>

      
      
      {editMode && (
        <div className="absolute top-12 right-4 w-64 bg-white rounded-lg shadow-lg border border-slate-200 p-4 z-10 flex flex-col gap-3">
          <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">Tie Editor</h3>
          
          <div className="text-xs text-slate-600">
            Select bars in the plan view to create ties.
            <br/>Selected: <span className="font-bold">{selectedBars.length}</span> bars
          </div>

          <div className="flex gap-2">
            <button
              disabled={selectedBars.length !== 2}
              onClick={() => {
                const newTie = { id: Date.now().toString(), type: 'c-tie' as const, barIndices: [...selectedBars] };
                setInputs(prev => ({ ...prev, userTies: [...(prev.userTies || []), newTie] }));
                setSelectedBars([]);
              }}
              className="flex-1 py-1.5 bg-blue-50 text-blue-700 text-xs font-medium rounded border border-blue-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-100"
            >
              Add C-Tie (2 bars)
            </button>
            <button
              disabled={selectedBars.length < 4}
              onClick={() => {
                const newTie = { id: Date.now().toString(), type: 'closed' as const, barIndices: [...selectedBars] };
                setInputs(prev => ({ ...prev, userTies: [...(prev.userTies || []), newTie] }));
                setSelectedBars([]);
              }}
              className="flex-1 py-1.5 bg-blue-50 text-blue-700 text-xs font-medium rounded border border-blue-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-100"
            >
              Add Closed Tie (4+ bars)
            </button>
          </div>

          <div className="mt-2">
            <h4 className="text-xs font-bold text-slate-700 mb-2">Custom Ties</h4>
            {(!inputs.userTies || inputs.userTies.length === 0) ? (
              <div className="text-xs text-slate-400 italic">No custom ties defined.</div>
            ) : (
              <ul className="flex flex-col gap-1 max-h-32 overflow-y-auto">
                {inputs.userTies.map((tie, idx) => (
                  <li key={tie.id} className="flex items-center justify-between text-xs bg-slate-50 p-1.5 rounded border border-slate-100">
                    <span>{tie.type === 'c-tie' ? 'C-Tie' : 'Closed Tie'} ({tie.barIndices.length} bars)</span>
                    <button
                      onClick={() => {
                        setInputs(prev => ({
                          ...prev,
                          userTies: prev.userTies?.filter(t => t.id !== tie.id)
                        }));
                      }}
                      className="text-red-500 hover:text-red-700 px-1"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          
          <button
            onClick={() => {
              const defaultTies = generateDefaultUserTies(inputs);
              setInputs(prev => ({ ...prev, userTies: [...(prev.userTies || []), ...defaultTies] }));
            }}
            className="mt-2 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 rounded border border-emerald-200 hover:bg-emerald-100"
          >
            Auto-fill Missing Ties
          </button>

          <button
            onClick={() => {
              setInputs(prev => ({ ...prev, userTies: [] }));
            }}
            className="mt-2 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded hover:bg-slate-200"
          >
            Clear All Custom Ties
          </button>
        </div>
      )}

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
          id="plan-svg"
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full drop-shadow-sm"
          style={{ minWidth: width, minHeight: height }}
        >
        {/* Grid lines (optional) */}
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f1f5f9" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Pedestal Outline */}
        <rect
          x={centerX - toPx(inputs.pedestalLength / 2)}
          y={centerY - toPx(inputs.pedestalWidth / 2)}
          width={toPx(inputs.pedestalLength)}
          height={toPx(inputs.pedestalWidth)}
          fill="#f8fafc"
          stroke="#94a3b8"
          strokeWidth="3"
        />

        {/* Baseplate Outline */}
        <rect
          x={centerX - toPx(inputs.baseplateLength / 2)}
          y={centerY - toPx(inputs.baseplateWidth / 2)}
          width={toPx(inputs.baseplateLength)}
          height={toPx(inputs.baseplateWidth)}
          fill="none"
          stroke="#475569"
          strokeWidth="2"
          strokeDasharray="5,5"
        />

        {/* Ties (Top Tie) */}
        {data.ties.filter(t => t.z === data.ties[0]?.z).map((tie, idx) => {
          if (tie.type === 'outer') {
            return (
              <rect
                key={idx}
                x={centerX - toPx(tie.length! / 2)}
                y={centerY - toPx(tie.width! / 2)}
                width={toPx(tie.length!)}
                height={toPx(tie.width!)}
                fill="none"
                stroke="#1e40af"
                strokeWidth={toPx(tBar.diameter)}
                rx={toPx(tBar.diameter)}
              />
            );
          } else if (tie.type === 'crosstie_x') {
            return (
              <g key={idx}>
                <line
                  x1={centerX + toPx(tie.startX!)}
                  y1={centerY - toPx(tie.y!)}
                  x2={centerX + toPx(tie.endX!)}
                  y2={centerY - toPx(tie.y!)}
                  stroke="#1e40af"
                  strokeWidth={toPx(tBar.diameter)}
                />
                <path
                  d={`M ${centerX + toPx(tie.startX!)} ${centerY - toPx(tie.y!)} l 10 10`}
                  stroke="#1e40af"
                  strokeWidth={toPx(tBar.diameter)}
                  fill="none"
                />
                <path
                  d={`M ${centerX + toPx(tie.endX!)} ${centerY - toPx(tie.y!)} l -10 -10`}
                  stroke="#1e40af"
                  strokeWidth={toPx(tBar.diameter)}
                  fill="none"
                />
              </g>
            );
          } else if (tie.type === 'crosstie_y') {
            return (
              <g key={idx}>
                <line
                  x1={centerX + toPx(tie.x!)}
                  y1={centerY - toPx(tie.startY!)}
                  x2={centerX + toPx(tie.x!)}
                  y2={centerY - toPx(tie.endY!)}
                  stroke="#1e40af"
                  strokeWidth={toPx(tBar.diameter)}
                />
                <path
                  d={`M ${centerX + toPx(tie.x!)} ${centerY - toPx(tie.startY!)} l 10 -10`}
                  stroke="#1e40af"
                  strokeWidth={toPx(tBar.diameter)}
                  fill="none"
                />
                <path
                  d={`M ${centerX + toPx(tie.x!)} ${centerY - toPx(tie.endY!)} l -10 10`}
                  stroke="#1e40af"
                  strokeWidth={toPx(tBar.diameter)}
                  fill="none"
                />
              </g>
            );
          } else if (tie.type === 'user_c_tie' && tie.points) {
            return (
              <g key={idx}>
                <line
                  x1={centerX + toPx(tie.points[0].x)}
                  y1={centerY - toPx(tie.points[0].y)}
                  x2={centerX + toPx(tie.points[1].x)}
                  y2={centerY - toPx(tie.points[1].y)}
                  stroke="#1e40af"
                  strokeWidth={toPx(tBar.diameter)}
                />
                <path
                  d={`M ${centerX + toPx(tie.points[0].x)} ${centerY - toPx(tie.points[0].y)} l ${tie.points[0].x === tie.points[1].x ? '10 -10' : '10 10'}`}
                  stroke="#1e40af"
                  strokeWidth={toPx(tBar.diameter)}
                  fill="none"
                />
                <path
                  d={`M ${centerX + toPx(tie.points[1].x)} ${centerY - toPx(tie.points[1].y)} l ${tie.points[0].x === tie.points[1].x ? '-10 10' : '-10 -10'}`}
                  stroke="#1e40af"
                  strokeWidth={toPx(tBar.diameter)}
                  fill="none"
                />
              </g>
            );
          } else if (tie.type === 'user_closed' && tie.points) {
            return (
              <polygon
                key={idx}
                points={tie.points.map(p => `${centerX + toPx(p.x)},${centerY - toPx(p.y)}`).join(' ')}
                fill="none"
                stroke="#1e40af"
                strokeWidth={toPx(tBar.diameter)}
                strokeLinejoin="round"
              />
            );
          }
          return null;
        })}

        
        {/* Vertical Rebar */}
        {data.verticalBars.map((bar, idx) => {
          const isSelected = selectedBars.includes(idx);
          return (
          <g 
            key={idx} 
            onClick={() => {
              if (!editMode) return;
              setSelectedBars(prev => 
                prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
              );
            }}
            className={editMode ? "cursor-pointer" : ""}
          >
            <circle
              cx={centerX + toPx(bar.x)}
              cy={centerY - toPx(bar.y)}
              r={toPx(vBar.diameter / 2)}
              fill={isSelected ? "#facc15" : "#3b82f6"}
              stroke={isSelected ? "#ca8a04" : "#1d4ed8"}
              strokeWidth={isSelected ? "2" : "1"}
            />
            {/* Label for corner bars or every few bars */}
            {(idx === 0 || idx === data.verticalBars.length - 1) && (
              <text
                x={centerX + toPx(bar.x)}
                y={centerY - toPx(bar.y) - toPx(vBar.diameter) - 5}
                textAnchor="middle"
                fontSize="10"
                className="fill-slate-500 font-bold"
              >
                {vBar.size}
              </text>
            )}
            {isSelected && (
              <circle
                cx={centerX + toPx(bar.x)}
                cy={centerY - toPx(bar.y)}
                r={toPx(vBar.diameter / 2) + 4}
                fill="none"
                stroke="#facc15"
                strokeWidth="2"
                strokeDasharray="2,2"
              />
            )}
          </g>
        )})}

        {/* Anchor Bolts */}
        {inputs.bolts.map((bolt, idx) => (
          <g key={idx}>
            {/* Bolt Body */}
            <circle
              cx={centerX + toPx(bolt.x)}
              cy={centerY - toPx(bolt.y)}
              r={toPx((typeof inputs.boltDiameter === 'number' ? inputs.boltDiameter : 1.0) / 2)}
              fill="#f97316"
              stroke="#ea580c"
              strokeWidth="1"
            />
            {/* Centerlines */}
            <line
              x1={centerX + toPx(bolt.x) - 10}
              y1={centerY - toPx(bolt.y)}
              x2={centerX + toPx(bolt.x) + 10}
              y2={centerY - toPx(bolt.y)}
              stroke="#ea580c"
              strokeWidth="0.5"
              strokeDasharray="2,2"
            />
            <line
              x1={centerX + toPx(bolt.x)}
              y1={centerY - toPx(bolt.y) - 10}
              x2={centerX + toPx(bolt.x)}
              y2={centerY - toPx(bolt.y) + 10}
              stroke="#ea580c"
              strokeWidth="0.5"
              strokeDasharray="2,2"
            />
          </g>
        ))}

        {/* Dimension Lines */}
        {/* Pedestal Length */}
        <g className="dimensions">
          <line
            x1={centerX - toPx(inputs.pedestalLength / 2)}
            y1={centerY + toPx(inputs.pedestalWidth / 2) + 20}
            x2={centerX + toPx(inputs.pedestalLength / 2)}
            y2={centerY + toPx(inputs.pedestalWidth / 2) + 20}
            stroke="black"
            strokeWidth="1"
          />
          <text
            x={centerX}
            y={centerY + toPx(inputs.pedestalWidth / 2) + 35}
            textAnchor="middle"
            fontSize="12"
            className="fill-black font-medium"
          >
            L = {inputs.pedestalLength}"
          </text>
        </g>

        {/* Pedestal Width */}
        <g className="dimensions">
          <line
            x1={centerX + toPx(inputs.pedestalLength / 2) + 20}
            y1={centerY - toPx(inputs.pedestalWidth / 2)}
            x2={centerX + toPx(inputs.pedestalLength / 2) + 20}
            y2={centerY + toPx(inputs.pedestalWidth / 2)}
            stroke="black"
            strokeWidth="1"
          />
          <text
            x={centerX + toPx(inputs.pedestalLength / 2) + 35}
            y={centerY}
            textAnchor="middle"
            fontSize="12"
            transform={`rotate(90, ${centerX + toPx(inputs.pedestalLength / 2) + 35}, ${centerY})`}
            className="fill-black font-medium"
          >
            W = {inputs.pedestalWidth}"
          </text>
        </g>

        {/* Bolt to Rebar Dimensions (if within embedment/3) */}
        {showDimension.map((item, idx) => (
          <g key={idx}>
            <line
              x1={centerX + toPx(topLeftBolt.x)}
              y1={centerY - toPx(topLeftBolt.y)}
              x2={centerX + toPx(item.bar.x)}
              y2={centerY - toPx(item.bar.y)}
              stroke="#dc2626"
              strokeWidth="1"
              strokeDasharray="3,3"
            />
            <text
              x={(centerX + toPx(topLeftBolt.x) + centerX + toPx(item.bar.x)) / 2}
              y={(centerY - toPx(topLeftBolt.y) + centerY - toPx(item.bar.y)) / 2 - 5}
              textAnchor="middle"
              fontSize="9"
              className="fill-red-600 font-bold"
            >
              {item.distance.toFixed(2)}"
            </text>
          </g>
        ))}

        {/* Rebar Clearance Dimension */}
        {showRebarClearance && (
          <g className="dimensions">
            <line
              x1={centerX + toPx(rebarClearanceP1.x)}
              y1={centerY - toPx(rebarClearanceP1.y)}
              x2={centerX + toPx(rebarClearanceP2.x)}
              y2={centerY - toPx(rebarClearanceP2.y)}
              stroke="#059669"
              strokeWidth="1"
            />
            {/* Tick marks */}
            <line
              x1={centerX + toPx(rebarClearanceP1.x) - (inputs.barsAlongLength > 1 ? 0 : 5)}
              y1={centerY - toPx(rebarClearanceP1.y) - (inputs.barsAlongLength > 1 ? 5 : 0)}
              x2={centerX + toPx(rebarClearanceP1.x) + (inputs.barsAlongLength > 1 ? 0 : 5)}
              y2={centerY - toPx(rebarClearanceP1.y) + (inputs.barsAlongLength > 1 ? 5 : 0)}
              stroke="#059669"
              strokeWidth="1"
            />
            <line
              x1={centerX + toPx(rebarClearanceP2.x) - (inputs.barsAlongLength > 1 ? 0 : 5)}
              y1={centerY - toPx(rebarClearanceP2.y) - (inputs.barsAlongLength > 1 ? 5 : 0)}
              x2={centerX + toPx(rebarClearanceP2.x) + (inputs.barsAlongLength > 1 ? 0 : 5)}
              y2={centerY - toPx(rebarClearanceP2.y) + (inputs.barsAlongLength > 1 ? 5 : 0)}
              stroke="#059669"
              strokeWidth="1"
            />
            <text
              x={(centerX + toPx(rebarClearanceP1.x) + centerX + toPx(rebarClearanceP2.x)) / 2 + (inputs.barsAlongLength > 1 ? 0 : 15)}
              y={(centerY - toPx(rebarClearanceP1.y) + centerY - toPx(rebarClearanceP2.y)) / 2 - (inputs.barsAlongLength > 1 ? 8 : 0)}
              textAnchor="middle"
              fontSize="10"
              transform={inputs.barsAlongLength > 1 ? undefined : `rotate(90, ${(centerX + toPx(rebarClearanceP1.x) + centerX + toPx(rebarClearanceP2.x)) / 2 + 15}, ${(centerY - toPx(rebarClearanceP1.y) + centerY - toPx(rebarClearanceP2.y)) / 2})`}
              className="fill-emerald-600 font-bold"
            >
              Clr = {rebarClearance.toFixed(2)}"
            </text>
          </g>
        )}

        {/* Concrete Cover Dimensions */}
        <g className="dimensions">
          {/* Extension line for edge of concrete */}
          <line
            x1={centerX - toPx(inputs.pedestalLength / 2)}
            y1={centerY - toPx(inputs.pedestalWidth / 2)}
            x2={centerX - toPx(inputs.pedestalLength / 2)}
            y2={centerY - toPx(inputs.pedestalWidth / 2) - 45}
            stroke="#94a3b8"
            strokeWidth="0.5"
          />
          {/* Extension line for outside of tie */}
          <line
            x1={centerX - toPx(inputs.pedestalLength / 2) + toPx(inputs.clearance - tBar.diameter)}
            y1={centerY - toPx(inputs.pedestalWidth / 2) + toPx(inputs.clearance - tBar.diameter)}
            x2={centerX - toPx(inputs.pedestalLength / 2) + toPx(inputs.clearance - tBar.diameter)}
            y2={centerY - toPx(inputs.pedestalWidth / 2) - 25}
            stroke="#94a3b8"
            strokeWidth="0.5"
          />
          {/* Extension line for outside of vertical bar */}
          <line
            x1={centerX - toPx(inputs.pedestalLength / 2) + toPx(inputs.clearance)}
            y1={centerY - toPx(inputs.pedestalWidth / 2) + toPx(inputs.clearance)}
            x2={centerX - toPx(inputs.pedestalLength / 2) + toPx(inputs.clearance)}
            y2={centerY - toPx(inputs.pedestalWidth / 2) - 45}
            stroke="#94a3b8"
            strokeWidth="0.5"
          />

          {/* Dimension: Edge of concrete to outside of tie */}
          <line
            x1={centerX - toPx(inputs.pedestalLength / 2)}
            y1={centerY - toPx(inputs.pedestalWidth / 2) - 20}
            x2={centerX - toPx(inputs.pedestalLength / 2) + toPx(inputs.clearance - tBar.diameter)}
            y2={centerY - toPx(inputs.pedestalWidth / 2) - 20}
            stroke="#059669"
            strokeWidth="1"
          />
          {/* Tick marks */}
          <line
            x1={centerX - toPx(inputs.pedestalLength / 2)}
            y1={centerY - toPx(inputs.pedestalWidth / 2) - 23}
            x2={centerX - toPx(inputs.pedestalLength / 2)}
            y2={centerY - toPx(inputs.pedestalWidth / 2) - 17}
            stroke="#059669"
            strokeWidth="1"
          />
          <line
            x1={centerX - toPx(inputs.pedestalLength / 2) + toPx(inputs.clearance - tBar.diameter)}
            y1={centerY - toPx(inputs.pedestalWidth / 2) - 23}
            x2={centerX - toPx(inputs.pedestalLength / 2) + toPx(inputs.clearance - tBar.diameter)}
            y2={centerY - toPx(inputs.pedestalWidth / 2) - 17}
            stroke="#059669"
            strokeWidth="1"
          />
          <text
            x={centerX - toPx(inputs.pedestalLength / 2) + toPx((inputs.clearance - tBar.diameter) / 2)}
            y={centerY - toPx(inputs.pedestalWidth / 2) - 25}
            textAnchor="middle"
            fontSize="10"
            className="fill-emerald-600 font-bold"
          >
            {(inputs.clearance - tBar.diameter).toFixed(2)}"
          </text>

          {/* Dimension: Edge of concrete to outside of vertical bar */}
          <line
            x1={centerX - toPx(inputs.pedestalLength / 2)}
            y1={centerY - toPx(inputs.pedestalWidth / 2) - 40}
            x2={centerX - toPx(inputs.pedestalLength / 2) + toPx(inputs.clearance)}
            y2={centerY - toPx(inputs.pedestalWidth / 2) - 40}
            stroke="#059669"
            strokeWidth="1"
          />
          {/* Tick marks */}
          <line
            x1={centerX - toPx(inputs.pedestalLength / 2)}
            y1={centerY - toPx(inputs.pedestalWidth / 2) - 43}
            x2={centerX - toPx(inputs.pedestalLength / 2)}
            y2={centerY - toPx(inputs.pedestalWidth / 2) - 37}
            stroke="#059669"
            strokeWidth="1"
          />
          <line
            x1={centerX - toPx(inputs.pedestalLength / 2) + toPx(inputs.clearance)}
            y1={centerY - toPx(inputs.pedestalWidth / 2) - 43}
            x2={centerX - toPx(inputs.pedestalLength / 2) + toPx(inputs.clearance)}
            y2={centerY - toPx(inputs.pedestalWidth / 2) - 37}
            stroke="#059669"
            strokeWidth="1"
          />
          <text
            x={centerX - toPx(inputs.pedestalLength / 2) + toPx(inputs.clearance / 2)}
            y={centerY - toPx(inputs.pedestalWidth / 2) - 45}
            textAnchor="middle"
            fontSize="10"
            className="fill-emerald-600 font-bold"
          >
            {inputs.clearance.toFixed(2)}"
          </text>
        </g>

        {/* XYZ Axis Indicator */}
        <g transform="translate(30, 30)">
          <rect x="-5" y="-5" width="75" height="75" fill="white" fillOpacity="0.85" stroke="#e2e8f0" rx="4" />
          {/* Origin dot */}
          <circle cx="8" cy="8" r="3" fill="#1e293b" />
          <text x="2" y="22" fontSize="8" className="fill-slate-500" fontWeight="bold">0,0</text>
          {/* X axis arrow (right = pedestal length) */}
          <line x1="8" y1="8" x2="58" y2="8" stroke="#ef4444" strokeWidth="2" />
          <polygon points="58,4 66,8 58,12" fill="#ef4444" />
          <text x="48" y="20" fontSize="9" fontWeight="bold" className="fill-red-500">X</text>
          {/* Z axis arrow (down = pedestal width) */}
          <line x1="8" y1="8" x2="8" y2="58" stroke="#3b82f6" strokeWidth="2" />
          <polygon points="4,58 8,66 12,58" fill="#3b82f6" />
          <text x="14" y="62" fontSize="9" fontWeight="bold" className="fill-blue-500">Z</text>
        </g>

        {/* Legend */}
        <g transform={`translate(${width - 120}, 20)`}>
          <rect width="110" height="80" fill="white" fillOpacity="0.8" stroke="#e2e8f0" rx="4" />
          <text x="5" y="15" fontSize="10" fontWeight="bold" className="fill-slate-700">LEGEND</text>
          <circle cx="10" cy="30" r="4" fill="#3b82f6" />
          <text x="20" y="33" fontSize="9" className="fill-slate-600">Vertical: {vBar.size}</text>
          <rect x="6" y="42" width="8" height="2" fill="#1e40af" />
          <text x="20" y="48" fontSize="9" className="fill-slate-600">Tie: {tBar.size}</text>
          <circle cx="10" cy="60" r="4" fill="#f97316" />
          <text x="20" y="63" fontSize="9" className="fill-slate-600">Bolt: {typeof inputs.boltDiameter === 'number' ? inputs.boltDiameter : 1.0}"</text>
        </g>
      </svg>
      </div>
    </div>
  );
};

export default PlanView;
