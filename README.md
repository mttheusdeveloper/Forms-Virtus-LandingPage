# Virtus Ads Finance — Dashboard

Dashboard financeiro da Virtus Ads: React + TypeScript + Vite, Tailwind v4, ApexCharts e Supabase.

## Setup

```bash
npm install
cp .env.example .env   # preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
npm run dev
```

## Scripts

- `npm run dev` — servidor de desenvolvimento
- `npm run build` — build de produção (`tsc -b && vite build`)
- `npm run preview` — serve o build de produção localmente

## Estrutura

- `src/lib/` — funções puras (formatters, parsers, regras de negócio da DRE/ROI/filtros)
- `src/hooks/` — dados derivados (`useMensalDerived`, `useAnualDerived`, `useDreContext`, ...) e o hook de gráficos (`useApexChart`)
- `src/state/` — reducer/contexto do dashboard e dos modais
- `src/components/` — `layout/`, `mensal/`, `anual/`, `charts/`, `modals/`, `ai/`
- `legacy-static/` — versão anterior em HTML/JS puro, mantida como referência

## Legado

Este projeto substituiu o dashboard estático (`legacy-static/`). A migração está documentada no histórico de commits.
