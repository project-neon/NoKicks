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
  username: String,

  curso: String,
  grade: String,
  turno: String,
  campus: String,
  ingresso: String,
  coeficientes: Object,
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

mongoose.model('Aluno', Model);
