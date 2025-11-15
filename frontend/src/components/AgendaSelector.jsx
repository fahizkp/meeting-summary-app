import React, { useState } from 'react';

const AgendaSelector = ({ agendas, selectedAgendas, onAgendaAdd, onAgendaRemove }) => {
  const [selectedAgenda, setSelectedAgenda] = useState('');

  const handleAddAgenda = () => {
    if (selectedAgenda && !selectedAgendas.includes(selectedAgenda)) {
      onAgendaAdd(selectedAgenda);
      setSelectedAgenda('');
    }
  };

  return (
    <div className="form-group">
      <label>എജണ്ട (Agenda):</label>
      <div className="agenda-selector">
        <select
          value={selectedAgenda}
          onChange={(e) => setSelectedAgenda(e.target.value)}
          disabled={!agendas || agendas.length === 0}
        >
          <option value="">എജണ്ട തിരഞ്ഞെടുക്കുക (Select Agenda)</option>
          {agendas && agendas.map((agenda, index) => (
            <option key={index} value={agenda}>
              {agenda}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="btn-secondary"
          onClick={handleAddAgenda}
          disabled={!selectedAgenda || selectedAgendas.includes(selectedAgenda)}
        >
          + ചേർക്കുക (Add)
        </button>
      </div>
      {selectedAgendas.length > 0 && (
        <div className="selected-agendas">
          {selectedAgendas.map((agenda, index) => (
            <div key={index} className="agenda-item">
              <span>{agenda}</span>
              <button
                type="button"
                className="btn-danger"
                onClick={() => onAgendaRemove(index)}
              >
                നീക്കം ചെയ്യുക (Remove)
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AgendaSelector;

