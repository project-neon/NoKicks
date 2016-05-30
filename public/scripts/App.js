angular.module('NoKicks', [
  'MatriculaHelper',
  'SearchBar',
  'common.Auth',

  'ngMaterial',
  'ngAnimate',
	'ui.router',
  'ngFx',
])

// Configure theme
.config( function ($mdThemingProvider) {

  $mdThemingProvider.theme('default')
    .primaryPalette('green', {
      'default': '700'
    })
    .accentPalette('red');
})

.config( function ($stateProvider, $urlRouterProvider) {

  // Setup routes
  $stateProvider
	.state('login', {
		url: '/login',
		templateUrl: '/views/login.html',
		controller: 'LoginCtrl',
	})

	.state('dashboard', {
		url: '/dashboard',
		templateUrl: '/views/dashboard.html',
    controller: 'DashboardCtrl',
	});


	$urlRouterProvider.otherwise('/login');
})


.controller('MainCtrl', function ($rootScope, $state, AuthService) {

  // Link unauthorized error to logout action
  $rootScope.$on('Auth:unauthorized', function () {
    AuthService.logout();
    $state.go('login');
  });

  $rootScope.$on('Auth:authorized', function () {
    $state.go('dashboard');
  })

  // Link logout action to login screen
  $rootScope.$on('Auth:logout', function () {
    $state.go('login');
  });
})


.controller('LoginCtrl', function ($scope, $timeout, $state, AuthService) {

  // Check if user is Logged In
  if(AuthService.isLoggedIn()){
    return $state.go('dashboard');
  }

  // Try to verify session
  AuthService.verifySession();

  $scope.lock = false;
  $scope.errorMessage = null;

  $scope.loginForm = {
    user: null,
    pass: null,
  };

  $scope.logout = function () {
    AuthService.logout();
  }

  $scope.login = function doLogin() {
    // Skip if already locked
    if($scope.lock)
      return;

    // Clear message and enter lock mode
    $scope.errorMessage = null;
    $scope.lock = !$scope.lock;

    AuthService.login($scope.loginForm, function (err){
      $scope.lock = false;

      if(err)
        $scope.errorMessage = err;
    });
  };

})

.controller('DashboardCtrl', function ($scope, $state, $timeout, AuthService, Turmas) {
  // Check if user is Logged In
  if(!AuthService.isLoggedIn()){
    console.log('Not Logged in...');
    return $state.go('login');
  }

  $scope.logout = function () {
    console.log('Loggin out...');
    AuthService.logout();
  }

  // Give access to Turmas Api
  $scope.cursos = null;
  $scope.progress = 0;
  $scope.loaded = false;
  Turmas.subscribe($scope, function (){
    $scope.cursos = Turmas.cursos;
    $scope.progress = Math.round(Turmas.progress * 100);
    $scope.loaded = Turmas.loaded;
  })

  $timeout(function () {
    Turmas.loadInBatch(50);
  }, 2000)

  // Save current user
  $scope.user = AuthService.getUser();

  // Get css classes needed for this day of the week
  $scope.diaAulaClass = function (day) {
    return day ? (day.equal ? 'equal' : '') : 'empty';
  }

})

.controller('TurmasCtrl', function ($scope, Schedule, Turmas) {

  $scope.selectedTurmas = null;

  // Index turmas by id to use in checkbox
  function updateSelectedTurmas() {
    var indexed = {};
    for(var k in Schedule.turmas){
      indexed[Schedule.turmas[k]] = true;
    }
    $scope.selectedTurmas = indexed;
  }

  Schedule.subscribe($scope, function (){
    updateSelectedTurmas();
  });

  // Remove/Add turma from list
  $scope.toggleTurma = function (turmaId) {
    Schedule.toggle(turmaId)
  }
})

.controller('ScheduleCtrl', function ($scope, Schedule) {

  var colors = [
    '233, 30, 99',
    '244, 67, 54',
    '156, 39, 176',
    '103, 58, 183',
    '233, 30, 99',
    '244, 67, 54',
    '156, 39, 176',
    '103, 58, 183',
  ];

  // Guarda o schedule processado
  //
  // Formato:
  // {
  //   q1_1: [
  //       {inicio: x, duracao: y, nome: z, cor: a},
  //       {<turma>}
  //   ],
  //   q1_2: [...]
  //   ...
  //   q2_6: [...]
  // }
  $scope.schedule = null;

  // Atualiza objeto de schedule, setando cores e deixando
  // no formato de processamento da view
  function updateSchedule(turmas){

    var schedule = {};
    var _included = 0;

    // Generate names and initialize data
    for(var k = 1; k <= 6; k++){
      schedule['q1_'+k] = [];
      schedule['q2_'+k] = [];
    }

    // Add turmas to schedule
    _.forEach(turmas, includeTurma);

    // Save to store
    $scope.schedule = schedule;

    console.log(schedule);

    // Map each class and
    function includeTurma(turma){
      _.forEach(turma.horarios, function (horario){
        // Parse inicio e final
        var inicio = timeToNumber(horario.inicio);
        var duracao = timeToNumber(horario.final) - inicio;

        var parsed = {
          inicio: inicio,
          duracao: duracao,
          nome: turma.codigo.split('-')[0],
          cor: colors[_included],
        };

        // Processa estilo
        parsed.style = styleForHorario(parsed);

        if(horario.semanaI)
          schedule['q1_'+horario.dia].push(parsed);
        if(horario.semanaII)
          schedule['q2_'+horario.dia].push(parsed);
      })
      _included++;
    }

    function timeToNumber(time){
      if(!time)
        return 0;

      var t = time.split(':');
      return t[0] * 1 + t[1] * 1 / 100;
    }

    function styleForHorario(horario){
      var h = 14;
      var s = 8; //  Hora de inicio
      var style = {
        'top': ((horario.inicio - s) * h) + 'px',
        'height': (horario.duracao * h) + 'px',
        'border-top-color': 'rgb(' + (horario.cor) + ')',
        'background-color': 'rgba(' + (horario.cor) + ', 0.7)',
      };
      return style;

    }
  }

  // Atualiza Schedule
  Schedule.subscribe($scope, function (){
    updateSchedule(Schedule.getTurmas());
  });
})

.controller('CreditosCtrl', function ($scope, AuthService, Creditos, Schedule) {
  var user = AuthService.getUser();

  if(!user)
    return;

  // Calculate Creditos máximo
  $scope.creditos = Creditos.calcular(user.coeficientes.cr);
  $scope.usedCreditos = 0;

  Schedule.subscribe($scope, function (){
    var creditos = _.pluck(Schedule.getTurmas(), 'creditos');
    $scope.usedCreditos = _.reduce(creditos, function(m, n){ return m + n; }, 0);
  });
})
