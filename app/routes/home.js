var router = require('express').Router();

router.use(require('../middlewares/datos.js'));

/* 
 *  Renderizamos la página principal de nuestra aplicación
 */
router.get('/', function(req, res){
	//console.log('home ' + res.locals.datos_app.num_denun_total);
	//console.log('home ' + res.locals.mis_notificaciones);
	res.render('indexapp');
});

module.exports = router;