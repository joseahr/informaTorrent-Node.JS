var num_denuncias_io = io.connect(window.location.href.split(':')[1] + ":3000/app/visor");

var audio = new Audio('/files/audios/noti.mp3');

/*
==============================================================================================
CONEXIÓN CON EL SERVIDOR MEDIANTE WEB SOCKETS -- Socket.io
==============================================================================================
*/
//console.log(Cookies.get('locale'));
num_denuncias_io.on('connect', function(socket){
	// Emitimos evento para obtener el número de usuarios conectados
	num_denuncias_io.emit('get_num_usuarios');
	// Si el cliente está logeado
	if(id_usuario != 'undefined')
		// Emitimos eventos para identificar el socket abierto
		// con el usuario logeado
		num_denuncias_io.emit('get_id_usuario', {
			id_usuario: id_usuario, 
			locale : Cookies.get('locale') || 'es'
		});
});

/*
==============================================================================================
EMITIMOS EVENTOS DESDE EL CLIENTE
==============================================================================================
*/
// Cuando hagas click en una notificación
$('.noti').click(function(event){
	// Comprobamos si está vista o no
	var vista = $(this).attr('vista');
	// Si ya has visto la notificación salimos.
	if(vista == 'true') return;
	// Por el contrario emitimos un evento para notificar al servidor
	// de una notificación vista
	var id_noti = $(this).attr('id_noti');
	//console.log('hkgkhgkhg click');
	num_denuncias_io.emit('noti_vista', id_noti);
});
function noti($this){
	// Comprobamos si está vista o no
	var vista = $($this).attr('vista');
	// Si ya has vista la notificación salimos.
	if(vista == 'true') return;

	console.log('shsjhskjhsksjh FUNCION');
	var id_noti = $($this).attr('id_noti');
	// Por el contrario emitimos un evento para notificar al servidor
	// de una notificación vista
	num_denuncias_io.emit('noti_vista', id_noti);
	$($this).attr('vista', 'true');

};
/*
==============================================================================================
RECIBIMOS EVENTOS DEL SERVIDOR
==============================================================================================
*/
// Si hemos cambiado la imagen satisfactoriamente
num_denuncias_io.on('imagen cambiá', function(data){
	//alert(data.path);
	//TODO --> Cambiar imagen de los sockets abiertos
});

// Cuando el servidor nos devuelva el evento que 
// lanzamos para "poner como vista" una notificación
num_denuncias_io.on('noti_vista_cb', function(data){
	// data == id_noti
	// Cambiamos el aspecto de la notificción a "vista"
	$("[id_noti='" + data +"']").attr('vista', 'true');
	$("[id_noti='" + data +"']").css('background-color', '#fff');
	//$("[id_noti_panel='" + data +"']").hide();
	
	// Cambiamos el número de notificaciones
	var nuevas = parseInt($('.noti_up:eq(1)').text()) - 1;
	$('.noti_up').empty();
	$('.noti_up').append(nuevas);
	$('#nuevas').empty().append(' ' + nuevas + ' ');

	// POnemos como vista la notificación en la lista
	if(notificaciones)
		notificaciones.forEach(function(n){
			if(n.id_noti == data)
				n.vista = true;
		});
	
});

// Cuando nos devuelva el evento que lanzamos para 
// obtener el número de usuarios conectados
// También se revibe al conectarse o deconectarse 
// un usuario
num_denuncias_io.on('num_usuarios_conectados', function(data){
	// Cambiamos el número de usuarios conectados
	$('#numusu').empty();
	$('#numusu').append('<i class="fa fa-user" style="margin-right: 5px;"></i>');
	$('#numusu').append(data.num_usuarios);
	//alert('usuarios connectados ' + data.num_usuarios);
});

