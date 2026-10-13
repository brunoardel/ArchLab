# PRD — Projeto 1: Arquitetura de Micro Frontends com Module Federation

## 1. Visão Geral
Construir uma arquitetura de Micro Frontends simulando o ecossistema do ArchLab, composta por uma aplicação principal (**Host/Shell**) e uma aplicação remota (**Remote: Visualizador de Terreno**). O objetivo é reproduzir os principais problemas de runtime de micro frontends, demonstrar as falhas reais no console/navegador e implementar as correções arquiteturais de nível sênior.

## 2. Escopo e Requisitos Funcionais

### RF01: Aplicação Remote (Visualizador de Terreno)
- Deve rodar em porta independente (ex: `localhost:3001`).
- Deve expor um componente funcional chamado `GeoViewer`.
- O componente `GeoViewer` deve utilizar hooks internos (`useState`, `useEffect`) para simular o carregamento de coordenadas de um terreno.

### RF02: Aplicação Host (Container Principal)
- Deve rodar em porta independente (ex: `localhost:3000`).
- Deve renderizar o layout base (cabeçalho, barra lateral e área principal).
- Deve carregar o componente `GeoViewer` do Remote sob demanda (*lazy loading*).

### RF03: Demonstração e Correção de Erros (Didática)
- **Cenário A (Quebra de Hooks):** O projeto deve permitir alternar a configuração de Module Federation para simular `singleton: false` no React, gerando intencionalmente o erro `Invalid Hook Call` no console, e depois demonstrar a correção com `singleton: true`.
- **Cenário B (Resiliência de Rede):** O Host deve demonstrar o comportamento de tela branca quando o servidor do Remote é desligado, e a solução robusta implementando um `ErrorBoundary` em conjunto com `React.Suspense` exibindo um fallback com botão de "Tentar Novamente".
- **Cenário C (Comunicação Desacoplada):** O Host deve selecionar um ID de terreno via URL (`?terrenoId=123`) e disparar um `CustomEvent` ('terreno:alterado') que o Remote escuta e reage sem compartilhar estados globais rígidos.

## 3. Requisitos Não Funcionais
- Utilizar **React 18** e **TypeScript** em ambos os projetos.
- Utilizar **Vite** (com plugin `@originjs/vite-plugin-federation`) ou **Webpack 5** nativo.
- Código limpo, componentizado e desacoplado.