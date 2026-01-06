import React from 'react';

const ZoneSelector = ({ zones, selectedZone, onZoneChange, loading, disabled }) => {
  const isDisabled = disabled || loading || !zones.length;
  const isSingleZone = zones.length === 1;

  return (
    <div className="form-group">
      <label htmlFor="zone">
        മണ്ഡലം തിരഞ്ഞെടുക്കുക
      </label>
      <select
        id="zone"
        value={selectedZone || ''}
        onChange={(e) => onZoneChange(e.target.value)}
        disabled={isDisabled}
        style={{
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          opacity: isDisabled ? 0.7 : 1,
        }}
      >
        {!isSingleZone && <option value="">-- മണ്ഡലം തിരഞ്ഞെടുക്കുക --</option>}
        {zones.map((zone) => (
          <option key={zone.id} value={zone.id}>
            {zone.name}
          </option>
        ))}
      </select>
      {loading && (
        <p style={{
          marginTop: '8px',
          fontSize: '0.85rem',
          color: '#6c5ce7',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{
            display: 'inline-block',
            width: '14px',
            height: '14px',
            border: '2px solid #a29bfe',
            borderTopColor: '#6c5ce7',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }} />
          ലോഡ് ചെയ്യുന്നു...
        </p>
      )}
      {isSingleZone && !loading && (
        <p style={{
          marginTop: '8px',
          fontSize: '0.85rem',
          color: '#27ae60',
        }}>
          നിങ്ങൾക്ക് ഈ മണ്ഡലത്തിലേക്ക് മാത്രമേ പ്രവേശനമുള്ളൂ
        </p>
      )}
    </div>
  );
};

export default ZoneSelector;
