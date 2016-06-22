'use strict'

var request = require('request');
var cheerio = require('cheerio');
var async = require('async');
var _ = require('lodash');

var portal = module.exports = {};

// Portal do Aluno Configurations
portal.URL = {
  BASE: 'https://aluno.ufabc.edu.br',

  // Página de Login
  LOGIN: '/login',

  // URL para post de login
  ENTRAR: '/entrar',

  // Visão geral das Fichas
  FICHAS: '/fichas_individuais',

  // Visão de ficha especifica
  FICHA: '/ficha_individual',
};

//
// Verifies if an user exists and can be logged in
//
portal.authenticate = function (options, next) {
  var jar = request.jar();

  request.post({

    followAllRedirects: true,
    url: portal.URL.BASE + portal.URL.ENTRAR,
    jar: jar,
    form: {
      login: options.user,
      senha: options.pass,

      authenticity_token: 'bbbBRpShhGdnBzCQ6GJmeTxe6S/6XEJD1ECTQ1RxqTs=',
      recaptcha_response_field: options.captchaValue,
      recaptcha_challenge_field: options.captchaChallenge,
      commit: 'Entrar',
    },

  }, function (err, res, body){

    if(err)
      return next(err);

    // Checks if it redirected to login
    if(res.request.path == portal.URL.LOGIN){
      return next('Usuário ou senha incorretos');
    }

    if(res.body.indexOf('but something went wrong (500)') >= 0){
      console.log(res.body)
      return next('Captcha inválido');
    }

    return next(null, {
      _jar: jar,
      user: options.user,
    });

  });
}


//
// Loads user data (CR, CP, Course Name, Period, )
//
// Requires an objetct (student) with:
// _jar: jar to be used as cookies in requests
//
portal.gatterStudentInfo = function (student, next){


  if(!student._jar)
    return next('Invalid student. Must provide a session object [_jar]');

  let loadFichas = (next) => {

    request.get({
      url: portal.URL.BASE + portal.URL.FICHAS,
      jar: student._jar
    }, (err, res, body) => {
      if(err)
        return next(err);

      if(res.statusCode != 200)
        return next('Page could not be loaded: ' + res.request.path);

      // Request is ok. Let's parse the data
      var fichas = portal.parse.fichas(res.body);

      // Verify if parse succeeded
      if(fichas === null)
        return next('Could not parse fichas');

      // Save to student
      student.fichas = fichas;
      next();
    })
  };

  let loadCoeficientes = (next) => {
    // Find out witch ficha to use
    var id = null;
    for(var k in student.fichas){
      id = k;
      break;
    }

    portal.gatterStudentCoeficientes(student, id, next);
  };

  // Execute steps
  async.series([
    // loginStudent,
    loadFichas,
    loadCoeficientes,
  ], (err) => {
    if(err)
      return next(err);

    return next(null, student);
  });
}



//
// Gatter coeficientes from a ficha id
// (CR, CA and CP)
//
portal.gatterStudentCoeficientes = (user, id, next) => {
  if(!user._jar)
    return next('User is not set or not logged in');

  request.get({
    url: portal.URL.BASE + portal.URL.FICHA + '/' + id + '/ficha',
    jar: user._jar,
  }, (err, res, body) => {

    if(err)
      return next(err);

    if(res.statusCode != 200)
      return next('Failed. Code: '+res.statusCode);

    var parsed = portal.parse.ficha(body);

    if(!parsed)
      return next('Failed to load coeficientes');

    user.coeficientes = parsed.coeficientes;
    user.nome = parsed.nome;

    return next(null, user);
  });
};


