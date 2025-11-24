import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { Icon, type LatLngBoundsExpression } from 'leaflet';
import { MapPin, Navigation, TrendingUp, Clock, RefreshCw, Trash2, AlertTriangle, Database, X, Filter, Calendar, Search, ChevronDown, Check } from 'lucide-react';
import { clearGeocodeCache, getGeocodeStats } from '../services/geocodingService';
import { getAllVisitRecords, clearAllVisitRecords } from '../services/visitService';
import { geocodeAddress } from '../services/geocodingService';
import {
    calculateRouteStatistics,
    formatDistance,
    calculateBounds,
    type RoutePoint
} from '../services/routeCalculationService';
import { calculateMultiPointRoute, formatDuration, type RouteCoordinate } from '../services/routingService';

interface GeocodedVisit extends RoutePoint {
    visitId: string;
    recordId: string;
    type: 'domiciliar' | 'vetorial';
    address: string;
    professionalId: string;
    professionalName: string;
    date: string;
    microArea: string;
    citizenName?: string;
}

interface VisitMapProps {
    user: any;
}

// Componente para ajustar bounds do mapa
function MapBounds({ points }: { points: GeocodedVisit[] }) {
    const map = useMap();

    useEffect(() => {
        if (points.length > 0) {
            const bounds = calculateBounds(points);
            map.fitBounds(bounds as LatLngBoundsExpression, { padding: [50, 50] });
        }
    }, [points, map]);

    return null;
}

