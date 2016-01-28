/*
 * Comunica cliente y servidor para subir imágenes
 */

var config;
var path;
var fs;


function UploadFoto(fs_, path_, config_) {
	fs = fs_;
	path = path_;
	config = config_;
}
	
/*
 *  Petición POST para subir una imagen. En primera instancia se crea una carpeta temporal 
 *  y se guardan todas las imágenes de una denuncia en ella. Más tarde si la denuncia  se guarda 
 *  correctamente pasarán a la carpeta final de imágenes con un ID único y se elimina la carpeta temporal
 */
var formatsAllowed = 'png|jpg|jpeg|gif'; // Podríamos poner más

UploadFoto.prototype.postPicture = function(req, res) {
		
	var sms = {}; //JSON DE INFO QUE ENVIAREMOS
	
	
	var file = req.files.uploadfile || req.files.file;
	console.log(req.files);
	var extname = path.extname(file.path);
	if (!extname.match(formatsAllowed)){
        var msg = "Error subiendo tu archivo. Formato no válido. ";
        var type="error";
        sms.type = type;
        sms.msg = msg;
        return res.send(sms);
	}
	console.log(file.size );
	if (file.size > (4096*1024)){
        var msg = "Error subiendo tu archivo. Imagen demasiado grande. ";
        var type="error";
        sms.type = type;
        sms.msg = msg;
        return res.send(sms);
	}
	var from = file.path; // Ruta origen
	var to = path.join(path.join(config.TEMPDIR, req.params.tempDirID), file.name); // Destino temporal
	
	fs.rename(from, to, function(err) {
		     if(err) { 
		        var msg = "Error subiendo tu archivo "+err;
		        var type="error";
		        sms.type = type;
		        sms.msg = msg;
		     } 
		     else {
		        var fileSize = file.size/1024;
		        var msg = "Archivo subido correctamente a "+to+" ("+(fileSize.toFixed(2)) +" kb)";
		        var type="success";
		        sms.type = type;
		        sms.msg = msg;
		     }
		     
		     return res.send(sms);
	  });
};


/*
 * Método GET que ejecutaremos al principio de cargar la página de añadir nueva denuncia 
 * Creará una carpeta temporal con un identificador único y será donde guardaremos las fotos de
 * la denuncia. Recorre los archivos que hay en esta carpeta y devuelve el HTML de todas las imágenes que 
 * se añadirán.
 */
	
UploadFoto.prototype.getPicturesList = function(req, res) {
	
	fs.readdir(path.join(config.TEMPDIR, req.params.tempDirID),function(err, list) {
       if(err) return;
         //throw err;
       var html='';
     list.forEach(function(imagen){
    	 html += '<article style="padding:0px !important;position:relative" class="col-xs-12 col-sm-6 col-md-3">' + 
    		  	'<div class="panel panel-default" style="margin: 0px">' +
    	    '<div style="height:200px" class="panel-body"><a href="/files/temp/' + req.params.tempDirID + '/'+ imagen + '" title="' + imagen + '" data-title="' + imagen + '" data-footer="Descripción" data-type="image" data-toggle="lightbox" class="zoom"><img id="' + imagen + '" src="/files/temp/' + req.params.tempDirID + '/'+ imagen +  '" style="height:200px"/><span class="overlay"><i class="glyphicon glyphicon-fullscreen"></i></span></a></div>'+
    	    '<div class="panel-footer"><span class="pull-left">'+
    	        '<a href="javascript:void(0);" file="' + imagen + '" id="delete" title="No incluir imagen">Eliminar</a></span></div></div></article>';
//	    	 html += '<img class="img-responsive img-thumbnail" style="width: 250px;"' 
//	    		 	 + ' id="' + imagen + '" src="/files/temp/' + req.params.tempDirID + '/'+ imagen + '">' + 
//	    	 		 '<p><a href="javascript:void(0)" file="' + imagen + '" id="delete">Delete'+
//	    	 		 '</a></p>'; 
     });	 
     res.writeHead(200, {'Content-Type': 'text/html' });
     res.end(html);
     });

};
/*
 * Método GET que elimina una imagen de las que están en la carpeta temporal, 
 * (Carpeta que se genera para almacenar temporalmente imágenes de la denuncia)
 */
UploadFoto.prototype.getDeletePicture = function(req, res){
	
	var targetPath = path.join(path.join(config.TEMPDIR, req.params.tempDirID), req.params.fileName);
	fs.unlink(targetPath,function(err) {
		if(err) {
			res.send("Error borrando la imagen: "+err);
		} else {
			res.send("¡La imagen se ha borrado correctamente!");
		}
	});
};
/*
 * Renderizamos la página principal para añadir una denuncia
 */
UploadFoto.prototype.indexNueva = function(req, res){
	if (!req.user) res.redirect('/app');
	res.render('nueva.jade', {
		user: req.user, 
	 	message: {error: req.flash('error'),
			  info: req.flash('info'),
			  success: req.flash('success')}
	});
		
}

module.exports = UploadFoto;
