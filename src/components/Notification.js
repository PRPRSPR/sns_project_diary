import { useState, useEffect } from 'react';
import { Box, Typography, List, ListItem, ListItemText } from '@mui/material';
import { getToken, isLoggedIn } from '../utils/auth';
import { jwtDecode } from 'jwt-decode';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

function Notification() {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);

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
            <Typography variant="h5" gutterBottom>알림</Typography>
            <List>
                {notifications.length === 0 ? (
                    <Typography>알림이 없습니다.</Typography>
                ) : (
                    notifications.map((note, idx) => (
                        <ListItem key={idx}>
                            <ListItemText primary={note.message} secondary={dayjs(note.created_at).format('YYYY-MM-DD HH:mm')} />
                        </ListItem>
                    ))
                )}
            </List>
        </Box>
    );
}

export default Notification;
