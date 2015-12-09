var random = '';
var json = {}; // Objeto que se pasará al cuerpo de la petición XHR

$(function() {

	// Nos conectamos a Socket.io
	var socket = io.connect("http://localhost:3000/app/denuncias/nueva");
	
	var socketEmit = io.connect("http://localhost:3000/app/visor");
	
	socketEmit.on('connect', function(){
		alert('conectado visor');
	});
	// Cuando se conecte
	socket.on('connect', function() {
		// Almacenamos la sessionId que nos genera socket.io
		// Lo utilizaremos para eliminar la carpeta temporal en caso 
		// de que el usuario se desconecte
		random = socket.io.engine.id;
		//alert(random);
		//$("#file-dropzone").attr('action', "http://localhost:3000/app/fileUpload/" + random);
		
		$("#file-dropzone").addClass('dropzone');
		
		// Configuración del dropzone
		$("#file-dropzone").dropzone({ 
		    url: "/app/fileUpload/" + random,
		    maxFilesize: 2,
		    maxFiles: 10,
		    paramName: "uploadfile",
		    maxThumbnailFilesize: 30,
		    addRemoveLinks: true,
		    acceptedFiles: 'image/*',
		    dictDefaultMessage: '¡Arrastra imágenes aquí!',
		    dictFallbackMessage: 'Tu navegador no soporta subidas mediante Drag & Drop',
		    dictInvalidFileType: 'Tipo de archivo no permitido',
		    dictFileTooBig: 'Imagen demasiado grande',
		    dictResponseError: 'Error subiendo la imagen',
		    dictMaxFilesExceeded: 'Límite máximo de 10 imágenes subidas alcanzado',
		    dictCancelUpload: 'Cancelar',
		    dictCancelUploadConfirmation: 'Cancelada subida de imagen',
		    dictRemoveFile: 'Eliminar imagen',
		    init : function(){
		    	this.on('removedfile', function(file){
		    		
		    	    $.ajax({
		 	           url:'/app/deleteFile/'+ random + '/' + file.name,
		 	           type:'GET', // Método GET
		 	           data:{},
		 	           success:function(res){
		 	        	   
		 	           }
		    	    });

		    	});
		    }
		 }); // CONFIG DROPZONE	
	}); // CONECTAMOS A SOCKET.IO
	
	// Click en botón submitDenuncia
	$('#submitDenuncia').submit( function(event){
	
		event.preventDefault();  // preventDefault
		
		toWKT(); //llamamos a la función para generar el WKT (openlayers.js)
		
		var formBasico = $('#basico').serializeArray(); // Obtenemos un json array del formulario
		
		var titulo = formBasico[0].value; // Obtenemos el titulo del array anterior
		
		var contenido = tinymce.activeEditor.getContent(); // contenido del SCEditor
			
		json.titulo = titulo;
		json.contenido = contenido;
		json.tempDir = random;
		json.wkt = wkt;
		
		// Añadimos los tags a la lista
		$('#et input[type=text]').each(function(){
				tags.push($(this).val());
		});
		
		// Añadimos la lista al objeto
		json.tags = tags;
		
		/*******/
		
		var formData = new FormData(); // FormData
		
		formData.append('uploadDenuncia', json);
		
		var xhr = new XMLHttpRequest(); // Petición XMLHttpRequest
		
		xhr.open('post', '/app/denuncias/nueva/save/' , true); // Método POST
		
		xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8"); // Especificamos cabecera
		
		xhr.send(JSON.stringify(json)); // Enviamos petición
		
		// Recibimos respuesta del servidor
		xhr.onload = function(){
			// El Response que nos envía el servidor
			var res = JSON.parse(xhr.responseText);
			
			// Mostramos si ha habido error subiendo la denuncia
			if(res.type == 'error'){
				// Mostramos un Bootstrap Dialog
				BootstrapDialog.show({
					type: BootstrapDialog.TYPE_DANGER,
					title: 'Error',
					message: res.msg,
					buttons: [{
					label: 'Cerrar',
					action: function(dialog){dialog.close()}}]
				});
			}
			else
			{
				socketEmit.emit('new_denuncia_added', json);
				// Ha habido éxito subiendo la denuncia
				BootstrapDialog.show({
					type: BootstrapDialog.TYPE_SUCCESS,
					title: 'Subido Correctamente',
					message: res.msg,
					closable: false,
					buttons: [{
					label: 'Cerrar',
					action: function(dialog){dialog.close(); window.location.replace('/app/denuncias?page=1');}}]
					// Cuando se cierre redirigimos al usuario 
				});
			}
	
		}; 
	});	//Submit denuncia

}); // $(function)