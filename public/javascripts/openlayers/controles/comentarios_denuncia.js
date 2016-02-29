window.app = window.app || {};
var app = window.app;

/**
 * Control Creado para abrir el panel lateral comentarios denuncia
 */
app.ComentariosDenuncia = function(opt_options, denuncia, user) {

  var options = opt_options || {};

  var button = document.createElement('button');
  button.innerHTML = '<i class="fa fa-comments"></i>';

  var this_ = this;
  
  var form = user ? '<h4>Añade un comentario</h4><form id="form_add_comentario" action="/app/denuncia/' + denuncia.gid + '/addComentario" method="post">' + 
					  '<textarea id="comentar" name="contenido" rows="3" style="height:200px" class="form-control"></textarea>' + 
					  '<div style="margin-top:5px;margin-bottom:15px" class="col-lg-12 input-group space"><span class="input-group-addon"><i class="fa fa-comment fa-fw"></i></span>' +
					    '<input type="submit" value="Comentar" class="form-control btn-success"/>' +
					  '</div>' +
					'</form>' : '¡Debes estar loggeado para comentar!';

  var comentarios_html = '';

  if(denuncia.comentarios){
	comentarios_html = '<h4>Contiene ' + denuncia.comentarios.length + ' comentarios</h4>';
  } else {
  	if(user) comentarios_html = '<h4>Esta denuncia no contiene comentarios. ¡Sé el primero en opinar!</h4>';
  	else comentarios_html = '<h4> Esta denuncia no contiene comentarios.</h4>';
  }
  if (denuncia.comentarios)
	  denuncia.comentarios.forEach(function(coment){
	  		var fecha = getFechaFormatted(new Date(coment.fecha));
	  	  	comentarios_html += '<div class="row thumbnail" style="margin: 10 0 10 0px">' +
	  	  							'<div class="col-xs-4" style="text-align: center">' +
	  	  								'<a target="_blank" href="/app/usuarios/' + coment.id_usuario + '">' +
	  	  									'<img class="img img-thumbnail img-circle" src="' + coment.profile.picture + '" style="width: 70px; height: 70px; object-fit: cover;"/>' + 
	  	  									'<div style="word-break: break-all;">' + coment.profile.username + '</div>' + 
	  	  								'</a>' +
	  	  							'</div>' + 
	  	  							'<div class="col-xs-8" style="text-align: right">' + fecha + ' <i class="fa fa-clock-o"></i></div>' +
	  	  							'<div class="col-xs-8" style="margin: 15 0 5 0px; word-break: break-all;">' + coment.contenido + '</div>' +
	  	  						'</div>';

	  });

  function comentarios_ (){	
	  
	  BootstrapDialog.show({
	  	title: 'Comentarios',
	  	message: form + comentarios_html,
	  	onshown : function(dialog){
	  		//alert('eee');
	  		tinymce.init({
			  selector: 'textarea',
			  plugins: ['advlist autolink link lists charmap print preview hr anchor pagebreak',
			            'searchreplace wordcount visualblocks visualchars code fullscreen insertdatetime media nonbreaking',
			            'save table contextmenu directionality emoticons template paste textcolor'],
			  theme: 'modern',
			  language_url: '/langs/es.js',
			  min_width: 300,
			  resize: false
	  		});
	  	},
	  });
  }

  button.addEventListener('click', comentarios_, false);

  var element = document.createElement('div');
  element.setAttribute('data-toggle', 'left');
  element.setAttribute('title', 'Comentarios');
  element.setAttribute('data-content', 'Añadir/Ver comentarios');
  element.className = 'comentarios_denuncia ol-unselectable ol-control';
  element.appendChild(button);

  ol.control.Control.call(this, {
    element: element,
    target: options.target
  });

};
ol.inherits(app.ComentariosDenuncia, ol.control.Control);