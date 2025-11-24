import React from 'react';
import { LogOut, User, MapPin } from 'lucide-react';

interface HeaderProps {
    user: {
        name: string;
        role: string;
        microArea?: string;
    };
    onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
    const getRoleName = (role: string) => {
        return role === 'admin' ? 'Administrador' : 'Agente de Endemias';
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();
    };

    return (
        <header className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo e Título */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                            {/* Logo SUS */}
                            <div className="w-12 h-12 bg-sus-blue rounded-lg flex items-center justify-center shadow-md">
                                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 2.18l8 3.6v8.72c0 4.42-2.92 8.54-7 9.83-4.08-1.29-7-5.41-7-9.83V7.78l6-2.7v8.42h2V4.18z" />
                                    <path d="M10 12h4v2h-4z" />
                                </svg>
                            </div>

                            <div>
                                <h1 className="text-xl font-bold text-gray-900">ACE Forms</h1>
                                <p className="text-xs text-gray-500">Sistema de Controle de Endemias</p>
                            </div>
                        </div>
                    </div>

                    {/* Perfil do Usuário */}
                    <div className="flex items-center gap-4">
                        {/* Microárea (se aplicável) */}
                        {user.microArea && (
                            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-full">
                                <MapPin className="w-4 h-4 text-sus-blue" />
                                <span className="text-sm font-medium text-sus-blue">
                                    Microárea {user.microArea}
                                </span>
                            </div>
                        )}

                        {/* Informações do Usuário */}
                        <div className="flex items-center gap-3">
                            {/* Avatar */}
                            <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                                <div className="w-10 h-10 bg-gradient-to-br from-sus-blue to-blue-600 rounded-full flex items-center justify-center shadow-md">
                                    <span className="text-white font-semibold text-sm">
                                        {getInitials(user.name)}
                                    </span>
                                </div>

                                <div className="hidden md:block text-left">
                                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                                    <p className="text-xs text-gray-500">{getRoleName(user.role)}</p>
                                </div>
                            </div>

                            {/* Botão de Logout */}
                            <button
                                onClick={onLogout}
                                className="
                  p-2 rounded-lg
                  text-gray-600 hover:text-red-600
                  hover:bg-red-50
                  transition-all duration-200
                  focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
                "
                                title="Sair"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};
