import type { Sex } from '../types/form';

export interface Citizen {
    cns: string;
    name: string;
    dateOfBirth: string;
    sex: Sex;
    address: string;
    uf?: string;
    municipioName?: string;
    municipioCode?: string;
}

const MOCK_CITIZENS: Citizen[] = [];

export const searchCitizenByCNS = async (cns: string): Promise<Citizen | null> => {
    await new Promise(resolve => setTimeout(resolve, 500));

    const storedCitizens = localStorage.getItem('citizens');
    const allCitizens = storedCitizens ? [...MOCK_CITIZENS, ...JSON.parse(storedCitizens)] : MOCK_CITIZENS;

    const citizen = allCitizens.find(c => c.cns === cns);
    return citizen || null;
};

const normalizeText = (text: string): string => {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
};

export const searchCitizenByName = async (name: string): Promise<Citizen[]> => {
    await new Promise(resolve => setTimeout(resolve, 500));

    const storedCitizens = localStorage.getItem('citizens');
    const allCitizens = storedCitizens ? [...MOCK_CITIZENS, ...JSON.parse(storedCitizens)] : MOCK_CITIZENS;

    const searchTermNormalized = normalizeText(name.trim());

    const citizens = allCitizens.filter(c => {
        const nameNormalized = normalizeText(c.name);
        const searchWords = searchTermNormalized.split(/\s+/);
        return searchWords.every(word => nameNormalized.includes(word));
    });

    return citizens;
};

export const addCitizen = (citizen: Omit<Citizen, 'sex'> & { sex?: Sex }): void => {
    const storedCitizens = localStorage.getItem('citizens');
    const citizens = storedCitizens ? JSON.parse(storedCitizens) : [];

    const newCitizen: Citizen = {
        ...citizen,
        sex: citizen.sex || 'M'
    };

    citizens.push(newCitizen);
    localStorage.setItem('citizens', JSON.stringify(citizens));
};

export const getAllCitizens = (): Citizen[] => {
    const storedCitizens = localStorage.getItem('citizens');
    const customCitizens = storedCitizens ? JSON.parse(storedCitizens) : [];
    return [...MOCK_CITIZENS, ...customCitizens];
};

export const updateCitizen = (cns: string, updatedData: Partial<Citizen>): boolean => {
    const storedCitizens = localStorage.getItem('citizens');
    const citizens = storedCitizens ? JSON.parse(storedCitizens) : [];

    const index = citizens.findIndex((c: Citizen) => c.cns === cns);
    if (index !== -1) {
        citizens[index] = { ...citizens[index], ...updatedData };
        localStorage.setItem('citizens', JSON.stringify(citizens));
        return true;
    }
    return false;
};

export const deleteCitizen = (cns: string): boolean => {
    const storedCitizens = localStorage.getItem('citizens');
    const citizens = storedCitizens ? JSON.parse(storedCitizens) : [];

    const filteredCitizens = citizens.filter((c: Citizen) => c.cns !== cns);
    if (filteredCitizens.length < citizens.length) {
        localStorage.setItem('citizens', JSON.stringify(filteredCitizens));
        return true;
    }
    return false;
};
