 var ip = window.location.href.toString().split(':' + window.location.port)[0] + ':8081';
 console.log(ip, 'utils');
// Eliminar una denuncia
function eliminar(id){
	//alert(id);
	BootstrapDialog.show({
		title: 'ID: ' + id,
		message: traducciones.seguro_eliminar_denuncia + ' (ID = ' + id + ')',
		type: BootstrapDialog.TYPE_INFO,
		onshow : function(dialog){
            dialog.getModalHeader().replaceWith($('<div class="row" style="margin: 0px; padding-top: 5px; border-top-left-radius: 10px; border-top-right-radius: 10px; background: url(&#39;http://www.batlleiroig.com/wp-content/uploads/247_parc_central_st_cugat_8.jpg&#39;); background-size: cover; background-repeat: no-repeat;">' + 
	            '<div class="bootstrap-dialog-close-button">' + 
	          	  '<button class="close" style="color : #fff; margin-right : 10px;">X</button>' +
	            '</div>' +
		        '<div class="col-xs-6" style="text-align: center; color: #fff; font-weight : bold;">' +
		        '<i class="fa fa-trash" style="font-size : 60px; color :  #9E1C1C; text-shadow: 2px 2px #fff;"></i>' + 
		          '<h4 style="padding : 2px; color :  #9E1C1C; background : rgba(0,0,0,0.7); border-radius : 15px;"> ¿Eliminar denuncia?</h4>' +
		        '</div>' +
		      '</div>'));
            dialog.getModalDialog().find('.close').click(function(){dialog.close()});
    	    dialog.getModalBody().parent().css('border-radius', '15px');
	        dialog.getModalBody().css('padding-top', '10px');
		},
		buttons: [
			{label: traducciones.aceptar, action: function(dialog){
				$.ajax({
					url : '/app/denuncias/' + id,
					type : 'DELETE',
					success : function(res){
						dialog.close();
						$('#' + id).remove();
						$('#has_realizado').html((parseInt($('#has_realizado').html()) -1) + ' ');
						BootstrapDialog.alert(res.msg);						
					}
				});
			}}, 
			{label: traducciones.cancelar, action: function(dialog){dialog.close();}}
		]
	});
}

// Obtener Imagen miniatura de geoserver
function getGeoserverMiniatura(denuncia, width){

	console.log(denuncia);
	
	tipo = denuncia.geometria.type;
	coords = denuncia.geometria.coordinates;
	//alert(coords + ' ' + tipo);
	var extension = [];
	var tabla = '';
	if(tipo == 'Point'){
		extension = new ol.geom.Point(coords).getExtent();
		tabla = 'denuncias_puntos';
	}
	if(tipo == 'LineString'){
		extension = new ol.geom.LineString(coords).getExtent();
		tabla = 'denuncias_lineas';
	}
	if(tipo == 'Polygon'){
		extension = new ol.geom.Polygon(coords).getExtent();
		tabla = 'denuncias_poligonos';
	}
	//alert(extension);
	extension[0] = extension[0] - 0.001; //Xmin
	extension[1] = extension[1] - 0.001; //Ymin
	extension[2] = extension[2] + 0.001; //Xmax
	extension[3] = extension[3] + 0.001; //Ymax
		
	var dif = Math.abs(extension[2] - extension[0]) / Math.abs(extension[3] - extension[1]) ;
	var height = Math.round(width / dif);
	//alert(ip);
	return ip + "/geoserver/jahr/wms?service=WMS&version=1.1.0&request=GetMap" +
		"&layers=jahr:OI.OrthoimageCoverage,jahr:" + tabla + "&styles=&bbox=" + 
		extension + "&width=" + width + "&height=" + height + 
		"&srs=EPSG:4258&format=image/png&cql_filter=1=1;gid='" + denuncia.gid + "'";

}							

var mes_str = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

function getFechaFormatted(fecha){
	var dia = fecha.getDate();
	var mes = fecha.getMonth();
	var año = fecha.getFullYear();
	var hora = fecha.getHours();
	var minutos = fecha.getMinutes();
	var segundos = fecha.getSeconds();
	if (dia < 10) dia = '0' + dia;
	mes = mes_str[mes];
	if(hora < 10) hora = '0' + hora;
	if(minutos < 10) minutos = '0' + minutos;
	if(segundos<10) segundos = '0' + segundos;
	return dia + '-' + mes + '-' + año + '  ' + hora + ':' + minutos + ':' + segundos;
}

