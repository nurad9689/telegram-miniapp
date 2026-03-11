import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_URL,
});

export const getEvents = () => api.get('/events/');
export const updateEvent = (eventId: number) => api.put(`/events/${eventId}`);
export const deleteEvent = (eventId: number) => api.delete(`/events/${eventId}`);

export const getLocations = () => api.get('/locations/');
export const updateLocation = (locationId: number) => api.put(`/locations/${locationId}`);
export const deleteLocation = (locationId: number) => api.delete(`/locations/${locationId}`);

export const getParticipants = () => api.get('/participants/');
export const joinEvent = (eventId: number, participantId: number) => 
  api.post(`/events/${eventId}/join/${participantId}`);
export const getEventBalance = (eventId: number) => 
  api.get(`/events/${eventId}/balance`);

export const createLocation = (location: { address: string; rate?: number; description?: string }) =>
  api.post('/locations/', location);

// Telegram Auth
export interface TelegramUserResponse {
  id: number;
  telegram_id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  rate: number;
}

export const authTelegramUser = (authData: Record<string, string>) => 
  api.post<TelegramUserResponse>('/auth/telegram', authData);
