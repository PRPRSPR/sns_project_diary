import React, { useState } from 'react';
import { TextField, Button, Container, Snackbar, Alert, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import jwtDecode from 'jwt-decode';

const Login = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleLogin = () => {
        fetch("http://localhost:3005/user/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData)
        })
            .then(async res => {
                const data = await res.json();
                if (res.ok) {
                    localStorage.setItem("token", data.token); // 토큰 저장
                    const user = jwtDecode(data.token);         // 토큰에서 유저 정보 추출
                    console.log("로그인 유저:", user);

                    setOpenSnackbar(true);
                    setTimeout(() => navigate("/"), 1500); // 홈으로 이동
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
            />
            {error && <Typography color="error">{error}</Typography>}
            <Button variant="contained" fullWidth sx={{ mt: 2 }} onClick={handleLogin}>
                로그인
            </Button>

            <Snackbar
                open={openSnackbar}
                autoHideDuration={1200}
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