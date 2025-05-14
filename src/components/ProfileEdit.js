import { useState, useEffect } from 'react';
import { Box, TextField, Button, Avatar, Typography, Stack, Paper, Snackbar, Alert } from '@mui/material';
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
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

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
    if (name === 'nickname') {
      const charCount = [...value].length;
      if (charCount > 8) return;
    }
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

    const token = getToken();
    let email = jwtDecode(token).email;

    fetch(`http://localhost:3005/user/${email}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: data,
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSnackbarMessage('프로필이 성공적으로 수정되었습니다.');
          setSnackbarSeverity('success');
          setSnackbarOpen(true);
          setTimeout(() => navigate('/profile'), 1000);
        } else {
          setSnackbarMessage(data.message || '수정에 실패했습니다.');
          setSnackbarSeverity('error');
          setSnackbarOpen(true);
        }
      })
      .catch(err => {
        console.error('수정 중 오류:', err);
        setSnackbarMessage('서버 오류가 발생했습니다.');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      })

  };

  return (
    <Paper sx={{ p: 4, maxWidth: 800, margin: 'auto' }}>
      <Typography variant="h6" gutterBottom>프로필 수정</Typography>

      <Box sx={{ display: 'flex', gap: 10, mt: 2 }}>
        {/* 좌측: 프로필 이미지 및 변경 */}
        <Box sx={{ width: '40%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Avatar
            src={formData.profileImage}
            sx={{ width: 150, height: 150, m: 2 }}
          />
          <Button variant="outlined" component="label">
            프로필 이미지 변경
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={handleImageChange}
            />
          </Button>
        </Box>

        {/* 우측: 닉네임, 소개, 저장 */}
        <Box sx={{ width: '70%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <Stack spacing={2}>
            <TextField
              label="닉네임"
              name="nickname"
              value={formData.nickname}
              onChange={handleChange}
              fullWidth
              helperText="최대 8자까지 입력 가능합니다."
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
            <Box display="flex" justifyContent="flex-end">
              <Button variant="contained" onClick={handleSubmit}>
                저장
              </Button>
            </Box>
          </Stack>
        </Box>
      </Box>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
          elevation={6}
          variant="filled"
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default ProfileEdit;
