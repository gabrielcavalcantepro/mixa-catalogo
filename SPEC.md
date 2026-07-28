# Mixa — Plataforma de Catálogo (peças e curadoria de looks)

## Contexto

Mixa é um app de assinatura para mães que entrega, todo dia, um look pronto
montado a partir de um guarda-roupa cápsula controlado pela marca — a
usuária nunca escolhe roupa sozinha. O app final (fora do escopo desta
spec) terá 4 abas: Hoje, Looks, Promos, Perfil.

Esta spec cobre **apenas a plataforma interna que alimenta esse app**: o
catálogo de peças e a curadoria de looks. É usada só pelo founder e
gestores da marca — nunca pela usuária final. É a fonte da verdade que o
futuro app Mixa vai consumir.

## Objetivo desta fase

Construir uma plataforma web (não vai para App Store / Play Store) onde a
equipe consegue:

1. Cadastrar peças de roupa com atributos estruturados (catálogo).
2. Montar looks combinando peças cadastradas, incluindo variações que
   trocam a ocasião de um look trocando poucas peças-chave (curadoria).

**Fora de escopo nesta fase:** o app Mixa para a usuária final
(Hoje/Looks/Promos/Perfil), autenticação de usuárias finais, integração
com API de clima, notificações push, assinatura/pagamento, grupo de
WhatsApp. Esses itens reaproveitam os dados desta plataforma, mas são um
projeto futuro separado — não construir agora.

## Princípio central do catálogo

Poucas peças, o máximo de combinações possível. Peças "coringa" (cinto,
sapato, bolsa, casaco) permitem que, ao trocar apenas uma ou duas peças de
um look, ele passe a servir outra ocasião — ex.: um look de trabalho vira
um look pra sair trocando cinto e sapato.

Toda peça do catálogo é escolhida para ser universal — a usuária
provavelmente já tem algo parecido no guarda-roupa dela. **A usuária nunca
cadastra as próprias peças nesta versão do produto.** Essa tela não deve
ser construída.

## Modelo de dados

### Peça
Unidade atômica do catálogo.

- `slot`: posição que ocupa no look — parte de cima, parte de baixo, peça
  única (vestido/macacão), calçado, sobreposição (casaco/blazer/cardigã),
  acessório.
- `cor`: tipo (neutra ou destaque) + valor da cor.
- `peso_clima`: leve / meia-estação / pesada (pode ter mais de um).
- `estilo`: um ou mais perfis de estilo que essa peça atende (ver "Perfis
  de estilo" abaixo).
- `ocasiao_base`: uma ou mais ocasiões que a peça atende sozinha
  (trabalho, lazer, casa, treino, evento).
- `peca_chave`: booleano — marca se é uma peça coringa usada para trocar a
  ocasião de um look (ex.: cinto, sapato, bolsa, casaco).
- `capsula`: a qual cápsula/coleção a peça pertence (data ou nome de
  lançamento).
- `imagem`: uma ou mais imagens da peça, usadas para montar o
  grid/colagem do look — não existe foto de modelo vestindo o look
  completo.
- `link_afiliado`: opcional, link de compra da peça.

### Look
Uma combinação curada de peças — montada manualmente por um gestor, nunca
gerada automaticamente pelo sistema.

- `pecas`: referência às peças que compõem o look, uma por slot.
- `ocasiao_principal`: uma ou mais ocasiões que esse look atende.
- `perfis_estilo`: um ou mais perfis de estilo que esse look atende.
- `capsula`: derivada automaticamente — a mais recente entre as peças que
  compõem o look. Não é um campo editável manualmente.
- `variante_de` (opcional): referência a outro look, quando este nasceu de
  uma troca de peça-chave a partir de um look-base.
- `slot_trocado` (opcional, só preenchido se `variante_de` estiver
  preenchido): qual slot foi trocado em relação ao look-base.

### Perfil de estilo
Fixos (decisão de produto, 2026-07-25, validada — não é mais editável
pela equipe): Esportivo, Tradicional, Elegante, Romântico, Criativo,
Sexy, Dramático urbano. Continuam sendo uma entidade própria no banco
(peça e look referenciam por id) — só não há mais tela de
criar/editar/apagar perfil. São os perfis que a usuária final vai
escolher se identificar no onboarding do futuro app. Toda peça e todo
look referenciam um ou mais desses perfis.

## Sobre o motor de decisão (contexto, não construir agora)

O futuro app Mixa vai decidir qual look mostrar pra cada usuária cruzando
clima do dia (API) + ocasião da rotina dela + perfil de estilo dela contra
as tags dos looks curados aqui. É um motor de regras, não uma IA
generativa. Essa lógica pertence ao app futuro, não a esta plataforma —
mas é a razão de o modelo de dados acima existir assim, então vale
entender isso antes de propor a estrutura de dados.

## Identidade visual (reaproveitar na interface)

- Cores: preto `#1C1B19` e osso `#F1ECE1` — sem cor de destaque adicional.
- Tipografia: Fraunces itálico para títulos/headlines, General Sans para
  corpo/interface.
- Os arquivos de logo (ícone e logotipo, em preto e branco, variações
  vertical/horizontal) serão fornecidos separadamente.
- Posicionamento de marca: elegante, minimalista, editorial — evitar
  qualquer estética "fofinha" ou infantil.

## Princípios de arquitetura (não negociáveis)

- **Fatia vertical por tela.** Cada tela/aba principal da plataforma
  (ex.: cadastro de peças, curadoria de looks) vive na sua própria fatia
  de código pequena e autocontida. Não espalhar a lógica de uma mesma
  funcionalidade em várias camadas genéricas do projeto, e não misturar
  várias telas em um mesmo arquivo grande. Prefira muitos arquivos
  pequenos e focados a poucos arquivos grandes.
- Catálogo fechado: nenhuma tela de cadastro de peças pela usuária final,
  nem aqui nem no app futuro por enquanto.

## Decisões em aberto — quem decide é o Claude Code

Stack, banco de dados, estrutura de pastas, biblioteca de UI, forma de
autenticação da equipe interna: nada disso está definido de propósito.
Proponha e justifique com base no que esta spec pede.

## Definição de pronto (fase 1)

Um gestor consegue, pela plataforma web:

1. Fazer login.
2. Cadastrar uma peça nova com todos os atributos acima e ao menos uma
   imagem.
3. Montar um look escolhendo peças por slot, marcando ocasião(ões) e
   perfil(is) de estilo.
4. Marcar um look como variante de outro, indicando qual slot foi
   trocado.
5. Ver o look renderizado como grid/colagem das imagens das peças que o
   compõem.
6. Filtrar/buscar peças e looks por qualquer um dos atributos acima.
