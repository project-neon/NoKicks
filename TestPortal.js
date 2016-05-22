var Portal = require('./helpers/PortalAluno');

// A file with object like: {user: <user>, pass: <pass>}
var user = require('./test/user.json');

Portal.authenticate(user, function (err, user){

  console.log('\nFim.')
  console.log('Error: ', err)

  if(user){
    console.log('LOGOU: '+user.user);
  }else{
    console.log('OPS... ');
  }

});
