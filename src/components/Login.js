import { useState, useEffect } from 'react';
import { TextField, Button, Box, Snackbar, Alert, Typography, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { isLoggedIn } from '../utils/auth';

const Login = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    useEffect(() => {
        if (isLoggedIn()) {
            navigate('/home');
            return;
        }
    }, [navigate]);

    const handleLogin = () => {
        fetch(`${process.env.REACT_APP_API_BASE_URL}/user/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData)
        })
            .then(async res => {
                const data = await res.json();
                if (res.ok) {
                    localStorage.setItem("token", data.token);
                    const user = jwtDecode(data.token);
                    console.log("로그인 유저:", user);

                    setOpenSnackbar(true);
                    setTimeout(() => navigate("/home"), 1000);
                } else {
                    setError(data.message || "로그인 실패");
                }
            })
            .catch(err => {
                console.error(err);
                setError("서버 오류가 발생했습니다.");
            });
    };

    return (
        <Box
            display="flex"
            height="100vh"
            justifyContent="center"
            alignItems="center"
        >
            {/* 왼쪽 꾸밈 영역 */}
            <Box
                flex={1}
                sx={{
                    width: '50%',
                    minWidth: 400,
                    maxWidth: '600px',
                    minHeight: 500,
                    border: '1px dashed #666',
                    borderRadius: '12px',
                    margin: 2,
                    padding: 4,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: 'rgb(247, 252, 255)',
                    boxShadow: '0 0 10px rgba(0,0,0,0.05)',
                }}
            >
                <Typography variant="h3" gutterBottom fontWeight="bold">
                    오늘의 하루
                </Typography>
                <Typography variant="h6" textAlign="center" maxWidth="80%">
                    매일의 소중한 기억을 기록하고 친구들과 공유하세요.
                </Typography>
                <img
                    src={`${process.env.REACT_APP_S3_BASE_URL}/uploads/diaryFront.jpg`}
                    alt="Login Illustration"
                    style={{ width: '60%', marginTop: 50, borderRadius: 12 }}
                />
            </Box>

            {/* 오른쪽 로그인 폼 */}
            <Box
                flex={1}
                sx={{
                    width: '50%',
                    minWidth: 400,
                    maxWidth: '600px',
                    minHeight: 500,
                    border: '1px dashed #666',
                    borderRadius: '12px',
                    margin: 2,
                    padding: 4,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: 'rgb(247, 252, 255)',
                    boxShadow: '0 0 10px rgba(0,0,0,0.05)',
                }}
            >
                <Box sx={{ width: '80%', maxWidth: 400 }}>
                    <Typography variant="h5" gutterBottom fontWeight="bold">
                        로그인
                    </Typography>

                    <TextField
                        label="이메일"
                        name="email"
                        fullWidth
                        margin="normal"
                        value={formData.email}
                        onChange={handleChange}
                        InputProps={{
                            style: { backgroundColor: '#fff' },
                        }}
                    />
                    <TextField
                        label="비밀번호"
                        name="password"
                        type="password"
                        fullWidth
                        margin="normal"
                        value={formData.password}
                        onChange={handleChange}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleLogin();
                            }
                        }}
                        InputProps={{
                            style: { backgroundColor: '#fff' },
                        }}
                    />

                    {error && <Typography color="error">{error}</Typography>}

                    <Stack spacing={2} mt={2}>
                        <Button variant="contained" fullWidth onClick={handleLogin}>
                            로그인
                        </Button>

                        <Button variant="outlined" fullWidth onClick={() => navigate('/signup')} sx={{ backgroundColor: '#fff' }}>
                            회원가입
                        </Button>

                        <Button
                            variant="outlined"
                            fullWidth
                            sx={{ backgroundColor: '#fff' }}
                            onClick={() => window.location.href = `${process.env.REACT_APP_API_BASE_URL}/user/google`}
                        >
                            Google 로그인
                        </Button>

                        <Button
                            variant="text"
                            fullWidth
                            onClick={() => navigate('/forgot-pwd')}
                        >
                            비밀번호를 잊으셨나요?
                        </Button>
                    </Stack>
                </Box>
            </Box>

            <Snackbar
                open={openSnackbar}
                autoHideDuration={1000}
                onClose={() => setOpenSnackbar(false)}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert severity="success" onClose={() => setOpenSnackbar(false)}>
                    로그인 성공!
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default Login;