function getIconoNotificacion(noti, traduc){
	var tipo = noti.tipo;
	var html= traduc.ir_a_denuncia + ' <a target="_blank" href="/app/denuncias/' + noti.denuncia.gid + '"><span class="fa-stack fa-lg">' +
			   		'<i class="fa fa-circle fa-stack-2x" style="color: #339BEB"></i>' +
			   		'<i class="fa fa-angle-right fa-stack-1x fa-inverse"></i>' +
			   '</span></a>';
	if(tipo == 'DENUNCIA_CERCA'){
		return html + '<span class="fa-stack fa-lg">' +
			   		'<i class="fa fa-circle fa-stack-2x" style="color: #339BEB"></i>' +
			   		'<i class="fa fa-map-marker fa-stack-1x fa-inverse"></i>' +
			   '</span>';
	}
	else if(tipo == 'COMENTARIO_DENUNCIA'){
		return html + '<span class="fa-stack fa-lg">' +
			   		'<i class="fa fa-circle fa-stack-2x" style="color: #339BEB"></i>' +
			   		'<i class="fa fa-comment fa-stack-1x fa-inverse"></i>' +
			   '</span>';
	}
	else if(tipo == 'REPLICA'){
		return html + '<span class="fa-stack fa-lg">' +
			   		'<i class="fa fa-circle fa-stack-2x" style="color: #339BEB"></i>' +
			   		'<i class="fa fa-comments fa-stack-1x fa-inverse"></i>' +
			   '</span>';
	}
	else if(tipo == 'LIKE_DENUNCIA'){
		return html + '<span class="fa-stack fa-lg">' +
			   		'<i class="fa fa-circle fa-stack-2x" style="color: #339BEB"></i>' +
			   		'<i class="fa fa-thumbs-o-up fa-stack-1x fa-inverse"></i>' +
			   '</span>';			
	}
	else if(tipo === 'NO_LIKE_DENUNCIA'){
		return html + '<span class="fa-stack fa-lg">' +
			   		'<i class="fa fa-circle fa-stack-2x" style="color: #339BEB"></i>' +
			   		'<i class="fa fa-thumbs-o-up fa-stack-1x fa-inverse"></i>' +
			   		'<i class="fa fa-ban fa-stack-2x text-danger"></i>' +
			   '</span>';			
	}
}

function getInfoNotificacion(noti, traduc){
	var id_usuario_from = noti.id_usuario_from;
	var username = noti.profile_from.username;
	if(noti.tipo == 'DENUNCIA_CERCA'){
		return '<p><a href="/app/usuarios/' + noti.id_usuario_from + '">' + username + '</a> ' +
				traduc.usuario_add_denuncia_cerca + '</p><p>' + traduc.distancia + ' : ' + noti.datos.distancia.toFixed(3) + ' ' + traduc.metros + '</p>' +
				'<div style="overflow-x: hidden">' + traduc.denuncia + ' : ' + noti.denuncia.titulo + '</div>';
	}
	else if(noti.tipo == 'COMENTARIO_DENUNCIA'){
		return '<p><a href="/app/usuarios/' + noti.id_usuario_from + '">' + username + '</a> ' +
				traduc.comento + ': <i>"' + $(decodeURIComponent(noti.datos.contenido)).text().substring(0,20)  + 
				'...</i>" ' + traduc.en_tu_denuncia + '</p>' + 
				'<div style="overflow-x: hidden">' + traduc.denuncia + ' : ' + noti.denuncia.titulo + '</div>';
	}
	else if(noti.tipo == 'REPLICA'){
		console.log(noti.datos);
		return '<p><a href="/app/usuarios/' + noti.id_usuario_from + '">' + username + '</a> ' +
				traduc.comento + ': <i>"' + decodeURIComponent(noti.datos.contenido).substring(0,20)  + 
				'...</i>" ' + traduc.en_una_conversacion + '</p>' + 
				'<div style="overflow-x: hidden">' + traduc.denuncia + ' : ' + noti.denuncia.titulo + '</div>';
	}
	else if(noti.tipo == 'LIKE_DENUNCIA'){
		return '<p><a href="/app/usuarios/' + noti.id_usuario_from + '">' + username + '</a> ' +
				traduc.usuario_like_denuncia + '</p>' + 
				'<div style="overflow-x: hidden">' + traduc.denuncia + ' : ' + noti.denuncia.titulo + '</div>';			
	}
	else if(noti.tipo === 'NO_LIKE_DENUNCIA'){
		return '<p><a href="/app/usuarios/' + noti.id_usuario_from + '">' + username + '</a> ' +
				traduc.usuario_no_like_denuncia + '</p>' + 
				'<div style="overflow-x: hidden">' + traduc.denuncia + ' : ' + noti.denuncia.titulo + '</div>';			
	}		
}

