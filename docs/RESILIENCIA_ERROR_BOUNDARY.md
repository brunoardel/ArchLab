# Relatório Didático: Resiliência com ErrorBoundary e Suspense no Module Federation

## 1. Contexto e Objetivo
Em uma arquitetura de Micro Frontends, cada módulo remoto é distribuído e executado por servidores ou CDNs independentes. Uma falha de infraestrutura no serviço remoto (porta 3001 indisponível, falha de rede transitória ou erro no chunk `remoteEntry.js`) **não pode jamais derrubar o container principal (Host Shell)**.

Este relatório documenta o **Cenário B (Resiliência de Rede)** definido no [PRD.md](file:///c:/Users/Bruno/Documents/Projetos/labs/lab-module-federation/docs/PRD.md) e implementado na **Tarefa 4** do [TASKS.md](file:///c:/Users/Bruno/Documents/Projetos/labs/lab-module-federation/docs/TASKS.md):
1. Demonstração do comportamento de **Tela Branca (White Screen of Death)** quando o Remote cai sem proteção.
2. Análise do ciclo de vida assíncrono: a diferença e a sinergia entre **`React.Suspense`** e **`ErrorBoundary`**.
3. O desafio do cache em duas camadas: **React.lazy** vs **Module Map nativo do navegador (ECMAScript Spec)** e por que retries para a mesma URL estática falham.
4. Soluções arquiteturais: Dynamic Remote URL (`externalType: 'promise'`), cache-busting e recarregamento controlado.
5. Implementação de nível sênior do fallback amigável com diagnóstico e auto-recuperação.

---

## 2. O Cenário sem Resiliência (Tela Branca / Crash do Host)

### Como o Remote é importado originalmente
```typescript
// Sem barreira de contenção (ErrorBoundary)
const RemoteGeoViewer = lazy(() => import('remoteApp/GeoViewer'));

function TerrainPage() {
  return (
    <Suspense fallback={<Loading />}>
      <RemoteGeoViewer />
    </Suspense>
  );
}
```

### O que acontece quando o Remote está offline (porta 3001 caída)?
1. O usuário acessa a rota `/terreno` no Host (`localhost:3000`).
2. O `React.lazy` aciona o dynamic import do módulo remoto (`http://localhost:3001/assets/remoteEntry.js`).
3. Como a porta 3001 está inativa, a requisição de rede falha com `ERR_CONNECTION_REFUSED`.
4. A Promise rejeita com:
   ```text
   TypeError: Failed to fetch dynamically imported module: http://localhost:3001/assets/remoteEntry.js
   ```
5. O `React.Suspense` apenas aguarda Promises **pendentes**. Quando a Promise é **rejeitada**, o erro borbulha para cima na árvore de componentes.
6. Sem nenhum `ErrorBoundary` no caminho, o React 18 desmonta **toda a raiz da aplicação** para evitar estado corrompido.
7. **Resultado:** A tela inteira fica em branco (**White Screen of Death**). O usuário perde o cabeçalho, a barra lateral de navegação e todas as demais páginas do Host.

---

## 3. A Arquitetura de Resiliência: ErrorBoundary + Suspense

Para garantir alta disponibilidade e isolamento de falhas (*fault isolation*), combinamos duas camadas complementares:

```mermaid
graph TD
    A["Host Shell — Layout Base"] --> B["ErrorBoundary: Barreira de Contenção"]
    B --> C["React.Suspense: Carregamento Assíncrono"]
    C --> D["RemoteGeoViewer: React.lazy"]
    
    subgraph Fluxo_Sucesso["Fluxo de Sucesso"]
        D -->|Download OK| E["Renderiza GeoViewer Topografia"]
    end
    
    subgraph Fluxo_Falha["Fluxo de Falha de Rede / Remote Offline"]
        D -.->|ERR_CONNECTION_REFUSED| F["Rejeição da Promise"]
        F -.->|Capturado por| B
        B --> G["Renderiza Fallback Amigável com Diagnóstico"]
        G --> H["Host Shell Permanece 100% Funcional"]
    end
```

### Papel do `React.Suspense`
- Intercepta Promises no estado **pending** lançadas durante a renderização (`throw promise`).
- Renderiza o componente de loading transitório (`<TerrainLoadingFallback />`) enquanto os scripts remotos estão sendo transferidos pela rede.

### Papel do `ErrorBoundary`
- Componente de classe React implementando `getDerivedStateFromError` e `componentDidCatch`.
- Intercepta erros síncronos e Promises no estado **rejected**.
- Impede que o erro suba para os componentes pais, confinando a falha exclusivamente ao container do micro frontend.
- Renderiza uma interface de degradação graciosa com diagnóstico técnico e ações de auto-recuperação.

---

## 4. O Desafio das Duas Camadas de Cache na Recuperação de Falhas

Um dos comportamentos mais complexos e fascinantes em arquiteturas de Micro Frontends com ES Modules ocorre durante o processo de recuperação (*retry*). 

Quando o serviço remoto cai e o usuário clica em **"Tentar Novamente"**, existem **duas camadas distintas de cache** que precisam ser superadas para que o componente volte à vida:

```
[Clique em "Tentar Novamente"]
           │
           ▼
┌───────────────────────────────────────────────┐
│ Camada 1: Ciclo de Vida do React              │  --> ✅ Superado com retryKey / useMemo
│    (ErrorBoundary + React.lazy)               │      Gera uma nova instância do componente lazy.
└──────────────────────┬────────────────────────┘
                       │ chama import('remoteApp/GeoViewer')
                       ▼
┌───────────────────────────────────────────────┐
│ Camada 2: Plugin Vite Federation              │  --> ⚠️ URL Estática vs Dinâmica
│    (__federation_method_ensure)               │      Determina qual URL será entregue ao browser.
└──────────────────────┬────────────────────────┘
                       │ chama import(/* @vite-ignore */ url) nativo
                       ▼
┌───────────────────────────────────────────────┐
│ Camada 3: Engine JS do Navegador              │  --> ❌ O Bloqueio do "Module Map"
│    (ECMAScript / WHATWG Module Map)           │      O browser NÃO vai à rede para a mesma URL!
└───────────────────────────────────────────────┘
```

---

### Camada 1: O Cache de Promessas Rejeitadas do `React.lazy`

* **O Problema:** A instância interna do `React.lazy` armazena o status da Promise (`_status: Rejected`) e o objeto de erro (`_result: error`). Se o `ErrorBoundary` apenas limpar seu estado (`hasError: false`) e re-renderizar o mesmo lazy, o React relança imediatamente o erro em memória sem invocar a função de importação.
* **A Solução:** Usamos uma chave de recriação (`retryKey`) combinada com `useMemo`:
  ```typescript
  // A cada incremento de retryKey, uma nova instância limpa de lazy é criada
  const LazyGeoViewer = useMemo(() => {
    return lazy(() => import('remoteApp/GeoViewer'));
  }, [retryKey]);
  ```

---

### Camada 2: O Cache do "Module Map" do Navegador (Especificação ECMAScript / HTML5)

Quando testamos uma falha **real de infraestrutura** (desligando a porta `3001` do Remote):
1. O navegador tenta executar `import('http://localhost:3001/assets/remoteEntry.js')`.
2. Como a porta está fechada, a requisição de rede falha com `ERR_CONNECTION_REFUSED`.
3. **A Especificação Oficial (HostLoadImportedModule / WHATWG HTML5 Spec):**
   - O motor JavaScript do navegador (V8 no Chrome/Edge, SpiderMonkey no Firefox, JavaScriptCore no Safari) mantém uma tabela global chamada **`Module Map`**.
   - Cada entrada nessa tabela é indexada pela URL absoluta do módulo (`http://localhost:3001/assets/remoteEntry.js`).
   - Quando o download de um módulo falha, a entrada transiciona permanentemente para o estado **`Errored` / `Rejected`**.
   - **A Regra da Engine:** Se o código JavaScript chamar `import()` novamente com a **mesma URL exata**, a especificação determina que o navegador **não realize nenhuma nova requisição de rede**. Ele devolve instantaneamente a Promise rejeitada em cache.
4. **O Efeito Colateral:** Mesmo que o servidor remoto seja religado e responda perfeitamente no navegador, clicar em *"Tentar Novamente"* no Host faz o navegador retornar o erro em cache instantaneamente, impedindo que o Remote seja recarregado sem um reload completo da página.

> 💡 **Nota Didática:** Por que o botão *"⚡ Simular Falha no Remote"* conseguia se recuperar, mas a queda real da porta 3001 não?  
> Porque a simulação criava apenas uma `new Promise` rejeitada artificialmente no React (Camada 1). Ela nunca disparava um `import()` nativo com falha na rede, de modo que o Module Map do navegador permaneceu limpo durante a simulação.

---

### Soluções Arquiteturais para Superar o Bloqueio do Module Map

Existem três abordagens consagradas pela indústria para superar o envenenamento do Module Map:

#### Abordagem A: Dynamic Remote URL com Cache-Buster no Vite Federation (Recomendada — Nível Sênior)
O plugin `@originjs/vite-plugin-federation` suporta a propriedade `externalType: 'promise'`. Em vez de registrar uma URL estática, registramos uma fábrica dinâmica:

```typescript
// host/vite.config.ts
federation({
  name: 'hostApp',
  remotes: {
    remoteApp: {
      external: 'Promise.resolve("http://localhost:3001/assets/remoteEntry.js?t=" + Date.now())',
      externalType: 'promise',
    },
  },
  // ...
})
```

* **Como Funciona:** Quando ocorre uma falha e o usuário clica em *"Tentar Novamente"*, a Promise é reexecutada com um novo timestamp (`?t=1728912345`).
* Para a engine JS do navegador, trata-se de uma **URL inédita**. O navegador ignora a entrada rejeitada antiga do Module Map, dispara uma requisição HTTP real para a porta 3001 e baixa o módulo com sucesso.
* Uma vez carregado com sucesso, o plugin define `remote.inited = true` e reutiliza a biblioteca em memória nas próximas renderizações.

#### Abordagem B: Recarregamento Controlado de Janela (`window.location.reload()`)
Se a falha capturada for um erro nativo de rede (`Failed to fetch dynamically imported module`), o botão de ação pode executar `window.location.reload()`. Como o estado da aplicação está preservado na URL (`?terrenoId=...`), o contexto não é perdido e todo o Module Map do navegador é limpo nativamente.

#### Abordagem C: Health Check Prévio via `fetch(url, { method: 'HEAD' })`
Antes de disparar o recálculo do componente, o botão de retry realiza um ping HTTP `fetch('http://localhost:3001/assets/remoteEntry.js', { method: 'HEAD', cache: 'no-store' })`. Se o servidor ainda estiver inacessível, avisa o usuário sem sujar o Module Map. Se responder `200 OK`, dispara o retry com a URL renovada.

---

## 5. Como Testar e Demonstrar no Projeto

### Teste 1: Simulação no Navegador (Didático / 1-Click)
1. Acesse o Host em `http://localhost:3000`.
2. Clique na rota **Visualizador de Terreno** no menu lateral.
3. No topo da página, clique no botão **"⚡ Simular Falha no Remote"**.
4. Observe que o `GeoViewer` é substituído pelo card de fallback resiliente com detalhes do erro e diagnóstico.
5. Note que o cabeçalho do Host, badges e a navegação lateral continuam totalmente intactos.
6. Clique no botão **"🔄 Tentar Novamente"** para restaurar e recarregar o componente com sucesso.

### Teste 2: Teste Real de Rede (Desligando o Servidor Remote)
1. Certifique-se de que o Host está rodando em `localhost:3000`.
2. Interrompa o servidor do Remote na porta 3001 (`Ctrl+C` no terminal do remote).
3. Atualize a página `/terreno` no Host.
4. O `ErrorBoundary` capturará o erro de rede real (`Failed to fetch dynamically imported module`), mantendo o Shell operacional.
5. Reinicie o servidor do Remote (`npm run preview:remote`).
6. Caso a URL configurada no `vite.config.ts` seja estática, ao clicar em **"🔄 Tentar Novamente"**, observe o efeito do **Module Map do navegador**: o React reinicia o ciclo, mas a engine JS devolve a rejeição em cache sem bater na rede. Para destravar nessa situação, recarregue a página (`F5`), ou adote a **Abordagem A (Dynamic Remote com cache-buster)** no Vite para permitir retries 100% em tempo de execução sem refresh total.
