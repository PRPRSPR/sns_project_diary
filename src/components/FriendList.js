import React, { useEffect, useState } from 'react';
import { Box, Avatar, Typography, Paper, Button, List, ListItem, ListItemAvatar, ListItemText, Divider } from '@mui/material';
import { getToken, isLoggedIn } from '../utils/auth';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';

const FriendList = () => {
  const navigate = useNavigate();
  const [friends, setFriends] = useState([]);
  const [recommend, setRecommend] = useState([]);

  const sendFriendRequest = (friendEmail) => {
    const token = getToken();
    const email = jwtDecode(token).email;

    fetch('http://localhost:3005/friends/request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token,
      },
      body: JSON.stringify({ userEmail: email, friendEmail: friendEmail }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          alert('친구 요청을 보냈습니다!');
        } else {
          alert(data.message);
        }
      })
      .catch(err => console.error('친구 요청 보내기 실패:', err));
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
      console.log("email >> ",email);
    } catch (err) {
      console.error('토큰 디코드 실패:', err);
      navigate('/');
      return;
    }
    // 중단점
    fetch(`http://localhost:3005/friends/${email}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setFriends(data.friends);
          if ((data.friends).length === 0) {
            // 친구 없을 경우 추천
            fetch(`http://localhost:3005/friends/recommend?email=${email}&limit=10`)
              .then(res => res.json())
              .then(data => {
                if (data.success) {
                  console.log(data.recommend);
                  setRecommend(data.recommend);
                }
              })
              .catch(err => console.error('추천 유저 불러오기 실패:', err));
          } else {
            fetch(`http://localhost:3005/friends/recommend?email=${email}&limit=3`)
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

  // if (friends.length === 0) {
  //   return (
  //     <Box sx={{ p: 4 }}>
  //       <Box sx={{ textAlign: 'center', mb: 4 }}>
  //         <Typography variant="h5" gutterBottom>
  //           아직 하루를 공유하는 친구가 없으시군요!
  //         </Typography>
  //         <Typography variant="body1">
  //           친구와 함께 하루를 공유해보세요!
  //         </Typography>
  //       </Box>
  //       <List>
  //         {recommend.map(user => (
  //           <ListItem key={user.email} divider>
  //             <ListItemAvatar>
  //               <Avatar src={/^https?:\/\//.test(user.profile_image)
  //                 ? user.profile_image
  //                 : `http://localhost:3005/${user.profile_image}`} />
  //             </ListItemAvatar>
  //             <ListItemText
  //               primary={user.nickname}
  //               secondary={
  //                 <>
  //                   {user.email}
  //                   <br />
  //                   {user.bio || '자기소개가 없습니다.'}
  //                 </>
  //               }
  //             />
  //             <Button variant="outlined" onClick={() => sendFriendRequest(user.email)}>
  //               친구 요청
  //             </Button>
  //           </ListItem>
  //         ))}
  //       </List>

  //       <Box mt={4} textAlign="center">
  //         <Button variant="contained" color="primary" onClick={() => navigate('/friends/search')}>
  //           친구 검색하기
  //         </Button>
  //       </Box>
  //     </Box>
  //   );
  // }

  return (
    <Paper sx={{ p: 4, maxWidth: 600, margin: 'auto' }}>
      <Box>
        <Typography variant="h6" mt={4}>친구 추천</Typography>
        <List>
          {recommend.map((user) => (
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
              <Button
                variant="outlined"
                color="primary"
                onClick={() => sendFriendRequest(user.email)}
              >
                친구 요청 보내기
              </Button>
            </ListItem>
          ))}
        </List>
      </Box>
      <Typography variant="h5" gutterBottom>
        친구 목록
      </Typography>
      <List>
        {friends.map((friend, index) => (
          <React.Fragment key={friend.email}>
            <ListItem>
              <ListItemAvatar>
                <Avatar src={/^https?:\/\//.test(friend.profile_image) ? friend.profile_image : `http://localhost:3005/${friend.profile_image}`} />
              </ListItemAvatar>
              <ListItemText primary={friend.nickname} secondary={friend.email} />
            </ListItem>
            {index < friends.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </List>
    </Paper>
  );
};

export default FriendList;
