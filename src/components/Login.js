import { useState, useEffect } from 'react';
import { TextField, Button, Container, Snackbar, Alert, Typography, Stack } from '@mui/material';
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
        fetch("http://localhost:3005/user/login", {
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
        <Container maxWidth="xs" sx={{ mt: 10 }}>
            <Typography variant="h5" gutterBottom>로그인</Typography>
            <TextField
                label="이메일"
                name="email"
                fullWidth
                margin="normal"
                value={formData.email}
                onChange={handleChange}
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
            />
            {error && <Typography color="error">{error}</Typography>}
            <Stack spacing={2} mt={2}>
                <Button variant="contained" fullWidth sx={{ mt: 2 }} onClick={handleLogin}>
                    로그인
                </Button>

                <Button variant="outlined" fullWidth onClick={() => navigate('/signup')}>
                    회원가입
                </Button>

                <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => window.location.href = 'http://localhost:3005/user/google'}
                >
                    Google 로그인
                </Button>
            </Stack>

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
        </Container>
    );
};

export default Login;