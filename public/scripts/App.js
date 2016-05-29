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

.controller('DashboardCtrl', function ($scope, $state, AuthService, Creditos, Turmas) {
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
  Turmas.subscribe($scope, function (){
    $scope.cursos = Turmas.cursos;
  })
  Turmas.query();

  // Save current user
  $scope.user = AuthService.getUser();

  // Calculate Creditos
  $scope.creditos = Creditos.calcular($scope.user.coeficientes.cr);

  console.log('DashboardCtrl load');
})

// Filtra por campus
.filter('campus', function() {
  return function(items, campus) {
    var filtered = [];

    angular.forEach(items, function(item) {
      item.campus == campus && filtered.push(item);
    });

    return filtered;
  };
});
