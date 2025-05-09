import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Button,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

const LogoutDialog = ({ open, onClose }) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        onClose();
        navigate('/');
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>로그아웃</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    정말로 로그아웃 하시겠습니까?
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>취소</Button>
                <Button onClick={handleLogout} color="error" variant="contained">
                    로그아웃
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default LogoutDialog;
