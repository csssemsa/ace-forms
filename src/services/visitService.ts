import type { Visit } from '../types/form';

export interface VisitRecord {
    id: string;
    type: 'domiciliar' | 'vetorial';
    professionalId: string;
    professionalName: string;
    professionalCPF: string;
    date: string;
    visits: Visit[];
    createdAt: string;
}

// MOCK DATA FOR TESTING - REMOVIDO
const MOCK_VISIT_RECORDS: VisitRecord[] = [];

const STORAGE_KEY = 'visit_records';

export const saveVisitRecord = (
    visits: Visit[],
    user: any,
    type: 'domiciliar' | 'vetorial',
    date: string
): VisitRecord => {
    const record: VisitRecord = {
        id: crypto.randomUUID(),
        type,
        professionalId: user.id,
        professionalName: user.name,
        professionalCPF: user.cpf,
        date,
        visits,
        createdAt: new Date().toISOString()
    };

    const records = getAllVisitRecords();
    records.push(record);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));

    return record;
};

export const getAllVisitRecords = (): VisitRecord[] => {
    const stored = localStorage.getItem(STORAGE_KEY);
    // Combinar mocks com dados armazenados para teste
    const records = stored ? JSON.parse(stored) : [];

    // Evitar duplicar mocks se já estiverem salvos (opcional, mas bom pra evitar poluição)
    // Aqui vamos apenas retornar os mocks + records reais
    // Se o usuário for admin, vê tudo. Se não, vê só os dele (filtrado no componente)

    // Adicionar mocks apenas se não existirem (por ID)
    const allRecords = [...records];
    MOCK_VISIT_RECORDS.forEach(mock => {
        if (!allRecords.find(r => r.id === mock.id)) {
            allRecords.push(mock);
        }
    });

    return allRecords;
};

export const clearAllVisitRecords = (): void => {
    localStorage.removeItem(STORAGE_KEY);
};

export const getVisitRecordsByProfessional = (professionalId: string): VisitRecord[] => {
    return getAllVisitRecords().filter(record => record.professionalId === professionalId);
};

export const getVisitRecordsByType = (type: 'domiciliar' | 'vetorial'): VisitRecord[] => {
    return getAllVisitRecords().filter(record => record.type === type);
};

export const getVisitRecordsByDateRange = (startDate: string, endDate: string): VisitRecord[] => {
    return getAllVisitRecords().filter(record => {
        const recordDate = new Date(record.date);
        const start = new Date(startDate);
        const end = new Date(endDate);
        return recordDate >= start && recordDate <= end;
    });
};

export const getVisitStatistics = (professionalId?: string) => {
    const records = professionalId
        ? getVisitRecordsByProfessional(professionalId)
        : getAllVisitRecords();

    const totalRecords = records.length;
    const totalVisits = records.reduce((sum, record) => sum + record.visits.length, 0);
    const domiciliarRecords = records.filter(r => r.type === 'domiciliar').length;
    const vetorialRecords = records.filter(r => r.type === 'vetorial').length;

    return {
        totalRecords,
        totalVisits,
        domiciliarRecords,
        vetorialRecords
    };
};

export const deleteVisitRecord = (recordId: string): boolean => {
    const records = getAllVisitRecords();
    const filtered = records.filter(r => r.id !== recordId);

    if (filtered.length < records.length) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
        return true;
    }
    return false;
};
