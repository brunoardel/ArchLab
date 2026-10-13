# Tarefas de Implementação — Projeto 1 (Module Federation)

- [x] **Tarefa 1: Setup das Aplicações Host e Remote**
  - Criar projeto `host` e projeto `remote` com React + TypeScript e suporte a Module Federation.
  - Configurar portas: Host em 3000 e Remote em 3001.

- [x] **Tarefa 2: Criação e Exposição do Componente no Remote**
  - Criar componente `GeoViewer` no Remote com hooks de estado.
  - Configurar o Remote para expor o `GeoViewer` via Module Federation.

- [x] **Tarefa 3: O Experimento do Singleton (Erro e Correção)**
  - Configurar inicialmente o `shared` sem `singleton: true`.
  - Registrar a quebra de hooks no console.
  - Corrigir adicionando `singleton: true` e `requiredVersion` para React e ReactDOM.

- [ ] **Tarefa 4: Resiliência com ErrorBoundary e Suspense**
  - Importar o `GeoViewer` no Host usando `React.lazy`.
  - Criar um componente `ErrorBoundary` reutilizável.
  - Envolver o componente remoto com `ErrorBoundary` e `Suspense`.
  - Testar desligando o Remote e verificar se o fallback amigável aparece sem derrubar o Host.

- [ ] **Tarefa 5: Comunicação Desacoplada**
  - Fazer o Remote ler o ID do terreno ativo via `URLSearchParams`.
  - Implementar emissão e escuta de eventos nativos com `window.dispatchEvent` / `window.addEventListener`.