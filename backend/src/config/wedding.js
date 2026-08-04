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
    map: 'https://maps.app.goo.gl/PjsrKNU3og4HTd738'
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
      { name: 'Lista na loja', description: 'Cozinha, mesa e utensílios para a nossa casa.', url: '' },
      { name: 'Lua de mel', description: 'Ajude a construir a nossa primeira viagem como marido e mulher.', url: '' }
    ]
  },
  contact: {
    phone: '(44) 99883-3731',
    whatsapp: 'https://wa.me/5544998833731',
    email: 'fetech.ferreira@gmail.com',
    // TODO(noivos): preencher para os icones aparecerem no rodape.
    instagram: '',
    facebook: ''
  }
};
