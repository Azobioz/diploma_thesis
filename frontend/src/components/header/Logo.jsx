import React from 'react';
import {useLocation, useNavigate, useParams} from 'react-router-dom';

const Logo = ({ onClick }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const handleClick = () => {

        if (onClick) {
            onClick();
            return
        }

        // Получаем lastSpaceId из localStorage, который сохраняется при входе в пространство
        const lastSpaceId = localStorage.getItem('lastSpaceId')

        // Если есть lastSpaceId и не на странице пространства переводит на главную страницу
        if (lastSpaceId && !location.pathname.includes('/spaces/')) {
            navigate(`/boardiox/spaces/${lastSpaceId}`);
        }

    };

    return (
        <div onClick={handleClick} style={{ cursor: 'pointer', userSelect: 'none' }}>
            Boardiox
        </div>
    );
};

export default Logo;