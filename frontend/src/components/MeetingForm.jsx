import React, { useState, useEffect, useRef } from 'react';
import { getZones, getAttendees, getAgendas, saveMeeting, getMeetingReport } from '../services/api';
import ZoneSelector from './ZoneSelector';
import AttendeeList from './AttendeeList';
import MeetingMinutes from './MeetingMinutes';
import AgendaSelector from './AgendaSelector';
import QHLSTable from './QHLSTable';
import jsPDF from 'jspdf';

const FORM_STORAGE_KEY = 'meetingFormDraft';
const getTodayDate = () => new Date().toISOString().split('T')[0];
const defaultQhlsRow = { unit: '', day: '', faculty: '', male: '', female: '' };

const buildQhlsRows = (units = []) => {
  if (Array.isArray(units) && units.length > 0) {
    return units.map((unitName) => ({
      ...defaultQhlsRow,
      unit: unitName,
    }));
  }
  return [{ ...defaultQhlsRow }];
};

const MeetingForm = () => {
  const [zones, setZones] = useState([]);
  const [selectedZone, setSelectedZone] = useState('');
  const [selectedZoneName, setSelectedZoneName] = useState('');
  const [attendees, setAttendees] = useState([]);
  const [agendas, setAgendas] = useState([]);
  const [date, setDate] = useState(getTodayDate());
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [selectedAgendas, setSelectedAgendas] = useState([]);
  const [minutes, setMinutes] = useState(['']);
  const [attendance, setAttendance] = useState({});
  const [qhlsData, setQhlsData] = useState(buildQhlsRows());
  const [zoneUnits, setZoneUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [savedMeetingId, setSavedMeetingId] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [showReportPreview, setShowReportPreview] = useState(false);
  const [draftHydrated, setDraftHydrated] = useState(false);
  const attendanceDraftRef = useRef(null);
  const qhlsDraftRef = useRef(null);
  const savedZoneRef = useRef(null);
  const selectedAgendasHydratedRef = useRef(false);
  const draftDataRef = useRef(null);

  const clearDraftStorage = () => {
    try {
      localStorage.removeItem(FORM_STORAGE_KEY);
    } catch (err) {
      console.warn('Could not remove meeting form draft from storage', err);
    }
    attendanceDraftRef.current = null;
    qhlsDraftRef.current = null;
    savedZoneRef.current = null;
    selectedAgendasHydratedRef.current = false;
  };

  // Fetch zones and agendas on component mount
  useEffect(() => {
    const fetchZones = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getZones();
        if (response.success) {
          setZones(response.zones);
        } else {
          setError('മണ്ഡലങ്ങൾ ലഭിക്കുന്നതിൽ പിശക് (Error fetching zones)');
        }
      } catch (err) {
        setError('മണ്ഡലങ്ങൾ ലഭിക്കുന്നതിൽ പിശക് (Error fetching zones): ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    const fetchAgendas = async () => {
      try {
        const response = await getAgendas();
        if (response.success) {
          const agendaItems = (response.agendas || [])
            .map((item) => (typeof item === 'string' ? item.trim() : ''))
            .filter((item, index, arr) => item && arr.indexOf(item) === index);
          setAgendas(agendaItems);
          if (!selectedAgendasHydratedRef.current) {
            setSelectedAgendas(agendaItems);
          }
        }
      } catch (err) {
        console.error('Error fetching agendas:', err);
      }
    };

    fetchZones();
    fetchAgendas();
  }, []);

  // Hydrate draft from localStorage on mount
  useEffect(() => {
    if (draftHydrated) return;
    try {
      const storedDraft = localStorage.getItem(FORM_STORAGE_KEY);
      if (!storedDraft) {
        setDraftHydrated(true);
        return;
      }
      const parsedDraft = JSON.parse(storedDraft);
      draftDataRef.current = parsedDraft;
      const {
        selectedZone: draftZone = '',
        date: draftDate,
        startTime: draftStart,
        endTime: draftEnd,
        minutes: draftMinutes,
        attendance: draftAttendance,
        qhlsData: draftQhls,
        selectedAgendas: draftAgendas,
      } = parsedDraft;

      if (draftZone) {
        setSelectedZone(draftZone);
        savedZoneRef.current = draftZone;
      }
      if (draftDate) setDate(draftDate);
      if (typeof draftStart === 'string') setStartTime(draftStart);
      if (typeof draftEnd === 'string') setEndTime(draftEnd);
      if (Array.isArray(draftMinutes) && draftMinutes.length) {
        setMinutes(draftMinutes);
      }
      if (Array.isArray(draftAgendas) && draftAgendas.length) {
        draftDataRef.current.selectedAgendas = draftAgendas;
      }
      if (draftAttendance) {
        attendanceDraftRef.current = draftAttendance;
      }
      if (Array.isArray(draftQhls) && draftQhls.length) {
        qhlsDraftRef.current = draftQhls;
      }
    } catch (err) {
      console.warn('Failed to parse meeting form draft', err);
    } finally {
      setDraftHydrated(true);
    }
  }, [draftHydrated]);

  // Apply draft agendas after agendas fetched
  useEffect(() => {
    if (
      !draftHydrated ||
      selectedAgendasHydratedRef.current ||
      !Array.isArray(agendas) ||
      agendas.length === 0
    ) {
      return;
    }

    if (draftDataRef.current && Array.isArray(draftDataRef.current.selectedAgendas)) {
      const draftAgendas = draftDataRef.current.selectedAgendas.filter(
        (item) => typeof item === 'string' && item.trim() !== ''
      );
      if (draftAgendas.length) {
        setSelectedAgendas(draftAgendas);
        selectedAgendasHydratedRef.current = true;
        return;
      }
    }

    setSelectedAgendas(agendas);
    selectedAgendasHydratedRef.current = true;
  }, [agendas, draftHydrated]);

  // Fetch attendees when zone is selected
  useEffect(() => {
    if (selectedZone) {
      const fetchAttendees = async () => {
        setLoading(true);
        setError(null);
        try {
          const response = await getAttendees(selectedZone);
          if (response.success) {
            setAttendees(response.attendees);
            const initialAttendance = {};
            response.attendees.forEach((attendee) => {
              const attendeeKey = `${attendee.name}_${attendee.role || ''}`;
              initialAttendance[attendeeKey] = {
                status: 'present',
                reason: '',
              };
            });
            if (
              savedZoneRef.current === selectedZone &&
              attendanceDraftRef.current &&
              Object.keys(attendanceDraftRef.current).length
            ) {
              const savedAttendance = attendanceDraftRef.current;
              const merged = { ...initialAttendance };
              Object.entries(savedAttendance).forEach(([key, data]) => {
                merged[key] = {
                  status: data?.status || 'present',
                  reason: data?.reason || '',
                };
              });
              setAttendance(merged);
              attendanceDraftRef.current = null;
            } else {
              setAttendance(initialAttendance);
            }
            // Get zone name
            const zone = zones.find((z) => z.id === selectedZone);
            if (zone) {
              setSelectedZoneName(zone.name);
              setZoneUnits(zone.units || []);
            }
          } else {
            setError('പങ്കെടുക്കുന്നവരെ ലഭിക്കുന്നതിൽ പിശക് (Error fetching attendees)');
          }
        } catch (err) {
          setError('പങ്കെടുക്കുന്നവരെ ലഭിക്കുന്നതിൽ പിശക് (Error fetching attendees): ' + err.message);
        } finally {
          setLoading(false);
        }
      };

      fetchAttendees();
    } else {
      setAttendees([]);
      setAttendance({});
      setSelectedZoneName('');
      setZoneUnits([]);
    }
  }, [selectedZone, zones]);

  useEffect(() => {
    if (
      savedZoneRef.current === selectedZone &&
      qhlsDraftRef.current &&
      qhlsDraftRef.current.length
    ) {
      setQhlsData(qhlsDraftRef.current);
      qhlsDraftRef.current = null;
    } else {
      setQhlsData(buildQhlsRows(zoneUnits));
    }
  }, [zoneUnits, selectedZone]);

  const handleZoneChange = (zoneId) => {
    setSelectedZone(zoneId);
    setMinutes(['']); // Reset minutes when zone changes
    setSuccess(null);

    if (!zoneId) {
      setSelectedZoneName('');
      setZoneUnits([]);
      return;
    }

    const zone = zones.find((z) => z.id === zoneId);
    if (zone) {
      const units = zone.units || [];
      setSelectedZoneName(zone.name);
      setZoneUnits(units);
    } else {
      setSelectedZoneName('');
      setZoneUnits([]);
    }
  };

  const handleMinutesChange = (index, value) => {
    const newMinutes = [...minutes];
    newMinutes[index] = value;
    setMinutes(newMinutes);
  };

  const handleAddMinute = () => {
    setMinutes([...minutes, '']);
  };

  const handleRemoveMinute = (index) => {
    if (minutes.length > 1) {
      const newMinutes = minutes.filter((_, i) => i !== index);
      setMinutes(newMinutes);
    }
  };

  const handleAttendanceChange = (attendeeName, status, reason) => {
    setAttendance({
      ...attendance,
      [attendeeName]: {
        status,
        reason: status === 'leave' ? reason : '',
      },
    });
  };

  const handleAbsenceReasonChange = (attendeeName, reason) => {
    setAttendance({
      ...attendance,
      [attendeeName]: {
        ...attendance[attendeeName],
        reason,
      },
    });
  };

  const handleAgendaAdd = (agenda) => {
    const trimmedAgenda = (agenda || '').trim();
    if (!trimmedAgenda || selectedAgendas.includes(trimmedAgenda)) {
      return;
    }
    setSelectedAgendas([...selectedAgendas, trimmedAgenda]);
  };

  const handleAgendaRemove = (index) => {
    setSelectedAgendas(selectedAgendas.filter((_, i) => i !== index));
  };

  const handleQHLSChange = (data) => {
  // Persist form draft whenever relevant state changes
  useEffect(() => {
    if (!draftHydrated) return;

    const hasMeaningfulData =
      selectedZone ||
      startTime ||
      endTime ||
      (Array.isArray(selectedAgendas) && selectedAgendas.length) ||
      (Array.isArray(minutes) && minutes.some((m) => m && m.trim() !== '')) ||
      (attendance && Object.keys(attendance).length) ||
      (Array.isArray(qhlsData) && qhlsData.some((row) => Object.values(row).some(Boolean)));

    if (!hasMeaningfulData) {
      clearDraftStorage();
      return;
    }

    const payload = {
      selectedZone,
      date,
      startTime,
      endTime,
      selectedAgendas,
      minutes,
      attendance,
      qhlsData,
    };

    try {
      localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(payload));
    } catch (err) {
      console.warn('Unable to save meeting form draft', err);
    }
  }, [
    draftHydrated,
    selectedZone,
    date,
    startTime,
    endTime,
    selectedAgendas,
    minutes,
    attendance,
    qhlsData,
  ]);

    setQhlsData(data);
  };

  const formatReportForWhatsApp = (report, meetingData) => {
    const lines = [
      `*മീറ്റിംഗ് റിപ്പോർട്ട്*`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `*മണ്ഡലം:* ${meetingData.zoneName}`,
      `*തീയതി:* ${meetingData.date}`,
      meetingData.startTime ? `*തുടങ്ങിയ സമയം:* ${meetingData.startTime}` : '',
      meetingData.endTime ? `*അവസാനിച്ച സമയം:* ${meetingData.endTime}` : '',
      ``,
      `*പങ്കെടുത്തവർ:*`,
      report.attendees || 'ആരുമില്ല',
      ``,
      `*ലീവ് ആയവർ:*`,
      report.leaveAayavar || 'ആരുമില്ല',
      ``,
      `*അജണ്ടകൾ:*`,
      report.agenda || 'അജണ്ടകളില്ല',
      ``,
      `*തീരുമാനങ്ങൾ:*`,
      report.minutes || 'തീരുമാനങ്ങളില്ല',
      ``,
      `*QHLS Status:*`,
      report.qhlsStatus || 'QHLS ഡാറ്റയില്ല',
    ].filter(line => line !== '').join('\n');
    
    return lines;
  };

  const handleCopyToWhatsApp = () => {
    if (!reportData) return;
    
    const whatsappText = formatReportForWhatsApp(reportData.report, reportData.meetingData);
    
    navigator.clipboard.writeText(whatsappText).then(() => {
      alert('വാട്സാപ്പിലേക്ക് കോപ്പി ചെയ്തു! (Copied to WhatsApp!)');
    }).catch(() => {
      alert('കോപ്പി ചെയ്യുന്നതിൽ പിശക് (Error copying)');
    });
  };

  const handleSaveAsPDF = () => {
    if (!reportData) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;
    const margin = 20;
    const lineHeight = 7;
    const maxWidth = pageWidth - (margin * 2);

    // Helper function to add text with word wrap
    const addText = (text, fontSize = 12, isBold = false, color = [0, 0, 0]) => {
      doc.setFontSize(fontSize);
      doc.setTextColor(color[0], color[1], color[2]);
      if (isBold) {
        doc.setFont(undefined, 'bold');
      } else {
        doc.setFont(undefined, 'normal');
      }

      const lines = doc.splitTextToSize(text, maxWidth);
      
      if (yPosition + (lines.length * lineHeight) > pageHeight - margin) {
        doc.addPage();
        yPosition = 20;
      }

      lines.forEach((line) => {
        doc.text(line, margin, yPosition);
        yPosition += lineHeight;
      });
      
      yPosition += 3; // Add spacing after text block
    };

    // Title
    addText('മീറ്റിംഗ് റിപ്പോർട്ട്', 16, true, [0, 0, 0]);
    yPosition += 5;

    // Meeting Details
    addText(`മണ്ഡലം: ${reportData.meetingData.zoneName}`, 12, true);
    addText(`തീയതി: ${reportData.meetingData.date}`, 12);
    if (reportData.meetingData.startTime) {
      addText(`തുടങ്ങിയ സമയം: ${reportData.meetingData.startTime}`, 12);
    }
    if (reportData.meetingData.endTime) {
      addText(`അവസാനിച്ച സമയം: ${reportData.meetingData.endTime}`, 12);
    }
    yPosition += 5;

    // Attendees
    addText('പങ്കെടുത്തവർ:', 12, true);
    addText(reportData.report.attendees || 'ആരുമില്ല', 11);
    yPosition += 5;

    // Leave attendees
    addText('ലീവ് ആയവർ:', 12, true);
    addText(reportData.report.leaveAayavar || 'ആരുമില്ല', 11);
    yPosition += 5;

    // Agenda
    addText('അജണ്ടകൾ:', 12, true);
    addText(reportData.report.agenda || 'അജണ്ടകളില്ല', 11);
    yPosition += 5;

    // Minutes
    addText('തീരുമാനങ്ങൾ:', 12, true);
    addText(reportData.report.minutes || 'തീരുമാനങ്ങളില്ല', 11);
    yPosition += 5;

    // QHLS
    addText('QHLS Status:', 12, true);
    addText(reportData.report.qhlsStatus || 'QHLS ഡാറ്റയില്ല', 11);

    // Save PDF
    const fileName = `Meeting_Report_${reportData.meetingData.zoneName}_${reportData.meetingData.date}.pdf`;
    doc.save(fileName);
  };

  const handleClosePreview = () => {
    setShowReportPreview(false);
    setReportData(null);
    setSavedMeetingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validation
    if (!selectedZone) {
      setError('ദയവായി ഒരു മണ്ഡലം തിരഞ്ഞെടുക്കുക (Please select a zone)');
      return;
    }

    if (!date) {
      setError('ദയവായി തീയതി നൽകുക (Please provide a date)');
      return;
    }

    const validMinutes = minutes.filter((m) => m.trim() !== '');
    if (validMinutes.length === 0) {
      setError('ദയവായി കുറഞ്ഞത് ഒരു തീരുമാനമെങ്കിലും ചേർക്കുക (Please add at least one decision)');
      return;
    }

    setSubmitting(true);

    try {
      const meetingData = {
        zoneName: selectedZoneName,
        date,
        startTime,
        endTime,
        agendas: selectedAgendas,
        minutes: validMinutes,
        attendance: Object.entries(attendance).map(([key, data]) => {
          // Extract name from key (format: "name_role")
          const [name, role] = key.split('_');
          return {
            name,
            role: role || '',
            status: data.status,
            reason: data.reason || '',
          };
        }),
        qhls: qhlsData.filter(row => row.unit || row.day || row.faculty || row.male || row.female),
      };

      const response = await saveMeeting(meetingData);

      if (response.success) {
        const meetingId = response.data?.meetingId || 'N/A';
        const weekSheet = response.data?.weekSheet || 'N/A';
        setSavedMeetingId(meetingId);
            setSuccess('മീറ്റിംഗ് സംഗ്രഹം വിജയകരമായി സേവ് ചെയ്തു! (Meeting summary saved successfully!)');
        
        // Fetch and display report
        try {
          const reportResponse = await getMeetingReport(meetingId);
          if (reportResponse.success) {
            setReportData(reportResponse);
            setShowReportPreview(true);
          }
        } catch (err) {
          console.error('Error fetching report:', err);
        }
        
        // Reset form
        clearDraftStorage();
        setSelectedZone('');
        setMinutes(['']);
        setDate(getTodayDate());
        setStartTime('');
        setEndTime('');
        setSelectedAgendas(agendas);
        setAttendance({});
        setZoneUnits([]);
        setQhlsData(buildQhlsRows());
      } else {
        setError('മീറ്റിംഗ് സംഗ്രഹം സേവ് ചെയ്യുന്നതിൽ പിശക് (Error saving meeting summary)');
      }
    } catch (err) {
      setError('മീറ്റിംഗ് സംഗ്രഹം സേവ് ചെയ്യുന്നതിൽ പിശക് (Error saving meeting summary): ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container">
      <h1>മീറ്റിംഗ് സംഗ്രഹം (Meeting Summary)</h1>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <form onSubmit={handleSubmit}>
        <ZoneSelector
          zones={zones}
          selectedZone={selectedZone}
          onZoneChange={handleZoneChange}
          loading={loading}
        />

        <div className="form-group">
          <label htmlFor="date">തീയതി (Date):</label>
          <input
            type="date"
            id="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="startTime">തുടങ്ങിയ സമയം (Start Time):</label>
          <input
            type="time"
            id="startTime"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="endTime">അവസാനിച്ച സമയം (End Time):</label>
          <input
            type="time"
            id="endTime"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </div>

        <AgendaSelector
          agendas={agendas}
          selectedAgendas={selectedAgendas}
          onAgendaAdd={handleAgendaAdd}
          onAgendaRemove={handleAgendaRemove}
        />

        {loading && attendees.length === 0 && selectedZone && (
          <div className="loading">ലോഡ് ചെയ്യുന്നു... (Loading...)</div>
        )}

        <AttendeeList
          attendees={attendees}
          attendance={attendance}
          onAttendanceChange={handleAttendanceChange}
          onAbsenceReasonChange={handleAbsenceReasonChange}
        />

        <MeetingMinutes
          minutes={minutes}
          onMinutesChange={handleMinutesChange}
          onAddMinute={handleAddMinute}
          onRemoveMinute={handleRemoveMinute}
        />

        <QHLSTable
          qhlsData={qhlsData}
          onQHLSChange={handleQHLSChange}
          availableUnits={zoneUnits}
        />

        <div className="submit-section">
          <button
            type="submit"
            className="submit-button btn-success"
            disabled={submitting || !selectedZone}
          >
            {submitting
              ? 'സേവ് ചെയ്യുന്നു...'
              : 'സേവ് ചെയ്യുക'}
          </button>
        </div>
      </form>

      {/* Report Preview Modal */}
      {showReportPreview && reportData && (
        <div className="report-preview-modal">
          <div className="report-preview-content">
            <div className="report-preview-header">
              <h2>റിപ്പോർട്ട് പ്രിവ്യൂ (Report Preview)</h2>
              <button onClick={handleClosePreview} className="close-button">×</button>
            </div>
            
            <div className="report-preview-body">
              <div className="report-section">
                <h3>മീറ്റിംഗ് വിവരങ്ങൾ (Meeting Details)</h3>
                <p><strong>മണ്ഡലം (Zone):</strong> {reportData.meetingData.zoneName}</p>
                <p><strong>തീയതി (Date):</strong> {reportData.meetingData.date}</p>
                {reportData.meetingData.startTime && (
                  <p><strong>തുടങ്ങിയ സമയം (Start Time):</strong> {reportData.meetingData.startTime}</p>
                )}
                {reportData.meetingData.endTime && (
                  <p><strong>അവസാനിച്ച സമയം (End Time):</strong> {reportData.meetingData.endTime}</p>
                )}
              </div>

              <div className="report-section">
                <h3>പങ്കെടുത്തവർ:</h3>
                <pre className="report-content">{reportData.report.attendees || 'ആരുമില്ല'}</pre>
              </div>

              <div className="report-section">
                <h3>ലീവ് ആയവർ:</h3>
                <pre className="report-content">{reportData.report.leaveAayavar || 'ആരുമില്ല'}</pre>
              </div>

              <div className="report-section">
                <h3>അജണ്ടകൾ:</h3>
                <pre className="report-content">{reportData.report.agenda || 'അജണ്ടകളില്ല'}</pre>
              </div>

              <div className="report-section">
                <h3>തീരുമാനങ്ങൾ:</h3>
                <pre className="report-content">{reportData.report.minutes || 'തീരുമാനങ്ങളില്ല'}</pre>
              </div>

              <div className="report-section">
                <h3>QHLS Status:</h3>
                <pre className="report-content">{reportData.report.qhlsStatus || 'QHLS ഡാറ്റയില്ല'}</pre>
              </div>
            </div>

            <div className="report-preview-actions">
              <button onClick={handleCopyToWhatsApp} className="btn-secondary">
                📱 വാട്സാപ്പിലേക്ക് കോപ്പി (Copy to WhatsApp)
              </button>
              <button onClick={handleSaveAsPDF} className="btn-success">
                📄 PDF ആയി സേവ് (Save as PDF)
              </button>
              <button onClick={handleClosePreview} className="btn-secondary">
                അടയ്ക്കുക (Close)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingForm;

