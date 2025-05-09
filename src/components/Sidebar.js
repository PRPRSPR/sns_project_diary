import React, { useState } from 'react';
import { Drawer, List, ListItemButton, ListItemIcon, ListItemText, Toolbar, IconButton } from '@mui/material';
import { CalendarMonth, Group, AccountCircle, Settings, Logout, Menu } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import LogoutDialog from './LogoutDialog';

const Sidebar = () => {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [logoutOpen, setLogoutOpen] = useState(false);

    const menuItems = [
        { text: '내 일기', icon: <CalendarMonth />, path: '/home' },
        { text: '친구들 일기', icon: <Group />, path: '/explore' },
        { text: '마이페이지', icon: <AccountCircle />, path: '/profile' },
        { text: '설정', icon: <Settings />, path: '/settings' },
        { text: '로그아웃', icon: <Logout />, action: () => setLogoutOpen(true) },
    ];

    const toggleSidebar = () => {
        setOpen(!open);
    };

    return (
        <div>
            <IconButton
                sx={{ position: 'absolute', top: 16, left: 16, zIndex: 1300 }}
                onClick={toggleSidebar}
            >
                <Menu />
            </IconButton>

            <Drawer
                variant="persistent"
                open={open}
                sx={{
                    width: open ? 240 : 0,
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
                    transition: 'width 0.3s ease',
                    '& .MuiDrawer-paper': {
                        width: open ? 240 : 0,
                        overflowX: 'hidden',
                        transition: 'width 0.3s ease',
                        boxSizing: 'border-box',
                    },
                }}
            >
                <Toolbar />
                <List>
                    {menuItems.map((item) => (
                        <ListItemButton
                            key={item.text}
                            onClick={() => item.action ? item.action() : navigate(item.path)}
                            sx={{ cursor: 'pointer' }}
                        >
                            <ListItemIcon>{item.icon}</ListItemIcon>
                            <ListItemText primary={item.text} />
                        </ListItemButton>
                    ))}
                </List>
            </Drawer>
            <LogoutDialog open={logoutOpen} onClose={() => setLogoutOpen(false)} />
        </div>
    );
};

export default Sidebar;
