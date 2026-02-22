import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getLocations } from '../api';
import { Calendar, Clock, Users, MapPin, Trophy, RotateCcw, CheckCircle } from 'lucide-react';
import { useTelegram } from '../hooks/useTelegram';

const CreateEvent: React.FC = () => {
  const { user, showAlert, showMainButton, hideMainButton } = useTelegram();
  const navigate = useNavigate();
  const [locations, setLocations] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    max_participants: 10,
    format_teams: 2,
    format_players_per_team: 5,
    game_end_condition: '7 minutes',
    rotation_rule: 'on loss',
    location_id: '',
    creator_id: 1, // Временно хардкодим, пока нет Telegram API
  });

  useEffect(() => {
    getLocations().then((res) => setLocations(res.data));
    
    // ���������� ������ Telegram ��� ��������
    showMainButton('�������', () => {
      const form = document.querySelector('form');
      if (form) {
        form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      }
    });
    
    return () => {
      hideMainButton();
    };
    getLocations().then((res) => setLocations(res.data));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/events/', {
        ...formData,
        date: new Date(formData.date).toISOString(),
        location_id: parseInt(formData.location_id),
      });
      showAlert('����������� ������� �������!');
      navigate('/');
    } catch (err) {
      console.error(err);
      alert('Ошибка при создании мероприятия');
    }
  };

  return (
    <div className="p-4 pb-24">
      <h1 className="text-2xl font-bold mb-6">Создать мероприятие</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Основная информация */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4">
          <div className="flex items-center gap-3">
            <Calendar className="text-blue-500" size={20} />
            <input
              type="date"
              required
              className="w-full border-none focus:ring-0 text-gray-700"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-3 border-t pt-4">
            <Clock className="text-blue-500" size={20} />
            <input
              type="time"
              required
              className="w-full border-none focus:ring-0 text-gray-700"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-3 border-t pt-4">
            <MapPin className="text-blue-500" size={20} />
            <select
              required
              className="w-full border-none focus:ring-0 text-gray-700 bg-transparent"
              value={formData.location_id}
              onChange={(e) => setFormData({ ...formData, location_id: e.target.value })}
            >
              <option value="">Выберите локацию</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>{loc.address}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Формат игры */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4">
          <h3 className="font-semibold text-gray-500 text-sm uppercase">Формат игры</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-700">
              <Users size={18} />
              <span>Макс. участников</span>
            </div>
            <input
              type="number"
              className="w-16 text-right border-none focus:ring-0 font-bold text-blue-600"
              value={formData.max_participants}
              onChange={(e) => setFormData({ ...formData, max_participants: parseInt(e.target.value) })}
            />
          </div>
          <div className="flex items-center justify-between border-t pt-4">
            <div className="flex items-center gap-2 text-gray-700">
              <Trophy size={18} />
              <span>Количество команд</span>
            </div>
            <input
              type="number"
              className="w-16 text-right border-none focus:ring-0 font-bold text-blue-600"
              value={formData.format_teams}
              onChange={(e) => setFormData({ ...formData, format_teams: parseInt(e.target.value) })}
            />
          </div>
        </div>

        {/* Правила */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4">
          <h3 className="font-semibold text-gray-500 text-sm uppercase">Правила</h3>
          <div className="space-y-2">
            <label className="text-sm text-gray-600 flex items-center gap-2">
              <CheckCircle size={16} /> Условие окончания игры
            </label>
            <select
              className="w-full p-2 bg-gray-50 rounded-lg border-none focus:ring-2 focus:ring-blue-500"
              value={formData.game_end_condition}
              onChange={(e) => setFormData({ ...formData, game_end_condition: e.target.value })}
            >
              <option value="7 minutes">7 минут</option>
              <option value="2 goals">До 2-х голов</option>
              <option value="10 minutes">10 минут</option>
            </select>
          </div>
          <div className="space-y-2 border-t pt-4">
            <label className="text-sm text-gray-600 flex items-center gap-2">
              <RotateCcw size={16} /> Правило ротации
            </label>
            <select
              className="w-full p-2 bg-gray-50 rounded-lg border-none focus:ring-2 focus:ring-blue-500"
              value={formData.rotation_rule}
              onChange={(e) => setFormData({ ...formData, rotation_rule: e.target.value })}
            >
              <option value="on loss">При проигрыше</option>
              <option value="every 2 games">Каждые 2 игры</option>
              <option value="on draw">При ничье</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-200 active:scale-95 transition-transform"
        >
          Создать мероприятие
        </button>
      </form>
    </div>
  );
};

export default CreateEvent;
