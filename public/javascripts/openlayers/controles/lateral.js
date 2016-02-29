window.app = window.app || {};
var app = window.app;

/**
 * Control Creado para mostrar el panel lateral (Editar, Nueva)
 */
app.Lateral = function(opt_options) {

  var options = opt_options || {};

  var titulo = options.titulo;

  var button = document.createElement('button');
  button.innerHTML = '<i class="fa fa-list-alt"></i>';
  
  var this_ = this;
  
  var message = '<form class="form-horizontal">' + 
  					'<div style="margin-top:5px" class="input-group"><span class="input-group-addon">Título</span>' + 
    					'<input id="titulo" type="text" name="titulo" placeholder="Añade un título" class="form-control btn-default"/>' +
  					'</div>' +
  					'<div class="space"></div>' +
  					'<h4>Añade una descripción</h4>' +
  					'<textarea id="contenido" name="contenido" rows="3" style="height:300px" class="form-control"></textarea>' +
  					'<div class="space"></div>' +
  					'<h4>Imágenes</h4>' +
  					'<div id="file-dropzone" style="background:#55ACEE;border:1px dashed">' +
    					'<div style="color:#fff" class="dz-message text-center">Arrastra imágenes o haz click aquí.</div>' +
  					'</div>' +
  					'<div class="space"></div>' +
  					'<h4>Tags</h4>' +
  					'<input id="tags" type="text" name="tags" placeholder="Introduce tags" class="col-lg-12"/>' + 
  					'<div style="margin-top:5px;margin-bottom:15px" class="col-lg-12 input-group space">' +
  						'<span class="input-group-addon"><i class="fa fa-send fa-fw"></i></span>' +
    					'<input id="submitDenuncia" type="button" value="Denunciar" class="form-control btn-success"/>' +
  					'</div>' +
				'</form>';
  var aux = true;

  var tags;

  var contenido = '';

  function lateral_ (){
  	BootstrapDialog.show({
  		title : titulo,
  		message: $(message),
  		autodestroy : false,
  		onhide : function(dialog){
  			tags = $('#tags').tagsinput('items');
  			contenido = tinyMCE.activeEditor.getBody().textContent;
  			message = dialog.getModalBody().children().children();
  		},
  		onshown : function(){
  			$('.mce-tinymce').replaceWith('<textarea id="contenido" name="contenido" rows="3" style="height:300px" class="form-control">' + contenido + '</textarea>');
  			tinymce.init({
				selector: 'textarea',
				plugins: ['advlist autolink link lists charmap print preview hr anchor pagebreak',
				'searchreplace wordcount visualblocks visualchars code fullscreen insertdatetime media nonbreaking',
				'save table contextmenu directionality emoticons template paste textcolor'],
				theme: 'modern',
				language_url: '/langs/es.js',
				min_width: 300,
				resize: false
			});

			$("#file-dropzone").addClass('dropzone');
	
			// Configuración del dropzone
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
  			$('#tags').tagsinput({
				maxTags: 5,
				maxChars: 8,
				trimValue: true,
				onTagExists: function(item, $tag) {
					$tag.hide().fadeIn();
					alert('Tag repetido');
				}
			});

			if(tags){
				tags.forEach(function(tag){
					$('#tags').tagsinput('add', tag);
				});
			}

			$('#submitDenuncia').click( function(event){
						
				toWKT(); //llamamos a la función para generar el WKT (openlayers.js)
			
				var titulo = $('#titulo').val(); // Obtenemos el titulo del array anterior

				var contenido = (tinymce.activeEditor) ? tinyMCE.activeEditor.getBody().textContent : $('textarea').val();

				json.titulo = titulo;
				json.contenido = contenido;
				json.tempDir = random;
				json.wkt = wkt;
				
				// Añadimos los tags a la lista
				var tags = $('#tags').tagsinput('items');

				// Añadimos la lista al objeto
				json.tags = tags;
				
				/*******/
				
				var formData = new FormData(); // FormData

				formData.append('uploadDenuncia', json);
				
				var xhr = new XMLHttpRequest(); // Petición XMLHttpRequest
				
				
				xhr.open('POST', '/app/denuncias/nueva/save/' , true); // Método POST
				
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
						num_denuncias_io.emit('new_denuncia_added', res.denuncia);
						//console.log(res.denuncia);
						// Ha habido éxito subiendo la denuncia

						BootstrapDialog.show({
							type: BootstrapDialog.TYPE_SUCCESS,
							title: 'Subido Correctamente',
							message: res.msg,
							closable: false,
							buttons: [{
							label: 'Cerrar',
							action: function(dialog){dialog.close(); window.location.replace('/app/visor');}}]
							// Cuando se cierre redirigimos al usuario 
						});
					}
				};
				event.preventDefault();  // preventDefault
			});	//Submit denuncia
			

  		}
  	});
  }

  button.addEventListener('click', lateral_, false);

  var element = document.createElement('div');
  element.setAttribute('data-toggle', 'left');
  element.setAttribute('title', 'Datos');
  element.setAttribute('data-content', 'Rellena o modifica los datos de la denuncia');
  element.className = 'lateral ol-unselectable ol-control';
  element.appendChild(button);

  ol.control.Control.call(this, {
    element: element,
    target: options.target
  });

};
ol.inherits(app.Lateral, ol.control.Control);