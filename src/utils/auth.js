import {jwtDecode} from 'jwt-decode';

// 로컬 스토리지에서 JWT 토큰 가져오기
export const getToken = () => {
  return localStorage.getItem('token');
};

// 로그인 여부 확인 (토큰 존재 여부만 판단)
export const isLoggedIn = () => {
  return !!getToken(); // 토큰이 있으면 true
};

// 로그아웃 처리
export const logout = () => {
  localStorage.removeItem('token');
};

// 토큰 자동 만료 체크
export const isTokenExpired = () => {
  const token = localStorage.getItem('token');
  if (!token) return true;

  try {
    const { exp } = jwtDecode(token);
    const now = Math.floor(Date.now() / 1000); // 현재 시간 (초)
    return exp < now;
  } catch (err) {
    return true;
  }
};