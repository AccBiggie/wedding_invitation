// Conteudo do site do casamento. Editar aqui e reiniciar o backend atualiza a
// landing page inteira: nenhum texto abaixo esta escrito dentro do frontend.
export const wedding = {
  couple: ['Stéfani', 'André'],
  verse: 'Com a bênção de Deus e a alegria de nossos corações, convidamos você para o nosso grande dia.',
  photo: '/casal.jpg',
  // Data e hora reais da cerimonia, no fuso de Brasilia. O contador regressivo
  // da landing page e calculado a partir deste campo.
  datetime: '2027-04-10T17:00:00-03:00',
  date: ['10 de abril', 'de 2027'],
  time: ['16h00'],
  about: {
    title: 'Sobre nós',
    // TODO(noivos): trocar pelo texto de voces.
    paragraphs: [
      'A nossa história começou como as melhores histórias começam: sem aviso, no meio de um dia comum. Entre conversas que não acabavam e planos que foram ficando cada vez maiores, descobrimos que o lugar mais bonito para se estar é um ao lado do outro.',
      'Agora chegou a hora de dar o próximo passo, e queremos você por perto. Cada pessoa convidada faz parte da nossa caminhada até aqui — e a festa só fica completa com vocês.'
    ]
  },
  godparents: {
    title: 'Padrinhos',
    intro: 'As pessoas que caminham com a gente e que escolhemos para estar ainda mais perto neste dia.',
    // TODO(noivos): trocar pelos padrinhos reais. Para a foto, coloque o arquivo
    // em frontend/public/padrinhos/ e aponte aqui (ex.: '/padrinhos/ana-ricardo.jpg').
    // Sem foto, o card mostra as iniciais do casal.
    couples: [
      { names: ['Ana Paula', 'Ricardo'], role: 'Padrinhos da noiva', photo: '' },
      { names: ['Juliana', 'Marcos'], role: 'Padrinhos da noiva', photo: '' },
      { names: ['Camila', 'Bruno'], role: 'Padrinhos do noivo', photo: '' },
      { names: ['Fernanda', 'Diego'], role: 'Padrinhos do noivo', photo: '' },
      { names: ['Larissa', 'Thiago'], role: 'Padrinhos do noivo', photo: '' },
      { names: ['Beatriz', 'Rafael'], role: 'Padrinhos da noiva', photo: '' }
    ]
  },
  party: {
    label: 'Local da Festa',
    lines: ['Igreja Luterana', 'de Sussuí'],
    map: 'https://maps.app.goo.gl/PjsrKNU3og4HTd738',
    // Bloco "Cerimônia": nome, endereço curto, busca do mapa incorporado e horário.
    // TODO(noivos): conferir o endereço e o horário da festa.
    name: 'Igreja Luterana de Sussuí',
    address: 'Sussuí · Eng. Beltrão/PR',
    query: 'Igreja Luterana de Sussuí, Engenheiro Beltrão - PR',
    time: 'Logo após a cerimônia'
  },
  ceremony: {
    label: 'Local da Celebração',
    lines: ['R. Minas Gerais, 762-862', 'Eng. Beltrão/PR'],
    name: 'Igreja de Ivailândia',
    fullAddress: 'R. Minas Gerais, 762-862 - Ivailândia, Eng. Beltrão - PR, 87306-800',
    query: 'Paróquia São Gabriel Arcanjo e São Sebastião, R. Minas Gerais, 762-862, Ivailândia, Engenheiro Beltrão - PR, 87270-000',
    map: 'https://maps.app.goo.gl/R8X3S2GSwEqQ1ehn7'
  },
  gifts: {
    title: 'Lista de presentes',
    intro: 'A sua presença é o nosso maior presente. Mas se quiser nos ajudar a começar essa nova fase, deixamos algumas opções abaixo.',
    // TODO(noivos): trocar pela chave PIX de voces.
    pix: { label: 'Chave PIX', value: 'fetech.ferreira@gmail.com', hint: 'Copie a chave e presenteie do jeito que preferir.' },
    // TODO(noivos): apontar para as listas reais nas lojas.
    stores: [
      // categories: o card exibe as categorias cadastradas em "Categorias da loja".
      { name: 'Lista na loja', description: 'Cozinha, mesa e utensílios para a nossa casa.', url: '', categories: true }
    ]
  },
  // Secao "Nossa historia" (linha do tempo apos a lista de presentes). Fotos em
  // frontend/public/historia. O ultimo capitulo usa a data do casamento (date).
  // TODO(noivos): ajustar os textos e trocar os subtitulos pelas datas reais, se quiserem.
  story: {
    kicker: 'Nossa',
    title: 'História',
    tagline: 'Cinco capítulos, um só destino: nós.',
    lead: 'De um encontro despretensioso a uma vida inteira de planos. Aqui está a nossa jornada até o altar.',
    cover: '/historia/capa.webp',
    chapters: [
      { title: 'Onde tudo começou', subtitle: 'O começo de tudo', photo: '/historia/capitulo-1-comeco.webp', doodle: 'camera', note: 'Às vezes, as melhores histórias começam sem planejamento.',
        text: 'Um olhar, uma conversa que não queria acabar e aquela certeza tímida de que algo diferente estava nascendo. Ninguém planejou — e talvez por isso tenha dado tão certo.' },
      { title: 'Nossas aventuras', subtitle: 'Trilhas, estradas e selfies', photo: '/historia/capitulo-2-aventuras.webp', doodle: 'signpost', note: 'Dois mundos, o mesmo caminho.',
        text: 'Cachoeiras, mirantes e muitos quilômetros lado a lado. Descobrimos que qualquer lugar fica mais bonito quando estamos juntos — e que o melhor destino é sempre a companhia.' },
      { title: 'Casa comigo?', subtitle: 'Um café, panquecas e a pergunta', photo: '/historia/capitulo-3-pedido.webp', doodle: 'ring', note: 'O dia em que o para sempre começou.',
        text: 'Entre panquecas, morangos e um prato escrito em chocolate, veio a pergunta mais importante das nossas vidas. Até tinha a opção “não”, mas a resposta só podia ser uma: sim!' },
      { title: 'O primeiro sim', subtitle: 'Casamento civil', photo: '/historia/capitulo-4-civil.webp', doodle: 'toast', note: 'O primeiro “sim” de muitos.',
        text: 'Alianças trocadas, mãos um pouco trêmulas e sorrisos que não cabiam no rosto. Diante da família, dissemos o nosso primeiro “sim” — o começo oficial de um capítulo que ainda estamos escrevendo.' },
      { title: 'Rumo ao altar', subtitle: '', photo: '/historia/capitulo-5-altar.webp', doodle: 'chapel', note: 'Mesmo caminho, para sempre.',
        text: 'Agora seguimos para o capítulo mais esperado: celebrar o nosso amor diante de Deus e de quem mais amamos. E a gente quer você lá, com a gente.' }
    ],
    closing: ['Que venham os próximos capítulos', 'Juntos, sempre.'],
    polaroids: [
      { photo: '/historia/polaroid-banco.webp', caption: 'nós dois' },
      { photo: '/historia/polaroid-portao.webp', caption: 'para sempre' }
    ]
  },
  // Crédito da barra final do rodapé (logo da FETECH). TODO: link do site da FETECH.
  credit: { name: 'FETECH', url: '' },
  contact: {
    phone: '(44) 99883-3731',
    whatsapp: 'https://wa.me/5544998833731',
    email: 'fetech.ferreira@gmail.com',
    // Endereço do rodapé, em linhas.
    address: { street: 'R. Minas Gerais, 762-862 · Ivailândia', city: 'Eng. Beltrão - PR', zip: '87306-800' },
    // TODO(noivos): preencher para os icones aparecerem no rodape.
    instagram: '',
    facebook: ''
  }
};
