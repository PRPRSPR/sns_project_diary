import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const GoogleCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        const token = searchParams.get('token');
        if (token) {
            try {
                const user = jwtDecode(token);
                localStorage.setItem('token', token);
                console.log('구글 로그인 성공, 사용자:', user);
                navigate('/home');
            } catch (err) {
                console.error('토큰 디코드 실패:', err);
                navigate('/');
            }
        } else {
            console.error('토큰 없음');
            navigate('/');
        }
    }, [navigate, searchParams]);

    return null;
};

export default GoogleCallback;
