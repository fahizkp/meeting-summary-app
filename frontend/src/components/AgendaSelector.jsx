import React, { useState } from 'react';

const AgendaSelector = ({ agendas, selectedAgendas, onAgendaAdd, onAgendaRemove }) => {
  const [selectedAgenda, setSelectedAgenda] = useState('');

  const handleAddAgenda = () => {
    const agendaValue = selectedAgenda.trim();
    if (agendaValue && !selectedAgendas.includes(agendaValue)) {
      onAgendaAdd(agendaValue);
    }
    setSelectedAgenda('');
  };

  return (
    <div className="form-group">
      <label>അജണ്ടകൾ:</label>
      <div className="agenda-selector">
        <input
          type="text"
          value={selectedAgenda}
          onChange={(e) => setSelectedAgenda(e.target.value)}
          list="agenda-options"
          placeholder="അജണ്ട ചേർക്കുക"
        />
        {agendas && agendas.length > 0 && (
          <datalist id="agenda-options">
            {agendas.map((agenda, index) => (
              <option key={`${agenda}-${index}`} value={agenda} />
            ))}
          </datalist>
        )}
        <button
          type="button"
          className="btn-secondary"
          onClick={handleAddAgenda}
          disabled={!selectedAgenda.trim()}
          aria-label="അജണ്ട ചേർക്കുക"
        >
          +
        </button>
      </div>
      {selectedAgendas.length > 0 && (
        <div className="selected-agendas">
          {selectedAgendas.map((agenda, index) => (
            <div key={index} className="agenda-item">
              <span style={{ fontWeight: 600, marginRight: '8px' }}>{index + 1}.</span>
              <span style={{ flex: 1 }}>{agenda}</span>
              <button
                type="button"
                onClick={() => onAgendaRemove(index)}
                aria-label={`${agenda} നീക്കം ചെയ്യുക`}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="#d32f2f"
                  aria-hidden="true"
                >
                  <path d="M16 9v10H8V9h8m-1.5-6h-5l-1 1H5v2h14V4h-3.5l-1-1z" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AgendaSelector;

