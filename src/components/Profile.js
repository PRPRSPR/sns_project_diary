import React, { useEffect, useState } from 'react';
import { Box, Avatar, Typography, Paper, Button } from '@mui/material';
import { jwtDecode } from 'jwt-decode';
import { getToken, isLoggedIn } from '../utils/auth';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState({ email: '', nickname: '', profile_image: '', bio: '' });
    const [diaries, setDiaries] = useState(0);
    const [friends, setFriends] = useState(0);

    const getProfileImageUrl = (path) => {
        if (!path) return '';
        const isFullUrl = /^https?:\/\//i.test(path);
        return isFullUrl ? path : `http://localhost:3005/${path}`;
    };

    useEffect(() => {
        if (!isLoggedIn()) {
            navigate('/');
            return;
        }
        const token = getToken();
        let email = '';
        if (token) {
            try {
                const decoded = jwtDecode(token);
                email = decoded.email;
            } catch (err) {
                console.error('토큰 디코드 실패:', err);
                navigate('/');
                return;
            }
        }

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
            .catch(err => console.error(err));

        fetch(`http://localhost:3005/diary/count/${email}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setDiaries(data.count);
                }
            })
            .catch(err => console.error('일기 수 가져오기 실패:', err));

        fetch(`http://localhost:3005/friends/count/${email}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setFriends(data.count);
                }
            })
            .catch(err => console.error('친구 수 가져오기 실패:', err));
    }, [navigate]);

    if (!user) return <Typography>로딩 중...</Typography>;

    return (
        <Paper sx={{ p: 4, maxWidth: 800, margin: 'auto' }}>
            <Box sx={{ display: 'flex', gap: 10 }}>
                {/* 좌측: 프로필 이미지 */}
                <Box sx={{ width: '40%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Avatar
                        src={getProfileImageUrl(user.profile_image)}
                        alt={user.nickname}
                        sx={{ width: 150, height: 150, m: 2 }}
                    >
                        {!user.profile_image && user.nickname?.charAt(0)}
                    </Avatar>
                </Box>

                {/* 우측: 나머지 정보 */}
                <Box sx={{ width: '70%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Typography variant="h6" sx={{ mt: 1}}>{user.nickname}</Typography>
                        <Typography variant="body2" color="textSecondary">{user.email}</Typography>

                        {/* 일기 수 + 친구 수 */}
                        <Box sx={{ mt: 2, display: 'flex', gap: 4 }}>
                            <Box
                                sx={{ cursor: 'pointer', '&:hover': { opacity: 0.7 } }}
                                onClick={() => navigate('/home')}
                            >
                                <Typography variant="body2">내 일기</Typography>
                                <Typography variant="h6">{diaries}</Typography>
                            </Box>

                            <Box
                                sx={{ cursor: 'pointer', '&:hover': { opacity: 0.7 } }}
                                onClick={() => navigate('/friends')}
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

                    {/* 우측 하단: 수정 버튼 */}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
                        <Button variant="outlined" onClick={() => navigate('/profile/edit')}>
                            프로필 수정
                        </Button>
                    </Box>
                </Box>
            </Box>
        </Paper>
    );
};

export default Profile;
