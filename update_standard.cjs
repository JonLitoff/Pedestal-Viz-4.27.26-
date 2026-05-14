const fs = require('fs');
let content = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

const oldHandleStandardChange = `  const handleStandardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedStandard(value);
    setUseStandard(value !== '');
    
    if (value && STANDARD_BASEPLATES[value as StandardBaseplateKey]) {
      const standard = STANDARD_BASEPLATES[value as StandardBaseplateKey];
      const halfSpacing = standard.boltSpacing / 2;
      
      setInputs((prev) => ({
        ...prev,
        baseplateLength: standard.baseplateLength,
        baseplateWidth: standard.baseplateWidth,
        baseplateThickness: standard.baseplateThickness,
        boltDiameter: standard.boltDiameter,
        pedestalLength: standard.pedestalLength,
        pedestalWidth: standard.pedestalWidth,
        barsAlongLength: standard.barsAlongLength,
        barsAlongWidth: standard.barsAlongWidth,
        bolts: [
          { x: -halfSpacing, y: -halfSpacing },
          { x: halfSpacing, y: -halfSpacing },
          { x: halfSpacing, y: halfSpacing },
          { x: -halfSpacing, y: halfSpacing },
        ],
      }));
    }
  };`;

const newHandleStandardChange = `  const handleStandardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedStandard(value);
    setUseStandard(value !== '');
    
    if (value && STANDARD_BASEPLATES[value as StandardBaseplateKey]) {
      const standard = STANDARD_BASEPLATES[value as StandardBaseplateKey];
      const halfSpacing = standard.boltSpacing / 2;
      const nutData = ANCHOR_BOLT_NUT_DATA[standard.boltDiameter] || { N1: 0, N2: 0, threadLengthAtBottom: 0 };
      
      setInputs((prev) => ({
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
      }));
    }
  };`;

content = content.replace(oldHandleStandardChange, newHandleStandardChange);

fs.writeFileSync('src/components/Sidebar.tsx', content);
