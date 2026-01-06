import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getZones, getAttendees, getAgendas, saveMeeting, getMeetingReport, updateMeeting } from '../services/api';
import { getAccessibleZones, hasAnyRole } from '../services/auth';
import { setZonesCache } from '../services/zoneHelper';
import ZoneSelector from './ZoneSelector';
import AttendeeList from './AttendeeList';
import MeetingMinutes from './MeetingMinutes';
import AgendaSelector from './AgendaSelector';
import QHLSTable from './QHLSTable';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
  const navigate = useNavigate();
  const location = useLocation();
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
  const [swagatham, setSwagatham] = useState(''); // Welcome
  const [adhyakshan, setAdhyakshan] = useState(''); // Chairperson
  const [nandhi, setNandhi] = useState(''); // Vote of Thanks
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
  const [isEditing, setIsEditing] = useState(false);
  const [editingMeetingId, setEditingMeetingId] = useState(null);
  const attendanceDraftRef = useRef(null);
  const qhlsDraftRef = useRef(null);
  const savedZoneRef = useRef(null);
  const selectedAgendasHydratedRef = useRef(false);
  const draftDataRef = useRef(null);
  const editDataRef = useRef(null);

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
          const allZones = response.zones;
          const accessibleZoneIds = getAccessibleZones();

          // Filter zones based on user access
          let filteredZones = allZones;
          if (accessibleZoneIds !== null) {
            // User has specific zone access (zone_admin)
            filteredZones = allZones.filter(zone => accessibleZoneIds.includes(zone.id));
          }
          // If accessibleZoneIds is null, user can see all zones (admin/district_admin)

          // Cache all zones for zone helper service
          setZonesCache(allZones);

          setZones(filteredZones);

          // Auto-select zone if user has access to only one zone
          if (filteredZones.length === 1 && !selectedZone) {
            const autoSelectedZone = filteredZones[0];
            console.log('Auto-selecting zone:', autoSelectedZone);
            setSelectedZone(autoSelectedZone.id);
            setSelectedZoneName(autoSelectedZone.name);
            setZoneUnits(autoSelectedZone.units || []);

            // Explicitly load attendees for auto-selected zone
            const loadAttendees = async () => {
              try {
                console.log('Loading attendees for zone:', autoSelectedZone.id);
                const response = await getAttendees(autoSelectedZone.id);
                console.log('Attendees response:', response);
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
                  setAttendance(initialAttendance);
                  console.log('Attendees loaded:', response.attendees.length, 'attendees');
                } else {
                  console.error('Failed to load attendees:', response.message);
                }
              } catch (err) {
                console.error('Error loading attendees for auto-selected zone:', err);
              }
            };
            loadAttendees();
          }

          // Show message if user has no zones
          if (filteredZones.length === 0 && hasAnyRole(['zone_admin'])) {
            setError('നിങ്ങൾക്ക് ഒരു മണ്ഡലത്തിലേക്കും പ്രവേശനമില്ല. അഡ്മിനുമായി ബന്ധപ്പെടുക.');
          }
        } else {
          setError('മണ്ഡലങ്ങൾ ലഭിക്കുന്നതിൽ പിശക്');
        }
      } catch (err) {
        setError('മണ്ഡലങ്ങൾ ലഭിക്കുന്നതിൽ പിശക്: ' + err.message);
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

  // Check if we have edit data passed via navigation state
  useEffect(() => {
    if (location.state?.editMeetingData) {
      try {
        sessionStorage.setItem('editMeetingData', JSON.stringify(location.state.editMeetingData));
        editDataRef.current = location.state.editMeetingData;
      } catch (err) {
        console.error('Failed to process edit meeting data from navigation state:', err);
      } finally {
        // Clear state so it doesn't reapply
        navigate(location.pathname, { replace: true, state: {} });
      }
    }
  }, [location, navigate]);

  // Check if we have edit data coming from MeetingReport (fallback via sessionStorage)
  useEffect(() => {
    const editDataString = sessionStorage.getItem('editMeetingData');
    if (editDataString) {
      try {
        const parsed = JSON.parse(editDataString);
        editDataRef.current = parsed;
      } catch (err) {
        console.error('Failed to parse edit meeting data:', err);
      } finally {
        sessionStorage.removeItem('editMeetingData');
      }
    }
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
        swagatham: draftSwagatham,
        adhyakshan: draftAdhyakshan,
        nandhi: draftNandhi,
      } = parsedDraft;

      if (draftZone) {
        setSelectedZone(draftZone);
        savedZoneRef.current = draftZone;
      }
      if (draftDate) setDate(draftDate);
      if (typeof draftStart === 'string') setStartTime(draftStart);
      if (typeof draftEnd === 'string') setEndTime(draftEnd);
      if (typeof draftSwagatham === 'string') setSwagatham(draftSwagatham);
      if (typeof draftAdhyakshan === 'string') setAdhyakshan(draftAdhyakshan);
      if (typeof draftNandhi === 'string') setNandhi(draftNandhi);
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
            setError('പങ്കെടുക്കുന്നവരെ ലഭിക്കുന്നതിൽ പിശക്');
          }
        } catch (err) {
          setError('പങ്കെടുക്കുന്നവരെ ലഭിക്കുന്നതിൽ പിശക്: ' + err.message);
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

  // Apply edit data once zones are loaded
  useEffect(() => {
    if (!editDataRef.current || zones.length === 0) {
      return;
    }

    const editData = editDataRef.current;
    editDataRef.current = null;

    clearDraftStorage();
    setIsEditing(true);
    setEditingMeetingId(editData.meetingId || null);

    const matchedZone = zones.find((zone) => zone.name === editData.zoneName);
    if (matchedZone) {
      savedZoneRef.current = matchedZone.id;
      setSelectedZone(matchedZone.id);
      setSelectedZoneName(matchedZone.name);
      setZoneUnits(matchedZone.units || []);
    } else {
      savedZoneRef.current = null;
      setSelectedZone('');
      setSelectedZoneName(editData.zoneName || '');
      setZoneUnits([]);
    }

    setDate(editData.date || getTodayDate());
    setStartTime(editData.startTime || '');
    setEndTime(editData.endTime || '');

    if (Array.isArray(editData.agendas)) {
      setSelectedAgendas(editData.agendas);
      selectedAgendasHydratedRef.current = true;
    }

    if (Array.isArray(editData.minutes) && editData.minutes.length) {
      setMinutes(editData.minutes);
    } else {
      setMinutes(['']);
    }

    if (Array.isArray(editData.attendance) && editData.attendance.length) {
      const attendanceMap = {};
      editData.attendance.forEach((item) => {
        const key = `${item.name}_${item.role || ''}`;
        attendanceMap[key] = {
          status: item.status || 'present',
          reason: item.reason || '',
        };
      });
      attendanceDraftRef.current = attendanceMap;
      if (!matchedZone) {
        setAttendance(attendanceMap);
      }
    }

    if (Array.isArray(editData.qhls) && editData.qhls.length) {
      qhlsDraftRef.current = editData.qhls;
      setQhlsData(editData.qhls);
    } else if (matchedZone) {
      qhlsDraftRef.current = buildQhlsRows(matchedZone.units || []);
      setQhlsData(buildQhlsRows(matchedZone.units || []));
    } else {
      qhlsDraftRef.current = null;
      setQhlsData(buildQhlsRows());
    }

    setSuccess(`മീറ്റിംഗ് എഡിറ്റ് ചെയ്യുന്നു: ${editData.meetingId || ''}`);
  }, [zones]);

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
    setSwagatham('');
    setAdhyakshan('');
    setNandhi('');
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

  const handleAddMinute = (initialValue = '') => {
    setMinutes([...minutes, initialValue]);
  };

  const handleRemoveMinute = (index) => {
    if (minutes.length > 1) {
      const newMinutes = minutes.filter((_, i) => i !== index);
      setMinutes(newMinutes);
    } else {
      setMinutes(['']);
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

  const handleAddExtraAttendee = (newAttendee) => {
    // Add to attendees list
    setAttendees([...attendees, newAttendee]);

    // Initialize attendance for the new attendee
    const attendeeKey = `${newAttendee.name}_${newAttendee.role || ''}`;
    setAttendance({
      ...attendance,
      [attendeeKey]: {
        status: 'present',
        reason: '',
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
    setQhlsData(data);
  };

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
      swagatham,
      adhyakshan,
      nandhi,
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

  const formatReportForWhatsApp = (report, meetingData) => {
    // Helper to convert 24h to 12h format
    const formatTime12h = (time24) => {
      if (!time24) return '';
      const [hours, minutes] = time24.split(':');
      let h = parseInt(hours, 10);
      const m = parseInt(minutes, 10);
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12;
      h = h ? h : 12;
      return `${h}:${m < 10 ? '0' + m : m} ${ampm}`;
    };

    let qhlsFormatted = report.qhlsStatus || 'QHLS ഡാറ്റയില്ല';

    // Format QHLS as a text table if data exists
    if (qhlsFormatted !== 'QHLS ഡാറ്റയില്ല' && qhlsFormatted.includes(',')) {
      const lines = qhlsFormatted.split('\n').filter(line => line.trim());
      if (lines.length > 0) {
        // Parse data
        const rows = lines.map(line => line.split(',').map(cell => cell.trim()));

        // Calculate column widths
        const colWidths = [0, 0, 0, 0, 0];
        rows.forEach(row => {
          row.forEach((cell, i) => {
            if (i < 5 && cell.length > colWidths[i]) {
              colWidths[i] = cell.length;
            }
          });
        });

        // Helper to pad cell
        const pad = (str, width) => (str || '').padEnd(width);

        // Build table
        const separator = ' | ';
        const header = rows[0];
        const dataRows = rows.slice(1);

        const headerLine = header.map((cell, i) => pad(cell, colWidths[i])).join(separator);
        const dividerLine = colWidths.map(w => '-'.repeat(w)).join('-|-');

        const bodyLines = dataRows.map(row =>
          row.map((cell, i) => pad(cell, colWidths[i])).join(separator)
        );

        qhlsFormatted = '```\n' + [headerLine, dividerLine, ...bodyLines].join('\n') + '\n```';
      }
    }

    // Only include QHLS if there's valid data
    const qhlsSection = qhlsFormatted && qhlsFormatted !== 'QHLS ഡാറ്റയില്ല' && qhlsFormatted.trim()
      ? [`*QHLS Status:*`, qhlsFormatted]
      : [];

    const lines = [
      `*മീറ്റിംഗ് റിപ്പോർട്ട്*`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `*മണ്ഡലം:* ${meetingData.zoneName}`,
      ``,
      `*തീയതി:* ${meetingData.date}`,
      meetingData.startTime ? `*തുടങ്ങിയ സമയം:* ${formatTime12h(meetingData.startTime)}` : '',
      meetingData.endTime ? `*അവസാനിച്ച സമയം:* ${formatTime12h(meetingData.endTime)}` : '',
      ``,
      meetingData.swagatham ? `*സ്വാഗതം:* ${meetingData.swagatham}` : '',
      meetingData.adhyakshan ? `*അധ്യക്ഷൻ:* ${meetingData.adhyakshan}` : '',
      meetingData.nandhi ? `*നന്ദി:* ${meetingData.nandhi}` : '',
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
      ...qhlsSection,
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

  const handleSaveAsPDF = async () => {
    if (!reportData) return;

    // Malayalam day names
    const malayalamDays = ['ഞായർ', 'തിങ്കൾ', 'ചൊവ്വ', 'ബുധൻ', 'വ്യാഴം', 'വെള്ളി', 'ശനി'];

    // Format date as DD/MM/YYYY DayName
    const formatDateWithDay = (dateString) => {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const dayName = malayalamDays[date.getDay()];
      return `${day}/${month}/${year} ${dayName}`;
    };

    // Format time to 12-hour format
    const formatTime12Hour = (timeString) => {
      if (!timeString) return '';
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minutes} ${ampm}`;
    };

    // Create a temporary container for PDF content with Malayalam font support
    const pdfContainer = document.createElement('div');
    pdfContainer.style.cssText = `
      position: absolute;
      left: -9999px;
      top: 0;
      width: 800px;
      padding: 20px 30px;
      background: white;
      font-family: 'Noto Sans Malayalam', 'Malayalam Sangam MN', 'Manjari', Arial, sans-serif;
      font-size: 15px;
      line-height: 1.5;
      color: #000;
    `;

    // Format attendees with serial numbers
    const formatWithSerialNumbers = (text) => {
      if (!text || text === 'ആരുമില്ല') return 'ആരുമില്ല';
      const lines = text.split('\n').filter(line => line.trim());
      return lines.map((line, index) => `${index + 1}. ${line}`).join('\n');
    };

    // Format QHLS as table
    const formatQhlsTable = (qhlsStatus) => {
      if (!qhlsStatus || qhlsStatus === 'QHLS ഡാറ്റയില്ല') {
        return '<p style="margin: 0; font-size: 14px;">QHLS ഡാറ്റയില്ല</p>';
      }

      const lines = qhlsStatus.split('\n').filter(line => line.trim());
      if (lines.length === 0) {
        return '<p style="margin: 0; font-size: 14px;">QHLS ഡാറ്റയില്ല</p>';
      }

      let tableHtml = `
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <thead>
            <tr style="background-color: #f5f5f5;">
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">യൂണിറ്റ്</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">ദിവസം</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">ഫാക്കൽറ്റി</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">പുരുഷൻ</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">സ്ത്രീ</th>
            </tr>
          </thead>
          <tbody>
      `;

      // Skip the header line (first line) and process data rows
      const dataLines = lines.slice(1);
      dataLines.forEach(line => {
        const cells = line.split(',').map(cell => cell.trim());
        if (cells.length >= 5) {
          tableHtml += `
            <tr>
              <td style="border: 1px solid #ddd; padding: 8px;">${cells[0]}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${cells[1]}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${cells[2]}</td>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${cells[3]}</td>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${cells[4]}</td>
            </tr>
          `;
        }
      });

      tableHtml += '</tbody></table>';
      return tableHtml;
    };

    const attendeesFormatted = formatWithSerialNumbers(reportData.report.attendees);
    const leaveFormatted = formatWithSerialNumbers(reportData.report.leaveAayavar);
    const formattedDate = formatDateWithDay(reportData.meetingData.date);
    const formattedStartTime = formatTime12Hour(reportData.meetingData.startTime);
    const formattedEndTime = formatTime12Hour(reportData.meetingData.endTime);

    // Build the HTML content with watermark
    pdfContainer.innerHTML = `
      <div style="position: relative;">
        <!-- Watermark -->
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); opacity: 0.08; z-index: 0; pointer-events: none;">
          <img src="/wisdom-youth-logo.png" alt="" style="width: 500px; height: auto;" crossorigin="anonymous" />
        </div>
        
        <!-- Content -->
        <div style="position: relative; z-index: 1;">
          <div style="text-align: center; margin-bottom: 10px;">
            <h1 style="font-size: 22px; margin: 0; font-weight: bold;">മീറ്റിംഗ് റിപ്പോർട്ട്</h1>
          </div>
          
          <div style="text-align: center; margin-bottom: 10px;">
            <h2 style="font-size: 18px; margin: 0; color: #2c3e50; font-weight: bold;">${reportData.meetingData.zoneName}</h2>
          </div>
          
          <div style="border-bottom: 2px solid #333; margin-bottom: 12px; padding-bottom: 10px;">
            <p style="margin: 3px 0;"><strong>തീയതി:</strong> ${formattedDate}</p>
            ${formattedStartTime ? `<p style="margin: 3px 0;"><strong>തുടങ്ങിയ സമയം:</strong> ${formattedStartTime}</p>` : ''}
            ${formattedEndTime ? `<p style="margin: 3px 0;"><strong>അവസാനിച്ച സമയം:</strong> ${formattedEndTime}</p>` : ''}
          </div>
          
          <div style="margin-bottom: 12px;">
            <h3 style="font-size: 15px; margin: 0 0 6px 0; color: #2c3e50; border-bottom: 1px solid #ddd; padding-bottom: 4px;">പങ്കെടുത്തവർ</h3>
            <pre style="white-space: pre-wrap; font-family: inherit; margin: 0; font-size: 14px;">${attendeesFormatted}</pre>
          </div>
          
          <div style="margin-bottom: 12px;">
            <h3 style="font-size: 15px; margin: 0 0 6px 0; color: #c0392b; border-bottom: 1px solid #ddd; padding-bottom: 4px;">ലീവ് ആയവർ</h3>
            <pre style="white-space: pre-wrap; font-family: inherit; margin: 0; font-size: 14px;">${leaveFormatted}</pre>
          </div>
          
          <div style="margin-bottom: 12px;">
            <h3 style="font-size: 15px; margin: 0 0 6px 0; color: #2c3e50; border-bottom: 1px solid #ddd; padding-bottom: 4px;">അജണ്ടകൾ</h3>
            <pre style="white-space: pre-wrap; font-family: inherit; margin: 0; font-size: 14px;">${reportData.report.agenda || 'അജണ്ടകളില്ല'}</pre>
          </div>
          
          <div style="margin-bottom: 12px;">
            <h3 style="font-size: 15px; margin: 0 0 6px 0; color: #27ae60; border-bottom: 1px solid #ddd; padding-bottom: 4px;">തീരുമാനങ്ങൾ</h3>
            <pre style="white-space: pre-wrap; font-family: inherit; margin: 0; font-size: 14px;">${reportData.report.minutes || 'തീരുമാനങ്ങളില്ല'}</pre>
          <div style="margin-bottom: 12px;">
            <h3 style="font-size: 15px; margin: 0 0 6px 0; color: #8e44ad; border-bottom: 1px solid #ddd; padding-bottom: 4px;">QHLS</h3>
            ${formatQhlsTable(reportData.report.qhlsStatus)}
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(pdfContainer);

    try {
      // Use html2canvas to capture the content with proper font rendering
      const canvas = await html2canvas(pdfContainer, {
        scale: 2, // Higher quality
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      // Calculate dimensions to fit the page
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10;

      // Handle multi-page if content is too long
      const scaledHeight = imgHeight * ratio;

      if (scaledHeight <= pdfHeight - 20) {
        // Fits on one page
        pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, scaledHeight);
      } else {
        // Multi-page handling
        let remainingHeight = imgHeight;
        let position = 0;
        const pageHeightInPx = (pdfHeight - 20) / ratio;

        while (remainingHeight > 0) {
          // Create a temporary canvas for this page section
          const pageCanvas = document.createElement('canvas');
          pageCanvas.width = imgWidth;
          pageCanvas.height = Math.min(pageHeightInPx, remainingHeight);

          const ctx = pageCanvas.getContext('2d');
          ctx.drawImage(
            canvas,
            0, position,
            imgWidth, pageCanvas.height,
            0, 0,
            imgWidth, pageCanvas.height
          );

          const pageImgData = pageCanvas.toDataURL('image/png');

          if (position > 0) {
            pdf.addPage();
          }

          pdf.addImage(
            pageImgData,
            'PNG',
            imgX,
            imgY,
            imgWidth * ratio,
            pageCanvas.height * ratio
          );

          remainingHeight -= pageHeightInPx;
          position += pageHeightInPx;
        }
      }

      // Save PDF
      const fileName = `Meeting_Report_${reportData.meetingData.zoneName}_${reportData.meetingData.date}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('PDF ജനറേറ്റ് ചെയ്യുന്നതിൽ പിശക് (Error generating PDF)');
    } finally {
      // Clean up
      document.body.removeChild(pdfContainer);
    }
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
        swagatham, // Welcome
        adhyakshan, // Chairperson
        nandhi, // Vote of Thanks
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

      const isEditMode = isEditing && editingMeetingId;
      const response = isEditMode
        ? await updateMeeting(editingMeetingId, meetingData)
        : await saveMeeting(meetingData);

      if (response.success) {
        const meetingId = isEditMode
          ? editingMeetingId
          : response.data?.meetingId || 'N/A';
        setSavedMeetingId(meetingId);
        setSuccess(
          isEditMode
            ? 'മീറ്റിംഗ് വിജയകരമായി അപ്ഡേറ്റ് ചെയ്തു! (Meeting updated successfully!)'
            : 'മീറ്റിംഗ് സംഗ്രഹം വിജയകരമായി സേവ് ചെയ്തു! (Meeting summary saved successfully!)'
        );
        setIsEditing(false);
        setEditingMeetingId(null);

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
      <h1>മീറ്റിംഗ് റിപ്പോർട്ട്</h1>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <form onSubmit={handleSubmit}>
        <ZoneSelector
          zones={zones}
          selectedZone={selectedZone}
          onZoneChange={handleZoneChange}
          loading={loading}
          disabled={zones.length === 1}
        />

        <div className="form-group">
          <label htmlFor="date">തീയതി:</label>
          <input
            type="date"
            id="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="startTime">തുടങ്ങിയ സമയം:</label>
          <input
            type="time"
            id="startTime"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="endTime">അവസാനിച്ച സമയം:</label>
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
          onAddExtraAttendee={handleAddExtraAttendee}
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

        {/* Meeting Roles Section */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '20px' }}>
          <div className="form-group">
            <label htmlFor="swagatham">സ്വാഗതം:</label>
            <select
              id="swagatham"
              value={swagatham}
              onChange={(e) => setSwagatham(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '2px solid #e0e0e0',
                fontSize: '1rem',
              }}
            >
              <option value="">-- തിരഞ്ഞെടുക്കുക --</option>
              {attendees.map((attendee, index) => (
                <option key={index} value={attendee.name}>
                  {attendee.name} ({attendee.role})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="adhyakshan">അധ്യക്ഷൻ:</label>
            <select
              id="adhyakshan"
              value={adhyakshan}
              onChange={(e) => setAdhyakshan(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '2px solid #e0e0e0',
                fontSize: '1rem',
              }}
            >
              <option value="">-- തിരഞ്ഞെടുക്കുക --</option>
              {attendees.map((attendee, index) => (
                <option key={index} value={attendee.name}>
                  {attendee.name} ({attendee.role})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="nandhi">നന്ദി:</label>
            <select
              id="nandhi"
              value={nandhi}
              onChange={(e) => setNandhi(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '2px solid #e0e0e0',
                fontSize: '1rem',
              }}
            >
              <option value="">-- തിരഞ്ഞെടുക്കുക --</option>
              {attendees.map((attendee, index) => (
                <option key={index} value={attendee.name}>
                  {attendee.name} ({attendee.role})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="submit-section">
          <button
            type="submit"
            className="submit-button btn-success"
            disabled={submitting || !selectedZone}
          >
            {submitting
              ? (isEditing ? 'Updating...' : 'സേവ് ചെയ്യുന്നു...')
              : (isEditing ? 'Update' : 'സേവ് ചെയ്യുക')}
          </button>
        </div>
      </form>

      {/* Report Preview Modal */}
      {showReportPreview && reportData && (
        <div className="report-preview-modal">
          <div className="report-preview-content">
            <div className="report-preview-header">
              <h2>റിപ്പോർട്ട് പ്രിവ്യൂ</h2>
              <button onClick={handleClosePreview} className="close-button">×</button>
            </div>

            <div className="report-preview-body">
              <div className="report-section">
                <h3>മീറ്റിംഗ് റിപ്പോർട്ട്</h3>
                <p><strong>മണ്ഡലം:</strong> {reportData.meetingData.zoneName}</p>
                <p><strong>തീയതി:</strong> {reportData.meetingData.date}</p>
                {reportData.meetingData.startTime && (
                  <p><strong>തുടങ്ങിയ സമയം:</strong> {reportData.meetingData.startTime}</p>
                )}
                {reportData.meetingData.endTime && (
                  <p><strong>അവസാനിച്ച സമയം:</strong> {reportData.meetingData.endTime}</p>
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
                📱 വാട്സാപ്പിലേക്ക് കോപ്പി ചെയ്യുക
              </button>
              <button onClick={handleSaveAsPDF} className="btn-success">
                📄 PDF ആയി സേവ് ചെയ്യുക
              </button>
              <button onClick={handleClosePreview} className="btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingForm;