// Un usuario ha indicado que ya no le gusta nuestra denuncia
// recibimos este evento
num_denuncias_io.on('denuncia_no_likeada', function(data){

	audio.play();

	// Notificamos al usuario de la denuncia de ello
	// Alertamos de una notificación
	//data.noti = data.noti[1];
	data.noti.profile_from = data.from.profile;
	data.noti.denuncia = data.denuncia;

	console.log(JSON.stringify(data));
	// Sumamos en uno las notificaciones nuevas
	var nuevas = parseInt($('.noti_up:eq(1)').text()) + 1;
	$('.noti_up').empty();
	$('.noti_up').append(nuevas);
	// Sumamos en uno las notificaciones totales
	var not_tot = parseInt($('.noti_tot').text()) + 1;
	$('.noti_tot').empty();
	$('.noti_tot').append(not_tot);
	
	// Ponemos la notificación al principio de nuestra 
	// lista de notificaciones
	var html =  getNotificacionRow(data.noti, traducciones);
	$(html).prependTo($('#notificaciones > .panel-body'));
	$('#notificaciones > .panel-body').find('p.lead').prependTo($('#notificaciones > .panel-body'));
	// Insertamos la notificación al principio de nuestro
	// array de notificaciones
	if(notificaciones) notificaciones.unshift(data.noti);
	
	/*BootstrapDialog.show({
		title: 'Nueva notificación - Denuncia Dislike',
		message: $(html),
		buttons: [{label: 'Cerrar', action: function(dialog){dialog.close()}}],
		onshown: function(dialog){
			setTimeout(function(){dialog.close()}, 1500);
		}
	});*/
});

//Un usuario ha indicado que le gusta nuestra denuncia
// recibimos este evento
num_denuncias_io.on('denuncia_likeada', function(data){

	audio.play();

	//data.noti = data.noti[1];
	data.noti.profile_from = data.from.profile;
	data.noti.denuncia = data.denuncia;

	console.log(JSON.stringify(data));
	// Sumamos en uno las notificaciones nuevas
	var nuevas = parseInt($('.noti_up:eq(1)').text()) + 1;
	$('.noti_up').empty();
	$('.noti_up').append(nuevas);
	// Sumamos en uno las notificaciones totales
	var not_tot = parseInt($('.noti_tot').text()) + 1;
	$('.noti_tot').empty();
	$('.noti_tot').append(not_tot);
	
	// Insertamos la notificación al principio de la lista
	// de notificaciones
	var html = getNotificacionRow(data.noti, traducciones);
	$(html).prependTo($('#notificaciones > .panel-body'));
	$('#notificaciones > .panel-body').find('p.lead').prependTo($('#notificaciones > .panel-body'));
	
	// Insertamos la notificación al principio de el array 
	// de notificaciones
	if(notificaciones) notificaciones.unshift(data.noti);

	/*BootstrapDialog.show({
		title: 'Nueva notificación - Denuncia Like',
		message: $(html),
		buttons: [{label: 'Cerrar', action: function(dialog){dialog.close()}}],
		onshown: function(dialog){
			//setTimeout(function(){dialog.close()}, 1500);
		}
	});*/
});

// Un usuario ha publicado una denuncia cerca de 
// nuestra ubicación
num_denuncias_io.on('denuncia_cerca', function(data){

	audio.play();
	//console.log(JSON.stringify(data));
	//data.noti = data.noti[1];
	data.noti.profile_from = data.from.profile;
	data.noti.denuncia = data.denuncia;
	// Aumentamos en uno las notificaciones nuevas
	var nuevas = parseInt($('.noti_up:eq(1)').text()) + 1;
	$('.noti_up').empty();
	$('.noti_up').append(nuevas);
	// Aumentamos en uno las notificaciones totales
	var not_tot = parseInt($('.noti_tot').text()) + 1;
	$('.noti_tot').empty();
	$('.noti_tot').append(not_tot);
	
	// Insertamos la notificación en la lista de notificaciones
	var html = getNotificacionRow(data.noti, traducciones);
	$(html).prependTo($('#notificaciones > .panel-body'));
	$('#notificaciones > .panel-body').find('p.lead').prependTo($('#notificaciones > .panel-body'));
	
	// Insertamos la notificación en el array de notificaciones
	if(notificaciones) notificaciones.unshift(data.noti);
	
	/*BootstrapDialog.show({
		title: 'Nueva notificación - Denuncia Cerca',
		message: $(html),
		buttons: [{label: 'Cerrar', action: function(dialog){dialog.close()}}],
		onshown: function(dialog){
			setTimeout(function(){dialog.close()}, 1500);
		}
	});*/
});

