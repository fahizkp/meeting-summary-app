import React, { useState, useEffect } from 'react';
import { getZones, getAttendees, getAgendas, saveMeeting } from '../services/api';
import ZoneSelector from './ZoneSelector';
import AttendeeList from './AttendeeList';
import MeetingMinutes from './MeetingMinutes';
import AgendaSelector from './AgendaSelector';
import QHLSTable from './QHLSTable';

const MeetingForm = () => {
  const [zones, setZones] = useState([]);
  const [selectedZone, setSelectedZone] = useState('');
  const [selectedZoneName, setSelectedZoneName] = useState('');
  const [attendees, setAttendees] = useState([]);
  const [agendas, setAgendas] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [selectedAgendas, setSelectedAgendas] = useState([]);
  const [minutes, setMinutes] = useState(['']);
  const [attendance, setAttendance] = useState({});
  const [qhlsData, setQhlsData] = useState([{ unit: '', day: '', faculty: '', male: '', female: '' }]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

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
          setError('മേഖലകൾ ലഭിക്കുന്നതിൽ പിശക് (Error fetching zones)');
        }
      } catch (err) {
        setError('മേഖലകൾ ലഭിക്കുന്നതിൽ പിശക് (Error fetching zones): ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    const fetchAgendas = async () => {
      try {
        const response = await getAgendas();
        if (response.success) {
          setAgendas(response.agendas);
        }
      } catch (err) {
        console.error('Error fetching agendas:', err);
      }
    };

    fetchZones();
    fetchAgendas();
  }, []);

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
            // Initialize attendance state for all attendees
            const initialAttendance = {};
            response.attendees.forEach((attendee) => {
              const attendeeKey = `${attendee.name}_${attendee.role || ''}`;
              initialAttendance[attendeeKey] = {
                status: 'present',
                reason: '',
              };
            });
            setAttendance(initialAttendance);
            // Get zone name
            const zone = zones.find((z) => z.id === selectedZone);
            if (zone) {
              setSelectedZoneName(zone.name);
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
    }
  }, [selectedZone, zones]);

  const handleZoneChange = (zoneId) => {
    setSelectedZone(zoneId);
    setMinutes(['']); // Reset minutes when zone changes
    setSuccess(null);
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
    setSelectedAgendas([...selectedAgendas, agenda]);
  };

  const handleAgendaRemove = (index) => {
    setSelectedAgendas(selectedAgendas.filter((_, i) => i !== index));
  };

  const handleQHLSChange = (data) => {
    setQhlsData(data);
  };

  const handleQHLSAdd = () => {
    setQhlsData([...qhlsData, { unit: '', day: '', faculty: '', male: '', female: '' }]);
  };

  const handleQHLSRemove = (index) => {
    if (qhlsData.length > 1) {
      setQhlsData(qhlsData.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validation
    if (!selectedZone) {
      setError('ദയവായി ഒരു മേഖല തിരഞ്ഞെടുക്കുക (Please select a zone)');
      return;
    }

    if (!date) {
      setError('ദയവായി തീയതി നൽകുക (Please provide a date)');
      return;
    }

    const validMinutes = minutes.filter((m) => m.trim() !== '');
    if (validMinutes.length === 0) {
      setError('ദയവായി കുറഞ്ഞത് ഒരു മിനിറ്റ് ചേർക്കുക (Please add at least one minute)');
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
        setSuccess('മീറ്റിംഗ് സംഗ്രഹം വിജയകരമായി സേവ് ചെയ്തു! (Meeting summary saved successfully!)');
        // Reset form
        setSelectedZone('');
        setMinutes(['']);
        setDate(new Date().toISOString().split('T')[0]);
        setStartTime('');
        setEndTime('');
        setSelectedAgendas([]);
        setAttendance({});
        setQhlsData([{ unit: '', day: '', faculty: '', male: '', female: '' }]);
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
          <label htmlFor="startTime">ആരംഭ സമയം (Start Time):</label>
          <input
            type="time"
            id="startTime"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="endTime">അവസാന സമയം (End Time):</label>
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
          onQHLSAdd={handleQHLSAdd}
          onQHLSRemove={handleQHLSRemove}
        />

        <div className="submit-section">
          <button
            type="submit"
            className="submit-button btn-success"
            disabled={submitting || !selectedZone}
          >
            {submitting
              ? 'സേവ് ചെയ്യുന്നു... (Saving...)'
              : 'സേവ് ചെയ്യുക (Save Meeting Summary)'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MeetingForm;

