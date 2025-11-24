import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray, type SubmitHandler } from 'react-hook-form';
import { Plus, Trash2, Save, FileText, Search, X, UserPlus } from 'lucide-react';
import type { VisitationFormData, VisitMotive, Sex } from '../types/form';
import { searchCitizenByName, searchCitizenByCNS, addCitizen, type Citizen } from '../services/citizenService';
import { getUFs, getMunicipiosByUF, type UF, type Municipio } from '../services/ibgeService';
import { saveVisitRecord } from '../services/visitService';

const MOTIVES: { value: VisitMotive; label: string }[] = [
    { value: 'cadastramento_atualizacao', label: 'Cadastramento / Atualização' },
    { value: 'visita_periodica', label: 'Visita Periódica' },
    { value: 'busca_ativa', label: 'Busca Ativa' },
    { value: 'acompanhamento', label: 'Acompanhamento' },
    { value: 'controle_vetorial', label: 'Controle Vetorial' },
    { value: 'egresso_internacao', label: 'Egresso de Internação' },
    { value: 'convite_coletivo', label: 'Convite Ativ. Coletiva' },
    { value: 'orientacao_prevencao', label: 'Orientação / Prevenção' },
    { value: 'outros', label: 'Outros' },
];

interface VisitationFormProps {
    user?: any;
}

