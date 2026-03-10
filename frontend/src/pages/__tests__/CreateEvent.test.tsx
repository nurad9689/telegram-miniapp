import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CreateEvent from '../CreateEvent';
import * as api from '../../api';
import { useTelegram } from '../../hooks/useTelegram';

jest.mock('../../api');
jest.mock('../../hooks/useTelegram');

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('CreateEvent Component', () => {
  const mockShowMainButton = jest.fn();
  const mockHideMainButton = jest.fn();
  const mockShowAlert = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useTelegram as jest.Mock).mockReturnValue({
      showMainButton: mockShowMainButton,
      hideMainButton: mockHideMainButton,
      showAlert: mockShowAlert,
      currentUser: { id: 1 },
    });
    (api.getLocations as jest.Mock).mockResolvedValue({ data: [{ id: 1, address: 'Stadium' }] });
  });

  it('рендерит форму создания события', async () => {
    render(
      <MemoryRouter>
        <CreateEvent />
      </MemoryRouter>
    );
    expect(screen.getByText('Создать мероприятие')).toBeInTheDocument();
  });

  it('вызывает showMainButton при монтировании', () => {
    render(
      <MemoryRouter>
        <CreateEvent />
      </MemoryRouter>
    );
    expect(mockShowMainButton).toHaveBeenCalledWith('Создать', expect.any(Function));
  });

  it('отправляет форму при заполнении данных', async () => {
    (api.api.post as jest.Mock).mockResolvedValue({});
    render(
      <MemoryRouter>
        <CreateEvent />
      </MemoryRouter>
    );

    // Заполняем обязательные поля
    const dateInput = screen.getByDisplayValue('');
    fireEvent.change(dateInput, { target: { value: '2023-12-31' } });
    
    const submitBtn = screen.getByRole('button', { name: /Создать мероприятие/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.api.post).toHaveBeenCalled();
    });
  });
});
