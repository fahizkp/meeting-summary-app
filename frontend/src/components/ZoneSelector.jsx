import React from 'react';

const ZoneSelector = ({ zones, selectedZone, onZoneChange, loading }) => {
  return (
    <div className="form-group">
      <label htmlFor="zone">മേഖല (Zone):</label>
      <select
        id="zone"
        value={selectedZone || ''}
        onChange={(e) => onZoneChange(e.target.value)}
        disabled={loading || !zones.length}
      >
        <option value="">മേഖല തിരഞ്ഞെടുക്കുക (Select Zone)</option>
        {zones.map((zone) => (
          <option key={zone.id} value={zone.id}>
            {zone.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ZoneSelector;

