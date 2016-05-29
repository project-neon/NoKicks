var module = angular.module('common.Auth', [

])


.service('AuthService', function ($rootScope, $http) {
  var service = this;
  service._user = null;

  service.setUser = function (user){
    console.log('Set User:', user);
    service._user = user;
    return service.getUser();
  }

  service.getUser = function () {
    return service._user;
  }

  service.logout = function () {

    $http
      .post('/api/auth/logout')
      .then(function (response){
        service.setUser(null);
        $rootScope.$broadcast('Auth:logout');
      })

  }

  service.isLoggedIn = function () {
    return !!service.getUser();
  }

  service.verifySession = function (next) {
    service.login(null, next);
  }

  service.login = function (user, next) {
    // Set defaults
    user = user || {};

    $http
      .post('/api/auth/login', user)
      .then(function (response){
        // Verify success in login in
        if(response.status >= 400)
          return next && next(response.data || 'Error');

        // Set current user
        service.setUser(response.data);

        // Broadcast success
        $rootScope.$broadcast('Auth:authorized');

        next && next(null);
      });
  }

})


.service('AuthInterceptor', function ($rootScope) {
  var service = this;

  service.request = function (config) {
    return config;
  }

  service.responseError = function (response) {
    if(response.status == 401){
      $rootScope.$broadcast('Auth:unauthorized');
    }

    return response;
  }
})


.config(['$httpProvider', function ($httpProvider) {
  $httpProvider.interceptors.push('AuthInterceptor');
}])
