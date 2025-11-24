// Serviço de Cálculo de Rotas e Distâncias
// Usa a fórmula de Haversine para calcular distâncias entre coordenadas

import { getDistance, getPathLength } from 'geolib';

export interface Coordinates {
    lat: number;
    lng: number;
}

export interface RoutePoint extends Coordinates {
    id: string;
    timestamp?: string;
    address?: string;
}

export interface RouteStatistics {
    totalDistance: number; // em metros
    totalDistanceKm: number; // em quilômetros
    pointCount: number;
    averageDistance: number; // distância média entre pontos
    straightLineDistance: number; // distância em linha reta do início ao fim
}

/**
 * Calcula a distância entre dois pontos usando Haversine
 * @param point1 Primeiro ponto
 * @param point2 Segundo ponto
 * @returns Distância em metros
 */
export function calculateDistance(point1: Coordinates, point2: Coordinates): number {
    return getDistance(
        { latitude: point1.lat, longitude: point1.lng },
        { latitude: point2.lat, longitude: point2.lng }
    );
}

/**
 * Calcula a distância total de uma rota (sequência de pontos)
 * @param points Array de pontos ordenados
 * @returns Distância total em metros
 */
export function calculateRouteDistance(points: Coordinates[]): number {
    if (points.length < 2) return 0;

    const geolibPoints = points.map(p => ({
        latitude: p.lat,
        longitude: p.lng
    }));

    return getPathLength(geolibPoints);
}

/**
 * Calcula estatísticas completas de uma rota
 * @param points Array de pontos da rota
 * @returns Estatísticas da rota
 */
export function calculateRouteStatistics(points: RoutePoint[]): RouteStatistics {
    if (points.length === 0) {
        return {
            totalDistance: 0,
            totalDistanceKm: 0,
            pointCount: 0,
            averageDistance: 0,
            straightLineDistance: 0
        };
    }

    if (points.length === 1) {
        return {
            totalDistance: 0,
            totalDistanceKm: 0,
            pointCount: 1,
            averageDistance: 0,
            straightLineDistance: 0
        };
    }

    const totalDistance = calculateRouteDistance(points);
    const straightLineDistance = calculateDistance(points[0], points[points.length - 1]);
    const averageDistance = totalDistance / (points.length - 1);

    return {
        totalDistance,
        totalDistanceKm: totalDistance / 1000,
        pointCount: points.length,
        averageDistance,
        straightLineDistance
    };
}

/**
 * Formata distância para exibição
 * @param meters Distância em metros
 * @returns String formatada (ex: "1.5 km" ou "350 m")
 */
export function formatDistance(meters: number): string {
    if (meters >= 1000) {
        return `${(meters / 1000).toFixed(2)} km`;
    }
    return `${Math.round(meters)} m`;
}

/**
 * Agrupa pontos por profissional e calcula estatísticas
 * @param points Array de pontos com informação de profissional
 * @returns Mapa de estatísticas por profissional
 */
export function groupByProfessional(
    points: Array<RoutePoint & { professionalId: string; professionalName: string }>
): Map<string, RouteStatistics & { professionalName: string; points: RoutePoint[] }> {
    const grouped = new Map<string, Array<RoutePoint & { professionalName: string }>>();

    // Agrupar pontos
    points.forEach(point => {
        if (!grouped.has(point.professionalId)) {
            grouped.set(point.professionalId, []);
        }
        grouped.get(point.professionalId)!.push(point);
    });

    // Calcular estatísticas para cada profissional
    const result = new Map();

    grouped.forEach((professionalPoints, professionalId) => {
        // Ordenar por timestamp se disponível
        const sortedPoints = professionalPoints.sort((a, b) => {
            if (a.timestamp && b.timestamp) {
                return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
            }
            return 0;
        });

        const stats = calculateRouteStatistics(sortedPoints);

        result.set(professionalId, {
            ...stats,
            professionalName: professionalPoints[0].professionalName,
            points: sortedPoints
        });
    });

    return result;
}

/**
 * Calcula o centro geográfico (centroid) de um conjunto de pontos
 * @param points Array de coordenadas
 * @returns Coordenadas do centro
 */
export function calculateCenter(points: Coordinates[]): Coordinates {
    if (points.length === 0) {
        return { lat: -6.0667, lng: -50.0333 }; // Parauapebas, PA (fallback)
    }

    const sum = points.reduce(
        (acc, point) => ({
            lat: acc.lat + point.lat,
            lng: acc.lng + point.lng
        }),
        { lat: 0, lng: 0 }
    );

    return {
        lat: sum.lat / points.length,
        lng: sum.lng / points.length
    };
}

/**
 * Calcula bounds (limites) para um conjunto de pontos
 * @param points Array de coordenadas
 * @returns Bounds no formato [[minLat, minLng], [maxLat, maxLng]]
 */
export function calculateBounds(points: Coordinates[]): [[number, number], [number, number]] {
    if (points.length === 0) {
        // Bounds padrão para Parauapebas
        return [[-6.1, -50.1], [-6.0, -50.0]];
    }

    const lats = points.map(p => p.lat);
    const lngs = points.map(p => p.lng);

    return [
        [Math.min(...lats), Math.min(...lngs)],
        [Math.max(...lats), Math.max(...lngs)]
    ];
}
