const fs = require('fs');
const path = 'src/components/PlanView.tsx';
let content = fs.readFileSync(path, 'utf8');

const oldStr = `          } else if (tie.type === 'crosstie_x') {
            return (
              <line
                key={idx}
                x1={centerX + toPx(tie.startX!)}
                y1={centerY - toPx(tie.y!)}
                x2={centerX + toPx(tie.endX!)}
                y2={centerY - toPx(tie.y!)}
                stroke="#1e40af"
                strokeWidth={toPx(tBar.diameter)}
              />
            );
          } else if (tie.type === 'crosstie_y') {
            return (
              <line
                key={idx}
                x1={centerX + toPx(tie.x!)}
                y1={centerY - toPx(tie.startY!)}
                x2={centerX + toPx(tie.x!)}
                y2={centerY - toPx(tie.endY!)}
                stroke="#1e40af"
                strokeWidth={toPx(tBar.diameter)}
              />
            );
          }`;

const newStr = `          } else if (tie.type === 'crosstie_x') {
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
                  d={\`M \${centerX + toPx(tie.startX!)} \${centerY - toPx(tie.y!)} l 10 10\`}
                  stroke="#1e40af"
                  strokeWidth={toPx(tBar.diameter)}
                  fill="none"
                />
                <path
                  d={\`M \${centerX + toPx(tie.endX!)} \${centerY - toPx(tie.y!)} l -10 -10\`}
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
                  d={\`M \${centerX + toPx(tie.x!)} \${centerY - toPx(tie.startY!)} l 10 -10\`}
                  stroke="#1e40af"
                  strokeWidth={toPx(tBar.diameter)}
                  fill="none"
                />
                <path
                  d={\`M \${centerX + toPx(tie.x!)} \${centerY - toPx(tie.endY!)} l -10 10\`}
                  stroke="#1e40af"
                  strokeWidth={toPx(tBar.diameter)}
                  fill="none"
                />
              </g>
            );
          }`;

content = content.replace(oldStr, newStr);
fs.writeFileSync(path, content);
