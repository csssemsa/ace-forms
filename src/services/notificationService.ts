import type { Notification, NotificationFormData } from '../types/notification';

const STORAGE_KEY = 'ace_notifications';

// Seed de notificações para demonstração
const seedNotifications: Notification[] = [
    {
        id: 'notif-001',
        nomePaciente: 'Maria Silva Santos',
        dataNascimento: '1985-03-15',
        sexo: 'F',
        cns: '898765432109876',
        telefone: '92991234567',
        endereco: 'Rua das Flores, 123',
        bairro: 'Centro',
        municipio: 'Manaus',
        dataInicioSintomas: '2025-01-15',
        doencaSuspeita: 'dengue',
        sintomas: {
            febre: true,
            cefaleia: true,
            mialgia: true,
            artralgia: false,
            exantema: true,
            dorRetroorbital: true,
            nausea: false,
            vomito: false,
            manchasVermelhas: true,
            prostacao: true,
        },
        temSinaisAlarme: false,
        caso: 'suspeito',
        gravidade: 'classica',
        encaminhadoParaUBS: true,
        nomeUBS: 'UBS São Jorge',
        dataEncaminhamento: '2025-01-15',
        hospitalizacao: false,
        profissionalNotificador: '123.456.789-00',
        nomeProfissional: 'João Agente',
        dataNotificacao: '2025-01-15',
        observacoes: 'Paciente com histórico de dengue anterior',
    },
];

// Inicializar localStorage com seed se vazio
const initializeStorage = (): void => {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (!existing) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(seedNotifications));
    }
};

// Inicializar ao carregar o módulo
initializeStorage();

export const getAllNotifications = (): Notification[] => {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Erro ao carregar notificações:', error);
        return [];
    }
};

export const getNotificationById = (id: string): Notification | undefined => {
    const notifications = getAllNotifications();
    return notifications.find(n => n.id === id);
};

export const createNotification = (data: NotificationFormData): Notification => {
    const notifications = getAllNotifications();

    const newNotification: Notification = {
        ...data,
        id: crypto.randomUUID(),
        dataNotificacao: new Date().toISOString().split('T')[0], // YYYY-MM-DD
    };

    notifications.push(newNotification);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));

    return newNotification;
};

export const updateNotification = (id: string, data: Partial<Notification>): boolean => {
    const notifications = getAllNotifications();
    const index = notifications.findIndex(n => n.id === id);

    if (index === -1) return false;

    notifications[index] = { ...notifications[index], ...data };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));

    return true;
};

export const deleteNotification = (id: string): boolean => {
    const notifications = getAllNotifications();
    const filtered = notifications.filter(n => n.id !== id);

    if (filtered.length === notifications.length) return false;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
};

// Filtros auxiliares
export const getNotificationsByDoenca = (doenca: string): Notification[] => {
    const notifications = getAllNotifications();
    return notifications.filter(n =>
        doenca === 'todas' || n.doencaSuspeita === doenca || n.doencaSuspeita === 'todas'
    );
};

export const getNotificationsByGravidade = (gravidade: string): Notification[] => {
    const notifications = getAllNotifications();
    return notifications.filter(n => n.gravidade === gravidade);
};

export const getNotificationsByPeriodo = (dataInicio: string, dataFim: string): Notification[] => {
    const notifications = getAllNotifications();
    return notifications.filter(n => {
        const dataNotif = n.dataNotificacao;
        return dataNotif >= dataInicio && dataNotif <= dataFim;
    });
};
