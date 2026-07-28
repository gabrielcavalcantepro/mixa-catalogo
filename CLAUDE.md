@AGENTS.md

# Mixa — Plataforma de Catálogo e Curadoria

Plataforma interna (founder + gestores) para cadastrar peças de roupa e
montar looks curados. Ver `SPEC.md` para o domínio completo — este
arquivo é sobre como o código está organizado e como rodar o projeto.

## Convenção: investigar antes de alterar

Ao corrigir um bug ou comportamento que já existe no sistema (não ao
criar algo novo), sempre declare a hipótese da causa antes de mexer em
qualquer código, investigue essa hipótese primeiro, e só implemente a
correção se a hipótese for confirmada pela investigação. Se a
investigação não confirmar a hipótese, não faça nenhuma alteração —
relate o que encontrou de fato e espere confirmação antes de agir. Essa
regra vale só pra alteração/correção; criação de funcionalidade nova
segue normal, sem essa etapa.

## Stack

- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript**
- **PostgreSQL** via Docker Compose (local) + **Drizzle ORM** (`drizzle-kit`)
- **Auth.js v5** (`next-auth@beta`), Credentials provider, sessão **JWT**
  (sem adapter de banco — não precisa pra Credentials-only)
- **Tailwind CSS v4** + **shadcn/ui** (gerado sobre **Base UI**, não Radix)
- **Zod** para validação de Server Actions
- **Vitest** para lógica pura (sem e2e nesta fase)
- Upload de imagem: **Supabase Storage** atrás da interface `Storage` em
  `lib/storage.ts` (ver seção própria abaixo) — trocado a partir de
  disco local em 2026-07-24, disco não sobrevivia a deploy serverless

## Comandos

```bash
docker compose up -d       # sobe o Postgres local
npm run db:generate        # gera migration a partir do schema em db/schema
npm run db:migrate         # aplica migrations
npm run db:seed            # cria 1 usuário + 7 perfis de estilo + 2 cápsulas
npm run dev                # http://localhost:3000
npm run lint
npm test                   # vitest run
npm run db:studio          # Drizzle Studio (inspecionar dados)
```

Variáveis de ambiente em `.env` (copiar de `.env.example`):
`DATABASE_URL`, `AUTH_SECRET` (gerar com `npx auth secret`),
`SEED_USER_EMAIL` / `SEED_USER_PASSWORD` / `SEED_USER_NOME` (usados só
pelo `db:seed`), `API_TOKEN` (token de serviço da API de leitura pro
app Mixa — ver `CLAUDE.md`/`SPEC.md` do `mixa-app`), `SUPABASE_URL` /
`SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_STORAGE_BUCKET` (armazenamento
de imagem — ver seção própria abaixo).

## Arquitetura: fatia vertical por tela (não-negociável)

Cada tela principal vive em `app/(dashboard)/<tela>/` como uma pasta
autocontida:

```
app/(dashboard)/<tela>/
  page.tsx           # lista (Server Component, lê searchParams)
  novo/page.tsx       # criar (quando existe)
  [id]/page.tsx       # editar/detalhe (quando existe)
  _components/        # componentes só desta tela
  _actions/            # Server Actions só desta tela ('use server')
  _queries/            # leituras do banco só desta tela
  _lib/                # zod schema, labels, funções puras só desta tela
```

Telas: `pecas`, `looks`, `sugestoes-de-look`, `capsulas`, `(auth)/login`.
`perfil_estilo` **não** é mais uma tela — ver seção "Schema do banco"
abaixo (os 7 perfis são fixos, sem tela de administrar).

**Regra ao adicionar/alterar algo**: se é lógica de uma tela específica,
mora na pasta dela. Só entram em `db/`, `lib/` ou `components/ui|shell`
coisas que são genuinamente compartilhadas (schema do banco, primitivas
de UI, shell de navegação, auth). Não importe arquivos de `_actions` ou
`_queries` de uma tela a partir de outra — se duas telas precisam do
mesmo dado de referência (ex.: lista de cápsulas pra um `<select>`), cada
uma escreve sua própria query local pequena (ver
`pecas/_queries/opcoes-formulario.ts` vs `looks/_queries/opcoes-formulario.ts`)
em vez de compartilhar código entre fatias.

