import { useState, useEffect } from 'react';
import type { TerrenoRecalculadoDetail, TerrenoAlteradoDetail } from '../types/events';
import './GeoViewer.css';

export interface TerrainCoordinate {
  id: number;
  label: string;
  x: number;
  y: number;
  elevation: number; // metros
}

export interface TerrainMetadata {
  terrenoId: string;
  name: string;
  zoneamento: string;
  areaM2: number;
  averageSlope: string;
  maxElevation: number;
  minElevation: number;
  coordinates: TerrainCoordinate[];
}

const MOCK_TERRAINS: Record<string, TerrainMetadata> = {
  '101': {
    terrenoId: '101',
    name: 'Gleba Alpha — Vale Verde',
    zoneamento: 'ZEU (Zona de Estruturação Urbana)',
    areaM2: 14850,
    averageSlope: '12.4%',
    maxElevation: 842.5,
    minElevation: 815.0,
    coordinates: [
      { id: 1, label: 'V1', x: 60, y: 50, elevation: 818.2 },
      { id: 2, label: 'V2', x: 190, y: 40, elevation: 825.4 },
      { id: 3, label: 'V3', x: 340, y: 70, elevation: 839.1 },
      { id: 4, label: 'V4', x: 420, y: 160, elevation: 842.5 },
      { id: 5, label: 'V5', x: 310, y: 230, elevation: 831.0 },
      { id: 6, label: 'V6', x: 150, y: 220, elevation: 822.8 },
      { id: 7, label: 'V7', x: 70, y: 160, elevation: 815.0 },
    ],
  },
  '202': {
    terrenoId: '202',
    name: 'Lote Beta — Planalto Sul',
    zoneamento: 'ZPR (Zona Predominantemente Residencial)',
    areaM2: 28400,
    averageSlope: '6.8%',
    maxElevation: 795.0,
    minElevation: 780.2,
    coordinates: [
      { id: 1, label: 'P1', x: 80, y: 45, elevation: 782.0 },
      { id: 2, label: 'P2', x: 260, y: 35, elevation: 788.5 },
      { id: 3, label: 'P3', x: 430, y: 75, elevation: 795.0 },
      { id: 4, label: 'P4', x: 400, y: 215, elevation: 791.4 },
      { id: 5, label: 'P5', x: 210, y: 245, elevation: 785.1 },
      { id: 6, label: 'P6', x: 50, y: 185, elevation: 780.2 },
    ],
  },
  '303': {
    terrenoId: '303',
    name: 'Reserva Gamma — Encosta Leste',
    zoneamento: 'ZEP (Zona Especial de Proteção Ambiental)',
    areaM2: 42100,
    averageSlope: '24.1%',
    maxElevation: 915.8,
    minElevation: 840.0,
    coordinates: [
      { id: 1, label: 'G1', x: 90, y: 60, elevation: 845.0 },
      { id: 2, label: 'G2', x: 230, y: 35, elevation: 875.2 },
      { id: 3, label: 'G3', x: 440, y: 65, elevation: 915.8 },
      { id: 4, label: 'G4', x: 380, y: 195, elevation: 890.3 },
      { id: 5, label: 'G5', x: 290, y: 250, elevation: 865.0 },
      { id: 6, label: 'G6', x: 130, y: 215, elevation: 840.0 },
      { id: 7, label: 'G7', x: 50, y: 135, elevation: 852.1 },
    ],
  },
};

/**
 * Lê o ID do terreno diretamente da URL (window.location.search) usando URLSearchParams.
 * Demonstra o padrão de URL como fonte única da verdade (Single Source of Truth).
 */
function getTerrenoIdFromUrl(): string {
  if (typeof window === 'undefined') return '101';
  const params = new URLSearchParams(window.location.search);
  const id = params.get('terrenoId');
  if (id && MOCK_TERRAINS[id]) {
    return id;
  }
  return '101';
}

