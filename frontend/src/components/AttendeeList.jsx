import React from 'react';

const AttendeeList = ({ attendees, attendance, onAttendanceChange, onAbsenceReasonChange }) => {
  if (!attendees || attendees.length === 0) {
    return (
      <div className="form-group">
        <label>പങ്കെടുക്കുന്നവർ (Attendees):</label>
        <p style={{ color: '#7f8c8d', fontStyle: 'italic' }}>
          ദയവായി ഒരു മേഖല തിരഞ്ഞെടുക്കുക (Please select a zone)
        </p>
      </div>
    );
  }

  return (
    <div className="form-group">
      <label>പങ്കെടുക്കുന്നവർ (Attendees):</label>
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
                  placeholder="അഭാവത്തിന്റെ കാരണം (Reason for leave)"
                  value={currentAttendance.reason || ''}
                  onChange={(e) => onAbsenceReasonChange(attendeeKey, e.target.value)}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AttendeeList;

