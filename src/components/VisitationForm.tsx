import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray, type SubmitHandler } from 'react-hook-form';
import { Plus, Trash2, Save, FileText, Search, X, UserPlus } from 'lucide-react';
import type { VisitationFormData, VisitMotive, Sex } from '../types/form';
import { searchCitizenByName, searchCitizenByCNS, addCitizen, type Citizen } from '../services/citizenService';
import { getUFs, getMunicipiosByUF, type UF, type Municipio } from '../services/ibgeService';
import { saveVisitRecord } from '../services/visitService';
import { toast } from 'sonner';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { ControleVetorialSection } from './ControleVetorialSection';

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
    const { register, control, handleSubmit, setValue, watch, formState: { errors } } = useForm<VisitationFormData>({
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
                address: '',
                controleVetorial: {
                    depositosInspecionados: [],
                    depositosEliminados: 0,
                    depositosTratados: 0,
                    classificacaoImovel: 'C' as const
                }
            }]
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "visits"
    });

    // Observar valores do formulário para garantir re-renderização
    const watchedVisits = watch("visits");

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
            // Validação: motivo da recusa obrigatório quando classificação for 'B'
            const visitasComRecusaSemMotivo = data.visits.filter(v => 
                v.controleVetorial?.classificacaoImovel === 'B' && 
                (!v.controleVetorial?.motivoRecusa || v.controleVetorial.motivoRecusa.trim() === '')
            );
            
            if (visitasComRecusaSemMotivo.length > 0) {
                toast.error('Para classificação "B (Recusado)", o motivo da recusa é obrigatório.');
                return;
            }

            // Validação: A+ deve ter depósitos com larvas
            const visitasAPositivoSemLarvas = data.visits.filter(v => {
                if (v.controleVetorial?.classificacaoImovel === 'A+') {
                    const temLarvas = (v.controleVetorial.depositosInspecionados || []).some(d => d.comLarvas);
                    return !temLarvas;
                }
                return false;
            });

            if (visitasAPositivoSemLarvas.length > 0) {
                if (!confirm('Classificação A+ (Positivo para larvas) requer depósitos com larvas. Deseja continuar mesmo assim?')) {
                    return;
                }
            }

            const hasEmptyAddresses = data.visits.some(v => !v.address || v.address.trim().length < 5);
            if (hasEmptyAddresses) {
                if (!confirm('Algumas visitas estão sem endereço completo ou muito curto. Elas podem não aparecer no mapa. Deseja salvar mesmo assim?')) {
                    return;
                }
            }

            saveVisitRecord(data.visits, user, 'domiciliar', data.date);
            toast.success('Ficha de visita salva com sucesso!');
        } catch (error) {
            console.error('Erro ao salvar ficha:', error);
            toast.error('Erro ao salvar ficha de visita.');
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
            if (/^\d{15}$/.test(searchQuery.replace(/\D/g, ''))) {
                const citizen = await searchCitizenByCNS(searchQuery.replace(/\D/g, ''));
                setSearchResults(citizen ? [citizen] : []);
            } else {
                const citizens = await searchCitizenByName(searchQuery);
                setSearchResults(citizens);
            }
        } catch (error) {
            console.error('Erro ao buscar cidadão:', error);
            setSearchResults([]);
            toast.error('Erro ao buscar cidadão');
        } finally {
            setSearching(false);
        }
    };

    const selectCitizen = (citizen: Citizen) => {
        if (currentVisitIndex === null) return;

        const visitPath = `visits.${currentVisitIndex}` as const;

        setValue(`${visitPath}.citizenName`, citizen.name, { shouldValidate: true, shouldDirty: true });
        setValue(`${visitPath}.citizenCNS`, citizen.cns, { shouldValidate: true, shouldDirty: true });
        setValue(`${visitPath}.dateOfBirth`, citizen.dateOfBirth, { shouldValidate: true, shouldDirty: true });
        setValue(`${visitPath}.address`, citizen.address, { shouldValidate: true, shouldDirty: true });

        setSearchModalOpen(false);
        setSearchQuery('');
        setSearchResults([]);
        toast.success('Cidadão selecionado!');
    };

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

        const municipio = municipios.find(m => m.id.toString() === newCitizen.municipioCode);
        const municipioName = municipio ? municipio.nome : '';

        setNewCitizen(prev => ({
            ...prev,
            address: buildFullAddress(newFields, prev.uf || '', municipioName)
        }));
    };

    const handleRegisterCitizen = () => {
        if (!newCitizen.cns || !newCitizen.name || !newCitizen.dateOfBirth) {
            toast.error('Preencha todos os campos obrigatórios (CNS, Nome e Data de Nascimento)');
            return;
        }

        if (newCitizen.cns.length !== 15) {
            toast.error('CNS deve ter 15 dígitos');
            return;
        }

        try {
            const municipio = municipios.find(m => m.id.toString() === newCitizen.municipioCode);

            const citizenToSave: any = {
                ...newCitizen,
                municipioName: municipio ? municipio.nome : undefined
            };

            addCitizen(citizenToSave);
            toast.success('Cidadão cadastrado com sucesso!');

            selectCitizen(citizenToSave as Citizen);

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
            toast.error('Erro ao cadastrar cidadão');
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-5xl mx-auto my-8 px-4 sm:px-6">
            <Card className="border-t-4 border-t-sus-blue">
                <CardHeader className="bg-white border-b-0 pb-0">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <FileText className="w-6 h-6 text-sus-blue" />
                        </div>
                        <div>
                            <CardTitle>Ficha de Visita Domiciliar</CardTitle>
                            <p className="text-sm text-slate-500">Registro diário de atividades</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                            label="Profissional"
                            {...register("professionalName", { required: true })}
                            readOnly
                            className="bg-slate-50 text-slate-500"
                        />
                        <Input
                            label="Data da Visita"
                            type="date"
                            {...register("date", { required: true })}
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-6">
                {fields.map((field, index) => (
                    <Card key={field.id} className="relative border-l-4 border-l-sus-blue">
                        <div className="absolute top-4 right-4 z-10">
                            <button
                                type="button"
                                onClick={() => remove(index)}
                                className="text-slate-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors"
                                title="Remover visita"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>

                        <CardHeader className="bg-transparent border-b-0 pb-0 pt-6">
                            <h3 className="text-lg font-semibold text-sus-blue flex items-center gap-2">
                                <span className="bg-sus-blue text-white text-xs px-2 py-1 rounded-full">#{index + 1}</span>
                                Detalhes da Visita
                            </h3>
                        </CardHeader>

                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <Select
                                    label="Turno"
                                    {...register(`visits.${index}.shift`)}
                                    options={[
                                        { value: 'morning', label: 'Manhã' },
                                        { value: 'afternoon', label: 'Tarde' },
                                        { value: 'night', label: 'Noite' }
                                    ]}
                                />
                                <Input
                                    label="Microárea"
                                    {...register(`visits.${index}.microArea`)}
                                    placeholder="00"
                                />
                                <Input
                                    label="Setor"
                                    {...register(`visits.${index}.setor`)}
                                    placeholder="Setor censitário"
                                />
                                <Input
                                    label="Quarteirão"
                                    {...register(`visits.${index}.quarteirão`)}
                                    placeholder="Quadra/Quarteirão"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <Select
                                    label="Tipo Imóvel"
                                    {...register(`visits.${index}.propertyType`)}
                                    options={[
                                        { value: 'domicilio', label: 'Domicílio' },
                                        { value: 'comercio', label: 'Comércio' },
                                        { value: 'escola', label: 'Escola' },
                                        { value: 'outros', label: 'Outros' }
                                    ]}
                                />
                                <Select
                                    label="Desfecho"
                                    {...register(`visits.${index}.outcome`)}
                                    options={[
                                        { value: 'realized', label: 'Realizada' },
                                        { value: 'refused', label: 'Recusada' },
                                        { value: 'absent', label: 'Ausente' }
                                    ]}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="block text-sm font-medium text-slate-700">Cidadão</label>
                                    <div className="flex gap-2">
                                        <div className="flex-1 relative">
                                            <Input
                                                {...register(`visits.${index}.citizenName`, { required: "Nome do cidadão é obrigatório" })}
                                                placeholder="Clique em Buscar para selecionar"
                                                readOnly
                                                error={errors.visits?.[index]?.citizenName?.message}
                                                className="bg-slate-50 cursor-pointer"
                                                onClick={() => handleSearchCitizen(index)}
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            onClick={() => handleSearchCitizen(index)}
                                            className="px-3"
                                            title="Buscar cidadão"
                                        >
                                            <Search className="w-4 h-4" />
                                            <span className="hidden sm:inline ml-2">Buscar</span>
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => {
                                                setValue(`visits.${index}.citizenName`, '');
                                                setValue(`visits.${index}.citizenCNS`, '');
                                                setValue(`visits.${index}.dateOfBirth`, '');
                                                setValue(`visits.${index}.address`, '');
                                            }}
                                            className="px-3"
                                            title="Limpar seleção"
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                                <Input
                                    label="Data Nasc."
                                    type="date"
                                    {...register(`visits.${index}.dateOfBirth`)}
                                    readOnly
                                    className="bg-slate-50 text-slate-500"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="CNS do Cidadão"
                                    {...register(`visits.${index}.citizenCNS`, {
                                        minLength: { value: 15, message: "CNS deve ter 15 dígitos" },
                                        maxLength: { value: 15, message: "CNS deve ter 15 dígitos" },
                                        pattern: { value: /^\d+$/, message: "Apenas números" }
                                    })}
                                    maxLength={15}
                                    readOnly
                                    placeholder="Preenchido automaticamente"
                                    className="bg-slate-50 text-slate-500"
                                    error={errors.visits?.[index]?.citizenCNS?.message}
                                />
                                <Input
                                    label="Endereço"
                                    {...register(`visits.${index}.address`)}
                                    placeholder="Endereço completo"
                                />
                            </div>

                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                                <label className="block text-sm font-medium text-slate-700 mb-3">Motivo da Visita</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {MOTIVES.map((motive) => (
                                        <label key={motive.value} className="flex items-center space-x-3 text-sm p-3 bg-white border border-slate-200 rounded-md hover:border-sus-blue hover:bg-blue-50 cursor-pointer transition-all">
                                            <input
                                                type="checkbox"
                                                value={motive.value}
                                                {...register(`visits.${index}.motives`)}
                                                className="w-4 h-4 rounded text-sus-blue focus:ring-sus-blue border-gray-300"
                                            />
                                            <span className="text-slate-700">{motive.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="Peso (kg)"
                                    type="number"
                                    step="0.1"
                                    {...register(`visits.${index}.weight`, { valueAsNumber: true })}
                                />
                                <Input
                                    label="Altura (cm)"
                                    type="number"
                                    {...register(`visits.${index}.height`, { valueAsNumber: true })}
                                />
                            </div>

                            {/* NOVO: Controle Vetorial DETALHADO */}
                            {(field.controleVetorial || watchedVisits[index]?.controleVetorial) && (
                                <ControleVetorialSection
                                    visitIndex={index}
                                    depositosInspecionados={watchedVisits[index]?.controleVetorial?.depositosInspecionados || field.controleVetorial?.depositosInspecionados || []}
                                    onDepositosChange={(depositos) => {
                                        setValue(`visits.${index}.controleVetorial.depositosInspecionados`, depositos, { shouldDirty: true });
                                    }}
                                    depositosEliminados={watchedVisits[index]?.controleVetorial?.depositosEliminados ?? field.controleVetorial?.depositosEliminados ?? 0}
                                    onDepositosEliminadosChange={(value) => {
                                        setValue(`visits.${index}.controleVetorial.depositosEliminados`, value, { shouldDirty: true });
                                    }}
                                    depositosTratados={watchedVisits[index]?.controleVetorial?.depositosTratados ?? field.controleVetorial?.depositosTratados ?? 0}
                                    onDepositosTratadosChange={(value) => {
                                        setValue(`visits.${index}.controleVetorial.depositosTratados`, value, { shouldDirty: true });
                                    }}
                                    larvicidaUtilizado={watchedVisits[index]?.controleVetorial?.larvicidaUtilizado || field.controleVetorial?.larvicidaUtilizado}
                                    onLarvicidaChange={(value) => {
                                        setValue(`visits.${index}.controleVetorial.larvicidaUtilizado`, value, { shouldDirty: true });
                                    }}
                                    dosagem={watchedVisits[index]?.controleVetorial?.dosagem || field.controleVetorial?.dosagem || ''}
                                    onDosagemChange={(value) => {
                                        setValue(`visits.${index}.controleVetorial.dosagem`, value, { shouldDirty: true });
                                    }}
                                    classificacaoImovel={watchedVisits[index]?.controleVetorial?.classificacaoImovel || field.controleVetorial?.classificacaoImovel || 'C'}
                                    onClassificacaoChange={(value) => {
                                        setValue(`visits.${index}.controleVetorial.classificacaoImovel`, value, { 
                                            shouldValidate: true, 
                                            shouldDirty: true 
                                        });
                                    }}
                                    motivoRecusa={watchedVisits[index]?.controleVetorial?.motivoRecusa || field.controleVetorial?.motivoRecusa}
                                    onMotivoRecusaChange={(value) => {
                                        setValue(`visits.${index}.controleVetorial.motivoRecusa`, value, { shouldDirty: true });
                                    }}
                                />
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-slate-200">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => append({
                        id: crypto.randomUUID(),
                        motives: [],
                        outcome: 'realized',
                        shift: 'morning',
                        microArea: user?.microArea || '',
                        propertyType: 'domicilio',
                        address: ''
                    })}
                    className="w-full sm:w-auto"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Adicionar Visita
                </Button>

                <Button
                    type="submit"
                    className="w-full sm:w-auto bg-sus-green hover:bg-green-700 text-white"
                >
                    <Save className="w-5 h-5 mr-2" />
                    Salvar Ficha
                </Button>
            </div>

            {/* Modal de Busca de Cidadão */}
            {searchModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <Card className="w-full max-w-2xl max-h-[80vh] flex flex-col" noPadding>
                        {/* Header */}
                        <div className="bg-sus-blue text-white p-4 flex justify-between items-center shrink-0">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Search className="w-6 h-6" />
                                Buscar Cidadão
                            </h2>
                            <button
                                onClick={() => {
                                    setSearchModalOpen(false);
                                    setSearchQuery('');
                                    setSearchResults([]);
                                }}
                                className="text-white hover:bg-white/20 p-1 rounded transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Search Input */}
                        <div className="p-4 border-b shrink-0 bg-white">
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <Input
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                performSearch();
                                            }
                                        }}
                                        placeholder="Digite o nome ou CNS do cidadão"
                                        autoFocus
                                        className="h-12 text-lg"
                                    />
                                </div>
                                <Button
                                    type="button"
                                    onClick={performSearch}
                                    disabled={searching || !searchQuery.trim()}
                                    isLoading={searching}
                                    className="h-12 px-6"
                                >
                                    {!searching && <Search className="w-5 h-5 mr-2" />}
                                    Buscar
                                </Button>
                            </div>
                            <p className="text-sm text-slate-500 mt-2 flex items-center gap-1">
                                <span className="text-yellow-500">💡</span> Dica: Digite o nome completo ou parcial, ou o CNS (15 dígitos)
                            </p>
                        </div>

                        {/* Results */}
                        <div className="p-4 overflow-y-auto flex-1 bg-slate-50">
                            {!searching && searchResults.length === 0 && searchQuery && (
                                <div className="text-center py-12 text-slate-500">
                                    <p className="text-lg mb-2 font-medium text-slate-700">Nenhum cidadão encontrado</p>
                                    <p className="text-sm mb-6">Tente buscar por outro nome ou CNS</p>
                                    <Button
                                        onClick={() => {
                                            setRegisterModalOpen(true);
                                            setNewCitizen(prev => ({ ...prev, name: searchQuery }));
                                        }}
                                        className="bg-sus-green hover:bg-green-700 mx-auto"
                                    >
                                        <UserPlus className="w-5 h-5 mr-2" />
                                        Cadastrar Novo Cidadão
                                    </Button>
                                </div>
                            )}

                            {!searching && searchResults.length > 0 && (
                                <div className="space-y-3">
                                    <p className="text-sm font-medium text-slate-600 mb-2 px-1">
                                        {searchResults.length} {searchResults.length === 1 ? 'resultado encontrado' : 'resultados encontrados'}
                                    </p>
                                    {searchResults.map((citizen) => (
                                        <button
                                            key={citizen.cns}
                                            onClick={() => selectCitizen(citizen)}
                                            className="w-full text-left p-4 bg-white border border-slate-200 rounded-lg hover:border-sus-blue hover:shadow-md transition-all group"
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-lg text-slate-900 group-hover:text-sus-blue transition-colors">{citizen.name}</h3>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 mt-2 text-sm text-slate-600">
                                                        <p>
                                                            <strong className="font-medium text-slate-700">CNS:</strong> {citizen.cns}
                                                        </p>
                                                        <p>
                                                            <strong className="font-medium text-slate-700">Nasc.:</strong> {new Date(citizen.dateOfBirth).toLocaleDateString('pt-BR')}
                                                        </p>
                                                        <p className="sm:col-span-2 truncate">
                                                            <strong className="font-medium text-slate-700">Endereço:</strong> {citizen.address}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="ml-4 self-center">
                                                    <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full group-hover:bg-sus-blue group-hover:text-white transition-colors font-medium">
                                                        Selecionar
                                                    </span>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {!searching && !searchQuery && (
                                <div className="text-center py-12 text-slate-400">
                                    <Search className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                    <p className="text-lg">Digite um nome ou CNS para buscar</p>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            )}

            {/* Modal de Cadastro Rápido */}
            {registerModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <Card className="w-full max-w-2xl max-h-[85vh] flex flex-col" noPadding>
                        <div className="bg-sus-green text-white p-4 flex justify-between items-center shrink-0">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <UserPlus className="w-6 h-6" />
                                Cadastrar Novo Cidadão
                            </h2>
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
                                className="text-white hover:bg-white/20 p-1 rounded transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4 overflow-y-auto flex-1">
                            <Input
                                label="CNS (Cartão SUS) *"
                                value={newCitizen.cns}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, '').slice(0, 15);
                                    setNewCitizen({ ...newCitizen, cns: value });
                                }}
                                placeholder="000000000000000"
                                maxLength={15}
                            />

                            <Input
                                label="Nome Completo *"
                                value={newCitizen.name}
                                onChange={(e) => setNewCitizen({ ...newCitizen, name: e.target.value })}
                                placeholder="Nome completo do cidadão"
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Data de Nascimento *"
                                    type="date"
                                    value={newCitizen.dateOfBirth}
                                    onChange={(e) => setNewCitizen({ ...newCitizen, dateOfBirth: e.target.value })}
                                />

                                <Select
                                    label="Sexo"
                                    value={newCitizen.sex}
                                    onChange={(e) => setNewCitizen({ ...newCitizen, sex: e.target.value as Sex })}
                                    options={[
                                        { value: 'M', label: 'Masculino' },
                                        { value: 'F', label: 'Feminino' }
                                    ]}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Select
                                    label="Estado (UF)"
                                    value={newCitizen.uf}
                                    onChange={(e) => {
                                        const newUF = e.target.value;
                                        setNewCitizen(prev => {
                                            const municipio = municipios.find(m => m.id.toString() === prev.municipioCode);
                                            const municipioName = municipio ? municipio.nome : '';
                                            return {
                                                ...prev,
                                                uf: newUF,
                                                address: buildFullAddress(addressFields, newUF, municipioName)
                                            };
                                        });
                                    }}
                                    options={[
                                        { value: '', label: 'Selecione...' },
                                        ...ufs.map(uf => ({ value: uf.sigla, label: uf.nome }))
                                    ]}
                                />

                                <Select
                                    label="Município"
                                    value={newCitizen.municipioCode}
                                    onChange={(e) => {
                                        const newCode = e.target.value;
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
                                    options={[
                                        { value: '', label: 'Selecione...' },
                                        ...municipios.map(m => ({ value: m.id.toString(), label: m.nome }))
                                    ]}
                                />
                            </div>
                        </div>

                        <div className="p-4 border-t bg-slate-50 flex justify-end gap-3 shrink-0">
                            <Button
                                variant="ghost"
                                onClick={() => setRegisterModalOpen(false)}
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleRegisterCitizen}
                                className="bg-sus-green hover:bg-green-700 text-white"
                            >
                                <Save className="w-5 h-5 mr-2" />
                                Salvar Cidadão
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </form>
    );
};
