var random = '';

// Nos conectamos a Socket.io
var socket = io.connect("http://" + ip + ":3000/app/denuncias/nueva");

// Cuando se conecte
socket.on('connect', function() {
	// Almacenamos la sessionId que nos genera socket.io
	// Lo utilizaremos para eliminar la carpeta temporal en caso
	// de que el usuario se desconecte
	random = socket.io.engine.id;
	
	$("#file-dropzone").addClass('dropzone');
	
	$("#file-dropzone").dropzone({ 
	    url: "/app/fileUpload/" + random,
	    maxFilesize: 4,
	    maxFiles: 10,
	    paramName: "file",
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
	    	dropzone = this;
	    	this.on('removedfile', function(file){
	    		console.log(file);
	    		if(file.path)
		    	    $.ajax({
		 	           url:'/app/deleteImagen?path=' + file.name,
		 	           type:'GET', // Método GET
		 	           data:{},
		 	           success:function(res){
		 	        	   // Aquí debería ir un mensaje :/
			    			dropzone.options.maxFiles = dropzone.options.maxFiles + 1;
			    			console.log(dropzone.options.maxFiles);
		 	           }
		    	    });
	    		else
		    	    $.ajax({
		 	           url:'/app/deleteFile/'+ random + '/' + file.name,
		 	           type:'GET', // Método GET
		 	           data:{},
		 	           success:function(res){
		 	        	   // Aquí debería ir un mensaje :/
		 	           }
		    	    });

	    	});
	    	
	    	//alert(imagenes);
	    	imagenes.forEach(function(imagen){
	    		dropzone.emit("addedfile", imagen);
	            dropzone.emit("thumbnail", imagen, imagen.path);
	            dropzone.emit("complete", imagen);
	    	});
	    	var l = imagenes.length;
			dropzone.options.maxFiles = dropzone.options.maxFiles - l;
			console.log(dropzone.options.maxFiles);
//	    	$.ajax({
//	    		url:'/app/getImagenesDenuncia?id=' + denuncia_id,
//	    		type:'GET', // Método GET
//	    		data:{},
//	    		success: function(imgsYaSubidas){
//	    			imgsYaSubidas.forEach(function(imagen){
//			             dropzone.emit("addedfile", imagen);
//			             dropzone.emit("thumbnail", imagen, imagen.path);
//			             dropzone.emit("complete", imagen);
//	    			});
//	    			dropzone.options.maxFiles = dropzone.options.maxFiles - imgsYaSubidas.length;
//	    			console.log(dropzone.options.maxFiles);
//	    		}
//	    	});
	    	
	    }
	 }); // CONFIG DROPZONE
	
}); // CONECTAMOS  A SOCKET.IO

$(function() {
	// Click en botón submitDenuncia
		$('#submitDenuncia').click( function(event){
					
			toWKT(); //llamamos a la función para generar el WKT (openlayers.js)
		
			var titulo = $('#titulo').val(); // Obtenemos el titulo del array anterior

			var contenido = (tinymce.activeEditor) ? tinymce.activeEditor.getContent() : $('textarea').val();

			json.titulo = titulo;
			json.contenido = contenido;
			json.tempDir = random;
			json.wkt = wkt;
			json.denuncia_id = denuncia_id;
			
			// Añadimos los tags a la lista
			var tags = $('#tags').tagsinput('items');

			// Añadimos la lista al objeto
			json.tags = tags;
			
			/*******/
			
			var formData = new FormData(); // FormData

			formData.append('uploadDenuncia', json);
			
			var xhr = new XMLHttpRequest(); // Petición XMLHttpRequest
			
			
			xhr.open('POST', '/app/denuncias/editar?id=' + denuncia_id , true); // Método POST
			
			xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8"); // Especificamos cabecera

			xhr.send(JSON.stringify(json)); // Enviamos petición

			
			// Recibimos respuesta del servidor
			xhr.onload = function(){
				//alert('recibidoWS');
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
					//num_denuncias_io.emit('new_denuncia_added', res.denuncia);
					console.log(res.denuncia);
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
			event.preventDefault();  // preventDefault
		});	//Submit denuncia

}); // $(function)