var mongoose = require('mongoose');
var async = require('async');

var Authentication = app.helpers.Authentication;
var Schedule = app.helpers.Schedule;
var Security = app.helpers.Security;
var Request = app.helpers.Request;
var Model = app.models.Matricula;

var Models = app.models;

var renderFields = null;

//
// (private) Verifica vagas disponíveis nas turmas
//
exports._vagasDisponiveis = function (turmasId, next) {
  var toMatchTurma = null;

  // Converte para ObjectId
  if (_.isArray(turmasId)) {
    var turmasIdObject = turmasId.map(turma => mongoose.Types.ObjectId(turma));
    toMatchTurma = { $in: turmasIdObject };
  }

  // Cria aggregate pipeline
  var aggregate = Models.Matricula.aggregate();

  // Encontra turmas
  if (toMatchTurma)
    aggregate.match({
      _turma: toMatchTurma,
      ignore: false
    });

  aggregate
    // Projeta apenas alguns campos
    .project({
      _id: 1,
      _turma: 1,
      _aluno: 1
    })
    // Agrupa por _turma, e soma vagas
    .group({
      _id: '$_turma',
      ingressos: { $sum: 1 }
    });

  aggregate.exec(function (err, collection) {
    if (err)
      return next(err);

    // Mapeia de volta as vagas, e deixa 0 como default
    var vagas = {};
    for (var k in turmasId) {
      let id = turmasId[k];
      vagas[id] = 0;
    }

    for (var k in collection) {
      let turma = collection[k];
      vagas[turma._id] = turma.ingressos;
    }

    return next(null, vagas);
  });
};

//
// Verifica vagas das turmas especificadas, ou, de todas por padrão
// (Applies a caching system)
//
var _vagasLastCall = 0;
var _vagasCache;
exports.vagas = function (req, res) {
  var turmas = null;

  // Make sure that if turmas is set, it's an array
  if (_.isArray(req.query.turmas))
    turmas = req.query.turmas;
  else if (req.query.turmas)
    turmas = [req.query.turmas];

  // Verify if it can be served with cached
  let age = Date.now() - _vagasLastCall;
  let cacheIsValid = _vagasCache && age < app.config.vagasCacheAge;
  if (turmas == null && cacheIsValid)
    return res.send(_vagasCache);

  exports._vagasDisponiveis(turmas, (err, turmas) => {
    if (err)
      return res.status(500).send(err);

    // Save cache
    _vagasLastCall = Date.now();
    _vagasCache = turmas;

    res.send(turmas);
  });
};


//
// Verifica ordem em turma
//
exports.simular = function (req, res) {
  var turmas = null;

  // Make sure that if turmas is set, it's an array
  if (_.isArray(req.body.turmas))
    turmas = req.body.turmas;
  else if (req.body.turmas)
    turmas = [req.body.turmas];

  if (!turmas)
    return res.status(500).send('Parametro não encontrado: `turmas`');

  // Verifica se usuario está logado
  if (!Authentication.isLogged(req))
    return res.status(401).send('Faça login primeiro.');

  var user = Authentication.loggedUser(req);

  async.mapLimit(turmas, 8, simulateTurma, (err, turmas) => {
    if (err)
      return res.status(500).send(err);

    res.send(turmas);
  });

  function simulateTurma(turma, next) {
    // Inject matricula
    var matricula = {
      _aluno: user._id,
      _turma: turma,
      _id: 'SIMULATION'
    };

    // Encontra posição em turma
    app.helpers.Cursos.classifyCourse(turma, (err, order, turma) => {
      if (err)
        return next(err);

      // Verify position
      let position = _.findIndex(order, { _aluno: matricula._aluno }) + 1;

      next(null, {
        _turma: turma._id,
        vagas: turma.vagas,
        ordem: position,
        inscritos: order.length
      });
    }, matricula, user._id);
  }

  // {
  //   _turma: turmaId,
  //   _aluno: user.id,
  //
  //   // Just to simulate...
  //   ignore: true
  // }, afterCreate);

};


