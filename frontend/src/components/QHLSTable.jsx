import React from 'react';

const QHLSTable = ({ qhlsData, onQHLSChange, availableUnits = [] }) => {
  const filteredUnits = Array.isArray(availableUnits)
    ? Array.from(new Set(availableUnits.filter((unit) => unit && unit.trim() !== '')))
    : [];

  const malayalamDays = ['തിങ്കൾ', 'ചൊവ്വ', 'ബുധൻ', 'വ്യാഴം', 'വെള്ളി', 'ശനി'];

  const handleFieldChange = (index, field, value) => {
    const updatedData = [...qhlsData];
    updatedData[index] = {
      ...updatedData[index],
      [field]: value,
    };
    // If toggling hasQhls, clear other fields when unchecked
    if (field === 'hasQhls' && !value) {
      updatedData[index].day = '';
      updatedData[index].faculty = '';
      updatedData[index].male = '';
      updatedData[index].female = '';
    }
    onQHLSChange(updatedData);
  };

  const styles = {
    wrapper: {
      overflowX: 'auto',
      marginTop: '12px',
      borderRadius: '14px',
      border: '2px solid #e0e0e0',
      background: '#ffffff',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      minWidth: '480px',
    },
    th: {
      padding: '14px 12px',
      textAlign: 'left',
      background: 'linear-gradient(135deg, #6c5ce7, #5549c7)',
      color: 'white',
      fontWeight: '600',
      fontSize: '0.85rem',
      whiteSpace: 'nowrap',
    },
    thFirst: {
      borderRadius: '12px 0 0 0',
    },
    thLast: {
      borderRadius: '0 12px 0 0',
    },
    td: {
      padding: '10px 8px',
      borderBottom: '1px solid #eeeeee',
    },
    input: {
      width: '100%',
      padding: '10px 12px',
      border: '2px solid #eeeeee',
      borderRadius: '8px',
      fontSize: '0.9rem',
      transition: 'all 0.2s ease',
      background: '#fafafa',
    },
    inputDisabled: {
      background: '#f0f0f0',
      color: '#757575',
      cursor: 'not-allowed',
    },
    inputNumber: {
      textAlign: 'center',
      width: '70px',
    },
    mobileCard: {
      padding: '16px',
      marginBottom: '12px',
      background: '#ffffff',
      borderRadius: '12px',
      border: '2px solid #eeeeee',
    },
    mobileLabel: {
      fontSize: '0.8rem',
      color: '#757575',
      marginBottom: '4px',
      fontWeight: '500',
    },
    mobileValue: {
      fontSize: '0.95rem',
      color: '#424242',
      fontWeight: '600',
      marginBottom: '12px',
    },
    mobileInputGroup: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '12px',
    },
    mobileInputWrapper: {
      display: 'flex',
      flexDirection: 'column',
    },
  };

  // Mobile card view for smaller screens
  const MobileView = () => (
    <div style={{ display: 'block' }}>
      {qhlsData.map((row, index) => {
        const hasQhls = row.hasQhls !== false; // Default to true if not set
        return (
          <div key={index} style={styles.mobileCard}>
            <div style={styles.mobileLabel}>യൂണിറ്റ്</div>
            <div style={styles.mobileValue}>
              {row.unit || filteredUnits[index] || `യൂണിറ്റ് ${index + 1}`}
            </div>

            <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                id={`qhls-mobile-${index}`}
                checked={hasQhls}
                onChange={(e) => handleFieldChange(index, 'hasQhls', e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <label htmlFor={`qhls-mobile-${index}`} style={{ fontSize: '0.9rem', cursor: 'pointer' }}>
                QHLS ഉണ്ട്
              </label>
            </div>

            {hasQhls && (
              <div style={styles.mobileInputGroup}>
                <div style={styles.mobileInputWrapper}>
                  <label style={styles.mobileLabel}>ദിവസം</label>
                  <select
                    value={row.day || ''}
                    onChange={(e) => handleFieldChange(index, 'day', e.target.value)}
                    style={styles.input}
                  >
                    <option value="">-- തിരഞ്ഞെടുക്കുക --</option>
                    {malayalamDays.map((day, idx) => (
                      <option key={idx} value={day}>{day}</option>
                    ))}
                  </select>
                </div>
                <div style={styles.mobileInputWrapper}>
                  <label style={styles.mobileLabel}>ഫാക്കൽറ്റി</label>
                  <input
                    type="text"
                    value={row.faculty || ''}
                    onChange={(e) => handleFieldChange(index, 'faculty', e.target.value)}
                    placeholder="ഫാക്കൽറ്റി"
                    style={styles.input}
                  />
                </div>
                <div style={styles.mobileInputWrapper}>
                  <label style={styles.mobileLabel}>പുരുഷന്മാർ</label>
                  <input
                    type="number"
                    value={row.male || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || (!isNaN(val) && parseInt(val) >= 0 && parseInt(val) <= 1000)) {
                        handleFieldChange(index, 'male', val);
                      }
                    }}
                    placeholder="0"
                    min="0"
                    max="1000"
                    style={{ ...styles.input, textAlign: 'center' }}
                  />
                </div>
                <div style={styles.mobileInputWrapper}>
                  <label style={styles.mobileLabel}>സ്ത്രീകൾ</label>
                  <input
                    type="number"
                    value={row.female || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || (!isNaN(val) && parseInt(val) >= 0 && parseInt(val) <= 1000)) {
                        handleFieldChange(index, 'female', val);
                      }
                    }}
                    placeholder="0"
                    min="0"
                    max="1000"
                    style={{ ...styles.input, textAlign: 'center' }}
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  // Desktop table view
  const DesktopView = () => (
    <div style={styles.wrapper}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={{ ...styles.th, ...styles.thFirst }}>യൂണിറ്റ്</th>
            <th style={{ ...styles.th, textAlign: 'center' }}>QHLS</th>
            <th style={styles.th}>ദിവസം</th>
            <th style={styles.th}>ഫാക്കൽറ്റി</th>
            <th style={styles.th}>പുരുഷന്മാർ</th>
            <th style={{ ...styles.th, ...styles.thLast }}>സ്ത്രീകൾ</th>
          </tr>
        </thead>
        <tbody>
          {qhlsData.map((row, index) => {
            const hasQhls = row.hasQhls !== false; // Default to true if not set
            return (
              <tr key={index}>
                <td style={styles.td}>
                  <input
                    type="text"
                    value={row.unit || filteredUnits[index] || ''}
                    disabled
                    style={{ ...styles.input, ...styles.inputDisabled, minWidth: '150px' }}
                  />
                </td>
                <td style={{ ...styles.td, textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    id={`qhls-${index}`}
                    checked={hasQhls}
                    onChange={(e) => handleFieldChange(index, 'hasQhls', e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                </td>
                <td style={styles.td}>
                  <select
                    value={row.day || ''}
                    onChange={(e) => handleFieldChange(index, 'day', e.target.value)}
                    disabled={!hasQhls}
                    style={{
                      ...styles.input,
                      ...(hasQhls ? {} : styles.inputDisabled),
                    }}
                  >
                    <option value="">-- തിരഞ്ഞെടുക്കുക --</option>
                    {malayalamDays.map((day, idx) => (
                      <option key={idx} value={day}>{day}</option>
                    ))}
                  </select>
                </td>
                <td style={styles.td}>
                  <input
                    type="text"
                    value={row.faculty || ''}
                    onChange={(e) => handleFieldChange(index, 'faculty', e.target.value)}
                    placeholder="ഫാക്കൽറ്റി"
                    disabled={!hasQhls}
                    style={{
                      ...styles.input,
                      ...(hasQhls ? {} : styles.inputDisabled),
                    }}
                  />
                </td>
                <td style={styles.td}>
                  <input
                    type="number"
                    value={row.male || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || (!isNaN(val) && parseInt(val) >= 0 && parseInt(val) <= 1000)) {
                        handleFieldChange(index, 'male', val);
                      }
                    }}
                    placeholder="0"
                    min="0"
                    max="1000"
                    disabled={!hasQhls}
                    style={{
                      ...styles.input,
                      ...styles.inputNumber,
                      ...(hasQhls ? {} : styles.inputDisabled),
                    }}
                  />
                </td>
                <td style={styles.td}>
                  <input
                    type="number"
                    value={row.female || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || (!isNaN(val) && parseInt(val) >= 0 && parseInt(val) <= 1000)) {
                        handleFieldChange(index, 'female', val);
                      }
                    }}
                    placeholder="0"
                    min="0"
                    max="1000"
                    disabled={!hasQhls}
                    style={{
                      ...styles.input,
                      ...styles.inputNumber,
                      ...(hasQhls ? {} : styles.inputDisabled),
                    }}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="form-group">
      <h3>QHLS</h3>
      {/* Show mobile view on smaller screens, desktop on larger */}
      <div className="qhls-mobile-view" style={{ display: 'none' }}>
        <MobileView />
      </div>
      <div className="qhls-desktop-view">
        <DesktopView />
      </div>
      <style>{`
        @media (max-width: 640px) {
          .qhls-mobile-view { display: block !important; }
          .qhls-desktop-view { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default QHLSTable;
