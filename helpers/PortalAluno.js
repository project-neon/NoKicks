'use strict'

var request = require('request');

var portal = module.exports = {};

// Portal do Aluno Configurations
portal.URL = {
  BASE: 'https://aluno.ufabc.edu.br',

  // Página de Login
  LOGIN: '/login',

  // URL para post de login
  ENTRAR: '/entrar',
};

//
// Verifies if an user exists and can be logged in
//
portal.authenticate = function (options, next) {
  var jar = request.jar();

  request.post({

    followAllRedirects: true,
    url: portal.URL.BASE + portal.URL.ENTRAR,
    jar: jar,
    form: {
      login: options.user,
      senha: options.pass,
      commit: 'Entrar',
    },

  }, function (err, res, body){

    if(err)
      return next(err);

    // Checks if it redirected to login
    if(res.request.path == portal.URL.LOGIN){
      return next(null, null);
    }

    return next(null, {
      _jar: jar,
      user: options.user,
    });

  });
}


//
// Loads user data (CR, CP, Course Name, Period)
//
