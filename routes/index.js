
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'You must sign in first' });
};

exports.signedin = function(req, res){
  res.render('signedin', { title: 'Thank you for signing in.' });
};
