// Eliminar una denuncia
function eliminar(id){
	//alert(id);
	BootstrapDialog.show({
		title: 'Eliminar denuncia ID ' + id,
		message: '¿Estás seguro de eliminar esta denuncia?',
		type: BootstrapDialog.TYPE_INFO,
		buttons: [
			{label: 'Aceptar', action: function(dialog){
				$.get('/app/eliminar?id=' + id,
				function(res){
					dialog.close();
					$('#' + id).remove();
					$('#has_realizado').html((parseInt($('#has_realizado').html()) -1) + ' ');
					BootstrapDialog.alert(res);
				});
			}}, 
			{label: 'Cancelar', action: function(dialog){dialog.close();}}
		]
	});
}

// Obtener Imagen miniatura de geoserver
function getGeoserverMiniatura(denuncia, width){
	
	tipo = denuncia.tipo;
	coords = denuncia.coordenadas;
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
	return "http://" + ip + ":8080/geoserver/jahr/wms?service=WMS&version=1.1.0&request=GetMap" +
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

function getIconoNotificacion(noti){
	var tipo = noti.tipo;
	var html='IR A DENUNCIA ' + '<a target="_blank" href="/app/denuncia/' + noti.denuncia.gid + '"><span class="fa-stack fa-lg">' +
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

function getInfoNotificacion(noti){
	var id_usuario_from = noti.id_usuario_from;
	var username = noti.profile_from.username;
	if(noti.tipo == 'DENUNCIA_CERCA'){
		return '<p><a href="/app/usuarios/' + noti.id_usuario_from + '">' + username + '</a> ' +
				'publicó una denuncia cerca de tu ubicación</p><p>Distancia : ' + noti.datos.distancia.toFixed(3) + ' metros</p>' +
				'<div style="word-break: break-all">Denuncia : ' + noti.denuncia.titulo + '</div>';
	}
	else if(noti.tipo == 'COMENTARIO_DENUNCIA'){
		return '<p><a href="/app/usuarios/' + noti.id_usuario_from + '">' + username + '</a> ' +
				'comentó: <div style="word-break: break-all">"' + decodeURIComponent(noti.datos.contenido).substring(0,20)  + '..."</div> en tu denuncia</p>' + 
				'<div style="word-break: break-all">Denuncia : ' + noti.denuncia.titulo + '</div>';
	}
	else if(noti.tipo == 'LIKE_DENUNCIA'){
		return '<p><a href="/app/usuarios/' + noti.id_usuario_from + '">' + username + '</a> ' +
				'ha indicado que le gusta tu denuncia</p>' + 
				'<div style="word-break: break-all">Denuncia : ' + noti.denuncia.titulo + '</div>';			
	}
	else if(noti.tipo === 'NO_LIKE_DENUNCIA'){
		return '<p><a href="/app/usuarios/' + noti.id_usuario_from + '">' + username + '</a> ' +
				'ha indicado que ya no le gusta tu denuncia</p>' + 
				'<div style="word-break: break-all">Denuncia : ' + noti.denuncia.titulo + '</div>';			
	}		
}

function getInfoAccion(noti){
	var id_usuario_to = noti.id_usuario_to;
	var username = noti.profile_to.username;
	if(noti.tipo == 'DENUNCIA_CERCA'){
		return '<p>Has publicado una denuncia cerca de <a href="/app/usuarios/' + id_usuario_to + '">' + username + '</a></p>' +
				'<p>Distancia : ' + noti.datos.distancia.toFixed(3) + ' metros</p>' +
				'<div style="word-break: break-all">Denuncia : ' + noti.denuncia.titulo + '</div>';
	}
	else if(noti.tipo == 'COMENTARIO_DENUNCIA'){
		return '<p>Comentaste: <i>"' + decodeURIComponent(noti.datos.contenido).substring(0,20)  + '..."</i> en la denuncia de ' +
			'<a href="/app/usuarios/' + id_usuario_to + '">' + username + '</a></p>' + 
			'<div style="word-break: break-all">Denuncia : ' + noti.denuncia.titulo + '</div>';
	}
	else if(noti.tipo == 'LIKE_DENUNCIA'){
		return '<p>Te ha gustado la denuncia de <a href="/app/usuarios/' + id_usuario_to + '">' + username + '</a></p>' +
			'<div style="word-break: break-all">Denuncia : ' + noti.denuncia.titulo + '</div>';		
	}
	else if(noti.tipo === 'NO_LIKE_DENUNCIA'){
		return '<p>Indicaste que ya no te gusta la denuncia de <a href="/app/usuarios/' + id_usuario_to + '">' + username + '</a></p>' +
			'<div style="word-break: break-all">Denuncia : ' + noti.denuncia.titulo + '</div>';			
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
		menu = '<a target="_blank" href="/app/denuncia/' + id + '" style="margin: 0px auto;">' + icono('fa-eye', '#55acee') + '</a>' +
				'<a target="_blank" href="/app/editar?id=' + id + '" style="margin: 0px auto;">' + icono('fa-edit', '#ec971f') + '</a>' +
				'<a id="' + id + '" onclick="eliminar(this.id)" href="#" style="margin: 0px auto;">' + icono('fa-trash', '#d9534f') + '</a>';
	}
	else {
		menu = '<a target="_blank" href="/app/denuncia/' + id + '" style="margin: 0px auto;">' + icono('fa-eye', '#55acee') + '</a>' +
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
					'<img id="imagenes_denuncia" class="img img-responsive" src="' +  getGeoserverMiniatura(denuncia, 1200) + '" style="border-top-right-radius: 10px;border-top-left-radius: 10px; float:left;height: 300px; object-fit: cover; margin-top: 20px; padding: 0px; width: 100%;"></img>' +
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

function getNotificacionRow(notificacion){
	var fecha = new Date(notificacion.fecha);
	
	var color = notificacion.vista ? 'fff' : 'fff8e7';
	
	return '<div class="row">' + 
			'<div class="thumbnail container-fluid noti" style="margin: 5px; padding: 10 0 5 0px; overflow-x: hidden; background-color:' + color + ';" id_noti="' + notificacion.id_noti + '" vista="' + notificacion.vista + '" onclick="noti(this)">' + 
			'<p style="text-align:right; width: 100%; font-size: 0.85em; padding-right: 20px;">' + getFechaFormatted(fecha) + ' <i class="fa fa-clock-o"></i> </p>' + 																
			'<div class="media" style="margin : 0 20 0 20px;">' + 
				'<a class="media-left" style="width:100px; float:left;">' + 
					'<img onclick="window.open(&#39;/app/usuarios/' + notificacion.id_usuario_from + '&#39;)" src="' + notificacion.profile_from.picture + '" style="width: 100px; height: 100px;" class=" media-object img-circle img-thumbnail">' +
					'<img onclick="window.open(&#39;/app/denuncia/' + notificacion.denuncia.gid + '&#39;)" src="' + getGeoserverMiniatura(notificacion.denuncia, 100) + '" style="width: 100px; height: 100px;" class=" media-object img-thumbnail">' +
				'</a>' + 
				'<div class="media-body" style="padding: 30 20 30 20px; text-align: left; word-wrap: break-word; break-word: keep-all;">' + getInfoNotificacion(notificacion) + '</div>'+ 
			'</div>' + 
			'<p style="text-align:right; width: 100%; font-size: 0.85em; padding-right: 20px;">' + getIconoNotificacion(notificacion) + '</p>' + 
		'</div>' + 
		'</div>';
}

function fillNotificaciones(notificaciones){
	var html = '';
	notificaciones.forEach(function(notificacion){
		console.log(JSON.stringify(notificacion));
		
		html += getNotificacionRow(notificacion);
	});
	$('#notificaciones > .panel-body').append(html);
};

function getAccionRow(notificacion){
	var fecha = new Date(notificacion.fecha);

	console.log(noti.id_denuncia);

	return '<div class="row">' + 
		'<div class="thumbnail container-fluid" style="margin: 5px; padding: 10 0 5 0px; overflow-x: hidden; background-color:#fff;">' + 
		'<p style="text-align:right; width: 100%; font-size: 0.85em; padding-right: 20px;">' + getFechaFormatted(fecha) + ' <i class="fa fa-clock-o"></i> </p>' + 																
		'<div class="media" style="margin : 0 20 0 20px;">' + 
			'<a class="media-left" style="width:100px;">' + 
				'<img onclick="window.open(&#39;/app/usuarios/' + notificacion.id_usuario_to + '&#39;)" src="' + notificacion.profile_to.picture + '" style="width: 100px; height: 100px;" class=" media-object img img-responsive img-circle img-thumbnail">' +
				'<img onclick="window.open(&#39;/app/denuncia/' + notificacion.denuncia.gid + '&#39;)" src="' + getGeoserverMiniatura(notificacion.denuncia, 100) + '" style="width: 100px; height: 100px;" class=" media-object img img-responsive img-thumbnail">' +
			'</a>' +  
			'<div class="media-body" style="padding: 30 20 30 20px; text-align: left;word-wrap: break-word; break-word: keep-all;">' + getInfoAccion(notificacion) + '</div>'+ 								
		'</div>' + 
		'<p style="text-align:right; width: 100%; font-size: 0.85em; padding-right: 20px;">' + getIconoNotificacion(notificacion) + '</p>' + 
		'</div>' + 
	'</div>';
}

function fillAcciones(acciones){
	var html = '';
	acciones.forEach(function(notificacion){

		html += getAccionRow(notificacion);
	});
	$('#acciones > .panel-body').append(html);
};

function getCarouselModalDenuncia (denuncia) {
	var html = $('<div class="carousel-inner" style="height: 100%;"></div>');

	html.append('<div class="item active">' +
  		'<img src="' + getGeoserverMiniatura(denuncia, 1200) + '" style="padding: 20 0 20 0px;" alt="Detalle Denuncia"/>' +
  	'</div>');
	
	if (denuncia.imagenes)
		denuncia.imagenes.forEach(function(img){
			html.append('<div class="item">' +
  				'<img src="' + img.path + '" alt="' + img.path + '" style="padding: 20 0 20 0px;" />' +
  			'</div>');
		});
	return html;
}