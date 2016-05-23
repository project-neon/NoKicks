var env = process.env;
var port = process.env.PORT || 8000;
var domain = 'http://nokick.herokuapp.com.br';

module.exports = {
	port: port,
	domain: domain,

	session: {
		secret: 'somesecretstring',
	},

	db: env.MONGODB_URI,

};
