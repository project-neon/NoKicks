var Portal = require('./helpers/PortalAluno')
var Matriculas = require('./helpers/Matriculas')

// A file with object like: {user: <user>, pass: <pass>}
var user = require('./test/user.json')

Portal.authenticate(user, function (err, user) {
  console.log('\nFim.')
  console.log('Error: ', err)

  if (user) {
    console.log('LOGOU: ' + user.user)

    Portal.gatterStudentInfo(user, (err, user) => {
      console.log('Finished gatterStudentInfo')

      if (err)
        return console.log(err)

      console.log(user)
    })
  } else {
    console.log('OPS... ')
  }
})

Matriculas.loadMaterias((err, materias) => {
  if (err)
    return console.log(err)

  console.log(materias[10])
})