export default function GeoViewer() {
  // Estado local gerenciado com hooks conforme RF01
  const [activeTerrenoId, setActiveTerrenoId] = useState<string>(() => getTerrenoIdFromUrl());
  const [selectedPointId, setSelectedPointId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'contours' | 'mesh' | 'points'>('contours');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Terreno derivado diretamente da fonte da verdade (activeTerrenoId / URL)
  const terrain = MOCK_TERRAINS[activeTerrenoId] || MOCK_TERRAINS['101'];
  const selectedPoint =
    terrain.coordinates.find((c) => c.id === selectedPointId) || terrain.coordinates[0];

  // Estado para armazenar o último evento de recálculo recebido via CustomEvent
  const [recalcEvent, setRecalcEvent] = useState<TerrenoRecalculadoDetail | null>(null);
  const [showRecalcBanner, setShowRecalcBanner] = useState<boolean>(false);

  // Efeito 1: Sincronização da URL (Query Params) e evento nativo de alteração de terreno
  useEffect(() => {
    const syncFromUrl = () => {
      const id = getTerrenoIdFromUrl();
      setActiveTerrenoId(id);
    };

    const handleTerrenoAlterado = (e: Event) => {
      const customEvent = e as CustomEvent<TerrenoAlteradoDetail>;
      if (customEvent.detail?.terrenoId && MOCK_TERRAINS[customEvent.detail.terrenoId]) {
        setActiveTerrenoId(customEvent.detail.terrenoId);
      } else {
        syncFromUrl();
      }
    };

    window.addEventListener('terreno:alterado', handleTerrenoAlterado);
    window.addEventListener('popstate', syncFromUrl);

    return () => {
      window.removeEventListener('terreno:alterado', handleTerrenoAlterado);
      window.removeEventListener('popstate', syncFromUrl);
    };
  }, []);

  // Efeito 2: Escuta de CustomEvent 'terreno:recalculado' com limpeza obrigatória
  useEffect(() => {
    const handleRecalculado = (e: Event) => {
      const customEvent = e as CustomEvent<TerrenoRecalculadoDetail>;
      if (customEvent.detail) {
        setRecalcEvent(customEvent.detail);
        setShowRecalcBanner(true);
      }
    };

    window.addEventListener('terreno:recalculado', handleRecalculado);

    // Limpeza obrigatória para evitar vazamento de memória (memory leaks)
    return () => {
      window.removeEventListener('terreno:recalculado', handleRecalculado);
    };
  }, []);

  if (isRefreshing) {
    return (
      <div className="geo-viewer-root">
        <div className="geo-loading-state">
          <div className="geo-loader-ring"></div>
          <p style={{ fontFamily: 'var(--gv-mono)', fontSize: '13px' }}>
            🛰️ Sincronizando coordenadas topográficas via Remote...
          </p>
        </div>
      </div>
    );
  }

  // Gera o path SVG fechado do perímetro do terreno
  const polygonPoints = terrain.coordinates
    .map((coord) => `${coord.x},${coord.y}`)
    .join(' ');

  return (
    <div className="geo-viewer-root">
      {/* Banner de Notificação de CustomEvent: terreno:recalculado */}
      {showRecalcBanner && recalcEvent && (
        <div className="geo-recalc-banner" role="status" aria-live="polite">
          <div className="geo-recalc-icon">⚡</div>
          <div className="geo-recalc-info">
            <div className="geo-recalc-header-row">
              <span className="geo-recalc-badge">CustomEvent: terreno:recalculado</span>
              <span className="geo-recalc-version">Versão: {recalcEvent.versao}</span>
            </div>
            <div className="geo-recalc-time">
              Parâmetros recalculados às {new Date(recalcEvent.timestamp).toLocaleTimeString('pt-BR')} (Timestamp: {recalcEvent.timestamp})
            </div>
          </div>
          <button
            type="button"
            className="geo-recalc-close"
            onClick={() => setShowRecalcBanner(false)}
            title="Fechar notificação de recálculo"
          >
            ✕
          </button>
        </div>
      )}

      {/* Cabeçalho do Componente */}
      <div className="geo-viewer-header">
        <div className="geo-viewer-title-area">
          <div className="geo-viewer-icon-badge">🗺️</div>
          <div>
            <h2 className="geo-viewer-title">{terrain.name}</h2>
            <div className="geo-viewer-subtitle">
              ID na URL: <span className="geo-url-tag">?terrenoId={terrain.terrenoId}</span> • Micro Frontend Remote
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="geo-badge-live">
            <span className="geo-badge-pulse-dot"></span>
            GeoViewer Ativo (Remote)
          </div>
          <button
            type="button"
            className="geo-ctrl-btn"
            onClick={() => {
              setIsRefreshing(true);
              setTimeout(() => setIsRefreshing(false), 400);
            }}
            title="Recarregar dados com hooks"
          >
            🔄 Atualizar
          </button>
        </div>
      </div>

      {/* Grid de Métricas do Terreno com Zoneamento */}
      <div className="geo-stats-grid">
        <div className="geo-stat-chip">
          <div className="geo-stat-label">Terreno Ativo (URL)</div>
          <div className="geo-stat-value" style={{ color: '#38bdf8' }}>ID: {terrain.terrenoId}</div>
        </div>
        <div className="geo-stat-chip">
          <div className="geo-stat-label">Área Projetada</div>
          <div className="geo-stat-value">{terrain.areaM2.toLocaleString('pt-BR')} m²</div>
        </div>
        <div className="geo-stat-chip" style={{ gridColumn: 'span 2' }}>
          <div className="geo-stat-label">Zoneamento Municipal</div>
          <div className="geo-stat-value" style={{ color: '#f59e0b', fontSize: '13px' }}>{terrain.zoneamento}</div>
        </div>
        <div className="geo-stat-chip">
          <div className="geo-stat-label">Declividade Média</div>
          <div className="geo-stat-value" style={{ color: '#38bdf8' }}>{terrain.averageSlope}</div>
        </div>
        <div className="geo-stat-chip">
          <div className="geo-stat-label">Cota Máxima</div>
          <div className="geo-stat-value" style={{ color: '#10b981' }}>{terrain.maxElevation} m</div>
        </div>
        <div className="geo-stat-chip">
          <div className="geo-stat-label">Cota Mínima</div>
          <div className="geo-stat-value" style={{ color: '#f59e0b' }}>{terrain.minElevation} m</div>
        </div>
        <div className="geo-stat-chip">
          <div className="geo-stat-label">Vértices Mapeados</div>
          <div className="geo-stat-value">{terrain.coordinates.length} pts</div>
        </div>
      </div>

      {/* Área Gráfica Topográfica (SVG Interativo) */}
      <div className="geo-canvas-card">
        <div className="geo-canvas-overlay-controls">
          <button
            type="button"
            className={`geo-ctrl-btn ${viewMode === 'contours' ? 'active' : ''}`}
            onClick={() => setViewMode('contours')}
          >
            Curvas de Nível
          </button>
          <button
            type="button"
            className={`geo-ctrl-btn ${viewMode === 'mesh' ? 'active' : ''}`}
            onClick={() => setViewMode('mesh')}
          >
            Malha TIN
          </button>
          <button
            type="button"
            className={`geo-ctrl-btn ${viewMode === 'points' ? 'active' : ''}`}
            onClick={() => setViewMode('points')}
          >
            Vértices
          </button>
        </div>

        <svg className="geo-svg-container" viewBox="0 0 500 280">
          <defs>
            <linearGradient id="terrainGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0369a1" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.25" />
            </linearGradient>
            <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="1" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
            </radialGradient>
            <pattern id="gridPattern" width="25" height="25" patternUnits="userSpaceOnUse">
              <path d="M 25 0 L 0 0 0 25" fill="none" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" />
            </pattern>
          </defs>

          {/* Grade de fundo */}
          <rect width="100%" height="100%" fill="url(#gridPattern)" />

          {/* Curvas de nível internas simuladas */}
          {viewMode === 'contours' && (
            <g stroke="rgba(56, 189, 248, 0.25)" strokeWidth="1" fill="none" strokeDasharray="3 3">
              <ellipse cx="230" cy="135" rx="140" ry="70" />
              <ellipse cx="235" cy="130" rx="95" ry="48" stroke="rgba(56, 189, 248, 0.4)" />
              <ellipse cx="240" cy="125" rx="55" ry="28" stroke="rgba(16, 185, 129, 0.5)" />
            </g>
          )}

          {/* Linhas da malha triangular (TIN) */}
          {viewMode === 'mesh' && (
            <g stroke="rgba(129, 140, 248, 0.3)" strokeWidth="1" fill="none">
              {terrain.coordinates.map((coord, idx) => {
                const next = terrain.coordinates[(idx + 2) % terrain.coordinates.length];
                return (
                  <line
                    key={`mesh-${coord.id}`}
                    x1={coord.x}
                    y1={coord.y}
                    x2={next.x}
                    y2={next.y}
                  />
                );
              })}
            </g>
          )}

          {/* Polígono do perímetro do terreno */}
          <polygon
            points={polygonPoints}
            fill="url(#terrainGrad)"
            stroke="#38bdf8"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Vértices clicáveis */}
          {terrain.coordinates.map((coord) => {
            const isSelected = selectedPoint?.id === coord.id;
            return (
              <g
                key={coord.id}
                onClick={() => setSelectedPointId(coord.id)}
                style={{ cursor: 'pointer' }}
              >
                {isSelected && (
                  <circle
                    cx={coord.x}
                    cy={coord.y}
                    r="14"
                    fill="url(#nodeGlow)"
                    opacity="0.6"
                  />
                )}
                <circle
                  cx={coord.x}
                  cy={coord.y}
                  r={isSelected ? '6' : '4.5'}
                  fill={isSelected ? '#38bdf8' : '#10b981'}
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
                <text
                  x={coord.x + 8}
                  y={coord.y - 8}
                  fill="#cbd5e1"
                  fontSize="10"
                  fontFamily="var(--gv-mono)"
                  fontWeight="600"
                >
                  {coord.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Painel de Leitura e Inspeção de Vértices */}
      <div className="geo-inspect-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>
            Vértice Selecionado: {selectedPoint ? selectedPoint.label : 'Nenhum'}
          </span>
          <span style={{ fontSize: '11px', color: '#64748b' }}>
            (Clique nos vértices para inspecionar cotas)
          </span>
        </div>

        {selectedPoint && (
          <div className="geo-inspect-coords">
            <div className="geo-coord-item">
              <span className="geo-coord-key">X:</span>
              <span className="geo-coord-val">{selectedPoint.x} m</span>
            </div>
            <div className="geo-coord-item">
              <span className="geo-coord-key">Y:</span>
              <span className="geo-coord-val">{selectedPoint.y} m</span>
            </div>
            <div className="geo-coord-item">
              <span className="geo-coord-key">Cota (Z):</span>
              <span className="geo-coord-val" style={{ color: '#10b981' }}>
                {selectedPoint.elevation} m
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
