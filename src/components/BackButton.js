// components/BackButton.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import { IconButton, Tooltip } from '@mui/material';

const BackButton = ({ sidebarOpen, hideSidebar }) => {
    const navigate = useNavigate();

    const handleBack = () => {
        if (window.history.length > 1) {
            navigate(-1);
        } else {
            navigate('/home');
        }
    };

    const leftOffset = hideSidebar ? 72 : (sidebarOpen ? 288 : 136);
    // 사이드바 열림: 240 + 48 = 288px
    // 사이드바 닫힘: 64 + 48 = 112 → 여유 주고 136px

    return (
        <IconButton
            size="large"
            onClick={handleBack}
            sx={{
                position: 'fixed',
                top: 16,
                left: leftOffset,
                zIndex: 1300,
                transition: 'left 0.3s ease',
            }}
        >
            <Tooltip title="뒤로가기">
                <ArrowBackIosNewIcon sx={{ fontSize: 35 }} />
            </Tooltip>
        </IconButton>
    );
};

export default BackButton;