export const VisitationForm: React.FC<VisitationFormProps> = ({ user }) => {
    const { register, control, handleSubmit, setValue, formState: { errors } } = useForm<VisitationFormData>({
        defaultValues: {
            professionalName: user?.name || '',
            date: new Date().toISOString().split('T')[0],
            visits: [{
                id: crypto.randomUUID(),
                motives: [],
                outcome: 'realized',
                shift: 'morning',
                microArea: user?.microArea || '',
                propertyType: 'domicilio',
                address: ''
            }]
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "visits"
    });

    // Estados para Busca
    const [searchModalOpen, setSearchModalOpen] = useState(false);
    const [currentVisitIndex, setCurrentVisitIndex] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Citizen[]>([]);
    const [searching, setSearching] = useState(false);

    // Estados para Cadastro Rápido
    const [registerModalOpen, setRegisterModalOpen] = useState(false);
    const [newCitizen, setNewCitizen] = useState({
        cns: '',
        name: '',
        dateOfBirth: '',
        sex: 'M' as Sex,
        address: '',
        uf: '',
        municipioCode: '',
        municipioName: ''
    });

    // Estados para IBGE no Cadastro Rápido
    const [ufs, setUfs] = useState<UF[]>([]);
    const [municipios, setMunicipios] = useState<Municipio[]>([]);

    // Campos separados de endereço para cadastro rápido
    const [addressFields, setAddressFields] = useState({
        cep: '',
        logradouro: '',
        numero: '',
        complemento: '',
        bairro: ''
    });

    useEffect(() => {
        loadUFs();
    }, []);

    useEffect(() => {
        if (newCitizen.uf) {
            loadMunicipios(newCitizen.uf);
        } else {
            setMunicipios([]);
        }
    }, [newCitizen.uf]);

    const loadUFs = async () => {
        const data = await getUFs();
        setUfs(data);
    };

    const loadMunicipios = async (uf: string) => {
        const data = await getMunicipiosByUF(uf);
        setMunicipios(data);
    };

    const onSubmit: SubmitHandler<VisitationFormData> = (data) => {
        try {
            // Identificar tipo de visita predominante (simplificação: se tiver algum imóvel não-domicílio, considera vetorial/outros, ou mantém domiciliar padrão)
            // Na verdade, o tipo é definido por ficha, mas aqui estamos salvando uma ficha que pode ter várias visitas.
            // Vamos assumir 'domiciliar' como padrão para este formulário, ou adicionar um seletor de tipo de ficha no topo.
            // Por enquanto, vamos salvar como 'domiciliar' já que é o foco principal.

            // Validar se há endereços preenchidos
            const hasEmptyAddresses = data.visits.some(v => !v.address || v.address.trim().length < 5);
            if (hasEmptyAddresses) {
                if (!confirm('Algumas visitas estão sem endereço completo ou muito curto. Elas podem não aparecer no mapa. Deseja salvar mesmo assim?')) {
                    return;
                }
            }

            saveVisitRecord(data.visits, user, 'domiciliar', data.date);

            alert('Ficha de visita salva com sucesso!');

            // Opcional: Limpar formulário ou redirecionar
            // reset(); 
        } catch (error) {
            console.error('Erro ao salvar ficha:', error);
            alert('Erro ao salvar ficha de visita.');
        }
    };

    const handleSearchCitizen = async (visitIndex: number) => {
        setCurrentVisitIndex(visitIndex);
        setSearchModalOpen(true);
        setSearchQuery('');
        setSearchResults([]);
    };

    const performSearch = async () => {
        if (!searchQuery.trim()) return;

        setSearching(true);
        try {
            // Tentar buscar por CNS primeiro
            if (/^\d{15}$/.test(searchQuery.replace(/\D/g, ''))) {
                const citizen = await searchCitizenByCNS(searchQuery.replace(/\D/g, ''));
                setSearchResults(citizen ? [citizen] : []);
            } else {
                // Buscar por nome
                const citizens = await searchCitizenByName(searchQuery);
                setSearchResults(citizens);
            }
        } catch (error) {
            console.error('Erro ao buscar cidadão:', error);
            setSearchResults([]);
        } finally {
            setSearching(false);
        }
    };

    const selectCitizen = (citizen: Citizen) => {
        if (currentVisitIndex === null) return;

        // Usar setValue para garantir que o react-hook-form capture os dados
        const visitPath = `visits.${currentVisitIndex}` as const;

        setValue(`${visitPath}.citizenName`, citizen.name, { shouldValidate: true, shouldDirty: true });
        setValue(`${visitPath}.citizenCNS`, citizen.cns, { shouldValidate: true, shouldDirty: true });
        setValue(`${visitPath}.dateOfBirth`, citizen.dateOfBirth, { shouldValidate: true, shouldDirty: true });
        setValue(`${visitPath}.address`, citizen.address, { shouldValidate: true, shouldDirty: true });

        setSearchModalOpen(false);
        setSearchQuery('');
        setSearchResults([]);
    };

    // Função auxiliar para montar o endereço completo
    const buildFullAddress = (fields: typeof addressFields, uf: string, municipioName: string) => {
        const parts = [];
        if (fields.logradouro) parts.push(fields.logradouro);
        if (fields.numero) parts.push(fields.numero);
        if (fields.complemento) parts.push(fields.complemento);
        if (fields.bairro) parts.push(fields.bairro);
        if (municipioName) parts.push(municipioName);
        if (uf) parts.push(uf);
        if (fields.cep) parts.push(`CEP: ${fields.cep}`);

        return parts.join(', ');
    };

    const updateAddressField = (field: keyof typeof addressFields, value: string) => {
        const newFields = { ...addressFields, [field]: value };
        setAddressFields(newFields);

        // Buscar nome do município atual (se houver)
        const municipio = municipios.find(m => m.id.toString() === newCitizen.municipioCode);
        const municipioName = municipio ? municipio.nome : '';

        setNewCitizen(prev => ({
            ...prev,
            address: buildFullAddress(newFields, prev.uf || '', municipioName)
        }));
    };

    const handleRegisterCitizen = () => {
        if (!newCitizen.cns || !newCitizen.name || !newCitizen.dateOfBirth) {
            alert('Preencha todos os campos obrigatórios (CNS, Nome e Data de Nascimento)');
            return;
        }

        if (newCitizen.cns.length !== 15) {
            alert('CNS deve ter 15 dígitos');
            return;
        }

        try {
            // Buscar nome do município
            const municipio = municipios.find(m => m.id.toString() === newCitizen.municipioCode);

            const citizenToSave: any = {
                ...newCitizen,
                municipioName: municipio ? municipio.nome : undefined
            };

            addCitizen(citizenToSave);
            alert('Cidadão cadastrado com sucesso!');

            // Preencher formulário com dados do novo cidadão
            selectCitizen(citizenToSave as Citizen);

            // Fechar modais e resetar
            setRegisterModalOpen(false);
            setNewCitizen({
                cns: '',
                name: '',
                dateOfBirth: '',
                sex: 'M',
                address: '',
                uf: '',
                municipioCode: '',
                municipioName: ''
            });
            setAddressFields({
                cep: '',
                logradouro: '',
                numero: '',
                complemento: '',
                bairro: ''
            });
        } catch (error) {
            console.error('Erro ao cadastrar cidadão:', error);
            alert('Erro ao cadastrar cidadão');
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 p-4 max-w-4xl mx-auto bg-white shadow-lg rounded-lg my-8">
            <div className="bg-sus-blue text-white p-6 rounded-t-lg -m-4 mb-4">
                <div className="flex items-center gap-3 mb-4">
                    <FileText className="w-8 h-8" />
                    <h1 className="text-2xl font-bold">Ficha de Visita Domiciliar e Territorial</h1>
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
                {fields.map((field, index) => (
                    <div key={field.id} className="border border-slate-200 rounded-lg p-4 bg-slate-50 relative">
                        <div className="absolute top-4 right-4">
                            <button
                                type="button"
                                onClick={() => remove(index)}
                                className="text-red-500 hover:text-red-700 p-1"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>

                        <h3 className="text-lg font-semibold text-sus-blue mb-4">Visita #{index + 1}</h3>

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
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo Imóvel</label>
                                <select {...register(`visits.${index}.propertyType`)} className="w-full p-2 border rounded">
                                    <option value="domicilio">Domicílio</option>
                                    <option value="comercio">Comércio</option>
                                    <option value="escola">Escola</option>
                                    <option value="outros">Outros</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Desfecho</label>
                                <select {...register(`visits.${index}.outcome`)} className="w-full p-2 border rounded">
                                    <option value="realized">Realizada</option>
                                    <option value="refused">Recusada</option>
                                    <option value="absent">Ausente</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Cidadão</label>
                                <div className="flex gap-2">
                                    <input
                                        {...register(`visits.${index}.citizenName`, { required: "Nome do cidadão é obrigatório" })}
                                        className={`flex-1 p-2 border rounded bg-slate-50 ${errors.visits?.[index]?.citizenName ? 'border-red-500' : ''}`}
                                        placeholder="Clique em Buscar para selecionar"
                                        readOnly
                                    />
                                    {errors.visits?.[index]?.citizenName && <span className="text-red-500 text-xs absolute -bottom-4 left-0">{errors.visits[index]?.citizenName?.message}</span>}
                                    <button
                                        type="button"
                                        onClick={() => handleSearchCitizen(index)}
                                        className="px-3 py-2 bg-sus-blue text-white rounded hover:bg-sus-blue-dark flex items-center gap-1"
                                        title="Buscar cidadão"
                                    >
                                        <Search className="w-4 h-4" />
                                        Buscar
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setValue(`visits.${index}.citizenName`, '');
                                            setValue(`visits.${index}.citizenCNS`, '');
                                            setValue(`visits.${index}.dateOfBirth`, '');
                                            setValue(`visits.${index}.address`, '');
                                        }}
                                        className="px-3 py-2 bg-slate-200 text-slate-600 rounded hover:bg-slate-300 flex items-center gap-1"
                                        title="Limpar seleção"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Data Nasc.</label>
                                <input
                                    type="date"
                                    {...register(`visits.${index}.dateOfBirth`)}
                                    className="w-full p-2 border rounded bg-slate-50"
                                    readOnly
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">CNS do Cidadão</label>
                                <input
                                    {...register(`visits.${index}.citizenCNS`, {
                                        minLength: { value: 15, message: "CNS deve ter 15 dígitos" },
                                        maxLength: { value: 15, message: "CNS deve ter 15 dígitos" },
                                        pattern: { value: /^\d+$/, message: "Apenas números" }
                                    })}
                                    maxLength={15}
                                    className="w-full p-2 border rounded bg-slate-50"
                                    placeholder="Preenchido automaticamente"
                                    readOnly
                                />
                                {errors.visits?.[index]?.citizenCNS && <span className="text-red-500 text-xs">{errors.visits[index]?.citizenCNS?.message}</span>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Endereço</label>
                                <input
                                    {...register(`visits.${index}.address`)}
                                    className="w-full p-2 border rounded"
                                    placeholder="Endereço completo"
                                />
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-700 mb-2">Motivo da Visita</label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {MOTIVES.map((motive) => (
                                    <label key={motive.value} className="flex items-center space-x-2 text-sm p-2 border rounded hover:bg-slate-100 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            value={motive.value}
                                            {...register(`visits.${index}.motives`)}
                                            className="rounded text-sus-blue"
                                        />
                                        <span>{motive.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Peso (kg)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    {...register(`visits.${index}.weight`, { valueAsNumber: true })}
                                    className="w-full p-2 border rounded"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Altura (cm)</label>
                                <input
                                    type="number"
                                    {...register(`visits.${index}.height`, { valueAsNumber: true })}
                                    className="w-full p-2 border rounded"
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
                <button
                    type="button"
                    onClick={() => append({
                        id: crypto.randomUUID(),
                        motives: [],
                        outcome: 'realized',
                        shift: 'morning',
                        microArea: user?.microArea || '',
                        propertyType: 'domicilio',
                        address: ''
                    })}
                    className="flex items-center gap-2 text-sus-blue hover:bg-blue-50 px-4 py-2 rounded font-medium"
                >
                    <Plus className="w-5 h-5" />
                    Adicionar Visita
                </button>

                <button
                    type="submit"
                    className="flex items-center gap-2 bg-sus-green hover:bg-green-700 text-white px-6 py-2 rounded font-medium shadow-md"
                >
                    <Save className="w-5 h-5" />
                    Salvar Ficha
                </button>
            </div>

            {/* Modal de Busca de Cidadão */}
            {searchModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
                        {/* Header */}
                        <div className="bg-sus-blue text-white p-4 flex justify-between items-center">
                            <h2 className="text-xl font-bold">Buscar Cidadão</h2>
                            <button
                                onClick={() => {
                                    setSearchModalOpen(false);
                                    setSearchQuery('');
                                    setSearchResults([]);
                                }}
                                className="text-white hover:bg-white hover:bg-opacity-20 p-1 rounded"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Search Input */}
                        <div className="p-4 border-b">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            performSearch();
                                        }
                                    }}
                                    placeholder="Digite o nome ou CNS do cidadão"
                                    className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-sus-blue focus:outline-none"
                                    autoFocus
                                />
                                <button
                                    type="button" // Importante: type="button" para não submeter o form
                                    onClick={performSearch}
                                    disabled={searching || !searchQuery.trim()}
                                    className="px-6 py-3 bg-sus-blue text-white rounded-lg hover:bg-sus-blue-dark disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    <Search className="w-5 h-5" />
                                    {searching ? 'Buscando...' : 'Buscar'}
                                </button>
                            </div>
                            <p className="text-sm text-gray-500 mt-2">
                                💡 Dica: Digite o nome completo ou parcial, ou o CNS (15 dígitos)
                            </p>
                        </div>

                        {/* Results */}
                        <div className="p-4 overflow-y-auto max-h-96">
                            {searching && (
                                <div className="text-center py-8">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sus-blue mx-auto mb-4"></div>
                                    <p className="text-gray-600">Buscando...</p>
                                </div>
                            )}

                            {!searching && searchResults.length === 0 && searchQuery && (
                                <div className="text-center py-8 text-gray-500">
                                    <p className="text-lg mb-2">Nenhum cidadão encontrado</p>
                                    <p className="text-sm mb-4">Tente buscar por outro nome ou CNS</p>
                                    <button
                                        onClick={() => {
                                            setRegisterModalOpen(true);
                                            setNewCitizen(prev => ({ ...prev, name: searchQuery }));
                                        }}
                                        className="px-6 py-3 bg-sus-green text-white rounded-lg hover:bg-green-700 flex items-center gap-2 mx-auto"
                                    >
                                        <UserPlus className="w-5 h-5" />
                                        Cadastrar Novo Cidadão
                                    </button>
                                </div>
                            )}

                            {!searching && searchResults.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-sm text-gray-600 mb-3">
                                        {searchResults.length} {searchResults.length === 1 ? 'resultado encontrado' : 'resultados encontrados'}
                                    </p>
                                    {searchResults.map((citizen) => (
                                        <button
                                            key={citizen.cns}
                                            onClick={() => selectCitizen(citizen)}
                                            className="w-full text-left p-4 border rounded-lg hover:bg-blue-50 hover:border-sus-blue transition-colors"
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-lg text-gray-900">{citizen.name}</h3>
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        <strong>CNS:</strong> {citizen.cns}
                                                    </p>
                                                    <p className="text-sm text-gray-600">
                                                        <strong>Data Nasc.:</strong> {new Date(citizen.dateOfBirth).toLocaleDateString('pt-BR')}
                                                    </p>
                                                    <p className="text-sm text-gray-600">
                                                        <strong>Endereço:</strong> {citizen.address}
                                                    </p>
                                                </div>
                                                <div className="ml-4">
                                                    <span className="text-xs bg-sus-blue text-white px-2 py-1 rounded">
                                                        Selecionar
                                                    </span>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {!searching && !searchQuery && (
                                <div className="text-center py-8 text-gray-400">
                                    <Search className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                    <p>Digite um nome ou CNS para buscar</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Cadastro Rápido */}
            {registerModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto">
                        <div className="bg-sus-green text-white p-4 flex justify-between items-center">
                            <h2 className="text-xl font-bold">Cadastrar Novo Cidadão</h2>
                            <button
                                onClick={() => {
                                    setRegisterModalOpen(false);
                                    setNewCitizen({
                                        cns: '',
                                        name: '',
                                        dateOfBirth: '',
                                        sex: 'M',
                                        address: '',
                                        uf: '',
                                        municipioCode: '',
                                        municipioName: ''
                                    });
                                    setAddressFields({
                                        cep: '',
                                        logradouro: '',
                                        numero: '',
                                        complemento: '',
                                        bairro: ''
                                    });
                                }}
                                className="text-white hover:bg-white hover:bg-opacity-20 p-1 rounded"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    CNS (Cartão SUS) *
                                </label>
                                <input
                                    type="text"
                                    value={newCitizen.cns}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, '').slice(0, 15);
                                        setNewCitizen({ ...newCitizen, cns: value });
                                    }}
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-sus-green"
                                    placeholder="000000000000000"
                                    maxLength={15}
                                />
                                <p className="text-xs text-gray-500 mt-1">15 dígitos</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Nome Completo *
                                </label>
                                <input
                                    type="text"
                                    value={newCitizen.name}
                                    onChange={(e) => setNewCitizen({ ...newCitizen, name: e.target.value })}
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-sus-green"
                                    placeholder="Nome completo do cidadão"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Data de Nascimento *
                                    </label>
                                    <input
                                        type="date"
                                        value={newCitizen.dateOfBirth}
                                        onChange={(e) => setNewCitizen({ ...newCitizen, dateOfBirth: e.target.value })}
                                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-sus-green"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Sexo
                                    </label>
                                    <select
                                        value={newCitizen.sex}
                                        onChange={(e) => setNewCitizen({ ...newCitizen, sex: e.target.value as Sex })}
                                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-sus-green"
                                    >
                                        <option value="M">Masculino</option>
                                        <option value="F">Feminino</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Endereço Completo
                                </label>
                                <textarea
                                    value={newCitizen.address}
                                    onChange={(e) => setNewCitizen({ ...newCitizen, address: e.target.value })}
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-sus-green"
                                    rows={3}
                                    placeholder="Endereço será preenchido automaticamente pelos campos abaixo"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    💡 Este campo é preenchido automaticamente. Você pode editar manualmente se preferir.
                                </p>
                            </div>

                            {/* Campos Detalhados de Endereço */}
                            <div className="border-t pt-4 mt-4">
                                <h4 className="text-sm font-semibold text-slate-700 mb-3">Campos Detalhados de Endereço</h4>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">
                                            CEP
                                        </label>
                                        <input
                                            type="text"
                                            value={addressFields.cep}
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/\D/g, '').slice(0, 8);
                                                updateAddressField('cep', value);
                                            }}
                                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-sus-green"
                                            placeholder="00000-000"
                                            maxLength={8}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">
                                            Número
                                        </label>
                                        <input
                                            type="text"
                                            value={addressFields.numero}
                                            onChange={(e) => updateAddressField('numero', e.target.value)}
                                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-sus-green"
                                            placeholder="123"
                                        />
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Logradouro (Rua/Avenida)
                                    </label>
                                    <input
                                        type="text"
                                        value={addressFields.logradouro}
                                        onChange={(e) => updateAddressField('logradouro', e.target.value)}
                                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-sus-green"
                                        placeholder="Rua das Flores"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">
                                            Complemento
                                        </label>
                                        <input
                                            type="text"
                                            value={addressFields.complemento}
                                            onChange={(e) => updateAddressField('complemento', e.target.value)}
                                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-sus-green"
                                            placeholder="Apto 101, Bloco A"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">
                                            Bairro
                                        </label>
                                        <input
                                            type="text"
                                            value={addressFields.bairro}
                                            onChange={(e) => updateAddressField('bairro', e.target.value)}
                                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-sus-green"
                                            placeholder="Centro"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Estado (UF)
                                    </label>
                                    <select
                                        value={newCitizen.uf}
                                        onChange={(e) => {
                                            const newUF = e.target.value;
                                            setNewCitizen(prev => {
                                                // Buscar nome do município atual (se houver)
                                                const municipio = municipios.find(m => m.id.toString() === prev.municipioCode);
                                                const municipioName = municipio ? municipio.nome : '';

                                                return {
                                                    ...prev,
                                                    uf: newUF,
                                                    address: buildFullAddress(addressFields, newUF, municipioName)
                                                };
                                            });
                                        }}
                                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-sus-green"
                                    >
                                        <option value="">Selecione...</option>
                                        {ufs.map(uf => (
                                            <option key={uf.id} value={uf.sigla}>{uf.nome}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Município
                                    </label>
                                    <select
                                        value={newCitizen.municipioCode}
                                        onChange={(e) => {
                                            const newCode = e.target.value;
                                            // Buscar nome do novo município
                                            const municipio = municipios.find(m => m.id.toString() === newCode);
                                            const municipioName = municipio ? municipio.nome : '';

                                            setNewCitizen(prev => ({
                                                ...prev,
                                                municipioCode: newCode,
                                                municipioName: municipioName,
                                                address: buildFullAddress(addressFields, prev.uf || '', municipioName)
                                            }));
                                        }}
                                        disabled={!newCitizen.uf}
                                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-sus-green disabled:bg-slate-100 disabled:cursor-not-allowed"
                                    >
                                        <option value="">Selecione...</option>
                                        {municipios.map(m => (
                                            <option key={m.id} value={m.id}>{m.nome}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t flex gap-3">
                            <button
                                onClick={handleRegisterCitizen}
                                className="flex-1 bg-sus-green hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2"
                            >
                                <Save className="w-5 h-5" />
                                Cadastrar e Usar
                            </button>
                            <button
                                onClick={() => {
                                    setRegisterModalOpen(false);
                                    setNewCitizen({
                                        cns: '',
                                        name: '',
                                        dateOfBirth: '',
                                        sex: 'M',
                                        address: '',
                                        uf: '',
                                        municipioCode: '',
                                        municipioName: ''
                                    });
                                    setAddressFields({
                                        cep: '',
                                        logradouro: '',
                                        numero: '',
                                        complemento: '',
                                        bairro: ''
                                    });
                                }}
                                className="flex-1 bg-slate-300 hover:bg-slate-400 text-slate-700 px-6 py-3 rounded-lg font-medium"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </form>
    );
};
