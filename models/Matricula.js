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

  position: Number,

  // cr: Number,
  // cp: Number,
  // turno: String,
  // curso: String,
  // campus: String,
  // ingressante: Boolean,

  // Esta flag é usada para evitar conflito com as reais matrículas
  // É apenas usada para 'simular' uma entrada em alguma matéria
  // A qualquer momento, objetos com esta flag em 'true' serão apagados.
  ignore: {
    type: Boolean,
    default: false,
  },

  _aluno: {
    type: ObjectId,
    ref: 'Aluno',
    required: true,
  },

  _turma: {
    type: ObjectId,
    ref: 'Turma',
    required: true,
  },
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

});

/**
 * Register
 */

mongoose.model('Matricula', Model);
