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
  	form = user ? '<h4>' + traducciones.add_comentario + '</h4><form id="form_add_comentario" action="/app/denuncias/' + denuncia.gid + '/comentar" method="post">' + 
		'<textarea id="comentar" name="contenido" rows="3" style="height:200px" class="form-control"></textarea>' + 
	  	'<div style="margin-top:5px;margin-bottom:15px" class="col-lg-12 input-group space"><span class="input-group-addon"><i class="fa fa-comment fa-fw"></i></span>' +
	    	'<input type="submit" value="' + traducciones.aceptar + '" class="form-control btn-success"/>' +
	  	'</div>' +
	'</form>' : '<p>' + traducciones.logeado_para_comentar + '</p>',
	comentarios_html = '',
	element = document.createElement('div'),
	aux = true,
	dialog = new BootstrapDialog({
	  	title: traducciones.comentarios,
	  	message: $(form),
	  	autodestroy : false,
	  	onshow : function(dialog){
	  		dialog.getModalHeader().replaceWith($('<div class="row" style="margin: 0px; padding-top: 5px; border-top-left-radius: 10px; border-top-right-radius: 10px; background: url(&#39;http://www.batlleiroig.com/wp-content/uploads/247_parc_central_st_cugat_8.jpg&#39;); background-size: cover; background-repeat: no-repeat;">' + 
	            '<div class="bootstrap-dialog-close-button">' + 
	          	  '<button class="close" style="color : #fff; margin-right : 10px;">X</button>' +
	            '</div>' +
  				'<div class="col-xs-6" style="text-align: center; color: #fff; font-weight : bold;">' +
					'<i class="fa fa-comments" style="font-size : 60px; color : #00bbff; text-shadow: 2px 2px #fff;"></i>' + 
  					'<h4 style="padding : 2px; color : #00bbff; background : rgba(0,0,0,0.7); border-radius : 15px;"> Comentarios</h4>' +
  				'</div>' +
  			'</div>'));
  			dialog.getModalDialog().find('.close').click(function(){dialog.close()});
	  		dialog.getModalBody().parent().css('border-radius', '15px');
	  		dialog.getModalBody().css('padding-top', '10px');
	  	},
	  	onshown : function(dialog){
	  		if(aux){
	  			aux = false;
	  		} else {
	  			return;
	  		}

	  		var cache_coment = {};
	  		$('.contestar').click(function(){
	  			if(cache_coment[$(this).attr('id_coment')]) return;
	  			cache_coment[$(this).attr('id_coment')] = true;
	  			var id_comentario = $(this).attr('id_coment');
	  			var form = '<div class="container-fluid"><form class="form-horizontal"><textarea class="form-control" rows="5" id="comment" name="contenido"></textarea><div style="padding : 0px;" class="col-lg-12"><div style="margin : 0px; min-width : 0px;" class="btn btn-danger col-lg-2 cerrar">X</div><button style="margin : 0px" class="btn btn-success col-lg-10" type="submit">' + traducciones.aceptar + '</button></div></form></div>';
	  			$(this).parent().parent().append(form);
	  			$(this).parent().parent().find('form').submit(function(e){
	  				$(this).find('[type="submit"]').attr('disabled', true);
	  				e.preventDefault();
	  				var this_ = this;
	  				var metodo = 'POST';
	  				var url = '/app/denuncias/' + denuncia.gid + '/comentario/' + id_comentario + '/replicar';

	  				var xhr = new XMLHttpRequest();
	  				xhr.open(metodo, url, true);
	  				xhr.setRequestHeader('Content-Type', 'application/json');

	  				xhr.send(JSON.stringify({contenido : $(this_).find('textarea').val()}));

	  				xhr.onreadystatechange = function(){
	  					var res = JSON.parse(xhr.responseText);
	  					$(this_).find('[type="submit"]').attr('disabled', false);
	  					if(xhr.status == 200 & xhr.readyState == 4)
	  						window.location.replace('/app/denuncias/' + denuncia.gid + '?id_noti=' + res.id_noti);
	  					else if(xhr.status == 500 & xhr.readyState == 4){
	  						$(this_).find('[type="submit"]').attr('disabled', false);
	  						BootstrapDialog.show({
	  							title : 'ERROR',
	  							message : JSON.parse(xhr.responseText).msg
	  						});
	  					}
	  				}
	  			});
	  			$('.cerrar').click(function(){
	  				$(this).parent().parent().remove();
	  				delete cache_coment[id_comentario];
	  			});
	  		});

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

				xhr.open('POST','/app/denuncias/' + denuncia.gid + '/comentar' , true);
				xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8"); // Especificamos cabecera
				xhr.send(JSON.stringify({contenido: encodeURIComponent(contenido)})); // Enviamos petición
				
				$(this).find('.input-group').parent().append('<div style="text-align: center"><i class="fa fa-spinner fa-spin fa-5x" style="color: #339BEB"></i><p>Enviando...</p></div>');
				$(this).find('.input-group').hide();
				
				xhr.onreadystatechange = function(){
					var res = JSON.parse(xhr.responseText);
					if(xhr.status === 200 && xhr.readyState === 4)
						window.location.replace('/app/denuncias/' + denuncia.gid + '?id_noti=' + res.id_noti);
					else if(xhr.status === 500 && xhr.readyState === 4)
						BootstrapDialog.show({
							title : 'ERROR',
							message : JSON.parse(xhr.responseText).msg,
							onshown : function(dialog){
								$(dialog.getModalHeader()).css('background', '#800000');
							}
						});
				}
				return false;
			});

	  	},
  	});

  	if(denuncia.comentarios){
		comentarios_html = '<h4>' + traducciones.contiene + ' ' + denuncia.comentarios.length + ' ' + traducciones.comentarios + '</h4>';
  	} else {
  		if(user) comentarios_html = '<h4>' + traducciones.comentarios_no_tiene + '. <br>' + traducciones.se_el_primero + '</h4>';
  		else comentarios_html = '<h4>'+ traducciones.comentarios_no_tiene + '.</h4>';
  	}

  	if (denuncia.comentarios)
	  	denuncia.comentarios.forEach(function(coment){
	  		var date = new Date(coment.fecha),
	  		fecha = getFechaFormatted(date);

	  	  	comentarios_html += '<div class="row thumbnail" style="margin: 10 0 10 0px" id="' + coment.id + '">' +
				'<div class="col-xs-4" style="text-align: center">' +
					'<a target="_blank" href="/app/usuarios/' + coment.id_usuario + '">' +
						'<img class="img img-thumbnail img-circle" src="' + coment.profile.picture + '" style="width: 70px; height: 70px; object-fit: cover;"/>' + 
						'<div style="word-break: break-all;">' + coment.profile.username + '</div>' + 
					'</a>' +
				'</div>' + 
				'<div class="col-xs-8" style="text-align: right"><p>' + fecha + ' <i class="fa fa-clock-o"></i></p></div>' +
				'<div class="col-xs-8" style="margin: 15 0 5 0px; word-break: break-all;">' + decodeURIComponent(coment.contenido) + '</div>' +
				'<div id="replicar" class="col-xs-8" style="margin: 15 0 5 0px; word-break: break-all;">' +
					'<button id_coment="' + coment.id + '" class="btn btn-success col-lg-12 contestar">Contestar</button>' + 
				'</div>' +
			'</div>';

			if(coment.replicas){
				coment.replicas.forEach(function(repli){
					var date_repli = new Date(repli.fecha),
		  			fecha_repli = getFechaFormatted(date_repli);

					comentarios_html += '<div class="row thumbnail" style="margin: 10 0 10 50px" id="' + repli.id + '">' +
						'<div class="col-xs-4" style="text-align: center">' +
							'<a target="_blank" href="/app/usuarios/' + repli.id_usuario + '">' +
								'<img class="img img-thumbnail img-circle" src="' + repli.profile.picture + '" style="max-width: 50px; max-height: 50px; object-fit: cover;"/>' + 
								'<div style="word-break: break-all;">' + repli.profile.username + '</div>' + 
							'</a>' +
						'</div>' + 
						'<div class="col-xs-8" style="text-align: right">' + fecha_repli + ' <i class="fa fa-clock-o"></i></div>' +
						'<div class="col-xs-8" style="margin: 15 0 5 0px; word-break: break-all;">' + decodeURIComponent(repli.contenido) + '</div>' +
					'</div>';
				});
			}
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