function getInfoAccion(noti, traduc){
	var id_usuario_to = noti.id_usuario_to;
	var username = noti.profile_to.username;
	if(noti.tipo == 'DENUNCIA_CERCA'){
		return '<p>' + traduc.has_publicado_denuncia_cerca + ' <a href="/app/usuarios/' + id_usuario_to + '">' + username + '</a></p>' +
				'<p>' + traduc.distancia + ' : ' + noti.datos.distancia.toFixed(3) + ' ' + traduc.metros + '</p>' +
				'<div style="overflow-x: hidden">' + traduc.denuncia + ' : ' + noti.denuncia.titulo + '</div>';
	}
	else if(noti.tipo == 'COMENTARIO_DENUNCIA'){
		return '<p>' + traduc.comentaste + ': <i>"' + $(decodeURIComponent(noti.datos.contenido)).text().substring(0,20)  + '..."</i> ' + traduc.en_la_denuncia_de + ' ' +
			'<a href="/app/usuarios/' + id_usuario_to + '">' + username + '</a></p>' + 
			'<div style="overflow-x: hidden">' + traduc.denuncia + ' : ' + noti.denuncia.titulo + '</div>';
	}
	else if(noti.tipo == 'REPLICA'){
		var comentaron = '';
		if(noti.usuarios_conver)
			noti.usuarios_conver.forEach(function(u){
				console.log(u);
				comentaron += '<div class="col-lg-2"><a target="_blank" href="/app/usuarios/' + u._id + '"><img style="max-width : 40px; max-height : 40px;" src="' + u.profile.picture + '"></img></a></div>';
			});
		return '<p>' + traduc.comentaste + ': <i>"' + decodeURIComponent(noti.datos.contenido).substring(0,20)  + '..."</i> en el comentario de ' +
			'<a href="/app/usuarios/' + noti.datos.user_comentario._id + '">' + noti.datos.user_comentario.profile.username + '</a></p>' + 
			'<p>También comentaron : </p>' +  comentaron + 
			'<div style="clear : both; overflow-x: hidden">' + traduc.denuncia + ' : ' + noti.denuncia.titulo + '</div>';
	}
	else if(noti.tipo == 'LIKE_DENUNCIA'){
		return '<p>' + traduc.me_gusta_denuncia + ' <a href="/app/usuarios/' + id_usuario_to + '">' + username + '</a></p>' +
			'<div style="overflow-x: hidden">' + traduc.denuncia + ' : ' + noti.denuncia.titulo + '</div>';		
	}
	else if(noti.tipo === 'NO_LIKE_DENUNCIA'){
		return '<p>' + traduc.no_me_gusta_denuncia + ' <a href="/app/usuarios/' + id_usuario_to + '">' + username + '</a></p>' +
			'<div style="overflow-x: hidden">' + traduc.denuncia + ' : ' + noti.denuncia.titulo + '</div>';			
	}

}

function icono(clase, color){
	return '<span class="fa-stack fa-lg" style="color: ' + color + '">' +
  				'<i class="fa fa-circle fa-stack-2x"></i>' +
  				'<i class="fa ' + clase + ' fa-stack-1x fa-inverse"></i>' +
			'</span>';
}

