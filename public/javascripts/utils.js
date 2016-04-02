 var ip = window.location.href.toString().split(':' + window.location.port)[0] + ':8001';
// Eliminar una denuncia
function eliminar(id){
	//alert(id);
	BootstrapDialog.show({
		title: 'Eliminar denuncia ID ' + id,
		message: '¿Estás seguro de eliminar esta denuncia?',
		type: BootstrapDialog.TYPE_INFO,
		buttons: [
			{label: 'Aceptar', action: function(dialog){
				$.post('/app/denuncia?id=' + id + '&action=delete',
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
				'<div style="overflow-x: hidden">Denuncia : ' + noti.denuncia.titulo + '</div>';
	}
	else if(noti.tipo == 'COMENTARIO_DENUNCIA'){
		return '<p><a href="/app/usuarios/' + noti.id_usuario_from + '">' + username + '</a> ' +
				'comentó: <div style="overflow-x: hidden">"' + decodeURIComponent(noti.datos.contenido).substring(0,20)  + '..."</div> en tu denuncia</p>' + 
				'<div style="overflow-x: hidden">Denuncia : ' + noti.denuncia.titulo + '</div>';
	}
	else if(noti.tipo == 'LIKE_DENUNCIA'){
		return '<p><a href="/app/usuarios/' + noti.id_usuario_from + '">' + username + '</a> ' +
				'ha indicado que le gusta tu denuncia</p>' + 
				'<div style="overflow-x: hidden">Denuncia : ' + noti.denuncia.titulo + '</div>';			
	}
	else if(noti.tipo === 'NO_LIKE_DENUNCIA'){
		return '<p><a href="/app/usuarios/' + noti.id_usuario_from + '">' + username + '</a> ' +
				'ha indicado que ya no le gusta tu denuncia</p>' + 
				'<div style="overflow-x: hidden">Denuncia : ' + noti.denuncia.titulo + '</div>';			
	}		
}

function getInfoAccion(noti){
	var id_usuario_to = noti.id_usuario_to;
	var username = noti.profile_to.username;
	if(noti.tipo == 'DENUNCIA_CERCA'){
		return '<p>Has publicado una denuncia cerca de <a href="/app/usuarios?id=' + id_usuario_to + '">' + username + '</a></p>' +
				'<p>Distancia : ' + noti.datos.distancia.toFixed(3) + ' metros</p>' +
				'<div style="overflow-x: hidden">Denuncia : ' + noti.denuncia.titulo + '</div>';
	}
	else if(noti.tipo == 'COMENTARIO_DENUNCIA'){
		return '<p>Comentaste: <i>"' + decodeURIComponent(noti.datos.contenido).substring(0,20)  + '..."</i> en la denuncia de ' +
			'<a href="/app/usuarios?id=' + id_usuario_to + '">' + username + '</a></p>' + 
			'<div style="overflow-x: hidden">Denuncia : ' + noti.denuncia.titulo + '</div>';
	}
	else if(noti.tipo == 'LIKE_DENUNCIA'){
		return '<p>Te ha gustado la denuncia de <a href="/app/usuarios?id=' + id_usuario_to + '">' + username + '</a></p>' +
			'<div style="overflow-x: hidden">Denuncia : ' + noti.denuncia.titulo + '</div>';		
	}
	else if(noti.tipo === 'NO_LIKE_DENUNCIA'){
		return '<p>Indicaste que ya no te gusta la denuncia de <a href="/app/usuarios?id=' + id_usuario_to + '">' + username + '</a></p>' +
			'<div style="overflow-x: hidden">Denuncia : ' + noti.denuncia.titulo + '</div>';			
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
		menu = '<a target="_blank" href="/app/denuncia?id=' + id + '" style="margin: 0px auto;">' + icono('fa-eye', '#55acee') + '</a>' +
				'<a target="_blank" href="/app/denuncia?id=' + id + '&action=get_edit_page" style="margin: 0px auto;">' + icono('fa-edit', '#ec971f') + '</a>' +
				'<a id="' + id + '" onclick="eliminar(this.id)" href="#" style="margin: 0px auto;">' + icono('fa-trash', '#d9534f') + '</a>';
	}
	else {
		menu = '<a target="_blank" href="/app/denuncia?id=' + id + '" style="margin: 0px auto;">' + icono('fa-eye', '#55acee') + '</a>' +
				'<a target="_blank" href="/app/usuarios?id=' + denuncia.usuario[0]._id + '" style="margin: 0px auto;">' + 
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

function getNotificacionRow(notificacion){
	var fecha = new Date(notificacion.fecha);
	
	var color = notificacion.vista ? 'fff' : 'fff8e7';
	
	return '<div class="row">' + 
			'<div class="thumbnail container-fluid noti" style="margin: 5px; padding: 10 0 5 0px; overflow-x: hidden; background-color:' + color + ';" id_noti="' + notificacion.id_noti + '" vista="' + notificacion.vista + '" onclick="noti(this)">' + 
			'<p style="text-align:right; width: 100%; font-size: 0.85em; padding-right: 20px;">' + getFechaFormatted(fecha) + ' <i class="fa fa-clock-o"></i> </p>' + 																
			'<div class="media" style="margin : 0 20 0 20px;">' + 
				'<a class="media-left" style="width:100px; float:left;">' + 
					'<img onclick="window.open(&#39;/app/usuarios?id=' + notificacion.id_usuario_from + '&#39;)" src="' + notificacion.profile_from.picture + '" style="width: 100px; height: 100px;" class=" media-object img-circle img-thumbnail">' +
					'<img onclick="window.open(&#39;/app/denuncia?id=' + notificacion.denuncia.gid + '&#39;)" src="' + getGeoserverMiniatura(notificacion.denuncia, 100) + '" style="width: 100px; height: 100px;" class=" media-object img-thumbnail">' +
				'</a>' + 
				'<div class="media-body" style="padding: 30 20 30 20px; text-align: left; overflow-x: hidden; ">' + getInfoNotificacion(notificacion) + '</div>'+ 
			'</div>' + 
			'<p style="clear: both; text-align:right; width: 100%; font-size: 0.85em; padding-right: 20px;">' + getIconoNotificacion(notificacion) + '</p>' + 
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
				'<img onclick="window.open(&#39;/app/usuarios?id=' + notificacion.id_usuario_to + '&#39;)" src="' + notificacion.profile_to.picture + '" style="width: 100px; height: 100px;" class=" media-object img img-responsive img-circle img-thumbnail">' +
				'<img onclick="window.open(&#39;/app/denuncia?id=' + notificacion.denuncia.gid + '&#39;)" src="' + getGeoserverMiniatura(notificacion.denuncia, 100) + '" style="width: 100px; height: 100px;" class=" media-object img img-responsive img-thumbnail">' +
			'</a>' +  
			'<div class="media-body" style="padding: 30 20 30 20px; text-align: left;overflow-x: hidden; ">' + getInfoAccion(notificacion) + '</div>'+ 								
		'</div>' + 
		'<p style="clear: both; text-align:right; width: 100%; font-size: 0.85em; padding-right: 20px;">' + getIconoNotificacion(notificacion) + '</p>' + 
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


/*
===============================
== DIALOGS DE AYUDA DE MAPAS == 
===============================
*/

function showDialogIfCookie(title, messages, cookie){
	// Los dialogs tendrán varios mensajes que podremos ir tirando palante y patrás
	// Identifica el mensaje actual
	var message_id = 0,
	change = function(dialog_){
		var input = $(dialog_.getModalBody()).find('input');
		input.change(function(){
			console.log('change');
			Cookies.set(cookie, input.prop('checked'));
		});
	},
	check = function(actual){
		return '<div class="container-fluid col-lg-12" style="float : left; margin-top : 10px;"><input class="modal-check" type="checkbox"/> No volver a mostrar' + 
			'<div style="float : right; padding : 0 5 0 5px;">' + 
				actual + '/' + messages.length + 
			'</div>' + 
		'</div>';
	}
	// Instancia del dialog que vamos a mostrar
	var dialog = new BootstrapDialog({
		title : title,
		message : messages[message_id],
		buttons : [{
			id : 'btn-1',
			label : 'Anterior',
			action : function(dialog_){
				if(message_id == 0) return;
				message_id -= 1;
				dialog_.setMessage(messages[message_id] + check(message_id + 1));
				if(message_id == 0) this.disable();
				dialog_.getButton('btn-2').enable();
				change(dialog_);
			}
		},
		{
			id : 'btn-2',
			label : 'Siguiente',
			action : function(dialog_){
				if(message_id == messages.length - 1) return;
				message_id += 1;
				dialog_.setMessage(messages[message_id] + check(message_id + 1));
				if(message_id == messages.length - 1) this.disable();
				dialog_.getButton('btn-1').enable();
				change(dialog_);
			}
		}
		],
		onshow : function(dialog_){$(dialog_.getModalHeader()).css('background', '#43bf04')},
		onshown : function(dialog_){
			dialog_.getButton('btn-1').disable();
			dialog_.setMessage(dialog_.getMessage() + check(message_id + 1));
			change(dialog_);
		}
	});
	// Obtenemos la cookie a partir del nombre 'cookie' que le demos
	// Cada dialog tendrá una diferente
	var hayCookie = Cookies.get(cookie);

	// 
	if (hayCookie && hayCookie == "true") {
		// No mostrar el dialog
		console.log('No mostramos el dialog, ha indicado anteriormente que no quiere verlo mas', hayCookie);
    }
    else{
    	dialog.open();
    	console.log('mostramos el dialog', hayCookie);
    }
};

var ayuda_visor_app = function(){
	var title = 'Visor en Tiempo Real',
	cookie_nombre = 'visor_app_',
	messages = [
		// Primer mensaje de ayuda
		'<div class="container-fluid">' + 
			'<h4>Controles básicos del mapa</h4>' + 
			'<p style="font-weight : bold">Panel lateral de usuario</p>' + 
			'<p>Haciendo click en el botón que contiene nuestra imagen de usuario se desplegará un menú lateral con las opciones que podemos llevar a cabo.</p>' + 
			'<img class="col-lg-12 img-thumbnail" src="/files/images/ayuda_mapas/visor_app/8.PNG" style="object-fit : cover; padding : 0px;"></img>' + 
		'</div>',
		// Primer mensaje de ayuda
		'<div class="container-fluid">' + 
			'<h4>Controles básicos del mapa</h4>' + 
			'<p style="font-weight : bold">Control de capas</p>' + 
			'<img src="/files/images/ayuda_mapas/visor_app/10.PNG" class="img-thumbnail" style="float : left; margin-right : 10px;"></img>' + 
			'<p>Clicando en el icono accederás a un menú con todas las capas disponibles en el visor.</p>' + 
			'<p>Podrás cambiar la visibilidad de las capas y consultar la leyenda.</p>' + 
			'<img class="col-lg-12 img-thumbnail" src="/files/images/ayuda_mapas/visor_app/11.PNG" style="object-fit : cover; padding : 0px;"></img>' + 
		'</div>', 
		// Segundo mensaje de ayuda
		'<div class="container-fluid">' + 
			'<h4>Controles básicos del mapa</h4>' + 
			'<p style="font-weight : bold">Localizar calle por su nombre</p>' + 
			'<p>Este control sirve para localizar la ubicación de una dirección.</p>' + 
			'<p>Utiliza el servicio de geolocalización de OpenStreetMaps.</p>' + 
			'<img class="col-lg-12 img-thumbnail" src="/files/images/ayuda_mapas/visor_app/2.PNG" style="object-fit : cover; padding : 0px;"></img>' + 
		'</div>', 
		// Tercer mensaje de ayuda
		'<div class="container-fluid">' + 
			'<h4>Controles básicos del mapa</h4>' + 
			'<p style="font-weight : bold">Localizar mi posición en el mapa</p>' + 
			'<p>Clicando en el botón <i class="fa fa-eye"></i> podrás visualizar tu posición en el mapa.</p>' + 
			'<p>Asegúrate que las opciones de localización de tu dispositivo están activadas.</p>' + 
			'<p>La posición se irá actualizando cada vez que cambie o cambie la precisión.</p>' + 
			'<p>Para finalizar de "hacer tracking" de tu posición simplemente vuelve a darle al icono.</p>' + 
			'<img class="col-lg-12 img-thumbnail" src="/files/images/ayuda_mapas/visor_app/3.PNG" style="object-fit : cover; padding : 0px;"></img>' + 
		'</div>', 
		// Cuarto mensaje de ayuda
		'<div class="container-fluid">' + 
			'<h4>Controles básicos del mapa</h4>' + 
			'<p style="font-weight : bold">Seleccionar denuncias</p>' + 
			'<p>Si haces click en la imagen podrás ver las imágenes que contiene la denuncia.</p>' + 
			'<p>Al hacer click sobre una denuncia en el mapa se abrirá un diálogo donde se mostrará parte de la información de la denuncia.</p>' + 
			'<p>Para ir a la página de la denuncia, haz click en el botón "IR" situado al final del diálogo.</p>' + 
			'<img class="col-lg-12 img-thumbnail" src="/files/images/ayuda_mapas/visor_app/4.PNG" style="object-fit : cover; padding : 0px;"></img>' + 
		'</div>', 
		// Cinco mensaje de ayuda
		'<div class="container-fluid">' + 
			'<h4>Controles básicos del mapa</h4>' + 
			'<p style="font-weight : bold">Denuncias cerca de mi posición</p>' + 
			'<p>Este control sirve para mostrar las denuncias cercanas a la posición en la que nos situamos.</p>' + 
			'<img src="/files/images/ayuda_mapas/visor_app/5.PNG" class="img-thumbnail" style="float : left; margin : 0 10 10 0px; "></img>' + 
			'<p>Las denuncias cercanas se pueden ver clicando en el botón <i class="fa fa-bullhorn"></i> que aperece al activar el control.</p>' + 
			'<p>La posición se irá actualizando cada vez que cambie o cambie la precisión así como las denuncias que están a menos de 100 metros de esa posición.</p>' + 
			'<p>Para finalizar de "hacer tracking" de tu posición simplemente vuelve a darle al icono.</p>' +
			'<img class="col-lg-12 img-thumbnail" src="/files/images/ayuda_mapas/visor_app/6.PNG" style="object-fit : cover; padding : 0px;"></img>' + 
		'</div>', 
		// Sexto mensaje de ayuda
		'<div class="container-fluid">' + 
			'<h4>Controles básicos del mapa</h4>' + 
			'<p style="font-weight : bold">Buscar denuncias según criterios</p>' + 
			'<p>Este control sirve para mostrar en el mapa las denuncias que coinciden con nuestros criterios de búsqueda.</p>' + 
			'<p>Para acceder al diálogo de búsqueda haz click en el icono <i class="fa fa-search"></i></p>' + 
			'<p>El control de buscar por BBOX no está disponible para dispositivos móviles de momento.</p>' +
			'<img class="col-lg-12 img-thumbnail" src="/files/images/ayuda_mapas/visor_app/7.PNG" style="object-fit : cover; padding : 0px;"></img>' + 
		'</div>',
	];

	showDialogIfCookie(title, messages, cookie_nombre);
}