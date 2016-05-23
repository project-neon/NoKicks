var Authentication = app.helpers.Authentication;
var Aluno = app.models.Aluno;

exports.login = function (req, res) {

  // Verifies if action is to login,
  // or just return logged user
  var user = req.body.user;
  var pass = req.body.pass;

  if(user && pass){
    // Logout
    Authentication.logout(req);

    // Authenticate
    Authentication.authenticate({
      user: user,
      pass: pass,
    }, (err, aluno) => {
      if(err)
        return res.status(401).send(err);

      // Login aluno
      Authentication.login(req, aluno);

      finishRender();
    })
  }else{
    finishRender();
  }

  function finishRender () {
    if(Authentication.isLogged(req))
      res.send(Authentication.loggedUser(req));
    else
      res.status(401).send('Usuário não logado');
  }

}

exports.logout = function (req, res) {



}
