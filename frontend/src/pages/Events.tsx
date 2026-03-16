import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEvents, deleteEvent, joinEvent } from '../api';
import { Calendar, Clock, Users, Plus, Trash, MapPin } from 'lucide-react';
import { useTelegram } from '../hooks/useTelegram';

const Events: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, showAlert } = useTelegram();
  const [events, setEvents] = useState<any[]>([]);
  const [joining, setJoining] = useState<number | null>(null);

  useEffect(() => {
    getEvents()
      .then(res => setEvents(res.data))
      .catch(err => console.error(err));
  }, []);

  const handleJoin = async (eventId: number) => {
    if (!currentUser) {
      showAlert('Пожалуйста, подождите загрузки данных пользователя');
      return;
    }

    setJoining(eventId);
    try {
      await joinEvent(eventId, currentUser.id);
      showAlert('Вы успешно присоединились к мероприятию!');
      // Обновляем список мероприятий
      getEvents().then((res) => setEvents(res.data));
    } catch (err: any) {
      console.error(err);
      const errorMessage = err.response?.data?.detail || 'Ошибка при присоединении';
      showAlert(errorMessage);
    } finally {
      setJoining(null);
    }
  };

  const isJoined = (event: any) => {
    return event.participants?.some((p: any) => p.id === currentUser?.id);
  };

  const isFull = (event: any) => {
    return event.participants?.length >= event.max_participants;
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Мероприятия</h1>
        <button
          onClick={() => navigate('/create-event')}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium active:scale-95 transition-transform"
        >
          <Plus size={18} />
          Создать
        </button>
      </div>
      <div className="space-y-4">
        {events.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            Нет активных мероприятий.
          </div>
        ) : (
          events.map((event) => (
            <div key={event.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg">Игра {event.id}</h3>
                <span className={`px-2 py-1 rounded text-xs ${
                  event.status === 'waiting' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                }`}>
                  {event.status}
                </span>
                <button onClick={() => deleteEvent(event.id)} className="text-red-500 hover:text-red-700">
                  <Trash size={18}/>
                </button>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <MapPin size={16} />
                  <span>{event.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={16} />
                  <span>{new Date(event.date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={16} />
                  <span>{event.time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users size={16} />
                  <span>{event.participants?.length || 0} / {event.max_participants} участников</span>
                </div>
              </div>
              <button
                onClick={() => handleJoin(event.id)}
                disabled={isJoined(event) || isFull(event) || joining === event.id}
                className={`w-full mt-4 py-2 rounded-lg font-medium active:scale-95 transition-transform ${
                  isJoined(event)
                    ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                    : isFull(event)
                    ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                    : 'bg-blue-500 text-white'
                }`}
              >
                {joining === event.id
                  ? 'Присоединение...'
                  : isJoined(event)
                  ? 'Вы уже участвуете'
                  : isFull(event)
                  ? 'Мест нет'
                  : 'Присоединиться'}
              </button>
              <button 
                onClick={() => navigate(`/events/${event.id}`)}
                className="mt-2 w-full py-2 rounded-lg font-medium active:scale-95 transition-transform bg-gray-200 text-gray-700"
              >
                Подробнее
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Events;