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
  campus: Number,
  horarios: Array,
  campusNome: String,
  obrigatoriedade: Array,

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
      turno = 'NOT';
    else
      turno = 'MAT';

    // Encontra o Nome da turma
    let regTurma = /[A-Z]{1}[0-9]*(?=-Matutino|-Noturno)/g;
    let turma = json.nome.match(regTurma)[0];

    // Encontra o Nome da materia
    let regCodigoNome = /.+(?=\ [A-Z]{1}[0-9]*(-Matutino|-Noturno))/g;
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
