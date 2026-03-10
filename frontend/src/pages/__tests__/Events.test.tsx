import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Events from '../Events';
import * as api from '../../api';
import { useTelegram } from '../../hooks/useTelegram';

// Мокаем зависимости
jest.mock('../../api');
jest.mock('../../hooks/useTelegram');

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const mockEvents = [
  {
    id: 1,
    date: '2023-10-10',
    time: '18:00',
    max_participants: 10,
    participants: [],
    status: 'waiting',
  },
];

describe('Events Component', () => {
  const mockShowAlert = jest.fn();
  const mockCurrentUser = { id: 123, first_name: 'Test' };

  beforeEach(() => {
    jest.clearAllMocks();
    (useTelegram as jest.Mock).mockReturnValue({
      currentUser: mockCurrentUser,
      showAlert: mockShowAlert,
    });
    (api.getEvents as jest.Mock).mockResolvedValue({ data: mockEvents });
  });

  it('рендерит заголовок и кнопку создания', async () => {
    render(
      <MemoryRouter>
        <Events />
      </MemoryRouter>
    );
    expect(screen.getByText('Мероприятия')).toBeInTheDocument();
    expect(screen.getByText('Создать')).toBeInTheDocument();
  });

  it('отображает список событий после загрузки', async () => {
    render(
      <MemoryRouter>
        <Events />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByText('Игра 1')).toBeInTheDocument();
    });
  });

  it('переходит на страницу создания при клике на кнопку "Создать"', () => {
    render(
      <MemoryRouter>
        <Events />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText('Создать'));
    expect(mockNavigate).toHaveBeenCalledWith('/create-event');
  });

  it('вызывает joinEvent при клике на кнопку "Присоединиться"', async () => {
    (api.joinEvent as jest.Mock).mockResolvedValue({});
    render(
      <MemoryRouter>
        <Events />
      </MemoryRouter>
    );
    
    const joinBtn = await screen.findByText('Присоединиться');
    fireEvent.click(joinBtn);
    
    expect(api.joinEvent).toHaveBeenCalledWith(1, mockCurrentUser.id);
  });
});
