var module = angular.module('MatriculaHelper', [

])

.service('Creditos', function () {
  var service = this;

  service.calcular = function (cr) {
    return Math.floor(16 + cr * 5);
  }
})

.service('Schedule', function ($http, $rootScope, Turmas) {
  var service = this;

  // Guarda Id's das turmas
  service.turmas = [];

  service.getTurmas = function () {
    // Retorna lista de turmas
    return service.materias.map(t => Turmas.getTurmaById(t));
  }

  // Remove turmas da lista
  service.remove = function (turmas){
    service.turmas = _.difference(service.turmas, turmas || []);
    $rootScope.$emit('Schedule:changed');
  }

  service.add = function (turmas){
    service.turmas = _.union(service.turmas, turmas || []);
    $rootScope.$emit('Schedule:changed');
  }

  service.toggle = function (turma){
    var idx = service.turmas.indexOf(turma);
    if (idx > -1)
      service.turmas.splice(idx, 1);
    else
      service.turmas.push(turma);

    $rootScope.$emit('Schedule:changed');
  }

  $rootScope.$on('Auth:unauthorized', function (){
    //
  })
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

  // Encontra turma por id (Indexado)
  service.getTurmaById = function (id) {
    if(id in _turmasIndexed)
      return service.turmas[_turmasIndexed[id]];

    return null;
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
  var _batchSize = 0;
  var _data = null;
  var _length = 0;
  service.loadInBatch = function (batchSize) {
    if(batchSize){
      // Clear timeout
      if(_batchTimeout)
        $timeout.cancel(_batchTimeout);

      _batchSize = batchSize;

      // Load data once
      $http.get('/api/turmas', {
        params: {
          $limit: 2000,
          $sort: 'turno'
        }
      })
      .then(function (response) {
        if(response.status >= 400)
          return next && next('Não pode carregar dados', response.data);

        _data = response.data.models;
        _length = _data.length;

        processLoadedBatch();
      })
    }
  }

  function processLoadedBatch() {
    // Stop timeout if needed
    if(_batchTimeout)
      $timeout.cancel(_batchTimeout)

    // Cut data
    var newData = _data.splice(0, _batchSize);

    // Update progress
    service.progress = 1.0 - (_data.length * 1.0 / _length);
    service.loaded = service.progress >= 1.0;
    console.log(_data.length, service.progress, service.loaded);

    // Update store
    service.updateTurmas(newData);

    // Stop calling if ended data
    if(_data.length <= 0)
      return;

    _batchTimeout = $timeout(function (){
      processLoadedBatch();
    }, 600);
  }

})
