import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CreateLocation from '../CreateLocation';
import * as api from '../../api';
import { useTelegram } from '../../hooks/useTelegram';

jest.mock('../../api');
jest.mock('../../hooks/useTelegram');

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('CreateLocation Component', () => {
  const mockShowMainButton = jest.fn();
  const mockHideMainButton = jest.fn();
  const mockShowAlert = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useTelegram as jest.Mock).mockReturnValue({
      showMainButton: mockShowMainButton,
      hideMainButton: mockHideMainButton,
      showAlert: mockShowAlert,
    });
  });

  it('обновляет состояние при вводе адреса', () => {
    render(
      <MemoryRouter>
        <CreateLocation />
      </MemoryRouter>
    );
    const input = screen.getByPlaceholderText('Адрес локации');
    fireEvent.change(input, { target: { value: 'ул. Пушкина, 10' } });
    expect(input).toHaveValue('ул. Пушкина, 10');
  });

  it('вызывает createLocation при сабмите формы', async () => {
    (api.createLocation as jest.Mock).mockResolvedValue({});
    render(
      <MemoryRouter>
        <CreateLocation />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Адрес локации'), { target: { value: 'Test Address' } });
    fireEvent.change(screen.getByPlaceholderText('Рейтинг (0-5)'), { target: { value: '4.5' } });
    
    fireEvent.click(screen.getByRole('button', { name: /Создать локацию/i }));

    await waitFor(() => {
      expect(api.createLocation).toHaveBeenCalledWith({
        address: 'Test Address',
        rate: 4.5,
        description: ''
      });
    });
  });
});
