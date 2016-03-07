window.app = window.app || {};
var app = window.app;


/**
 * Control Creado para abrir el panel lateral imágenes denuncia
 */
app.ImagenesDenuncia = function(opt_options, denuncia) {

  var options = opt_options || {};

  var button = document.createElement('button');
  button.innerHTML = '<i class="fa fa-image"></i>';

  var this_ = this;
  
  var message;

  if(!denuncia.imagenes){
  	message = '<h4>Esta denuncia no contiene imágenes</h4>';
  } else {
  	message = '<div id="carousel-example-generic" class="carousel slide" data-ride="carousel">' + 
  				'<ol class="carousel-indicators">';
  	denuncia.imagenes.forEach(function(imagen, index){
  		if(index == 0) message += '<li data-target="#carousel-example-generic" data-slide-to="0" class="active"></li>';
  		else message += '<li data-target="#carousel-example-generic" data-slide-to="' + index + '"></li>';
  	});

  	message += '</ol><div class="carousel-inner" role="listbox">';

  	denuncia.imagenes.forEach(function(imagen, index){
  		if(index == 0) message += '<div class="item active"><img src="' + imagen.path + '" style="object-fit: cover; width: 100%; height: 100%;"></div>';
  		else message += '<div class="item"><img src="' + imagen.path + '" style="object-fit: cover; width: 100%; height: 100%;"></div>';
  	});

  	message += '</div>' + '<a class="left carousel-control" href="#carousel-example-generic" role="button" data-slide="prev">' +
    	'<span class="glyphicon glyphicon-chevron-left" aria-hidden="true"></span>' +
    	'<span class="sr-only">Previous</span>' + 
  	'</a>' + 
  	'<a class="right carousel-control" href="#carousel-example-generic" role="button" data-slide="next">' + 
    	'<span class="glyphicon glyphicon-chevron-right" aria-hidden="true"></span>' +
    	'<span class="sr-only">Next</span>' +
  	'</a>' +
  	'</div>';
  }

  function imagenes_ (){
	  BootstrapDialog.show({
	  	title: 'Imágenes',
	  	message: message,
	  	onshown : function(){
	  		$('#carousel').carousel();
	  	}
	  });
  }

  button.addEventListener('click', imagenes_, false);

  var element = document.createElement('div');
  element.setAttribute('data-toggle', 'left');
  element.setAttribute('title', 'Imágenes');
  element.setAttribute('data-content', 'Imágenes asociadas a la denuncia');
  element.className = 'imagenes_denuncia ol-unselectable ol-control';
  element.appendChild(button);

  ol.control.Control.call(this, {
    element: element,
    target: options.target
  });

};
ol.inherits(app.ImagenesDenuncia, ol.control.Control);