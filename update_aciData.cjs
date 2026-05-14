const fs = require('fs');
let content = fs.readFileSync('src/utils/aciData.ts', 'utf8');

const nutData = `
export const ANCHOR_BOLT_NUT_DATA: Record<number, { N1: number; N2: number; threadLengthAtBottom: number }> = {
  0.5: { N1: 1, N2: 1.5, threadLengthAtBottom: 1 },
  0.625: { N1: 1.25, N2: 2, threadLengthAtBottom: 1 },
  0.75: { N1: 1.5, N2: 2.25, threadLengthAtBottom: 1.25 },
  0.875: { N1: 1.5, N2: 2.5, threadLengthAtBottom: 1.25 },
  1: { N1: 1.75, N2: 2.75, threadLengthAtBottom: 1.5 },
  1.25: { N1: 2.25, N2: 3.5, threadLengthAtBottom: 1.75 },
  1.5: { N1: 2.5, N2: 4, threadLengthAtBottom: 2 },
  1.75: { N1: 3, N2: 4.75, threadLengthAtBottom: 2.25 },
  2: { N1: 3.25, N2: 5.25, threadLengthAtBottom: 2.5 },
  2.25: { N1: 3.75, N2: 6, threadLengthAtBottom: 2.75 },
  2.5: { N1: 4, N2: 6.5, threadLengthAtBottom: 3 },
  2.75: { N1: 4.5, N2: 7.25, threadLengthAtBottom: 3.25 },
  3: { N1: 4.75, N2: 7.75, threadLengthAtBottom: 3.5 },
};
`;

content = content.replace('export const DEFAULT_INPUTS = {', nutData + '\nexport const DEFAULT_INPUTS: PedestalInputs = {');

content = content.replace("anchorRodType: 'A',", "anchorRodType: 'A',\n  numberOfNuts: 'N1',\n  allowanceForNuts: 1.75,\n  threadLengthAtBottom: 1.5,");

content = content.replace("import { BarData } from '../types/pedestal';", "import { BarData, PedestalInputs } from '../types/pedestal';");

fs.writeFileSync('src/utils/aciData.ts', content);
