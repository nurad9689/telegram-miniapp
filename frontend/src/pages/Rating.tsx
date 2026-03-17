import React, { useEffect, useState } from 'react';
import { getParticipants } from '../api';
import { Star } from 'lucide-react';

const POSITION_LABELS: Record<string, string> = {
  goalkeeper: 'Вратарь',
  defender: 'Защитник',
  midfielder: 'Полузащитник',
  forward: 'Нападающий',
  free_drawer: 'Свободный художник',
  no_position: 'Без позиции',
};

const Rating: React.FC = () => {
  const [players, setPlayers] = useState<any[]>([]);

  useEffect(() => {
    getParticipants().then((res) => {
      const sorted = res.data.sort((a: any, b: any) => b.rate - a.rate);
      setPlayers(sorted);
    }).catch(err => console.error(err));
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Рейтинг игроков</h1>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Игрок</th>
              <th className="px-4 py-3 text-right">Рейтинг</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {players.map((player, index) => (
              <tr key={player.id} className="active:bg-gray-50">
                <td className="px-4 py-4 font-medium text-gray-400">
                  {index + 1}
                </td>
                <td className="px-4 py-4">
                  <div className="font-semibold">{player.first_name} {player.last_name || ''}</div>
                  <div className="text-xs text-gray-500">{POSITION_LABELS[player.positions] || player.positions}</div>
                </td>
                <td className="px-4 py-4 text-right">
                  <div className="flex items-center justify-center gap-1 bg-yellow-100 px-2 py-1 rounded-full">
                    <Star size={14} fill="yellow" />
                    <span className="font-bold text-yellow-700">{player.rate || 0}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Rating;