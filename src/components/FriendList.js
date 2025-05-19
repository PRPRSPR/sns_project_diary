import React, { useEffect, useState } from 'react';
import { Box, Avatar, Typography, Paper, Button, List, ListItem, ListItemAvatar, ListItemText, Divider, Snackbar, Alert } from '@mui/material';
import { getToken, isLoggedIn } from '../utils/auth';
import { jwtDecode } from 'jwt-decode';
import { useNavigate, Link } from 'react-router-dom';

const FriendList = () => {
  const navigate = useNavigate();
  const [friends, setFriends] = useState([]);
  const [recommend, setRecommend] = useState([]);
  const [requestStatus, setRequestStatus] = useState({});
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  // 친구 요청 및 취소
  const toggleFriendRequest = (friendEmail) => {
    const token = getToken();
    const email = jwtDecode(token).email;

    const alreadyRequested = requestStatus[friendEmail];

    fetch(`http://localhost:3005/friends/${alreadyRequested ? 'cancel' : 'request'}`, {
      method: `${alreadyRequested ? 'DELETE' : 'POST'}`,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userEmail: email, friendEmail: friendEmail }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setRequestStatus(prev => ({
            ...prev,
            [friendEmail]: !alreadyRequested
          }));
        }
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
    fetch(`http://localhost:3005/friends/${email}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setFriends(data.friends);
          if ((data.friends).length === 0) {
            // 친구 없을 경우 추천
            fetch(`http://localhost:3005/friends/recommend?limit=10&email=${email}`)
              .then(res => res.json())
              .then(data => {
                if (data.success) {
                  setRecommend(data.recommend);
                }
              })
              .catch(err => console.error('추천 유저 불러오기 실패:', err));
          } else {
            fetch(`http://localhost:3005/friends/recommend?limit=3&email=${email}`)
              .then(res => res.json())
              .then(data => {
                if (data.success) {
                  setRecommend(data.recommend);
                }
              })
              .catch(err => console.error('추천 유저 불러오기 실패:', err));
          }
        }
      })
      .catch(err => console.error('친구 목록 가져오기 실패:', err));

  }, [navigate]);

  // 친구 요청 수락
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
        }
      })
      .catch(err => {
        setSnackbarMessage('친구 요청 거절 실패');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      });
  };

  if (friends.length === 0) {
    return (
      <Box sx={{ maxWidth: 800, margin: 'auto', p: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mt={4}>
          <Typography variant="h5" gutterBottom>
            친구 목록
          </Typography>
          <Button
            variant="contained"
            color="secondary"
            onClick={() => navigate('/friends/requests')}
          >
            친구 요청 목록
          </Button>
        </Box>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            아직 하루를 공유하는 친구가 없으시군요!
          </Typography>
          <Typography variant="body1">
            친구와 함께 하루를 공유해보세요!
          </Typography>
        </Box>
        <List>
          {recommend.map(user => {
            const status = user.status;
            return (
              <ListItem key={user.email} divider>
                <Link
                  to={`/profile/${user.email}`}
                  style={{ display: 'flex', flexGrow: 1, textDecoration: 'none', color: 'inherit' }}
                >
                  <ListItemAvatar>
                    <Avatar src={/^https?:\/\//.test(user.profile_image)
                      ? user.profile_image
                      : `http://localhost:3005/${user.profile_image}`} />
                  </ListItemAvatar>
                  <ListItemText
                    primary={user.nickname}
                    secondary={
                      <>
                        {user.email}
                        <br />
                        {user.bio || '자기소개가 없습니다.'}
                      </>
                    }
                  />
                </Link>
                {status === 'friend' ? (
                  <Button
                    variant="outlined"
                    color="success"
                    onClick={() => navigate(`/message/${user.email}`)}
                  >
                    메세지 보내기
                  </Button>
                ) : status === 'sent' ? (
                  <Button disabled>요청 중</Button>
                ) : status === 'received' ? (
                  <>
                    <Button variant="contained" color="primary" sx={{ mr: 1 }} onClick={() => handleAccept(user.email)}>수락</Button>
                    <Button variant="outlined" color="error" onClick={() => handleReject(user.email)}>거절</Button>
                  </>
                ) : (
                  <Button
                    variant="outlined"
                    color={requestStatus[user.email] ? 'secondary' : 'primary'}
                    onClick={() => toggleFriendRequest(user.email)}
                  >
                    {requestStatus[user.email] ? '요청 취소' : '친구 요청'}
                  </Button>
                )}
              </ListItem>
            );
          })}
        </List>

        <Box mt={4} textAlign="center">
          <Button variant="contained" color="primary" onClick={() => navigate('/friends/search')}>
            친구 검색하기
          </Button>
        </Box>
        <Snackbar open={snackbarOpen} autoHideDuration={3000} anchorOrigin={{ vertical: 'top', horizontal: 'center' }} onClose={() => setSnackbarOpen(false)}>
          <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: '100%' }}>
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 4, maxWidth: 800, margin: 'auto' }}>
      <Box>
        <Typography variant="h6" mt={4}>친구 추천</Typography>
        <List>
          {(recommend || []).map((user) => {
            const status = user.status;
            return (
              <ListItem key={user.email}>
                <ListItemAvatar>
                  <Avatar src={/^https?:\/\//.test(user.profile_image) ? user.profile_image : `http://localhost:3005/${user.profile_image}`} />
                </ListItemAvatar>
                <ListItemText primary={user.nickname} secondary={
                  <>
                    <Typography
                      component="span"
                      variant="body2"
                      color="text.primary"
                    >
                      {user.email}
                    </Typography>
                    <br />
                    {user.bio || '자기소개가 없습니다.'}
                  </>
                }
                />
                {status === 'friend' ? (
                  <Button
                    variant="outlined"
                    color="success"
                    onClick={() => navigate(`/message/${user.email}`)}
                  >
                    메세지 보내기
                  </Button>
                ) : status === 'received' ? (
                  <>
                    <Button variant="contained" color="primary" sx={{ mr: 1 }} onClick={() => handleAccept(user.email)}>수락</Button>
                    <Button variant="outlined" color="error" onClick={() => handleReject(user.email)}>거절</Button>
                  </>
                ) : (
                  <Button
                    variant="outlined"
                    color={requestStatus[user.email] ? 'secondary' : 'primary'}
                    onClick={() => toggleFriendRequest(user.email)}
                  >
                    {requestStatus[user.email] ? '요청 취소' : '친구 요청'}
                  </Button>
                )}

              </ListItem>
            )
          })}
        </List>
      </Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mt={4}>
        <Typography variant="h5" gutterBottom>
          친구 목록
        </Typography>
        <Button
          sx={{mr:2}}
          variant="contained"
          color="info"
          onClick={() => navigate('/friendReq')}
        >
          친구 요청 확인
        </Button>
      </Box>
      <List>
        {friends.map((friend, index) => (
          <React.Fragment key={friend.email}>
            <ListItem>
              <ListItemAvatar>
                <Avatar src={/^https?:\/\//.test(friend.profile_image) ? friend.profile_image : `http://localhost:3005/${friend.profile_image}`} />
              </ListItemAvatar>
              <ListItemText primary={friend.nickname} secondary={friend.email} />
              <Button
                variant="outlined"
                color="success"
                onClick={() => navigate(`/message/${friend.email}`)}
              >
                메세지 보내기
              </Button>
            </ListItem>
            {index < friends.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </List>
      <Snackbar open={snackbarOpen} autoHideDuration={3000} anchorOrigin={{ vertical: 'top', horizontal: 'center' }} onClose={() => setSnackbarOpen(false)}>
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default FriendList;
