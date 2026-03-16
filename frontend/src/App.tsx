import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Events from './pages/Events';
import Locations from './pages/Locations';
import Rating from './pages/Rating';
import CreateEvent from './pages/CreateEvent';
import CreateLocation from './pages/CreateLocation';
import EventInfo from './pages/EventInfo';
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
          <Route path="/create-location" element={<CreateLocation />} />
          <Route path="/events/:id" element={<EventInfo />} />
        </Routes>
        <Navbar />
      </div>
    </Router>
  );
}

export default App;