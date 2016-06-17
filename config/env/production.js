var env = process.env;
var port = process.env.PORT || 8000;
var domain = 'http://nokick.herokuapp.com.br';

module.exports = {
	port: port,
	domain: domain,

	session: {
		secret: 'somesecretstring',
	},

  vagasCacheAge: 10 * 1000,
  turmasCacheAge: 120 * 1000,

	db: env.MONGODB_URI,

};
