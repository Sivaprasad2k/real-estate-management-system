import React from 'react';

const Card = ({ children, className = '' }) => {
    return (
        <div className={`card-luxury ${className}`}>
            {children}
        </div>
    );
};

export default Card;
