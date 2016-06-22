angular.module('SearchBar', [
  'MatriculaHelper',
  'common.Auth',

  'ngMaterial',
  'ngAnimate',
  'ui.router',
  'ngFx'
])

  .controller('SearchBarCtrl', function ($scope, AuthService) {
    $scope.courses = [
      { name: 'Bacharelado em Ciência da Computação', value: 17 },
      { name: 'Bacharelado em Ciência e Tecnologia', value: 19 },
      { name: 'Bacharelado em Ciências Biológicas', value: 16 },
      { name: 'Bacharelado em Ciências Econômicas', value: 2 },
      { name: 'Bacharelado em Ciências e Humanidades', value: 21 },
      { name: 'Bacharelado em Filosofia', value: 10 },
      { name: 'Bacharelado em Física', value: 28 },
      { name: 'Bacharelado em Matemática', value: 22 },
      { name: 'Bacharelado em Neurociência', value: 23 },
      { name: 'Bacharelado em Planejamento Territorial', value: 11 },
      { name: 'Bacharelado em Políticas Públicas', value: 1 },
      { name: 'Bacharelado em Química', value: 12 },
      { name: 'Bacharelado em Relações Internacionais', value: 26 },
      { name: 'Engenharia Aeroespacial', value: 27 },
      { name: 'Engenharia Ambiental e Urbana', value: 6 },
      { name: 'Engenharia Biomédica', value: 18 },
      { name: 'Engenharia de Energia', value: 7 },
      { name: 'Engenharia de Gestão', value: 24 },
      { name: 'Engenharia de Informação', value: 8 },
      { name: 'Engenharia de Instrumentação, Automação e Robótica', value: 3 },
      { name: 'Engenharia de Materiais', value: 15 },
      { name: 'Engenharias', value: 20 },
      { name: 'Licenciatura em Ciências Biológicas', value: 13 },
      { name: 'Licenciatura em Filosofia', value: 5 },
      { name: 'Licenciatura em Física', value: 25 },
      { name: 'Licenciatura em Matemática', value: 9 },
      { name: 'Licenciatura em Química', value: 4 }
    ];
    $scope.selectedCourse = null;

    var actualUser = AuthService.getUser();

    // Debug User in Console
    // console.log(actualUser);

    $scope.checkBox = {};
    $scope.checkBox.campusSAN = (actualUser.campus == 'Santo André');
    $scope.checkBox.campusSBC = (actualUser.campus == 'São Bernardo');
    $scope.checkBox.turnoMAT = (actualUser.turno == 'Matutino');
    $scope.checkBox.turnoNOT = (actualUser.turno == 'Noturno');
    $scope.checkBox.tipoOBG = false;
    $scope.checkBox.tipoLIM = false;
    $scope.checkBox.tipoLIV = false;
  });
