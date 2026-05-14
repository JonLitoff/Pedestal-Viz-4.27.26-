import React, { useState, useEffect, useCallback } from 'react';
import { PedestalInputs } from '../types/pedestal';
import { ACI_BARS, DEFAULT_INPUTS, ANCHOR_BOLT_DIAMETERS, ANCHOR_BOLT_LENGTHS, getAnchorBoltLength, ANCHOR_BOLT_NUT_DATA, isStandardAnchorBoltLength } from '../utils/aciData';
import { ChevronLeft, ChevronRight, Settings, Layers, Box, Anchor, Menu, X } from 'lucide-react';
import { hapticFeedback, isMobile as isMobileDetect } from '../utils/mobileFeatures';

// Stable input component that prevents iOS keyboard dismissal
// Maintains local state and only updates parent on blur/Enter
interface StableInputProps {
  label: string;
  name: string;
  value: number | string;
  onChange: (name: string, value: number | string) => void;
  type?: string;
  unit?: string;
}

const StableInput: React.FC<StableInputProps> = ({ label, name, value, onChange, type = 'number', unit = 'in' }) => {
  const [localValue, setLocalValue] = useState(String(value));
  const [isFocused, setIsFocused] = useState(false);

  // Sync with external value only when not focused
  useEffect(() => {
    if (!isFocused) {
      setLocalValue(String(value));
    }
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    const numValue = type === 'number' ? parseFloat(localValue) || 0 : localValue;
    onChange(name, numValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-slate-500">{label}</label>
      <div className="relative">
        <input
          type={type}
          value={localValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          enterKeyHint="done"
        />
        {unit && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold uppercase">{unit}</span>}
      </div>
    </div>
  );
};

// Standard baseplate details
const STANDARD_BASEPLATES = {
  BP4A: { baseplateLength: 13, baseplateWidth: 13, baseplateThickness: 0.75, boltDiameter: 0.75, pedestalLength: 22, pedestalWidth: 22, barsAlongLength: 4, barsAlongWidth: 4, boltSpacing: 10 },
  BP4B: { baseplateLength: 14, baseplateWidth: 14, baseplateThickness: 0.75, boltDiameter: 0.75, pedestalLength: 24, pedestalWidth: 24, barsAlongLength: 5, barsAlongWidth: 5, boltSpacing: 11 },
  BP4C: { baseplateLength: 17, baseplateWidth: 17, baseplateThickness: 0.75, boltDiameter: 1.0, pedestalLength: 26, pedestalWidth: 26, barsAlongLength: 5, barsAlongWidth: 5, boltSpacing: 13 },
  BP4D: { baseplateLength: 18, baseplateWidth: 18, baseplateThickness: 0.75, boltDiameter: 1.0, pedestalLength: 26, pedestalWidth: 26, barsAlongLength: 5, barsAlongWidth: 5, boltSpacing: 14 },
  BP4E: { baseplateLength: 19, baseplateWidth: 19, baseplateThickness: 1.0, boltDiameter: 1.25, pedestalLength: 28, pedestalWidth: 28, barsAlongLength: 6, barsAlongWidth: 6, boltSpacing: 15 },
  BP4F: { baseplateLength: 20, baseplateWidth: 20, baseplateThickness: 1.0, boltDiameter: 1.25, pedestalLength: 28, pedestalWidth: 28, barsAlongLength: 6, barsAlongWidth: 6, boltSpacing: 16 },
  BP4G: { baseplateLength: 22, baseplateWidth: 22, baseplateThickness: 1.0, boltDiameter: 1.5, pedestalLength: 30, pedestalWidth: 30, barsAlongLength: 7, barsAlongWidth: 7, boltSpacing: 17 },
  BP4H: { baseplateLength: 22, baseplateWidth: 22, baseplateThickness: 1.0, boltDiameter: 1.5, pedestalLength: 30, pedestalWidth: 30, barsAlongLength: 7, barsAlongWidth: 7, boltSpacing: 18 },
  BP4J: { baseplateLength: 24, baseplateWidth: 24, baseplateThickness: 1.25, boltDiameter: 1.5, pedestalLength: 32, pedestalWidth: 32, barsAlongLength: 7, barsAlongWidth: 7, boltSpacing: 20 },
} as const;

export type StandardBaseplateKey = keyof typeof STANDARD_BASEPLATES;

interface SidebarProps {
  inputs: PedestalInputs;
  setInputs: React.Dispatch<React.SetStateAction<PedestalInputs>>;
}

const Sidebar: React.FC<SidebarProps> = ({ inputs, setInputs }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedStandard, setSelectedStandard] = useState<string>('');
  const [useStandard, setUseStandard] = useState(false);
  const [anchorRodType, setAnchorRodType] = useState<'A' | 'B' | 'N'>(inputs.anchorRodType || 'A');
  const [customDetails, setCustomDetails] = useState<Record<string, PedestalInputs>>({});
  const [newDetailName, setNewDetailName] = useState('');
  const [boltCoordMode, setBoltCoordMode] = useState<'center' | 'explicit'>('center');

  useEffect(() => {
    const saved = localStorage.getItem('customStandardDetails');
    if (saved) {
      try {
        setCustomDetails(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse custom details', e);
      }
    }
  }, []);

  const handleSaveCustomDetail = () => {
    if (!newDetailName.trim()) return;
    const name = newDetailName.trim();
    const updated = { ...customDetails, [name]: inputs };
    setCustomDetails(updated);
    localStorage.setItem('customStandardDetails', JSON.stringify(updated));
    setSelectedStandard(`custom_${name}`);
    setUseStandard(true);
    setNewDetailName('');
  };

  const handleDeleteCustomDetail = (name: string) => {
    const updated = { ...customDetails };
    delete updated[name];
    setCustomDetails(updated);
    localStorage.setItem('customStandardDetails', JSON.stringify(updated));
    if (selectedStandard === `custom_${name}`) {
      setSelectedStandard('');
      setUseStandard(false);
    }
  };

  // Ensure boltDiameter is always a number (not a string like "1/2")
  useEffect(() => {
    if (inputs.boltDiameter && typeof inputs.boltDiameter !== 'number') {
      const numericValue = parseFloat(String(inputs.boltDiameter));
      if (!isNaN(numericValue)) {
        setInputs((prev) => ({ ...prev, boltDiameter: numericValue }));
      }
    }
  }, [inputs.boltDiameter]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Sync anchorRodType state with inputs when inputs change externally
  useEffect(() => {
    if (inputs.anchorRodType && inputs.anchorRodType !== anchorRodType) {
      setAnchorRodType(inputs.anchorRodType);
    }
  }, [inputs.anchorRodType]);

  // Handle anchor rod type change - auto-update bolt length
  const handleAnchorRodTypeChange = (type: 'A' | 'B' | 'N') => {
    setAnchorRodType(type);
    const newLength = getAnchorBoltLength(inputs.boltDiameter, type);
    setInputs((prev) => ({
      ...prev,
      anchorRodType: type,
      boltTotalLength: newLength,
    }));
    setSelectedStandard('');
    setUseStandard(false);
  };

  // Handle bolt diameter change - auto-update bolt length based on current type
  const handleBoltDiameterChange = (diameter: number) => {
    const currentType = anchorRodType;
    const newLength = getAnchorBoltLength(diameter, currentType);
    const nutData = ANCHOR_BOLT_NUT_DATA[diameter] || { N1: 0, N2: 0, threadLengthAtBottom: 0 };
    setInputs((prev) => {
      const allowanceForNuts = nutData[prev.numberOfNuts || 'N1'];
      return {
        ...prev,
        boltDiameter: diameter,
        boltTotalLength: newLength,
        allowanceForNuts,
        threadLengthAtBottom: nutData.threadLengthAtBottom,
        boltProjection: (Number(prev.groutThickness) || 0) + (Number(prev.baseplateThickness) || 0) + allowanceForNuts,
      };
    });
    setSelectedStandard('');
    setUseStandard(false);
  };

  const handleNumberOfNutsChange = (numberOfNuts: 'N1' | 'N2') => {
    const nutData = ANCHOR_BOLT_NUT_DATA[inputs.boltDiameter] || { N1: 0, N2: 0, threadLengthAtBottom: 0 };
    setInputs((prev) => {
      const allowanceForNuts = nutData[numberOfNuts];
      return {
        ...prev,
        numberOfNuts,
        allowanceForNuts,
        boltProjection: (Number(prev.groutThickness) || 0) + (Number(prev.baseplateThickness) || 0) + allowanceForNuts,
      };
    });
  };

  // Handle bolt length manual change - check if it matches standard and update type
  const handleBoltLengthChange = (name: string, value: number | string) => {
    const length = typeof value === 'string' ? parseFloat(value) || 0 : value;
    const isStandard = isStandardAnchorBoltLength(inputs.boltDiameter, length);
    
    if (!isStandard && anchorRodType !== 'N') {
      // Length doesn't match standard, change type to N
      setAnchorRodType('N');
      setInputs((prev) => ({
        ...prev,
        boltTotalLength: length,
        anchorRodType: 'N',
      }));
    } else {
      setInputs((prev) => ({
        ...prev,
        boltTotalLength: length,
      }));
    }
    setSelectedStandard('');
    setUseStandard(false);
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
    hapticFeedback('light');
  };

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
    hapticFeedback('light');
  };

  const handleInputChange = useCallback((name: string, value: number | string) => {
    setInputs((prev) => {
      const newInputs = { ...prev, [name]: value };
      
      // Auto-calculate boltProjection
      if (name === 'groutThickness' || name === 'baseplateThickness' || name === 'allowanceForNuts') {
        newInputs.boltProjection = (Number(newInputs.groutThickness) || 0) + 
                                   (Number(newInputs.baseplateThickness) || 0) + 
                                   (Number(newInputs.allowanceForNuts) || 0);
      }
      
      return newInputs;
    });
    // Clear standard selection when user manually changes any input
    setSelectedStandard('');
    setUseStandard(false);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    handleInputChange(name, type === 'number' ? parseFloat(value) || 0 : value);
  };

  const handleBoltChange = (idx: number, field: 'x' | 'y', value: string) => {
    const numValue = parseFloat(value) || 0;
    setInputs((prev) => {
      const newBolts = [...prev.bolts];
      newBolts[idx] = { ...newBolts[idx], [field]: numValue };
      return { ...prev, bolts: newBolts };
    });
    setSelectedStandard('');
    setUseStandard(false);
  };

  // Stable bolt change handler - updates parent only on blur/Enter
  const handleStableBoltChange = useCallback((idx: number, field: 'x' | 'y') => (value: number) => {
    setInputs((prev) => {
      const newBolts = [...prev.bolts];
      newBolts[idx] = { ...newBolts[idx], [field]: value };
      return { ...prev, bolts: newBolts };
    });
    setSelectedStandard('');
    setUseStandard(false);
  }, []);

  const handleStandardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedStandard(value);
    setUseStandard(value !== '');
    
    if (value.startsWith('custom_')) {
      const name = value.replace('custom_', '');
      if (customDetails[name]) {
        setInputs(customDetails[name]);
      }
      return;
    }
    
    if (value && STANDARD_BASEPLATES[value as StandardBaseplateKey]) {
      const standard = STANDARD_BASEPLATES[value as StandardBaseplateKey];
      const halfSpacing = standard.boltSpacing / 2;
      const nutData = ANCHOR_BOLT_NUT_DATA[standard.boltDiameter] || { N1: 0, N2: 0, threadLengthAtBottom: 0 };
      
      setInputs((prev) => {
        const allowanceForNuts = nutData[prev.numberOfNuts || 'N1'];
        return {
          ...prev,
          baseplateLength: standard.baseplateLength,
          baseplateWidth: standard.baseplateWidth,
          baseplateThickness: standard.baseplateThickness,
          boltDiameter: standard.boltDiameter,
          pedestalLength: standard.pedestalLength,
          pedestalWidth: standard.pedestalWidth,
          barsAlongLength: standard.barsAlongLength,
          barsAlongWidth: standard.barsAlongWidth,
          allowanceForNuts,
          threadLengthAtBottom: nutData.threadLengthAtBottom,
          boltProjection: (Number(prev.groutThickness) || 0) + standard.baseplateThickness + allowanceForNuts,
          bolts: [
            { x: -halfSpacing, y: -halfSpacing },
            { x: halfSpacing, y: -halfSpacing },
            { x: halfSpacing, y: halfSpacing },
            { x: -halfSpacing, y: halfSpacing },
          ],
        };
      });
    }
  };

  const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3 text-slate-800 font-semibold border-b border-slate-200 pb-1">
        {icon}
        <span className="text-sm uppercase tracking-wider">{title}</span>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );

  // Legacy InputField - replaced with StableInput for iOS fix

// Stable bolt position input - prevents iOS keyboard dismissal for anchor bolt coordinates
interface StableBoltInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
}

const StableBoltInput: React.FC<StableBoltInputProps> = ({ label, value, onChange }) => {
  const [localValue, setLocalValue] = useState(String(value));

  useEffect(() => {
    setLocalValue(String(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
  };

  const handleBlur = () => {
    const numValue = parseFloat(localValue) || 0;
    onChange(numValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <input
      type="number"
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
      enterKeyHint="done"
    />
  );
};
  // Keeping for reference - use StableInput instead for number inputs

  return (
    <>
      {/* Mobile toggle button */}
      {isMobile && (
        <button
          onClick={toggleDrawer}
          className="fixed bottom-4 right-4 z-50 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center touch-manipulation"
          style={{ paddingTop: 'env(safe-area-inset-bottom, 0)' }}
        >
          {isDrawerOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      )}

      {/* Mobile drawer overlay */}
      {isMobile && isDrawerOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={toggleDrawer}
        />
      )}

      <aside
        className={`bg-white border-r border-slate-200 transition-all duration-300 flex flex-col ${
          isMobile 
            ? `fixed right-0 top-0 h-full z-50 transform ${
                isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
              }`
            : ''
        } ${isCollapsed ? 'w-12' : 'w-80'}`}
        style={{
          paddingTop: isMobile ? 'env(safe-area-inset-top, 0)' : undefined,
          paddingBottom: isMobile ? 'env(safe-area-inset-bottom, 0)' : undefined,
        }}
      >
        <div className="p-4 flex justify-between items-center border-b border-slate-100">
          {!isCollapsed && <h2 className="font-bold text-slate-700 flex items-center gap-2"><Settings size={18} /> Input Panel</h2>}
          <button
            onClick={isMobile ? toggleDrawer : toggleSidebar}
            className="p-2 hover:bg-slate-100 rounded text-slate-500 transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            {isCollapsed ? <ChevronRight size={20} /> : isMobile ? <X size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {/* Standard Baseplate Selection */}
          <div className="mb-6 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                id="useStandard"
                checked={useStandard}
                onChange={(e) => {
                  setUseStandard(e.target.checked);
                  if (!e.target.checked) {
                    setSelectedStandard('');
                  }
                }}
                className="w-4 h-4 text-blue-600 rounded border-blue-300 focus:ring-blue-500"
              />
              <label htmlFor="useStandard" className="text-sm font-semibold text-slate-700">
                Use a standard baseplate detail
              </label>
            </div>
            {useStandard && (
              <select
                value={selectedStandard}
                onChange={handleStandardChange}
                className="w-full px-3 py-2 text-sm bg-white border border-blue-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a standard...</option>
                {Object.keys(STANDARD_BASEPLATES).map((key) => (
                  <option key={key} value={key}>
                    {key}
                  </option>
                ))}
                {Object.keys(customDetails).length > 0 && (
                  <optgroup label="Custom Details">
                    {Object.keys(customDetails).map((key) => (
                      <option key={`custom_${key}`} value={`custom_${key}`}>
                        {key}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            )}
            {useStandard && selectedStandard && (
              <div className="mt-2 text-xs text-blue-600 flex justify-between items-center">
                <span>Selected: {selectedStandard.replace('custom_', '')} - Inputs will auto-update to standard values</span>
                {selectedStandard.startsWith('custom_') && (
                  <button
                    onClick={() => handleDeleteCustomDetail(selectedStandard.replace('custom_', ''))}
                    className="text-red-500 hover:text-red-700 ml-2 px-2 py-1 bg-red-50 rounded"
                    title="Delete custom detail"
                  >
                    Delete
                  </button>
                )}
              </div>
            )}
            
            <div className="mt-3 pt-3 border-t border-blue-200 flex gap-2">
              <input
                type="text"
                value={newDetailName}
                onChange={(e) => setNewDetailName(e.target.value)}
                placeholder="New custom detail name"
                className="flex-1 px-2 py-1 text-sm bg-white border border-blue-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSaveCustomDetail}
                disabled={!newDetailName.trim()}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Save
              </button>
            </div>
          </div>

          <Section title="Pedestal Dimensions" icon={<Box size={16} />}>
            <div className="grid grid-cols-2 gap-3">
              <StableInput label="Length (L)" name="pedestalLength" value={inputs.pedestalLength} onChange={handleInputChange} />
              <StableInput label="Width (W)" name="pedestalWidth" value={inputs.pedestalWidth} onChange={handleInputChange} />
            </div>
            <StableInput label="Height (H)" name="pedestalHeight" value={inputs.pedestalHeight} onChange={handleInputChange} />
          </Section>

          <Section title="Steel Baseplate" icon={<Layers size={16} />}>
            <div className="grid grid-cols-2 gap-3">
              <StableInput label="Length" name="baseplateLength" value={inputs.baseplateLength} onChange={handleInputChange} />
              <StableInput label="Width" name="baseplateWidth" value={inputs.baseplateWidth} onChange={handleInputChange} />
            </div>
            <StableInput label="Thickness" name="baseplateThickness" value={inputs.baseplateThickness} onChange={handleInputChange} />
          </Section>

          <Section title="Grout" icon={<Layers size={16} />}>
            <StableInput label="Thickness" name="groutThickness" value={inputs.groutThickness} onChange={handleInputChange} />
          </Section>

          <Section title="Reinforcement" icon={<Layers size={16} />}>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-500">Vertical Bar</label>
                <select
                  name="verticalBarSize"
                  value={inputs.verticalBarSize}
                  onChange={handleChange}
                  className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {ACI_BARS.map((bar) => (
                    <option key={bar.size} value={bar.size}>
                      {bar.size}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-500">Tie Bar</label>
                <select
                  name="tieBarSize"
                  value={inputs.tieBarSize}
                  onChange={handleChange}
                  className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {ACI_BARS.map((bar) => (
                    <option key={bar.size} value={bar.size}>
                      {bar.size}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <StableInput label="Bars on L Face" name="barsAlongLength" value={inputs.barsAlongLength} onChange={handleInputChange} unit="qty" />
              <StableInput label="Bars on W Face" name="barsAlongWidth" value={inputs.barsAlongWidth} onChange={handleInputChange} unit="qty" />
            </div>
            <StableInput label="Clearance" name="clearance" value={inputs.clearance} onChange={handleInputChange} />
            <div className="grid grid-cols-2 gap-3">
              <StableInput label="Top Tie Clr." name="topTieClearance" value={inputs.topTieClearance} onChange={handleInputChange} />
              <StableInput label="Tie Spacing" name="tieSpacing" value={inputs.tieSpacing} onChange={handleInputChange} />
            </div>
          </Section>

          <Section title="Anchor Bolts" icon={<Anchor size={16} />}>
            {/* Coordinate mode toggle */}
            <div className="mb-3 p-2 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setBoltCoordMode('center')}
                  className={`flex-1 py-1.5 px-2 text-[10px] font-semibold rounded transition-all ${
                    boltCoordMode === 'center' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  From Center
                </button>
                <button
                  onClick={() => setBoltCoordMode('explicit')}
                  className={`flex-1 py-1.5 px-2 text-[10px] font-semibold rounded transition-all ${
                    boltCoordMode === 'explicit' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  Explicit (X,Z)
                </button>
              </div>
              <div className="text-[9px] text-slate-400 mt-1">
                {boltCoordMode === 'center' ? 'Offsets from pedestal center' : 'Absolute from top-left origin (0,0)'}
              </div>
            </div>
            {inputs.bolts.map((bolt, idx) => {
              // Convert from center coords to explicit (from top-left origin)
              const explicitX = bolt.x + inputs.pedestalLength / 2;
              const explicitZ = inputs.pedestalWidth / 2 - bolt.y;
              return (
              <div key={idx} className="mb-3 p-2 bg-slate-50 rounded border border-slate-100">
                <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Bolt {idx + 1} Position</div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-medium text-slate-500 uppercase">X Position</label>
                    <StableBoltInput
                      label="X"
                      value={boltCoordMode === 'center' ? bolt.x : explicitX}
                      onChange={(val) => {
                        const centerVal = boltCoordMode === 'center' ? val : val - inputs.pedestalLength / 2;
                        handleStableBoltChange(idx, 'x')(centerVal);
                      }}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-medium text-slate-500 uppercase">Z Position</label>
                    <StableBoltInput
                      label="Z"
                      value={boltCoordMode === 'center' ? bolt.y : explicitZ}
                      onChange={(val) => {
                        const centerVal = boltCoordMode === 'center' ? val : inputs.pedestalWidth / 2 - val;
                        handleStableBoltChange(idx, 'y')(centerVal);
                      }}
                    />
                  </div>
                </div>
                {boltCoordMode === 'center' && (
                  <div className="mt-1 text-[8px] text-slate-400">
                    Explicit: X={explicitX.toFixed(2)}", Z={explicitZ.toFixed(2)}"
                  </div>
                )}
              </div>
              );
            })}
            <div className="grid grid-cols-2 gap-3">
              <StableInput label="Total Length" name="boltTotalLength" value={inputs.boltTotalLength} onChange={handleBoltLengthChange} />
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-500">Projection</label>
                <div className="relative">
                  <input
                    type="number"
                    value={Number(inputs.boltProjection).toFixed(2)}
                    readOnly
                    className="w-full px-3 py-1.5 text-sm bg-slate-100 border border-slate-200 rounded text-slate-500 cursor-not-allowed"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold uppercase">in</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-500">Bolt Diameter</label>
                <select
                  value={inputs.boltDiameter}
                  onChange={(e) => handleBoltDiameterChange(parseFloat(e.target.value))}
                  className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {ANCHOR_BOLT_DIAMETERS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-500"># Nuts</label>
                <select
                  value={inputs.numberOfNuts || 'N1'}
                  onChange={(e) => handleNumberOfNutsChange(e.target.value as 'N1' | 'N2')}
                  className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="N1">N1 (One Nut)</option>
                  <option value="N2">N2 (Two Nuts)</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <StableInput label="Allowance for Nuts" name="allowanceForNuts" value={inputs.allowanceForNuts || 0} onChange={handleInputChange} />
              <StableInput label="Thread Length at Bottom" name="threadLengthAtBottom" value={inputs.threadLengthAtBottom || 0} onChange={handleInputChange} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-500">Anchor Rod Type</label>
              <div className="flex gap-2">
                {(['A', 'B', 'N'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => handleAnchorRodTypeChange(type)}
                    className={`flex-1 py-1.5 px-3 text-sm font-medium rounded transition-all ${
                      anchorRodType === type
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Type {type}
                  </button>
                ))}
              </div>
              {anchorRodType !== 'N' && (
                <div className="text-[10px] text-slate-400 mt-1">
                  Standard: {ANCHOR_BOLT_LENGTHS[Number(inputs.boltDiameter)]?.A || 12}" (A) / {ANCHOR_BOLT_LENGTHS[Number(inputs.boltDiameter)]?.B || 28}" (B)
                </div>
              )}
            </div>
          </Section>
        </div>
      )}
    </aside>
    </>
  );
};

export default Sidebar;
