const fs = require('fs');
const path = 'src/components/PlanView.tsx';
let content = fs.readFileSync(path, 'utf8');

const oldStr = `        {/* Ties (Top Tie) */}
        {data.ties.length > 0 && (
          <rect
            x={centerX - toPx(data.ties[0].length / 2)}
            y={centerY - toPx(data.ties[0].width / 2)}
            width={toPx(data.ties[0].length)}
            height={toPx(data.ties[0].width)}
            fill="none"
            stroke="#1e40af"
            strokeWidth={toPx(tBar.diameter)}
            rx={toPx(tBar.diameter)}
          />
        )}`;

const newStr = `        {/* Ties (Top Tie) */}
        {data.ties.filter(t => t.z === data.ties[0]?.z).map((tie, idx) => {
          if (tie.type === 'outer') {
            return (
              <rect
                key={idx}
                x={centerX - toPx(tie.length! / 2)}
                y={centerY - toPx(tie.width! / 2)}
                width={toPx(tie.length!)}
                height={toPx(tie.width!)}
                fill="none"
                stroke="#1e40af"
                strokeWidth={toPx(tBar.diameter)}
                rx={toPx(tBar.diameter)}
              />
            );
          } else if (tie.type === 'crosstie_x') {
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
          }
          return null;
        })}`;

content = content.replace(oldStr, newStr);
fs.writeFileSync(path, content);
