import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEvent } from '../api'; // Импортируем getEvent вместо getEventById
import { Calendar, Clock, Users, MapPin, Star } from 'lucide-react';

// Интерфейс для события (можно вынести в отдельный файл types.ts)
interface Event {
  id: number;
  date: string;
  time: string;
  status: string;
  max_participants: number;
  format_teams: number;
  format_players_per_team: number;
  game_end_condition: string;
  rotation_rule: string;
  location_id: number;
  creator_id: number;
  participants?: any[];
  location?: {
    address: string;
    description?: string;
  };
  creator?: {
    first_name: string;
    username?: string;
  };
}

const EventInfo: React.FC = () => {
  const { id } = useParams<string>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) {
        setError('ID мероприятия не указан');
        setLoading(false);
        return;
      }

      try {
        // Преобразуем строку в число для API
        const eventId = parseInt(id, 10);
        if (isNaN(eventId)) {
          setError('Некорректный ID мероприятия');
          setLoading(false);
          return;
        }

        const response = await getEvent(eventId);
        setEvent(response.data);
        setError(null);
      } catch (err) {
        console.error('Ошибка при загрузке мероприятия:', err);
        setError('Не удалось загрузить информацию о мероприятии');
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  const handleBack = () => {
    navigate(-1); // Возврат на предыдущую страницу
  };

  if (loading) {
    return (
      <div className="p-4">
        <button onClick={handleBack} className="mb-4 text-blue-600">
          ← Назад
        </button>
        <div className="text-center py-10">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="p-4">
        <button onClick={handleBack} className="mb-4 text-blue-600">
          ← Назад
        </button>
        <div className="text-center py-10 bg-red-50 rounded-lg">
          <p className="text-red-600">{error || 'Мероприятие не найдено'}</p>
          <button 
            onClick={() => navigate('/')}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg"
          >
            Вернуться к списку
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <button 
        onClick={handleBack}
        className="mb-4 text-blue-600 flex items-center gap-1"
      >
        ← Назад
      </button>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold mb-4">
          Мероприятие #{event.id}
        </h1>

        <div className="space-y-4">
          {/* Статус */}
          <div className="flex items-center gap-2">
            <span className="font-medium">Статус:</span>
            <span className={`px-3 py-1 rounded-full text-sm ${
              event.status === 'waiting' 
                ? 'bg-yellow-100 text-yellow-700' 
                : 'bg-green-100 text-green-700'
            }`}>
              {event.status === 'waiting' ? 'Ожидание' : 'Активно'}
            </span>
          </div>

          {/* Дата и время */}
          <div className="flex items-center gap-3 text-gray-600">
            <Calendar size={20} />
            <span>{new Date(event.date).toLocaleDateString('ru-RU', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</span>
          </div>

          <div className="flex items-center gap-3 text-gray-600">
            <Clock size={20} />
            <span>{event.time}</span>
          </div>

          {/* Участники */}
          <div className="flex items-center gap-3 text-gray-600">
            <Users size={20} />
            <span>
              {event.participants?.length || 0} / {event.max_participants} участников
            </span>
          </div>

          {/* Локация */}
          {event.location && (
            <div className="flex items-center gap-3 text-gray-600">
              <MapPin size={20} />
              <span>{event.location.address}</span>
            </div>
          )}

          {/* Детали игры */}
          <div className="mt-6 pt-4 border-t border-gray-100">
            <h2 className="font-semibold text-lg mb-3">Детали игры</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">Формат:</span>
                <p className="font-medium">{event.format_teams} команд</p>
              </div>
              <div>
                <span className="text-gray-500">Игроков в команде:</span>
                <p className="font-medium">{event.format_players_per_team}</p>
              </div>
              <div>
                <span className="text-gray-500">Условие окончания:</span>
                <p className="font-medium">{event.game_end_condition}</p>
              </div>
              <div>
                <span className="text-gray-500">Правила ротации:</span>
                <p className="font-medium">{event.rotation_rule}</p>
              </div>
            </div>
          </div>

          {/* Организатор */}
          {event.creator && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <h2 className="font-semibold text-lg mb-3">Организатор</h2>
              <p>{event.creator.first_name}</p>
              {event.creator.username && (
                <p className="text-sm text-gray-500">@{event.creator.username}</p>
              )}
            </div>
          )}

          {/* Список участников */}
          {event.participants && event.participants.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <h2 className="font-semibold text-lg mb-3">Участники</h2>
              <ul className="space-y-2">
                {event.participants.map((participant, index) => (
                  <li key={participant.id || index} className="flex justify-between items-center text-gray-600">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-800">
                          {participant.first_name || `Участник ${index + 1}`}
                        </p>
                        {participant.username && (
                          <p className="text-xs text-gray-500">@{participant.username}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 bg-yellow-100 px-2 py-1 rounded-full">
                        <Star size={14} fill="yellow" />
                        <span className="font-bold text-yellow-700">{participant.rate || 0}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventInfo;