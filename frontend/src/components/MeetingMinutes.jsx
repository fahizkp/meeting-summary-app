import React from 'react';

const MeetingMinutes = ({ minutes, onMinutesChange, onAddMinute, onRemoveMinute }) => {
  const handleAddRow = (index) => {
    const isLastRow = index === minutes.length - 1;
    const value = (minutes[index] || '').trim();
    if (!isLastRow || !value) {
      return;
    }
    onAddMinute('');
  };

  return (
    <div className="form-group">
      <label>മീറ്റിംഗ് തീരുമാനങ്ങൾ:</label>

      {minutes.map((minute, index) => {
        const isLastRow = index === minutes.length - 1;
        const canAddAnother = isLastRow && minute.trim().length > 0;

        return (
          <div
            key={index}
            style={{
              marginBottom: '12px',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              backgroundColor: '#fff',
              display: 'flex',
              gap: '10px',
              alignItems: 'flex-start',
            }}
          >
            <span
              style={{
                minWidth: '32px',
                color: '#2c3e50',
                fontWeight: 600,
                marginTop: '4px',
              }}
            >
              {index + 1}.
            </span>
            <textarea
              placeholder={`തീരുമാനം ${index + 1}`}
              value={minute}
              onChange={(e) => onMinutesChange(index, e.target.value)}
              rows="3"
              style={{
                flex: 1,
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontFamily: 'inherit',
                fontSize: '14px',
              }}
            />
            <div style={{ display: 'flex', gap: '6px' }}>
              {isLastRow && (
                <button
                  type="button"
                  onClick={() => handleAddRow(index)}
                  disabled={!canAddAnother}
                  style={{
                    padding: '8px',
                    border: 'none',
                    borderRadius: '50%',
                    backgroundColor: canAddAnother ? '#27ae60' : '#b7e1c3',
                    color: '#fff',
                    cursor: canAddAnother ? 'pointer' : 'not-allowed',
                    fontSize: '18px',
                    width: '34px',
                    height: '34px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  aria-label="തീരുമാനം ചേർക്കുക"
                >
                  +
                </button>
              )}
              {minute.trim().length > 0 && (
                <button
                  type="button"
                  onClick={() => onRemoveMinute(index)}
                  style={{
                    padding: '8px',
                    border: '1px solid #e74c3c',
                    borderRadius: '50%',
                    backgroundColor: 'transparent',
                    color: '#e74c3c',
                    cursor: 'pointer',
                    fontSize: '18px',
                    width: '34px',
                    height: '34px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  aria-label="തീരുമാനം നീക്കം ചെയ്യുക"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MeetingMinutes;

