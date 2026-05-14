const fs = require('fs');
let content = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

const oldHandleBoltDiameterChange = `  // Handle bolt diameter change - auto-update bolt length based on current type
  const handleBoltDiameterChange = (diameter: number) => {
    const currentType = anchorRodType;
    const newLength = getAnchorBoltLength(diameter, currentType);
    setInputs((prev) => ({
      ...prev,
      boltDiameter: diameter,
      boltTotalLength: newLength,
    }));
    setSelectedStandard('');
    setUseStandard(false);
  };`;

const newHandleBoltDiameterChange = `  // Handle bolt diameter change - auto-update bolt length based on current type
  const handleBoltDiameterChange = (diameter: number) => {
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
  };

  const handleNumberOfNutsChange = (numberOfNuts: 'N1' | 'N2') => {
    const nutData = ANCHOR_BOLT_NUT_DATA[inputs.boltDiameter] || { N1: 0, N2: 0, threadLengthAtBottom: 0 };
    setInputs((prev) => ({
      ...prev,
      numberOfNuts,
      allowanceForNuts: nutData[numberOfNuts],
    }));
  };`;

content = content.replace(oldHandleBoltDiameterChange, newHandleBoltDiameterChange);

const oldBoltDiameterSelect = `            <div className="flex flex-col gap-1">
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
            </div>`;

const newBoltDiameterSelect = `            <div className="grid grid-cols-2 gap-3">
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
            </div>`;

content = content.replace(oldBoltDiameterSelect, newBoltDiameterSelect);

fs.writeFileSync('src/components/Sidebar.tsx', content);
