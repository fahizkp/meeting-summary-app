import React, { useState } from 'react';

const AttendeeList = ({ attendees, attendance, onAttendanceChange, onAbsenceReasonChange, onAddExtraAttendee }) => {
  const [extraName, setExtraName] = useState('');
  const [extraRole, setExtraRole] = useState('');

  const handleAddExtra = () => {
    if (extraName.trim()) {
      onAddExtraAttendee({ name: extraName.trim(), role: extraRole.trim() });
      setExtraName('');
      setExtraRole('');
    }
  };

  if (!attendees || attendees.length === 0) {
    return (
      <div className="form-group">
        <label>പങ്കെടുത്തവർ:</label>
        <p style={{ color: '#7f8c8d', fontStyle: 'italic' }}>
          ദയവായി ഒരു മണ്ഡലം തിരഞ്ഞെടുക്കുക (Please select a zone)
        </p>
      </div>
    );
  }

  return (
    <div className="form-group">
      <label>പങ്കെടുത്തവർ:</label>
      {attendees.map((attendee, index) => {
        const attendeeKey = `${attendee.name}_${attendee.role || ''}`;
        const currentAttendance = attendance[attendeeKey] || { status: 'present', reason: '' };

        return (
          <div key={index} className="attendee-item">
            <div className="attendee-name">
              {attendee.name}
              {attendee.role && <span className="attendee-role"> ({attendee.role})</span>}
            </div>
            <div className="attendance-controls">
              <div className="radio-group">
                <div className="radio-option">
                  <input
                    type="radio"
                    id={`present-${index}`}
                    name={`attendance-${index}`}
                    value="present"
                    checked={currentAttendance.status === 'present'}
                    onChange={() => onAttendanceChange(attendeeKey, 'present', '')}
                  />
                  <label htmlFor={`present-${index}`}>Present</label>
                </div>
                <div className="radio-option">
                  <input
                    type="radio"
                    id={`leave-${index}`}
                    name={`attendance-${index}`}
                    value="leave"
                    checked={currentAttendance.status === 'leave'}
                    onChange={() => onAttendanceChange(attendeeKey, 'leave', '')}
                  />
                  <label htmlFor={`leave-${index}`}>Leave</label>
                </div>
              </div>
              {currentAttendance.status === 'leave' && (
                <input
                  type="text"
                  className="absence-reason"
                  placeholder="ലീവ് കാരണം"
                  value={currentAttendance.reason || ''}
                  onChange={(e) => onAbsenceReasonChange(attendeeKey, e.target.value)}
                />
              )}
            </div>
          </div>
        );
      })}
      
      <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px', backgroundColor: '#f9f9f9' }}>
        <h4 style={{ marginTop: 0, marginBottom: '10px' }}>അധിക പങ്കെടുത്തവർ ചേർക്കുക (Add Extra Attendees):</h4>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: '1', minWidth: '200px' }}>
            <label htmlFor="extra-name" style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>പേര് (Name):</label>
            <input
              type="text"
              id="extra-name"
              value={extraName}
              onChange={(e) => setExtraName(e.target.value)}
              placeholder="പേര്"
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            />
          </div>
          <div style={{ flex: '1', minWidth: '200px' }}>
            <label htmlFor="extra-role" style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>റോൾ (Role):</label>
            <input
              type="text"
              id="extra-role"
              value={extraRole}
              onChange={(e) => setExtraRole(e.target.value)}
              placeholder="റോൾ"
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            />
          </div>
          <button
            type="button"
            onClick={handleAddExtra}
            disabled={!extraName.trim()}
            style={{
              padding: '8px 16px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: extraName.trim() ? 'pointer' : 'not-allowed',
              opacity: extraName.trim() ? 1 : 0.6
            }}
          >
            + ചേർക്കുക
          </button>
        </div>
      </div>
    </div>
  );
};

export default AttendeeList;

