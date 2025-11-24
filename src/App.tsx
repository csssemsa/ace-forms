import React from 'react';
import { VisitationForm } from './components/VisitationForm';
import { LoginForm } from './components/LoginForm';
import { CitizenManagement } from './components/CitizenManagement';
import { StrategicPointForm } from './components/StrategicPointForm';
import { VisitHistory } from './components/VisitHistory';
import { VisitMap } from './components/VisitMap';
import { ProfessionalList } from './components/ProfessionalList';
import { Header } from './components/Header';
import { TabNavigation } from './components/TabNavigation';
import { FileText, Users, AlertTriangle, ClipboardList, Map, UserCog } from 'lucide-react';

type Screen = 'visitation' | 'professionalList' | 'citizens' | 'strategic' | 'history' | 'map' | 'login';

function App() {
  const [user, setUser] = React.useState<any>(null);
  const [currentScreen, setCurrentScreen] = React.useState<Screen>('login');

  React.useEffect(() => {
    // Seed Admin User - APENAS se não existir NENHUM usuário
    const existingUsersStr = localStorage.getItem('ace_users');
    let existingUsers = existingUsersStr ? JSON.parse(existingUsersStr) : [];

    console.log('=== APP INIT ===');
    console.log('Usuários no localStorage:', existingUsers.length);

    // Só cria o admin se NÃO existir NENHUM usuário
    if (existingUsers.length === 0) {
      const adminUser = {
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
    } else {
      console.log('Usuários já existem, não criando admin novamente');
    }

    const sessionUser = localStorage.getItem('ace_session');
    if (sessionUser) {
      const parsedUser = JSON.parse(sessionUser);
      setUser(parsedUser);
      // Redirect based on role
      if (parsedUser.role === 'admin') {
        setCurrentScreen('citizens');
      } else {
        setCurrentScreen('visitation');
      }
    }
  }, []);

  const handleLogin = (loggedInUser: any) => {
    setUser(loggedInUser);
    localStorage.setItem('ace_session', JSON.stringify(loggedInUser));
    // Redirect based on role
    if (loggedInUser.role === 'admin') {
      setCurrentScreen('citizens');
    } else {
      setCurrentScreen('visitation');
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('ace_session');
    setCurrentScreen('login');
  };

  const renderContent = () => {
    if (!user) {
      return <LoginForm onLoginSuccess={handleLogin} />;
    }

    switch (currentScreen) {
      case 'visitation':
        if (user.role === 'admin') {
          return <div className="text-center text-slate-500 p-8">Administradores não preenchem fichas de visita.</div>;
        }
        return <VisitationForm user={user} />;

      case 'citizens':
        return <CitizenManagement />;

      case 'strategic':
        return <StrategicPointForm user={user} />;

      case 'history':
        return <VisitHistory user={user} />;

      case 'map':
        return <VisitMap user={user} />;

      case 'professionalList':
        if (user.role !== 'admin') {
          return <div className="text-center text-red-500 p-8">Acesso Negado</div>;
        }
        return <ProfessionalList />;

      default:
        return null;
    }
  };

  // Definir abas baseadas na role do usuário (antes do early return)
  const tabs = React.useMemo(() => {
    if (!user) return [];

    const allTabs = [];

    // Abas para ACE
    if (user.role === 'user') {
      allTabs.push(
        { id: 'visitation', label: 'Ficha de Visita', icon: FileText },
        { id: 'strategic', label: 'Controle Vetorial', icon: AlertTriangle }
      );
    }

    // Abas para todos
    allTabs.push(
      { id: 'history', label: 'Histórico', icon: ClipboardList },
      { id: 'map', label: 'Mapeamento', icon: Map },
      { id: 'citizens', label: 'Cidadãos', icon: Users }
    );

    // Aba para Admin
    if (user.role === 'admin') {
      allTabs.push(
        { id: 'professionalList', label: 'Profissionais', icon: UserCog }
      );
    }

    return allTabs;
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <LoginForm onLoginSuccess={handleLogin} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary">
      {/* Header */}
      <Header user={user} onLogout={handleLogout} />

      {/* Tab Navigation */}
      <TabNavigation
        tabs={tabs}
        activeTab={currentScreen}
        onTabChange={(tabId) => setCurrentScreen(tabId as Screen)}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </main>

      {/* Footer */}
      <footer className="mt-12 pb-8 text-center text-gray-500 text-sm">
        <p>Protótipo de Sistema de Agentes de Combate a Endemias - ACE</p>
        <p className="text-xs mt-1">© 2025 Secretaria Municipal de Saúde - Simulação</p>
      </footer>
    </div>
  );
}

export default App;
