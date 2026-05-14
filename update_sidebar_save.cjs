const fs = require('fs');
let content = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

content = content.replace(
  "setSelectedStandard(`custom_${name}`);",
  "setSelectedStandard(`custom_${name}`);\n    setUseStandard(true);"
);

fs.writeFileSync('src/components/Sidebar.tsx', content);
console.log('Sidebar.tsx updated successfully');
