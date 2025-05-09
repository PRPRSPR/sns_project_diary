import React, { useEffect, useState } from 'react';
import { Box, Avatar, Typography, Paper, List, ListItem, ListItemAvatar, ListItemText, Divider } from '@mui/material';
import { getToken, isLoggedIn } from '../utils/auth';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';

const FriendList = () => {
  const navigate = useNavigate();
  const [friends, setFriends] = useState([]);

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

    fetch(`http://localhost:3005/friends/${email}`, {
      headers: { Authorization: 'Bearer ' + token }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setFriends(data.friends);
        }
      })
      .catch(err => console.error('친구 목록 가져오기 실패:', err));
  }, [navigate]);

  return (
    <Paper sx={{ p: 4, maxWidth: 600, margin: 'auto' }}>
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