## Schema do banco (`db/schema/`)

Um arquivo por entidade (`peca.ts`, `look.ts`, `capsula.ts`,
`perfil-estilo.ts`, `usuario.ts`, `enums.ts`, `relations.ts`). Pontos que
não são óbvios a partir da spec original:

- **Slots**: o "acessório" da spec virou 3 slots (`cinto`, `bolsa`,
  `acessorio_outro`) pra permitir combinar vários acessórios num look —
  decisão validada com o usuário.
- **`perfil_estilo`**: a spec original previa entidade editável pela
  equipe; decisão de produto (2026-07-25) fixou em 7 perfis (Esportivo,
  Tradicional, Elegante, Romântico, Criativo, Sexy, Dramático urbano) —
  continua sendo tabela (peça/look referenciam por id, `npm run
  db:seed` semeia os 7), mas **não tem mais tela de administrar**
  (criar/editar/apagar). Trocar a lista de perfis hoje é só editar
  `db/seed.ts` e rodar uma migração de dado (não existe mais UI pra
  isso).
- **`look_slot_trocado`** é uma tabela (lista), não um campo único — uma
  variante pode trocar mais de um slot de uma vez (ex.: cinto + sapato).
- **`capsula`** é entidade própria (`nome` + `data_lancamento`), não texto
  livre na peça — necessário pra "cápsula mais recente" do look ser
  calculável (`looks/_lib/derivar-capsula.ts`, testado).
- **`peca.nome`** e **`look.nome`** não estavam na spec original; foram
  adicionados pra identificar peças/looks em listas e selects.
- **`look.capsula_id`** é sempre recalculada no create/update (nunca
  editável pelo usuário) — ver `derivar-capsula.ts` e
  `looks/_actions/{criar,atualizar,criar-variante}.ts`.
- Variante de look: `criar-variante.ts` NÃO pede pro usuário marcar quais
  slots mudaram — ele recebe o novo conjunto completo de peças e calcula
  a diferença contra o look-base (`_lib/calcular-slots-trocados.ts`,
  testado). Precisa mudar ao menos 1 slot ou a action rejeita.
- **Clima só existe em 4 slots** (`parte_de_cima`, `parte_de_baixo`,
  `peca_unica`, `calcado` — constante `SLOTS_COM_CLIMA`, duplicada em
  `pecas/_lib/schema.ts`, `looks/_lib/derivar-clima.ts` e
  `sugestoes-de-look/_lib/gerar-candidatos.ts`). Cinto/bolsa/acessório-
  outro não têm — `pecaSchema` rejeita clima nesses slots via
  `superRefine`, e o form esconde o fieldset (ver "eco de valores" nos
  gotchas abaixo, o mesmo mecanismo é usado pra saber o slot atual antes
  de submeter).
- **`look.clima_misto` + tabela `look_clima`**: clima do look é derivado
  (igual cápsula) — interseção dos climas das peças que têm clima
  definido (`looks/_lib/derivar-clima.ts`, testado). Interseção vazia com
  peças relevantes presentes = `clima_misto = true` (não bloqueia a
  criação, só sinaliza — só acontece em looks montados manualmente, o
  motor de sugestão abaixo nunca gera candidato misto).
