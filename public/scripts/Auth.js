var module = angular.module('common.Auth', [

])

.provider('auth', function (){
  var interceptors = [];
  return{
    interceptors: interceptors,

    $get: function (){
      var auth = {};

      auth.user = null;

      auth.logout = function (){
        // Erase cache
        auth.user = null;

        // Notify logout
        auth._notify('logout');
      };

      auth.login = function (credentials){
        $http.post('/api/auth/login', credentials).then(function (err, res){
          console.log(err, res);
        });
      };

      // Call actions on all intercaptors
      auth._notify = function (action){
        for(interceptor in interceptors)
          interceptor[action] && interceptor[action]();
      }

      return auth;
    }
  }
})

.factory('authInterceptor', ['auth', function (auth) {
  return {
    request: function (config) {
      // config.headers = config.headers || {};

      // if (auth.getAuthKey()) {
      //   config.headers.Authorization = 'Bearer ' + auth.getAuthKey();
      // }

      return config;
    },

    response: function (response) {
      if (response.status === 401) {
        auth.logout();
      }
      return response || $q.when(response);
    }
  };
}])

.config(['$httpProvider', function ($httpProvider) {
  $httpProvider.interceptors.push('authInterceptor');
}]);
