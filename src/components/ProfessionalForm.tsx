import React from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { Save, User, MapPin, FileBadge, Lock, CreditCard } from 'lucide-react';
import { formatCPF } from '../utils/masks';

interface ProfessionalFormData {
    name: string;
    cpf: string;
    cns: string;
    microArea: string;
    password: string;
}

export const ProfessionalForm: React.FC<{ onSave?: () => void }> = ({ onSave }) => {
    const { register, handleSubmit, setValue, formState: { errors } } = useForm<ProfessionalFormData>();

    const onSubmit: SubmitHandler<ProfessionalFormData> = (data) => {
        try {
            console.log('=== DEBUG CADASTRO ===');
            console.log('Dados do formulário:', data);
            
            // Get existing users
            const existingUsersStr = localStorage.getItem('ace_users');
            const existingUsers = existingUsersStr ? JSON.parse(existingUsersStr) : [];
            
            console.log('Usuários existentes:', existingUsers);
            console.log('CPFs cadastrados:', existingUsers.map((u: any) => u.cpf));

            // Check if CPF already exists
            const cpfExists = existingUsers.some((u: any) => u.cpf === data.cpf);
            console.log('CPF já existe?', cpfExists, '(procurando:', data.cpf, ')');
            
            if (cpfExists) {
                alert('CPF já cadastrado!');
                return;
            }

            // Save new user
            const newUser = { ...data, id: crypto.randomUUID(), role: 'user' };
            console.log('Novo usuário a ser salvo:', newUser);
            
            const updatedUsers = [...existingUsers, newUser];
            localStorage.setItem('ace_users', JSON.stringify(updatedUsers));
            
            console.log('Usuários após salvar:', updatedUsers);
            console.log('localStorage atualizado!');

            alert('Profissional cadastrado com sucesso! Você já pode fazer login.');
            if (onSave) onSave();
        } catch (error) {
            console.error('Erro ao salvar:', error);
            alert('Erro ao salvar dados.');
        }
    };

    const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatCPF(e.target.value);
        setValue('cpf', formatted);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 p-4 max-w-2xl mx-auto bg-white shadow-lg rounded-lg my-8">
            <div className="bg-sus-blue text-white p-6 rounded-t-lg -m-4 mb-4">
                <div className="flex items-center gap-3 mb-2">
                    <User className="w-8 h-8" />
                    <h1 className="text-2xl font-bold">Cadastro de Profissional (ACE)</h1>
                </div>
                <p className="opacity-90 text-sm">Cadastre os dados do Agente de Combate a Endemias</p>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                        <User className="w-4 h-4 text-sus-blue" />
                        Nome do Profissional
                    </label>
                    <input
                        {...register("name", { required: "Nome é obrigatório" })}
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-sus-blue focus:border-sus-blue outline-none transition-all"
                        placeholder="Nome completo do ACE"
                    />
                    {errors.name && <span className="text-red-500 text-xs">{errors.name.message}</span>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-sus-blue" />
                            CPF (Usuário)
                        </label>
                        <input
                            {...register("cpf", {
                                required: "CPF é obrigatório",
                                minLength: { value: 14, message: "CPF incompleto" },
                                pattern: {
                                    value: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
                                    message: "Formato inválido (000.000.000-00)"
                                },
                                validate: (value) => {
                                    const cleanCPF = value.replace(/\D/g, '');
                                    return cleanCPF.length === 11 || "CPF deve ter 11 dígitos";
                                },
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
                            <FileBadge className="w-4 h-4 text-sus-blue" />
                            CNS
                        </label>
                        <input
                            {...register("cns", {
                                required: "CNS é obrigatório",
                                minLength: { value: 15, message: "CNS deve ter 15 dígitos" },
                                maxLength: { value: 15, message: "CNS deve ter 15 dígitos" },
                                pattern: { value: /^\d+$/, message: "Apenas números" }
                            })}
                            maxLength={15}
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-sus-blue focus:border-sus-blue outline-none transition-all"
                            placeholder="Número do CNS"
                            onInput={(e) => {
                                e.currentTarget.value = e.currentTarget.value.replace(/\D/g, '').slice(0, 15);
                            }}
                        />
                        {errors.cns && <span className="text-red-500 text-xs">{errors.cns.message}</span>}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-sus-blue" />
                        Microárea
                    </label>
                    <input
                        {...register("microArea", { required: "Microárea é obrigatória" })}
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-sus-blue focus:border-sus-blue outline-none transition-all"
                        placeholder="Código da Microárea"
                    />
                    {errors.microArea && <span className="text-red-500 text-xs">{errors.microArea.message}</span>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                        <Lock className="w-4 h-4 text-sus-blue" />
                        Senha
                    </label>
                    <input
                        type="password"
                        {...register("password", { required: "Senha é obrigatória", minLength: { value: 6, message: "Mínimo 6 caracteres" } })}
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-sus-blue focus:border-sus-blue outline-none transition-all"
                        placeholder="******"
                    />
                    {errors.password && <span className="text-red-500 text-xs">{errors.password.message}</span>}
                </div>
            </div>

            <div className="pt-4 border-t flex justify-end">
                <button
                    type="submit"
                    className="flex items-center gap-2 bg-sus-green hover:bg-green-700 text-white px-6 py-2 rounded font-medium shadow-md transition-colors"
                >
                    <Save className="w-5 h-5" />
                    Salvar Cadastro
                </button>
            </div>
        </form>
    );
};
