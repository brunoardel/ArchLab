import { Component, ErrorInfo, ReactNode } from 'react';
import './ErrorBoundary.css';

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((props: { error: Error; reset: () => void }) => ReactNode);
  fallbackTitle?: string;
  fallbackMessage?: string;
  moduleName?: string;
  remoteUrl?: string;
  onReset?: () => void;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

/**
 * ErrorBoundary reutilizável para Micro Frontends e componentes React.
 * Captura exceções em tempo de execução e falhas no carregamento de módulos remotos
 * (via dynamic import / Module Federation), impedindo que o Host Shell caia em tela branca.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    // Notifica callbacks externos e registra no console para auditoria de observabilidade
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    console.error(
      `[ErrorBoundary] Falha capturada no módulo "${this.props.moduleName || 'Desconhecido'}":`,
      error,
      errorInfo
    );
  }

  public handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    });

    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public toggleDetails = (): void => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  public render(): ReactNode {
    const { hasError, error, errorInfo, showDetails } = this.state;
    const {
      children,
      fallback,
      fallbackTitle = 'Módulo Remoto Temporariamente Indisponível',
      fallbackMessage,
      moduleName = 'Micro Frontend',
      remoteUrl = 'http://localhost:3001/assets/remoteEntry.js',
    } = this.props;

    if (!hasError) {
      return children;
    }

    // Se o consumidor forneceu um fallback personalizado como função ou nó
    if (fallback) {
      if (typeof fallback === 'function') {
        return fallback({ error: error || new Error('Erro desconhecido'), reset: this.handleReset });
      }
      return fallback;
    }

    // Fallback padrão com design system premium do ArchLab
    return (
      <div className="eb-container" role="alert" aria-live="assertive">
        <div className="eb-glow-effect"></div>

        <div className="eb-header">
          <div className="eb-icon-wrapper">
            <span className="eb-icon">⚠️</span>
          </div>
          <div className="eb-title-block">
            <div className="eb-badge-row">
              <span className="eb-badge eb-badge-warning">Falha de Federação Capturada</span>
              <span className="eb-badge eb-badge-module">{moduleName}</span>
            </div>
            <h3 className="eb-title">{fallbackTitle}</h3>
            <p className="eb-message">
              {fallbackMessage ||
                `Não foi possível carregar o micro frontend remoto a partir de ${remoteUrl}. O servidor pode estar offline, inacessível ou o chunk remoto falhou. O container principal (Host) permanece ativo e protegido.`}
            </p>
          </div>
        </div>

        <div className="eb-diagnostic-box">
          <div className="eb-diag-row">
            <span className="eb-diag-label">Status do Host:</span>
            <span className="eb-diag-value eb-diag-success">● Operacional (Degradação Graciosa)</span>
          </div>
          <div className="eb-diag-row">
            <span className="eb-diag-label">Origem do Erro:</span>
            <span className="eb-diag-value eb-diag-code">{moduleName}</span>
          </div>
          <div className="eb-diag-row">
            <span className="eb-diag-label">Manifest Remoto:</span>
            <span className="eb-diag-value eb-diag-code">{remoteUrl}</span>
          </div>
          {error && (
            <div className="eb-diag-row">
              <span className="eb-diag-label">Mensagem:</span>
              <span className="eb-diag-value eb-diag-err-msg">{error.message || String(error)}</span>
            </div>
          )}
        </div>

        {/* Detalhes técnicos expansíveis */}
        <div className="eb-details-section">
          <button
            type="button"
            className="eb-toggle-btn"
            onClick={this.toggleDetails}
            aria-expanded={showDetails}
          >
            <span>{showDetails ? '▼ Ocultar Diagnóstico Técnico' : '▶ Ver Diagnóstico Técnico e Stack Trace'}</span>
          </button>

          {showDetails && (
            <div className="eb-tech-stack">
              <div className="eb-tech-title">Stack do Erro:</div>
              <pre className="eb-code-block">{error?.stack || 'Stack não disponível'}</pre>

              {errorInfo?.componentStack && (
                <>
                  <div className="eb-tech-title" style={{ marginTop: '10px' }}>
                    Component Stack:
                  </div>
                  <pre className="eb-code-block">{errorInfo.componentStack}</pre>
                </>
              )}
            </div>
          )}
        </div>

        {/* Ações de recuperação */}
        <div className="eb-actions">
          <button
            type="button"
            className="eb-btn eb-btn-retry"
            onClick={this.handleReset}
            id="btn-retry-module"
          >
            <span>🔄</span>
            <span>Tentar Novamente</span>
          </button>

          <a
            href={remoteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="eb-btn eb-btn-ping"
            title="Abre a URL do remoteEntry.js em nova aba para verificar disponibilidade"
          >
            <span>🌐</span>
            <span>Verificar Endpoint Remoto</span>
          </a>

          <a href="/" className="eb-btn eb-btn-back">
            <span>←</span>
            <span>Voltar para Visão Geral</span>
          </a>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
