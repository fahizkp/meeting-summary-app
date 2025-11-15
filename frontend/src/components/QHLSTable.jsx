import React from 'react';

const QHLSTable = ({ qhlsData, onQHLSChange, onQHLSAdd, onQHLSRemove }) => {
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
              <th>യൂണിറ്റ് (Unit)</th>
              <th>ദിവസം (Day)</th>
              <th>ഫാക്കൽറ്റി (Faculty)</th>
              <th>പുരുഷൻ (Male)</th>
              <th>സ്ത്രീ (Female)</th>
              <th>പ്രവർത്തനങ്ങൾ (Actions)</th>
            </tr>
          </thead>
          <tbody>
            {qhlsData.map((row, index) => (
              <tr key={index}>
                <td>
                  <input
                    type="text"
                    value={row.unit || ''}
                    onChange={(e) => handleFieldChange(index, 'unit', e.target.value)}
                    placeholder="യൂണിറ്റ്"
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
                    onChange={(e) => handleFieldChange(index, 'male', e.target.value)}
                    placeholder="0"
                    min="0"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={row.female || ''}
                    onChange={(e) => handleFieldChange(index, 'female', e.target.value)}
                    placeholder="0"
                    min="0"
                  />
                </td>
                <td>
                  <button
                    type="button"
                    className="btn-danger"
                    onClick={() => onQHLSRemove(index)}
                    disabled={qhlsData.length === 1}
                  >
                    നീക്കം ചെയ്യുക
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button
          type="button"
          className="add-button btn-secondary"
          onClick={onQHLSAdd}
        >
          + QHLS വരി ചേർക്കുക (Add QHLS Row)
        </button>
      </div>
    </div>
  );
};

export default QHLSTable;

