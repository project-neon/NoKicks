var module = angular.module('MatriculaHelper', [

])

.service('Creditos', function () {
  var service = this;

  service.calcular = function (cr) {
    return Math.floor(16 + cr * 5);
  }
})

.service('Turmas', function ($http, $rootScope, $timeout) {
  var service = this;
  var _indexByKey = '_id';
  var _turmasIndexed = {};

  service._turmasIndexed = _turmasIndexed;
  service.turmas = [];
  service.filtered = {};
  service.loaded = false;
  service.progress = 0;

  // Subscribe for changes
  service.subscribe = function (scope, callback){
    var handler = $rootScope.$on('Turmas:update', callback);
    scope.$on('$destroy', handler);
  }

  // Publish change notification
  service.notify = function () {
    $rootScope.$emit('Turmas:update');
  }

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
    // Salva tempo de inicio
    var startTime = Date.now();

    // Aplica filtros default
    params = params || {
      curso: 19,
    };

    // Filtra turmas
    var turmas = _.filter(service.turmas, needsSelection);

    // Agrupa por curso
    var cursosCodigo = _.groupBy(service.turmas, 'codigo');

    // Agrupa por obrigatoriedade
    var cursos = {
      obrigatoria: {},
      limitada: {},
      livre: {},
    };

    for(var id in cursosCodigo){
      var curso = cursosCodigo[id][0];
      cursos[obrigatoriedade(curso)][id] = cursosCodigo[id];
    }

    console.log(cursos);

    service.cursos = cursos;

    // Função que seleciona turmas baseada na euristica escolhida
    function needsSelection(turma) {
      // TODO: Filter turma por Turno|Campus|...
      return true;
    }

    // Retorna tipo de obrigatoriedade dado a turma (e curso via params)
    function obrigatoriedade(turma) {
      return turma.obrigatoriedade[params.curso] || 'livre';
    }

    // Calcula tempo levado
    var took = Date.now() - startTime;
    console.log('applySearch took', took + 'ms');

    // Publish notification
    service.notify();
  }

  // Encontra turmas no banco de dados que batem com a query.
  // Atualiza array e adiciona novos elementos
  service.query = function (params, next) {
    $http
      .get('/api/turmas', {
        params: params || {
          $limit: 2000,
          $sort: 'turno'
        }
      })
      .then(function (response) {
        if(response.status >= 400)
          return next && next('Não pode carregar dados', response.data);

        // Update progress
        service.progress = response.data.page / response.data.pages;
        service.loaded = service.progress >= 1.0;

        // Update list
        service.updateTurmas(response.data.models);

        next && next();
      })
  }

  // Carrega dados em batches
  var _batchTimeout = null;
  var _page = 1;
  var _batchSize = 0;
  service.loadInBatch = function (batchSize) {

    // Reset Batch process
    if(batchSize){
      // Reset Timeout
      _batchTimeout && _batchTimeout();
      _batchTimeout = null;
      _page = 1;
      _batchSize = batchSize;
    }else{
      _page++;
    }

    service.query({
      $limit: _batchSize,
      $sort: 'turno',
      $page: _page,
    }, function (err) {
      if(err)
        return console.error(err);
      console.log(service.progress, service.loaded);
      if(!service.loaded)
        $timeout(function (){
          service.loadInBatch();
        }, 500);
    })
  }

})

.config(['$httpProvider', function ($httpProvider) {
  $httpProvider.interceptors.push('AuthInterceptor');
}])