//
// Gets a captcha Image
//
const CAPTCHA_BASE_URL = 'http://www.google.com/recaptcha/api/'
const CAPTCHA_TOKEN = 'noscript?k=6LcwNCMTAAAAAMOrD6L-BgI4MWNRL6ObAqqAKv7R';
portal.getCaptchaImageURL = function (next) {

  const REGEX_TOKEN = /(id="recaptcha_challenge_field".value=")(.*)(")/g;
  const REGEX_IMG = /(src=")(image\?.*)(")/g;

  request.get(CAPTCHA_BASE_URL + CAPTCHA_TOKEN, (err, res) => {
    if(err)
      return next(err);

    var imageToken = REGEX_TOKEN.exec(res.body)[2]
    var imageURL = REGEX_IMG.exec(res.body)[2]

    return next && next(null, {
      token: imageToken,
      url: CAPTCHA_BASE_URL + imageURL
    })
  })
}


//
// Find out the token to the manual answer
//
portal.getCaptchaAuthenticity = function (token, answer, next) {
  const REGEX_AUTHENTICITY = /(<textarea.*?>)(.*?)(<\/)/g;
  console.log();
  console.log(token, answer);
  console.log();
  request.post({
    url: CAPTCHA_BASE_URL + CAPTCHA_TOKEN,
    form: {
      recaptcha_challenge_field: token,
      recaptcha_response_field: answer,
      submit: 'I&#39;m a human',
    }
  }, (err, res) => {
    if(err)
      return next('Could not resolve captcha');

    var authenticity = REGEX_AUTHENTICITY.exec(res.body);

    if(!authenticity)
      return res.send('Captcha inválido?')

    return next && next(null, authenticity[2]);
  })
}


//
// Parsers
//
portal.parse = {};


//
// Helper to clear out text
//
portal.parse.text = (t) => {
  t = t || '';
  t = t.replace('\n', '').replace('\\n', '').trim();
  return t;
};


//
// Parse Fichas
//
// Returns an array of data containing all courses that the student belongs
// In the form:
// [{
//    curso: 'Bacharelado em Ciência e Tecnologia',
//    grade: 2009,
//    turno: 'Noturno',
//    campus: 'Santo André',
//    ingresso: '2º Quadrimestre de 2014',
//    situacao: 'Aluno Regular'
// }]
//
portal.parse.fichas = (res) => {

  if(!res)
    return null;

  var fichas = {};

  var $ = cheerio.load(res);

  // Find Main Table
  let table = $('#conteudo table');

  let $fichas = table.find('tr');

  // Go through each course
  $fichas.each( (i, ficha) => {
    var $datas = $(ficha).find('td');

    if($datas.length <= 0)
      return;

    // Parse ID from link
    var $links = $($datas.get(1))
    var $link = $($links.find('a').get(0));
    var link = $link.attr('href') || '';
    var id = link.replace('/ficha_individual/', '').split('/')[0];

    // Fix for 'novo' in curso Name
    var curso = $($datas.get(0)).text().replace('Novo', '');

    // Validate
    if(!id)
      return;

    var ficha = {
      id: id,
      link: link,
      curso: portal.parse.text( curso ),
      grade: portal.parse.text( $($datas.get(2)).text() ),
      turno: portal.parse.text( $($datas.get(3)).text() ),
      campus: portal.parse.text( $($datas.get(4)).text() ),
      ingresso: portal.parse.text( $($datas.get(5)).text() ),
      situacao: portal.parse.text( $($datas.get(6)).text() ),
    };

    fichas[id] = ficha;
  });

  return fichas;
};


//
// Parse coeficientes from a course page (pagina da ficha)
//
portal.parse.ficha = (body) => {
  if(!body)
    return null;

  let $ = cheerio.load(body);

  let $coeficientes = $('.coeficientes tr td');

  let elementValue = (el) => {
    return parseFloat( $(el).text().replace(',', '.') );
  };

  let nome = null;
  let $lines = $('#page p');
  $lines.each( (i, el) => {

    var txt = $(el).text();
    if(txt.indexOf('Nome: ') < 0)
      return;

    nome = txt.replace('Nome: ', '').trim();
  });

  return {
    coeficientes: {
      cp: elementValue($coeficientes.get(0)),
      cr: elementValue($coeficientes.get(1)),
      ca: elementValue($coeficientes.get(2)),
    },

    nome: nome,
  };
}