- **Motor de sugestão de looks** (`sugestoes-de-look/`, regra pura, sem
  IA/LLM): combina peças por slot incrementalmente (corpo → calçado →
  sobreposição/cinto/bolsa/acessório, cada opcional gera "com" x "sem"),
  podando qualquer ramo que zere a interseção de clima ou ocasião assim
  que isso acontece — nunca monta a combinação completa pra só então
  filtrar. Cada combinação final vira uma assinatura determinística
  (`_lib/calcular-fingerprint.ts`) guardada em `look_candidato.fingerprint`
  (`unique`); antes de gerar, o Set de assinaturas já usadas inclui todo
  `look` existente **e** todo `look_candidato` anterior, **de qualquer
  status** (pendente/aprovado/reprovado) — é assim que rodar "gerar
  candidatos" de novo nunca duplica nem faz reaparecer algo já
  aprovado/reprovado. Status nunca fica só em duas opções: candidato
  aprovado ou reprovado **nunca é apagado** (mantém histórico e segue
  bloqueando o fingerprint) — reprovado pode ser reaberto
  (`reabrir-candidato.ts`, volta pra `pendente`); aprovado não tem
  volta (já virou `look` de verdade). "Aprovar" um candidato reaproveita
  `looks/_actions/_inserir-look.ts` (mesmo helper de
  `criar-look.ts`/`criar-variante.ts`) e marca `status: "aprovado"` (não
  apaga) — a tela de revisão (`looks/a-partir-de/[candidatoId]/page.tsx`)
  reusa o `LookForm` da própria fatia de looks em vez de duplicar. A
  tela `/sugestoes-de-look` tem abas Pendentes/Reprovados
  (`_components/sugestoes-tabs.tsx`); **não** existe aba de Aprovados —
  `/looks` já cobre isso.
- **`SeletorPecaDoSlot`** (`looks/_components/seletor-peca-do-slot.tsx`):
  seletor de peça + imagem lado a lado, um por slot, usado por
  `LookForm` (criar/editar look e revisar candidato — as 3 telas
  reaproveitam o mesmo `LookForm`, então basta mudar lá). A imagem
  **sempre** vem de procurar a peça selecionada dentro da mesma lista de
  opções que alimenta o `<Select>` (nunca de uma colagem calculada à
  parte) — é assim que nunca dessincroniza quando o usuário troca a
  peça. Ordem de exibição em `LookForm` é hard-coded (não vem de
  `SLOTS_EM_ORDEM`, que é a ordem "de leitura" usada por
  `LookGridColagem`/`look-card.tsx`): peça única e parte de cima juntos
  na mesma linha (alternativos), depois parte de baixo, sobreposição,
  calçado, cinto, bolsa, acessório-outro.
- **`LookForm` tem um prop `camposExtras`** — função
  `(valoresAtuais) => ReactNode`, não um `ReactNode` direto. É assim que
  a tela de revisar candidato injeta o seletor "É variante de"
  (`variante-de-seletor.tsx`) só ali, sem duplicar o form inteiro. Tem
  que ser função (não JSX pronto) porque a página que chama isso é
  Server Component — passar uma função de Server Component pra Client
  Component quebra a serialização do RSC (mesmo problema do
  `<SelectValue>` já anotado abaixo), por isso existe o
  `AprovarCandidatoForm` (Client Component pequeno que só compõe
  `LookForm` + `VarianteDeSeletor`) entre a página e o `LookForm` — a
  página passa dados simples pro `AprovarCandidatoForm`, que aí sim
  monta a função internamente, tudo já do lado do cliente.

## Auth

`lib/auth.ts` configura Credentials + JWT. Sem tela de cadastro — contas
só são criadas via `db/seed.ts` ou inserindo direto no banco (hash com
bcrypt). `app/(dashboard)/layout.tsx` faz o gate: sem sessão → redirect
pra `/login`. Não há `middleware`/`proxy.ts` — o Next 16 renomeou
middleware pra proxy, mas como só temos essa checagem simples, ela vive
no layout do dashboard mesmo.

## API de leitura pro app Mixa

`app/api/v1/` expõe uma API HTTP só de leitura pro futuro app Mixa
(projeto separado, fora deste repo) consumir. Fica fora de
`(dashboard)` de propósito: rotas em `app/api/` não passam pelo
`layout.tsx` do dashboard (que faz o gate de sessão via Auth.js) nem
por nenhum layout React — não tem relação com a navegação da equipe
interna, e a auth é outra (token de serviço, não sessão de usuária).
Este projeto **nunca** escreve nada de volta pro app — só os 3
endpoints `GET` abaixo.

### Autenticação

