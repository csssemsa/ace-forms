import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, AuthContextType } from '../types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        // Verificar sessão existente ao carregar
        const sessionUser = localStorage.getItem('ace_session');
        if (sessionUser) {
            setUser(JSON.parse(sessionUser));
        }

        // Seed Admin User (Lógica migrada do App.tsx)
        const existingUsersStr = localStorage.getItem('ace_users');
        let existingUsers = existingUsersStr ? JSON.parse(existingUsersStr) : [];

        if (existingUsers.length === 0) {
            const adminUser: User = {
                id: 'admin-seed',
                name: 'Administrador',
                cpf: '987.654.321-12',
                cns: '000000000000000',
                microArea: '00',
                password: 'admin123',
                role: 'admin'
            };
            existingUsers = [adminUser];
            localStorage.setItem('ace_users', JSON.stringify(existingUsers));
            console.log('Admin user created: 987.654.321-12 / admin123');
        }
    }, []);

    const login = (userData: User) => {
        setUser(userData);
        localStorage.setItem('ace_session', JSON.stringify(userData));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('ace_session');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
