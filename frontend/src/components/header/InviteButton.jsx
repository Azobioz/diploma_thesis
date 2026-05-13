import React from 'react';

const InviteButton = ({ onClick }) => {
    return (
        <button className="invite-button" onClick={onClick}>
            <span className="plus-icon-invite-button">+</span>
            Пригласить участника
        </button>
    );
};

export default InviteButton;