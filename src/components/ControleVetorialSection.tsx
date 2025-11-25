import React from 'react';
import { Plus, Trash2, Droplets, AlertTriangle } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import type { Deposito, TipoDeposito, Larvicida, ClassificacaoImovel } from '../types/controle-vetorial';

interface ControleVetorialSectionProps {
    visitIndex: number;
    depositosInspecionados: Deposito[];
    onDepositosChange: (depositos: Deposito[]) => void;
    depositosEliminados: number;
    onDepositosEliminadosChange: (value: number) => void;
    depositosTratados: number;
    onDepositosTratadosChange: (value: number) => void;
    larvicidaUtilizado?: Larvicida;
    onLarvicidaChange: (value?: Larvicida) => void;
    dosagem?: string;
    onDosagemChange: (value: string) => void;
    classificacaoImovel: ClassificacaoImovel;
    onClassificacaoChange: (value: ClassificacaoImovel) => void;
    motivoRecusa?: string;
    onMotivoRecusaChange: (value: string) => void;
}

const TIPOS_DEPOSITO: { value: TipoDeposito; label: string }[] = [
    { value: 'pneu', label: 'Pneu' },
    { value: 'caixaDagua', label: 'Caixa d\'água' },
    { value: 'pratoPlantas', label: 'Prato de plantas' },
    { value: 'lixo', label: 'Lixo/Resíduos' },
    { value: 'piscina', label: 'Piscina' },
    { value: 'calha', label: 'Calha' },
    { value: 'tambor', label: 'Tambor/Tonel' },
    { value: 'poco', label: 'Poço/Cisterna' },
    { value: 'cisterna', label: 'Cisterna' },
    { value: 'outros', label: 'Outros' },
];

const LARVICIDAS: { value: Larvicida; label: string }[] = [
    { value: 'temefos', label: 'Temefós (organofosforado)' },
    { value: 'BTI', label: 'BTI (Bacillus thuringiensis)' },
    { value: 'pyriproxyfen', label: 'Pyriproxyfen (regulador crescimento)' },
    { value: 'diflubenzuron', label: 'Diflubenzuron (inibidor quitina)' },
];

const CLASSIFICACOES: { value: ClassificacaoImovel; label: string; color: string }[] = [
    { value: 'A+', label: 'A+ (Positivo para larvas)', color: 'text-red-700 bg-red-50' },
    { value: 'B', label: 'B (Recusado)', color: 'text-yellow-700 bg-yellow-50' },
    { value: 'C', label: 'C (Fechado)', color: 'text-gray-700 bg-gray-50' },
    { value: 'D1', label: 'D1 (Desabitado)', color: 'text-blue-700 bg-blue-50' },
    { value: 'E', label: 'E (Comercial/Terreno baldio)', color: 'text-purple-700 bg-purple-50' },
];

