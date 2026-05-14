const fs = require('fs');
let content = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

// 1. Add state for custom details
content = content.replace(
  "const [anchorRodType, setAnchorRodType] = useState<'A' | 'B' | 'N'>(inputs.anchorRodType || 'A');",
  `const [anchorRodType, setAnchorRodType] = useState<'A' | 'B' | 'N'>(inputs.anchorRodType || 'A');
  const [customDetails, setCustomDetails] = useState<Record<string, PedestalInputs>>({});
  const [newDetailName, setNewDetailName] = useState('');

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
    setSelectedStandard(\`custom_\${name}\`);
    setNewDetailName('');
  };

  const handleDeleteCustomDetail = (name: string) => {
    const updated = { ...customDetails };
    delete updated[name];
    setCustomDetails(updated);
    localStorage.setItem('customStandardDetails', JSON.stringify(updated));
    if (selectedStandard === \`custom_\${name}\`) {
      setSelectedStandard('');
      setUseStandard(false);
    }
  };`
);

// 2. Update handleStandardChange
content = content.replace(
  "const handleStandardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {",
  `const handleStandardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedStandard(value);
    setUseStandard(value !== '');
    
    if (value.startsWith('custom_')) {
      const name = value.replace('custom_', '');
      if (customDetails[name]) {
        setInputs(customDetails[name]);
      }
      return;
    }`
);

// 3. Update the dropdown rendering
content = content.replace(
  `                {Object.keys(STANDARD_BASEPLATES).map((key) => (
                  <option key={key} value={key}>
                    {key}
                  </option>
                ))}
              </select>`,
  `                {Object.keys(STANDARD_BASEPLATES).map((key) => (
                  <option key={key} value={key}>
                    {key}
                  </option>
                ))}
                {Object.keys(customDetails).length > 0 && (
                  <optgroup label="Custom Details">
                    {Object.keys(customDetails).map((key) => (
                      <option key={\`custom_\${key}\`} value={\`custom_\${key}\`}>
                        {key}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>`
);

// 4. Add UI for saving and deleting custom details
content = content.replace(
  `            {useStandard && selectedStandard && (
              <div className="mt-2 text-xs text-blue-600">
                Selected: {selectedStandard} - Inputs will auto-update to standard values
              </div>
            )}
          </div>`,
  `            {useStandard && selectedStandard && (
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
          </div>`
);

fs.writeFileSync('src/components/Sidebar.tsx', content);
console.log('Sidebar.tsx updated successfully');
