import React from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { Save, User, MapPin, FileBadge, Lock, CreditCard } from 'lucide-react';
import { formatCPF } from '../utils/masks';
import { toast } from 'sonner';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';

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
            const existingUsersStr = localStorage.getItem('ace_users');
            const existingUsers = existingUsersStr ? JSON.parse(existingUsersStr) : [];

            const cpfExists = existingUsers.some((u: any) => u.cpf === data.cpf);

            if (cpfExists) {
                toast.error('CPF já cadastrado!');
                return;
            }

            const newUser = { ...data, id: crypto.randomUUID(), role: 'user' };
            const updatedUsers = [...existingUsers, newUser];
            localStorage.setItem('ace_users', JSON.stringify(updatedUsers));

            toast.success('Profissional cadastrado com sucesso! Você já pode fazer login.');
            if (onSave) onSave();
        } catch (error) {
            console.error('Erro ao salvar:', error);
            toast.error('Erro ao salvar dados.');
        }
    };

    const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatCPF(e.target.value);
        setValue('cpf', formatted);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-3xl mx-auto my-8 px-4 sm:px-6">
            <Card className="border-t-4 border-t-sus-blue">
                <CardHeader className="bg-white border-b-0 pb-0">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <User className="w-6 h-6 text-sus-blue" />
                        </div>
                        <div>
                            <CardTitle>Cadastro de Profissional ACE</CardTitle>
                            <p className="text-sm text-slate-500">Cadastre os dados do Agente de Combate a Endemias</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <Input
                        label="Nome do Profissional"
                        icon={<User className="w-4 h-4" />}
                        {...register("name", { required: "Nome é obrigatório" })}
                        placeholder="Nome completo do ACE"
                        error={errors.name?.message}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                            label="CPF"
                            icon={<CreditCard className="w-4 h-4" />}
                            {...register("cpf", {
                                required: "CPF é obrigatório",
                                validate: (value) => {
                                    const cleanCPF = value.replace(/\D/g, '');
                                    return cleanCPF.length === 11 || "CPF deve ter 11 dígitos";
                                }
                            })}
                            onChange={handleCPFChange}
                            maxLength={14}
                            placeholder="000.000.000-00"
                            error={errors.cpf?.message}
                        />

                        <Input
                            label="CNS (Cartão SUS)"
                            icon={<FileBadge className="w-4 h-4" />}
                            {...register("cns", {
                                required: "CNS é obrigatório",
                                minLength: { value: 15, message: "CNS deve ter 15 dígitos" },
                                maxLength: { value: 15, message: "CNS deve ter 15 dígitos" },
                                pattern: { value: /^\d+$/, message: "Apenas números" }
                            })}
                            maxLength={15}
                            placeholder="000000000000000"
                            error={errors.cns?.message}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                            label="Microárea"
                            icon={<MapPin className="w-4 h-4" />}
                            {...register("microArea", { required: "Microárea é obrigatória" })}
                            placeholder="Ex: 01"
                            error={errors.microArea?.message}
                        />

                        <Input
                            label="Senha"
                            type="password"
                            icon={<Lock className="w-4 h-4" />}
                            {...register("password", {
                                required: "Senha é obrigatória",
                                minLength: { value: 6, message: "Senha deve ter no mínimo 6 caracteres" }
                            })}
                            placeholder="******"
                            error={errors.password?.message}
                        />
                    </div>

                    <div className="flex justify-end pt-4 border-t">
                        <Button
                            type="submit"
                            className="bg-sus-green hover:bg-green-700 text-white w-full sm:w-auto"
                        >
                            <Save className="w-5 h-5 mr-2" />
                            Cadastrar Profissional
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </form>
    );
};
