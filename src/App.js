import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import 'react-calendar/dist/Calendar.css';
import Signup from './components/Signup';
import Login from './components/Login';
import Home from './components/Home';
import Create from './components/Create';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route path="/" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/create" element={<Create />} />
      </Routes>
    </Router>
  );
}

export default App;