import React, { useState, useEffect } from 'react';
import { TextField, Button, Container, Typography, Box, Snackbar, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { isLoggedIn } from '../utils/auth';

const Signup = () => {
    const [formData, setFormData] = useState({
        email: '',
        nickname: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMsg, setSnackbarMsg] = useState('');

    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleClickSignup = () => {
        fetch("http://localhost:3005/user/signup", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(formData)
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setSnackbarMsg(data.message || "회원가입 성공!");
                    setOpenSnackbar(true);
                    setTimeout(() => navigate("/"), 1500);
                } else {
                    setError(data.message || "회원가입 실패");
                }
            })
            .catch(err => {
                console.error("signup error:", err);
                setError("서버 오류가 발생했습니다.");
            });
    };

    useEffect(() => {
        if (isLoggedIn()) {
            navigate('/home');
            return;
        }
    }, [navigate]);

    return (
        <Container maxWidth="sm">
            <Box mt={5}>
                <Typography variant="h4" gutterBottom>
                    회원가입
                </Typography>

                <TextField
                    label="이메일"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                    required
                />
                <TextField
                    label="닉네임"
                    name="nickname"
                    value={formData.nickname}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                    required
                />
                <TextField
                    label="비밀번호"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                    required
                />

                {error && (
                    <Typography color="error" variant="body2" mt={1}>
                        {error}
                    </Typography>
                )}

                <Button onClick={handleClickSignup} variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>
                    회원가입
                </Button>
            </Box>

            <Snackbar
                open={openSnackbar}
                autoHideDuration={1200}
                onClose={() => setOpenSnackbar(false)}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert severity="success" variant="filled" onClose={() => setOpenSnackbar(false)}>
                    {snackbarMsg}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default Signup;