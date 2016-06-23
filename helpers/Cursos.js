var async = require('async')

//
// Busca matriculas no banco e classifica de acordo com método específico
//
exports.classifyCourse = function (turmaId, next, simulate = null, alunoId = null) {
  let Matricula = app.models.Matricula
  let Turma = app.models.Turma
  let Aluno = app.models.Aluno

  async.autoInject({
    preMatriculas: (next) => {
      Matricula.find({
        _turma: turmaId
      }, next)
    },

    matriculas: (preMatriculas, next) => {
      // Injects extra matriculas if needed (`simulate` is set AND there is
      // not matricula with the specified student ID)
      if (simulate && _.findIndex(preMatriculas, { '_aluno': alunoId }) < 0) {
        preMatriculas.push(simulate)
      }

      next(null, preMatriculas)
    },

    alunos: (matriculas, next) => {
      Aluno.find({
        _id: { $in: _.map(matriculas, '_aluno') }
      }, next)
    },

    jointMatriculas: (matriculas, alunos, next) => {
      // Index alunos by Id
      let _alunosById = {}
      for (let k in alunos)
        _alunosById[alunos[k]._id] = alunos[k]

      // Join to matriculas
      for (let k in matriculas) {
        let matricula = matriculas[k]
        matricula.aluno = _alunosById[matricula._aluno]
      }

      next(null, matriculas)
    },

    turma: (next) => {
      Turma.findOne({
        _id: turmaId
      }, next)
    },

    classifyMethod: (turma, next) => {
      // Get a classification object
      exports.getClassificationMethod(turma, next)
    },

    classify: (classifyMethod, jointMatriculas, next) => {
      // Map each matricula and return it's scores
      let scores = jointMatriculas.map(classifyMethod.score)

      // Sort by the classification method rules
      let classify = _.sortBy(scores, classifyMethod.sort)

      next(null, classify)
    }

  }, (err, results) => {
    // Verifica se turma foi encontrada
    if (err)
      return next(err)

    next(null, results.classify, results.turma)
  })
}

//
// Verifica metodo a ser usado para esta turma específica
// Cada método de cassificação, é na verdade um objeto com 2 elementos:
// {
//  // score: Dada uma matricula, deve computar dados a partir dele a serem
//  // utilizados pela ordenação e retornar este objeto.
//  score: [Function(matricula)],
//
//  // sort: Um array contendo os critérios de ordenação em ordem
//  sort: [Array]
// }
//
exports.getClassificationMethod = function (turma, next) {
  // (TODO: Implementar todas as 21309130123 de lógicas loucas da UFABC)
  return next(null, new (app.helpers.Classifiers.Turno_CR)(turma))
}
