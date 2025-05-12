import { useEffect, useState } from 'react';
import { Box, Typography, Avatar, Paper, Tabs, Tab, Button, Snackbar, Alert } from '@mui/material';
import { getToken, isLoggedIn } from '../utils/auth';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';

const FriendRequests = () => {
    const navigate = useNavigate();
    const [tabIndex, setTabIndex] = useState(0);
    const [receivedRequests, setReceivedRequests] = useState([]);
    const [sentRequests, setSentRequests] = useState([]);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success');

    useEffect(() => {
        if (!isLoggedIn()) {
            navigate('/');
            return;
        }
        const token = getToken();
        const { email } = jwtDecode(token);

        fetch(`http://localhost:3005/friends/request/${email}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setReceivedRequests(data.received);
                    setSentRequests(data.sent);
                }
            });
    }, [navigate]);

    const handleAccept = (friendEmail) => {
        const token = getToken();
        const { email } = jwtDecode(token);

        fetch('http://localhost:3005/friends/accept', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userEmail: email, friendEmail })
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setSnackbarMessage(data.message);
                    setSnackbarSeverity('success');
                    setSnackbarOpen(true);
                    setReceivedRequests(receivedRequests.filter(user => user.email !== friendEmail));  // 받은 요청 목록에서 삭제
                }
            })
            .catch(err => {
                setSnackbarMessage('친구 요청 수락 실패');
                setSnackbarSeverity('error');
                setSnackbarOpen(true);
            });
    };

    // 친구 요청 거절
    const handleReject = (friendEmail) => {
        const token = getToken();
        const { email } = jwtDecode(token);

        fetch('http://localhost:3005/friends/cancel', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userEmail: email, friendEmail })
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setSnackbarMessage('친구 요청이 거절되었습니다.');
                    setSnackbarSeverity('success');
                    setSnackbarOpen(true);
                    setReceivedRequests(receivedRequests.filter(user => user.email !== friendEmail));  // 받은 요청 목록에서 삭제
                }
            })
            .catch(err => {
                setSnackbarMessage('친구 요청 거절 실패');
                setSnackbarSeverity('error');
                setSnackbarOpen(true);
            });
    };

    // 친구 요청 취소
    const handleCancel = (friendEmail) => {
        const token = getToken();
        const { email } = jwtDecode(token);

        fetch('http://localhost:3005/friends/cancel', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userEmail: email, friendEmail })
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setSnackbarMessage(data.message);
                    setSnackbarSeverity('success');
                    setSnackbarOpen(true);
                    setSentRequests(sentRequests.filter(user => user.email !== friendEmail));  // 보낸 요청 목록에서 삭제
                }
            })
            .catch(err => {
                setSnackbarMessage('친구 요청 취소 실패');
                setSnackbarSeverity('error');
                setSnackbarOpen(true);
            });
    };

    const renderRequestList = (list, isReceived = true) => (
        list.length === 0
            ? <Typography sx={{ mt: 4 }}>요청이 없습니다.</Typography>
            : list.map((req) => (
                <Paper key={req.email} sx={{ p: 2, mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar src={`http://localhost:3005/${req.profile_image}`} />
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography>{req.nickname}</Typography>
                        <Typography variant="body2" color="textSecondary">{req.email}</Typography>
                    </Box>
                    {isReceived ? (
                        <>
                            <Button variant="contained" color="primary" onClick={() => handleAccept(req.email)}>수락</Button>
                            <Button variant="outlined" color="error" onClick={() => handleReject(req.email)}>거절</Button>
                        </>
                    ) : (
                        <Button variant="outlined" color="error" onClick={() => handleCancel(req.email)}>요청 취소</Button>
                    )}
                </Paper>
            ))
    );

    return (
        <Box sx={{ maxWidth: 800, margin: 'auto', mt: 4 }}>
            <Typography variant="h5" sx={{ ml: 2 }} gutterBottom>친구 요청</Typography>

            <Tabs value={tabIndex} onChange={(_, newVal) => setTabIndex(newVal)}>
                <Tab label="받은 요청" sx={{ fontSize: 16 }} />
                <Tab label="보낸 요청" sx={{ fontSize: 16 }} />
            </Tabs>

            <Box sx={{ mt: 2 }}>
                {tabIndex === 0 && renderRequestList(receivedRequests, true)}
                {tabIndex === 1 && renderRequestList(sentRequests, false)}
            </Box>

            <Snackbar open={snackbarOpen} autoHideDuration={3000} anchorOrigin={{ vertical: 'top', horizontal: 'center' }} onClose={() => setSnackbarOpen(false)}>
                <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: '100%' }}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default FriendRequests;
