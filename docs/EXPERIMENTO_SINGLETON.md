# Relatório Didático: O Experimento do Singleton no Module Federation

## 1. Contexto e Objetivo
No ecossistema de Micro Frontends com Module Federation, múltiplas aplicações independentes (Host e Remotes) compartilham bibliotecas de runtime. Bibliotecas orientadas a estado global de módulo — com destaque para o **React** — exigem que apenas **uma única instância** seja carregada na memória do navegador.

Este documento registra o **Cenário A (Quebra de Hooks)** do [PRD.md](file:///c:/Users/Bruno/Documents/Projetos/labs/lab-module-federation/docs/PRD.md):
1. Demonstração e registro da quebra de hooks no console quando `singleton: false` (ou ausente).
2. Análise da causa raiz no runtime do React 18 (`ReactCurrentDispatcher`).
3. Correção de nível sênior utilizando `singleton: true` e `requiredVersion`.

---

## 2. Cenário 1: Configuração Incorreta (Sem Singleton)

### Configuração no Vite (`vite.config.ts`)
```typescript
federation({
  name: 'hostApp',
  remotes: {
    remoteApp: 'http://localhost:3001/assets/remoteEntry.js',
  },
  shared: {
    react: {
      singleton: false, // ❌ ERRO: permite instâncias duplicadas
    },
    'react-dom': {
      singleton: false, // ❌ ERRO: renderer vinculado à instância local
    },
  },
})
```

### O que acontece no navegador?
1. O Host (`localhost:3000`) é iniciado e carrega sua própria cópia de `react` e `react-dom`.
2. O Host monta o DOM e define o dispatcher do React atual em `ReactSharedInternals.ReactCurrentDispatcher.current` (da **sua cópia** do React).
3. O componente remoto `GeoViewer` é baixado de `localhost:3001`.
4. Como `singleton: false`, o Remote utiliza seu **próprio chunk de React**.
5. Quando o `GeoViewer` executa sua função e chama `useState()` ou `useEffect()`:
   ```javascript
   function useState(initialState) {
     var dispatcher = resolveDispatcher();
     return dispatcher.useState(initialState);
   }
   ```
6. O `resolveDispatcher()` da cópia de React do Remote tenta ler `ReactCurrentDispatcher.current`.
7. Como a cópia do Remote nunca foi inicializada pelo renderer ativo, o dispatcher é `null`!

### Log de Erro Capturado no Console
```text
Uncaught Error: Invalid hook call. Hooks can only be called inside the body of a function component.
This could happen for one of the following reasons:
1. You might have mismatching versions of React and the renderer (such as React DOM)
2. You might be breaking the Rules of Hooks
3. You might have more than one copy of React in the same app
See https://reactjs.org/link/invalid-hook-call for tips about how to debug and fix this problem.

    at Object.resolveDispatcher (react.development.js:1476:13)
    at useState (react.development.js:1507:20)
    at GeoViewer (GeoViewer.tsx:32:32)
    at renderWithHooks (react-dom.development.js:14985:18)
    at mountIndeterminateComponent (react-dom.development.js:17811:13)
    at beginWork (react-dom.development.js:19049:16)
```

---

## 3. Cenário 2: Correção de Nível Sênior (Singleton & RequiredVersion)

### Configuração Corrigida (`vite.config.ts` tanto no Host quanto no Remote)
```typescript
federation({
  name: 'hostApp', // e 'remoteApp'
  remotes: {
    remoteApp: 'http://localhost:3001/assets/remoteEntry.js',
  },
  shared: {
    react: {
      singleton: true,              // ✅ Garante instância única na shareScope
      requiredVersion: '^18.3.1',    // ✅ Força negociação de versão compatível
    },
    'react-dom': {
      singleton: true,              // ✅ Garante que o renderer seja compatível
      requiredVersion: '^18.3.1',
    },
  },
})
```

### Por que a correção funciona?
- O container do Module Federation registra o `react` no escopo global compartilhado (`__federation_shared__['default']['react']`).
- Com `singleton: true`, o resolvedor verifica se já existe uma versão carregada no escopo compartilhado. Se existir e for compatível com `requiredVersion`, o Remote **descarta seu chunk local de React e consome exatamente a mesma referência em memória** já inicializada pelo Host.
- Dessa forma, `GeoViewer` e o Host compartilham o mesmo ponteiro de `ReactSharedInternals.ReactCurrentDispatcher.current`, e os hooks `useState` e `useEffect` executam perfeitamente sem erros.

---

## 4. Como Simular o Erro no Projeto (Didática)

No ecossistema Vite com `@originjs/vite-plugin-federation`:
- **Modo Padrão (Corrigido / Singleton Ativo):**
  Ambos `host/vite.config.ts` e `remote/vite.config.ts` mantêm `react` e `react-dom` declarados no bloco `shared` com `singleton: true` e `requiredVersion: '^18.3.1'`.
  ```bash
  npm run build:all
  ```
- **Modo Simulação do Erro (`singleton: false` / Não compartilhado):**
  Comente ou remova temporariamente o bloco `shared` em `remote/vite.config.ts` e execute `npm run build:remote`. O Remote compilará sua própria cópia de produção do React (`react_production_min.js`), gerando no Host o erro:
  `TypeError: Cannot read properties of null (reading 'useState')`.
