export type Sex = 'M' | 'F';

export type VisitOutcome = 'realized' | 'refused' | 'absent';

export type PropertyType =
    | 'domicilio'
    | 'comercio'
    | 'terreno'
    | 'ponto_estrategico'
    | 'escola'
    | 'outros';

export type StrategicPointType =
    | 'borracharia'
    | 'cemiterio'
    | 'ferro_velho'
    | 'deposito_construcao'
    | 'deposito_reciclagem'
    | 'garagem'
    | 'outros';

export type InfestationLevel = 'baixo' | 'medio' | 'alto';

export type ContainerType =
    | 'pneus'
    | 'vasos'
    | 'garrafas'
    | 'caixa_dagua'
    | 'calhas'
    | 'lixo'
    | 'outros';

export type VisitMotive =
    | 'cadastramento_atualizacao'
    | 'visita_periodica'
    | 'busca_ativa'
    | 'acompanhamento'
    | 'controle_vetorial'
    | 'egresso_internacao'
    | 'convite_coletivo'
    | 'orientacao_prevencao'
    | 'outros';

export interface Visit {
    id: string;
    shift: 'morning' | 'afternoon' | 'night';
    microArea: string;
    propertyType: PropertyType;
    outcome: VisitOutcome;

    // Campos para visita domiciliar
    citizenCNS?: string;
    citizenName?: string;
    recordNumber?: string;
    dateOfBirth?: string;
    sex?: Sex;
    weight?: number;
    height?: number;

    // Campos de endereço
    address?: string;
    cep?: string;
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;

    // Campos para ponto estratégico
    strategicPointType?: StrategicPointType;
    responsibleName?: string;
    responsiblePhone?: string;
    hasStandingWater?: boolean;
    containerTypes?: ContainerType[];
    larvaeFound?: boolean;
    focusCount?: number;
    adultMosquitoes?: boolean;
    infestationLevel?: InfestationLevel;
    mechanicalControl?: boolean;
    chemicalTreatment?: boolean;
    guidanceProvided?: boolean;
    notificationIssued?: boolean;
    requiresReturn?: boolean;
    observations?: string;

    // Motivos da visita
    motives: VisitMotive[];
}

export interface VisitationFormHeader {
    professionalName: string;
    cbo: string;
    cnes: string;
    ine?: string;
    date: string;
}

export interface VisitationFormData extends VisitationFormHeader {
    visits: Visit[];
}
