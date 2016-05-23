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

  nome: String,
  codigo: String,
  codigoNome: String,

  vagas: Number,
  vagasIngressantes: Number,

  tpi: Array,
  turno: String,
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

});

/**
 * Register
 */

mongoose.model('Turma', Model);