function getDenunciaRow(denuncia, tabla){
	var contenido = denuncia.descripcion.substring(0, 50) + '...';
	var comentarios = denuncia.comentarios ? denuncia.comentarios.length : 0;
	var tags = denuncia.tags_ ? denuncia.tags_.length : 0;
	var imagenes = denuncia.imagenes ? denuncia.imagenes.length : 0;
	var likes = denuncia.likes ? denuncia.likes.length : 0;
	var fecha = new Date(denuncia.fecha);
	var id = denuncia.gid;

	var clas = '';

	var menu;

	if (!tabla) {
		clas = 'thumbnail';
		menu = '<a target="_blank" href="/app/denuncias/' + id + '" style="margin: 0px auto;">' + icono('fa-eye', '#55acee') + '</a>' +
				'<a target="_blank" href="/app/denuncias/' + id + '/actualizar" style="margin: 0px auto;">' + icono('fa-edit', '#ec971f') + '</a>' +
				'<a id="' + id + '" onclick="eliminar(this.id)" href="#" style="margin: 0px auto;">' + icono('fa-trash', '#d9534f') + '</a>';
	}
	else {
		menu = '<a target="_blank" href="/app/denuncias/' + id + '" style="margin: 0px auto;">' + icono('fa-eye', '#55acee') + '</a>' +
				'<a target="_blank" href="/app/usuarios/' + denuncia.usuario[0]._id + '" style="margin: 0px auto;">' + 
					'<span class="fa-stack fa-lg" style="color: #ec971f">' +
  						'<img src="' + denuncia.usuario[0].profile.picture + '" style="padding: 2px; object-fit: cover; width: 40px; height: 40px;" class="fa fa-circle fa-stack-2x img-circle"></img>' +
					'</span>' +
				'</a>';
	}

	return '<div class="row" id="' + denuncia.gid + '">' + 
			'<div class="'+ clas +' container-fluid" style="margin: 10 5 5 5px; padding-top: 10px; overflow-x: hidden;">' + 
				'<div class="col-lg-12 container imagen_con_menu">' + 
					'<h2 style="background:rgba(255,255,255,0.4); margin: 0px; position: absolute; top: 20px; right: 0px; left:0px; z-index:1; font-size: 1.5em; color: #000; font-weight: bold;">' + denuncia.titulo + '</h2>' +
					'<img id="imagenes_denuncia" class="img img-responsive" src="' +  getGeoserverMiniatura(denuncia, 500) + '" style="border-top-right-radius: 10px;border-top-left-radius: 10px; float:left;height: 300px; object-fit: cover; margin-top: 20px; padding: 0px; width: 100%;"></img>' +
					'<div class="menu_encima_de_imagen text-center">' + 
						menu +
					'</div>' +
					'<div class="col-lg-12" style="clear:both; color: #fff; background : rgba(0,50,200,0.4)">' +
						'<i class="fa fa-clock-o"></i> ' + getFechaFormatted(fecha) + 
					'</div>' +
					'<div class="panel-footer col-lg-12" style="clear:both;">' +
						'<i class="fa fa-eye"> ' + denuncia.veces_vista + '&nbsp;&nbsp;</i>' +
						'<i class="fa fa-thumbs-up"> ' + likes + '&nbsp;&nbsp;</i>' +
						'<i class="fa fa-comments"> ' + comentarios + '&nbsp;&nbsp;</i>' +
						'<i class="fa fa-image"> ' + imagenes + '&nbsp;&nbsp;</i>' +
						'<i class="fa fa-tags"> ' + tags + '  </i>' +
					'</div>'+
				'</div>' + 
			'</div>' + 
		'</div>';
}

function fillDenuncias (denuncias){
	
	var html = '';
	
	denuncias.forEach(function(denuncia){
		console.log(denuncia.likes);
		html += getDenunciaRow(denuncia);
	});
	
	$('#mis_denuncias > .panel-body').append(html);
	
};

function fillFavoritas (denuncias){
	
	var html = '';
	
	denuncias.forEach(function(denuncia){
		console.log(denuncia.likes);
		html += getDenunciaRow(denuncia, true);
	});
	
	$('#favoritas > .panel-body').append(html);
	
};

