var module = angular.module('MatriculaHelper', [

])

.service('Creditos', function () {
  var service = this;

  service.calcular = function (cr) {
    return Math.floor(16 + cr * 5);
  }
})


.config(['$httpProvider', function ($httpProvider) {
  $httpProvider.interceptors.push('AuthInterceptor');
}])
