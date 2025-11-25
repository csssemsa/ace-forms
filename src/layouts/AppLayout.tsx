import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Header } from '../components/Header';
import { TabNavigation } from '../components/TabNavigation';
import { useAuth } from '../contexts/AuthContext';
import { FileText, Users, AlertTriangle, ClipboardList, Map, UserCog, AlertCircle } from 'lucide-react';

export const AppLayout: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Mapeamento de Rotas para IDs de Abas
    const routeToTabId: Record<string, string> = {
        '/visitas': 'visitation',
        '/controle-vetorial': 'strategic',
        '/historico': 'history',
        '/mapa': 'map',
        '/cidadaos': 'citizens',
        '/notificacoes': 'notifications',
        '/profissionais': 'professionalList'
    };

    // Mapeamento de IDs de Abas paraRotas
    const tabIdToRoute: Record<string, string> = {
        'visitation': '/visitas',
        'strategic': '/controle-vetorial',
        'history': '/historico',
        'map': '/mapa',
        'citizens': '/cidadaos',
        'notifications': '/notificacoes',
        'professionalList': '/profissionais'
    };

    const currentTab = routeToTabId[location.pathname] || 'visitation';

    const handleTabChange = (tabId: string) => {
        const route = tabIdToRoute[tabId];
        if (route) navigate(route);
    };

    const tabs = React.useMemo(() => {
        if (!user) return [];

        const allTabs = [];

        if (user.role === 'user') {
            allTabs.push(
                { id: 'visitation', label: 'Ficha de Visita', icon: FileText },
                { id: 'strategic', label: 'Controle Vetorial', icon: AlertTriangle }
            );
        }

        allTabs.push(
            { id: 'history', label: 'Histórico', icon: ClipboardList },
            { id: 'map', label: 'Mapeamento', icon: Map },
            { id: 'notifications', label: 'Notificações', icon: AlertCircle },
            { id: 'citizens', label: 'Cidadãos', icon: Users }
        );

        if (user.role === 'admin') {
            allTabs.push(
                { id: 'professionalList', label: 'Profissionais', icon: UserCog }
            );
        }

        return allTabs;
    }, [user]);

    // Verificação de user DEPOIS de todos os hooks
    if (!user) return null;

    return (
        <div className="min-h-screen bg-secondary">
            <Header user={user} onLogout={logout} />

            <TabNavigation
                tabs={tabs}
                activeTab={currentTab}
                onTabChange={handleTabChange}
            />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Outlet />
            </main>

            <footer className="mt-12 pb-8 text-center text-gray-500 text-sm">
                <p>Protótipo de Sistema de Agentes de Combate a Endemias - ACE</p>
                <p className="text-xs mt-1">© 2025 Secretaria Municipal de Saúde - Simulação</p>
            </footer>
        </div>
    );
};
