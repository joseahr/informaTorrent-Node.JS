window.app = window.app || {};
var app = window.app;

/**
 * Control Creado para abrir el panel lateral comentarios denuncia
 */
app.ComentariosDenuncia = function(opt_options, denuncia, user) {

  	var options = opt_options || {},
  	button = document.createElement('button'),
  	this_ = this,
  	num_coments = denuncia.comentarios ? (denuncia.comentarios.length > 10 ? '10+' : denuncia.comentarios.length) : '0',
  	form = user ? '<h4>Añade un comentario</h4><form id="form_add_comentario" action="/app/denuncia/' + denuncia.gid + '/addComentario" method="post">' + 
		'<textarea id="comentar" name="contenido" rows="3" style="height:200px" class="form-control"></textarea>' + 
	  	'<div style="margin-top:5px;margin-bottom:15px" class="col-lg-12 input-group space"><span class="input-group-addon"><i class="fa fa-comment fa-fw"></i></span>' +
	    	'<input type="submit" value="Comentar" class="form-control btn-success"/>' +
	  	'</div>' +
	'</form>' : '<p>¡Debes estar loggeado para comentar!</p>',
	comentarios_html = '',
	element = document.createElement('div'),
	aux = true,
	dialog = new BootstrapDialog({
	  	title: 'Comentarios',
	  	message: $(form),
	  	autodestroy : false,
	  	onshown : function(dialog){
	  		if(aux){
	  			aux = false;
	  		} else {
	  			return;
	  		}

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

	  		$('#form_add_comentario').submit(function(){
				var contenido = tinyMCE.activeEditor.getContent().replace(/'/g, " ");
				//alert(contenido);
				var xhr = new XMLHttpRequest();

				xhr.open('POST','/app/denuncia?id=' + denuncia.gid + '&action=add_coment' , true);
				xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8"); // Especificamos cabecera
				xhr.send(JSON.stringify({contenido: encodeURIComponent(contenido)})); // Enviamos petición
				
				$(this).find('.input-group').parent().append('<div style="text-align: center"><i class="fa fa-spinner fa-spin fa-5x" style="color: #339BEB"></i><p>Enviando Comentario...</p></div>');
				$(this).find('.input-group').hide();

				xhr.onload = function(){
					window.location.replace('/app/denuncia/' + denuncia.gid);
				}
				return false;
			});

	  	},
  	});

  	if(denuncia.comentarios){
		comentarios_html = '<h4>Contiene ' + denuncia.comentarios.length + ' comentarios</h4>';
  	} else {
  		if(user) comentarios_html = '<h4>Esta denuncia no contiene comentarios. <br>¡Sé el primero en opinar!</h4>';
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
				'<div class="col-xs-8" style="margin: 15 0 5 0px; word-break: break-all;">' + decodeURIComponent(coment.contenido) + '</div>' +
			'</div>';
	  	});

	form += comentarios_html;
	dialog.setMessage(form);

  	function comentarios_ (){	
	  	dialog.open();
  	}

  	button.innerHTML = '<i class="fa fa-comments"></i>';
  	button.addEventListener('click', comentarios_, false);
  	$(button).append('<span class="badge" style="background-color: #cc0000; font-size: 0.6em">' + num_coments + '</span>');

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