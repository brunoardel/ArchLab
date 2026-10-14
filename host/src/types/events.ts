/**
 * Contratos de eventos desacoplados entre Host e Remote.
 * Utiliza CustomEvent nativo do navegador para comunicação sem acoplamento de estado.
 */

export interface TerrenoRecalculadoDetail {
  timestamp: number;
  versao: string;
}

export interface TerrenoAlteradoDetail {
  terrenoId: string;
}
