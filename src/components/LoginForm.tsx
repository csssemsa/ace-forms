import React, { useState } from 'react';
import { Lock, CreditCard, LogIn } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

export const LoginForm: React.FC = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [cpf, setCpf] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const formatCPF = (value: string) => {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})/, '$1-$2')
            .replace(/(-\d{2})\d+?$/, '$1');
    };

    const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatCPF(e.target.value);
        setCpf(formatted);
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Simular delay de rede
        await new Promise(resolve => setTimeout(resolve, 800));

        try {
            const usersStr = localStorage.getItem('ace_users');
            const users = usersStr ? JSON.parse(usersStr) : [];

            const user = users.find((u: any) => u.cpf === cpf && u.password === password);

            if (user) {
                login(user);
                toast.success(`Bem-vindo, ${user.name}!`);
                navigate('/');
            } else {
                toast.error('CPF ou senha inválidos');
            }
        } catch (err) {
            toast.error('Erro ao realizar login');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-sus-blue">Acesso ao Sistema</h2>
                    <p className="text-slate-500">e-SUS APS - Ficha de Visita</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <Input
                        label="CPF"
                        icon={<CreditCard className="w-4 h-4" />}
                        value={cpf}
                        onChange={handleCPFChange}
                        maxLength={14}
                        required
                        placeholder="000.000.000-00"
                    />

                    <Input
                        label="Senha"
                        type="password"
                        icon={<Lock className="w-4 h-4" />}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="******"
                    />

                    <Button
                        type="submit"
                        isLoading={isLoading}
                        className="w-full"
                    >
                        <LogIn className="w-5 h-5 mr-2" />
                        Entrar
                    </Button>
                </form>

                <div className="mt-4 text-center">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            if (confirm('Isso irá apagar todos os dados salvos localmente. Deseja continuar?')) {
                                localStorage.clear();
                                window.location.reload();
                            }
                        }}
                        className="text-slate-400 hover:text-slate-600 underline"
                    >
                        Resetar dados do sistema
                    </Button>
                </div>
            </div>
        </div>
    );
};
