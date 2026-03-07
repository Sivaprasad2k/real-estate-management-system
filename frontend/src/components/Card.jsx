import React from 'react';

const Card = ({ children, className = '' }) => {
    return (
        <div className={`bg-dark-card rounded-xl shadow-md p-6 ${className}`}>
            {children}
        </div>
    );
};

export default Card;
