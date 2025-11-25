import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Plus, Search, Calendar, User, FileText } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { getAllNotifications } from '../services/notificationService';
import type { Notification, DoencaSuspeita, Gravidade } from '../types/notification';

export const NotificationList: React.FC = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = React.useState<Notification[]>([]);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [filterDoenca, setFilterDoenca] = React.useState<string>('');
    const [filterGravidade, setFilterGravidade] = React.useState<string>('');

    React.useEffect(() => {
        loadNotifications();
    }, []);

    const loadNotifications = () => {
        const allNotifications = getAllNotifications();
        setNotifications(allNotifications);
    };

    const filteredNotifications = notifications.filter(n => {
        const matchesSearch =
            n.nomePaciente.toLowerCase().includes(searchTerm.toLowerCase()) ||
            n.cns.includes(searchTerm);

        const matchesDoenca = !filterDoenca || n.doencaSuspeita === filterDoenca;
        const matchesGravidade = !filterGravidade || n.gravidade === filterGravidade;

        return matchesSearch && matchesDoenca && matchesGravidade;
    });

    const getDoencaBadge = (doenca: DoencaSuspeita) => {
        const colors = {
            dengue: 'bg-red-100 text-red-800',
            zika: 'bg-purple-100 text-purple-800',
            chikungunya: 'bg-orange-100 text-orange-800',
            todas: 'bg-gray-100 text-gray-800',
        };
        return colors[doenca] || colors.todas;
    };

    const getGravidadeBadge = (gravidade: Gravidade) => {
        const colors = {
            classica: 'bg-green-100 text-green-800',
            com_sinais_alarme: 'bg-yellow-100 text-yellow-800',
            grave: 'bg-red-100 text-red-800',
        };
        return colors[gravidade];
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto my-8 px-4 sm:px-6">
            <Card className="border-t-4 border-t-red-600">
                <CardHeader className="bg-white border-b-0 pb-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-50 rounded-lg">
                                <AlertCircle className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                                <CardTitle>Notificações de Casos Suspeitos</CardTitle>
                                <p className="text-sm text-slate-500">Registro de arboviroses (SINAN)</p>
                            </div>
                        </div>
                        <Button
                            onClick={() => navigate('/notificacoes/nova')}
                            className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto"
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            Nova Notificação
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Estatísticas */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-slate-50 p-4 rounded-lg">
                            <div className="text-sm text-slate-600">Total de Notificações</div>
                            <div className="text-2xl font-bold text-slate-800">{notifications.length}</div>
                        </div>
                        <div className="bg-red-50 p-4 rounded-lg">
                            <div className="text-sm text-slate-600">Dengue</div>
                            <div className="text-2xl font-bold text-red-600">
                                {notifications.filter(n => n.doencaSuspeita === 'dengue').length}
                            </div>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg">
                            <div className="text-sm text-slate-600">Zika</div>
                            <div className="text-2xl font-bold text-purple-600">
                                {notifications.filter(n => n.doencaSuspeita === 'zika').length}
                            </div>
                        </div>
                        <div className="bg-orange-50 p-4 rounded-lg">
                            <div className="text-sm text-slate-600">Chikungunya</div>
                            <div className="text-2xl font-bold text-orange-600">
                                {notifications.filter(n => n.doencaSuspeita === 'chikungunya').length}
                            </div>
                        </div>
                    </div>

                    {/* Filtros */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <Input
                            icon={<Search className="w-4 h-4" />}
                            placeholder="Buscar por nome ou CNS..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />

                        <Select
                            options={[
                                { value: '', label: 'Todas as doenças' },
                                { value: 'dengue', label: 'Dengue' },
                                { value: 'zika', label: 'Zika' },
                                { value: 'chikungunya', label: 'Chikungunya' },
                            ]}
                            value={filterDoenca}
                            onChange={(e) => setFilterDoenca(e.target.value)}
                        />

                        <Select
                            options={[
                                { value: '', label: 'Todas as gravidades' },
                                { value: 'classica', label: 'Clássica' },
                                { value: 'com_sinais_alarme', label: 'Com Sinais de Alarme' },
                                { value: 'grave', label: 'Grave' },
                            ]}
                            value={filterGravidade}
                            onChange={(e) => setFilterGravidade(e.target.value)}
                        />
                    </div>

                    {/* Lista de Notificações */}
                    <div className="space-y-4">
                        {filteredNotifications.length === 0 ? (
                            <div className="text-center py-12 text-slate-500">
                                <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>Nenhuma notificação encontrada</p>
                            </div>
                        ) : (
                            filteredNotifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors"
                                >
                                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <User className="w-4 h-4 text-slate-400" />
                                                <h4 className="font-semibold text-slate-800">{notification.nomePaciente}</h4>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-slate-600">
                                                <div>
                                                    <span className="font-medium">CNS:</span> {notification.cns}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-4 h-4" />
                                                    <span className="font-medium">Sintomas:</span> {notification.dataInicioSintomas}
                                                </div>
                                                <div>
                                                    <span className="font-medium">Endereço:</span> {notification.endereco}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <FileText className="w-4 h-4" />
                                                    <span className="font-medium">Notificado em:</span> {notification.dataNotificacao}
                                                </div>
                                            </div>

                                            {notification.observacoes && (
                                                <div className="mt-2 text-sm text-slate-600 italic">
                                                    {notification.observacoes}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium text-center ${getDoencaBadge(notification.doencaSuspeita)}`}>
                                                {notification.doencaSuspeita.toUpperCase()}
                                            </span>
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium text-center ${getGravidadeBadge(notification.gravidade)}`}>
                                                {notification.gravidade === 'classica' ? 'CLÁSSICA' :
                                                    notification.gravidade === 'com_sinais_alarme' ? 'SINAIS ALARME' : 'GRAVE'}
                                            </span>
                                            {notification.encaminhadoParaUBS && (
                                                <span className="px-3 py-1 rounded-full text-xs font-medium text-center bg-blue-100 text-blue-800">
                                                    ENCAMINHADO
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
