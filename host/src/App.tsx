import { lazy, Suspense, useState, useMemo } from 'react';
import { Routes, Route, NavLink, Link } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';

function OverviewPage() {
  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Container Principal (Host Shell)</h1>
        <p className="page-desc">
          Plataforma de Micro Frontends com Module Federation orquestrando módulos autônomos e resilientes.
        </p>
      </div>

      <div className="card-grid">
        <div className="card">
          <div className="card-title">
            <span>Container Host</span>
            <span className="badge badge-host">Porta 3000</span>
          </div>
          <div className="card-body">
            Gerencia a aplicação principal, o layout base, o roteamento da aplicação e orquestra a injeção sob demanda dos micro frontends remotos.
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
            <span className="badge badge-warning" style={{ background: 'rgba(244, 63, 94, 0.15)', color: '#fb7185', border: '1px solid rgba(244, 63, 94, 0.35)' }}>
              ErrorBoundary + Suspense
            </span>
          </div>
          <div className="card-body">
            Isolamento de falhas: se o Remote em <span className="tag-code">localhost:3001</span> for desligado ou falhar na rede, o Host Shell não sofre crash (White Screen of Death), exibindo um fallback elegante com recuperação.
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '24px', background: 'rgba(15, 23, 42, 0.7)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#f8fafc', marginBottom: '6px' }}>
              🗺️ Módulo de Visualização de Terreno (GeoViewer)
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '14px', maxWidth: '650px' }}>
              O micro frontend de topografia reside na rota dedicada <span className="tag-code">/terreno</span>, protegido por <span className="tag-code">ErrorBoundary</span> e <span className="tag-code">Suspense</span>. Experimente desligar o Remote ou simular erros para verificar a resiliência em tempo real.
            </p>
          </div>
          <Link to="/terreno" className="btn btn-primary" style={{ textDecoration: 'none' }}>
            <span>Acessar Visualizador de Terreno</span>
            <span>→</span>
          </Link>
        </div>
      </div>
    </>
  );
}

function TerrainLoadingFallback() {
  return (
    <div className="mfe-container">
      <div className="geo-loader-ring" style={{ width: '40px', height: '40px' }}></div>
      <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '12px' }}>
        🛰️ Carregando módulo remoto GeoViewer via Module Federation (localhost:3001)...
      </p>
      <span style={{ color: '#64748b', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
        Suspense: aguardando resolução do chunk remoto
      </span>
    </div>
  );
}

function TerrainPage() {
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

  return (
    <div>
      <div
        className="page-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h1 className="page-title">Visualizador de Terreno</h1>
          <p className="page-desc">
            Micro frontend remoto consumido dinamicamente via{' '}
            <span className="tag-code">http://localhost:3001/assets/remoteEntry.js</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <span className="badge badge-remote">Rota: /terreno</span>
          <span className="badge badge-host">Lazy Loaded</span>
          <span
            className="badge"
            style={{
              background: 'rgba(244, 63, 94, 0.15)',
              color: '#fb7185',
              border: '1px solid rgba(244, 63, 94, 0.35)',
            }}
          >
            🛡️ ErrorBoundary Protegido
          </span>
        </div>
      </div>

      {/* Barra Didática de Demonstração de Resiliência */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.7)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '10px',
          padding: '12px 18px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '16px' }}>🧪</span>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#f1f5f9' }}>
              Painel Didático de Resiliência (Cenário B — PRD)
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>
              Teste como o Host reage quando o Remote está desligado ou inacessível.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            type="button"
            className="btn"
            style={{
              background: simulateFailure ? '#10b981' : 'rgba(244, 63, 94, 0.2)',
              color: simulateFailure ? '#ffffff' : '#fb7185',
              border: `1px solid ${simulateFailure ? '#10b981' : 'rgba(244, 63, 94, 0.4)'}`,
              padding: '6px 14px',
              fontSize: '12px',
            }}
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
            className="btn"
            style={{
              background: 'rgba(30, 41, 59, 0.8)',
              color: '#38bdf8',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              padding: '6px 14px',
              fontSize: '12px',
            }}
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
          <div
            className="badge"
            style={{
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#10b981',
              border: '1px solid rgba(16, 185, 129, 0.4)',
            }}
          >
            <span className="badge-dot" style={{ background: '#10b981' }}></span>
            Singleton: Ativo
          </div>
          <div
            className="badge"
            style={{
              background: 'rgba(244, 63, 94, 0.15)',
              color: '#fb7185',
              border: '1px solid rgba(244, 63, 94, 0.4)',
            }}
          >
            <span className="badge-dot" style={{ background: '#fb7185' }}></span>
            Resiliência: Ativa
          </div>
        </div>
      </header>

      {/* Corpo: Barra Lateral + Área Principal */}
      <div className="app-body">
        <aside className="app-sidebar">
          <div>
            <div className="nav-section-title">Navegação</div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <NavLink
                to="/"
                end
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                style={{ textDecoration: 'none' }}
              >
                <span>📊</span>
                <span>Visão Geral</span>
              </NavLink>

              <NavLink
                to="/terreno"
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                style={{ textDecoration: 'none' }}
              >
                <span>🗺️</span>
                <span>Visualizador de Terreno</span>
              </NavLink>
            </nav>
          </div>

          <div className="sidebar-status-box">
            <div className="status-label">STATUS DA FEDERAÇÃO</div>
            <div className="status-value" style={{ color: '#10b981', marginBottom: '8px' }}>
              ● Módulos Conectados
            </div>
            <div className="status-label">CONFIGURAÇÃO SHARED</div>
            <div className="status-value" style={{ fontSize: '11px', color: '#38bdf8', marginBottom: '8px' }}>
              React 18.3.1 (singleton: true)
            </div>
            <div className="status-label">PROTEÇÃO DE RUNTIME</div>
            <div className="status-value" style={{ fontSize: '11px', color: '#fb7185', marginBottom: '8px' }}>
              🛡️ ErrorBoundary + Suspense
            </div>
            <div className="status-label" style={{ marginTop: '8px' }}>REMOTE MANIFEST</div>
            <div className="status-value" style={{ fontSize: '11px', wordBreak: 'break-all' }}>
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
