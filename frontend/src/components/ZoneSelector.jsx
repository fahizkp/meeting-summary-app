import React from 'react';

const ZoneSelector = ({ zones, selectedZone, onZoneChange, loading }) => {
  return (
    <div className="form-group">
      <label htmlFor="zone">
        മണ്ഡലം തിരഞ്ഞെടുക്കുക
      </label>
      <select
        id="zone"
        value={selectedZone || ''}
        onChange={(e) => onZoneChange(e.target.value)}
        disabled={loading || !zones.length}
        style={{
          cursor: loading || !zones.length ? 'not-allowed' : 'pointer',
          opacity: loading || !zones.length ? 0.7 : 1,
        }}
      >
        <option value="">-- മണ്ഡലം തിരഞ്ഞെടുക്കുക --</option>
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
    </div>
  );
};

export default ZoneSelector;
