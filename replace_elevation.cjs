const fs = require('fs');
const path = 'src/components/ElevationView.tsx';
let content = fs.readFileSync(path, 'utf8');

const oldStr = `          {/* Ties */}
          {data.ties.map((tie, idx) => (
            <g key={idx}>
              {/* Tie as horizontal line with hooks */}
              <line
                x1={centerX - toPx((isLengthView ? tie.length : tie.width) / 2)}
                y1={bottomY - toPx(tie.z)}
                x2={centerX + toPx((isLengthView ? tie.length : tie.width) / 2)}
                y2={bottomY - toPx(tie.z)}
                stroke="#1e40af"
                strokeWidth={toPx(tBar.diameter)}
                strokeLinecap="round"
              />
              {/* Hooks (simplified) */}
              <path
                d={\`M \${centerX - toPx((isLengthView ? tie.length : tie.width) / 2)} \${bottomY - toPx(tie.z)} 
                   L \${centerX - toPx((isLengthView ? tie.length : tie.width) / 2) + 10} \${bottomY - toPx(tie.z) + 10}\`}
                stroke="#1e40af"
                strokeWidth={toPx(tBar.diameter)}
                fill="none"
              />
            </g>
          ))}`;

const newStr = `          {/* Ties */}
          {data.ties.map((tie, idx) => {
            if (tie.type === 'outer') {
              return (
                <g key={idx}>
                  <line
                    x1={centerX - toPx((isLengthView ? tie.length! : tie.width!) / 2)}
                    y1={bottomY - toPx(tie.z)}
                    x2={centerX + toPx((isLengthView ? tie.length! : tie.width!) / 2)}
                    y2={bottomY - toPx(tie.z)}
                    stroke="#1e40af"
                    strokeWidth={toPx(tBar.diameter)}
                    strokeLinecap="round"
                  />
                  <path
                    d={\`M \${centerX - toPx((isLengthView ? tie.length! : tie.width!) / 2)} \${bottomY - toPx(tie.z)} 
                       L \${centerX - toPx((isLengthView ? tie.length! : tie.width!) / 2) + 10} \${bottomY - toPx(tie.z) + 10}\`}
                    stroke="#1e40af"
                    strokeWidth={toPx(tBar.diameter)}
                    fill="none"
                  />
                </g>
              );
            } else if (tie.type === 'crosstie_x' && isLengthView) {
              return (
                <line
                  key={idx}
                  x1={centerX + toPx(tie.startX!)}
                  y1={bottomY - toPx(tie.z)}
                  x2={centerX + toPx(tie.endX!)}
                  y2={bottomY - toPx(tie.z)}
                  stroke="#1e40af"
                  strokeWidth={toPx(tBar.diameter)}
                  strokeLinecap="round"
                />
              );
            } else if (tie.type === 'crosstie_y' && !isLengthView) {
              return (
                <line
                  key={idx}
                  x1={centerX + toPx(tie.startY!)}
                  y1={bottomY - toPx(tie.z)}
                  x2={centerX + toPx(tie.endY!)}
                  y2={bottomY - toPx(tie.z)}
                  stroke="#1e40af"
                  strokeWidth={toPx(tBar.diameter)}
                  strokeLinecap="round"
                />
              );
            } else if (tie.type === 'crosstie_y' && isLengthView) {
              return (
                <circle
                  key={idx}
                  cx={centerX + toPx(tie.x!)}
                  cy={bottomY - toPx(tie.z)}
                  r={toPx(tBar.diameter / 2)}
                  fill="#1e40af"
                />
              );
            } else if (tie.type === 'crosstie_x' && !isLengthView) {
              return (
                <circle
                  key={idx}
                  cx={centerX + toPx(tie.y!)}
                  cy={bottomY - toPx(tie.z)}
                  r={toPx(tBar.diameter / 2)}
                  fill="#1e40af"
                />
              );
            }
            return null;
          })}`;

content = content.replace(oldStr, newStr);
fs.writeFileSync(path, content);
