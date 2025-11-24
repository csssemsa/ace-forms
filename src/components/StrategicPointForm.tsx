import React from 'react';
import { useForm, useFieldArray, type SubmitHandler } from 'react-hook-form';
import { Plus, Trash2, Save, AlertTriangle } from 'lucide-react';
import type { VisitationFormData, StrategicPointType, ContainerType } from '../types/form';

const STRATEGIC_POINT_TYPES: { value: StrategicPointType; label: string }[] = [
    { value: 'borracharia', label: 'Borracharia' },
    { value: 'cemiterio', label: 'Cemitério' },
    { value: 'ferro_velho', label: 'Ferro-velho / Sucata' },
    { value: 'deposito_construcao', label: 'Depósito de Construção' },
    { value: 'deposito_reciclagem', label: 'Depósito de Reciclagem' },
    { value: 'garagem', label: 'Garagem de Veículos' },
    { value: 'outros', label: 'Outros' },
];

const CONTAINER_TYPES: { value: ContainerType; label: string }[] = [
    { value: 'pneus', label: 'Pneus' },
    { value: 'vasos', label: 'Vasos / Pratinhos' },
    { value: 'garrafas', label: 'Garrafas / Latas' },
    { value: 'caixa_dagua', label: 'Caixa d\'água descoberta' },
    { value: 'calhas', label: 'Calhas entupidas' },
    { value: 'lixo', label: 'Lixo acumulado' },
    { value: 'outros', label: 'Outros recipientes' },
];

interface StrategicPointFormProps {
    user?: any;
}

