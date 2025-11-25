// Tipos para Controle Vetorial conforme sistemas reais do SUS

export type TipoDeposito =
    | 'pneu'
    | 'caixaDagua'
    | 'pratoPlantas'
    | 'lixo'
    | 'piscina'
    | 'calha'
    | 'tambor'
    | 'poco'
    | 'cisterna'
    | 'outros';

export type Larvicida =
    | 'temefos'      // Organofosforado mais comum
    | 'BTI'          // Bacillus thuringiensis israelensis (biológico)
    | 'pyriproxyfen' // Regulador de crescimento
    | 'diflubenzuron'; // Inibidor de quitina

export type ClassificacaoImovel =
    | 'A+'  // Positivo para larvas
    | 'B'   // Recusado
    | 'C'   // Fechado
    | 'D1'  // Desabitado
    | 'E';  // Estabelecimento comercial/terreno baldio

export interface Deposito {
    tipo: TipoDeposito;
    outroTipo?: string; // Usado quando tipo = 'outros'
    quantidade: number;
    comLarvas: boolean;
}

export interface ControleVetorial {
    // Depósitos Inspecionados
    depositosInspecionados: Deposito[];

    // Ações Realizadas
    depositosEliminados: number;
    depositosTratados: number;

    // Larvicida Utilizado (opcional)
    larvicidaUtilizado?: Larvicida;
    dosagem?: string;

    // Classificação Oficial do Imóvel
    classificacaoImovel: ClassificacaoImovel;
    motivoRecusa?: string; // Obrigatório se classificacaoImovel = 'B'

    // Observações do Controle Vetorial
    observacoes?: string;
}
