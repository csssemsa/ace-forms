import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { AlertCircle, User, Calendar, Phone, MapPin, Activity, FileText, Send } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { createNotification } from '../services/notificationService';
import { useAuth } from '../contexts/AuthContext';
import type { NotificationFormData, Sintomas, SinaisAlarme } from '../types/notification';

export const NotificationForm: React.FC = () => {
    const { register, handleSubmit, watch, formState: { errors } } = useForm<NotificationFormData>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const temSinaisAlarme = watch('temSinaisAlarme', false);
    const encaminhadoParaUBS = watch('encaminhadoParaUBS', false);

    const onSubmit = (data: NotificationFormData) => {
        try {
            // Adicionar dados do profissional logado
            const notificationData: NotificationFormData = {
                ...data,
                profissionalNotificador: user?.cpf || '',
                nomeProfissional: user?.name || '',
            };

            createNotification(notificationData);
            toast.success('Notificação registrada com sucesso!');
            navigate('/notificacoes');
        } catch (error) {
            console.error('Erro ao criar notificação:', error);
            toast.error('Erro ao registrar notificação');
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-5xl mx-auto my-8 px-4 sm:px-6">
            {/* Header */}
            <Card className="border-t-4 border-t-red-600">
                <CardHeader className="bg-white border-b-0 pb-0">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-red-50 rounded-lg">
                            <AlertCircle className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                            <CardTitle>Notificação de Caso Suspeito</CardTitle>
                            <p className="text-sm text-slate-500">Sistema de notificação de arboviroses (SINAN)</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Dados do Paciente */}
                    <div className="border-b pb-6">
                        <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
                            <User className="w-5 h-5" />
                            Identificação do Paciente
                        </h3>

                        <div className="space-y-4">
                            <Input
                                label="Nome Completo *"
                                {...register('nomePaciente', { required: 'Nome é obrigatório' })}
                                placeholder="Nome completo do paciente"
                                error={errors.nomePaciente?.message}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Input
                                    label="Data de Nascimento *"
                                    type="date"
                                    icon={<Calendar className="w-4 h-4" />}
                                    {...register('dataNascimento', { required: 'Data de nascimento é obrigatória' })}
                                    error={errors.dataNascimento?.message}
                                />

                                <Select
                                    label="Sexo *"
                                    {...register('sexo', { required: 'Sexo é obrigatório' })}
                                    options={[
                                        { value: '', label: 'Selecione...' },
                                        { value: 'M', label: 'Masculino' },
                                        { value: 'F', label: 'Feminino' },
                                    ]}
                                    error={errors.sexo?.message}
                                />

                                <Input
                                    label="CNS (Cartão SUS) *"
                                    {...register('cns', {
                                        required: 'CNS é obrigatório',
                                        pattern: { value: /^\d{15}$/, message: 'CNS deve ter 15 dígitos' }
                                    })}
                                    maxLength={15}
                                    placeholder="000000000000000"
                                    error={errors.cns?.message}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Telefone"
                                    type="tel"
                                    icon={<Phone className="w-4 h-4" />}
                                    {...register('telefone')}
                                    placeholder="(00) 00000-0000"
                                />

                                <Input
                                    label="Município"
                                    icon={<MapPin className="w-4 h-4" />}
                                    {...register('municipio')}
                                    placeholder="Nome do município"
                                />
                            </div>

                            <Input
                                label="Endereço Completo *"
                                {...register('endereco', { required: 'Endereço é obrigatório' })}
                                placeholder="Logradouro, número, complemento"
                                error={errors.endereco?.message}
                            />

                            <Input
                                label="Bairro"
                                {...register('bairro')}
                                placeholder="Nome do bairro"
                            />
                        </div>
                    </div>

                    {/* Dados Clínicos */}
                    <div className="border-b pb-6">
                        <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
                            <Activity className="w-5 h-5" />
                            Dados Clínicos
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <Input
                                label="Data de Início dos Sintomas *"
                                type="date"
                                icon={<Calendar className="w-4 h-4" />}
                                {...register('dataInicioSintomas', { required: 'Data é obrigatória' })}
                                error={errors.dataInicioSintomas?.message}
                            />

                            <Select
                                label="Doença Suspeita *"
                                {...register('doencaSuspeita', { required: 'Doença suspeita é obrigatória' })}
                                options={[
                                    { value: '', label: 'Selecione...' },
                                    { value: 'dengue', label: 'Dengue' },
                                    { value: 'zika', label: 'Zika' },
                                    { value: 'chikungunya', label: 'Chikungunya' },
                                    { value: 'todas', label: 'Suspeita múltipla' },
                                ]}
                                error={errors.doencaSuspeita?.message}
                            />
                        </div>

                        {/* Sintomas */}
                        <div className="bg-slate-50 p-4 rounded-lg">
                            <h4 className="font-medium text-slate-700 mb-3">Sintomas Apresentados</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {[
                                    { key: 'febre', label: 'Febre' },
                                    { key: 'cefaleia', label: 'Cefaleia (dor de cabeça)' },
                                    { key: 'mialgia', label: 'Mialgia (dor muscular)' },
                                    { key: 'artralgia', label: 'Artralgia (dor nas articulações)' },
                                    { key: 'exantema', label: 'Exantema (manchas na pele)' },
                                    { key: 'dorRetroorbital', label: 'Dor retroorbital' },
                                    { key: 'nausea', label: 'Náusea' },
                                    { key: 'vomito', label: 'Vômito' },
                                    { key: 'manchasVermelhas', label: 'Manchas vermelhasna pele' },
                                    { key: 'prostacao', label: 'Prostração' },
                                ].map(({ key, label }) => (
                                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            {...register(`sintomas.${key as keyof Sintomas}`)}
                                            className="w-4 h-4 text-sus-blue border-gray-300 rounded focus:ring-2 focus:ring-sus-blue"
                                        />
                                        <span className="text-sm text-slate-700">{label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Sinais de Alarme */}
                        <div className="mt-4">
                            <label className="flex items-center gap-2 cursor-pointer mb-3">
                                <input
                                    type="checkbox"
                                    {...register('temSinaisAlarme')}
                                    className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-2 focus:ring-red-600"
                                />
                                <span className="font-medium text-slate-700">Apresenta Sinais de Alarme</span>
                            </label>

                            {temSinaisAlarme && (
                                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                                    <h4 className="font-medium text-red-800 mb-3">⚠️ Sinais de Alarme Identificados</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {[
                                            { key: 'dorAbdominal', label: 'Dor abdominal intensa' },
                                            { key: 'vomitoPersistente', label: 'Vômito persistente' },
                                            { key: 'sangramento', label: 'Sangramento (mucosas, etc.)' },
                                            { key: 'letargia', label: 'Letargia/irritabilidade' },
                                            { key: 'hipotensao', label: 'Hipotensão postural' },
                                            { key: 'hepatomegalia', label: 'Hepatomegalia' },
                                            { key: 'acumuloLiquidos', label: 'Acúmulo de líquidos' },
                                        ].map(({ key, label }) => (
                                            <label key={key} className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    {...register(`sinaisAlarme.${key as keyof SinaisAlarme}`)}
                                                    className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-2 focus:ring-red-600"
                                                />
                                                <span className="text-sm text-slate-700">{label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Classificação */}
                    <div className="border-b pb-6">
                        <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Classificação do Caso
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Select
                                label="Classificação *"
                                {...register('caso', { required: 'Classificação é obrigatória' })}
                                options={[
                                    { value: '', label: 'Selecione...' },
                                    { value: 'suspeito', label: 'Suspeito' },
                                    { value: 'confirmado_laboratorial', label: 'Confirmado Laboratorial' },
                                    { value: 'confirmado_clinico', label: 'Confirmado Clínico' },
                                    { value: 'descartado', label: 'Descartado' },
                                ]}
                                error={errors.caso?.message}
                            />

                            <Select
                                label="Gravidade *"
                                {...register('gravidade', { required: 'Gravidade é obrigatória' })}
                                options={[
                                    { value: '', label: 'Selecione...' },
                                    { value: 'classica', label: 'Clássica (sem complicações)' },
                                    { value: 'com_sinais_alarme', label: 'Com Sinais de Alarme' },
                                    { value: 'grave', label: 'Grave' },
                                ]}
                                error={errors.gravidade?.message}
                            />
                        </div>
                    </div>

                    {/* Encaminhamento */}
                    <div>
                        <h3 className="text-lg font-semibold text-slate-700 mb-4">Encaminhamento</h3>

                        <label className="flex items-center gap-2 cursor-pointer mb-3">
                            <input
                                type="checkbox"
                                {...register('encaminhadoParaUBS')}
                                className="w-4 h-4 text-sus-blue border-gray-300 rounded focus:ring-2 focus:ring-sus-blue"
                            />
                            <span className="font-medium text-slate-700">Encaminhado para Unidade de Saúde</span>
                        </label>

                        {encaminhadoParaUBS && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <Input
                                    label="Nome da UBS"
                                    {...register('nomeUBS')}
                                    placeholder="Ex: UBS São Jorge"
                                />

                                <Input
                                    label="Data do Encaminhamento"
                                    type="date"
                                    {...register('dataEncaminhamento')}
                                />
                            </div>
                        )}

                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                {...register('hospitalizacao')}
                                className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-2 focus:ring-red-600"
                            />
                            <span className="font-medium text-slate-700">Requer Hospitalização</span>
                        </label>
                    </div>

                    {/* Observações */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Observações Adicionais
                        </label>
                        <textarea
                            {...register('observacoes')}
                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sus-blue focus:border-transparent"
                            rows={4}
                            placeholder="Informações complementares sobre o caso..."
                        />
                    </div>

                    {/* Botões de Ação */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate('/notificacoes')}
                            className="flex-1 sm:flex-initial"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                        >
                            <Send className="w-5 h-5 mr-2" />
                            Enviar Notificação
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </form>
    );
};
