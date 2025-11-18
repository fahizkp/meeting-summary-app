import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllMeetings, getMeetingReport, deleteMeeting } from '../services/api';

const MeetingReport = () => {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedMeetingData, setSelectedMeetingData] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAllMeetings();
      if (response.success) {
        setMeetings(response.meetings || []);
      } else {
        setError('മീറ്റിംഗുകൾ ലഭിക്കുന്നതിൽ പിശക് (Error fetching meetings)');
      }
    } catch (err) {
      setError('മീറ്റിംഗുകൾ ലഭിക്കുന്നതിൽ പിശക് (Error fetching meetings): ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (meetingId) => {
    try {
      const response = await getMeetingReport(meetingId);
      if (response.success) {
        setSelectedMeetingData(response.meetingData);
        setSelectedReport(response.report);
      } else {
        alert('റിപ്പോർട്ട് ലഭിക്കുന്നതിൽ പിശക് (Error fetching report)');
      }
    } catch (err) {
      alert('റിപ്പോർട്ട് ലഭിക്കുന്നതിൽ പിശക് (Error fetching report): ' + err.message);
    }
  };

  const handleEdit = async (meetingId) => {
    try {
      const response = await getMeetingReport(meetingId);
      if (response.success) {
        // Navigate to form with meeting data
        // Store meeting data in sessionStorage or pass via state
        sessionStorage.setItem('editMeetingData', JSON.stringify({
          meetingId,
          ...response.meetingData,
        }));
        navigate('/', {
          state: {
            editMeetingData: {
              meetingId,
              ...response.meetingData,
            },
          },
        });
        // The form component will need to check for editMeetingData on mount
      } else {
        alert('മീറ്റിംഗ് ഡാറ്റ ലഭിക്കുന്നതിൽ പിശക് (Error fetching meeting data)');
      }
    } catch (err) {
      alert('മീറ്റിംഗ് ഡാറ്റ ലഭിക്കുന്നതിൽ പിശക് (Error fetching meeting data): ' + err.message);
    }
  };

  const handleDelete = async (meetingId) => {
    if (!window.confirm('ഈ മീറ്റിംഗ് ഇല്ലാതാക്കണോ? (Are you sure you want to delete this meeting?)')) {
      return;
    }

    setDeletingId(meetingId);
    try {
      const response = await deleteMeeting(meetingId);
      if (response.success) {
        // Remove from list
        setMeetings(meetings.filter(m => m.meetingId !== meetingId));
        // Clear selected report if it was the deleted one
        if (selectedMeetingData && selectedMeetingData.meetingId === meetingId) {
          setSelectedReport(null);
          setSelectedMeetingData(null);
        }
        alert('മീറ്റിംഗ് ഇല്ലാതാക്കി (Meeting deleted)');
      } else {
        alert('മീറ്റിംഗ് ഇല്ലാതാക്കുന്നതിൽ പിശക് (Error deleting meeting)');
      }
    } catch (err) {
      alert('മീറ്റിംഗ് ഇല്ലാതാക്കുന്നതിൽ പിശക് (Error deleting meeting): ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleCopyReport = () => {
    if (!selectedReport || !selectedMeetingData) return;

    const reportText = `മീറ്റിംഗ് റിപ്പോർട്ട്
━━━━━━━━━━━━━━━━━━━━
മണ്ഡലം: ${selectedMeetingData.zoneName}

തീയതി: ${selectedMeetingData.date}
${selectedMeetingData.startTime ? `തുടങ്ങിയ സമയം: ${selectedMeetingData.startTime}` : ''}
${selectedMeetingData.endTime ? `അവസാനിച്ച സമയം: ${selectedMeetingData.endTime}` : ''}

പങ്കെടുത്തവർ:
${selectedReport.attendees || 'ആരുമില്ല'}

ലീവ് ആയവർ:
${selectedReport.leaveAayavar || 'ആരുമില്ല'}

അജണ്ടകൾ:
${selectedReport.agenda || 'അജണ്ടകളില്ല'}

തീരുമാനങ്ങൾ:
${selectedReport.minutes || 'തീരുമാനങ്ങളില്ല'}

QHLS Status:
${selectedReport.qhlsStatus || 'QHLS ഡാറ്റയില്ല'}`;

    navigator.clipboard.writeText(reportText).then(() => {
      alert('റിപ്പോർട്ട് കോപ്പി ചെയ്തു! (Report copied!)');
    }).catch(() => {
      alert('കോപ്പി ചെയ്യുന്നതിൽ പിശക് (Error copying)');
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="container">
        <div style={{ textAlign: 'center', padding: '40px' }}>
          ലോഡ് ചെയ്യുന്നു... (Loading...)
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>മീറ്റിംഗ് റിപ്പോർട്ടുകൾ (Meeting Reports)</h1>

      {error && <div className="error">{error}</div>}

      {!selectedReport ? (
        <>
          {meetings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#7f8c8d' }}>
              ഒരു മീറ്റിംഗും കണ്ടെത്തിയില്ല (No meetings found)
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse',
                backgroundColor: '#fff',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                <thead>
                  <tr style={{ backgroundColor: '#3498db', color: '#fff' }}>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>S.No</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Saved Date</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>മണ്ഡലം (Zone)</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Meeting Date</th>
                    <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #ddd' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {meetings.map((meeting, index) => (
                    <tr key={meeting.meetingId} style={{ 
                      backgroundColor: index % 2 === 0 ? '#fff' : '#f9f9f9' 
                    }}>
                      <td style={{ padding: '12px', border: '1px solid #ddd' }}>{index + 1}</td>
                      <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                        {formatDate(meeting.savedDate)}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                        {meeting.zoneName || '-'}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                        {meeting.date || '-'}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button
                            onClick={() => handleView(meeting.meetingId)}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#3498db',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '14px'
                            }}
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleEdit(meeting.meetingId)}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#f39c12',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '14px'
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(meeting.meetingId)}
                            disabled={deletingId === meeting.meetingId}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#e74c3c',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: deletingId === meeting.meetingId ? 'not-allowed' : 'pointer',
                              opacity: deletingId === meeting.meetingId ? 0.6 : 1,
                              fontSize: '14px'
                            }}
                          >
                            {deletingId === meeting.meetingId ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <div>
          <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
            <button
              onClick={() => {
                setSelectedReport(null);
                setSelectedMeetingData(null);
              }}
              style={{
                padding: '8px 16px',
                backgroundColor: '#95a5a6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              ← Back to List
            </button>
            <button
              onClick={handleCopyReport}
              style={{
                padding: '8px 16px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Copy Report
            </button>
          </div>

          <div className="report-container">
            <div className="report-section">
              <h2>മീറ്റിംഗ് വിവരങ്ങൾ (Meeting Details)</h2>
              <p><strong>മണ്ഡലം (Zone):</strong> {selectedMeetingData.zoneName}</p>
              <p><strong>തീയതി (Date):</strong> {selectedMeetingData.date}</p>
              {selectedMeetingData.startTime && (
                <p><strong>തുടങ്ങിയ സമയം (Start Time):</strong> {selectedMeetingData.startTime}</p>
              )}
              {selectedMeetingData.endTime && (
                <p><strong>അവസാനിച്ച സമയം (End Time):</strong> {selectedMeetingData.endTime}</p>
              )}
            </div>

            <div className="report-section">
              <h2>പങ്കെടുത്തവർ:</h2>
              <pre className="report-content">{selectedReport.attendees || 'ആരുമില്ല'}</pre>
            </div>

            <div className="report-section">
              <h2>ലീവ് ആയവർ:</h2>
              <pre className="report-content">{selectedReport.leaveAayavar || 'ആരുമില്ല'}</pre>
            </div>

            <div className="report-section">
              <h2>അജണ്ടകൾ:</h2>
              <pre className="report-content">{selectedReport.agenda || 'അജണ്ടകളില്ല'}</pre>
            </div>

            <div className="report-section">
              <h2>തീരുമാനങ്ങൾ:</h2>
              <pre className="report-content">{selectedReport.minutes || 'തീരുമാനങ്ങളില്ല'}</pre>
            </div>

            <div className="report-section">
              <h2>QHLS Status:</h2>
              <pre className="report-content">{selectedReport.qhlsStatus || 'QHLS ഡാറ്റയില്ല'}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingReport;