// Un usuario ha comentado nuestra denuncia
num_denuncias_io.on('denuncia_comentada', function(data){

	audio.play();
	console.log(JSON.stringify(data));

	data.noti.denuncia = data.denuncia;
	data.noti.profile_from = data.from.profile;
	
	// Aumentamos en uno las notificaciones nuevas
	var nuevas = parseInt($('.noti_up:eq(1)').text()) + 1;
	$('.noti_up').empty();
	$('.noti_up').append(nuevas);
	// Aumentamos en uno las notificaciones totales
	var not_tot = parseInt($('.noti_tot').text()) + 1;
	$('.noti_tot').empty();
	$('.noti_tot').append(not_tot);
	
	// Insertamos la notificacion al principio de la lista de notificaciones
	var html = getNotificacionRow(data.noti, traducciones);
	$(html).prependTo($('#notificaciones > .panel-body'));
	$('#notificaciones > .panel-body').find('p.lead').prependTo($('#notificaciones > .panel-body'));
	
	// Insertamos la notificacion al principio del array de notificaciones
	if(notificaciones) notificaciones.unshift(data.noti);
	/*BootstrapDialog.show({
		title: 'Nueva notificación - Denuncia Comentada',
		message: $(html),
		buttons: [{label: 'Cerrar', action: function(dialog){dialog.close()}}],
		onshown: function(dialog){
			//setTimeout(function(){dialog.close()}, 1500);
		}
	});*/
	
});

num_denuncias_io.on('replica', function(data){

	audio.play();
	console.log(JSON.stringify(data));

	data.noti.denuncia = data.denuncia;
	data.noti.profile_from = data.from.profile;
	
	// Aumentamos en uno las notificaciones nuevas
	var nuevas = parseInt($('.noti_up:eq(1)').text()) + 1;
	$('.noti_up').empty();
	$('.noti_up').append(nuevas);
	// Aumentamos en uno las notificaciones totales
	var not_tot = parseInt($('.noti_tot').text()) + 1;
	$('.noti_tot').empty();
	$('.noti_tot').append(not_tot);
	
	// Insertamos la notificacion al principio de la lista de notificaciones
	var html = getNotificacionRow(data.noti, traducciones);
	$(html).prependTo($('#notificaciones > .panel-body'));
	$('#notificaciones > .panel-body').find('p.lead').prependTo($('#notificaciones > .panel-body'));
	
	// Insertamos la notificacion al principio del array de notificaciones
	if(notificaciones) notificaciones.unshift(data.noti);
	/*BootstrapDialog.show({
		title: 'Nueva notificación - Denuncia Comentada',
		message: $(html),
		buttons: [{label: 'Cerrar', action: function(dialog){dialog.close()}}],
		onshown: function(dialog){
			//setTimeout(function(){dialog.close()}, 1500);
		}
	});*/
	
});

// Alguien ha publicado una denuncia
num_denuncias_io.on('new_denuncia', function(data){
	// Aumentamos en uno el número de notificaciones totales
	var num = parseInt($('#numdenun').text());
	$('#numdenun').empty();
	$('#numdenun').append(' ' + (num + 1));
	// Aumentamos en uno el número de notificaciones realizadas hoy
	var numhoy = parseInt($('#numdenunhoy').text());
	$('#numdenunhoy').empty();
	$('#numdenunhoy').append(' ' + (numhoy + 1));
});