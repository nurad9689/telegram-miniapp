import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MapPin, Trophy, Calendar } from 'lucide-react';

const Navbar: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: <Calendar size={24} />, label: 'Мероприятия' },
    { path: '/locations', icon: <MapPin size={24} />, label: 'Локации' },
    { path: '/rating', icon: <Trophy size={24} />, label: 'Рейтинг' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-2 pb-4">
      {navItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={`flex flex-col items-center space-y-1 ${
            location.pathname === item.path ? 'text-blue-500' : 'text-gray-500'
          }`}
        >
          {item.icon}
          <span className="text-xs">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
};

export default Navbar;