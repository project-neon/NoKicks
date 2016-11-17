/*!
 * Module dependencies
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;
var PluginTimestamp = require('mongoose-timestamp');

/**
 * User schema
 */

var Model = new Schema({

  ufabc_id: Number,
  nome: String,
  codigo: String,
  codigoNome: String,

  vagas: Number,
  vagasIngressantes: Number,

  tpi: Array,
  turno: String,
  turma: String,
  campus: String,
  creditos: Number,
  horarios: Array,
  campusNome: String,
  obrigatoriedade: Object,

});

/**
 * User plugin
 */

Model.plugin(PluginTimestamp);

/**
 * Hooks
 * - pre-save hooks
 * - validations
 * - virtuals
 */
Model.virtual('schedule').get(function (){

  // Agrupa horários pelos dias
  var horariosDias = _.groupBy(this.horarios, 'dia');

  // Mapeia cada dia, e encontra inicio/fim por quinzena
  var horarios = _.mapValues(horariosDias, (values) => {
    // Seleciona Q1 e Q2
    var q1 = _.filter(values, {semanaI: true});
    var q2 = _.filter(values, {semanaII: true});

    // Para cada horário do dia, verifica minimo e máximo
    var q1s = sanitizeTime(_.minBy(q1, t => { return t.inicio }), 'inicio');
    var q1e = sanitizeTime(_.maxBy(q1, t => { return t.final }), 'final');

    var q2s = sanitizeTime(_.minBy(q2, t => { return t.inicio }), 'inicio');
    var q2e = sanitizeTime(_.maxBy(q2, t => { return t.final }), 'final');

    return {
      // Set flag indicating if both weeks are the same
      equal: q1s == q2s && q1e == q2e,

      // Process text
      q1: q1s ? q1s + ' - ' + q1e : null,
      q2: q2s ? q2s + ' - ' + q2e : null,
    }
  });

  function sanitizeTime(time, key){
    if(!time)
      return null;

    return time[key].replace(':', 'h').replace('00', '');
  }

  function timeToNumber(time){
    return time;
    // var times = time.split(':');
    // return times[0]*1 + times[1] / 100*1;
  }

  return horarios;
});

/**
 * Methods
 */

Model.method({

});

/**
 * Statics
 */

Model.static({
  fromJSON: function (json) {

    if(!json)
      return new Model();

    // Filtra alguns campos
    json.nome = json.nome.replace('\n', '');

    // Find out turno
    let turno;
    if(json.nome.indexOf('Noturno') >= 0)
      turno = 'cNOT';
    else
      turno = 'aMAT';

    // Encontra o Nome da turma
    let regTurma = /[a-z|A-Z|0-9]{1}[0-9]*(?=-Matutino|-Noturno)/g;
    let turma = json.nome.match(regTurma)[0];

    // Encontra o Nome da materia
    let regCodigoNome = /.+(?=\ [a-z|A-Z|0-9]{1}[0-9]*(-Matutino|-Noturno))/g;
    let codigoNome = json.nome.match(regCodigoNome)[0];

    // Encontra Campus
    let campus;
    if(json.nome.indexOf('Santo Andr') > 0)
      campus = 'SA';
    else
      campus = 'SB';

    // Process horarios
    var horarios = json.horarios.map( (horario) => {
      let horas = horario.horas;
      let periodo = horario.periodicidade_extenso;

      let semanal = periodo.indexOf('semanal') > 0;
      let semanaI = semanal;
      let semanaII = semanal;

      semanaI = semanaI || periodo.indexOf('(I)') > 0;
      semanaII = semanaII || periodo.indexOf('(II)') > 0;

      // Change turno if is between 13h-18h
      var startSample = parseInt(horas[0].split(':'));
      if(startSample > 13 && startSample < 18)
        turno = 'bVES';

      return {
        inicio: horas[0],
        final: horas[horas.length - 1],
        dia: horario.semana,
        semanal: semanal,
        semanaI: semanaI,
        semanaII: semanaII,
      }
    });

    // Process obrigatoriedades and index by course Id
    var obrigatoriedades = {};

    json.obrigatoriedades.forEach( (obj) => {
      var type = obj.obrigatoriedade;

      type = type == 'obrigatoria' ? 'obrigatoria' : 'limitada';

      obrigatoriedades[obj.curso_id] = type;
    })

    let data = {
      ufabc_id: json.id,
      nome: json.nome,
      codigo: json.codigo,
      codigoNome: codigoNome,

      vagas: json.vagas,
      vagasIngressantes: json.vagas_ingressantes,

      tpi: json.tpi || null,
      turno: turno,
      turma: turma,
      campus: campus,
      creditos: json.creditos,
      horarios: horarios,
      obrigatoriedade: obrigatoriedades,
    }

    return data;
  }
});

/**
 * Register
 */

mongoose.model('Turma', Model);
