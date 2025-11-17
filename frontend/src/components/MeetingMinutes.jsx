import React from 'react';

const MeetingMinutes = ({ minutes, onMinutesChange, onAddMinute, onRemoveMinute }) => {
  return (
    <div className="form-group">
      <label>മീറ്റിംഗ് തീരുമാനങ്ങൾ:</label>
      {minutes.map((minute, index) => (
        <div key={index} className="minute-item">
          <textarea
            placeholder={`തീരുമാനം ${index + 1}`}
            value={minute}
            onChange={(e) => onMinutesChange(index, e.target.value)}
            rows="3"
          />
          <button
            type="button"
            className="btn-danger icon-button"
            onClick={() => onRemoveMinute(index)}
            disabled={minutes.length === 1}
            aria-label="തീരുമാനം നീക്കം ചെയ്യുക"
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        className="add-button btn-secondary"
        onClick={onAddMinute}
      >
        + തീരുമാനം ചേർക്കുക
      </button>
    </div>
  );
};

export default MeetingMinutes;

