import React from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { LogIn, Lock, CreditCard } from 'lucide-react';
import { formatCPF } from '../utils/masks';

interface LoginFormData {
    cpf: string;
    password: string;
}

interface LoginFormProps {
    onLoginSuccess: (user: any) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
    const { register, handleSubmit, setError, setValue, formState: { errors } } = useForm<LoginFormData>();

    const onSubmit: SubmitHandler<LoginFormData> = (data) => {
        try {
            const existingUsersStr = localStorage.getItem('ace_users');
            const existingUsers = existingUsersStr ? JSON.parse(existingUsersStr) : [];

            console.log('=== DEBUG LOGIN ===');
            console.log('CPF digitado:', data.cpf);
            console.log('Senha digitada:', data.password);
            console.log('Total de usuários:', existingUsers.length);
            console.table(existingUsers.map((u: any) => ({
                nome: u.name,
                cpf: u.cpf,
                senha: u.password,
                role: u.role
            })));

            // Comparação exata de CPF e senha
            const user = existingUsers.find((u: any) => u.cpf === data.cpf && u.password === data.password);

            console.log('Usuário encontrado:', user ? user.name : 'NENHUM');

            if (user) {
                onLoginSuccess(user);
            } else {
                setError('root', { message: 'CPF ou senha inválidos' });
            }
        } catch (error) {
            console.error(error);
            setError('root', { message: 'Erro ao tentar fazer login' });
        }
    };

    const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatCPF(e.target.value);
        setValue('cpf', formatted);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-sus-blue">Acesso ao Sistema</h2>
                    <p className="text-slate-500">e-SUS APS - Ficha de Visita</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-sus-blue" />
                            CPF
                        </label>
                        <input
                            {...register("cpf", {
                                required: "CPF é obrigatório",
                                onChange: handleCPFChange
                            })}
                            maxLength={14}
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-sus-blue focus:border-sus-blue outline-none transition-all"
                            placeholder="000.000.000-00"
                        />
                        {errors.cpf && <span className="text-red-500 text-xs">{errors.cpf.message}</span>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                            <Lock className="w-4 h-4 text-sus-blue" />
                            Senha
                        </label>
                        <input
                            type="password"
                            {...register("password", { required: "Senha é obrigatória" })}
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-sus-blue focus:border-sus-blue outline-none transition-all"
                            placeholder="******"
                        />
                        {errors.password && <span className="text-red-500 text-xs">{errors.password.message}</span>}
                    </div>

                    {errors.root && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded border border-red-100 text-center">
                            {errors.root.message}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full flex justify-center items-center gap-2 bg-sus-blue hover:bg-blue-700 text-white px-4 py-3 rounded font-medium shadow-md transition-colors"
                    >
                        <LogIn className="w-5 h-5" />
                        Entrar
                    </button>
                </form>

                <div className="mt-4 text-center">
                    <button
                        onClick={() => {
                            if (confirm('Isso irá apagar todos os dados salvos localmente. Deseja continuar?')) {
                                localStorage.clear();
                                window.location.reload();
                            }
                        }}
                        className="text-xs text-slate-400 hover:text-slate-600 underline"
                    >
                        Resetar dados do sistema
                    </button>
                </div>
            </div>
        </div>
    );
};
