import { lazy, Suspense, useState, useMemo } from 'react';
import { Routes, Route, NavLink, Link, useSearchParams } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import type { TerrenoRecalculadoDetail, TerrenoAlteradoDetail } from './types/events';
import './App.css';

function OverviewPage() {
  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Container Principal (Host Shell)</h1>
        <p className="page-desc">
          Plataforma de Micro Frontends com Module Federation orquestrando módulos autônomos, resilientes e desacoplados.
        </p>
      </div>

      <div className="card-grid">
        <div className="card">
          <div className="card-title">
            <span>Container Host</span>
            <span className="badge badge-host">Porta 3000</span>
          </div>
          <div className="card-body">
            Gerencia a aplicação principal, layout base, roteamento com <span className="tag-code">react-router-dom</span> e orquestra a injeção sob demanda dos micro frontends remotos.
          </div>
        </div>

        <div className="card">
          <div className="card-title">
            <span>Micro Frontend Remoto</span>
            <span className="badge badge-remote">Porta 3001</span>
          </div>
          <div className="card-body">
            Serviço autônomo <span className="tag-code">remoteApp</span> responsável pelo componente de topografia e coordenadas <span className="tag-code">GeoViewer</span>.
          </div>
        </div>

        <div className="card">
          <div className="card-title">
            <span>Compartilhamento Singleton</span>
            <span className="tag-code">React 18.3.1</span>
          </div>
          <div className="card-body">
            Instância única de <span className="tag-code">react</span> e <span className="tag-code">react-dom</span> compartilhada via Module Federation, garantindo integridade dos hooks.
          </div>
        </div>

        <div className="card">
          <div className="card-title">
            <span>Resiliência & Tolerância a Falhas</span>
            <span className="badge badge-warning badge-status-rose">
              ErrorBoundary + Suspense
            </span>
          </div>
          <div className="card-body">
            Isolamento de falhas: se o Remote em <span className="tag-code">localhost:3001</span> for desligado ou falhar na rede, o Host Shell não sofre crash (White Screen of Death), exibindo um fallback elegante com recuperação.
          </div>
        </div>

        <div className="card">
          <div className="card-title">
            <span>Comunicação Desacoplada</span>
            <span className="badge badge-warning badge-status-amber">
              URL State + CustomEvent
            </span>
          </div>
          <div className="card-body">
            Comunicação sem acoplamento de estados globais: estado na URL (<span className="tag-code">?terrenoId=ID</span>) como fonte da verdade e eventos nativos do navegador (<span className="tag-code">CustomEvent</span>) para disparos laterais.
          </div>
        </div>
      </div>

      <div className="card overview-banner-card">
        <div className="banner-card-content">
          <div>
            <h3 className="banner-card-title">
              🗺️ Módulo de Visualização de Terreno (GeoViewer)
            </h3>
            <p className="banner-card-desc">
              O micro frontend de topografia reside na rota dedicada <span className="tag-code">/terreno</span>, protegido por <span className="tag-code">ErrorBoundary</span> e <span className="tag-code">Suspense</span>, com sincronização por URL e CustomEvent nativos.
            </p>
          </div>
          <div className="banner-card-actions">
            <Link to="/terreno?terrenoId=101" className="btn btn-primary">
              <span>Terreno Alpha (101)</span>
              <span>→</span>
            </Link>
            <Link to="/terreno?terrenoId=202" className="btn btn-secondary">
              <span>Terreno Beta (202)</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

function TerrainLoadingFallback() {
  return (
    <div className="mfe-container">
      <div className="geo-loader-ring loading-ring-sm"></div>
      <p className="loading-text">
        🛰️ Carregando módulo remoto GeoViewer via Module Federation (localhost:3001)...
      </p>
      <span className="loading-subtext">
        Suspense: aguardando resolução do chunk remoto
      </span>
    </div>
  );
}

function TerrainPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTerrenoId = searchParams.get('terrenoId') || '101';
  const [lastRecalcVersion, setLastRecalcVersion] = useState<string | null>(null);
  const [lastRecalcTimestamp, setLastRecalcTimestamp] = useState<number | null>(null);

  const [retryKey, setRetryKey] = useState<number>(0);
  const [simulateFailure, setSimulateFailure] = useState<boolean>(false);

  // Recria a fábrica do React.lazy a cada retryKey ou alteração de simulação,
  // contornando o cache de promessas rejeitadas do React após falhas de rede.
  const LazyGeoViewer = useMemo(() => {
    return lazy(() => {
      if (simulateFailure) {
        return new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(
              new Error(
                'Failed to fetch dynamically imported module: http://localhost:3001/assets/remoteEntry.js (Simulação de indisponibilidade de rede do micro frontend)'
              )
            );
          }, 350);
        });
      }
      return import('remoteApp/GeoViewer');
    });
  }, [retryKey, simulateFailure]);

  const handleReset = () => {
    if (simulateFailure) {
      setSimulateFailure(false);
    }
    setRetryKey((prev) => prev + 1);
  };

  /**
   * Padrão 1: Estado na URL (Query Params).
   * Altera ?terrenoId=ID na barra de endereços sem recarregar a página e emite evento desacoplado.
   */
  const handleSelectTerreno = (terrenoId: string) => {
    setSearchParams({ terrenoId });

    // Emite CustomEvent nativo para notificar o micro frontend remoto em tempo real
    const detail: TerrenoAlteradoDetail = { terrenoId };
    window.dispatchEvent(
      new CustomEvent<TerrenoAlteradoDetail>('terreno:alterado', { detail })
    );
  };

  /**
   * Padrão 2: Eventos Nativos do Navegador (CustomEvent).
   * Dispara o evento 'terreno:recalculado' com timestamp e versão gerada dinamicamente.
   */
  const handleDispararRecalculo = () => {
    const timestamp = Date.now();
    const versao = Math.random().toFixed(2);
    const detail: TerrenoRecalculadoDetail = {
      timestamp,
      versao,
    };
    setLastRecalcVersion(versao);
    setLastRecalcTimestamp(timestamp);

    window.dispatchEvent(
      new CustomEvent<TerrenoRecalculadoDetail>('terreno:recalculado', { detail })
    );
  };

  return (
    <div>
      <div className="page-header page-header-flex">
        <div>
          <h1 className="page-title">Visualizador de Terreno</h1>
          <p className="page-desc">
            Micro frontend remoto consumido dinamicamente via{' '}
            <span className="tag-code">http://localhost:3001/assets/remoteEntry.js</span>
          </p>
        </div>
        <div className="badge-group">
          <span className="badge badge-remote">Rota: /terreno</span>
          <span className="badge badge-host">Lazy Loaded</span>
          <span className="badge badge-status-amber">
            📡 Comunicação Desacoplada
          </span>
          <span className="badge badge-status-rose">
            🛡️ ErrorBoundary Protegido
          </span>
        </div>
      </div>

      {/* Barra Superior de Controle: Comunicação Desacoplada (Tarefa 5 — PRD) */}
      <div className="control-panel">
        <div className="control-panel-header">
          <div className="control-panel-title-area">
            <span className="control-panel-icon">📡</span>
            <div>
              <div className="control-panel-title">
                Painel de Comunicação Desacoplada (Cenário C — PRD)
              </div>
              <div className="control-panel-desc">
                Sincronização via Estado na URL (<span className="tag-code">?terrenoId=ID</span>) e Eventos Nativos (<span className="tag-code">CustomEvent</span>)
              </div>
            </div>
          </div>

          <div className="control-panel-url-info">
            <span className="control-panel-url-label">URL Query Param:</span>
            <span className="url-query-tag">
              ?terrenoId={activeTerrenoId}
            </span>
          </div>
        </div>

        <div className="control-panel-body">
          {/* 1. Seletor de Terreno (URL State) */}
          <div>
            <div className="control-section-label">
              1. Seletor de Terreno (Estado na URL):
            </div>
            <div className="terrain-btn-group">
              <button
                type="button"
                className={`btn terrain-btn ${activeTerrenoId === '101' ? 'terrain-btn-active' : ''}`}
                onClick={() => handleSelectTerreno('101')}
                id="btn-terreno-101"
              >
                <span>⛰️</span>
                <span>Terreno Alpha (ID: 101)</span>
              </button>

              <button
                type="button"
                className={`btn terrain-btn ${activeTerrenoId === '202' ? 'terrain-btn-active' : ''}`}
                onClick={() => handleSelectTerreno('202')}
                id="btn-terreno-202"
              >
                <span>🏞️</span>
                <span>Terreno Beta (ID: 202)</span>
              </button>

              <button
                type="button"
                className={`btn terrain-btn ${activeTerrenoId === '303' ? 'terrain-btn-active' : ''}`}
                onClick={() => handleSelectTerreno('303')}
                id="btn-terreno-303"
              >
                <span>🌲</span>
                <span>Terreno Gamma (ID: 303)</span>
              </button>
            </div>
          </div>

          {/* 2. Botão de Disparo de Ação (CustomEvent) */}
          <div>
            <div className="control-section-label">
              2. Disparo de Ação (CustomEvent):
            </div>
            <div className="recalc-action-group">
              <button
                type="button"
                className="btn btn-recalc"
                onClick={handleDispararRecalculo}
                id="btn-disparar-recalculo"
              >
                <span>⚡</span>
                <span>Disparar Recálculo de Parâmetros</span>
              </button>

              {lastRecalcVersion && (
                <span className="recalc-status-badge">
                  Emitido: v{lastRecalcVersion} às {new Date(lastRecalcTimestamp || 0).toLocaleTimeString('pt-BR')}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Barra Didática de Demonstração de Resiliência */}
      <div className="resilience-panel">
        <div className="resilience-panel-info">
          <span className="resilience-panel-icon">🧪</span>
          <div>
            <div className="resilience-panel-title">
              Painel Didático de Resiliência (Cenário B — PRD)
            </div>
            <div className="resilience-panel-desc">
              Teste como o Host reage quando o Remote está desligado ou inacessível.
            </div>
          </div>
        </div>

        <div className="resilience-panel-actions">
          <button
            type="button"
            className={`btn ${simulateFailure ? 'btn-simulate-active' : 'btn-simulate-idle'}`}
            onClick={() => {
              setSimulateFailure((prev) => !prev);
              setRetryKey((k) => k + 1);
            }}
            id="toggle-simulate-failure"
          >
            {simulateFailure ? '✅ Restaurar Remote Normal' : '⚡ Simular Falha no Remote'}
          </button>

          <button
            type="button"
            className="btn btn-reload-module"
            onClick={() => setRetryKey((k) => k + 1)}
            title="Força uma nova tentativa de importação do componente"
          >
            🔄 Recarregar Módulo
          </button>
        </div>
      </div>

      {/* Camada de Resiliência: ErrorBoundary envolvendo React.Suspense e o Lazy Component */}
      <ErrorBoundary
        key={retryKey}
        moduleName="remoteApp/GeoViewer"
        remoteUrl="http://localhost:3001/assets/remoteEntry.js"
        fallbackTitle="Visualizador de Terreno Indisponível"
        fallbackMessage="O micro frontend remoto de topografia não pôde ser carregado. O servidor em http://localhost:3001 pode estar desligado ou inacessível. O container principal (Host) permanece ativo e navegável graças à proteção do ErrorBoundary."
        onReset={handleReset}
      >
        <Suspense fallback={<TerrainLoadingFallback />}>
          <LazyGeoViewer />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}

export default function App() {
  return (
    <div className="app-container">
      {/* Cabeçalho */}
      <header className="app-header">
        <div className="header-brand">
          <div className="brand-icon">A</div>
          <div>
            <div className="brand-title">ArchLab Studio</div>
            <div className="brand-subtitle">Plataforma de Terrenos & Arquitetura Generativa</div>
          </div>
        </div>

        <div className="header-badges">
          <div className="badge badge-host">
            <span className="badge-dot"></span>
            Host: localhost:3000
          </div>
          <div className="badge badge-remote">
            <span className="badge-dot"></span>
            Remote: localhost:3001
          </div>
          <div className="badge badge-status-emerald">
            <span className="badge-dot badge-dot-emerald"></span>
            Singleton: Ativo
          </div>
          <div className="badge badge-status-amber">
            <span className="badge-dot badge-dot-amber"></span>
            Comunicação: Desacoplada
          </div>
          <div className="badge badge-status-rose">
            <span className="badge-dot badge-dot-rose"></span>
            Resiliência: Ativa
          </div>
        </div>
      </header>

      {/* Corpo: Barra Lateral + Área Principal */}
      <div className="app-body">
        <aside className="app-sidebar">
          <div>
            <div className="nav-section-title">Navegação</div>
            <nav className="sidebar-nav-list">
              <NavLink
                to="/"
                end
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                <span>📊</span>
                <span>Visão Geral</span>
              </NavLink>

              <NavLink
                to="/terreno"
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                <span>🗺️</span>
                <span>Visualizador de Terreno</span>
              </NavLink>
            </nav>
          </div>

          <div className="sidebar-status-box">
            <div className="status-label">STATUS DA FEDERAÇÃO</div>
            <div className="status-value status-value-success">
              ● Módulos Conectados
            </div>
            <div className="status-label">CONFIGURAÇÃO SHARED</div>
            <div className="status-value status-value-cyan">
              React 18.3.1 (singleton: true)
            </div>
            <div className="status-label">COMUNICAÇÃO ENTRE MFEs</div>
            <div className="status-value status-value-amber">
              📡 URL State + CustomEvent
            </div>
            <div className="status-label">PROTEÇÃO DE RUNTIME</div>
            <div className="status-value status-value-rose">
              🛡️ ErrorBoundary + Suspense
            </div>
            <div className="status-label status-label-spaced">REMOTE MANIFEST</div>
            <div className="status-value status-value-mono">
              http://localhost:3001/assets/remoteEntry.js
            </div>
          </div>
        </aside>

        {/* Área Principal com Roteamento */}
        <main className="app-main">
          <Routes>
            <Route path="/" element={<OverviewPage />} />
            <Route path="/terreno" element={<TerrainPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
