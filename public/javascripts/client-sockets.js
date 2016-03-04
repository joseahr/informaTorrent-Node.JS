var num_denuncias_io = io.connect("http://" + ip + ":3000/app/visor");

num_denuncias_io.emit('get_num_usuarios');

$('.noti').click(function(event){
	var vista = $(this).attr('vista');
	if(vista == 'true') return;
	var id_noti = $(this).attr('id_noti');
	console.log('hkgkhgkhg click');
	num_denuncias_io.emit('noti_vista', id_noti);
	
});

num_denuncias_io.on('imagen cambiá', function(data){
	alert(data.path);
});

function noti($this){
	var vista = $($this).attr('vista');
	if(vista == 'true') return;
	console.log('shsjhskjhsksjh FUNCION');
	var id_noti = $($this).attr('id_noti');
	
	num_denuncias_io.emit('noti_vista', id_noti);
	var vista = $($this).attr('vista', 'true');
}

num_denuncias_io.on('noti_vista_cb', function(data){
	// data == id_noti
	$("[id_noti='" + data +"']").attr('vista', 'true');
	$("[id_noti='" + data +"']").css('background-color', '#fff');
	//$("[id_noti_panel='" + data +"']").hide();
	
	var nuevas = parseInt($('.noti_up:eq(1)').text()) - 1;
	$('.noti_up').empty();
	$('.noti_up').append(nuevas);
	
});

num_denuncias_io.on('num_usuarios_conectados', function(data){
	$('#numusu').empty();
	$('#numusu').append('<i class="fa fa-user" style="margin-right: 5px;"></i>');
	$('#numusu').append(data.num_usuarios);
	//alert('usuarios connectados ' + data.num_usuarios);
});

num_denuncias_io.on('denuncia_no_likeada', function(data){
	data.noti = data.noti[1];
	data.noti.profile_from = data.from.profile;
	data.noti.denuncia = data.denuncia;
	console.log(JSON.stringify(data));
	var nuevas = parseInt($('.noti_up:eq(1)').text()) + 1;
	$('.noti_up').empty();
	$('.noti_up').append(nuevas);
	var not_tot = parseInt($('.noti_tot').text()) + 1;
	$('.noti_tot').empty();
	$('.noti_tot').append(not_tot);
	
	var html =  getNotificacionRow(data.noti);
	$('#notificaciones > .panel-body').prepend($(html));
	
	
	BootstrapDialog.show({
		title: 'Nueva notificación - Denuncia Dislike',
		message: $(html),
		buttons: [{label: 'Cerrar', action: function(dialog){dialog.close()}}],
		onshown: function(dialog){
			setTimeout(function(){dialog.close()}, 1500);
		}
	});
});


///////
num_denuncias_io.on('denuncia_likeada', function(data){
	data.noti = data.noti[1];
	data.noti.profile_from = data.from.profile;
	data.noti.denuncia = data.denuncia;
	console.log(JSON.stringify(data));
	var nuevas = parseInt($('.noti_up:eq(1)').text()) + 1;
	$('.noti_up').empty();
	$('.noti_up').append(nuevas);
	var not_tot = parseInt($('.noti_tot').text()) + 1;
	$('.noti_tot').empty();
	$('.noti_tot').append(not_tot);
	
	var html = getNotificacionRow(data.noti);
	$('#notificaciones > .panel-body').prepend($(html));
	
	
	BootstrapDialog.show({
		title: 'Nueva notificación - Denuncia Like',
		message: $(html),
		buttons: [{label: 'Cerrar', action: function(dialog){dialog.close()}}],
		onshown: function(dialog){
			//setTimeout(function(){dialog.close()}, 1500);
		}
	});
});

///////

num_denuncias_io.on('denuncia_cerca', function(data){
	console.log(JSON.stringify(data));
	//data.noti = data.noti[1];
	data.noti.profile_from = data.from.profile;
	data.noti.denuncia = data.denuncia;
	var nuevas = parseInt($('.noti_up:eq(1)').text()) + 1;
	$('.noti_up').empty();
	$('.noti_up').append(nuevas);
	var not_tot = parseInt($('.noti_tot').text()) + 1;
	$('.noti_tot').empty();
	$('.noti_tot').append(not_tot);
	
	var html = getNotificacionRow(data.noti);
	$('#notificaciones > .panel-body').prepend($(html));
	
	
	BootstrapDialog.show({
		title: 'Nueva notificación - Denuncia Cerca',
		message: $(html),
		buttons: [{label: 'Cerrar', action: function(dialog){dialog.close()}}],
		onshown: function(dialog){
			setTimeout(function(){dialog.close()}, 1500);
		}
	});
});

num_denuncias_io.on('denuncia_comentada', function(data){
	console.log(JSON.stringify(data));

	data.noti.denuncia = data.denuncia;
	data.noti.profile_from = data.from.profile;
	
	var nuevas = parseInt($('.noti_up:eq(1)').text()) + 1;
	$('.noti_up').empty();
	$('.noti_up').append(nuevas);
	var not_tot = parseInt($('.noti_tot').text()) + 1;
	$('.noti_tot').empty();
	$('.noti_tot').append(not_tot);
	
	var html = getNotificacionRow(data.noti);
	$('#notificaciones > .panel-body').prepend($(html));
	
	
	BootstrapDialog.show({
		title: 'Nueva notificación - Denuncia Comentada',
		message: $(html),
		buttons: [{label: 'Cerrar', action: function(dialog){dialog.close()}}],
		onshown: function(dialog){
			//setTimeout(function(){dialog.close()}, 1500);
		}
	});
	
});

num_denuncias_io.on('connect', function(socket){
	console.log(id_usuario);
	if(id_usuario != 'undefined')
		num_denuncias_io.emit('get_id_usuario', {id_usuario: id_usuario});
});

num_denuncias_io.on('new_denuncia', function(data){
	 var num = parseInt($('#numdenun').text());
	 var numhoy = parseInt($('#numdenunhoy').text());
	 //alert(num + ' ' + numhoy);
	 $('#numdenun').empty();
	 $('#numdenun').append(' ' + (num + 1));
	 
	 $('#numdenunhoy').empty();
	 $('#numdenunhoy').append(' ' + (numhoy + 1));
});