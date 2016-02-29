var random = (Math.random()*1e32).toString(36);
var json = {}; // Objeto que se pasará al cuerpo de la petición XHR

// Nos conectamos a Socket.io
var socket = io.connect("http://" + ip + ":3000/app/denuncias/nueva");
// Cuando se conecte
socket.on('connect', function() {
	// Almacenamos la sessionId que nos genera socket.io
	// Lo utilizaremos para eliminar la carpeta temporal en caso 
	// de que el usuario se desconecte
	//random = socket.io.engine.id;
	//alert(random);
	//$("#file-dropzone").attr('action', "http://localhost:3000/app/fileUpload/" + random);
	
	socket.emit('crear_carpeta_temporal', {random: random});
	
}); // CONECTAMOS A SOCKET.IO
