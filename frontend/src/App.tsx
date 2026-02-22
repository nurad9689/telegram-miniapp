import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Events from './pages/Events';
import Locations from './pages/Locations';
import Rating from './pages/Rating';
import CreateEvent from './pages/CreateEvent';
import './App.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 pb-20">
        <Routes>
          <Route path="/" element={<Events />} />
          <Route path="/locations" element={<Locations />} />
          <Route path="/rating" element={<Rating />} />
          <Route path="/create-event" element={<CreateEvent />} />
        </Routes>
        <Navbar />
      </div>
    </Router>
  );
}

export default App;
