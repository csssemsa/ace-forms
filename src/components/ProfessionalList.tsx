import React, { useState, useEffect } from 'react';
import { Search, Users, Shield, Trash2, AlertCircle, UserPlus, X, Edit, Key } from 'lucide-react';
import { ProfessionalForm } from './ProfessionalForm';

interface Professional {
    id: string;
    name: string;
    cpf: string;
    cns: string;
    microArea: string;
    role: 'admin' | 'user';
    password?: string;
}

export const ProfessionalList: React.FC = () => {
    const [professionals, setProfessionals] = useState<Professional[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredProfessionals, setFilteredProfessionals] = useState<Professional[]>([]);
    const [showCadastroModal, setShowCadastroModal] = useState(false);
    const [editingProfessional, setEditingProfessional] = useState<Professional | null>(null);
    const [resetPasswordProfessional, setResetPasswordProfessional] = useState<Professional | null>(null);
    const [newPassword, setNewPassword] = useState('');

    useEffect(() => {
        loadProfessionals();
    }, []);

    useEffect(() => {
        const term = searchTerm.toLowerCase();
        const filtered = professionals.filter(p =>
            p.name.toLowerCase().includes(term) ||
            p.cpf.includes(term) ||
            p.cns.includes(term)
        );
        setFilteredProfessionals(filtered);
    }, [searchTerm, professionals]);

    const loadProfessionals = () => {
        const usersStr = localStorage.getItem('ace_users');
        const users = usersStr ? JSON.parse(usersStr) : [];
        console.log('=== LOAD PROFESSIONALS ===');
        console.log('Carregando profissionais do localStorage:', users.length);
        console.table(users.map((u: any) => ({ nome: u.name, cpf: u.cpf })));
        setProfessionals(users);
        setFilteredProfessionals(users);
    };

    const handleDelete = (id: string, name: string) => {
        if (confirm(`Tem certeza que deseja excluir o profissional "${name}"?`)) {
            const usersStr = localStorage.getItem('ace_users');
            const users = usersStr ? JSON.parse(usersStr) : [];
            const updatedUsers = users.filter((u: Professional) => u.id !== id);
            localStorage.setItem('ace_users', JSON.stringify(updatedUsers));
            loadProfessionals();
            alert('Profissional excluído com sucesso!');
        }
    };

    const handleCadastroSuccess = () => {
        setShowCadastroModal(false);
        loadProfessionals();
    };

    const handleEditClick = (professional: Professional) => {
        setEditingProfessional(professional);
    };

    const handleEditSave = (updatedData: Partial<Professional>) => {
        if (!editingProfessional) return;

        const usersStr = localStorage.getItem('ace_users');
        const users = usersStr ? JSON.parse(usersStr) : [];
        const updatedUsers = users.map((u: Professional) =>
            u.id === editingProfessional.id
                ? { ...u, ...updatedData }
                : u
        );
        localStorage.setItem('ace_users', JSON.stringify(updatedUsers));
        setEditingProfessional(null);
        loadProfessionals();
        alert('Profissional atualizado com sucesso!');
    };

    const handleResetPassword = () => {
        if (!resetPasswordProfessional || !newPassword) {
            alert('Por favor, digite uma nova senha.');
            return;
        }

        if (newPassword.length < 6) {
            alert('A senha deve ter no mínimo 6 caracteres.');
            return;
        }

        const usersStr = localStorage.getItem('ace_users');
        const users = usersStr ? JSON.parse(usersStr) : [];
        const updatedUsers = users.map((u: Professional) =>
            u.id === resetPasswordProfessional.id
                ? { ...u, password: newPassword }
                : u
        );
        localStorage.setItem('ace_users', JSON.stringify(updatedUsers));
        setResetPasswordProfessional(null);
        setNewPassword('');
        alert('Senha resetada com sucesso!');
    };

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                {/* Header */}
                <div className="bg-sus-blue text-white p-6">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <Users className="w-8 h-8" />
                            <div>
                                <h1 className="text-2xl font-bold">Profissionais Cadastrados</h1>
                                <p className="opacity-90 text-sm mt-1">Gerenciar profissionais ACE do sistema</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowCadastroModal(true)}
                            className="flex items-center gap-2 bg-white text-sus-blue px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                        >
                            <UserPlus className="w-5 h-5" />
                            Cadastrar Novo
                        </button>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="p-4 bg-gray-50 border-b">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar por nome, CPF ou CNS..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sus-blue focus:border-sus-blue outline-none"
                        />
                    </div>
                </div>

                {/* Stats */}
                <div className="p-4 bg-blue-50 border-b flex items-center gap-2 text-sm">
                    <AlertCircle className="w-4 h-4 text-blue-600" />
                    <span className="text-gray-700">
                        <strong>{filteredProfessionals.length}</strong> profissional(is) encontrado(s)
                        {searchTerm && ` para "${searchTerm}"`}
                    </span>
                </div>

                {/* List */}
                <div className="divide-y">
                    {filteredProfessionals.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                            <p className="text-lg font-medium">Nenhum profissional encontrado</p>
                            <p className="text-sm mt-1">
                                {searchTerm ? 'Tente uma busca diferente' : 'Cadastre o primeiro profissional'}
                            </p>
                        </div>
                    ) : (
                        filteredProfessionals.map((professional) => (
                            <div
                                key={professional.id}
                                className="p-4 hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-semibold text-lg text-gray-800">
                                                {professional.name}
                                            </h3>
                                            {professional.role === 'admin' && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                                                    <Shield className="w-3 h-3" />
                                                    Admin
                                                </span>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                                            <div>
                                                <span className="font-medium">CPF:</span> {professional.cpf}
                                            </div>
                                            <div>
                                                <span className="font-medium">CNS:</span> {professional.cns}
                                            </div>
                                            <div>
                                                <span className="font-medium">Microárea:</span> {professional.microArea}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="ml-4 flex gap-2">
                                        <button
                                            onClick={() => handleEditClick(professional)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Editar profissional"
                                        >
                                            <Edit className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => setResetPasswordProfessional(professional)}
                                            className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                            title="Resetar senha"
                                        >
                                            <Key className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(professional.id, professional.name)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Excluir profissional"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Modal de Cadastro */}
            {showCadastroModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto relative">
                        <button
                            onClick={() => setShowCadastroModal(false)}
                            className="absolute top-4 right-4 z-10 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <ProfessionalForm onSave={handleCadastroSuccess} />
                    </div>
                </div>
            )}

            {/* Modal de Edição */}
            {editingProfessional && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 relative">
                        <button
                            onClick={() => setEditingProfessional(null)}
                            className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                <Edit className="w-6 h-6 text-sus-blue" />
                                Editar Profissional
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">Atualize os dados do profissional</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">CPF (não editável)</label>
                                <input
                                    type="text"
                                    value={editingProfessional.cpf}
                                    readOnly
                                    className="w-full p-2 border rounded bg-gray-100 text-gray-600 cursor-not-allowed"
                                />
                                <p className="text-xs text-gray-500 mt-1">O CPF não pode ser alterado após o cadastro</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                                <input
                                    type="text"
                                    defaultValue={editingProfessional.name}
                                    onChange={(e) => setEditingProfessional({ ...editingProfessional, name: e.target.value })}
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-sus-blue focus:border-sus-blue outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">CNS</label>
                                <input
                                    type="text"
                                    defaultValue={editingProfessional.cns}
                                    maxLength={15}
                                    onChange={(e) => setEditingProfessional({ ...editingProfessional, cns: e.target.value.replace(/\D/g, '') })}
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-sus-blue focus:border-sus-blue outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Microárea</label>
                                <input
                                    type="text"
                                    defaultValue={editingProfessional.microArea}
                                    onChange={(e) => setEditingProfessional({ ...editingProfessional, microArea: e.target.value })}
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-sus-blue focus:border-sus-blue outline-none"
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={() => setEditingProfessional(null)}
                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => handleEditSave(editingProfessional)}
                                className="px-4 py-2 bg-sus-blue text-white rounded hover:bg-sus-blue-dark transition-colors"
                            >
                                Salvar Alterações
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Reset de Senha */}
            {resetPasswordProfessional && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
                        <button
                            onClick={() => {
                                setResetPasswordProfessional(null);
                                setNewPassword('');
                            }}
                            className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                <Key className="w-6 h-6 text-amber-600" />
                                Resetar Senha
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">
                                Profissional: <strong>{resetPasswordProfessional.name}</strong>
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nova Senha</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Mínimo 6 caracteres"
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setResetPasswordProfessional(null);
                                    setNewPassword('');
                                }}
                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleResetPassword}
                                className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors"
                            >
                                Resetar Senha
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
