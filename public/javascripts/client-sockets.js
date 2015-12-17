var num_denuncias_io = io.connect("http://" + ip + ":3000/app/visor");

num_denuncias_io.emit('get_num_usuarios');

num_denuncias_io.on('num_usuarios_conectados', function(data){
	alert(data.num_usuarios);
});

num_denuncias_io.on('denuncia_cerca', function(data){
	alert('data denuncia: ' + JSON.stringify(data.denuncia) + 
		  'from: ' + JSON.stringify(data.from));
});

num_denuncias_io.on('denuncia_comentada', function(data){
	alert('data denuncia: ' + JSON.stringify(data.denuncia) + 
		  'from: ' + JSON.stringify(data.from));
});

num_denuncias_io.on('connect', function(socket){
	console.log(id_usuario);
	if(id_usuario != 'undefined')
		num_denuncias_io.emit('get_id_usuario', {id_usuario: '#{id_usuario}'});
});