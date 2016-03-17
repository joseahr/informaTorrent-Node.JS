window.app = window.app || {};
var app = window.app;

/**
 * Control Creado para abrir el panel lateral info denuncia
 */
app.InfoDenuncia = function(opt_options, denuncia) {

  var options = opt_options || {},
  button = document.createElement('button'),
  element = document.createElement('div'),
  this_ = this;  
  num_likes = denuncia.likes ? denuncia.likes.length : 0,
  fecha = getFechaFormatted(new Date(denuncia.fecha)),
  tags = [],
  likes_html = '<div class="container" style="width: 100%"><div class="col-lg-12">',
  usuarios_like = denuncia.likes,
  quienLike = function() {
    if (!usuarios_like) return;
    console.log('a quien le gusta');
    BootstrapDialog.show({
      title: 'Esta denuncia le gusta a...',
      message: likes_html,
      buttons: [{label: 'Cerrar', action: function(d){d.close();}}],
      onshown: function(){
        $('[data-toggle="bottom"]').popover({
          trigger: 'hover',
          placement: 'bottom'
        });
      }
    });
  };
  
  if (usuarios_like)
    usuarios_like.forEach(function(usuario){
      likes_html += '<a data-toggle="bottom" title="Usuario" data-content="' + usuario.profile.username + '" href="/app/usuarios/' + usuario._id + '" style="float:left; margin: 2px;"><img style="width: 80px; height: 80px;" src="' + usuario.profile.picture + '" class="img img-thumbnail"></img></a>';
    });

  likes_html += '</div></div>';

  if (denuncia.tags)
	  denuncia.tags.forEach(function(tag){
	  	tags.push('#' + tag.tag);
	  });

  //console.log('desc ', decodeURIComponent(denuncia.descripcion)); 

  //alert(tags);
  function info_ (){
	  BootstrapDialog.show({
	  	title: denuncia.titulo,
	  	message: '<h4 style="width: 100%; color: #fff; background-color: rgba(0,0,0,0.4); margin-top: -10px;text-align:center; border-radius: 5px">' + denuncia.titulo + '</h4>' +
		  '<div id="desc" class="row" style="margin-top: 15px; word-break: break-all; background-color: #fff">' + 
			 '<i class="fa fa-tags"> ' + tags + '</i>' +
			 '<h4>Descripción</h4>' + 
		  '</div>',
      buttons : [{
        label : 'Cerrar',
        action : function(dialog){dialog.close()},
      }], 
	  	onshow : function(dialog){
	  		dialog.getModalHeader().replaceWith($('<div class="row" style="margin: 0px; padding-bottom: 15px; border-top-left-radius: 10px; border-top-right-radius: 10px; background: url(&#39;http://www.batlleiroig.com/wp-content/uploads/247_parc_central_st_cugat_8.jpg&#39;); background-size: cover; background-repeat: no-repeat;">' + 
  				'<div class="col-xs-4" style="text-align: center;">' +
  					'<img class="img img-thumbnail" src="' + denuncia.usuario.profile.picture + '" style="margin-top: 15px; width: 90px; height: 90px; object-fit: cover;" />' +
  				'</div>' +
  				'<div class="col-xs-8" style="text-align: center; color: #fff">' +
  					'<div class="col-lg-12" style="margin-top: 15px;height: 30px;"><i class="fa fa-user"></i> ' + denuncia.usuario.profile.username + '</div>' +
  					'<div class="col-lg-12" style="height: 30px;"><i class="fa fa-eye"></i> ' + denuncia.veces_vista + ' <a onclick="quienLike()"><i class="fa fa-thumbs-up"></i></a> ' + num_likes + ' </div>' +
  					'<div class="col-lg-12" style="height: 30px;"><i class="fa fa-calendar"></i> ' + fecha + '</div>' +
  				'</div>' + 
  			'</div>'));

	  		dialog.getModalBody().parent().css('border-radius', '15px');
	  		dialog.getModalBody().css('padding-top', '0px');
	  	},
	  	onshown : function(dialog){
        //alert($(decodeURIComponent(denuncia.descripcion)));
	  		$(dialog.getModalBody()).find('#desc').append(decodeURIComponent(denuncia.descripcion));
	  	},
	  });
  }

  button.innerHTML = '<i class="fa fa-list-alt"></i>';
  button.addEventListener('click', info_, false);

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