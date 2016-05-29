angular.module('NoKicks', [
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
		templateUrl: '/views/duplicate.html',
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

.controller('DashboardCtrl', function ($scope, $state, AuthService) {
  // Check if user is Logged In
  if(!AuthService.isLoggedIn()){
    console.log('Not Logged in...');
    return $state.go('login');
  }

  $scope.logout = function () {
    console.log('Loggin out...');
    AuthService.logout();
  }

  $scope.user = AuthService.getUser();

  console.log('DashboardCtrl load');
})
