var multer = require('multer');
var path = require('path');

exports.filename_perfil_img = function(req, file, cb){
	console.log('fileeeee' + JSON.stringify(file));
	var random = Math.floor(Math.random() * 1000);
	cb(null, req.user._id + '-' + random + path.extname(file.originalname));
};

exports.filename_temp_img = function(req, file, cb){
	console.log(req.query.tempdir);
	if(!req.query.tempdir) req.query.tempdir = '';
	console.log('fileeeee' + JSON.stringify(file));
	cb(null, path.join(req.query.tempdir, file.originalname));
};

exports.crear_multer = function(dest, filename){
	return multer({
		limits: {
			fileSize: 3 * 1024 * 1024 // 3 mb
		},
		storage: multer.diskStorage({
			destination: function(req, file, cb){
				console.log('destttttttttttt' + dest);
				cb(null, dest);
			},
			filename: filename,
		})
	});
};