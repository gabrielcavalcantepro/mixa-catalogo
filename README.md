# Mixa — Catálogo e Curadoria

Plataforma interna da Mixa para cadastrar peças de roupa e montar looks
curados. Ver [`SPEC.md`](./SPEC.md) para o domínio e
[`CLAUDE.md`](./CLAUDE.md) para as convenções de arquitetura.

## Rodando localmente

Pré-requisitos: Node 20.9+, Docker Desktop.

```bash
cp .env.example .env
# gerar um valor pra AUTH_SECRET no .env: npx auth secret

docker compose up -d       # sobe o Postgres em localhost:5432
npm install
npm run db:migrate         # cria as tabelas
npm run db:seed            # cria o 1º usuário + perfis de estilo + cápsulas
npm run dev                # http://localhost:3000
```

Login do seed (ajustável no `.env` antes de rodar `db:seed`):
`founder@mixa.com` / `mudeisso123`.

## Comandos

| Comando | O que faz |
|---|---|
| `npm run dev` | servidor de desenvolvimento |
| `npm run build` / `npm start` | build e start de produção |
| `npm run lint` | ESLint |
| `npm test` | testes (Vitest) |
| `npm run db:generate` | gera migration a partir de `db/schema` |
| `npm run db:migrate` | aplica migrations pendentes |
| `npm run db:studio` | abre o Drizzle Studio pra inspecionar os dados |
| `npm run db:seed` | popula usuário/perfis/cápsulas iniciais |
