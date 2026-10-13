import { lazy, Suspense } from 'react';
import { Routes, Route, NavLink, Link } from 'react-router-dom';

// Importação dinâmica (lazy loading) do micro frontend remoto GeoViewer
const RemoteGeoViewer = lazy(() => import('remoteApp/GeoViewer'));

function OverviewPage() {
  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Container Principal (Host Shell)</h1>
        <p className="page-desc">
          Plataforma de Micro Frontends com Module Federation orquestrando módulos autônomos.
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
      </div>

      <div className="card" style={{ marginTop: '24px', background: 'rgba(15, 23, 42, 0.7)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#f8fafc', marginBottom: '6px' }}>
              🗺️ Módulo de Visualização de Terreno (GeoViewer)
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '14px', maxWidth: '650px' }}>
              O micro frontend de topografia agora reside em uma rota dedicada <span className="tag-code">/terreno</span>. O componente é baixado e executado sob demanda apenas quando essa rota é acessada.
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

function TerrainPage() {
  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="page-title">Visualizador de Terreno</h1>
          <p className="page-desc">
            Micro frontend remoto consumido dinamicamente via <span className="tag-code">http://localhost:3001/assets/remoteEntry.js</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <span className="badge badge-remote">Rota: /terreno</span>
          <span className="badge badge-host">Lazy Loaded</span>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="mfe-container">
            <div className="geo-loader-ring" style={{ width: '40px', height: '40px' }}></div>
            <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '12px' }}>
              Carregando módulo remoto GeoViewer (localhost:3001)...
            </p>
          </div>
        }
      >
        <RemoteGeoViewer />
      </Suspense>
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
            <div className="status-label">REMOTE MANIFEST</div>
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
