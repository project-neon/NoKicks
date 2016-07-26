var express = require('express');

function config(app, next){
	var server = app.server;
  console.log('Configuring api routes');

	/*
	 * Create new App
	 */
	var api = app.api = express();

	/*
	 * Base route
	 */
	server.use('/api/', api);

	// Used to ping Server
	api.get('/ping', app.controllers.Api.ping);

	function restify(ctrl){
		var controller = app.controllers[ctrl];
		var path = '/'+ctrl.toLowerCase();

		if(app.config.env != 'production'){
			api.get(path+'/create', controller.create);
			api.get(path+'/:id/update', controller.update);
			api.get(path+'/:id/delete', controller.delete);
		}

		api.get(path, controller.find);
		api.post(path, controller.create);

		api.post(path+'/:id', controller.update);
		api.delete(path+'/:id', controller.delete);
		api.get(path+'/:id', controller.get);
	}

  /*
   * Matriculas
   */
  api.post('/matriculas/ingressar', app.controllers.Matriculas.ingressar);
  api.post('/matriculas/simular', app.controllers.Matriculas.simular);
  api.get('/matriculas/registros', app.controllers.Matriculas.registros);
  api.get('/matriculas/vagas', app.controllers.Matriculas.vagas);

  // api.get('/matriculas/erase', app.controllers.Matriculas.erase);
  // api.get('/matriculas/importar', app.controllers.Matriculas.importar);

  /*
   * Turmas
   */
  api.get('/turmas/cached', app.controllers.Turmas.cached);

  api.get('/turmas/importar', app.controllers.Turmas.importar);

  /*
   * Authentication
   */
  api.get('/auth/login', app.controllers.Auth.login);
  api.post('/auth/login', app.controllers.Auth.login);
  api.post('/auth/logout', app.controllers.Auth.logout);
  api.get('/auth/captcha', app.controllers.Auth.captcha);

	/*
	 * REST
	 */
  // restify('Matriculas');
	// restify('Turmas');
	// restify('Alunos');


	next();
}

module.exports = config;
