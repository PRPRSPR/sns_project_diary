import { useState, useEffect } from 'react';
import { TextField, Button, Container, Typography, Snackbar, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { isLoggedIn } from '../utils/auth';

const ForgotPwd = () => {
    const [email, setEmail] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const navigate = useNavigate();

    const isValidEmail = (email) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    };

    const handleSubmit = () => {
        if (!isValidEmail(email)) {
            setErrorMessage('유효한 이메일 주소를 입력해주세요.');
            setOpenSnackbar(true);
            return;
        }

        fetch('http://localhost:3005/user/forgot-pwd', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setSuccessMessage(data.message || '비밀번호 재설정 메일이 발송되었습니다.');
                } else {
                    setErrorMessage(data.message || '이메일을 찾을 수 없습니다.');
                }
                setOpenSnackbar(true);
            })
            .catch((err) => {
                console.error(err);
                setErrorMessage('서버 오류가 발생했습니다.');
                setOpenSnackbar(true);
            });
    };

    useEffect(() => {
        if (isLoggedIn()) {
            navigate('/home');
            return;
        }
    }, [navigate]);

    return (
        <Container maxWidth="xs" sx={{ mt: 10 }}>
            <Typography variant="h5" gutterBottom>
                비밀번호 찾기
            </Typography>
            <Typography variant="body2" gutterBottom>
                가입한 이메일을 입력하면 비밀번호 재설정 링크를 보내드립니다.
            </Typography>
            <TextField
                label="이메일"
                fullWidth
                margin="normal"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
            <Button
                variant="contained"
                fullWidth
                sx={{ mt: 2 }}
                onClick={handleSubmit}
                disabled={!email}
            >
                비밀번호 재설정 요청
            </Button>

            <Snackbar
                open={openSnackbar}
                autoHideDuration={3000}
                onClose={() => setOpenSnackbar(false)}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setOpenSnackbar(false)}
                    severity={successMessage ? 'success' : 'error'}
                >
                    {successMessage || errorMessage}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default ForgotPwd;
