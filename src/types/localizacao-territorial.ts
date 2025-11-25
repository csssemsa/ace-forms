// Tipos para Identificação Geográfica Territorial

export interface Municipio {
    codigo: string; // Código IBGE
    nome: string;
}

export interface LocalizacaoTerritorial {
    // Dados Municipais
    municipio?: Municipio;

    // Organização Territorial
    bairro?: string;
    setor?: string;          // Setor censitário
    quarteirão?: string;      // Quadra/Quarteirão
    microarea?: string;       // Microárea (já existe, mantendo aqui para referência)

    // Endereço Detalhado
    logradouro?: string;
    numero?: string;
    complemento?: string;
    pontoReferencia?: string;
    cep?: string;
}