function getNotificacionRow(notificacion, trad){
	var fecha = new Date(notificacion.fecha);
	
	var color = notificacion.vista ? 'fff' : 'fff8e7';
	
	return '<div class="row">' + 
			'<div class="thumbnail container-fluid noti" style="margin: 5px; padding: 10 0 5 0px; overflow-x: hidden; background-color:' + color + ';" id_noti="' + notificacion.id_noti + '" vista="' + notificacion.vista + '" onclick="noti(this)">' + 
			'<p style="text-align:right; width: 100%; font-size: 0.85em; padding-right: 20px;">' + getFechaFormatted(fecha) + ' <i class="fa fa-clock-o"></i> </p>' + 																
			'<div class="media" style="margin : 0 20 0 20px;">' + 
				'<a class="media-left" style="width:100px; float:left;">' + 
					'<img onclick="window.open(&#39;/app/usuarios/' + notificacion.id_usuario_from + '&#39;)" src="' + notificacion.profile_from.picture + '" style="width: 100px; height: 100px;" class=" media-object img-circle img-thumbnail">' +
					'<img onclick="window.open(&#39;/app/denuncias/' + notificacion.id_denuncia + '?id_noti=' + notificacion.id_noti + '&#39;)" src="' + getGeoserverMiniatura(notificacion.denuncia, 100) + '" style="width: 100px; height: 100px;" class=" media-object img-thumbnail">' +
				'</a>' + 
				'<div class="media-body" style="padding: 30 20 30 20px; text-align: left; overflow-x: hidden; ">' + getInfoNotificacion(notificacion, trad) + '</div>'+ 
			'</div>' + 
			'<p style="clear: both; text-align:right; width: 100%; font-size: 0.85em; padding-right: 20px;">' + getIconoNotificacion(notificacion, trad) + '</p>' + 
		'</div>' + 
		'</div>';
}

function fillNotificaciones(notificaciones, trad){
	var html = '';
	notificaciones.forEach(function(notificacion){
		if(notificacion.tipo == 'REPLICA' && tokens_usados.indexOf(notificacion.datos.token) == -1){
			var token = notificacion.datos.token;
			var usuarios_conver = [];
			notificaciones.forEach(function(notii){
				if(notii.datos.token == token)
					usuarios_conver.push({_id : notii.id_usuario_to, profile : notii.profile_to});
			});
			tokens_usados.push(token);
			notificacion.usuarios_conver = usuarios_conver;
			html += getNotificacionRow(notificacion, trad);
		}
		else html += getNotificacionRow(notificacion, trad);
	});
	$('#notificaciones > .panel-body').append(html);
};

function getAccionRow(notificacion, trad){
	var fecha = new Date(notificacion.fecha);

	console.log(notificacion.id_noti, notificacion.tipo, notificacion.profile_to);

	return '<div class="row">' + 
		'<div class="thumbnail container-fluid" style="margin: 5px; padding: 10 0 5 0px; overflow-x: hidden; background-color:#fff;">' + 
		'<p style="text-align:right; width: 100%; font-size: 0.85em; padding-right: 20px;">' + getFechaFormatted(fecha) + ' <i class="fa fa-clock-o"></i> </p>' + 																
		'<div class="media" style="margin : 0 20 0 20px;">' + 
			'<a class="media-left" style="width:100px;">' + 
					'<img onclick="window.open(&#39;/app/usuarios/' + notificacion.id_usuario_to + '&#39;)" src="' + notificacion.profile_to.picture + '" style="width: 100px; height: 100px;" class=" media-object img-circle img-thumbnail">' +
					'<img onclick="window.open(&#39;/app/denuncias/' + notificacion.id_denuncia + '?id_noti=' + notificacion.id_noti + '&#39;)" src="' + getGeoserverMiniatura(notificacion.denuncia, 100) + '" style="width: 100px; height: 100px;" class=" media-object img-thumbnail">' +
			'</a>' +  
			'<div class="media-body" style="padding: 30 20 30 20px; text-align: left;overflow-x: hidden; ">' + getInfoAccion(notificacion, trad) + '</div>'+ 								
		'</div>' + 
		'<p style="clear: both; text-align:right; width: 100%; font-size: 0.85em; padding-right: 20px;">' + getIconoNotificacion(notificacion, trad) + '</p>' + 
		'</div>' + 
	'</div>';
}

function fillAcciones(acciones, trad){
	var html = '';
	tokens_usados = [];
	acciones.forEach(function(notificacion){
		if(notificacion.tipo == 'REPLICA' && notificacion.id_usuario_to == user._id){
			
		}
		else if(notificacion.tipo == 'REPLICA' && tokens_usados.indexOf(notificacion.datos.token) == -1){
			var token = notificacion.datos.token;
			var usuarios_conver = [];
			acciones.forEach(function(notii){
				if(notii.datos.token == token)
					usuarios_conver.push({_id : notii.id_usuario_to, profile : notii.profile_to});
			});
			tokens_usados.push(token);
			notificacion.usuarios_conver = usuarios_conver;
			html += getAccionRow(notificacion, trad);
		}
		else html += getAccionRow(notificacion, trad);
	});
	$('#acciones > .panel-body').append(html);
};