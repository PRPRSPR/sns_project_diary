import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container, TextField, Button, Typography, Snackbar, Alert
} from '@mui/material';

const ResetPassword = () => {
    const { token } = useParams();
    const [newPassword, setNewPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [validation, setValidation] = useState({
        length: false,
        hasLetter: false,
        hasNumber: false,
        hasSpecialChar: false,
    });

    const navigate = useNavigate();

    const handlePasswordChange = (e) => {
        const value = e.target.value;
        setNewPassword(value);
        validatePassword(value);
    };

    const validatePassword = (password) => {
        const validations = {
            length: password.length >= 8,
            hasLetter: /[A-Za-z]/.test(password),
            hasNumber: /\d/.test(password),
            hasSpecialChar: /[@$!%*#?&^_-]/.test(password),
        };
        setValidation(validations);
    };

    const isValidPassword = Object.values(validation).every(v => v === true);

    const handleSubmit = () => {
        if (!isValidPassword) {
            setError('비밀번호 조건을 모두 만족해야 합니다.');
            return;
        }

        fetch(`http://localhost:3005/user/reset-pwd/${token}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ newPassword })
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setMessage(data.message);
                    setOpenSnackbar(true);
                    setTimeout(() => navigate('/'), 1000);
                } else {
                    setError(data.message || '비밀번호 재설정 실패');
                }
            })
            .catch(() => setError('서버 오류가 발생했습니다.'));
    };

    return (
        <Container maxWidth="xs" sx={{ mt: 10 }}>
            <Typography variant="h5" gutterBottom>비밀번호 재설정</Typography>
            <TextField
                label="새 비밀번호"
                type="password"
                fullWidth
                margin="normal"
                value={newPassword}
                onChange={handlePasswordChange}
            />

            <Typography variant="body2" sx={{ mt: 1 }}>비밀번호 조건:</Typography>
            <ul style={{ paddingLeft: '20px', marginTop: '4px' }}>
                <li style={{ color: validation.length ? 'green' : 'gray' }}>
                    {validation.length ? '✅' : '❌'} 8자 이상
                </li>
                <li style={{ color: validation.hasLetter ? 'green' : 'gray' }}>
                    {validation.hasLetter ? '✅' : '❌'} 영문자 포함
                </li>
                <li style={{ color: validation.hasNumber ? 'green' : 'gray' }}>
                    {validation.hasNumber ? '✅' : '❌'} 숫자 포함
                </li>
                <li style={{ color: validation.hasSpecialChar ? 'green' : 'gray' }}>
                    {validation.hasSpecialChar ? '✅' : '❌'} 특수문자 포함 (@$!%*#?&^_-)
                </li>
            </ul>
            {error && <Typography color="error">{error}</Typography>}
            <Button variant="contained" fullWidth sx={{ mt: 2 }} onClick={handleSubmit}>
                비밀번호 변경
            </Button>

            <Snackbar
                open={openSnackbar}
                autoHideDuration={1500}
                onClose={() => setOpenSnackbar(false)}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert severity="success" onClose={() => setOpenSnackbar(false)}>
                    {message}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default ResetPassword;
