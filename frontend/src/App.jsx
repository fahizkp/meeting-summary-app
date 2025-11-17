import React, { useState } from 'react';
import MeetingForm from './components/MeetingForm';
import MeetingReport from './components/MeetingReport';

function App() {
  const [activeTab, setActiveTab] = useState('form');

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        marginBottom: '20px',
        borderBottom: '2px solid #ecf0f1',
        paddingBottom: '10px'
      }}>
        <button
          onClick={() => setActiveTab('form')}
          style={{
            padding: '10px 20px',
            margin: '0 10px',
            backgroundColor: activeTab === 'form' ? '#3498db' : '#95a5a6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontFamily: 'Noto Sans Malayalam, sans-serif',
            fontSize: '1rem',
          }}
        >
          മീറ്റിംഗ് ഫോം (Meeting Form)
        </button>
        <button
          onClick={() => setActiveTab('report')}
          style={{
            padding: '10px 20px',
            margin: '0 10px',
            backgroundColor: activeTab === 'report' ? '#3498db' : '#95a5a6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontFamily: 'Noto Sans Malayalam, sans-serif',
            fontSize: '1rem',
          }}
        >
          റിപ്പോർട്ട് (Report)
        </button>
      </div>
      {activeTab === 'form' ? <MeetingForm /> : <MeetingReport />}
    </div>
  );
}

export default App;

