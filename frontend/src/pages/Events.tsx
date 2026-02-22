import React, { useEffect, useState } from 'react';
import { getEvents } from '../api';
import { Calendar, Clock, Users } from 'lucide-react';

const Events: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    getEvents().then((res) => setEvents(res.data)).catch(err => console.error(err));
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Мероприятия</h1>
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
              </div>
              <div className="space-y-2 text-sm text-gray-600">
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
              <button className="w-full mt-4 bg-blue-500 text-white py-2 rounded-lg font-medium active:scale-95 transition-transform">
                Присоединиться
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Events;