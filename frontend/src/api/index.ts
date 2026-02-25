import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

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

export const createLocation = (location: { address: string; rate?: number; description?: string }) =>
  api.post('/locations/', location);

// Telegram Auth
export interface TelegramUser {
  telegram_id: number;
  first_name: string;
  last_name?: string;
  username?: string;
}

export interface TelegramUserResponse {
  id: number;
  telegram_id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  rate: number;
}

export const registerTelegramUser = (user: TelegramUser) => 
  api.post<TelegramUserResponse>('/auth/telegram', user);

export const getCurrentUser = (telegramId: number) => 
  api.get<TelegramUserResponse>(`/participants/me?telegram_id=${telegramId}`);