export const VisitMap: React.FC<VisitMapProps> = ({ user }) => {
    const [geocodedVisits, setGeocodedVisits] = useState<GeocodedVisit[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [stats, setStats] = useState<ReturnType<typeof calculateRouteStatistics> | null>(null);
    const [routeCoordinates, setRouteCoordinates] = useState<RouteCoordinate[]>([]);
    const [routeDistance, setRouteDistance] = useState<number>(0);
    const [routeDuration, setRouteDuration] = useState<number>(0);
    const [calculatingRoute, setCalculatingRoute] = useState(false);
    const [debugLogs, setDebugLogs] = useState<string[]>([]);
    const [showDebug, setShowDebug] = useState(false);
    const [showInspector, setShowInspector] = useState(false);
    const [rawRecords, setRawRecords] = useState<any[]>([]);
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [selectedProfessional, setSelectedProfessional] = useState<string>('all');
    const [availableProfessionals, setAvailableProfessionals] = useState<{ id: string; name: string }[]>([]);
    const [professionalSearchTerm, setProfessionalSearchTerm] = useState('');
    const [filteredProfessionals, setFilteredProfessionals] = useState<{ id: string; name: string }[]>([]);
    const [showProfessionalDropdown, setShowProfessionalDropdown] = useState(false);

    const defaultCenter: [number, number] = [-6.0675, -50.0356];

    // Ícones personalizados
    const domiciliarIcon = new Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    const vetorialIcon = new Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    useEffect(() => {
        if (selectedProfessional === 'all') {
            setProfessionalSearchTerm('');
        } else {
            const prof = availableProfessionals.find(p => p.id === selectedProfessional);
            if (prof) setProfessionalSearchTerm(prof.name);
        }
    }, [selectedProfessional, availableProfessionals]);

    useEffect(() => {
        const term = professionalSearchTerm.toLowerCase();
        const filtered = availableProfessionals.filter(p =>
            p.name.toLowerCase().includes(term) || p.id.includes(term)
        );
        setFilteredProfessionals(filtered);
    }, [professionalSearchTerm, availableProfessionals]);

    useEffect(() => {
        loadAndGeocodeVisits();
    }, [user, startDate, endDate, selectedProfessional]); // Recarregar quando filtros mudarem

    async function loadAndGeocodeVisits() {
        try {
            setLoading(true);
            setError(null);
            setDebugLogs([]);

            const addLog = (msg: string) => setDebugLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);
            addLog('Iniciando carregamento de visitas...');

            let records = getAllVisitRecords();

            // Extrair profissionais únicos para o filtro (apenas se admin)
            if (user.role === 'admin') {
                const professionals = new Map();
                records.forEach(r => {
                    if (!professionals.has(r.professionalId)) {
                        professionals.set(r.professionalId, r.professionalName);
                    }
                });
                setAvailableProfessionals(Array.from(professionals.entries()).map(([id, name]) => ({ id, name })));
            }

            setRawRecords(records); // Guardar registros brutos para inspeção

            // 1. Filtro de Permissão (Usuário Comum vê apenas seus registros)
            if (user.role !== 'admin') {
                records = records.filter(r => r.professionalId === user.id);
            } else if (selectedProfessional !== 'all') {
                // 2. Filtro de Profissional (Admin selecionando específico)
                records = records.filter(r => r.professionalId === selectedProfessional);
            }

            // 3. Filtro de Data
            if (startDate) {
                records = records.filter(r => r.date >= startDate);
            }
            if (endDate) {
                records = records.filter(r => r.date <= endDate);
            }

            const geocoded: GeocodedVisit[] = [];

            for (const record of records) {
                for (const visit of record.visits) {
                    const address = visit.address || '';

                    if (address.length > 5) {
                        addLog(`Geocodificando: ${address}`);
                        const result = await geocodeAddress(address);

                        if (result.coordinates) {
                            addLog(`✅ Sucesso: ${result.coordinates.lat}, ${result.coordinates.lng}`);
                            geocoded.push({
                                id: visit.id,
                                visitId: visit.id,
                                recordId: record.id,
                                type: record.type,
                                address,
                                lat: result.coordinates.lat,
                                lng: result.coordinates.lng,
                                professionalId: record.professionalId,
                                professionalName: record.professionalName,
                                date: record.date,
                                timestamp: record.createdAt,
                                microArea: visit.microArea || '',
                                citizenName: visit.citizenName
                            });
                        } else {
                            addLog(`❌ Falha: ${result.error || 'Endereço não encontrado'}`);
                        }
                    } else {
                        addLog(`⚠️ Ignorado (endereço curto): ${address}`);
                    }
                }
            }

            geocoded.sort((a, b) => {
                const dateA = new Date(a.timestamp || 0).getTime();
                const dateB = new Date(b.timestamp || 0).getTime();
                return dateA - dateB;
            });

            setGeocodedVisits(geocoded);

            if (geocoded.length > 0) {
                const routeStats = calculateRouteStatistics(geocoded);
                setStats(routeStats);

                // Calcular rota real seguindo as vias
                await calculateRealRoute(geocoded);
            }

        } catch (err) {
            console.error('Erro ao carregar visitas:', err);
            setError('Erro ao carregar mapa de visitas');
        } finally {
            setLoading(false);
        }
    }

    async function calculateRealRoute(visits: GeocodedVisit[]) {
        if (visits.length < 2) return;

        try {
            setCalculatingRoute(true);

            // Limitar a 12 pontos para não sobrecarregar a API
            const waypoints: RouteCoordinate[] = visits.slice(0, 12).map(v => ({
                lat: v.lat,
                lng: v.lng
            }));

            const route = await calculateMultiPointRoute(waypoints);

            if (route) {
                setRouteCoordinates(route.coordinates);
                setRouteDistance(route.distance);
                setRouteDuration(route.duration);
            } else {
                // Fallback para linha reta se roteamento falhar
                console.warn('Roteamento falhou, usando linha reta');
                setRouteCoordinates(waypoints);
            }
        } catch (err) {
            console.error('Erro ao calcular rota:', err);
            // Fallback para linha reta
            setRouteCoordinates(visits.map(v => ({ lat: v.lat, lng: v.lng })));
        } finally {
            setCalculatingRoute(false);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-secondary">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-sus-blue mx-auto mb-4"></div>
                    <p className="text-gray-600">Carregando mapa e geocodificando endereços...</p>
                    <p className="text-sm text-gray-500 mt-2">Isso pode levar alguns segundos</p>
                    {calculatingRoute && <p className="text-sm text-sus-blue mt-2">Calculando rota real...</p>}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-screen bg-secondary">
                <div className="text-center text-red-500">
                    <p className="text-xl mb-2">❌ {error}</p>
                    <button
                        onClick={loadAndGeocodeVisits}
                        className="mt-4 px-4 py-2 bg-sus-blue text-white rounded hover:bg-sus-blue-dark"
                    >
                        Tentar Novamente
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-secondary relative">
            {/* Controles do Mapa */}
            {/* Barra de Ferramentas Superior */}
            <div className="bg-white border-b border-gray-200 p-3 shadow-sm z-[1001] relative flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 text-sus-blue font-bold mr-4">
                    <Filter className="w-5 h-5" />
                    <span>Filtros</span>
                </div>

                {/* Filtro de Data */}
                <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded border border-gray-200">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="bg-transparent text-sm border-none focus:ring-0 p-0 text-gray-700 w-32"
                        title="Data Inicial"
                    />
                    <span className="text-gray-400">-</span>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="bg-transparent text-sm border-none focus:ring-0 p-0 text-gray-700 w-32"
                        title="Data Final"
                    />
                    {(startDate || endDate) && (
                        <button
                            onClick={() => { setStartDate(''); setEndDate(''); }}
                            className="ml-2 text-gray-400 hover:text-red-500"
                            title="Limpar Datas"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Filtro de Profissional (Admin) */}
                {user.role === 'admin' && (
                    <div className="relative w-72">
                        <div className="relative">
                            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={professionalSearchTerm}
                                onChange={(e) => {
                                    setProfessionalSearchTerm(e.target.value);
                                    setShowProfessionalDropdown(true);
                                    if (e.target.value === '') setSelectedProfessional('all');
                                }}
                                onFocus={() => setShowProfessionalDropdown(true)}
                                onBlur={() => setTimeout(() => setShowProfessionalDropdown(false), 200)}
                                placeholder="Buscar profissional..."
                                className="w-full pl-8 pr-8 py-1.5 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-sus-blue focus:border-sus-blue"
                            />
                            {selectedProfessional !== 'all' ? (
                                <button
                                    onClick={() => {
                                        setSelectedProfessional('all');
                                        setProfessionalSearchTerm('');
                                    }}
                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            ) : (
                                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            )}
                        </div>

                        {showProfessionalDropdown && (
                            <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-300 rounded shadow-2xl max-h-60 overflow-y-auto z-[9999]" style={{ position: 'absolute' }}>
                                <button
                                    onMouseDown={() => {
                                        setSelectedProfessional('all');
                                        setProfessionalSearchTerm('');
                                        setShowProfessionalDropdown(false);
                                    }}
                                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-between ${selectedProfessional === 'all' ? 'bg-blue-50 text-sus-blue' : 'text-gray-700'}`}
                                >
                                    <span>Todos os Profissionais</span>
                                    {selectedProfessional === 'all' && <Check className="w-4 h-4" />}
                                </button>
                                {filteredProfessionals.map(p => (
                                    <button
                                        key={p.id}
                                        onMouseDown={() => {
                                            setSelectedProfessional(p.id);
                                            setProfessionalSearchTerm(p.name);
                                            setShowProfessionalDropdown(false);
                                        }}
                                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-between ${selectedProfessional === p.id ? 'bg-blue-50 text-sus-blue' : 'text-gray-700'}`}
                                    >
                                        <div>
                                            <p className="font-medium">{p.name}</p>
                                            <p className="text-[10px] text-gray-500">{p.id}</p>
                                        </div>
                                        {selectedProfessional === p.id && <Check className="w-4 h-4" />}
                                    </button>
                                ))}
                                {filteredProfessionals.length === 0 && (
                                    <div className="px-3 py-2 text-sm text-gray-500 text-center italic">
                                        Nenhum profissional encontrado
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                <div className="flex-1"></div>

                {/* Ações */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={loadAndGeocodeVisits}
                        className="p-1.5 text-gray-600 hover:text-sus-blue hover:bg-blue-50 rounded"
                        title="Recarregar Visitas"
                    >
                        <RefreshCw className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => {
                            if (confirm('Limpar cache de endereços? Isso forçará uma nova busca para todos os pontos.')) {
                                clearGeocodeCache();
                                loadAndGeocodeVisits();
                            }
                        }}
                        className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                        title="Limpar Cache"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setShowInspector(true)}
                        className="p-1.5 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded"
                        title="Inspecionar Dados"
                    >
                        <Database className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setShowDebug(!showDebug)}
                        className={`text-xs font-medium px-2 py-1 rounded ${showDebug ? 'bg-gray-200 text-gray-800' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                        Logs
                    </button>
                </div>
            </div>

            {/* Modal Inspetor de Dados */}
            {showInspector && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[2000] p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
                            <h3 className="font-bold flex items-center gap-2">
                                <Database className="w-5 h-5" />
                                Inspetor de Dados Brutos
                            </h3>
                            <button onClick={() => setShowInspector(false)} className="text-gray-400 hover:text-white">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-4 overflow-y-auto flex-1 bg-gray-50">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm flex-1 mr-4">
                                    <p><strong>Usuário Atual:</strong> {user.name} ({user.role})</p>
                                    <p><strong>ID:</strong> {user.id}</p>
                                    <p className="mt-1 text-xs text-gray-500">O mapa exibe apenas visitas criadas por este usuário (exceto se Admin).</p>
                                </div>
                                <button
                                    onClick={() => {
                                        if (confirm('ATENÇÃO: Isso apagará TODAS as visitas salvas neste navegador. Deseja continuar?')) {
                                            clearAllVisitRecords();
                                            loadAndGeocodeVisits();
                                            setShowInspector(false);
                                            alert('Visitas apagadas com sucesso.');
                                        }
                                    }}
                                    className="px-3 py-2 bg-red-100 text-red-700 rounded border border-red-200 hover:bg-red-200 text-xs font-bold flex items-center gap-2"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Apagar Todas as Visitas
                                </button>
                            </div>

                            <h4 className="font-bold mb-2 text-gray-700">Registros Encontrados ({rawRecords.length})</h4>

                            {rawRecords.length === 0 ? (
                                <p className="text-gray-500 italic">Nenhum registro encontrado no navegador.</p>
                            ) : (
                                <div className="space-y-4">
                                    {rawRecords.map((record, i) => {
                                        const isOwner = record.professionalId === user.id;
                                        const isAdmin = user.role === 'admin';
                                        const isVisible = isOwner || isAdmin;

                                        return (
                                            <div key={i} className={`border rounded-lg p-3 ${isVisible ? 'bg-white border-green-200' : 'bg-gray-100 border-gray-200 opacity-70'}`}>
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <span className={`text-xs font-bold px-2 py-1 rounded ${isVisible ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                                                            {isVisible ? 'VISÍVEL' : 'OCULTO (Outro Profissional)'}
                                                        </span>
                                                        <span className="ml-2 text-xs text-gray-500">{new Date(record.date).toLocaleDateString()}</span>
                                                    </div>
                                                    <div className="text-xs text-right">
                                                        <p>Profissional: {record.professionalName}</p>
                                                        <p className="font-mono text-[10px]">{record.professionalId}</p>
                                                    </div>
                                                </div>

                                                <div className="space-y-2 mt-2">
                                                    {record.visits.map((visit: any, j: number) => (
                                                        <div key={j} className="text-sm border-t pt-2 flex justify-between items-center">
                                                            <div className="flex-1">
                                                                <p className="font-medium">{visit.citizenName || 'Sem nome'}</p>
                                                                <p className={`text-xs ${visit.address && visit.address.length > 5 ? 'text-gray-600' : 'text-red-500'}`}>
                                                                    {visit.address || '⚠️ Sem endereço'}
                                                                </p>
                                                            </div>
                                                            <div className="text-xs">
                                                                {visit.address && visit.address.length > 5 ? (
                                                                    <span className="text-blue-600">Pronto para Geocodificar</span>
                                                                ) : (
                                                                    <span className="text-red-500">Endereço Inválido</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Painel de Logs Detalhado */}
            {showDebug && (
                <div className="absolute top-4 left-4 z-[1000] bg-white p-4 rounded shadow-lg max-w-md max-h-[80vh] overflow-y-auto border border-gray-200">
                    <h3 className="font-bold mb-2 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        Logs de Geocodificação
                    </h3>
                    <div className="space-y-1 font-mono text-xs">
                        {debugLogs.length === 0 ? (
                            <p className="text-gray-400">Nenhum log registrado.</p>
                        ) : (
                            debugLogs.map((log, i) => (
                                <p key={i} className={`border-b border-gray-100 pb-1 ${log.includes('❌') ? 'text-red-600' : log.includes('✅') ? 'text-green-600' : 'text-gray-600'}`}>
                                    {log}
                                </p>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Painel de Debug se 0 pontos */}
            {geocodedVisits.length === 0 && !loading && (
                <div className="absolute bottom-4 left-4 z-[1000] bg-white p-4 rounded shadow-lg max-w-md border-l-4 border-yellow-500">
                    <div className="flex items-center gap-2 mb-2 text-yellow-700 font-bold">
                        <AlertTriangle className="w-5 h-5" />
                        Diagnóstico de Mapa
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                        Nenhum ponto exibido. Verifique:
                    </p>
                    <ul className="text-xs text-gray-500 list-disc pl-4 space-y-1">
                        <li>Você tem visitas cadastradas?</li>
                        <li>As visitas têm endereço completo (Rua, Bairro, Cidade)?</li>
                        <li>Tente clicar em "Limpar Cache" acima.</li>
                        <li>Verifique se sua internet está ativa para geocodificação.</li>
                    </ul>
                </div>
            )}

            {stats && (
                <div className="bg-white shadow-md p-4 border-b border-gray-200">
                    {calculatingRoute && (
                        <div className="mb-2 text-center text-sm text-sus-blue">
                            ⏳ Calculando rota real seguindo as vias...
                        </div>
                    )}
                    <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                            <Navigation className="w-8 h-8 text-sus-blue" />
                            <div>
                                <p className="text-xs text-gray-600">Distância Total</p>
                                <p className="text-xl font-bold text-sus-blue">{formatDistance(stats.totalDistance)}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                            <MapPin className="w-8 h-8 text-green-600" />
                            <div>
                                <p className="text-xs text-gray-600">Total de Visitas</p>
                                <p className="text-xl font-bold text-green-600">{stats.pointCount}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg">
                            <TrendingUp className="w-8 h-8 text-amber-600" />
                            <div>
                                <p className="text-xs text-gray-600">Média por Visita</p>
                                <p className="text-xl font-bold text-amber-600">{formatDistance(stats.averageDistance)}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                            <Navigation className="w-8 h-8 text-purple-600" />
                            <div>
                                <p className="text-xs text-gray-600">{routeDistance > 0 ? 'Rota Real' : 'Linha Reta'}</p>
                                <p className="text-xl font-bold text-purple-600">
                                    {routeDistance > 0 ? formatDistance(routeDistance) : formatDistance(stats.straightLineDistance)}
                                </p>
                            </div>
                        </div>

                        {routeDuration > 0 && (
                            <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg">
                                <Clock className="w-8 h-8 text-indigo-600" />
                                <div>
                                    <p className="text-xs text-gray-600">Tempo Estimado</p>
                                    <p className="text-xl font-bold text-indigo-600">{formatDuration(routeDuration)}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="flex-1 relative z-0">
                <MapContainer
                    center={defaultCenter}
                    zoom={13}
                    className="h-full w-full"
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    <MapBounds points={geocodedVisits} />

                    {geocodedVisits.map((visit, index) => (
                        <Marker
                            key={`${visit.visitId}-${index}`}
                            position={[visit.lat, visit.lng]}
                            icon={visit.type === 'domiciliar' ? domiciliarIcon : vetorialIcon}
                        >
                            <Popup>
                                <div className="p-2 min-w-[200px]">
                                    <h3 className="font-bold text-lg mb-2">
                                        {visit.type === 'domiciliar' ? '🏠 Visita Domiciliar' : '⚠️ Controle Vetorial'}
                                    </h3>
                                    <div className="space-y-1 text-sm">
                                        <p><strong>Profissional:</strong> {visit.professionalName}</p>
                                        <p><strong>Data:</strong> {new Date(visit.date).toLocaleDateString('pt-BR')}</p>
                                        <p><strong>Microárea:</strong> {visit.microArea}</p>
                                        {visit.citizenName && <p><strong>Cidadão:</strong> {visit.citizenName}</p>}
                                        <p className="text-xs text-gray-500 mt-2"><strong>Endereço:</strong> {visit.address}</p>
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    ))}

                    {routeCoordinates.length > 1 ? (
                        <Polyline
                            positions={routeCoordinates.map(c => [c.lat, c.lng])}
                            color="#0066CC"
                            weight={4}
                            opacity={0.7}
                        />
                    ) : geocodedVisits.length > 1 && (
                        <Polyline
                            positions={geocodedVisits.map(v => [v.lat, v.lng])}
                            color="#0066CC"
                            weight={3}
                            opacity={0.6}
                            dashArray="10, 10"
                        />
                    )}
                </MapContainer>
            </div>
        </div>
    );
};

