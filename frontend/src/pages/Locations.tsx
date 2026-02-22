import React, { useEffect, useState } from 'react';
import { getLocations } from '../api';
import { MapPin, Star, Info } from 'lucide-react';

const Locations: React.FC = () => {
  const [locations, setLocations] = useState<any[]>([]);

  useEffect(() => {
    getLocations().then((res) => setLocations(res.data)).catch(err => console.error(err));
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Локации</h1>
      <div className="space-y-4">
        {locations.length === 0 ? (
          <div className="text-center py-10 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
            <MapPin className="mx-auto mb-2 text-gray-300" size={48} />
            <p>Локации пока не добавлены.</p>
          </div>
        ) : (
          locations.map((loc) => (
            <div key={loc.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <MapPin size={18} className="text-red-500" />
                  {loc.address}
                </h3>
                <div className="flex items-center gap-1 text-yellow-500 font-bold">
                  <Star size={16} fill="currentColor" />
                  {loc.rate.toFixed(1)}
                </div>
              </div>
              {loc.description && (
                <div className="mt-2 p-3 bg-blue-50 rounded-lg text-sm text-blue-700 flex gap-2">
                  <Info size={16} className="shrink-0 mt-0.5" />
                  <p>{loc.description}</p>
                </div>
              )}
              <button className="w-full mt-4 border border-blue-500 text-blue-500 py-2 rounded-lg font-medium active:bg-blue-50 transition-colors">
                Посмотреть на карте
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Locations;