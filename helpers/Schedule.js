exports.verifySchedule = function (turmas){
  console.log('Updating schedule.');

  var schedule = {};
  var _included = 0;
  var _conflictTable = {};
  var conficts = []

  // Generate names and initialize data
  for(var k = 1; k <= 6; k++){
    schedule['q1_'+k] = [];
    schedule['q2_'+k] = [];
  }

  // Add turmas to schedule
  _.forEach(turmas, includeTurma);

  // Adiciona horarios da turma ao calendário
  function includeTurma(turma){

    var inConflict = {};

    _.forEach(turma.horarios, function (horario){
      // Parse inicio e final
      var inicio = timeToNumber(horario.inicio);
      var duracao = timeToNumber(horario.final) - inicio;

      var parsed = {
        inicio: inicio,
        duracao: duracao,
        nome: turma.turma + '-' + turma.codigo.split('-')[0],
        nomeSimples: turma.codigoNome,
        nomeCompleto: turma.nome,
        // cor: colors[_included % colors.length],
        id: turma.id,
      };

      // Processa estilo
      // parsed.style = styleForHorario(parsed);

      // Verifies conflicts
      var conflitos = [];
      // var conflitoQ2 = [];

      for(var k = inicio; k < inicio + duracao; k += 0.5){
        var _id = horario.dia+'.'+k;

        // Verifica conflito na semana I
        if(horario.semanaI && 'q1'+_id in _conflictTable){
          var conflict = _conflictTable['q1'+_id];

          if(conflitos.indexOf(conflict.id) < 0){
            createConflict(conflict, parsed);
            conflitos.push(conflict.id);
          }
        }

        // Verifica conflito na semana II
        if(horario.semanaII && 'q2'+_id in _conflictTable){
          conflict = _conflictTable['q2'+_id];

          if(conflitos.indexOf(conflict.id) < 0){
            createConflict(conflict, parsed);
            conflitos.push(conflict.id);
          }
          // if(!conflitoQ1)
            // createConflict(conflitoQ2, parsed);
        }

        // Para de verificar próximos conflitos se já existe algum
        // if(conflitoQ1 || conflitoQ2)
          // break;
      }

      // Preenche horários apenas se não está em conflito
      if(conflitos.length > 0)
        return;

      if(horario.semanaI)
        for(var k = inicio; k < inicio + duracao; k += 0.5)
          _conflictTable['q1' + horario.dia + '.' + k] = parsed;

      if(horario.semanaII)
        for(var k = inicio; k < inicio + duracao; k += 0.5)
          _conflictTable['q2' + horario.dia + '.' + k] = parsed;

      // Adiciona horário somente se não houver conflito
      if(horario.semanaI)
        schedule['q1_'+horario.dia].push(parsed);

      if(horario.semanaII)
        schedule['q2_'+horario.dia].push(parsed);
    })

    // Incrementa contador para alterar a cor da próxima vez
    _included++;
  }

  // Cria conflito alterando cor, e dando merge nas informações de t2 em t1
  function createConflict(t1, t2){
    console.log('Conflito: ', t1.nome, t2.nome);
    // Inicio: Menor das duas; final: Maior das duas
    var inicio = Math.min(t1.inicio, t2.inicio);
    var final = Math.max(t1.inicio + t1.duracao, t2.inicio + t2.duracao);
    // duracao: Maximo menos inicio
    var duracao = final - inicio;

    t1.id = t1.id + ':'+ t2.id;
    t1.cor = '255, 0, 0'; // RED
    t1.nome = t1.nome + ' ' + t2.nome;
    t1.inicio = inicio;
    t1.duracao = duracao;
    t1.nomeCompleto = t1.nomeSimples + ' + ' + t2.nomeSimples;

    // Adiciona a lista de conflitos
    conficts.push(`Matéria ${t1.nomeSimples} conflita com ${t2.nomeSimples}`);
  }

  function timeToNumber(time){
    if(!time)
      return 0;

    var t = time.split(':');
    return t[0] * 1 + t[1] * 1 / 100;
  }

  // function styleForHorario(horario){
  //   var h = 14;
  //   var s = 8; //  Hora de inicio
  //   var style = {
  //     'top': ((horario.inicio - s) * h) + 'px',
  //     'height': (horario.duracao * h) + 'px',
  //     'border-top-color': 'rgb(' + (horario.cor) + ')',
  //     'background-color': 'rgba(' + (horario.cor) + ', 0.8)',
  //   };
  //   return style;
  // }

  // Se nenhum conflito criado, retorna null
  return conficts.length ? conflicts : null;
}
