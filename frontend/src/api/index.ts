import axios from 'axios';

const API_URL = 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_URL,
});

export const getEvents = () => api.get('/events/');
export const getLocations = () => api.get('/locations/');
export const getParticipants = () => api.get('/participants/');
export const joinEvent = (eventId: number, participantId: number) => 
  api.post(`/events/${eventId}/join/${participantId}`);
export const getEventBalance = (eventId: number) => 
  api.get(`/events/${eventId}/balance`);