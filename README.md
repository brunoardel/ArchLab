# 🏛️ ArchLab — Micro Frontends com Module Federation

Arquitetura de Micro Frontends construída com **React 18**, **TypeScript**, **Vite** e **Module Federation** (`@originjs/vite-plugin-federation`), simulando um ecossistema escalável de engenharia e modelagem espacial.

---

## 📐 Visão Geral da Arquitetura

O projeto é composto por duas aplicações autônomas e desacopladas:

```
┌──────────────────────────────────────────────┐
│            ArchLab Shell (Host)              │
│            http://localhost:3000             │
│   - Roteamento SPA (/ e /terreno)            │
│   - Layout e Container Principal             │
│   - Injeção Lazy & Orquestração              │
└──────────────────────┬───────────────────────┘
                       │
             Module Federation (HTTP)
        http://localhost:3001/assets/remoteEntry.js
                       │
┌──────────────────────▼───────────────────────┐
│        Remote Service (GeoViewer)            │
│            http://localhost:3001             │
│   - Módulo autônomo de telemetria topográfica│
│   - Hooks de estado (useState, useEffect)    │
│   - Visualizador de malha TIN e contornos    │
└──────────────────────────────────────────────┘
```

---

## 🚀 Como Executar

### 1. Instalação das dependências
Na raiz do repositório:
```bash
npm run install:all
```

### 2. Iniciar os Serviços

Abra dois terminais na raiz:

**Terminal 1 — Remote Service (Porta 3001):**
```bash
npm run build:remote
npm run preview:remote
```

**Terminal 2 — Host Shell (Porta 3000):**
```bash
npm run dev:host
```

Acesse no navegador:
* **Host Shell:** [http://localhost:3000/](http://localhost:3000/)
* **Visualizador de Terreno Integrado:** [http://localhost:3000/terreno](http://localhost:3000/terreno)
* **Remote Standalone:** [http://localhost:3001/](http://localhost:3001/)

---

## 🔬 Laboratórios e Cenários Arquiteturais

1. **Setup de Federação:** Configuração de contêineres Host (`localhost:3000`) e Remote (`localhost:3001`) com suporte a CORS e ESM.
2. **Exposição de Módulos:** Criação e exposição do componente interativo `GeoViewer` com hooks internos de estado e cálculo topográfico.
3. **O Experimento do Singleton:** Análise e resolução do erro clássico `Invalid Hook Call` / `TypeError: Cannot read properties of null (reading 'useState')` ao sincronizar `singleton: true` e `requiredVersion: '^18.3.1'`.
   - Consulte o relatório técnico completo em [docs/EXPERIMENTO_SINGLETON.md](docs/EXPERIMENTO_SINGLETON.md).
4. **Resiliência com ErrorBoundary, Suspense e o Desafio do Module Map:**
   - Tratamento de quedas de rede e fallbacks elegantes quando o Remote fica offline.
   - Diagnóstico do bloqueio do **Module Map nativo do navegador** (especificação ECMAScript / HTML5) ao tentar reconectar URLs com falha e padrões de recuperação com Dynamic Remotes (`externalType: 'promise'`).
   - Consulte o relatório técnico completo em [docs/RESILIENCIA_ERROR_BOUNDARY.md](docs/RESILIENCIA_ERROR_BOUNDARY.md).
5. **Comunicação Desacoplada entre Micro Frontends:**
   - Sincronização de estado via `URLSearchParams` (estado na URL como fonte da verdade) e disparo de eventos pontuais via `CustomEvent` nativo do DOM, sem compartilhar Context API ou stores globais acopladas.
   - Consulte o relatório técnico completo em [docs/EXPERIMENTO_COMUNICACAO.md](docs/EXPERIMENTO_COMUNICACAO.md).

---

## 🛠️ Tecnologias Utilizadas

* **React 18.3.1**
* **TypeScript**
* **Vite 5.4**
* **@originjs/vite-plugin-federation**
* **React Router Dom 7**
