exports.Turno_CR = function (turma) {
  this.turma = turma;

  this.turno = {
    'aMAT': 'Matutino',
    'bVES': 'Vespertino',
    'cNOT': 'Noturno'
  }[turma.turno];

  this.score = (matricula) => {
    return {
      _id: matricula._id,
      _aluno: matricula._aluno,
      _turma: matricula._turma,

      // Turno fica com 1 se estiver no mesmo turno
      turno: (this.turno == matricula.aluno.turno) ? -1 : 0,

      // CR: próprio cr do aluno
      cr: -matricula.aluno.coeficientes.cr
    };
  },

    this.sort = ['turno', 'cr'];

  this.canEnter = () => {
    return true;
  };
};
