var async = require('async');

var Security = app.helpers.Security;
var Request = app.helpers.Request;
var Model = app.models.Turma;

var Models = app.models;

var renderFields = null;

//
// Import data from UFABC
//
exports.importar = function (req, res){

  // Load materias
  

};

//
// REST Api
//
exports.get = Request.get(Model, {
	deny: [],
	renderFields: renderFields,
});

exports.find = Request.find(Model, {
  deny: [],
	queryFields: null,
	renderFields: renderFields,
});

exports.create = Request.create(Model, {
  deny: [],
	renderFields: renderFields,
});

exports.update = Request.update(Model, {
  deny: [],
	renderFields: renderFields,
});

exports.delete = Request.destroy(Model, {
  deny: [],
	renderFields: renderFields,
});
