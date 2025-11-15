import React from 'react';

const MeetingMinutes = ({ minutes, onMinutesChange, onAddMinute, onRemoveMinute }) => {
  return (
    <div className="form-group">
      <label>മീറ്റിംഗ് മിനിറ്റുകൾ (Meeting Minutes):</label>
      {minutes.map((minute, index) => (
        <div key={index} className="minute-item">
          <textarea
            placeholder={`മിനിറ്റ് ${index + 1} (Minute ${index + 1})`}
            value={minute}
            onChange={(e) => onMinutesChange(index, e.target.value)}
            rows="3"
          />
          <button
            type="button"
            className="btn-danger"
            onClick={() => onRemoveMinute(index)}
            disabled={minutes.length === 1}
          >
            നീക്കം ചെയ്യുക (Remove)
          </button>
        </div>
      ))}
      <button
        type="button"
        className="add-button btn-secondary"
        onClick={onAddMinute}
      >
        + മിനിറ്റ് ചേർക്കുക (Add Minute)
      </button>
    </div>
  );
};

export default MeetingMinutes;

