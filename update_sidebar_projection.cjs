const fs = require('fs');
let content = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

const oldHandleInputChange = `  const handleInputChange = useCallback((name: string, value: number | string) => {
    setInputs((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear standard selection when user manually changes any input
    setSelectedStandard('');
    setUseStandard(false);
  }, []);`;

const newHandleInputChange = `  const handleInputChange = useCallback((name: string, value: number | string) => {
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
  }, []);`;

content = content.replace(oldHandleInputChange, newHandleInputChange);

const oldHandleBoltDiameterChange = `  const handleBoltDiameterChange = (diameter: number) => {
    const currentType = anchorRodType;
    const newLength = getAnchorBoltLength(diameter, currentType);
    const nutData = ANCHOR_BOLT_NUT_DATA[diameter] || { N1: 0, N2: 0, threadLengthAtBottom: 0 };
    setInputs((prev) => ({
      ...prev,
      boltDiameter: diameter,
      boltTotalLength: newLength,
      allowanceForNuts: nutData[prev.numberOfNuts || 'N1'],
      threadLengthAtBottom: nutData.threadLengthAtBottom,
    }));
    setSelectedStandard('');
    setUseStandard(false);
  };`;

const newHandleBoltDiameterChange = `  const handleBoltDiameterChange = (diameter: number) => {
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
  };`;

content = content.replace(oldHandleBoltDiameterChange, newHandleBoltDiameterChange);

const oldHandleNumberOfNutsChange = `  const handleNumberOfNutsChange = (numberOfNuts: 'N1' | 'N2') => {
    const nutData = ANCHOR_BOLT_NUT_DATA[inputs.boltDiameter] || { N1: 0, N2: 0, threadLengthAtBottom: 0 };
    setInputs((prev) => ({
      ...prev,
      numberOfNuts,
      allowanceForNuts: nutData[numberOfNuts],
    }));
  };`;

const newHandleNumberOfNutsChange = `  const handleNumberOfNutsChange = (numberOfNuts: 'N1' | 'N2') => {
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
  };`;

content = content.replace(oldHandleNumberOfNutsChange, newHandleNumberOfNutsChange);

const oldHandleStandardChange = `      setInputs((prev) => ({
        ...prev,
        baseplateLength: standard.baseplateLength,
        baseplateWidth: standard.baseplateWidth,
        baseplateThickness: standard.baseplateThickness,
        boltDiameter: standard.boltDiameter,
        pedestalLength: standard.pedestalLength,
        pedestalWidth: standard.pedestalWidth,
        barsAlongLength: standard.barsAlongLength,
        barsAlongWidth: standard.barsAlongWidth,
        allowanceForNuts: nutData[prev.numberOfNuts || 'N1'],
        threadLengthAtBottom: nutData.threadLengthAtBottom,
        bolts: [
          { x: -halfSpacing, y: -halfSpacing },
          { x: halfSpacing, y: -halfSpacing },
          { x: halfSpacing, y: halfSpacing },
          { x: -halfSpacing, y: halfSpacing },
        ],
      }));`;

const newHandleStandardChange = `      setInputs((prev) => {
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
      });`;

content = content.replace(oldHandleStandardChange, newHandleStandardChange);

const oldProjectionInput = `<StableInput label="Projection" name="boltProjection" value={inputs.boltProjection} onChange={handleInputChange} />`;
const newProjectionInput = `<div className="flex flex-col gap-1">
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
              </div>`;

content = content.replace(oldProjectionInput, newProjectionInput);

fs.writeFileSync('src/components/Sidebar.tsx', content);
