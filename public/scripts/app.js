angular.module('NoKicks', ['ngMaterial'])
.config(function($mdThemingProvider) {
  $mdThemingProvider.theme('default')
    .primaryPalette('green', {
      'default': '700'
    })
    .accentPalette('red');
});