Toda rota exige o header `Authorization: Bearer <API_TOKEN>`, onde
`API_TOKEN` é o valor configurado em `.env` (gerar com
`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`).
Comparação feita com `crypto.timingSafeEqual` em
`app/api/v1/_lib/autenticar.ts` (evita timing attack). Sem token válido:
`401 { "erro": "Não autenticado." }`. Sem `API_TOKEN` configurado no
servidor: `500 { "erro": "API não configurada (falta API_TOKEN)." }`.
Sem CORS e sem paginação/filtro — é chamada servidor-a-servidor, e o
motor de decisão que cruza clima/ocasião/perfil vive no app (conforme o
SPEC.md), que busca tudo daqui e filtra do lado dele.

Cada rota devolve um array JSON puro (sem envelope `{data:...}`). Datas
saem como `"AAAA-MM-DD"` (sem hora/timezone). Nomes de campo em
camelCase, mesmo vocabulário em português do resto do schema.

### `GET /api/v1/looks`

Toda linha da tabela `look` — não existe status em `look` (só
`look_candidato` tem `pendente/aprovado/reprovado`, e essa fila de
sugestão **nunca** é lida por este endpoint); um look só passa a
existir na tabela depois de criado manualmente ou aprovado a partir de
um candidato, então a tabela inteira já é "os aprovados".

```jsonc
[
  {
    "id": "uuid",
    "nome": "string | null",
    "capsula": { "id": "uuid", "nome": "string", "dataLancamento": "AAAA-MM-DD" },
    "clima": { "climas": ["frio" /* | "meia_estacao" | "quente" */], "misto": false },
    "ocasioes": ["trabalho" /* | lazer | casa | treino | evento */],
    "perfisEstilo": [{ "id": "uuid", "nome": "string" }],
    "pecas": [
      {
        "slot": "parte_de_cima" /* | parte_de_baixo | peca_unica | calcado | sobreposicao | cinto | bolsa | acessorio_outro */,
        "peca": {
          "id": "uuid",
          "nome": "string",
          "imagens": [{ "url": "string", "isCapa": true }]
        }
      }
    ],
    "varianteDe": { "id": "uuid", "nome": "string | null" }, // ou null
    "slotsTrocados": ["cinto"] // só presente quando varianteDe não é null
  }
]
```

### `GET /api/v1/pecas`

Todo o catálogo (não filtra por cápsula/slot/etc — o app busca tudo).

```jsonc
[
  {
    "id": "uuid",
    "nome": "string",
    "slot": "parte_de_cima",
    "cor": { "tipo": "neutra" /* | "destaque" */, "valor": "string" },
    "pecaChave": true,
    "capsula": { "id": "uuid", "nome": "string", "dataLancamento": "AAAA-MM-DD" },
    "linkAfiliado": "string | null", // já pode não ser link de afiliado de verdade ainda
    "imagens": [{ "url": "string", "ordem": 0, "isCapa": true }],
    "pesoClima": ["quente"], // vazio em slots sem clima (cinto/bolsa/acessorio_outro)
    "ocasiaoBase": ["trabalho", "lazer"],
    "perfilEstilo": [{ "id": "uuid", "nome": "string" }]
  }
]
```

### `GET /api/v1/perfis-de-estilo`

Lista simples, pro onboarding do app:

```jsonc
[{ "id": "uuid", "nome": "string", "descricao": "string | null" }]
```

## Armazenamento de imagem (Supabase Storage)

`lib/storage.ts` define a interface `Storage` (`salvar`/`remover`) —
implementação atual é `SupabaseStorage`, bucket único e **público**
(fotos de produto, o `mixa-app` também precisa carregar sem auth). Os 3
únicos consumidores (`pecas/_actions/{criar,atualizar,excluir}-peca.ts`)
só chamam a interface, nunca a implementação — trocar de provedor de
novo no futuro não exige tocar nas telas.

Usa a `service_role key`, não a `anon` — ignora RLS, não precisa de
política de bucket configurada no painel. **Nunca pode virar
`NEXT_PUBLIC_*`** nem ser importada por um Client Component; o módulo
só é (e só pode ser) importado a partir de Server Actions.

