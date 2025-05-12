import React, { useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Box, Toolbar } from '@mui/material';
import 'react-calendar/dist/Calendar.css';
import Signup from './components/Signup';
import Login from './components/Login';
import Logout from './components/Logout';
import Home from './components/Home';
import Create from './components/Create';
import Sidebar from './components/Sidebar';
import Profile from './components/Profile';
import OtherProfile from './components/OtherProfile';
import ProfileEdit from './components/ProfileEdit';
import Friends from './components/FriendList';
import Notify from './components/Notification';

function App() {
  const [open, setOpen] = useState(false);

  const location = useLocation();
  const hideSidebar = location.pathname === '/' || location.pathname === '/signup';

  return (
    <Box sx={{ display: 'flex' }}>
      {!hideSidebar && <Sidebar open={open} setOpen={setOpen} />}
      <Box component="main" sx={{ flexGrow: 1, p: 3, marginLeft: !hideSidebar && open ? 240 : 0, transition: 'margin-left 0.3s ease' }}>
        {!hideSidebar && <Toolbar />}
        <Routes>
          <Route path="/signup" element={<Signup />} />
          <Route path="/" element={<Login />} />
          <Route path="/home" element={<Home />} />
          <Route path="/create" element={<Create />} />
          <Route path="/logout" element={<Logout />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/:email" element={<OtherProfile />} />
          <Route path="/profile/edit" element={<ProfileEdit />} />
          <Route path="/friends" element={<Friends />} />
          <Route path="/notify" element={<Notify />} />
        </Routes>
      </Box>
    </Box>
  );
}

export default App;