var num_denuncias_io = io.connect("http://" + ip + ":3000/app/visor");

num_denuncias_io.emit('get_num_usuarios');

$('.noti').click(function(event){
	var vista = $(this).attr('vista');
	if(vista == 'true') return;
	var id_noti = $(this).attr('id_noti');
	
	num_denuncias_io.emit('noti_vista', id_noti);
	
});

function noti($this){
	var vista = $($this).attr('vista');
	if(vista == 'true') return;
	var id_noti = $($this).attr('id_noti');
	
	num_denuncias_io.emit('noti_vista', id_noti);	
}

num_denuncias_io.on('noti_vista_cb', function(data){
	// data == id_noti
	$("[id_noti='" + data +"']").attr('vista', 'true');
	$("[id_noti_panel='" + data +"']").hide();
	
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

num_denuncias_io.on('denuncia_cerca', function(data){
	alert('data denuncia: ' + JSON.stringify(data.denuncia) + 
			  'from: ' + JSON.stringify(data.from) + ' noti: ' + JSON.stringify(data.noti));
	var nuevas = parseInt($('.noti_up:eq(1)').text()) + 1;
	$('.noti_up').empty();
	$('.noti_up').append(nuevas);
	var not_tot = parseInt($('.noti_tot').text()) + 1;
	$('.noti_tot').empty();
	$('.noti_tot').append(not_tot);
	
	var html = '<div class="row noti" style="margin: 0 5 10 5px; background: rgba(0,50,187,0.1); padding:5%;" id_noti="' + data.noti.id_noti + '" vista="false" onclick="noti(this)">' + 
				'<div class="col-lg-12 btn btn-danger" style="margin-bottom: 10px" id_noti_panel="' + data.noti.id_noti + '">NUEVA</div>' +
				'<div class="col-xs-2">'+
				'<a target="_blank" href="/app/usuarios/' + data.from._id + '">' + 
				'<img class="img-responsive img-thumbnail img-circle" src="' + data.from.profile.picture + '">' + 
				'</a>' +
				'<span class="fa-stack fa-lg">'+
				'<i class="fa fa-circle fa-stack-2x" style="color: #339BEB;"/>' +
				'<i class="fa fa-map-marker fa-stack-1x fa-inverse"/>' +
				'</span>' + 
				'</div>' + // col-xs-2
				'<div class="col-xs-10">'+ 
				'<div class="col-lg-12"><p class="lead">'+ new Date().getDate() + '/' + (new Date().getMonth() + 1) + '/' + new Date().getFullYear() + ' ' + new Date().getHours() + ':' + new Date().getMinutes() + ':' + new Date().getSeconds() + '</p></div>' +
				'<p class="lead"><span><a target="_blank" href="/app/usuarios/' + data.from._id + '">' + 
				data.from.profile.username + '</a>'
				+ '</span> ha publicado una <span><a href="/app/denuncia/'+ data.denuncia.gid +'">denuncia </a></span> cerca de tu ubicación (' + data.noti.distancia + ' metros)</p>'
				'</div>' +
		'</div>';
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
	alert('data denuncia: ' + JSON.stringify(data.denuncia) + 
		  'from: ' + JSON.stringify(data.from) + ' noti: ' + JSON.stringify(data.noti));
	var nuevas = parseInt($('.noti_up:eq(1)').text()) + 1;
	$('.noti_up').empty();
	$('.noti_up').append(nuevas);
	var not_tot = parseInt($('.noti_tot').text()) + 1;
	$('.noti_tot').empty();
	$('.noti_tot').append(not_tot);
	
	var html = '<div class="row noti" style="margin: 0 5 10 5px; background: rgba(0,50,187,0.1); padding:5%;" id_noti="' + data.noti.id_noti + '" vista="false" onclick="noti(this)">' + 
				'<div class="col-lg-12 btn btn-danger" style="margin-bottom: 10px" id_noti_panel="' + data.noti.id_noti + '">NUEVA</div>' +
				'<div class="col-xs-2">'+
				'<a target="_blank" href="/app/usuarios/' + data.from._id + '">' + 
				'<img class="img-responsive img-thumbnail img-circle" src="' + data.from.profile.picture + '">' + 
				'</a>' +
				'<span class="fa-stack fa-lg">'+
				'<i class="fa fa-circle fa-stack-2x" style="color: #339BEB;"/>' +
				'<i class="fa fa-comments fa-stack-1x fa-inverse"/>' +
				'</span>' + 
				'</div>' + // col-xs-2
				'<div class="col-xs-10">'+ 
				'<div class="col-lg-12"><p class="lead">'+ new Date().getDate() + '/' + (new Date().getMonth() + 1) + '/' + new Date().getFullYear() + ' ' + new Date().getHours() + ':' + new Date().getMinutes() + ':' + new Date().getSeconds() + '</p></div>' +
				'<p class="lead"><span><a target="_blank" href="/app/usuarios/' + data.from._id + '">' + 
				data.from.profile.username + '</a>'
				+ '</span> ha comentado una <span><a href="/app/denuncia/'+ data.denuncia.gid +'">denuncia tuya</a></span> </p>'
				'</div>' +
		'</div>';
	$('#notificaciones > .panel-body').prepend($(html));
	
	
	BootstrapDialog.show({
		title: 'Nueva notificación - Denuncia Comentada',
		message: $(html),
		buttons: [{label: 'Cerrar', action: function(dialog){dialog.close()}}],
		onshown: function(dialog){
			setTimeout(function(){dialog.close()}, 1500);
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
	 $('#numdenun').append('<i class="fa fa-bullhorn" style="margin-right: 5px;"></i>');
	 $('#numdenun').append(num + 1);
	 
	 $('#numdenunhoy').empty();
	 $('#numdenunhoy').append('<i class="fa fa-bullhorn" style="margin-right: 5px;"></i>');
	 $('#numdenunhoy').append(numhoy + 1);
});