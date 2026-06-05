import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import '../designs/authpage/AuthPage.css';

const AuthPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState('login');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const [loginData, setLoginData] = useState({ nickname: '', password: '' });
    const [registerData, setRegisterData] = useState({
        nickname: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    const loginTabRef = useRef(null);
    const registerTabRef = useRef(null);
    const underlineRef = useRef(null);

    const inviteToken = searchParams.get('inviteToken');

    const processPendingInvite = async (accessToken) => {
        const pendingToken = localStorage.getItem('pendingInviteToken') || inviteToken;
        if (!pendingToken) return true;
        try {
            const res = await fetch(`http://localhost:8081/boardiox/invitations/${pendingToken}/accept`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' }
            });
            const responseText = await res.text();
            if (res.ok && (responseText === 'SUCCESS' || responseText === 'ALREADY_MEMBER')) {
                localStorage.removeItem('pendingInviteToken');
                return true;
            }
            return false;
        } catch (err) {
            return false;
        }
    };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            const response = await fetch('http://localhost:8081/boardiox/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(loginData)
            });
            const data = await response.json();
            if (response.ok) {
                localStorage.setItem('accessToken', data.tokenResponse.accessToken);
                localStorage.setItem('refreshToken', data.refreshToken);
                localStorage.setItem('userId', data.tokenResponse.userId);
                await processPendingInvite(data.tokenResponse.accessToken);
                navigate(data.spaceId ? `/boardiox/spaces/${data.spaceId}` : '/boardiox/dashboard');
            } else {
                setError(data.message || 'Неверный никнейм или пароль');
            }
        } catch (err) {
            setError('Ошибка сервера. Попробуйте позже.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        if (registerData.password !== registerData.confirmPassword) {
            setError('Пароли не совпадают');
            setIsLoading(false);
            return;
        }
        try {
            const response = await fetch('http://localhost:8081/boardiox/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nickname: registerData.nickname,
                    email: registerData.email,
                    password: registerData.password
                })
            });
            const data = await response.json();
            if (response.ok) {
                localStorage.setItem('accessToken', data.tokenResponse.accessToken);
                localStorage.setItem('refreshToken', data.refreshToken);
                localStorage.setItem('userId', data.tokenResponse.userId);
                await processPendingInvite(data.tokenResponse.accessToken);
                navigate(data.spaceId ? `/boardiox/spaces/${data.spaceId}` : '/boardiox/dashboard');
            } else {
                setError(data.message || 'Ошибка регистрации');
            }
        } catch (err) {
            setError('Ошибка сервера. Попробуйте позже.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLoginChange = (e) => setLoginData({ ...loginData, [e.target.name]: e.target.value });
    const handleRegisterChange = (e) => setRegisterData({ ...registerData, [e.target.name]: e.target.value });

    useEffect(() => {
        const activeRef = activeTab === 'login' ? loginTabRef : registerTabRef;
        if (activeRef.current && underlineRef.current) {
            underlineRef.current.style.left = `${activeRef.current.offsetLeft}px`;
            underlineRef.current.style.width = `${activeRef.current.offsetWidth}px`;
        }
    }, [activeTab]);

    return (
        <div className="auth-container">

            {/* Шапка с вкладками */}
            <div className="auth-tabs">
                <span
                    ref={loginTabRef}
                    className={`auth-tab ${activeTab === 'login' ? 'active' : ''}`}
                    onClick={() => setActiveTab('login')}
                >
                    Вход
                </span>
                <span
                    ref={registerTabRef}
                    className={`auth-tab ${activeTab === 'register' ? 'active' : ''}`}
                    onClick={() => setActiveTab('register')}
                >
                    Регистрация
                </span>
                <div ref={underlineRef} className="auth-underline" />
            </div>

            {/* Логотип — стикер */}
            <div className="boardiox-sticky"><span className="boardiox-sticky-text">Boardiox</span></div>

            {/* Форма входа */}
            {activeTab === 'login' && (
                <form onSubmit={handleLoginSubmit} className="auth-form auth-form--login" autoComplete="off">
                    <input
                        type="text"
                        name="nickname"
                        placeholder="Никнейм"
                        value={loginData.nickname}
                        onChange={handleLoginChange}
                        className="auth-input"
                        autoComplete="username"
                        required
                    />
                    <input
                        type="password"
                        name="password"
                        placeholder="Пароль"
                        value={loginData.password}
                        onChange={handleLoginChange}
                        className="auth-input"
                        autoComplete="current-password"
                        required
                    />
                    {error && <div className="auth-error">{error}</div>}
                    <button type="submit" className="auth-button" disabled={isLoading}>
                        {isLoading ? 'Загрузка...' : 'Войти'}
                    </button>
                </form>
            )}

            {/* Форма регистрации */}
            {activeTab === 'register' && (
                <form onSubmit={handleRegisterSubmit} className="auth-form auth-form--register" autoComplete="off">
                    <div className="auth-form-grid">
                        <input
                            type="text"
                            name="nickname"
                            placeholder="Никнейм"
                            value={registerData.nickname}
                            onChange={handleRegisterChange}
                            className="auth-input"
                            autoComplete="off"
                            required
                        />
                        <input
                            type="email"
                            name="email"
                            placeholder="Электронная почта"
                            value={registerData.email}
                            onChange={handleRegisterChange}
                            className="auth-input"
                            autoComplete="off"
                            required
                        />
                        <input
                            type="password"
                            name="password"
                            placeholder="Придумайте пароль"
                            value={registerData.password}
                            onChange={handleRegisterChange}
                            className="auth-input"
                            autoComplete="new-password"
                            required
                        />
                        <input
                            type="password"
                            name="confirmPassword"
                            placeholder="Повторите пароль"
                            value={registerData.confirmPassword}
                            onChange={handleRegisterChange}
                            className="auth-input"
                            autoComplete="new-password"
                            required
                        />
                    </div>
                    {error && <div className="auth-error">{error}</div>}
                    <button type="submit" className="auth-button" disabled={isLoading}>
                        {isLoading ? 'Создание аккаунта...' : 'Зарегистрироваться'}
                    </button>
                </form>
            )}

            {/* Декоративные элементы в стиле доски */}
            <div className="auth-board-deco">
                {/*
                    Координаты карточек (приблизительный центр правого/левого края):
                    Придумывай (left=0, bottom=0, ~120x38px)  → правый край: (120, 112)
                    Реализуй   (left=190, bottom=72, ~100x38px) → левый край: (190, 50), правый: (290, 50)
                    Проектируй (left=366, bottom=0, ~110x38px) → левый край: (366, 112)
                    SVG viewBox="0 0 500 150", y считается сверху вниз.
                */}
                <svg className="auth-deco-arrows" viewBox="0 0 500 150" xmlns="http://www.w3.org/2000/svg">
                    {/* Стрелка: Придумывай → Реализуй */}
                    <defs>
                        <marker id="arrow" markerWidth="8" markerHeight="8"
                                refX="6" refY="3" orient="auto">
                            <path d="M0,0 L0,6 L8,3 z" fill="#1a1a1a"/>
                        </marker>
                    </defs>
                    {/* Стрелка: Придумывай (правый край ~120,132) → Реализуй (левый край 188,61) */}
                    <line
                        x1="120" y1="132" x2="188" y2="61"
                        stroke="#1a1a1a" strokeWidth="2"
                        markerEnd="url(#arrow)"
                    />
                    {/* Стрелка: Проектируй (левый край 366,132) → Реализуй (правый край 307,61) */}
                    <line
                        x1="366" y1="132" x2="307" y2="61"
                        stroke="#1a1a1a" strokeWidth="2"
                        markerEnd="url(#arrow)"
                    />
                </svg>

                <div className="deco-card deco-card--yellow">Придумывай</div>
                <div className="deco-card deco-card--orange">Реализуй</div>
                <div className="deco-card deco-card--blue">Проектируй</div>
            </div>
        </div>
    );
};

export default AuthPage;
