window.app = window.app || {};
var app = window.app;

/**
 * Control Creado para abrir el panel lateral info denuncia
 */
app.InfoDenuncia = function(opt_options, denuncia) {

  var options = opt_options || {};

  var button = document.createElement('button');
  button.innerHTML = '<i class="fa fa-list-alt"></i>';

  var this_ = this;

  console.log(JSON.stringify(denuncia));
  
  var num_likes = denuncia.likes ? denuncia.likes.length : 0;

  var fecha = getFechaFormatted(new Date(denuncia.fecha));

  var tags = [];
  if (denuncia.tags)
	  denuncia.tags.forEach(function(tag){
	  	tags.push('#' + tag.tag);
	  });

  //alert(tags);
  function info_ (){
	  BootstrapDialog.show({
	  	title: denuncia.titulo,
	  	message: '<div class="row" style="padding-bottom: 15px; border-top-left-radius: 10px; border-top-right-radius: 10px; background: url(&#39;http://www.batlleiroig.com/wp-content/uploads/247_parc_central_st_cugat_8.jpg&#39;); background-size: cover; background-repeat: no-repeat;">' + 
	  				'<div class="col-xs-4" style="text-align: center;">' +
	  					'<img class="img img-thumbnail" src="' + denuncia.usuario.profile.picture + '" style="margin-top: 15px; width: 90px; height: 90px; object-fit: cover;" />' +
	  				'</div>' +
	  				'<div class="col-xs-8" style="text-align: center; color: #fff">' +
	  					'<div class="col-lg-12" style="margin-top: 15px;height: 30px;"><i class="fa fa-user"></i> ' + denuncia.usuario.profile.username + '</div>' +
	  					'<div class="col-lg-12" style="height: 30px;"><i class="fa fa-eye"></i> ' + denuncia.veces_vista + ' <a onclick="quienLike()"><i class="fa fa-thumbs-up"></i></a> ' + num_likes + ' </div>' +
	  					'<div class="col-lg-12" style="height: 30px;"><i class="fa fa-calendar"></i> ' + fecha + '</div>' +
	  				'</div>' + 
	  			'</div>' + 
	  			'<h4 style="width: 100%; color: #fff; background-color: rgba(0,0,0,0.4); margin-top: -10px;text-align:center; border-radius: 5px">' + denuncia.titulo + '</h4>' +
	  			'<div class="row" style="margin-top: 15px; word-break: break-all; background-color: #fff">' + 
	  				'<i class="fa fa-tags"> ' + tags + '</i>' +
	  				'<h4>Descripción</h4>' + 
	  				denuncia.descripcion + 
	  			'</div>',
	  	onshow : function(dialog){
	  		dialog.getModalHeader().hide();
	  		dialog.getModalBody().parent().css('border-radius', '10px');
	  	},
	  });
  }

  button.addEventListener('click', info_, false);

  var element = document.createElement('div');
  element.setAttribute('data-toggle', 'left');
  element.setAttribute('title', 'Contenido');
  element.setAttribute('data-content', 'Título y descripción de la denuncia');
  element.className = 'info_denuncia ol-unselectable ol-control';
  element.appendChild(button);

  ol.control.Control.call(this, {
    element: element,
    target: options.target
  });

};
ol.inherits(app.InfoDenuncia, ol.control.Control);