Client Supabase é **lazy** (`obterClienteEBucket()`, dentro de
`lib/storage.ts`) — as env vars só são exigidas na 1ª operação de
verdade, não no import do módulo. Isso é de propósito: sem isso,
`lib/storage.test.ts` (que testa só `extrairCaminhoDoBucket`, função
pura de parsing de URL) exigiria Supabase configurado só pra rodar
`npm test`. Mesmo padrão usado em `lib/auth.ts`-adjacent code do
`mixa-app` (`lib/push/web-push.ts`) — configuração obrigatória, mas
checada só no primeiro uso real, não no import.

**Variáveis novas** (`.env.example`): `SUPABASE_URL` e
`SUPABASE_SERVICE_ROLE_KEY` vêm de Project Settings → **API** no painel
Supabase — **não confundir** com o `DATABASE_URL` (que usa a connection
string de Project Settings → **Database**), mesma conta/projeto,
credenciais diferentes. `SUPABASE_STORAGE_BUCKET` é o nome do bucket
(sugestão usada aqui: `pecas`) — **criado manualmente no painel**
(Storage → New bucket → marcar **Public**), não existe jeito de criar
isso via código/migration.

Sem fallback pra disco se as env vars faltarem — lança erro claro
(`exigirEnv`) em vez de voltar silenciosamente pro bug que motivou a
troca (imagem sumindo depois de todo deploy serverless).

## Convenções de formulário

Forms usam `<form action={serverAction}>` nativo + `useActionState`
(sem react-hook-form — não é necessário, `FormData` + Zod dão conta).
Padrão do action: retorna `{ erro?: string } | undefined`; nunca lança
exceção pro usuário ver (redirect que dá certo lança `NEXT_REDIRECT`
internamente, isso é esperado e não deve ser capturado).

Checkboxes/selects multi-valor: mesmo `name` em vários inputs, o action
lê com `formData.getAll(name)`.

### Form não pode perder o que o usuário digitou quando a action retorna erro

