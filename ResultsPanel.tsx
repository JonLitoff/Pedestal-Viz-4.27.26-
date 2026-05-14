import React from 'react';
import { PedestalInputs, CalculatedData } from '../types/pedestal';
import { getBarData } from '../utils/aciData';

interface ResultsPanelProps {
  inputs: PedestalInputs;
  data: CalculatedData;
}

const ResultsPanel: React.FC<ResultsPanelProps> = ({ inputs, data }) => {
  const vBar = getBarData(inputs.verticalBarSize);
  const tBar = getBarData(inputs.tieBarSize);

  const ResultItem: React.FC<{ label: string; value: string | number; unit?: string }> = ({ label, value, unit = 'in' }) => (
    <div className="flex flex-col p-3 bg-slate-50 rounded-lg border border-slate-100">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className="text-lg font-bold text-slate-700">{value}</span>
        {unit && <span className="text-xs text-slate-400 font-medium">{unit}</span>}
      </div>
    </div>
  );

  return (
    <div className="mt-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      <ResultItem label="Bolt Embedment" value={data.boltEmbedment.toFixed(2)} />
      <ResultItem label="Total Ties" value={data.ties.length} unit="qty" />
      <ResultItem label="Vertical Bar Dia." value={vBar.diameter.toFixed(3)} />
      <ResultItem label="Tie Bar Dia." value={tBar.diameter.toFixed(3)} />
      <ResultItem label="Tie Width" value={data.ties[0]?.width.toFixed(2) || 0} />
      <ResultItem label="Tie Length" value={data.ties[0]?.length.toFixed(2) || 0} />
    </div>
  );
};

export default ResultsPanel;
