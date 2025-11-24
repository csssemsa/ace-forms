// Serviço de Geocodificação usando OpenStreetMap Nominatim
// Converte endereços em coordenadas geográficas

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
const CACHE_KEY = 'geocode_cache';
const CACHE_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 dias

interface Coordinates {
    lat: number;
    lng: number;
}

interface GeocodeCache {
    [address: string]: {
        coordinates: Coordinates;
        timestamp: number;
    };
}

interface GeocodeResult {
    coordinates: Coordinates | null;
    fromCache: boolean;
    error?: string;
}

// Fila de requisições para respeitar rate limit (1 req/segundo)
let requestQueue: Array<() => Promise<void>> = [];
let isProcessing = false;

async function processQueue() {
    if (isProcessing || requestQueue.length === 0) return;

    isProcessing = true;

    while (requestQueue.length > 0) {
        const request = requestQueue.shift();
        if (request) {
            await request();
            // Aguardar 1 segundo entre requisições (rate limit)
            await new Promise(resolve => setTimeout(resolve, 1100));
        }
    }

    isProcessing = false;
}

function getCache(): GeocodeCache {
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        return cached ? JSON.parse(cached) : {};
    } catch {
        return {};
    }
}

function setCache(cache: GeocodeCache): void {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
        console.error('Erro ao salvar cache de geocodificação:', error);
    }
}

function normalizeAddress(address: string): string {
    return address
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/,\s*/g, ', ');
}

/**
 * Geocodifica um endereço usando Nominatim API
 * @param address Endereço completo
 * @param city Cidade (opcional, melhora precisão)
 * @param state Estado (opcional, melhora precisão)
 * @returns Coordenadas ou null se não encontrado
 */
export async function geocodeAddress(
    address: string,
    city: string = 'Parauapebas',
    state: string = 'Pará'
): Promise<GeocodeResult> {
    if (!address || address.trim().length < 5) {
        return { coordinates: null, fromCache: false, error: 'Endereço inválido' };
    }

    const normalizedAddress = normalizeAddress(address);
    const cache = getCache();

    // Verificar cache
    const cached = cache[normalizedAddress];
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return { coordinates: cached.coordinates, fromCache: true };
    }

    // Limpeza extra para remover "CEP:" e outros ruídos que confundem o Nominatim
    let cleanAddress = normalizedAddress.replace(/cep:\s*\d{5}-?\d{3}/gi, ''); // Remove CEP completo
    cleanAddress = cleanAddress.replace(/cep\s*\d+/gi, ''); // Remove CEP parcial

    // Verificar se o endereço já contém a cidade/estado para evitar duplicação
    const addressLower = cleanAddress.toLowerCase();
    const cityLower = city.toLowerCase();
    const stateLower = state.toLowerCase();

    let query = cleanAddress;

    // Se não tiver a cidade no endereço, adiciona
    if (!addressLower.includes(cityLower)) {
        query += `, ${city}`;
    }

    // Se não tiver o estado no endereço, adiciona
    if (!addressLower.includes(stateLower) && !addressLower.includes('pa')) { // Check simples para sigla
        query += `, ${state}`;
    }

    query += ', Brasil';

    // Log para debug
    console.log(`[Geocoding] Query original: "${address}" -> Clean: "${cleanAddress}" -> Final: "${query}"`);

    return new Promise((resolve) => {
        const request = async () => {
            try {
                const params = new URLSearchParams({
                    q: query,
                    format: 'json',
                    limit: '1',
                    countrycodes: 'br',
                    addressdetails: '1'
                });

                const url = `${NOMINATIM_BASE_URL}/search?${params}`;
                // console.log(`[Geocoding] Fetching: ${url}`);

                const response = await fetch(url, {
                    headers: {
                        'User-Agent': 'ACE-Forms-App/1.0 (Sistema de Controle de Endemias)'
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const data = await response.json();

                if (data && data.length > 0) {
                    const result = data[0];
                    const coordinates: Coordinates = {
                        lat: parseFloat(result.lat),
                        lng: parseFloat(result.lon)
                    };

                    // Salvar no cache
                    cache[normalizedAddress] = { // Usa o endereço original normalizado como chave
                        coordinates,
                        timestamp: Date.now()
                    };
                    setCache(cache);

                    resolve({ coordinates, fromCache: false });
                } else {
                    console.warn(`[Geocoding] Não encontrado: ${query}`);
                    resolve({ coordinates: null, fromCache: false, error: 'Endereço não encontrado' });
                }
            } catch (error) {
                console.error('Erro ao geocodificar:', error);
                resolve({
                    coordinates: null,
                    fromCache: false,
                    error: error instanceof Error ? error.message : 'Erro desconhecido'
                });
            }
        };

        requestQueue.push(request);
        processQueue();
    });
}

/**
 * Geocodifica múltiplos endereços em lote
 * @param addresses Array de endereços
 * @returns Array de resultados
 */
export async function geocodeAddressBatch(
    addresses: Array<{ address: string; city?: string; state?: string }>
): Promise<Array<GeocodeResult & { originalAddress: string }>> {
    const results: Array<GeocodeResult & { originalAddress: string }> = [];

    for (const addr of addresses) {
        const result = await geocodeAddress(addr.address, addr.city, addr.state);
        results.push({ ...result, originalAddress: addr.address });
    }

    return results;
}

/**
 * Limpa o cache de geocodificação
 */
export function clearGeocodeCache(): void {
    localStorage.removeItem(CACHE_KEY);
}

/**
 * Obtém estatísticas do cache
 */
export function getGeocodeStats(): { total: number; size: string } {
    const cache = getCache();
    const total = Object.keys(cache).length;
    const size = new Blob([JSON.stringify(cache)]).size;
    const sizeKB = (size / 1024).toFixed(2);

    return { total, size: `${sizeKB} KB` };
}
