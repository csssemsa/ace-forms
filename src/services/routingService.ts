// Serviço de Roteamento usando OSRM (Open Source Routing Machine)
// Calcula rotas reais seguindo as vias

const OSRM_BASE_URL = 'https://router.project-osrm.org';

export interface RouteCoordinate {
    lat: number;
    lng: number;
}

export interface RouteSegment {
    distance: number; // em metros
    duration: number; // em segundos
    coordinates: RouteCoordinate[];
}

export interface RouteResult {
    distance: number; // distância total em metros
    duration: number; // duração total em segundos
    coordinates: RouteCoordinate[]; // todos os pontos da rota
    segments: RouteSegment[];
}

/**
 * Calcula rota entre dois pontos usando OSRM
 * @param start Coordenadas de início
 * @param end Coordenadas de fim
 * @returns Rota calculada ou null se falhar
 */
export async function calculateRoute(
    start: RouteCoordinate,
    end: RouteCoordinate
): Promise<RouteResult | null> {
    try {
        const coords = `${start.lng},${start.lat};${end.lng},${end.lat}`;
        const url = `${OSRM_BASE_URL}/route/v1/driving/${coords}?overview=full&geometries=geojson`;

        const response = await fetch(url);

        if (!response.ok) {
            console.error('Erro ao calcular rota:', response.status);
            return null;
        }

        const data = await response.json();

        if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
            console.error('Nenhuma rota encontrada');
            return null;
        }

        const route = data.routes[0];
        const geometry = route.geometry;

        // Converter coordenadas GeoJSON para formato Leaflet
        const coordinates: RouteCoordinate[] = geometry.coordinates.map((coord: number[]) => ({
            lng: coord[0],
            lat: coord[1]
        }));

        return {
            distance: route.distance,
            duration: route.duration,
            coordinates,
            segments: route.legs || []
        };

    } catch (error) {
        console.error('Erro ao calcular rota:', error);
        return null;
    }
}

/**
 * Calcula rota passando por múltiplos pontos
 * @param waypoints Array de coordenadas
 * @returns Rota calculada ou null se falhar
 */
export async function calculateMultiPointRoute(
    waypoints: RouteCoordinate[]
): Promise<RouteResult | null> {
    if (waypoints.length < 2) {
        return null;
    }

    try {
        // Formatar coordenadas para OSRM
        const coords = waypoints
            .map(wp => `${wp.lng},${wp.lat}`)
            .join(';');

        const url = `${OSRM_BASE_URL}/route/v1/driving/${coords}?overview=full&geometries=geojson`;

        const response = await fetch(url);

        if (!response.ok) {
            console.error('Erro ao calcular rota:', response.status);
            return null;
        }

        const data = await response.json();

        if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
            console.error('Nenhuma rota encontrada');
            return null;
        }

        const route = data.routes[0];
        const geometry = route.geometry;

        const coordinates: RouteCoordinate[] = geometry.coordinates.map((coord: number[]) => ({
            lng: coord[0],
            lat: coord[1]
        }));

        return {
            distance: route.distance,
            duration: route.duration,
            coordinates,
            segments: route.legs || []
        };

    } catch (error) {
        console.error('Erro ao calcular rota multiponto:', error);
        return null;
    }
}

/**
 * Formata duração em formato legível
 * @param seconds Duração em segundos
 * @returns String formatada (ex: "1h 30min")
 */
export function formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
        return `${hours}h ${minutes}min`;
    }
    return `${minutes}min`;
}

/**
 * Calcula rota otimizada (problema do caixeiro viajante simplificado)
 * Nota: Para muitos pontos, isso pode ser lento. Considere limitar a 10-15 pontos.
 * @param waypoints Array de coordenadas
 * @returns Rota otimizada ou null se falhar
 */
export async function calculateOptimizedRoute(
    waypoints: RouteCoordinate[]
): Promise<RouteResult | null> {
    if (waypoints.length < 2) {
        return null;
    }

    // Para muitos pontos, usar rota simples sem otimização
    if (waypoints.length > 12) {
        console.warn('Muitos pontos para otimização, usando rota simples');
        return calculateMultiPointRoute(waypoints);
    }

    try {
        const coords = waypoints
            .map(wp => `${wp.lng},${wp.lat}`)
            .join(';');

        // Usar serviço de trip do OSRM para otimização
        const url = `${OSRM_BASE_URL}/trip/v1/driving/${coords}?overview=full&geometries=geojson`;

        const response = await fetch(url);

        if (!response.ok) {
            console.error('Erro ao calcular rota otimizada:', response.status);
            // Fallback para rota não otimizada
            return calculateMultiPointRoute(waypoints);
        }

        const data = await response.json();

        if (data.code !== 'Ok' || !data.trips || data.trips.length === 0) {
            console.error('Nenhuma rota otimizada encontrada');
            return calculateMultiPointRoute(waypoints);
        }

        const trip = data.trips[0];
        const geometry = trip.geometry;

        const coordinates: RouteCoordinate[] = geometry.coordinates.map((coord: number[]) => ({
            lng: coord[0],
            lat: coord[1]
        }));

        return {
            distance: trip.distance,
            duration: trip.duration,
            coordinates,
            segments: trip.legs || []
        };

    } catch (error) {
        console.error('Erro ao calcular rota otimizada:', error);
        return calculateMultiPointRoute(waypoints);
    }
}
