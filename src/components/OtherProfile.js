import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Avatar, Typography, Paper, Button, Snackbar, Alert } from '@mui/material';
import CencelConfirm from './CencelConfirm';
import { getToken, isLoggedIn } from '../utils/auth';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';

const OtherProfile = () => {
    const navigate = useNavigate();
    const { email } = useParams();
    const [myEmail, setMyEmail] = useState();
    const [user, setUser] = useState(null);
    const [diaries, setDiaries] = useState(0);
    const [friends, setFriends] = useState(0);
    const [status, setStatus] = useState('loading');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'info',
    });

    const getProfileImageUrl = (path) => {
        if (!path) return '';
        const isFullUrl = /^https?:\/\//i.test(path);
        return isFullUrl ? path : `http://localhost:3005/${path}`;
    };

    const sendRequest = () => {
        fetch('http://localhost:3005/friends/request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userEmail: myEmail, friendEmail: email }),
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setStatus('pending');
                    setSnackbar({
                        open: true,
                        message: '친구 요청을 보냈습니다.',
                        severity: 'success',
                    });
                } else {
                    setSnackbar({
                        open: true,
                        message: '친구 요청 실패: ' + data.message,
                        severity: 'error',
                    });
                }
            })
            .catch(err => {
                console.error('친구 요청 실패:', err);
                setSnackbar({
                    open: true,
                    message: '에러가 발생했습니다.',
                    severity: 'error',
                });
            });
    };

    const deleteFriend = () => {
        fetch('http://localhost:3005/friends/delete', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userEmail: myEmail, friendEmail: user.email }),
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setStatus('rejected');
                    setSnackbar({
                        open: true,
                        message: '친구를 삭제했습니다.',
                        severity: 'success',
                    });
                } else {
                    setSnackbar({
                        open: true,
                        message: '친구 삭제 실패: ' + data.message,
                        severity: 'error',
                    });
                }
            })
            .catch(err => {
                console.error('친구 삭제 실패:', err);
                setSnackbar({
                    open: true,
                    message: '에러가 발생했습니다.',
                    severity: 'error',
                });
            });
    };

    const CancelRequest = () => {
        fetch('http://localhost:3005/friends/cancel', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userEmail: myEmail,
                friendEmail: email,
            }),
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setStatus(null);
                    setSnackbar({
                        open: true,
                        message: '친구 요청이 취소되었습니다.',
                        severity: 'success',
                    });
                } else {
                    setSnackbar({
                        open: true,
                        message: '친구 요청 취소에 실패했습니다.',
                        severity: 'error',
                    });
                }
                setDialogOpen(false);
            })
            .catch(err => {
                console.error('친구 요청 취소 오류:', err);
                setSnackbar({
                    open: true,
                    message: '에러가 발생했습니다.',
                    severity: 'error',
                });
                setDialogOpen(false);
            });
    };

    const renderFriendButton = () => {
        if (status === 'loading') return null;
        if (status === 'rejected') return <Button variant="outlined" disabled>삭제된 친구</Button>;
        if (status === 'accepted') {
            return (
                <>
                    <Button
                        variant="contained"
                        color="secondary"
                        onClick={() => setDialogOpen(true)}
                    >
                        친구 삭제
                    </Button>

                    <CencelConfirm
                        open={dialogOpen}
                        onClose={() => setDialogOpen(false)}
                        onConfirm={deleteFriend}
                        title="친구 삭제"
                        content="친구를 삭제"
                    />
                </>
            );
        }
        if (status === 'pending') {
            return (
                <>
                    <Button
                        variant="outlined"
                        color="secondary"
                        onClick={() => setDialogOpen(true)}
                    >
                        친구 요청 중
                    </Button>

                    <CencelConfirm
                        open={dialogOpen}
                        onClose={() => setDialogOpen(false)}
                        onConfirm={CancelRequest}
                        title="친구 요청 취소"
                        content="친구 요청을 취소"
                    />
                </>
            )
        }
        return <Button variant="contained" color="primary" onClick={sendRequest}>친구 요청 보내기</Button>;
    };

    const fetchUserProfile = (email, token) => {
        fetch(`http://localhost:3005/user/${email}`, {
            headers: {
                'Authorization': 'Bearer ' + token,
            }
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setUser(data.user);
                }
            })
            .catch(err => console.error('사용자 프로필 불러오기 실패:', err));
    };

    const fetchDiaryCount = (email) => {
        fetch(`http://localhost:3005/diary/count/${email}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setDiaries(data.count);
                }
            })
            .catch(err => console.error('일기 수 가져오기 실패:', err));
    };

    const fetchFriendCount = (email) => {
        fetch(`http://localhost:3005/friends/count/${email}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setFriends(data.count);
                }
            })
            .catch(err => console.error('친구 수 가져오기 실패:', err));
    };

    const fetchFriendStatus = (myEmail, targetEmail) => {
        fetch(`http://localhost:3005/friends/status?user=${myEmail}&target=${targetEmail}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setStatus(data.status);
                }
            })
            .catch(err => console.error('친구 상태 가져오기 실패:', err));
    };

    useEffect(() => {
        if (!isLoggedIn()) {
            navigate('/');
            return;
        }
        const token = getToken();
        if (token) {
            try {
                const decoded = jwtDecode(token);
                setMyEmail(decoded.email);
            } catch (err) {
                console.error('토큰 디코드 실패:', err);
                navigate('/');
                return;
            }
        }

        if (myEmail) {
            fetchUserProfile(email, token);
            fetchDiaryCount(email);
            fetchFriendCount(email);
            fetchFriendStatus(myEmail, email);
        }
    }, [email, myEmail, navigate]);

    if (!user) return <div>로딩 중...</div>;

    return (
        <Paper sx={{ p: 4, maxWidth: 800, margin: 'auto' }}>
            <Typography variant="h4" sx={{ mb: 3, ml: 5, fontSize: 33 }}>
                {user.nickname} 님의 프로필
            </Typography>
            <Box sx={{ display: 'flex', gap: 10 }}>
                {/* 좌측: 프로필 이미지 */}
                <Box sx={{ width: '45%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Avatar
                        src={getProfileImageUrl(user.profile_image)}
                        alt={user.nickname}
                        sx={{ width: 150, height: 150, margin: 2 }}
                    >
                        {!user.profile_image && user.nickname?.charAt(0)}
                    </Avatar>
                </Box>

                {/* 우측: 나머지 정보 */}
                <Box sx={{ width: '65%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                            <Typography variant="h6">{user.nickname}</Typography>
                            <Typography variant="body2" color="textSecondary">{user.email}</Typography>
                        </Box>

                        {/* 일기 수 + 친구 수 */}
                        <Box sx={{ mt: 2, display: 'flex', gap: 4 }}>
                            <Box
                                sx={{ cursor: 'pointer', '&:hover': { opacity: 0.7 } }}
                            // onClick={() => navigate('/home')}
                            >
                                <Typography variant="body2">일기</Typography>
                                <Typography variant="h6">{diaries}</Typography>
                            </Box>

                            <Box
                                sx={{ cursor: 'pointer', '&:hover': { opacity: 0.7 } }}
                                onClick={() => navigate(`/friends/${email}`)}
                            >
                                <Typography variant="body2">친구 목록</Typography>
                                <Typography variant="h6">{friends}</Typography>
                            </Box>
                        </Box>

                        {/* 자기소개 */}
                        <Typography variant="body1" sx={{ mt: 3 }}>
                            {user.bio || '자기소개가 없습니다.'}
                        </Typography>
                    </Box>
                </Box>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                {renderFriendButton()}
            </Box>
            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    severity={snackbar.severity}
                    variant="filled"
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Paper>
    );
};

export default OtherProfile;
