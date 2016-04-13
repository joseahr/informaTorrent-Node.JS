module.exports = function(req, res, next) {
  req.i18n.setLocaleFromCookie();
  if(req.query.lang){
  	req.i18n.setLocaleFromQuery();
  	if(req.query.lang.toLowerCase() == 'es' || req.query.lang.toLowerCase() == 'en' || req.query.lang.toLowerCase() == 'val')
  		res.cookie('locale', req.query.lang.toLowerCase());
  }
  //locales.getTranslations(req, res);
  next();
}