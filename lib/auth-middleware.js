function requireLogin(req, res, next) {
  if (!req.session.utilizador) return res.redirect('/login');
  next();
}

function requireResponsavel(req, res, next) {
  if (!req.session.utilizador) return res.redirect('/login');
  if (req.session.utilizador.role !== 'responsavel') {
    return res.status(403).render('erro', { mensagem: 'Esta area e reservada ao responsavel.' });
  }
  next();
}

module.exports = { requireLogin, requireResponsavel };
