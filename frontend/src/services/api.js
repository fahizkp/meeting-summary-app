import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getZones = async () => {
  const response = await api.get('/api/zones');
  return response.data;
};

export const getAttendees = async (zoneId) => {
  const response = await api.get(`/api/attendees/${zoneId}`);
  return response.data;
};

export const getAgendas = async () => {
  const response = await api.get('/api/agendas');
  return response.data;
};

export const saveMeeting = async (meetingData) => {
  const response = await api.post('/api/meetings', meetingData);
  return response.data;
};

export const getMeetingReport = async (meetingId) => {
  const response = await api.get(`/api/meetings/${meetingId}/report`);
  return response.data;
};

