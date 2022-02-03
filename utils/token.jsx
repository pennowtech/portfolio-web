import cookie from 'cookie';

const AUTH_TOKEN = 'pnt-auth-token'; // it might be deleted if session storage works fine
const USERNAME_TOKEN = 'pnt-username-token';
const JWT_REFRESH_TOKEN = 'pnt-jwt-refresh-token';

export const getToken = () => localStorage.getItem(AUTH_TOKEN);
export const setToken = (token) => localStorage.setItem(AUTH_TOKEN, token);
export const deleteToken = () => localStorage.removeItem(AUTH_TOKEN);

export const getLoggedUser = () => (typeof localStorage !== 'undefined' ? localStorage.getItem(USERNAME_TOKEN) : '');
export const setLoggedUser = (token) => localStorage.setItem(USERNAME_TOKEN, token);
export const deleteLoggedUser = () => localStorage.removeItem(USERNAME_TOKEN);

export const getJwtToken = () => sessionStorage.getItem(JWT_TOKEN);
export const setJwtToken = (token) => sessionStorage.setItem(JWT_TOKEN, token);
export const deleteJwtToken = () => sessionStorage.removeItem(JWT_TOKEN);
export const getRefreshToken = () => sessionStorage.removeItem(JWT_REFRESH_TOKEN);
export const setRefreshToken = (token) => sessionStorage.setItem(JWT_REFRESH_TOKEN, token);
