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