React 19 reseta os campos não-controlados de um `<form action={fn}>`
assim que a action **resolve** — mesmo que ela resolva retornando
`{ erro }` em vez de lançar (retornar sem lançar conta como "submissão
concluída" pro React, não só sucesso de negócio). Como nossos actions
sempre retornam objeto de erro (nunca lançam por validação — ver acima),
isso limpava `defaultValue`/`defaultChecked` de volta pro que estava no
primeiro render.

Fix (sem virar componente controlado nem usar react-hook-form): a action
ecoa de volta os valores brutos que o usuário submeteu junto do erro
(`extrairValoresPeca`/`extrairValoresLook` em cada `_lib/schema.ts`), e o
form usa `estado?.valores ?? valoresIniciais` — nunca só
`valoresIniciais` — como fonte de `defaultValue`/`defaultChecked`. Ao
resetar pro `defaultValue` do render atual, o React reseta pro que foi
de fato submetido, e o usuário não percebe nada.

Ao adicionar campo novo em `peca-form.tsx`/`look-form.tsx`: sempre ler de
`valoresAtuais` (o `?? ` acima), nunca direto de `valoresIniciais`.

### `null` vs `undefined` na extração de FormData pro Zod

`formData.get("campo")` num input sempre presente no DOM devolve string
(mesmo vazia), nunca `null` — mas se você mesmo converter pra `null`
numa função de extração (ex.: `linkAfiliado: valor || null`), o campo
Zod correspondente precisa aceitar `null` explicitamente
(`.nullish()`), não só `.optional()` (que só aceita `undefined`). Já
aconteceu duas vezes (`look.nome` e `peca.linkAfiliado`) — o erro é
"Invalid input: expected string, received null" e só aparece quando o
campo fica vazio.

### Ajustar estado a partir de uma prop/valor derivado: nunca com `useEffect` + `setState`

Pra sincronizar um `useState` (ex.: qual slot está selecionado, usado
pra decidir se mostra o fieldset de clima) com um valor que muda entre
renders (`estado?.valores?.slot`), **não** use
`useEffect(() => setState(...), [dep])` — isso já causou dois bugs
reais aqui: o lint (`react-hooks/set-state-in-effect`) barra
setState-síncrono-em-efeito, e uma versão "corrigida" ingênua (comparar
o valor cru com um `useState` que guarda a versão já normalizada, ex.
`undefined` vs `""`) trava em loop infinito de render porque as duas
formas nunca ficam iguais. O padrão certo (recomendado pelo próprio
React, sem efeito) é normalizar o valor de referência **uma vez por
render** e comparar/guardar sempre essa mesma forma normalizada:

```ts
const valorDeReferencia = valorDerivado ?? "";
const [atual, setAtual] = useState(valorDeReferencia);
const [ultimoSincronizado, setUltimoSincronizado] = useState(valorDeReferencia);
if (valorDeReferencia !== ultimoSincronizado) {
  setUltimoSincronizado(valorDeReferencia);
  setAtual(valorDeReferencia);
}
```

Ver `peca-form.tsx` (rastreia o slot selecionado pra esconder/mostrar o
fieldset de clima ao vivo, antes mesmo de submeter).

## Gotchas do Next 16 / Base UI (shadcn atual não usa Radix)

- `params` e `searchParams` em `page.tsx` são **Promises** — sempre
  `await`.
- shadcn aqui é baseado em **Base UI** (`@base-ui/react`), não Radix:
  - Não existe `asChild`. Use `render={<Componente .../>}` (ex.:
    `<Button render={<Link href="...">Texto</Link>} />`).
  - Ao renderizar `<Button render={<Link .../>}>`, passe também
    `nativeButton={false}` (senão Base UI avisa no console que esperava
    um `<button>` nativo). O elemento resultante é um `<a href>` mas com
    `role="button"` (Base UI força isso pra manter semântica de botão) —
    se algum dia escrever teste/automação, procure por
    `getByRole("button", { name })`, não `"link"`.
  - `<SelectValue>` aceita `children` como função `(valor) => ReactNode`
    pra mostrar o rótulo certo em vez do value cru — só funciona dentro
    de um Client Component (`"use client"`), porque passar uma função de
    Server Component pra Client Component quebra a serialização do RSC.
    `peca-filtros.tsx` e `look-filtros.tsx` são `"use client"` por causa
    disso.
- `next lint` foi removido — o script `lint` chama `eslint` direto.

## Cuidado: efeitos que fecham dialog/resetam form em `useActionState`

Se você escrever um `useEffect` pra detectar "a submissão deu certo"
comparando `!estado?.erro && !pending`, isso **dispara espúrio na
montagem** (estado inicial também é `!erro && !pending`) — em dev, o
Strict Mode do React roda o efeito duas vezes na montagem e o guard
"pular primeira renderização" baseado em `useRef` não protege a segunda
invocação. Foi exatamente esse bug em `perfil-form.tsx`/`capsula-form.tsx`
(fechava o dialog de editar sozinho, assim que abria). O jeito certo é
detectar a **transição** pendente→não-pendente com um ref que guarda o
`pending` anterior:

```ts
const estavaPendente = useRef(false);
useEffect(() => {
  if (estavaPendente.current && !pending && !estado?.erro) {
    // só dispara depois de uma submissão real
  }
  estavaPendente.current = pending;
}, [estado, pending]);
```

## O que falta pra produção (fora de escopo desta fase)

- ~~Armazenamento de imagem em disco local~~ **resolvido (2026-07-24)**:
  trocado pra Supabase Storage — ver seção "Armazenamento de imagem"
  acima.
- Fontes: Fraunces já é a real (Google Fonts). General Sans ainda não —
  `app/layout.tsx` usa Inter como substituto temporário na mesma variável
  de fonte (`--font-body`); trocar por `next/font/local` quando os
  arquivos da General Sans chegarem.
- Logo (ícone/logotipo) ainda não foi fornecido — nav bar usa só o nome
  "Mixa" em Fraunces itálico.
