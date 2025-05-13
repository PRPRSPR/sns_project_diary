import React, { useState } from 'react';
import { Drawer, List, Divider, ListItemButton, ListItemIcon, ListItemText, Toolbar, IconButton } from '@mui/material';
import { CalendarMonth, Group, Notifications, AccountCircle, Settings, Logout, MenuRounded, Telegram } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import LogoutDialog from './LogoutDialog';

const Sidebar = () => {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [logoutOpen, setLogoutOpen] = useState(false);

    const menuItems = [
        { text: '내 일기', icon: <CalendarMonth />, path: '/home' },
        { text: '친구들 일기', icon: <Group />, path: '/explore' },
        { text: '내 대화', icon: <Telegram />, path: '/messages' },
        { text: '마이페이지', icon: <AccountCircle />, path: '/profile' },
        { text: '알림', icon: <Notifications />, path: '/notify' },
        { text: '설정', icon: <Settings />, path: '/settings' },
        { text: '로그아웃', icon: <Logout />, action: () => setLogoutOpen(true) },
    ];

    const toggleSidebar = () => {
        setOpen(!open);
    };

    return (
        <div>
            <IconButton
                size="large"
                sx={{ position: 'fixed', top: 16, left: 16, zIndex: 1300 }}
                onClick={toggleSidebar}
            >
                <MenuRounded sx={{ fontSize: 35 }} />
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
                        paddingTop: 2,
                    },
                }}
            >
                <Toolbar />
                <List sx={{ paddingTop: 2 }}>
                    {menuItems.map((item, index) => (
                        <div key={item.text}>
                            <ListItemButton
                                onClick={() => item.action ? item.action() : navigate(item.path)}
                                sx={{
                                    cursor: 'pointer',
                                    paddingTop: 2,
                                    paddingBottom: 2,
                                    marginBottom: index === menuItems.length - 1 ? 0 : 1,
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 40 }}>
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText primary={item.text} />
                            </ListItemButton>

                            {index !== menuItems.length - 1 && (
                                <Divider sx={{ margin: '8px 0' }} />
                            )}
                        </div>
                    ))}
                </List>
            </Drawer>
            <LogoutDialog open={logoutOpen} onClose={() => setLogoutOpen(false)} />
        </div>
    );
};

export default Sidebar;
