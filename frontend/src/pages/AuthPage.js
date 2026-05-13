import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const AuthPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState('login');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Данные форм
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

    // Получаем токен приглашения из URL
    const inviteToken = searchParams.get('inviteToken');

    // Обработка приглашения после логина/регистрации
    const processPendingInvite = async (accessToken) => {
        const pendingToken = localStorage.getItem('pendingInviteToken') || inviteToken;
        if (!pendingToken) return true;

        try {
            const res = await fetch(`http://localhost:8081/boardiox/invitations/${pendingToken}/accept`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            const responseText = await res.text();

            if (res.ok) {
                if (responseText === 'SUCCESS' || responseText === 'ALREADY_MEMBER') {
                    localStorage.removeItem('pendingInviteToken');
                    return true;
                }
            } else {
                console.warn('Invite accept failed:', responseText);
            }
            return false;
        } catch (err) {
            console.error('Error accepting invite:', err);
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

                const inviteProcessed = await processPendingInvite(data.tokenResponse.accessToken);

                // Если есть пространство, идём туда. Иначе на главную (добавим маршрут ниже)
                const targetPath = data.spaceId
                    ? `/boardiox/spaces/${data.spaceId}`
                    : '/boardiox/dashboard'; // fallback

                if (inviteProcessed && inviteToken) {
                    navigate(targetPath);
                } else {
                    navigate(targetPath);
                }
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

                const inviteProcessed = await processPendingInvite(data.tokenResponse.accessToken);

                // Если есть пространство, идём туда. Иначе на главную (добавим маршрут ниже)
                const targetPath = data.spaceId
                    ? `/boardiox/spaces/${data.spaceId}`
                    : '/boardiox/dashboard'; // fallback

                if (inviteProcessed && inviteToken) {
                    navigate(targetPath);
                } else {
                    navigate(targetPath);
                }
            }else {
                setError(data.message || 'Ошибка регистрации');
            }
        } catch (err) {
            setError('Ошибка сервера. Попробуйте позже.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLoginChange = (e) => {
        setLoginData({ ...loginData, [e.target.name]: e.target.value });
    };

    const handleRegisterChange = (e) => {
        setRegisterData({ ...registerData, [e.target.name]: e.target.value });
    };

    // Анимация underline
    useEffect(() => {
        const activeRef = activeTab === 'login' ? loginTabRef : registerTabRef;
        if (activeRef.current && underlineRef.current) {
            underlineRef.current.style.left = `${activeRef.current.offsetLeft}px`;
            underlineRef.current.style.width = `${activeRef.current.offsetWidth}px`;
        }
    }, [activeTab]);

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="sign-in-and-sign-up-text">
                    <div className="sign-in-text">
                        <div ref={loginTabRef} onClick={() => setActiveTab('login')}>
                            Вход
                        </div>
                    </div>
                    <div className="sign-up-text">
                        <div ref={registerTabRef} onClick={() => setActiveTab('register')}>
                            Регистрация
                        </div>
                    </div>
                    <div ref={underlineRef} className="underline"></div>
                </div>

                <div className="boardiox-text">Boardiox</div>

                {/* Форма входа */}
                {activeTab === 'login' && (
                    <form onSubmit={handleLoginSubmit} className="sign-in-form-container">
                        <div className="styled-input">
                            <input
                                type="text"
                                name="nickname"
                                placeholder="Никнейм"
                                value={loginData.nickname}
                                onChange={handleLoginChange}
                                className="styled-input"
                                required
                            />
                        </div>
                        <div className="styled-input">
                            <input
                                type="password"
                                name="password"
                                placeholder="Пароль"
                                value={loginData.password}
                                onChange={handleLoginChange}
                                className="styled-input"
                                required
                            />
                        </div>

                        {error && <div className="error-msg">{error}</div>}

                        <button type="submit" className="submit-button-sign-in" disabled={isLoading}>
                            {isLoading ? 'Загрузка...' : 'Войти'}
                        </button>
                    </form>
                )}

                {/* Форма регистрации */}
                {activeTab === 'register' && (
                    <form onSubmit={handleRegisterSubmit} className="register-form-container">
                        <div className="styled-input">
                            <input
                                type="text"
                                name="nickname"
                                placeholder="Никнейм"
                                value={registerData.nickname}
                                onChange={handleRegisterChange}
                                className="styled-input"
                                required
                            />
                            <input
                                type="email"
                                name="email"
                                placeholder="Электронная почта"
                                value={registerData.email}
                                onChange={handleRegisterChange}
                                className="styled-input"
                                required
                            />
                        </div>

                        <div className="styled-input">
                            <input
                                type="password"
                                name="password"
                                placeholder="Пароль"
                                value={registerData.password}
                                onChange={handleRegisterChange}
                                className="styled-input"
                                required
                            />
                            <input
                                type="password"
                                name="confirmPassword"
                                placeholder="Повторите пароль"
                                value={registerData.confirmPassword}
                                onChange={handleRegisterChange}
                                className="styled-input"
                                required
                            />
                        </div>

                        {error && <div className="error-msg">{error}</div>}

                        <button type="submit" className="submit-button-sign-up" disabled={isLoading}>
                            {isLoading ? 'Создание аккаунта...' : 'Зарегистрироваться'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default AuthPage;