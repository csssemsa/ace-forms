// Tipos para Notificação de Casos Suspeitos conforme padrão SINAN

export type DoencaSuspeita = 'dengue' | 'zika' | 'chikungunya' | 'todas';

export type Sexo = 'M' | 'F';

export type ClassificacaoCaso =
    | 'suspeito'
    | 'confirmado_laboratorial'
    | 'confirmado_clinico'
    | 'descartado';

export type Gravidade =
    | 'classica'
    | 'com_sinais_alarme'
    | 'grave';

export interface Sintomas {
    febre: boolean;
    cefaleia: boolean;
    mialgia: boolean;
    artralgia: boolean;
    exantema: boolean;
    dorRetroorbital: boolean;
    nausea: boolean;
    vomito: boolean;
    manchasVermelhas: boolean;
    prostacao: boolean;
}

export interface SinaisAlarme {
    dorAbdominal: boolean;
    vomitoPersistente: boolean;
    sangramento: boolean;
    letargia: boolean;
    hipotensao: boolean;
    hepatomegalia: boolean;
    acumuloLiquidos: boolean;
}

export interface Notification {
    id: string;

    // Identificação do Paciente
    nomePaciente: string;
    dataNascimento: string; // YYYY-MM-DD
    sexo: Sexo;
    cns: string;
    telefone?: string;
    endereco: string;
    bairro?: string;
    municipio?: string;

    // Dados Clínicos
    dataInicioSintomas: string; // YYYY-MM-DD
    doencaSuspeita: DoencaSuspeita;

    // Sintomas
    sintomas: Sintomas;

    // Sinais de Alarme (opcional, apenas se presente)
    sinaisAlarme?: SinaisAlarme;
    temSinaisAlarme: boolean;

    // Classificação
    caso: ClassificacaoCaso;
    gravidade: Gravidade;

    // Exames Laboratoriais (opcional)
    exameRealizado?: boolean;
    tipoExame?: string;
    resultadoExame?: 'positivo' | 'negativo' | 'inconclusivo';
    dataExame?: string;

    // Encaminhamento
    encaminhadoParaUBS: boolean;
    nomeUBS?: string;
    dataEncaminhamento?: string;
    hospitalizacao?: boolean;

    // Evolução do Caso
    evolucao?: 'cura' | 'obito' | 'em_acompanhamento';
    dataEvolucao?: string;

    // Metadata
    profissionalNotificador: string; // CPF do ACE
    nomeProfissional?: string;
    dataNotificacao: string; // YYYY-MM-DD
    observacoes?: string;

    // Geo (se disponível)
    latitude?: number;
    longitude?: number;
}

// Tipos auxiliares para formulário
export interface NotificationFormData extends Omit<Notification, 'id' | 'dataNotificacao'> { }
