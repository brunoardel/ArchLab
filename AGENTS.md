# 🤖 Diretrizes para Agentes de IA (`AGENTS.md`)

Este repositório é um laboratório de **Micro Frontends** arquitetado com **React 18**, **TypeScript**, **Vite** e **Module Federation** (`@originjs/vite-plugin-federation`).

Ao propor alterações, executar comandos ou refatorar o código, **siga estritamente as diretrizes abaixo**.

---

## 🏛️ 1. Visão Geral da Arquitetura

O ecossistema é dividido em duas aplicações desacopladas:

* **Host Shell (`/host`):** Roda na porta `3000`. Responsável pelo layout, rotas (`/` e `/terreno`) e orquestração do carregamento dinâmico.
* **Remote Service (`/remote`):** Roda na porta `3001`. Provê o micro frontend isolado (`GeoViewer`) e expõe o manifesto `remoteEntry.js`.

---

## 🚀 2. Comandos e Fluxo de Execução

A raiz do projeto gerencia os subprojetos via flags `--prefix`. **Nunca execute scripts sem especificar o pacote.**

### Instalação
```bash
npm run install:all
```

### Inicialização e Desenvolvimento
> ⚠️ **Atenção (Module Federation com Vite):**  
> Para que o `host` consiga consumir o `remote`, o `remote` **deve ser compilado e servido via preview**, pois o modo de desenvolvimento puro (`dev`) do Vite muitas vezes não gera o `remoteEntry.js` em disco/memória no formato esperado pela federação.

* **Remote (Porta 3001):**
  ```bash
  npm run build:remote
  npm run preview:remote
  ```
* **Host (Porta 3000):**
  ```bash
  npm run dev:host
  ```

---

## 🔒 3. Regras de Ouro e Restrições Arquiteturais

### A. Singleton Obrigatório para React (Evitar `Invalid Hook Call`)
* As dependências `react` e `react-dom` **devem permanecer com as versões rigorosamente sincronizadas** (`^18.3.1`) em ambos os arquivos `package.json`.
* Em ambos os `vite.config.ts` (`host` e `remote`), o bloco `federation.shared` **deve manter** `singleton: true`:
  ```typescript
  shared: {
    react: { singleton: true, requiredVersion: '^18.3.1' },
    'react-dom': { singleton: true, requiredVersion: '^18.3.1' },
  }
  ```
* *Consulte [docs/EXPERIMENTO_SINGLETON.md](docs/EXPERIMENTO_SINGLETON.md) antes de alterar qualquer configuração de bundling ou dependências.*

### B. Resiliência no Host (Suspense, Error Boundary & Module Map Cache)
* Qualquer componente importado do `remote` no `host` via dynamic import (`import('remoteApp/...')`) **deve ser obrigatoriamente encapsulado** por um `Suspense` com fallback e um `ErrorBoundary`.
* A indisponibilidade do serviço remoto (ex.: porta 3001 offline ou erro de rede) **não pode derrubar o Host Shell**.
* ⚠️ **Atenção ao Cache de Módulos ES do Navegador (Module Map):**
  - Conforme a especificação ECMAScript / HTML5, quando um `import()` dinâmico falha na rede (ex.: remote offline), a engine JS do navegador (V8, WebKit, SpiderMonkey) salva a URL no seu **`Module Map`** interno com status `Errored`.
  - Novas tentativas de `import()` com a **mesma URL exata** são rejeitadas imediatamente pela engine sem realizar nenhuma nova requisição de rede, tornando inócuo um simples reset de estado do `React.lazy` (`retryKey`).
  - Para permitir reconexão a quente sem recarregar a janela inteira, utilize **Dynamic Remotes** com cache-buster via `externalType: 'promise'` no Vite (`vite.config.ts`), ou trate a recuperação via recarregamento controlado (`window.location.reload()`).
* *Consulte a análise aprofundada em [docs/RESILIENCIA_ERROR_BOUNDARY.md](docs/RESILIENCIA_ERROR_BOUNDARY.md).*

### C. CORS e Headers no Remote
* O servidor do `remote` (`vite.config.ts`) deve manter `cors: true` e o header `Access-Control-Allow-Origin: '*'` habilitados para evitar bloqueios de recursos no navegador.

### D. Comunicação Desacoplada
* Não crie estados globais compartilhados diretamente entre `host` e `remote`.
* A comunicação entre aplicações deve acontecer via:
  1. Parâmetros de URL (`URLSearchParams`).
  2. Eventos nativos desacoplados (`CustomEvent` / `window.dispatchEvent`).

---

## 🛠️ 4. Padrões de Código e Ferramental

* **Linter:** O projeto utiliza **Oxlint** (`.oxlintrc.json`). Respeite as regras de lint existentes.
* **TypeScript:** Não desative tipagem estrita nem use casts inseguros sem justificativa explícita.
* **Estilização:** CSS modular / Vanilla CSS estruturado. Evite introduzir bibliotecas pesadas de CSS utilitário sem solicitação prévia.