export const StrategicPointForm: React.FC<StrategicPointFormProps> = ({ user }) => {
    const { register, control, handleSubmit, watch } = useForm<VisitationFormData>({
        defaultValues: {
            professionalName: user?.name || '',
            date: new Date().toISOString().split('T')[0],
            visits: [{
                id: crypto.randomUUID(),
                motives: ['controle_vetorial'],
                outcome: 'realized',
                shift: 'morning',
                microArea: user?.microArea || '',
                propertyType: 'ponto_estrategico',
                hasStandingWater: false,
                larvaeFound: false,
                adultMosquitoes: false,
                mechanicalControl: false,
                chemicalTreatment: false,
                guidanceProvided: false,
                notificationIssued: false,
                requiresReturn: false,
                containerTypes: [],
                focusCount: 0
            }]
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "visits"
    });

    const onSubmit: SubmitHandler<VisitationFormData> = (data) => {
        console.log(JSON.stringify(data, null, 2));
        alert('Dados de controle vetorial salvos no console (F12)');
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 p-4 max-w-5xl mx-auto bg-white shadow-lg rounded-lg my-8">
            <div className="bg-amber-600 text-white p-6 rounded-t-lg -m-4 mb-4">
                <div className="flex items-center gap-3 mb-4">
                    <AlertTriangle className="w-8 h-8" />
                    <h1 className="text-2xl font-bold">Ficha de Controle Vetorial - Pontos Estratégicos</h1>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 opacity-90">Profissional</label>
                        <input
                            {...register("professionalName", { required: true })}
                            readOnly
                            className="w-full p-2 rounded text-slate-900 bg-slate-100 cursor-not-allowed"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 opacity-90">Data</label>
                        <input
                            type="date"
                            {...register("date", { required: true })}
                            className="w-full p-2 rounded text-slate-900"
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                {fields.map((field, index) => {
                    const propertyType = watch(`visits.${index}.propertyType`);
                    const isTerreno = propertyType === 'terreno';

                    return (
                        <div key={field.id} className="border-2 border-amber-200 rounded-lg p-4 bg-amber-50 relative">
                            <div className="absolute top-4 right-4">
                                <button
                                    type="button"
                                    onClick={() => remove(index)}
                                    className="text-red-500 hover:text-red-700 p-1"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>

                            <h3 className="text-lg font-semibold text-amber-700 mb-4">Inspeção #{index + 1}</h3>

                            {/* Informações Básicas */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Turno</label>
                                    <select {...register(`visits.${index}.shift`)} className="w-full p-2 border rounded">
                                        <option value="morning">Manhã</option>
                                        <option value="afternoon">Tarde</option>
                                        <option value="night">Noite</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Microárea</label>
                                    <input {...register(`visits.${index}.microArea`)} className="w-full p-2 border rounded" placeholder="00" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Local *</label>
                                    <select {...register(`visits.${index}.propertyType`)} className="w-full p-2 border rounded">
                                        <option value="ponto_estrategico">Ponto Estratégico</option>
                                        <option value="terreno">Terreno Baldio</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Desfecho</label>
                                    <select {...register(`visits.${index}.outcome`)} className="w-full p-2 border rounded">
                                        <option value="realized">Realizada</option>
                                        <option value="refused">Recusada</option>
                                        <option value="absent">Fechado</option>
                                    </select>
                                </div>
                            </div>

                            {/* Tipo de Ponto Estratégico */}
                            {!isTerreno && (
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Ponto Estratégico</label>
                                    <select {...register(`visits.${index}.strategicPointType`)} className="w-full p-2 border rounded">
                                        {STRATEGIC_POINT_TYPES.map(type => (
                                            <option key={type.value} value={type.value}>{type.label}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Endereço */}
                            <div className="border-t pt-4 mt-4 mb-4">
                                <h4 className="font-medium text-slate-700 mb-3">Localização</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Endereço Completo *</label>
                                        <input
                                            {...register(`visits.${index}.address`, { required: true })}
                                            className="w-full p-2 border rounded"
                                            placeholder="Rua, número, bairro"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Responsável</label>
                                        <input
                                            {...register(`visits.${index}.responsibleName`)}
                                            className="w-full p-2 border rounded"
                                            placeholder="Nome do responsável"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Telefone</label>
                                        <input
                                            {...register(`visits.${index}.responsiblePhone`)}
                                            className="w-full p-2 border rounded"
                                            placeholder="(00) 00000-0000"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Avaliação de Risco */}
                            <div className="border-t pt-4 mt-4 mb-4 bg-white p-4 rounded">
                                <h4 className="font-medium text-amber-700 mb-3">Avaliação de Risco</h4>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                    <label className="flex items-center space-x-2 p-2 border rounded hover:bg-slate-50 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            {...register(`visits.${index}.hasStandingWater`)}
                                            className="rounded text-amber-600"
                                        />
                                        <span className="text-sm">Água parada</span>
                                    </label>
                                    <label className="flex items-center space-x-2 p-2 border rounded hover:bg-slate-50 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            {...register(`visits.${index}.larvaeFound`)}
                                            className="rounded text-amber-600"
                                        />
                                        <span className="text-sm">Larvas encontradas</span>
                                    </label>
                                    <label className="flex items-center space-x-2 p-2 border rounded hover:bg-slate-50 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            {...register(`visits.${index}.adultMosquitoes`)}
                                            className="rounded text-amber-600"
                                        />
                                        <span className="text-sm">Mosquitos adultos</span>
                                    </label>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Nº de focos</label>
                                        <input
                                            type="number"
                                            {...register(`visits.${index}.focusCount`, { valueAsNumber: true })}
                                            className="w-full p-2 border rounded"
                                            min="0"
                                        />
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Tipos de Recipientes Encontrados</label>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                        {CONTAINER_TYPES.map(container => (
                                            <label key={container.value} className="flex items-center space-x-2 text-sm p-2 border rounded hover:bg-slate-50 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    value={container.value}
                                                    {...register(`visits.${index}.containerTypes`)}
                                                    className="rounded text-amber-600"
                                                />
                                                <span>{container.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Nível de Infestação</label>
                                    <select {...register(`visits.${index}.infestationLevel`)} className="w-full p-2 border rounded">
                                        <option value="">Não avaliado</option>
                                        <option value="baixo">Baixo</option>
                                        <option value="medio">Médio</option>
                                        <option value="alto">Alto</option>
                                    </select>
                                </div>
                            </div>

                            {/* Ações Realizadas */}
                            <div className="border-t pt-4 mt-4 bg-green-50 p-4 rounded">
                                <h4 className="font-medium text-green-700 mb-3">Ações Realizadas</h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    <label className="flex items-center space-x-2 p-2 border rounded hover:bg-white cursor-pointer">
                                        <input
                                            type="checkbox"
                                            {...register(`visits.${index}.mechanicalControl`)}
                                            className="rounded text-green-600"
                                        />
                                        <span className="text-sm">Controle mecânico</span>
                                    </label>
                                    <label className="flex items-center space-x-2 p-2 border rounded hover:bg-white cursor-pointer">
                                        <input
                                            type="checkbox"
                                            {...register(`visits.${index}.chemicalTreatment`)}
                                            className="rounded text-green-600"
                                        />
                                        <span className="text-sm">Tratamento químico</span>
                                    </label>
                                    <label className="flex items-center space-x-2 p-2 border rounded hover:bg-white cursor-pointer">
                                        <input
                                            type="checkbox"
                                            {...register(`visits.${index}.guidanceProvided`)}
                                            className="rounded text-green-600"
                                        />
                                        <span className="text-sm">Orientações fornecidas</span>
                                    </label>
                                    <label className="flex items-center space-x-2 p-2 border rounded hover:bg-white cursor-pointer">
                                        <input
                                            type="checkbox"
                                            {...register(`visits.${index}.notificationIssued`)}
                                            className="rounded text-green-600"
                                        />
                                        <span className="text-sm">Notificação emitida</span>
                                    </label>
                                    <label className="flex items-center space-x-2 p-2 border rounded hover:bg-white cursor-pointer">
                                        <input
                                            type="checkbox"
                                            {...register(`visits.${index}.requiresReturn`)}
                                            className="rounded text-green-600"
                                        />
                                        <span className="text-sm">Requer retorno</span>
                                    </label>
                                </div>
                            </div>

                            {/* Observações */}
                            <div className="mt-4">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Observações</label>
                                <textarea
                                    {...register(`visits.${index}.observations`)}
                                    className="w-full p-2 border rounded"
                                    rows={3}
                                    placeholder="Condições gerais, dificuldades encontradas, necessidade de ações complementares..."
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
                <button
                    type="button"
                    onClick={() => append({
                        id: crypto.randomUUID(),
                        motives: ['controle_vetorial'],
                        outcome: 'realized',
                        shift: 'morning',
                        microArea: user?.microArea || '',
                        propertyType: 'ponto_estrategico',
                        hasStandingWater: false,
                        larvaeFound: false,
                        adultMosquitoes: false,
                        mechanicalControl: false,
                        chemicalTreatment: false,
                        guidanceProvided: false,
                        notificationIssued: false,
                        requiresReturn: false,
                        containerTypes: [],
                        focusCount: 0
                    })}
                    className="flex items-center gap-2 text-amber-600 hover:bg-amber-50 px-4 py-2 rounded font-medium border border-amber-600"
                >
                    <Plus className="w-5 h-5" />
                    Adicionar Inspeção
                </button>

                <button
                    type="submit"
                    className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded font-medium shadow-md"
                >
                    <Save className="w-5 h-5" />
                    Salvar Ficha
                </button>
            </div>
        </form>
    );
};
