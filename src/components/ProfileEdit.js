import { useState, useEffect } from 'react';
import { Box, TextField, Button, Avatar, Typography, Stack } from '@mui/material';
import { getToken, isLoggedIn } from '../utils/auth';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';

const ProfileEdit = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nickname: '',
    bio: '',
    profileImage: '',
    profileImageFile: null,
  });

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

    fetch(`http://localhost:3005/user/${email}`, {
      headers: {
        'Authorization': 'Bearer ' + token,
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          let user = data.user;
          setFormData({
            nickname: user.nickname || '',
            bio: user.bio || '',
            profileImage: user.profile_image || '',
            profileImageFile: null,
          });
        }
      })
      .catch(err => console.error(err));
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'bio' && value.length > 255) return;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({
        ...formData,
        profileImageFile: file,
        profileImage: URL.createObjectURL(file),
      });
    }
  };

  const handleSubmit = async () => {
    const data = new FormData();
    data.append('nickname', formData.nickname);
    data.append('bio', formData.bio);
    if (formData.profileImageFile) {
      data.append('profile_image', formData.profileImageFile);
    }

    const token = localStorage.getItem('token');
    const res = await fetch('http://localhost:3005/user/profile', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: data,
    });

    const result = await res.json();
    if (res.ok) {
      alert('프로필이 수정되었습니다.');
      window.location.reload();
    } else {
      alert(result.message || '수정 실패');
    }
  };

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', mt: 4 }}>
      <Typography variant="h6" gutterBottom>프로필 수정</Typography>
      <Stack spacing={2}>
        <Avatar src={formData.profileImage} sx={{ width: 80, height: 80 }} />
        <Button variant="outlined" component="label">
          프로필 이미지 변경
          <input type="file" hidden accept="image/*" onChange={handleImageChange} />
        </Button>
        <TextField
          label="닉네임"
          name="nickname"
          value={formData.nickname}
          onChange={handleChange}
          fullWidth
        />
        <TextField
          label="소개"
          name="bio"
          value={formData.bio}
          onChange={handleChange}
          helperText={`${formData.bio.length} / 255`}
          fullWidth
          multiline
          rows={3}
        />
        <Button variant="contained" onClick={handleSubmit}>저장</Button>
      </Stack>
    </Box>
  );
};

export default ProfileEdit;