export const ControleVetorialSection: React.FC<ControleVetorialSectionProps> = ({
    depositosInspecionados,
    onDepositosChange,
    depositosEliminados,
    onDepositosEliminadosChange,
    depositosTratados,
    onDepositosTratadosChange,
    larvicidaUtilizado,
    onLarvicidaChange,
    dosagem,
    onDosagemChange,
    classificacaoImovel,
    onClassificacaoChange,
    motivoRecusa,
    onMotivoRecusaChange,
}) => {
    const adicionarDeposito = () => {
        const novoDeposito: Deposito = {
            tipo: 'pneu',
            quantidade: 1,
            comLarvas: false,
        };
        onDepositosChange([...depositosInspecionados, novoDeposito]);
    };

    const removerDeposito = (index: number) => {
        const novosDepositos = depositosInspecionados.filter((_, i) => i !== index);
        onDepositosChange(novosDepositos);
    };

    const atualizarDeposito = (index: number, campo: keyof Deposito, valor: any) => {
        const novosDepositos = [...depositosInspecionados];
        novosDepositos[index] = { ...novosDepositos[index], [campo]: valor };
        onDepositosChange(novosDepositos);
    };

    const totalLarvas = depositosInspecionados.filter(d => d.comLarvas).reduce((sum, d) => sum + d.quantidade, 0);

    return (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-4">
            <div className="flex items-center gap-2 mb-2">
                <Droplets className="w-5 h-5 text-amber-700" />
                <h4 className="font-semibold text-amber-900">Controle Vetorial</h4>
            </div>

            {/* Classificação do Imóvel */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                    Classificação do Imóvel *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
                    {CLASSIFICACOES.map(({ value, label, color }) => (
                        <button
                            key={value}
                            type="button"
                            onClick={() => onClassificacaoChange(value)}
                            className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${classificacaoImovel === value
                                    ? `${color} border-current`
                                    : 'border-slate-200 bg-white hover:bg-slate-50'
                                }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Motivo da Recusa (se B) */}
            {classificacaoImovel === 'B' && (
                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                    <label className="block text-sm font-medium text-yellow-900 mb-2">
                        <AlertTriangle className="w-4 h-4 inline mr-1" />
                        Motivo da Recusa
                    </label>
                    <textarea
                        value={motivoRecusa || ''}
                        onChange={(e) => onMotivoRecusaChange(e.target.value)}
                        className="w-full p-2 border border-yellow-300 rounded focus:ring-2 focus:ring-yellow-500"
                        rows={2}
                        placeholder="Descreva o motivo da recusa..."
                    />
                </div>
            )}

            {/* Depósitos Inspecionados */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-slate-700">
                        Depósitos Inspecionados
                    </label>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={adicionarDeposito}
                    >
                        <Plus className="w-4 h-4 mr-1" />
                        Adicionar
                    </Button>
                </div>

                {depositosInspecionados.length === 0 ? (
                    <div className="text-center py-4 text-slate-500 text-sm bg-white rounded border border-dashed">
                        Nenhum depósito registrado
                    </div>
                ) : (
                    <div className="space-y-2">
                        {depositosInspecionados.map((deposito, index) => (
                            <div key={index} className="bg-white p-3 rounded border border-slate-200 grid grid-cols-1 md:grid-cols-12 gap-2 items-start">
                                <div className="md:col-span-4">
                                    <Select
                                        options={TIPOS_DEPOSITO.map(t => ({ value: t.value, label: t.label }))}
                                        value={deposito.tipo}
                                        onChange={(e) => atualizarDeposito(index, 'tipo', e.target.value as TipoDeposito)}
                                    />
                                </div>

                                {deposito.tipo === 'outros' && (
                                    <div className="md:col-span-3">
                                        <Input
                                            placeholder="Especifique"
                                            value={deposito.outroTipo || ''}
                                            onChange={(e) => atualizarDeposito(index, 'outroTipo', e.target.value)}
                                        />
                                    </div>
                                )}

                                <div className={deposito.tipo === 'outros' ? 'md:col-span-2' : 'md:col-span-3'}>
                                    <Input
                                        type="number"
                                        min="0"
                                        placeholder="Qtd"
                                        value={deposito.quantidade}
                                        onChange={(e) => atualizarDeposito(index, 'quantidade', parseInt(e.target.value) || 0)}
                                    />
                                </div>

                                <div className={`flex items-center gap-2 ${deposito.tipo === 'outros' ? 'md:col-span-2' : 'md:col-span-4'}`}>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={deposito.comLarvas}
                                            onChange={(e) => atualizarDeposito(index, 'comLarvas', e.target.checked)}
                                            className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-2 focus:ring-red-600"
                                        />
                                        <span className="text-sm text-slate-700">Com larvas</span>
                                    </label>

                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removerDeposito(index)}
                                        className="ml-auto text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}

                        {totalLarvas > 0 && (
                            <div className="bg-red-50 border border-red-200 p-2 rounded text-sm font-medium text-red-800">
                                ⚠️ Total de depósitos com larvas: {totalLarvas}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Ações Realizadas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                    label="Depósitos Eliminados"
                    type="number"
                    min="0"
                    value={depositosEliminados}
                    onChange={(e) => onDepositosEliminadosChange(parseInt(e.target.value) || 0)}
                />

                <Input
                    label="Depósitos Tratados (larvicida)"
                    type="number"
                    min="0"
                    value={depositosTratados}
                    onChange={(e) => onDepositosTratadosChange(parseInt(e.target.value) || 0)}
                />
            </div>

            {/* Larvicida */}
            {depositosTratados > 0 && (
                <div className="bg-blue-50 p-3 rounded border border-blue-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                        label="Larvicida Utilizado"
                        options={[
                            { value: '', label: 'Selecione...' },
                            ...LARVICIDAS.map(l => ({ value: l.value, label: l.label }))
                        ]}
                        value={larvicidaUtilizado || ''}
                        onChange={(e) => onLarvicidaChange(e.target.value as Larvicida || undefined)}
                    />

                    <Input
                        label="Dosagem / Quantidade"
                        placeholder="Ex: 1g por 10L"
                        value={dosagem || ''}
                        onChange={(e) => onDosagemChange(e.target.value)}
                    />
                </div>
            )}
        </div>
    );
};
