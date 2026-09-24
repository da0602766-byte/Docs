# Cartilha 2 · Ciclo Certo, cooperativa de recicláveis

**Esta cartilha foi sorteada para dois alunos.** Vocês receberam o mesmo problema e vão entregar
soluções diferentes. Não combinem marca, paleta, telas nem nomes de rota. Na apresentação, cada
um explica as escolhas que fez e por que não fez as do colega.

## O negócio

Uma cooperativa de catadores que busca o reciclável na casa de quem separa. Cada quilo entregue
vira pontos, que o morador troca por desconto no comércio do bairro. Hoje a coleta é marcada por
telefone, e os pontos ficam numa planilha que o morador nunca vê.

## Perfil A · Joana, a moradora. Usa no celular.

Joana tem 45 anos, é professora e separa o lixo de casa há anos. Quer marcar a coleta pelo celular,
num intervalo entre uma aula e outra, e saber quantos pontos cada entrega rendeu.

O que ela faz:

1. Agenda uma coleta, com o endereço, o dia e o que separou.
2. Vê as coletas dela e a situação de cada uma.
3. Abre uma coleta e vê o que foi pesado e quantos pontos rendeu.

## Perfil B · Osmar, o coordenador da cooperativa. Usa no computador.

Osmar monta a rota do caminhão e confere a balança no galpão. Precisa ver as coletas do dia de uma
vez e registrar cada pesagem logo que o material desce do caminhão.

O que ele faz:

1. Vê as coletas, filtradas por dia.
2. Abre uma coleta e registra a pesagem de um material, com o tipo e os quilos.
3. Confere os pontos que a coleta somou.

## As três entidades

- **O usuário.** Quem entra no sistema. Tem um tipo: morador ou cooperativa.
- **A coleta.** Pertence a um morador. Guarda o endereço, o dia, a situação e o total de pontos.
- **A pesagem.** Pertence a uma coleta. Guarda o material e os quilos.

## As quatro telas

Da pessoa, pensadas para o celular:

1. **Agendar coleta.** O formulário que a Joana preenche quando o material está separado.
2. **Minhas coletas.** As coletas dela, com a situação, e as pesagens de cada uma.

Da gestão, pensadas para o computador:

3. **A rota.** Todas as coletas, com o filtro por dia.
4. **A balança.** O formulário que registra uma pesagem numa coleta.

Todas as telas funcionam nos dois tamanhos. O aparelho de cada perfil diz onde a tela precisa
estar impecável.

## O que o back precisa oferecer

1. Listar as coletas, com filtro por dia e por morador.
2. Mostrar uma coleta.
3. Agendar uma coleta nova.
4. Listar as pesagens de uma coleta.
5. Registrar uma pesagem numa coleta, aplicando a regra abaixo.

Os caminhos, os métodos, os nomes e os status são decisão sua. A régua é o REST da aula 2, e na
apresentação você defende cada escolha.

## A regra que o serviço cuida

A coleta nova começa como **agendada**, com zero pontos. Cada material vale uma quantidade de pontos
por quilo: papel 1, vidro 1, plástico 2 e metal 4. Registrar uma pesagem soma os pontos dela ao
total da coleta. A primeira pesagem muda a situação para **coletada**.

## Antes do login

Enquanto o login não chega, o front deixa escolher o perfil numa lista, sem senha. A tela da
pessoa pede ao back só o que é dela, informando quem ela é na própria requisição.

## O que não faz parte

Troca dos pontos por desconto, mapa da rota, pagamento e aviso por mensagem.

## O que vem depois

No ciclo 2 esses dados saem da memória e vão para o MySQL. No ciclo 4 o usuário ganha senha, e
Joana passa a ver só as coletas dela, porque o back confere quem está pedindo. No ciclo 5
entra um trecho de IA. A cartilha foi desenhada para aguentar as três coisas: não troque de ideia
no meio do caminho.
