window.app = window.app || {};
var app = window.app;

/**
 * Control Creado para mostrar el panel lateral (Editar, Nueva)
 */
app.Lateral = function(opt_options) {

  	var options = opt_options || {},
  	TIPO_MENU = options.tipo, // Editar o Nueva
  	titulo = options.titulo,
  	denuncia = options.denuncia,
  	json = {},
  	denuncia_titulo = denuncia ? denuncia.titulo : '',
  	denuncia_contenido = denuncia ? decodeURIComponent(denuncia.descripcion) : '',
  	post = denuncia ? '/app/denuncia?id=' + denuncia.gid + '&action=edit' : '/app/denuncias/nueva/save',
  	button = document.createElement('button'),
  	element = document.createElement('div'),
  	this_ = this,
  	btn_msg = denuncia ? 'Guardar Cambios' : 'Enviar Denuncia',
  	message = '<form class="form-horizontal">' + 
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
			'<input id="submitDenuncia" type="button" value="' + btn_msg + '" class="form-control btn-success"/>' +
		'</div>' +
	'</form>',
	aux = 0,
	dialog = new BootstrapDialog({
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
				/*remove_redundant_brs : true,*/
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
			    url: "/app/fileUpload?tempdir=" + random,
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
					 	           	url:'/app/deleteFile?tempdir='+ random + '&filename=' + file.name,
					 	           	type:'GET', // Método GET
					 	           	data:{},
					 	           	success:function(res){
					 	        		// Aquí debería ir un mensaje :/
					 	           	}
					    	    });
			    		} // if denuncia
			    		else
				    	    $.ajax({
				 	           	url:'/app/deleteFile?tempdir='+ random + '&filename=' + file.name,
				 	           	type:'GET', // Método GET
				 	           	data:{},
				 	           	success:function(res){
				 	        	   
				 	           	}
				    	    });

			    	}); // removed file
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

				if(Dropzone.forElement("#file-dropzone").getUploadingFiles().length > 0){
					BootstrapDialog.alert({
						title: 'Error',
						message : 'Está subiendo imágenes al servidor.\n Espere a que finalicen de subir los archivos o cancele las descargas.'
					});
					return false;
				}

				map.getControls().forEach(function(control){
					if(control instanceof app.Draw) {
						json.wkt = control.toWKT();
						console.log(json.wkt , control.toWKT());
					}
				});	

				json.titulo = $('#titulo').val(); // Obtenemos el titulo del array anterior
				json.contenido = (tinyMCE.activeEditor) ? encodeURIComponent(tinyMCE.activeEditor.getContent().replace(/'/g, " ")) : $('textarea').val();
				json.tempDir = random;
				json.tags = $('#tags').tagsinput('items');
				
				/*******/
				
				var formData = new FormData(); // FormData

				formData.append('uploadDenuncia', json);
				
				var xhr = new XMLHttpRequest(); // Petición XMLHttpRequest
				
				xhr.open('POST', post , true); // Método POST
				
				xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8"); // Especificamos cabecera

				xhr.send(JSON.stringify(json)); // Enviamos petición

				var self = this;
				var m = denuncia ? 'Guardando cambios' : 'Enviando Denuncia';
				$(self).parent().parent().append('<div id="spinner" style="text-align: center"><i class="fa fa-spinner fa-spin fa-5x" style="color: #339BEB"></i>'
					+ '<p>' + m + '...</p></div>');
				$(self).parent().hide();
				
				// Recibimos respuesta del servidor
				xhr.onload = function(){
					//alert('recibidoWS');
					// El Response que nos envía el servidor
					var res = JSON.parse(xhr.responseText);
					
					// Mostramos si ha habido error subiendo la denuncia
					if(res.type == 'error'){
						// Mostramos un Bootstrap Dialog
						$(self).parent().parent().find('#spinner').remove();
						$(self).parent().css('display', '');
						BootstrapDialog.show({
							type: BootstrapDialog.TYPE_DANGER,
							title: 'Error añadiendo denuncia',
							message: res.msg,
							buttons: [{
								label: 'Cerrar',
								action: function(dialog){dialog.close()}
							}]
						});
					}
					else
					{
						//console.log(res.denuncia);
						// Ha habido éxito subiendo la denuncia
						BootstrapDialog.show({
							type: BootstrapDialog.TYPE_SUCCESS,
							title: 'Denuncia añadida correctamente',
							message: res.msg,
							closable: false,
							onshown : function(dialog){
								setTimeout(function(){
									dialog.close();
									window.location.replace('/app/denuncia?id=' + res.denuncia.gid);
								}, 2000);
							},
							// Cuando se cierre redirigimos al usuario 
						});
					}
				};
				event.preventDefault();  // preventDefault
			});	//Submit denuncia
  		}
  	}); // Dialog


  	function lateral_ (){
  		dialog.open();
  	}

  	button.innerHTML = '<i class="fa fa-list-alt"></i>';
  	button.addEventListener('click', lateral_, false);

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