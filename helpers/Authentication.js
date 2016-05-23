var async = require('async');
var _ = require('lodash');


//
// Verifica se o usuário existe e a senha está correta
//
exports.authenticate = function (user, next) {
  let PortalAluno = app.helpers.PortalAluno;
  let Aluno = app.models.Aluno;
  let portalUser, dbUser;

  let authenticate = (next) => {
    // Tenta logar no portal do aluno
    PortalAluno.authenticate(user, (err, session) => {
      if(err)
        return next(err);

      if(!session)
        return next('Usuário ou senha inválidos');

      portalUser = session;
      next();
    });
  };

  let findUser = (next) => {
    Aluno.findOne({
      // Não usamos o pass, pois validamos com o Portal do Aluno
      username: user.user,
    }, (err, user) => {
      if(err)
        return next(err);

      // Salva resultado, mas pode estar null
      dbUser = user;
      next();
    })
  };

  let gatterStudentInfo = (next) => {
    // Pula este passo se o usuario já existir no banco de dados
    if(dbUser)
      return next();

    PortalAluno.gatterStudentInfo(portalUser, next);
  };

  let createIfNotFound = (next) => {
    if(dbUser)
      return next();

    // Seleciona a primeira ficha (TODO: Verificar a atual...)
    var fichaId = _.keys(portalUser)[0];
    var ficha = portalUser[fichaId];

    // Cria usuário e salva
    dbUser = new Aluno({
      nome: portalUser.nome,
      username: portalUser.user,

      curso: ficha.curso,
      grade: ficha.grade,
      turno: ficha.turno,
      campus: ficha.campus,
      ingresso: ficha.ingresso,
      coeficientes: portalUser.coeficientes,
    });

    dbUser.save(next);
  };

  // Execute steps
  async.series([
    authenticate,
    findUser,
    gatterStudentInfo,
    createIfNotFound,
  ], (err) => {
    if(err)
      return next(err);

    next(null, dbUser);
  });
}

//
// Salva o usuário na sessão
//
exports.login = function (req, user) {
  req.session.user = user;
}

//
// Desloga o usuário
//
exports.logout = function (req) {
  req.session.user = undefined;
}

//
// Verifica se o usuário está logado
//
exports.isLogged = function (req) {
  return !!(req.session.user);
}

//
// Retorna usuário logado
//
exports.loggedUser = function (req){
  return req.session.user;
}

//
// Evita que o usuário acesse esta rota
// (apenas usuários logados)
//
exports.secureIsLogged = function (req, res, next) {
  if(exports.isLogged(req)){
    return next();
  }

  res.status(401).send('Você precisa logar para acessar esta rota.');
}
