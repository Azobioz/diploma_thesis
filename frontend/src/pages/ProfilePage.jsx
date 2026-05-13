import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../components/header/Header';

const ProfilePage = () => {
    const { userId: paramUserId } = useParams();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const [description, setDescription] = useState('');
    const [tempDescription, setTempDescription] = useState('');
    const [showAvatarPreview, setShowAvatarPreview] = useState(false);
    const [selectedAvatar, setSelectedAvatar] = useState(null);
    const [avatarPreviewUrl, setAvatarPreviewUrl] = useState(null);
    const [userData, setUserData] = useState(null);
    const [spaceData, setSpaceData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Получаем текущий userId: из URL или из localStorage
    const currentUserId = localStorage.getItem('userId');
    const profileUserId = paramUserId || currentUserId;

    // Загрузка данных профиля
    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                if (!token) {
                    navigate('/boardiox/auth');
                    return;
                }

                if (!profileUserId) {
                    console.error('User ID is not available');
                    navigate('/boardiox/auth');
                    return;
                }

                // ← ИСПРАВЛЕНО: используем существующий эндпоинт /users/{id}
                const response = await fetch(`http://localhost:8081/boardiox/users/${profileUserId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    setUserData(data);
                    setDescription(data.description || '');
                } else {
                    console.error('Failed to fetch profile data');
                }
            } catch (err) {
                console.error('Error fetching profile:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchProfileData();
    }, [profileUserId, navigate]);

    // Загрузка данных пространства для Header
    useEffect(() => {
        const fetchSpaceData = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                if (!token || !currentUserId) return;

                const response = await fetch(`http://localhost:8081/boardiox/spaces/users/${currentUserId}/spacesinfo`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });
                if (response.ok) {
                    const spaces = await response.json();
                    if (spaces.length > 0) {
                        const firstSpaceResponse = await fetch(`http://localhost:8081/boardiox/spaces/${spaces[0].spaceId}`, {
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json',
                            },
                        });
                        if (firstSpaceResponse.ok) {
                            const spaceData = await firstSpaceResponse.json();
                            setSpaceData(spaceData);
                        }
                    }
                }
            } catch (err) {
                console.error('Error fetching space data:', err);
            }
        };
        fetchSpaceData();
    }, [currentUserId]);

    // Обработка выбора файла аватарки
    const handleAvatarSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedAvatar(file);
                setAvatarPreviewUrl(reader.result);
                setShowAvatarPreview(true);
            };
            reader.readAsDataURL(file);
        }
    };

    // Загрузка аватарки
    const handleAvatarUpload = async () => {
        if (selectedAvatar && profileUserId) {
            try {
                const token = localStorage.getItem('accessToken');
                const formData = new FormData();
                formData.append('file', selectedAvatar);

                const response = await fetch(`http://localhost:8081/boardiox/users/${profileUserId}/avatar`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                    body: formData,
                });

                if (response.ok) {
                    const data = await response.json();
                    setUserData(prev => ({
                        ...prev,
                        avatar: data.avatar
                    }));
                    setShowAvatarPreview(false);
                    setSelectedAvatar(null);
                    setAvatarPreviewUrl(null);
                }
            } catch (err) {
                console.error('Error uploading avatar:', err);
                alert('Ошибка при загрузке аватарки');
            }
        }
    };

    // Отмена загрузки аватарки
    const handleAvatarCancel = () => {
        setShowAvatarPreview(false);
        setSelectedAvatar(null);
        setAvatarPreviewUrl(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Начало редактирования описания
    const handleEditDescription = () => {
        setTempDescription(description);
        setIsEditingDescription(true);
    };

    // ← ИСПРАВЛЕНО: сохранение описания через новый эндпоинт
    const handleSaveDescription = async () => {
        if (profileUserId) {
            try {
                const token = localStorage.getItem('accessToken');
                const response = await fetch(`http://localhost:8081/boardiox/users/${profileUserId}/description`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ description: tempDescription }),
                });
                if (response.ok) {
                    setDescription(tempDescription);
                    setIsEditingDescription(false);
                }
            } catch (err) {
                console.error('Error saving description:', err);
                alert('Ошибка при сохранении описания');
            }
        }
    };

    // Отмена редактирования описания
    const handleCancelDescription = () => {
        setIsEditingDescription(false);
        setTempDescription(description);
    };

    // Обработка нажатия Enter в textarea
    const handleDescriptionKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSaveDescription();
        } else if (e.key === 'Escape') {
            handleCancelDescription();
        }
    };

    // Открытие выбора файла
    const handlePlusClick = () => {
        fileInputRef.current?.click();
    };

    if (loading) {
        return <div className="profile-loading">Загрузка...</div>;
    }

    if (!userData) {
        return <div className="profile-error">Пользователь не найден</div>;
    }

    const initials = userData.nickname ? userData.nickname.charAt(0).toUpperCase() : '?';
    const createdAt = userData.createdAt ? new Date(userData.createdAt).toLocaleDateString('ru-RU') : 'Неизвестно';

    return (
        <div className="profile-page">
            <div className="header-in-profile">
                <Header
                    showLogo={true}
                    showAvatars={false}
                    showInvite={false}
                    showNotifications={true}
                    showProfile={false}
                    currentUserId={currentUserId}
                    currentUserAvatar={userData.avatar}
                    currentUserName={userData.nickname}
                    notificationCount={0}
                    userBoards={[]}
                    allSpaceBoards={[]}
                    onLogoClick={() => {
                        const lastSpaceId = localStorage.getItem('lastSpaceId');
                        if (lastSpaceId) {
                            navigate(`/boardiox/spaces/${lastSpaceId}`);
                        }
                    }}
                />
            </div>
            {/* Основной контент */}
            <div className="profile-content">
                {/* Карточка профиля */}
                <div className="profile-card">
                    <div className="profile-avatar-section">
                        <div className="profile-avatar-large">
                            {userData.avatar ? (
                                <img src={`data:image/png;base64,${userData.avatar}`} alt={userData.nickname} />
                            ) : (
                                <span>{initials}</span>
                            )}
                        </div>
                        <button className="avatar-upload-btn" onClick={handlePlusClick}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10"/>
                                <line x1="12" y1="8" x2="12" y2="16"/>
                                <line x1="8" y1="12" x2="16" y2="12"/>
                            </svg>
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarSelect}
                            style={{ display: 'none' }}
                        />
                    </div>
                    <div className="profile-info">
                        <h1 className="profile-nickname">{userData.nickname}</h1>
                        <p className="profile-created">Аккаунт создан: {createdAt}</p>
                    </div>
                </div>

                {/* Описание профиля */}
                <div className="profile-description-card">
                    <div className="description-header">
                        <button className="edit-description-btn" onClick={handleEditDescription}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                        </button>
                        <div>Описание профиля</div>
                    </div>
                    <div className="description-line"></div>
                    {isEditingDescription ? (
                        <>
              <textarea
                  className="description-textarea"
                  value={tempDescription}
                  onChange={(e) => setTempDescription(e.target.value)}
                  onKeyDown={handleDescriptionKeyDown}
                  autoFocus
                  rows={4}
              />
                            <div className="description-buttons">
                                <button className="btn-save" onClick={handleSaveDescription}>Сохранить</button>
                                <button className="btn-cancel" onClick={handleCancelDescription}>Отмена</button>
                            </div>
                        </>
                    ) : (
                        /* ← ДИНАМИЧЕСКОЕ ОПИСАНИЕ */
                        <p className="description-text">{description || 'Нет описания'}</p>
                    )}
                </div>

                {/* Статистика */}
                <div className="profile-stats-card">
                    <p>Количество выполненных задач: {userData.completedTasks || 0}</p>
                </div>
            </div>

            {/* Панель превью аватарки */}
            {showAvatarPreview && (
                <div className="avatar-preview-overlay">
                    <div className="avatar-preview-panel">
                        <div className="avatar-preview-circle">
                            {avatarPreviewUrl && (
                                <img src={avatarPreviewUrl} alt="Preview" />
                            )}
                            <span>Новое изображение</span>
                        </div>
                        <div className="avatar-preview-buttons">
                            <button className="btn-cancel" onClick={handleAvatarCancel}>
                                Отмена
                            </button>
                            <button className="btn-upload" onClick={handleAvatarUpload}>
                                Загрузить
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfilePage;