import React from 'react';
import { Outlet } from 'react-router-dom';

export const AuthLayout: React.FC = () => {
    return (
        <div className="min-h-screen bg-secondary flex items-center justify-center">
            <Outlet />
        </div>
    );
};
