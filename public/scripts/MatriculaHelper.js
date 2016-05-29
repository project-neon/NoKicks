var module = angular.module('MatriculaHelper', [

])

.service('Creditos', function () {
  var service = this;

  service.calcular = function (cr) {
    return Math.floor(16 + cr * 5);
  }
})

.service('Turmas', function ($http) {
  var service = this;
  var _indexByKey = '_id';
  var _turmasIndexed = {};

  service._turmasIndexed = _turmasIndexed;
  service.turmas = [];
  service.cursos = {};

  // Adiciona novas turmas ao array
  service.updateTurmas = function (turmas) {
    turmas.forEach( function (turma) {
      // Skip if already inserted
      if(turma[_indexByKey] in _turmasIndexed)
        return;

      // Insert if not inserted yet
      service.turmas.push(turma);

      // Index this element
      _turmasIndexed[turma[_indexByKey]] = service.turmas.length - 1;
    });

    // Aplica busca novamente
    service.applySearch();
  }

  // Aplica filtros na busca local (cache)
  service.applySearch = function (params) {
    // Limpa cursos
    for(var k in service.cursos)
      delete service.cursos[k];

    // Agrupa por curso
    var cursos = _.groupBy(service.turmas, 'codigo');

    // 

    console.log(cursos);
  }

  // Encontra turmas no banco de dados que batem com a query.
  // Atualiza array e adiciona novos elementos
  service.query = function (params) {
    $http
      .get('/api/turmas', {
        params: {
          $limit: 2000,
        }
      })
      .then(function (response) {
        if(response.status >= 400)
          return console.error('Não pode carregar dados', response.data);

        // Update list
        service.updateTurmas(response.data.models);
      })
  }

})

.config(['$httpProvider', function ($httpProvider) {
  $httpProvider.interceptors.push('AuthInterceptor');
}])
