var async = require('async');

var Security = app.helpers.Security;
var Request = app.helpers.Request;
var Model = app.models.Turma;

var Models = app.models;

var renderFields = null;

//
// Import data from UFABC
//
exports.importar = function (req, res) {

  // Load materias
  app.helpers.Matriculas.loadMaterias((err, materias) => {

    // Convert models into Turmas
    var newModels = materias.map(m => Models.Turma.fromJSON(m));

    // Import each model into DB
    async.mapSeries(newModels, insertOrUpdateTurma, (err) => {
      if (err)
        return res.status(500).send(err);

      res.send(`Imported ${newModels.length} turmas.`);
    });

  });

  function insertOrUpdateTurma(data, next) {
    Model.update({ ufabc_id: data.ufabc_id }, data, {
      upsert: true
      // setDefaultsOnInsert: true
    }, next);
  }
};

//
// A Cached version of all the turmas
//
var _cachedLastCall = 0;
var _cachedCache;
exports.cached = function (req, res) {
  // Verify if it can be served with cached
  let age = Date.now() - _cachedLastCall;
  let cacheIsValid = _cachedCache && age < app.config.turmasCacheAge;
  if (cacheIsValid)
    return res.send(_cachedCache);

  // Find all turmas
  app.models.Turma.find({})
    .sort('turno')
    .exec((err, turmas) => {
      if (err)
        return res.status(500).send(err);

      // Maps and calls toJSON in each object
      turmas = turmas.map(t => t.toObject({ minimize: false, virtuals: true }));

      // Save cache
      _cachedLastCall = Date.now();
      _cachedCache = turmas;

      res.send(turmas);
    });
};

//
// REST Api
//
exports.get = Request.get(Model, {
  deny: [],
  renderFields: renderFields
});

exports.find = Request.find(Model, {
  deny: [],
  queryFields: null,
  renderFields: renderFields
});

exports.create = Request.create(Model, {
  deny: [],
  renderFields: renderFields
});

exports.update = Request.update(Model, {
  deny: [],
  renderFields: renderFields
});

exports.delete = Request.destroy(Model, {
  deny: [],
  renderFields: renderFields
});
