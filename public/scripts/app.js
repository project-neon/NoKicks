angular.module('NoKicks', [
  'ngMaterial',
	'ui.router',
])

.config( function ($mdThemingProvider) {

  // Configure theme
  $mdThemingProvider.theme('default')
    .primaryPalette('green', {
      'default': '700'
    })
    .accentPalette('red');
})

.controller('LoginCtrl', function (login) {

})
