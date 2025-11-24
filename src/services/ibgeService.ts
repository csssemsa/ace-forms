export interface UF {
    id: number;
    sigla: string;
    nome: string;
}

export interface Municipio {
    id: number;
    nome: string;
    microrregiao: {
        mesorregiao: {
            UF: UF;
        };
    };
}

const BASE_URL = 'https://servicodados.ibge.gov.br/api/v1/localidades';

// Cache simples em memória
let ufsCache: UF[] | null = null;
const municipiosCache: Record<string, Municipio[]> = {};

export const getUFs = async (): Promise<UF[]> => {
    if (ufsCache) return ufsCache;

    try {
        const response = await fetch(`${BASE_URL}/estados?orderBy=nome`);
        if (!response.ok) throw new Error('Erro ao buscar UFs');
        const data = await response.json();
        ufsCache = data;
        return data;
    } catch (error) {
        console.error('Erro ao buscar UFs:', error);
        return [];
    }
};

export const getMunicipiosByUF = async (ufSigla: string): Promise<Municipio[]> => {
    if (municipiosCache[ufSigla]) return municipiosCache[ufSigla];

    try {
        const response = await fetch(`${BASE_URL}/estados/${ufSigla}/municipios?orderBy=nome`);
        if (!response.ok) throw new Error('Erro ao buscar municípios');
        const data = await response.json();
        municipiosCache[ufSigla] = data;
        return data;
    } catch (error) {
        console.error(`Erro ao buscar municípios da UF ${ufSigla}:`, error);
        return [];
    }
};
