import GeoViewer from './components/GeoViewer';

export default function App() {
  return (
    <div className="remote-app">
      <header className="remote-header">
        <div className="brand-wrapper">
          <div className="brand-badge-icon">G</div>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 700 }}>GeoViewer Remote Service</h1>
            <p style={{ fontSize: '13px', color: '#94a3b8' }}>Módulo Remoto de Terrenos (Standalone & Federated)</p>
          </div>
        </div>

        <div className="badge">
          <span className="badge-dot"></span>
          Porta 3001
        </div>
      </header>

      {/* Renderização do componente exposto */}
      <div style={{ marginBottom: '28px' }}>
        <GeoViewer />
      </div>

      <div className="card">
        <div className="card-title">
          <span>📡 Endpoint do Manifesto Module Federation</span>
        </div>
        <div className="card-body">
          Esta aplicação expõe o componente funcional <code style={{ color: '#38bdf8' }}>GeoViewer</code> para consumo remoto pelo Host ArchLab:
          <div className="code-box">
            GET http://localhost:3001/assets/remoteEntry.js (expondo: ./GeoViewer)
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">
          <span>⚙️ Especificações do Módulo</span>
        </div>
        <div className="card-body">
          <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li><strong>Federation Name:</strong> <code>remoteApp</code></li>
            <li><strong>Exposed Module:</strong> <code>'./GeoViewer': './src/components/GeoViewer.tsx'</code></li>
            <li><strong>Framework:</strong> React 18.3.1 + TypeScript</li>
            <li><strong>Hooks Utilizados:</strong> <code>useState</code> e <code>useEffect</code> (simulação LiDAR topográfica)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
