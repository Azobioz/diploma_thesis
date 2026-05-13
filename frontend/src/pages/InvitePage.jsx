import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';

const InvitePage = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState('loading');
    const [message, setMessage] = useState('Проверка ссылки...');

    useEffect(() => {
        const acceptInvite = async () => {
            const accessToken = localStorage.getItem('accessToken');

            if (!accessToken) {
                // Сохраняем токен приглашения и редиректим на auth
                localStorage.setItem('pendingInviteToken', token);
                navigate(`/boardiox/auth?inviteToken=${token}`);
                return;
            }

            try {
                const res = await fetch(`http://localhost:8081/boardiox/invitations/${token}/accept`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    }
                });

                const responseText = await res.text();

                if (res.ok) {
                    if (responseText === 'SUCCESS') {
                        setStatus('success');
                        setMessage('Вы успешно присоединились к пространству!');
                    } else if (responseText === 'ALREADY_MEMBER') {
                        setStatus('already');
                        setMessage('Вы уже являетесь участником этого пространства.');
                    }
                } else {
                    throw new Error(responseText || 'Ошибка приглашения');
                }
            } catch (err) {
                const errText = err.message.toUpperCase();
                if (errText.includes('EXPIRED')) {
                    setStatus('expired');
                    setMessage('Срок действия ссылки истёк.');
                } else if (errText.includes('USED') || errText.includes('INVALID')) {
                    setStatus('used');
                    setMessage('Ссылка уже использована или недействительна.');
                } else {
                    setStatus('error');
                    setMessage('Произошла ошибка при обработке приглашения.');
                }
            }
        };

        acceptInvite();
    }, [token, navigate]);

    return (
        <div className="invite-status-container">
            <div className="invite-status-card">
                <div className={`icon ${status}`}>
                    {status === 'success' ? '🎉' : status === 'already' ? 'ℹ️    ' : '⚠️'}
                </div>
                <h2>{status === 'success' || status === 'already' ? 'Добро пожаловать!' : 'Статус приглашения'}</h2>
                <p>{message}</p>
                {(status === 'success' || status === 'already') && (
                    <button className="btn-primary" onClick={() => navigate('/')}>
                        Перейти в пространство
                    </button>
                )}
            </div>
        </div>
    );
};

export default InvitePage;