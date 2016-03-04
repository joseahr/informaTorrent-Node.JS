window.app = window.app || {};
var app = window.app;

/**
 * Control Creado para mostrar el panel lateral (Editar, Nueva)
 */
app.Lateral = function(opt_options) {

  var options = opt_options || {};

  var TIPO_MENU = options.tipo; // Editar o Nueva

  var titulo = options.titulo;

  var denuncia = options.denuncia;

  var json = {};

  var denuncia_titulo = denuncia ? denuncia.titulo : '',
  	  denuncia_contenido = denuncia ? denuncia.descripcion : '',
  	  post = denuncia ? '/app/denuncias/editar?id=' + denuncia.gid : '/app/denuncias/nueva/save';

  var button = document.createElement('button');
  button.innerHTML = '<i class="fa fa-list-alt"></i>';
  
  var this_ = this;

  
  var message = '<form class="form-horizontal">' + 
  					'<div style="margin-top:5px" class="input-group"><span class="input-group-addon">Título</span>' + 
    					'<input id="titulo" type="text" name="titulo" placeholder="Añade un título" class="form-control btn-default" value="' + denuncia_titulo + '"/>' +
  					'</div>' +
  					'<div class="space"></div>' +
  					'<h4>Añade una descripción</h4>' +
  					'<textarea id="contenido" name="contenido" rows="3" style="height:300px" class="form-control">' + denuncia_contenido + '</textarea>' +
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

 	var aux = 0;

  	var dialog = new BootstrapDialog({
  		title : titulo,
  		message: $(message),
  		autodestroy : false,
  		/*onhide : function(dialog){
  			tags = $('#tags').tagsinput('items');
  		},*/
  		onshown : function(){
  			if(aux == 0){
  				aux ++;
  				console.log('aux', aux);
  			}
  			else return;
  			$('.mce-tinymce').replaceWith('<textarea id="contenido" name="contenido" rows="3" style="height:300px" class="form-control"></textarea>');
  			tinymce.init({
				selector: 'textarea',
				plugins: ['advlist autolink link lists charmap print preview hr anchor pagebreak',
				'searchreplace wordcount visualblocks visualchars code fullscreen insertdatetime media nonbreaking',
				'save table contextmenu directionality emoticons template paste textcolor'],
				theme: 'modern',
				remove_redundant_brs : true,
				autodestroy : false,
				language_url: '/langs/es.js',
				min_width: 300,
				resize: false,
				oninit : function(){
					//this.setContent(contenido);
				}
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

			    	var dropzone = this; 

			    	if(denuncia && denuncia.imagenes){
						denuncia.imagenes.forEach(function(imagen){
				    		dropzone.emit("addedfile", imagen);
				            dropzone.emit("thumbnail", imagen, imagen.path);
				            dropzone.emit("complete", imagen);
				    	});
				    	var l = denuncia.imagenes.length;
						dropzone.options.maxFiles = dropzone.options.maxFiles - l;
						console.log(dropzone.options.maxFiles);
			    	}

			    	this.on('removedfile', function(file){
			    		if(denuncia){
			    			if(file.path)
					    	    $.ajax({
					 	           url:'/app/deleteImagen?path=' + file.path,
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
			    		}
			    		else
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
  			if (denuncia)
				try {
					//alert(tags);
					//var data = JSON.parse('!{JSON.stringify(denuncia.tags_)}');
					denuncia.tags.forEach(function(tag){
						$('#tags').tagsinput('add', tag.tag);
					});
				}
				catch (e) {
					//alert(e);
				}

			$('#submitDenuncia').click( function(event){
						
				toWKT(); //llamamos a la función para generar el WKT (openlayers.js)
			
				var titulo = $('#titulo').val(); // Obtenemos el titulo del array anterior

				var contenido = (tinyMCE.activeEditor) ? encodeURIComponent(tinyMCE.activeEditor.getContent().replace(/'/g, " ")) : $('textarea').val();

				json.titulo = titulo;
				json.contenido = contenido;
				json.tempDir = random;
				json.wkt = wkt;

				//alert(JSON.stringify(json));
				//return;

				// Añadimos los tags a la lista
				var tags = $('#tags').tagsinput('items');

				// Añadimos la lista al objeto
				json.tags = tags;
				
				/*******/
				
				var formData = new FormData(); // FormData

				formData.append('uploadDenuncia', json);
				
				var xhr = new XMLHttpRequest(); // Petición XMLHttpRequest
				
				
				xhr.open('POST', post , true); // Método POST
				
				xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8"); // Especificamos cabecera

				xhr.send(JSON.stringify(json)); // Enviamos petición

				var self = this;

				$(self).parent().hide();
				
				// Recibimos respuesta del servidor
				xhr.onload = function(){
					//alert('recibidoWS');
					// El Response que nos envía el servidor
					var res = JSON.parse(xhr.responseText);
					
					// Mostramos si ha habido error subiendo la denuncia
					if(res.type == 'error'){
						// Mostramos un Bootstrap Dialog
						$(self).parent().css('display', '');
						BootstrapDialog.show({
							type: BootstrapDialog.TYPE_DANGER,
							title: 'Error añadiendo denuncia',
							message: res.msg,
							buttons: [{
							label: 'Cerrar',
							action: function(dialog){dialog.close()}}]
						});
					}
					else
					{
						//console.log(res.denuncia);
						// Ha habido éxito subiendo la denuncia

						BootstrapDialog.show({
							type: BootstrapDialog.TYPE_SUCCESS,
							title: 'Denuncia añadiendo denuncia',
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

  function lateral_ (){
  	dialog.open();
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