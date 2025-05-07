import { getToken, isTokenExpired, logout } from './auth';
import { useNavigate } from 'react-router-dom';

export const authFetch = async (url, options = {}) => {
    const navigate = useNavigate();
    if (isTokenExpired()) {
        logout();
        navigate("/login");
        throw new Error('토큰이 만료되어 로그아웃되었습니다.');
    }

    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
        ...(token && { 'Authorization': `Bearer ${token}` }),
    };

    const response = await fetch(url, {
        ...options,
        headers,
    });

    if (response.status === 401 || response.status === 403) {
        logout();
        navigate("/login");
        throw new Error('인증 실패');
    }

    return response;
};