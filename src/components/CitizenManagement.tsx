import React from 'react';
import { Users, Search, Edit2, Trash2, X, Save } from 'lucide-react';
import { getAllCitizens, updateCitizen, deleteCitizen, type Citizen } from '../services/citizenService';
import { getUFs, getMunicipiosByUF, type UF, type Municipio } from '../services/ibgeService';
import { toast } from 'sonner';

export const CitizenManagement: React.FC = () => {
    const [citizens, setCitizens] = React.useState<Citizen[]>([]);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [editingCitizen, setEditingCitizen] = React.useState<Citizen | null>(null);
    const [editForm, setEditForm] = React.useState<Partial<Citizen>>({});

    // Campos separados de endereço
    const [addressFields, setAddressFields] = React.useState({
        cep: '',
        logradouro: '',
        numero: '',
        complemento: '',
        bairro: ''
    });

    // Estados para IBGE
    const [ufs, setUfs] = React.useState<UF[]>([]);
    const [municipios, setMunicipios] = React.useState<Municipio[]>([]);
    const [selectedUF, setSelectedUF] = React.useState('');
    const [selectedMunicipio, setSelectedMunicipio] = React.useState('');

    React.useEffect(() => {
        loadCitizens();
        loadUFs();
    }, []);

    const loadUFs = async () => {
        const data = await getUFs();
        setUfs(data);
    };

    React.useEffect(() => {
        if (selectedUF) {
            loadMunicipios(selectedUF);
        } else {
            setMunicipios([]);
        }
    }, [selectedUF]);

    const loadMunicipios = async (uf: string) => {
        const data = await getMunicipiosByUF(uf);
        setMunicipios(data);
    };

    const loadCitizens = () => {
        const allCitizens = getAllCitizens();
        setCitizens(allCitizens);
    };

    const filteredCitizens = citizens.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.cns.includes(searchTerm)
    );

    const handleEdit = (citizen: Citizen) => {
        setEditingCitizen(citizen);
        setEditForm(citizen);

        // Carregar dados de localidade
        if (citizen.uf) {
            setSelectedUF(citizen.uf);
        } else {
            setSelectedUF('');
        }

        if (citizen.municipioCode) {
            setSelectedMunicipio(citizen.municipioCode);
        } else {
            setSelectedMunicipio('');
        }

        // Tentar parsear endereço existente
        parseAddress(citizen.address || '');
    };

    const parseAddress = (address: string) => {
        // Resetar campos
        setAddressFields({
            cep: '',
            logradouro: '',
            numero: '',
            complemento: '',
            bairro: ''
        });

        // Tentar extrair informações do endereço
        // Formato esperado: "Logradouro, Número, Complemento, Bairro, CEP"
        const parts = address.split(',').map(p => p.trim());

        if (parts.length >= 1) setAddressFields(prev => ({ ...prev, logradouro: parts[0] }));
        if (parts.length >= 2) setAddressFields(prev => ({ ...prev, numero: parts[1] }));
        if (parts.length >= 3) setAddressFields(prev => ({ ...prev, bairro: parts[2] }));
    };

    const updateAddressField = (field: keyof typeof addressFields, value: string) => {
        const newFields = { ...addressFields, [field]: value };
        setAddressFields(newFields);

        // Atualizar endereço completo automaticamente
        const parts = [];
        if (newFields.logradouro) parts.push(newFields.logradouro);
        if (newFields.numero) parts.push(newFields.numero);
        if (newFields.complemento) parts.push(newFields.complemento);
        if (newFields.bairro) parts.push(newFields.bairro);
        if (newFields.cep) parts.push(`CEP: ${newFields.cep}`);

        setEditForm({ ...editForm, address: parts.join(', ') });
    };

    const handleSaveEdit = () => {
        if (editingCitizen && editForm.name && editForm.dateOfBirth) {
            // Buscar nome do município selecionado
            const municipio = municipios.find(m => m.id.toString() === selectedMunicipio);

            const updatedData = {
                ...editForm,
                uf: selectedUF,
                municipioCode: selectedMunicipio,
                municipioName: municipio ? municipio.nome : undefined
            };

            const success = updateCitizen(editingCitizen.cns, updatedData);
            if (success) {
                toast.success('Cidadão atualizado com sucesso!');
                loadCitizens();
                setEditingCitizen(null);
                setEditForm({});
            } else {
                toast.error('Erro ao atualizar cidadão');
            }
        }
    };

    const handleDelete = (cns: string, name: string) => {
        if (confirm(`Tem certeza que deseja excluir ${name}?`)) {
            const success = deleteCitizen(cns);
            if (success) {
                toast.success('Cidadão excluído com sucesso!');
                loadCitizens();
            } else {
                toast.error('Não é possível excluir cidadãos pré-cadastrados');
            }
        }
    };

    return (
        <div className="p-4 max-w-6xl mx-auto">
            <div className="bg-white shadow-lg rounded-lg p-6">
                <div className="flex items-center gap-3 mb-6">
                    <Users className="w-8 h-8 text-sus-blue" />
                    <h1 className="text-2xl font-bold text-sus-blue">Administração de Cidadãos</h1>
                </div>

                {/* Estatísticas */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="text-sm text-slate-600">Total de Cadastros</div>
                        <div className="text-2xl font-bold text-sus-blue">{citizens.length}</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                        <div className="text-sm text-slate-600">Cadastros Personalizados</div>
                        <div className="text-2xl font-bold text-green-600">
                            {citizens.length - 6}
                        </div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                        <div className="text-sm text-slate-600">Resultados da Busca</div>
                        <div className="text-2xl font-bold text-purple-600">{filteredCitizens.length}</div>
                    </div>
                </div>

                {/* Busca */}
                <div className="mb-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Buscar por nome ou CNS..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-sus-blue focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Lista de Cidadãos */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-100">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Nome</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">CNS</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Data Nasc.</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Endereço</th>
                                <th className="px-4 py-3 text-center text-sm font-medium text-slate-700">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {filteredCitizens.map((citizen) => (
                                <tr key={citizen.cns} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 text-sm">{citizen.name}</td>
                                    <td className="px-4 py-3 text-sm font-mono">{citizen.cns}</td>
                                    <td className="px-4 py-3 text-sm">
                                        {new Date(citizen.dateOfBirth).toLocaleDateString('pt-BR')}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-600 max-w-xs truncate">
                                        {citizen.address || '-'}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        <div className="flex justify-center gap-2">
                                            <button
                                                onClick={() => handleEdit(citizen)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                                                title="Editar"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(citizen.cns, citizen.name)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded"
                                                title="Excluir"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {filteredCitizens.length === 0 && (
                        <div className="text-center py-8 text-slate-500">
                            Nenhum cidadão encontrado
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de Edição */}
            {editingCitizen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[85vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-sus-blue">Editar Cidadão</h3>
                            <button
                                onClick={() => {
                                    setEditingCitizen(null);
                                    setEditForm({});
                                }}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    CNS (não editável)
                                </label>
                                <input
                                    type="text"
                                    value={editingCitizen.cns}
                                    disabled
                                    className="w-full p-2 border rounded bg-slate-100 cursor-not-allowed"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Nome Completo *
                                </label>
                                <input
                                    type="text"
                                    value={editForm.name || ''}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    className="w-full p-2 border rounded"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Data de Nascimento *
                                </label>
                                <input
                                    type="date"
                                    value={editForm.dateOfBirth || ''}
                                    onChange={(e) => setEditForm({ ...editForm, dateOfBirth: e.target.value })}
                                    className="w-full p-2 border rounded"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Endereço Completo
                                </label>
                                <textarea
                                    value={editForm.address || ''}
                                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-sus-blue"
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
                                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-sus-blue"
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
                                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-sus-blue"
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
                                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-sus-blue"
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
                                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-sus-blue"
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
                                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-sus-blue"
                                            placeholder="Centro"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">
                                            Estado (UF)
                                        </label>
                                        <select
                                            value={selectedUF}
                                            onChange={(e) => setSelectedUF(e.target.value)}
                                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-sus-blue"
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
                                            value={selectedMunicipio}
                                            onChange={(e) => setSelectedMunicipio(e.target.value)}
                                            disabled={!selectedUF}
                                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-sus-blue disabled:bg-slate-100 disabled:cursor-not-allowed"
                                        >
                                            <option value="">Selecione...</option>
                                            {municipios.map(m => (
                                                <option key={m.id} value={m.id}>{m.nome}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2 mt-6">
                            <button
                                onClick={handleSaveEdit}
                                className="flex-1 bg-sus-green hover:bg-green-700 text-white px-4 py-2 rounded font-medium flex items-center justify-center gap-2"
                            >
                                <Save className="w-4 h-4" />
                                Salvar Alterações
                            </button>
                            <button
                                onClick={() => {
                                    setEditingCitizen(null);
                                    setEditForm({});
                                }}
                                className="flex-1 bg-slate-300 hover:bg-slate-400 text-slate-700 px-4 py-2 rounded font-medium"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
