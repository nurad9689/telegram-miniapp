import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createLocation } from '../api';
import { MapPin, Star, Info } from 'lucide-react';
import { useTelegram } from '../hooks/useTelegram';

const CreateLocation: React.FC = () => {
  const { showAlert, showMainButton, hideMainButton } = useTelegram();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    address: '',
    rate: 0,
    description: '',
  });

  useEffect(() => {
    showMainButton('Создать', () => {
      const form = document.querySelector('form');
      if (form) {
        form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      }
    });
    
    return () => {
      hideMainButton();
    };
  }, [showMainButton, hideMainButton]);

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    try {
      await createLocation({
        address: formData.address,
        rate: formData.rate,
        description: formData.description || undefined,
      });
      showAlert('Локация успешно создана!');
      navigate('/locations');
    } catch (err) {
      console.error(err);
      alert('Ошибка при создании локации');
    }
  };

  return (
    <div className="p-4 pb-24">
      <h1 className="text-2xl font-bold mb-6">Создать локацию</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Основная информация */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4">
          <div className="flex items-center gap-3">
            <MapPin className="text-red-500" size={20} />
            <input
              type="text"
              required
              placeholder="Адрес локации"
              className="w-full border-none focus:ring-0 text-gray-700"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-3 border-t pt-4">
            <Star className="text-yellow-500" size={20} />
            <input
              type="number"
              step="0.1"
              min="0"
              max="5"
              placeholder="Рейтинг (0-5)"
              className="w-full border-none focus:ring-0 text-gray-700"
              value={formData.rate}
              onChange={(e) => setFormData({ ...formData, rate: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className="flex items-start gap-3 border-t pt-4">
            <Info className="text-blue-500 mt-1" size={20} />
            <textarea
              placeholder="Описание (необязательно)"
              className="w-full border-none focus:ring-0 text-gray-700 resize-none"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-200 active:scale-95 transition-transform"
        >
          Создать локацию
        </button>
      </form>
    </div>
  );
};

export default CreateLocation;