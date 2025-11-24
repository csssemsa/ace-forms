import React from 'react';
import { ClipboardList, Calendar, User, MapPin, FileText, AlertTriangle, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { getAllVisitRecords, getVisitRecordsByProfessional, getVisitStatistics, deleteVisitRecord, type VisitRecord } from '../services/visitService';

interface VisitHistoryProps {
    user?: any;
}

export const VisitHistory: React.FC<VisitHistoryProps> = ({ user }) => {
    const [records, setRecords] = React.useState<VisitRecord[]>([]);
    const [filteredRecords, setFilteredRecords] = React.useState<VisitRecord[]>([]);
    const [expandedRecord, setExpandedRecord] = React.useState<string | null>(null);
    const [filterType, setFilterType] = React.useState<'all' | 'domiciliar' | 'vetorial'>('all');
    const [filterProfessional, setFilterProfessional] = React.useState<string>('all');
    const [filterDateStart, setFilterDateStart] = React.useState<string>('');
    const [filterDateEnd, setFilterDateEnd] = React.useState<string>('');

    const isAdmin = user?.role === 'admin';

    React.useEffect(() => {
        loadRecords();
    }, []);

    React.useEffect(() => {
        applyFilters();
    }, [records, filterType, filterProfessional, filterDateStart, filterDateEnd]);

    const loadRecords = () => {
        const allRecords = isAdmin
            ? getAllVisitRecords()
            : getVisitRecordsByProfessional(user?.id);

        setRecords(allRecords.sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ));
    };

    const applyFilters = () => {
        let filtered = [...records];

        if (filterType !== 'all') {
            filtered = filtered.filter(r => r.type === filterType);
        }

        if (filterProfessional !== 'all' && isAdmin) {
            filtered = filtered.filter(r => r.professionalId === filterProfessional);
        }

        if (filterDateStart) {
            filtered = filtered.filter(r => new Date(r.date) >= new Date(filterDateStart));
        }

        if (filterDateEnd) {
            filtered = filtered.filter(r => new Date(r.date) <= new Date(filterDateEnd));
        }

        setFilteredRecords(filtered);
    };

    const handleDelete = (recordId: string) => {
        if (confirm('Tem certeza que deseja excluir este registro?')) {
            const success = deleteVisitRecord(recordId);
            if (success) {
                loadRecords();
                alert('Registro excluído com sucesso!');
            }
        }
    };

    const toggleExpand = (recordId: string) => {
        setExpandedRecord(expandedRecord === recordId ? null : recordId);
    };

    const stats = getVisitStatistics(isAdmin ? undefined : user?.id);
    const uniqueProfessionals = isAdmin
        ? Array.from(new Set(records.map(r => r.professionalId)))
            .map(id => records.find(r => r.professionalId === id)!)
        : [];

    return (
        <div className="p-4 max-w-7xl mx-auto">
            <div className="bg-white shadow-lg rounded-lg p-6">
                <div className="flex items-center gap-3 mb-6">
                    <ClipboardList className="w-8 h-8 text-sus-blue" />
                    <h1 className="text-2xl font-bold text-sus-blue">Histórico de Visitas</h1>
                </div>

                {/* Estatísticas */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="text-sm text-slate-600">Total de Registros</div>
                        <div className="text-2xl font-bold text-sus-blue">{stats.totalRecords}</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                        <div className="text-sm text-slate-600">Total de Visitas</div>
                        <div className="text-2xl font-bold text-green-600">{stats.totalVisits}</div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                        <div className="text-sm text-slate-600">Visitas Domiciliares</div>
                        <div className="text-2xl font-bold text-purple-600">{stats.domiciliarRecords}</div>
                    </div>
                    <div className="bg-amber-50 p-4 rounded-lg">
                        <div className="text-sm text-slate-600">Controle Vetorial</div>
                        <div className="text-2xl font-bold text-amber-600">{stats.vetorialRecords}</div>
                    </div>
                </div>

                {/* Filtros */}
                <div className="bg-slate-50 p-4 rounded-lg mb-6">
                    <h3 className="font-medium text-slate-700 mb-3">Filtros</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value as any)}
                                className="w-full p-2 border rounded"
                            >
                                <option value="all">Todos</option>
                                <option value="domiciliar">Domiciliar</option>
                                <option value="vetorial">Controle Vetorial</option>
                            </select>
                        </div>

                        {isAdmin && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Profissional</label>
                                <select
                                    value={filterProfessional}
                                    onChange={(e) => setFilterProfessional(e.target.value)}
                                    className="w-full p-2 border rounded"
                                >
                                    <option value="all">Todos</option>
                                    {uniqueProfessionals.map(prof => (
                                        <option key={prof.professionalId} value={prof.professionalId}>
                                            {prof.professionalName}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Data Início</label>
                            <input
                                type="date"
                                value={filterDateStart}
                                onChange={(e) => setFilterDateStart(e.target.value)}
                                className="w-full p-2 border rounded"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Data Fim</label>
                            <input
                                type="date"
                                value={filterDateEnd}
                                onChange={(e) => setFilterDateEnd(e.target.value)}
                                className="w-full p-2 border rounded"
                            />
                        </div>
                    </div>
                </div>

                {/* Lista de Registros */}
                <div className="space-y-3">
                    {filteredRecords.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                            Nenhum registro encontrado
                        </div>
                    ) : (
                        filteredRecords.map((record) => (
                            <div
                                key={record.id}
                                className={`border rounded-lg ${record.type === 'domiciliar' ? 'border-blue-200 bg-blue-50' : 'border-amber-200 bg-amber-50'
                                    }`}
                            >
                                {/* Cabeçalho do Registro */}
                                <div
                                    className="p-4 cursor-pointer hover:bg-opacity-80"
                                    onClick={() => toggleExpand(record.id)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4 flex-1">
                                            {record.type === 'domiciliar' ? (
                                                <FileText className="w-6 h-6 text-blue-600" />
                                            ) : (
                                                <AlertTriangle className="w-6 h-6 text-amber-600" />
                                            )}

                                            <div className="flex-1">
                                                <div className="font-medium text-slate-900">
                                                    {record.type === 'domiciliar' ? 'Visita Domiciliar' : 'Controle Vetorial'}
                                                    <span className="ml-2 text-sm text-slate-600">
                                                        ({record.visits.length} visita{record.visits.length > 1 ? 's' : ''})
                                                    </span>
                                                </div>
                                                <div className="flex gap-4 text-sm text-slate-600 mt-1">
                                                    <span className="flex items-center gap-1">
                                                        <User className="w-4 h-4" />
                                                        {record.professionalName}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="w-4 h-4" />
                                                        {new Date(record.date).toLocaleDateString('pt-BR')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(record.id);
                                                }}
                                                className="p-2 text-red-500 hover:bg-red-100 rounded"
                                                title="Excluir registro"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                            {expandedRecord === record.id ? (
                                                <ChevronUp className="w-5 h-5 text-slate-400" />
                                            ) : (
                                                <ChevronDown className="w-5 h-5 text-slate-400" />
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Detalhes Expandidos */}
                                {expandedRecord === record.id && (
                                    <div className="border-t p-4 bg-white">
                                        <div className="space-y-4">
                                            {record.visits.map((visit, idx) => (
                                                <div key={visit.id} className="border-l-4 border-slate-300 pl-4">
                                                    <div className="font-medium text-slate-700 mb-2">
                                                        Visita #{idx + 1}
                                                    </div>

                                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                                                        <div>
                                                            <span className="text-slate-600">Turno:</span>
                                                            <span className="ml-2 font-medium">
                                                                {visit.shift === 'morning' ? 'Manhã' : visit.shift === 'afternoon' ? 'Tarde' : 'Noite'}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className="text-slate-600">Microárea:</span>
                                                            <span className="ml-2 font-medium">{visit.microArea}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-slate-600">Desfecho:</span>
                                                            <span className="ml-2 font-medium">
                                                                {visit.outcome === 'realized' ? 'Realizada' : visit.outcome === 'refused' ? 'Recusada' : 'Ausente'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {record.type === 'domiciliar' && visit.citizenName && (
                                                        <div className="mt-2">
                                                            <div className="text-sm">
                                                                <span className="text-slate-600">Cidadão:</span>
                                                                <span className="ml-2 font-medium">{visit.citizenName}</span>
                                                            </div>
                                                            {visit.citizenCNS && (
                                                                <div className="text-sm">
                                                                    <span className="text-slate-600">CNS:</span>
                                                                    <span className="ml-2 font-mono">{visit.citizenCNS}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {record.type === 'vetorial' && (
                                                        <div className="mt-2">
                                                            {visit.larvaeFound && (
                                                                <div className="text-sm text-red-600 font-medium">
                                                                    ⚠️ Larvas encontradas
                                                                </div>
                                                            )}
                                                            {visit.focusCount && visit.focusCount > 0 && (
                                                                <div className="text-sm">
                                                                    <span className="text-slate-600">Focos:</span>
                                                                    <span className="ml-2 font-medium">{visit.focusCount}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {visit.address && (
                                                        <div className="mt-2 text-sm flex items-start gap-1">
                                                            <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                                                            <span className="text-slate-600">{visit.address}</span>
                                                        </div>
                                                    )}

                                                    {visit.observations && (
                                                        <div className="mt-2 text-sm">
                                                            <span className="text-slate-600">Observações:</span>
                                                            <p className="mt-1 text-slate-700">{visit.observations}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        <div className="mt-4 pt-4 border-t text-xs text-slate-500">
                                            Registrado em: {new Date(record.createdAt).toLocaleString('pt-BR')}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
