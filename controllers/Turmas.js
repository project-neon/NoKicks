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
  app.helpers.Matriculas.loadMaterias((err, materias) => {

    // Convert models into Turmas
    var newModels = materias.map( m => Models.Turma.fromJSON(m) );

    // Import each model into DB
    async.mapSeries(newModels, insertOrUpdateTurma, (err) => {
      if(err)
        return res.status(500).send(err);

      res.send(`Imported ${newModels.length} turmas.`);
    });

    //
    // res.send(newModels);


  });

  function insertOrUpdateTurma(data, next) {
    console.log('insertOrUpdateTurma', data);
    Model.update({ufabc_id: data.ufabc_id}, data, {
      upsert: true,
      // setDefaultsOnInsert: true
    }, next);
  }
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
