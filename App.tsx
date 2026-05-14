import React, { useState, useMemo } from 'react';
import { PedestalInputs, CalculatedData } from './types/pedestal';
import { DEFAULT_INPUTS } from './utils/aciData';
import { calculatePedestalData } from './utils/calculations';
import Sidebar from './components/Sidebar';
import PlanView from './components/PlanView';
import ElevationView from './components/ElevationView';
import ThreeDView from './components/ThreeDView';
import ResultsPanel from './components/ResultsPanel';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './components/Tabs';
import { exportToPDF, captureAndSaveView } from './utils/export';
import { AlertTriangle, RotateCcw, Download, FileText, Image as ImageIcon } from 'lucide-react';

const App: React.FC = () => {
  const [inputs, setInputs] = useState<PedestalInputs>(DEFAULT_INPUTS);
  const [activeTab, setActiveTab] = useState('plan');

  const calculatedData = useMemo(() => calculatePedestalData(inputs), [inputs]);

  const handleReset = () => {
    setInputs(DEFAULT_INPUTS);
  };

  const handleExportPDF = () => {
    exportToPDF(inputs, calculatedData);
  };

  const handleExportImage = async () => {
    let elementId = '';
    let filename = '';
    
    if (activeTab === 'plan') {
      elementId = 'plan-svg';
      filename = 'Pedestal_Plan.png';
    } else if (activeTab === 'elevation') {
      elementId = 'elevation-svg';
      filename = 'Pedestal_Elevation.png';
    } else if (activeTab === '3d') {
      elementId = 'three-canvas';
      filename = 'Pedestal_3D.png';
    }
    
    if (elementId) {
      await captureAndSaveView(elementId, filename);
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      {/* Sidebar */}
      <Sidebar inputs={inputs} setInputs={setInputs} />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-slate-800">PedestalViz</h1>
            <p className="text-sm text-slate-500">Concrete Pedestal, Rebar & Anchor Bolt Designer</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
            >
              <RotateCcw size={16} />
              Reset
            </button>
            <div className="flex bg-slate-100 rounded-md p-1">
              <button
                onClick={handleExportImage}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-white hover:shadow-sm rounded transition-all"
                title="Export current view as PNG"
              >
                <ImageIcon size={14} />
                PNG
              </button>
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-white hover:shadow-sm rounded transition-all"
                title="Export PDF Report"
              >
                <FileText size={14} />
                PDF
              </button>
            </div>
          </div>
        </header>

        {/* Tabs and Views */}
        <div className="flex-1 flex flex-col overflow-hidden p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="mb-4">
              <TabsTrigger value="plan">2D Plan View</TabsTrigger>
              <TabsTrigger value="elevation">2D Elevation View</TabsTrigger>
              <TabsTrigger value="3d">Interactive 3D View</TabsTrigger>
              <TabsTrigger value="warnings">
                Warnings {calculatedData.warnings.length > 0 && <span className="ml-2 bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full">{calculatedData.warnings.length}</span>}
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative">
              <TabsContent value="plan" className="h-full">
                <PlanView inputs={inputs} data={calculatedData} setInputs={setInputs} />
              </TabsContent>
              <TabsContent value="elevation" className="h-full">
                <ElevationView inputs={inputs} data={calculatedData} />
              </TabsContent>
              <TabsContent value="3d" className="h-full">
                <ThreeDView inputs={inputs} data={calculatedData} />
              </TabsContent>
              <TabsContent value="warnings" className="h-full p-6 overflow-y-auto">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <AlertTriangle className="text-amber-500" size={20} />
                  Validation Warnings
                </h2>
                {calculatedData.warnings.length > 0 ? (
                  <ul className="space-y-2">
                    {calculatedData.warnings.map((warning, idx) => (
                      <li key={idx} className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-md flex items-start gap-3">
                        <AlertTriangle className="text-amber-500 mt-0.5 flex-shrink-0" size={16} />
                        <span>{warning}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-slate-500 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    No warnings. Your design meets all checked criteria.
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Results Panel */}
        <ResultsPanel inputs={inputs} data={calculatedData} />
      </main>
    </div>
  );
};

export default App;
