import React from 'react';

const QHLSTable = ({ qhlsData, onQHLSChange, availableUnits = [] }) => {
  const filteredUnits = Array.isArray(availableUnits)
    ? Array.from(new Set(availableUnits.filter((unit) => unit && unit.trim() !== '')))
    : [];

  const handleFieldChange = (index, field, value) => {
    const updatedData = [...qhlsData];
    updatedData[index] = {
      ...updatedData[index],
      [field]: value,
    };
    onQHLSChange(updatedData);
  };

  return (
    <div className="form-group">
      <h3>QHLS</h3>
      <div className="qhls-table-container">
        <table className="qhls-table">
          <thead>
            <tr>
              <th>യൂണിറ്റ്</th>
              <th>ദിവസം</th>
              <th>ഫാക്കൽറ്റി</th>
              <th>പുരുഷന്മാർ</th>
              <th>സ്ത്രീകൾ</th>
            </tr>
          </thead>
          <tbody>
            {qhlsData.map((row, index) => (
              <tr key={index}>
                <td>
                  <input
                    type="text"
                    value={row.unit || filteredUnits[index] || ''}
                    disabled
                    style={{ minWidth: '200px' }}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={row.day || ''}
                    onChange={(e) => handleFieldChange(index, 'day', e.target.value)}
                    placeholder="ദിവസം"
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={row.faculty || ''}
                    onChange={(e) => handleFieldChange(index, 'faculty', e.target.value)}
                    placeholder="ഫാക്കൽറ്റി"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={row.male || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      // Allow empty string or valid number between 0 and 1000
                      if (val === '' || (!isNaN(val) && parseInt(val) >= 0 && parseInt(val) <= 1000)) {
                        handleFieldChange(index, 'male', val);
                      }
                    }}
                    onBlur={(e) => {
                      // Ensure value is within range on blur
                      const val = e.target.value;
                      if (val !== '' && (isNaN(val) || parseInt(val) < 0 || parseInt(val) > 1000)) {
                        handleFieldChange(index, 'male', '0');
                      }
                    }}
                    placeholder="0"
                    min="0"
                    max="1000"
                    step="1"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={row.female || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      // Allow empty string or valid number between 0 and 1000
                      if (val === '' || (!isNaN(val) && parseInt(val) >= 0 && parseInt(val) <= 1000)) {
                        handleFieldChange(index, 'female', val);
                      }
                    }}
                    onBlur={(e) => {
                      // Ensure value is within range on blur
                      const val = e.target.value;
                      if (val !== '' && (isNaN(val) || parseInt(val) < 0 || parseInt(val) > 1000)) {
                        handleFieldChange(index, 'female', '0');
                      }
                    }}
                    placeholder="0"
                    min="0"
                    max="1000"
                    step="1"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default QHLSTable;

