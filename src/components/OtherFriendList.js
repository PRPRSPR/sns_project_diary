import React, { useEffect, useState, useCallback } from 'react';
import {
    Box, Typography, List, ListItem, ListItemAvatar,
    ListItemText, Avatar, Button, CircularProgress, Snackbar, Alert
} from '@mui/material';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getToken, isTokenExpired, logout } from '../utils/auth';
import { jwtDecode } from 'jwt-decode';

const FriendOfFriendList = () => {
    const { email } = useParams();
    const navigate = useNavigate();
    const [friend, setFriend] = useState([]);
    const [status, setStatus] = useState([]);
    const [friendList, setFriendList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success');

    const fetchFriendList = useCallback(() => {
        if (isTokenExpired()) {
            logout();
            navigate('/');
            return;
        }
        fetch(`http://localhost:3005/friends/${email}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setFriendList(data.friends);
                    fetch(`http://localhost:3005/user/friends/${email}`)
                        .then(res=>res.json())
                        .then(data => {
                           if(data.success){
                            setFriend(data.user);
                           } 
                        })
                } else {
                    console.error('친구 목록 로딩 실패');
                }
            })
            .catch(err => console.error('에러 발생:', err))
            .finally(() => setLoading(false));
        fetch(`http://localhost:3005/friends/status/${email}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setStatus(data.status);
                }
            })
    }, [email, navigate]);

    useEffect(() => {
        fetchFriendList();
    }, [fetchFriendList]);

    const handleAccept = (friendEmail) => {
        const myEmail = jwtDecode(getToken()).email;

        fetch('http://localhost:3005/friends/accept', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userEmail: myEmail, friendEmail }),
        })
            .then((data) => {
                setSnackbarMessage(data.message);
                setSnackbarSeverity('success');
                setSnackbarOpen(true);
                setStatus(prev => ({ ...prev, [friendEmail]: 'friend' }));
            })
            .catch(err => console.error('수락 실패:', err));
    };

    const handleReject = (friendEmail) => {
        const myEmail = jwtDecode(getToken()).email;

        fetch('http://localhost:3005/friends/cancel', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userEmail: myEmail, friendEmail }),
        })
            .then((data) => {
                setSnackbarMessage(data.message);
                setSnackbarSeverity('success');
                setSnackbarOpen(true);
                setStatus(prev => ({ ...prev, [friendEmail]: null }));
            })
            .catch(err => console.error('거절 실패:', err));
    };

    const sendFriendRequest = (friendEmail) => {
        const myEmail = jwtDecode(getToken()).email;

        fetch('http://localhost:3005/friends/request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userEmail: myEmail, friendEmail }),
        })
            .then((data) => {
                setSnackbarMessage(data.message);
                setSnackbarSeverity('success');
                setSnackbarOpen(true);
                setStatus(prev => ({ ...prev, [friendEmail]: 'sent' }));
            })
            .catch(err => console.error('요청 실패:', err));
    };

    const cancelFriendRequest = (friendEmail) => {
        const myEmail = jwtDecode(getToken()).email;

        fetch('http://localhost:3005/friends/cancel', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userEmail: myEmail, friendEmail }),
        })
            .then((data) => {
                setSnackbarMessage(data.message);
                setSnackbarSeverity('success');
                setSnackbarOpen(true);
                setStatus(prev => ({ ...prev, [friendEmail]: null }));
            })
            .catch(err => console.error('요청 취소 실패:', err));
    };

    return (
        <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
            <Typography variant="h5" gutterBottom>
                {friend}의 친구 목록
            </Typography>

            {loading ? (
                <CircularProgress />
            ) : friendList.length === 0 ? (
                <Typography>친구가 없습니다.</Typography>
            ) : (
                <List>
                    {friendList.map(friend => {
                        const friendStatus = status[friend.email];
                        return (
                            <ListItem key={friend.email} divider>
                                <Link
                                    to={`/profile/${friend.email}`}
                                    style={{ display: 'flex', flexGrow: 1, textDecoration: 'none', color: 'inherit' }}
                                >
                                    <ListItemAvatar>
                                        <Avatar
                                            src={
                                                /^https?:\/\//.test(friend.profile_image)
                                                    ? friend.profile_image
                                                    : `http://localhost:3005/${friend.profile_image}`
                                            }
                                            sx={{ cursor: 'pointer' }}
                                        />
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={friend.nickname}
                                        secondary={friend.bio || '자기소개가 없습니다.'}
                                    />
                                </Link>
                                {friendStatus === 'friend' ? (
                                    <Button
                                        variant="outlined"
                                        color="primary"
                                        onClick={() => navigate(`/message/${friend.email}`)}
                                    >
                                        메세지 보내기
                                    </Button>
                                ) : friendStatus === 'sent' ? (
                                    <Button onClick={() => cancelFriendRequest(friend.email)}>요청 취소</Button>
                                ) : friendStatus === 'received' ? (
                                    <>
                                        <Button variant="contained" color="primary" sx={{ mr: 1 }} onClick={() => handleAccept(friend.email)}>수락</Button>
                                        <Button variant="outlined" color="error" onClick={() => handleReject(friend.email)}>거절</Button>
                                    </>
                                ) : (
                                    <Button variant="outlined" onClick={() => sendFriendRequest(friend.email)}>친구 요청</Button>
                                )}
                            </ListItem>
                        )
                    })}
                </List>
            )}
            <Snackbar open={snackbarOpen} autoHideDuration={3000} anchorOrigin={{ vertical: 'top', horizontal: 'center' }} onClose={() => setSnackbarOpen(false)}>
                <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: '100%' }}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default FriendOfFriendList;