//
// Salva turmas na grade
//
exports.ingressar = function (req, res) {
  var turmas = null;
  var turmasId = req.body.turmas;

  // Verifica se usuario está logado
  if (!Authentication.isLogged(req))
    return res.status(401).send('Faça login primeiro.');

  var user = Authentication.loggedUser(req);

  // Verifica se parametro `turmas` foi passado
  if (!('turmas' in req.body) || !_.isArray(turmasId))
    return res.status(500).send('Parâmetro faltando ou incorreto: turmas');

  // Encontra turmas no banco de dados
  Models.Turma.find({
    _id: { $in: turmasId || [] }
  }, verifyTurmas);

  // Verifica se turmas são válidas
  function verifyTurmas(err, models) {
    if (err)
      return res.status(500).send(err);

    // Verifica se todas as matérias foram encontradas
    var missing = _.difference(turmasId, _.map(models, 'id'));
    if (missing.length > 0)
      return res.status(500).send('Matérias não encontradas: ' + missing.join(','));

    // Salva objetos encontrados
    turmas = models;

    // Verifica conflitos entre as matérias
    checkSchedule(models);
  }

  // Verifica conflitos
  function checkSchedule(turmas) {
    var errors = Schedule.verifySchedule(turmas);

    if (errors)
      return res.status(500).send('Conflitos encontrados: ' + errors.join(','));

    checkVacancy(turmas);
  }

  // Verifica se há vagas (Apenas em turmas que estão em modo de 'firstIn');
  function checkVacancy(turmas) {
    // TODO: Implement se há vagas
    exports._vagasDisponiveis(null, function (err, turmas) {
      if (err)
        return res.status(500).send(err);

      emptyMatriculas();
    });
  }

  // Remove matrículas antigas
  function emptyMatriculas() {
    Models.Matricula.remove({
      _aluno: user._id
    }, function (err, models) {
      if (err)
        return res.status(500).send(err);

      commitToDatabase();
    });
  }

  // Cria novas matrículas
  function commitToDatabase() {
    var newMatriculas = turmas.map(turma => {
      return {
        _turma: turma._id,
        _aluno: user._id
      };
    });

    // Salva
    Models.Matricula.create(newMatriculas, function (err, models) {
      if (err)
        return res.status(500).send(err);

      if (!models)
        return res.send([]);

      res.send(models.map(model => model.toObject({ minimize: false, virtuals: true })));
    });
  }
};


//
// Encontra turmas ingressadas no BD
//
exports.registros = function (req, res) {
  // Verifica se usuario está logado
  if (!Authentication.isLogged(req))
    return res.status(401).send('Faça login primeiro.');

  var user = Authentication.loggedUser(req);

  // Encontra Matriculas no BD
  Models.Matricula.find({
    _aluno: user._id
  }, function (err, models) {
    if (err)
      return res.status(500).send(err);

    res.send(models.map(m => m.toObject({ minimize: false, virtuals: true })));
  });

};


//
// Import data from UFABC
//
exports.importar = function (req, res) {
  var mappedIds;
  var newModels;

  // Load all Turma ID's with ufabc_id
  app.models.Turma.aggregate([
    { $project: { _id: 1, ufabc_id: true } }
  ]).exec(function (err, turmas) {
    if (err)
      return res.status(500).send(err);

    // Index by ID
    mappedIds = {};
    for (var k in turmas)
      mappedIds[turmas[k].ufabc_id] = turmas[k]._id;

    // Continue loading vagas
    loadVagas();
  });

  // Load vagas
  function loadVagas() {
    app.helpers.Matriculas.loadVagas((err, vagas) => {
      // Initialize array that keeps new models
      newModels = [];

      // Generate matriculas for each turma
      for (var ufabc_id in vagas) {
        var _vagas = vagas[ufabc_id];
        var dbId = mappedIds[ufabc_id];

        if (!dbId) {
          console.error('Cannot find ufabc_id: ', ufabc_id);
          continue;
        }

        // Create model for each vaga and add to newModels
        for (var k = 0; k < _vagas; k++) {
          newModels.push({
            _turma: mongoose.Types.ObjectId(dbId),
            _aluno: mongoose.Types.ObjectId('574361ee54398e4899c8a31c')
          });
        }
      }

      importToDb(newModels);
    });
  }

  // Import all models to DB
  function importToDb(models) {
    app.models.Matricula.create(newModels, err => {
      if (err)
        return res.status(500).send(err);

      res.send(`Imported ${newModels.length} matriculas.`);
    });
  }
};

//
// Limpa Matriculas
//
exports.erase = function (req, res) {
  app.models.Matricula.remove({}, function (err, result) {
    if (err)
      return res.status(500).send(err);

    res.send(result);
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
