import React, { useState } from 'react';
import { getMeetingReport } from '../services/api';

const MeetingReport = () => {
  const [meetingId, setMeetingId] = useState('');
  const [report, setReport] = useState(null);
  const [meetingData, setMeetingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerateReport = async (e) => {
    e.preventDefault();
    setError(null);
    setReport(null);
    setMeetingData(null);

    if (!meetingId.trim()) {
      setError('ദയവായി മീറ്റിംഗ് ID നൽകുക (Please enter meeting ID)');
      return;
    }

    setLoading(true);
    try {
      const response = await getMeetingReport(meetingId);
      if (response.success) {
        setMeetingData(response.meetingData);
        setReport(response.report);
      } else {
        setError('റിപ്പോർട്ട് ലഭിക്കുന്നതിൽ പിശക് (Error generating report)');
      }
    } catch (err) {
      setError('റിപ്പോർട്ട് ലഭിക്കുന്നതിൽ പിശക് (Error generating report): ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyReport = () => {
    if (!report) return;

    const reportText = `പങ്കെടുക്കുന്നവർ:
${report.attendees || 'ആരുമില്ല'}

ലീവ് ആയവർ:
${report.leaveAayavar || 'ആരുമില്ല'}

എജണ്ട:
${report.agenda || 'എജണ്ടയില്ല'}

തീരുമാനങ്ങൾ:
${report.minutes || 'തീരുമാനങ്ങളില്ല'}

QHLS Status:
${report.qhlsStatus || 'QHLS ഡാറ്റയില്ല'}`;

    navigator.clipboard.writeText(reportText).then(() => {
      alert('റിപ്പോർട്ട് കോപ്പി ചെയ്തു! (Report copied!)');
    }).catch(() => {
      alert('കോപ്പി ചെയ്യുന്നതിൽ പിശക് (Error copying)');
    });
  };

  return (
    <div className="container">
      <h1>മീറ്റിംഗ് റിപ്പോർട്ട് (Meeting Report)</h1>

      <form onSubmit={handleGenerateReport} style={{ marginBottom: '30px' }}>
        <div className="form-group">
          <label htmlFor="meetingId">മീറ്റിംഗ് ID (Meeting ID):</label>
          <input
            type="text"
            id="meetingId"
            value={meetingId}
            onChange={(e) => setMeetingId(e.target.value)}
            placeholder="MEET-1234567890"
            required
          />
        </div>
        <button type="submit" className="btn-success" disabled={loading}>
          {loading ? 'റിപ്പോർട്ട് ലോഡ് ചെയ്യുന്നു...' : 'റിപ്പോർട്ട് ജനറേറ്റ് ചെയ്യുക'}
        </button>
      </form>

      {error && <div className="error">{error}</div>}

      {report && meetingData && (
        <div className="report-container">
          <div style={{ marginBottom: '20px', textAlign: 'right' }}>
            <button onClick={handleCopyReport} className="btn-secondary">
              റിപ്പോർട്ട് കോപ്പി ചെയ്യുക (Copy Report)
            </button>
          </div>

          <div className="report-section">
            <h2>മീറ്റിംഗ് വിവരങ്ങൾ (Meeting Details)</h2>
            <p><strong>മേഖല (Zone):</strong> {meetingData.zoneName}</p>
            <p><strong>തീയതി (Date):</strong> {meetingData.date}</p>
            {meetingData.startTime && (
              <p><strong>ആരംഭ സമയം (Start Time):</strong> {meetingData.startTime}</p>
            )}
            {meetingData.endTime && (
              <p><strong>അവസാന സമയം (End Time):</strong> {meetingData.endTime}</p>
            )}
          </div>

          <div className="report-section">
            <h2>പങ്കെടുക്കുന്നവർ:</h2>
            <pre className="report-content">{report.attendees || 'ആരുമില്ല'}</pre>
          </div>

          <div className="report-section">
            <h2>ലീവ് ആയവർ:</h2>
            <pre className="report-content">{report.leaveAayavar || 'ആരുമില്ല'}</pre>
          </div>

          <div className="report-section">
            <h2>എജണ്ട:</h2>
            <pre className="report-content">{report.agenda || 'എജണ്ടയില്ല'}</pre>
          </div>

          <div className="report-section">
            <h2>തീരുമാനങ്ങൾ:</h2>
            <pre className="report-content">{report.minutes || 'തീരുമാനങ്ങളില്ല'}</pre>
          </div>

          <div className="report-section">
            <h2>QHLS Status:</h2>
            <pre className="report-content">{report.qhlsStatus || 'QHLS ഡാറ്റയില്ല'}</pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingReport;

