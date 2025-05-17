import React, { useState, useEffect, useCallback } from 'react';
import debounce from 'lodash.debounce';
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
    const [validationErrors, setValidationErrors] = useState({});

    const navigate = useNavigate();

    const validateForm = () => {
        const errors = {};

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = '유효한 이메일 주소를 입력하세요.';
        }

        if (formData.nickname.trim().length < 2) {
            errors.nickname = '닉네임은 최소 2자 이상이어야 합니다.';
        }

        if (formData.password.length < 8) {
            errors.password = '비밀번호는 최소 8자 이상이어야 합니다.';
        } else {
            if (!/[A-Za-z]/.test(formData.password)) {
                errors.password = '비밀번호에 영문자를 포함해야 합니다.';
            }
            if (!/\d/.test(formData.password)) {
                errors.password = '비밀번호에 숫자를 포함해야 합니다.';
            }
            if (!/[!@#$%^&*(),.?":{}|<>_\-]/.test(formData.password)) {
                errors.password = '비밀번호에 특수문자를 포함해야 합니다.';
            }
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const validateField = (name, value) => {
        let message = "";

        if (name === "email") {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                message = "유효한 이메일 주소를 입력하세요.";
            } else {
                debouncedCheckEmail(value);
            }
        }

        if (name === "nickname") {
            if (value.trim().length < 2) {
                message = "닉네임은 최소 2자 이상이어야 합니다.";
            }
        }

        if (name === "password") {
            if (value.length < 8) {
                message = "비밀번호는 최소 8자 이상이어야 합니다.";
            } else {
                if (!/[A-Za-z]/.test(value)) message = "영문자를 포함해야 합니다.";
                else if (!/\d/.test(value)) message = "숫자를 포함해야 합니다.";
                else if (!/[!@#$%^&*(),.?":{}|<>_\-]/.test(value)) message = "특수문자를 포함해야 합니다.";
            }
        }

        setValidationErrors((prev) => ({ ...prev, [name]: message }));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        validateField(name, value);
    };

    const handleClickSignup = () => {
        if (!validateForm()) return;

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

    const debouncedCheckEmail = useCallback(
        debounce((email) => {
            fetch(`http://localhost:3005/user/check-email/${email}`)
                .then((res) => res.json())
                .then((data) => {
                    if (!data.success) {
                        setValidationErrors((prev) => ({
                            ...prev,
                            email: "이미 사용 중인 이메일입니다.",
                        }));
                    } else {
                        setValidationErrors((prev) => ({
                            ...prev,
                            email: "",
                        }));
                    }
                })
                .catch((err) => {
                    console.error("이메일 중복 확인 실패:", err);
                });
        }, 400),
        []
    );

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
                    error={!!validationErrors.email}
                    helperText={validationErrors.email}
                />
                <TextField
                    label="닉네임"
                    name="nickname"
                    value={formData.nickname}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                    required
                    error={!!validationErrors.nickname}
                    helperText={validationErrors.nickname}
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
                    error={!!validationErrors.password}
                    helperText={validationErrors.password}
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