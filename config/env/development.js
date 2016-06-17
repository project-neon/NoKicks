var env = process.env;
var port = process.env.PORT || 3000;
var domain = 'http://localhost:'+port;

module.exports = {
	port: port,
	domain: domain,

	session: {
		secret: 'somesecretstring',
	},

  vagasCacheAge: 10 * 1000,
  turmasCacheAge: 20 * 1000,

	db: env.MONGODB_URL || 'mongodb://localhost:27017/test',

};
