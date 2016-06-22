angular.module('NoKicks', [
  'MatriculaHelper',
  'SearchBar',
  'common.Auth',

  'ngMaterial',
  'ngAnimate',
  'ui.router',
  'ngFx'
])

  // Configure theme
  .config(function ($mdThemingProvider) {

    $mdThemingProvider.theme('default')
      .primaryPalette('green', {
        'default': '700'
      })
      .accentPalette('red');
  })

  .config(function ($stateProvider, $urlRouterProvider) {

    // Setup routes
    $stateProvider
      .state('login', {
        url: '/login',
        templateUrl: '/views/login.html',
        controller: 'LoginCtrl'
      })

      .state('dashboard', {
        url: '/dashboard',
        templateUrl: '/views/dashboard.html',
        controller: 'DashboardCtrl'
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
    });

    // Link logout action to login screen
    $rootScope.$on('Auth:logout', function () {
      $state.go('login');
    });
  })


  .controller('LoginCtrl', function ($scope, $timeout, $state, AuthService) {

    // Check if user is Logged In
    if (AuthService.isLoggedIn()) {
      return $state.go('dashboard');
    }

    // Try to verify session
    AuthService.verifySession();

    $scope.lock = false;
    $scope.loginRand = Math.random();
    $scope.errorMessage = null;

    $scope.loginForm = {
      user: null,
      pass: null
    };

    $scope.logout = function () {
      AuthService.logout();
    };

    $scope.login = function doLogin() {
      // Skip if already locked
      if ($scope.lock)
        return;

      // Clear message and enter lock mode
      $scope.errorMessage = null;
      $scope.lock = !$scope.lock;

      AuthService.login($scope.loginForm, function (err) {
        $scope.lock = false;

        if (err)
          $scope.errorMessage = err;

        $scope.loginRand = Math.random();
      });
    };

  })

  .controller('DashboardCtrl', function ($scope, $state, $timeout, AuthService,
    Turmas, RankingLooker, Schedule, $mdDialog) {

    // Check if user is Logged In
    if (!AuthService.isLoggedIn()) {
      console.log('Not Logged in...');
      return $state.go('login');
    }

    $scope.logout = function () {
      console.log('Loggin out...');
      AuthService.logout();
    };

    $scope.salvar = function () {
      // TODO: Verificar corretamente se pode salvar (evitar erros no servidor)

      Schedule.save(function () {

        $mdDialog.show({
          templateUrl: 'views/modal-thankyou.html',
          parent: angular.element(document.body),
          clickOutsideToClose: true,
          controller: function DialogController($scope, $mdDialog) {
            $scope.cancel = function () { $mdDialog.cancel(); };
          }
        });

        // $mdDialog.show(
        //   $mdDialog.alert()
        //     .parent(angular.element(document.querySelector('#popupContainer')))
        //     .clickOutsideToClose(true)
        //     .title('That`s it.')
        //     .textContent(
        //       'Este foi um demo, que surgiu de uma vontade própria de '
        //       + 'alguns nerds de mostrar um sistema de matrículas coerente com '
        //       + 'uma universidade do Séc XXI. Se gostou ou não, queremos saber!\n\n'
        //       + 'Acesse este link para dar um feedback maroto ;)')
        //     .ariaLabel('That`s it')
        //     .ok('Got it!')
        // );
      });
    };

    // Give access to Turmas Api
    $scope.cursos = null;
    $scope.vagas = null;
    $scope.progress = 0;
    $scope.loaded = false;
    Turmas.subscribe($scope, function () {
      $scope.cursos = Turmas.cursos;
      $scope.vagas = Turmas.vagasById;
      $scope.progress = Math.round(Turmas.progress * 100);
      $scope.loaded = Turmas.loaded;
    });

    $scope.rankings = null;
    RankingLooker.subscribe($scope, function () {
      $scope.rankings = RankingLooker.rankings;
    });

    $timeout(function () {
      Schedule.load();
      Turmas.loadInBatch(50);
      Turmas.loadVagas();

      $mdDialog.show({
        templateUrl: 'views/modal-tutorial.html',
        parent: angular.element(document.body),
        clickOutsideToClose: true,
        controller: function DialogController($scope, $mdDialog) {
          $scope.cancel = function () { $mdDialog.cancel(); };
        }
      });
    }, 2000);

    // Save current user
    $scope.user = AuthService.getUser();

    // Get css classes needed for this day of the week
    $scope.diaAulaClass = function (day) {
      return day ? (day.equal ? 'equal' : '') : 'empty';
    };

  })

  .controller('TurmasCtrl', function ($scope, Schedule, Turmas) {

    $scope.selectedTurmas = null;

    // Index turmas by id to use in checkbox
    function updateSelectedTurmas() {
      var indexed = {};
      for (var k in Schedule.turmas) {
        indexed[Schedule.turmas[k]] = true;
      }
      $scope.selectedTurmas = indexed;
    }

    Schedule.subscribe($scope, function () {
      updateSelectedTurmas();
    });

    // Remove/Add turma from list
    $scope.toggleTurma = function (turmaId) {
      // Only add if less then 10 matérias
      // if(Turmas.turmas.length < 10)
      Schedule.toggle(turmaId);
    };
  })

  .controller('ScheduleCtrl', function ($scope, Schedule, Turmas) {

    var colors = [
      '33, 150, 243', // Blue
      '244, 67, 54', // Red
      '156, 39, 176', // Purble
      '41, 98, 139', // Dark Blue
      '72, 135, 58', // Dark Green
      '255, 193, 7', // Amber
      '255, 61, 0', // Deep Orange
      '121, 85, 72', // Brown
      '96, 125, 139' // Grey
    ];

    $scope.diasSemana = {
      1: 'Segunda',
      2: 'Terça',
      3: 'Quarta',
      4: 'Quinta',
      5: 'Sexta',
      6: 'Sábado'
    };

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
    function updateSchedule(turmas) {
      console.log('Updating schedule.');

      var schedule = {};
      var _included = 0;
      var _conflictTable = {};

      // Generate names and initialize data
      for (var k = 1; k <= 6; k++) {
        schedule['q1_' + k] = [];
        schedule['q2_' + k] = [];
      }

      // Add turmas to schedule
      _.forEach(turmas, includeTurma);

      // Save to store
      $scope.schedule = schedule;

      // Adiciona horarios da turma ao calendário
      function includeTurma(turma) {

        var inConflict = {};

        _.forEach(turma.horarios, function (horario) {
          // Parse inicio e final
          var inicio = timeToNumber(horario.inicio);
          var duracao = timeToNumber(horario.final) - inicio;

          var parsed = {
            inicio: inicio,
            duracao: duracao,
            nome: turma.turma + '-' + turma.codigo.split('-')[0],
            nomeSimples: turma.codigoNome,
            nomeCompleto: turma.nome,
            cor: colors[_included % colors.length],
            id: turma.id
          };

          // Processa estilo
          parsed.style = styleForHorario(parsed);

          // Verifies conflicts
          var conflitos = [];
          // var conflitoQ2 = [];

          for (var k = inicio; k < inicio + duracao; k += 0.5) {
            var _id = horario.dia + '.' + k;

            // Verifica conflito na semana I
            if (horario.semanaI && 'q1' + _id in _conflictTable) {
              var conflict = _conflictTable['q1' + _id];

              if (conflitos.indexOf(conflict.id) < 0) {
                createConflict(conflict, parsed);
                conflitos.push(conflict.id);
              }
            }

            // Verifica conflito na semana II
            if (horario.semanaII && 'q2' + _id in _conflictTable) {
              conflict = _conflictTable['q2' + _id];

              if (conflitos.indexOf(conflict.id) < 0) {
                createConflict(conflict, parsed);
                conflitos.push(conflict.id);
              }
              // if(!conflitoQ1)
              // createConflict(conflitoQ2, parsed);
            }

            // Para de verificar próximos conflitos se já existe algum
            // if(conflitoQ1 || conflitoQ2)
            // break;
          }

          // Preenche horários apenas se não está em conflito
          if (conflitos.length > 0)
            return;

          if (horario.semanaI)
            for (var k = inicio; k < inicio + duracao; k += 0.5)
              _conflictTable['q1' + horario.dia + '.' + k] = parsed;

          if (horario.semanaII)
            for (var k = inicio; k < inicio + duracao; k += 0.5)
              _conflictTable['q2' + horario.dia + '.' + k] = parsed;

          // Adiciona horário somente se não houver conflito
          if (horario.semanaI)
            schedule['q1_' + horario.dia].push(parsed);

          if (horario.semanaII)
            schedule['q2_' + horario.dia].push(parsed);
        });

        // Incrementa contador para alterar a cor da próxima vez
        _included++;
      }

      // Cria conflito alterando cor, e dando merge nas informações de t2 em t1
      function createConflict(t1, t2) {
        console.log('Conflito: ', t1.nome, t2.nome);
        // Inicio: Menor das duas; final: Maior das duas
        var inicio = Math.min(t1.inicio, t2.inicio);
        var final = Math.max(t1.inicio + t1.duracao, t2.inicio + t2.duracao);
        // duracao: Maximo menos inicio
        var duracao = final - inicio;

        // Necessita mudar ID para que o Angular identifique a mudança
        t1.id = t1.id + ':' + t2.id;
        t1.cor = '255, 0, 0'; // RED
        t1.nome = t1.nome + ' ' + t2.nome;
        t1.inicio = inicio;
        t1.duracao = duracao;

        // Aplica estilos novamente
        t1.style = styleForHorario(t1);
        t1.nomeCompleto = t1.nomeSimples + ' + ' + t2.nomeSimples;
      }

      function timeToNumber(time) {
        if (!time)
          return 0;

        var t = time.split(':');
        return t[0] * 1 + t[1] * 1 / 100;
      }

      function styleForHorario(horario) {
        var h = 14;
        var s = 8; //  Hora de inicio
        var style = {
          'top': ((horario.inicio - s) * h) + 'px',
          'height': (horario.duracao * h) + 'px',
          'border-top-color': 'rgb(' + (horario.cor) + ')',
          'background-color': 'rgba(' + (horario.cor) + ', 0.8)'
        };
        return style;

      }
    }

    // Atualiza Schedule
    Schedule.subscribe($scope, function () {
      updateSchedule(Schedule.getTurmas());
    });

    // Atualiza Schedule
    Turmas.subscribe($scope, function () {
      updateSchedule(Schedule.getTurmas());
    });
  })

  .controller('CreditosCtrl', function ($scope, AuthService, Creditos, Schedule) {
    var user = AuthService.getUser();

    if (!user)
      return;

    // Calculate Creditos máximo
    $scope.creditos = Creditos.calcular(user.coeficientes.cr);
    $scope.usedCreditos = 0;

    Schedule.subscribe($scope, function () {
      var creditos = _.pluck(Schedule.getTurmas(), 'creditos');
      $scope.usedCreditos = _.reduce(creditos, function (m, n) { return m + n; }, 0);
    });
  });
