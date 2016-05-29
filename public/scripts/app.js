angular.module('NoKicks', [
  'common.Auth',

  'ngMaterial',
	'ui.router',
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
	})

	$urlRouterProvider.otherwise('/login');
})

.controller('LoginCtrl', function ($state, auth) {
  console.log('LoginCtrl load');
  console.log(auth);

  $state.login = function doLogin() {
    console.log('Logging in...');
  };

})

.controller('DashboardCtrl', function () {
  console.log('DashboardCtrl load');
})
