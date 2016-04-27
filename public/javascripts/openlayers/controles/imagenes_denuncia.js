window.app = window.app || {};
var app = window.app;


/**
 * Control Creado para abrir el panel lateral imágenes denuncia
 */
app.ImagenesDenuncia = function(opt_options, denuncia) {

  var options = opt_options || {},
  num_imgs = denuncia.imagenes ? denuncia.imagenes.length : '0',
  button = document.createElement('button'),
  element = document.createElement('div'),
  this_ = this,
  message;

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
    if(!denuncia.imagenes)
      message = '<p> Esta denuncia no contiene imágenes </p>';
	  BootstrapDialog.show({
	  	title: 'Imágenes',
	  	message: message,
	  	onshown : function(){
	  		$('#carousel').carousel();
	  	},
      onshow : function(dialog){
        dialog.getModalHeader().replaceWith($('<div class="row" style="margin: 0px; padding-top: 5px; border-top-left-radius: 10px; border-top-right-radius: 10px; background: url(&#39;http://www.batlleiroig.com/wp-content/uploads/247_parc_central_st_cugat_8.jpg&#39;); background-size: cover; background-repeat: no-repeat;">' + 
          '<div class="col-xs-4" style="text-align: center; color: #fff; font-weight : bold;">' +
          '<i class="fa fa-image" style="font-size : 60px; color : #00bbff; text-shadow: 2px 2px #fff;"></i>' + 
            '<h4 style="padding : 2px; color : #00bbff; background : rgba(0,0,0,0.7); border-radius : 15px;"> Imágenes</h4>' +
          '</div>' +
        '</div>'));
        dialog.getModalBody().parent().css('border-radius', '15px');
        dialog.getModalBody().css('padding-top', '10px');
    },
	  });
  }

  button.innerHTML = '<i class="fa fa-image"></i>';
  button.addEventListener('click', imagenes_, false);
  $(button).append('<span class="badge" style="background-color: #cc0000; font-size: 0.6em">' + num_imgs + '</span>');

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
