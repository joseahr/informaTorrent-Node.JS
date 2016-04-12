module.exports = function (req, res, next) {

    if (req.isAuthenticated()){
    	if(req.user.local.valid)
    		next();
    	else{
    		req.flash('error', 'Revisa tu correo:"' + req.user.local.email + '" y activa tu cuenta.');
    		res.redirect('/app');
    	}
    }
    else{
    	console.log('no');

    	req.flash('error', 'Debes estar loggeado');
    	res.redirect('/app/login');
    }
};