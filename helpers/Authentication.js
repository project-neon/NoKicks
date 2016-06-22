var async = require('async');
var _ = require('lodash');


//
// Verifica se o usuário existe e a senha está correta
//
exports.authenticate = function (user, next) {
  let PortalAluno = app.helpers.PortalAluno;
  let Aluno = app.models.Aluno;
  let portalSession, portalUser, dbUser;

  // Define a versão de importação utilizada para o usuário.
  // Se a versão do usuário diferir desta, a importação deve ser
  // realizada novamente.
  let THIS_VERSION = 3;

  let authenticate = (next) => {
    // Tenta logar no portal do aluno
    PortalAluno.authenticate(user, (err, session) => {
      if(err)
        return next(err);

      if(!session)
        return next('Usuário ou senha inválidos');

      portalSession = session;
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
    // Pula este passo se a versão do usuário for igual a versão deste processo
    if(dbUser && dbUser.version == THIS_VERSION)
      return next();

    PortalAluno.gatterStudentInfo(portalSession, (err, user) => {
      if(err)
        return next(err);

      // Save user
      portalUser = user;
      next();
    });
  };

  let createOrUpdateIfNeeded = (next) => {
    // Pula este passo se a versão do usuário for igual a versão deste processo
    if(dbUser && dbUser.version == THIS_VERSION)
      return next();

    // Seleciona a primeira ficha (TODO: Verificar a atual...)
    var fichaId = _.keys(portalUser.fichas)[0];
    var ficha = portalUser.fichas[fichaId];

    // Cria usuário
    dbUser = dbUser || new Aluno();

    // Bump Version
    dbUser.version = THIS_VERSION;

    // Atualiza campos
    dbUser.nome = portalUser.nome;
    dbUser.username = portalUser.user;

    dbUser.curso = ficha.curso;
    dbUser.grade = ficha.grade;
    dbUser.turno = ficha.turno;
    dbUser.campus = ficha.campus;
    dbUser.ingresso = ficha.ingresso;
    dbUser.coeficientes = portalUser.coeficientes;

    // Save user
    dbUser.save(next);
  };

  // Execute steps
  async.series([
    authenticate,
    findUser,
    gatterStudentInfo,
    createOrUpdateIfNeeded,
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
