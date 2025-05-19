import { useState, useEffect } from 'react';
import { Box, Typography, List, ListItem, ListItemText, Button } from '@mui/material';
import { getToken, isLoggedIn } from '../utils/auth';
import { jwtDecode } from 'jwt-decode';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

function Notification() {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);

    const markAsRead = (notificationId) => {
        fetch('http://localhost:3005/notify/read', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ notificationId }),
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setNotifications(prev =>
                        prev.map(n =>
                            n.id === notificationId ? { ...n, is_read: true } : n
                        )
                    );
                }
            })
            .catch(err => {
                console.error('읽음 처리 실패:', err);
            });
    };

    const markAllAsRead = () => {
        const token = getToken();
        const email = jwtDecode(token).email;

        fetch('http://localhost:3005/notify/read-all', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userEmail: email }),
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setNotifications(prev =>
                        prev.map(n => ({ ...n, is_read: true }))
                    );
                }
            })
            .catch(err => {
                console.error('전체 읽음 처리 실패:', err);
            });
    };


    const deleteNotification = (notificationId) => {
        fetch(`http://localhost:3005/notify/${notificationId}`, {
            method: 'DELETE',
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setNotifications(prev =>
                        prev.filter(n => n.id !== notificationId)
                    );
                }
            })
            .catch(err => {
                console.error('알림 삭제 실패:', err);
            });
    };

    useEffect(() => {
        if (!isLoggedIn()) {
            navigate('/');
            return;
        }

        const token = getToken();
        let email = '';
        try {
            const decoded = jwtDecode(token);
            email = decoded.email;
        } catch (err) {
            console.error('토큰 디코드 실패:', err);
            navigate('/');
            return;
        }

        fetch(`http://localhost:3005/notify/${email}`, {
            headers: {
                'Authorization': 'Bearer ' + token,
            }
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.success) {
                    setNotifications(data.notify);
                }
            })
            .catch((err) => console.error('알림 불러오기 실패:', err));
    }, [navigate]);

    return (
        <Box p={4}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mt={4}>
                <Typography variant="h5" gutterBottom>알림</Typography>
                <Button
                    variant="outlined"
                    onClick={markAllAsRead}
                    disabled={notifications.every(n => n.is_read)}
                    sx={{ mb: 2 }}
                >
                    전체 읽음 처리
                </Button>
            </Box>
            <List>
                {notifications.length === 0 ? (
                    <Typography>알림이 없습니다.</Typography>
                ) : (
                    notifications.map((note) => (
                        <ListItem
                            key={note.id}
                            sx={{
                                backgroundColor: note.is_read ? 'transparent' : '#b2c7ff',
                                mb: 1,
                                borderRadius: 1,
                                cursor: note.link ? 'pointer' : 'default'
                            }}
                            onClick={() => {
                                if (!note.is_read) {
                                    markAsRead(note.id);
                                }

                                // 링크가 있으면 이동
                                if (note.link) {
                                    navigate(note.link);
                                }
                            }}
                            secondaryAction={
                                <>
                                    {!note.is_read && (
                                        <Button size="small" onClick={(e) => {
                                            e.stopPropagation();
                                            markAsRead(note.id);
                                        }}>읽음 처리</Button>
                                    )}
                                    <Button size="small" color="error" onClick={(e) => {
                                        e.stopPropagation();
                                        deleteNotification(note.id);
                                    }}>삭제</Button>
                                </>
                            }
                        >
                            <ListItemText
                                primary={note.message}
                                secondary={dayjs(note.created_at).format('YYYY-MM-DD HH:mm')}
                            />
                        </ListItem>
                    ))
                )}
            </List>
        </Box>
    );
}

export default Notification;
