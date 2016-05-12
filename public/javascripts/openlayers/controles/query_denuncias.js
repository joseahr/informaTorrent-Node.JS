window.app = window.app || {};
var app = window.app;

/**
 * Control Creado para filtrar denuncias en el mapa
 */
app.QueryDenuncias = function(opt_options) {
	
	var options = opt_options || {},
	button = document.createElement('button'),
	control,
	opened = 'radio',
	this_ = this,
	geojson = new ol.format.GeoJSON(),
	bbox = new ol.interaction.DragBox({
       	//condition: ol.events.condition.platformModifierKeyOnly
    }), 
    bbox_form = '<div id="toggle_bbox" class="container-fluid" style="padding : 0px">' +
       	'<div class="col-lg-12">' +
			'<p><a id="buscar_bbox" href="javascript: void(0)" class="btn-success" style="width:100%; height : 100%; padding : 2 4 2 4px;"><i class="fa fa-square-o"></i></a> Dibujar encuadre</p>' +
		'</div>' +
		'<div class="col-lg-6" style="margin-top : 10px;">' +
			'<div class="input-group">' +
				'<span class="input-group-addon">φmin</span>' +
				'<input class="form-control btn-default" id="lat_min" type="text" name="lat" placeholder="Latitud mínima (φ)"></input>' +
			'</div>' + 
		'</div>' +
		'<div class="col-lg-6" style="margin-top : 10px;">' +
			'<div class="input-group">' + 
				'<span class="input-group-addon">λmin</i></span>' +
				'<input class="form-control btn-default" id="lon_min" type="text" name="lon" placeholder="Longitud mínima (λ)"></input>' + 
			'</div>' + 
		'</div>' +
    	'<div class="col-lg-12" style="margin-top : 5px;">' +
			'<p><a id="punto_min" href="javascript: void(0)" class="btn-success" style="width:100%; height : 100%; padding : 2 4 2 4px;"><i class="fa fa-map-marker"></i></a> Elegir punto en el mapa</p>' +
		'</div>' +
		'<div class="col-lg-6" style="margin-top : 10px;">' +
			'<div class="input-group">' +
				'<span class="input-group-addon">φmax</span>' +
				'<input class="form-control btn-default" id="lat_max" type="text" name="lat" placeholder="Latitud máxima (φ)"></input>' +
			'</div>' + 
		'</div>' +
		'<div class="col-lg-6" style="margin-top : 10px;">' +
			'<div class="input-group">' + 
				'<span class="input-group-addon">λmax</i></span>' +
				'<input class="form-control btn-default" id="lon_max" type="text" name="lon" placeholder="Longitud máxima (λ)"></input>' + 
			'</div>' + 
		'</div>' +
    	'<div class="col-lg-12" style="margin-top : 5px;">' +
			'<p><a id="punto_max" href="javascript: void(0)" class="btn-success" style="width:100%; height : 100%; padding : 2 4 2 4px;"><i class="fa fa-map-marker"></i></a> Elegir punto en el mapa</p>' +
		'</div>' +
    '</div>',
    centro_buffer = '<div id="toggle_radio" class="container-fluid" style="padding : 0px">' + 
    	'<div class="col-lg-12">' +
			'<p><a id="punto_centro_buffer" href="javascript: void(0)" class="btn-success" style="width:100%; height : 100%; padding : 2 4 2 4px;"><i class="fa fa-map-marker"></i></a> Elegir punto en el mapa</p>' +
		'</div>' +
		'<div class="col-lg-4" style="margin-top : 10px;">' +
			'<div class="input-group">' +
				'<span class="input-group-addon">φ</span>' +
				'<input class="form-control btn-default" id="lat_centro" type="text" name="lat" placeholder="Latitud del centro del buffer (φ)"></input>' +
			'</div>' + 
		'</div>' +
		'<div class="col-lg-4" style="margin-top : 10px;">' +
			'<div class="input-group">' + 
				'<span class="input-group-addon">λ</i></span>' +
				'<input class="form-control btn-default" id="lon_centro" type="text" name="lon" placeholder="Longitud del centro del buffer (λ)"></input>' + 
			'</div>' + 
		'</div>' +
		'<div class="col-lg-4" style="margin-top: 10px;">' + 
			'<div class="input-group">' + 
				'<span class="input-group-addon"><i class="glyphicon glyphicon-record"></i></span>' +
				'<input class="form-control btn-default" id="radio" type="text" name="username" placeholder="Radio del buffer"></input>' + 
			'</div>' + 
		'</div>' +
	'</div>',
	html = '<div class="row">' +
		'<div class="col-lg-12">' +
			'<a id="limpiar_busquedas" href="javascript:void(0)">' +
				'<span class="fa-stack fa-lg">' +
  					'<i class="fa fa-search fa-stack-1x"></i>' +
  					'<i class="fa fa-ban fa-stack-2x text-danger"></i>' +
				'</span>' +
			' Limpiar consultas del mapa</a>' +
		'</div>' +
		'<div class="col-lg-12">' + 
			'<h4>Datos Básicos</h4>' + 
			'<p>Buscar por título, tags (separados por coma) y nombre de usuario</p>' + 
		'</div>' +
		'<div class="col-lg-6">' +
			'<div class="input-group" style="margin-top: 10px;">' +
				'<span class="input-group-addon"><i class="fa fa-bookmark-o"></i></span>' +
				'<input class="form-control btn-default" id="titulo" type="text" name="titulo" placeholder="buscar por título..."></input>' +
			'</div>' +
		'</div>' + 
		'<div class="col-lg-6" style="margin-top: 10px;">' +
			'<div class="input-group">' +
				'<span class="input-group-addon"><i class="fa fa-user"></i></span>' +
				'<input class="form-control btn-default" id="username" type="text" name="username" placeholder="denunciado por..."></input>' +
			'</div>' + 
		'</div>' +
		'<div class="col-lg-12" style="margin-top: 10px;">' +
			'<div class="input-group">' +
				'<span class="input-group-addon"><i class="fa fa-tags"></i></span>' +
				'<input id="tags" type="text" name="tags" placeholder="ej : suciedad, olores,..." class="col-lg-12"/>' +
			'</div>' +
		'</div>' +
		'<div class="col-lg-6"></div>' +
		'<div class="col-lg-12" style="margin-bottom : 10px">' + 
			'<h4>Denuncias cercanas a...</h4>' +
			'<p>Introduce el centro y el radio de búsqueda. Para obtener las coordenadas del centro dirígete a <a href="http://epsg.io/4258/map" target="_blank">http://epsg.io/4258/map</a>. El separador decimal es el punto ".".' + 
			' O utiliza las funcionalidades de selección en el mapa</p>' +
			'<div id="seleccionar_radio" class="col-lg-6 text-center btn-success" style="padding : 5px; border: none;"><a style="color : #fff" href="javascript:void(0)">RADIO</a></div>' +
			'<div id="seleccionar_bbox" style="padding : 5px; border: none;" class="col-lg-6 text-center btn-warning"><a style="color : #fff" href="javascript:void(0)">BBOX</a></div>' + 
		'</div>' +
		centro_buffer +
		bbox_form +
		'<div class="col-lg-12">' + 
			'<h4>Fecha</h4>' + 
			'<p>Buscar denuncias en un intervalo de tiempo determinado</p>' + 
		'</div>' +
		'<div class="col-lg-6" style="margin-top: 10px;">' + 
			'<div class="input-group">' + 
				'<span class="input-group-addon"><i class="fa fa-calendar"></i></span>' +
				'<input  autocomplete="off" class="form-control btn-default datepicker" id="fecha_desde" type="text" name="titulo" placeholder="Desde dd/mm/aaaa"></input>' +
			'</div>' +
		'</div>' + 
		'<div class="col-lg-6" style="margin-top: 10px;">' + 
			'<div class="input-group">' + 
				'<span class="input-group-addon"><i class="fa fa-calendar"></i></span>' +
				'<input  autocomplete="off" class="form-control btn-default datepicker" id="fecha_hasta" type="text" name="tags" placeholder="Hasta dd/mm/aaaa"></input>' +
			'</div>' +
		'</div>' +
	'</div>', 
	  
	q_dialog = new BootstrapDialog({
	  	title: 'Buscar denuncias por...', 
	  	message: html,
	  	closable : true, 
	  	draggable: true,
	  	autodestroy: false,
	  	buttons: [
	  		{label: 'Cerrar', action: function(dialog){BootstrapDialog.closeAll()}}, 
	        {label: 'Buscar', id : 'buscar_btn', action: function(dialog){
            	var data = {};
            	if(opened == 'radio'){
					$(dialog.getModalBody()).find('#lat_min').val('');
					$(dialog.getModalBody()).find('#lon_min').val('');
					$(dialog.getModalBody()).find('#lat_max').val('');
					$(dialog.getModalBody()).find('#lon_max').val('');
            	}
            	else {
					$(dialog.getModalBody()).find('#lon_centro').val('');
					$(dialog.getModalBody()).find('#lat_centro').val('');
					$(dialog.getModalBody()).find('#radio').val('');
            	}

            	data.titulo = $(dialog.getModalBody()).find('#titulo').val();
            	data.tags = $(dialog.getModalBody()).find('#tags').tagsinput('items').join(',');
            	data.username = $(dialog.getModalBody()).find('#username').val(); 
            	data.lon = $(dialog.getModalBody()).find('#lon_centro').val();
            	data.lat = $(dialog.getModalBody()).find('#lat_centro').val(); 
            	data.buffer_radio = $(dialog.getModalBody()).find('#radio').val(); 
            	data.fecha_desde = $(dialog.getModalBody()).find('#fecha_desde').val(); 
            	data.fecha_hasta = $(dialog.getModalBody()).find('#fecha_hasta').val();

            	if($(dialog.getModalBody()).find('#lon_min').val().length == 0 && 
            	$(dialog.getModalBody()).find('#lat_min').val().length == 0 &&
            	$(dialog.getModalBody()).find('#lon_max').val().length == 0 && 
            	$(dialog.getModalBody()).find('#lat_max').val().length == 0)
            		data.bbox = undefined;
            	else
            		data.bbox = [$(dialog.getModalBody()).find('#lon_min').val(), $(dialog.getModalBody()).find('#lat_min').val(),
            		$(dialog.getModalBody()).find('#lon_max').val(), $(dialog.getModalBody()).find('#lat_max').val()];
            	console.log(data.bbox,$(dialog.getModalBody()).find('#lon_min').val(),
            		$(dialog.getModalBody()).find('#lon_max').val(),$(dialog.getModalBody()).find('#lat_min').val(),
            		$(dialog.getModalBody()).find('#lat_max').val());

            	num_denuncias_io.emit('query', data);

            	this.disable();
            	this.spin();
	    }}],
	    onshow : function(dialog){
	        dialog.getModalHeader().replaceWith($('<div class="row" style="margin: 0px; padding-top: 5px; border-top-left-radius: 10px; border-top-right-radius: 10px; background: url(&#39;http://www.batlleiroig.com/wp-content/uploads/247_parc_central_st_cugat_8.jpg&#39;); background-size: cover; background-repeat: no-repeat;">' + 
	          '<div class="bootstrap-dialog-close-button">' + 
	          	'<button class="close" style="color : #fff; margin-right : 10px;">X</button>' +
	          '</div>' +
	          '<div class="col-xs-6" style="text-align: center; color: #fff; font-weight : bold;">' +
	          '<i class="fa fa-search" style="font-size : 60px; color : #00bbff; text-shadow: 2px 2px #fff;"></i>' + 
	            '<h4 style="padding : 2px; color : #00bbff; background : rgba(0,0,0,0.7); border-radius : 15px;"> Buscar por...</h4>' +
	          '</div>' +
	        '</div>'));
	        dialog.getModalDialog().find('.close').click(function(){dialog.close()});
	        dialog.getModalBody().parent().css('border-radius', '15px');
	        dialog.getModalBody().css('padding-top', '10px');
	    },
	  	onshown: function(dialog){

	  		$('#limpiar_busquedas').click(function(){
	  			console.log('limpiar');
	  			clusterSource.getSource().getFeatures().forEach(function(f){
	  				if(f.attributes.marker_type == 'buscar'){
	  					console.log(f.attributes.denuncia.gid);
	  					delete features_cache[f.attributes.denuncia.gid];
	  					clusterSource.getSource().removeFeature(f);
	  				}
	  			});
	  		});

			var tags_servidor = new Bloodhound({
			  datumTokenizer: Bloodhound.tokenizers.obj.whitespace('tag'),
			  queryTokenizer: Bloodhound.tokenizers.whitespace,
			  prefetch: {
			    url: '/app/denuncias/tags',
			    filter: function(list) {
			      return $.map(list, function(tag) {
			        return { tag: tag }; });
			    }
			  }
			});
			tags_servidor.initialize();

  			$('#tags').tagsinput({
				maxTags: 5,
				maxChars: 15,
				trimValue: true,
				onTagExists: function(item, $tag) {
					$tag.hide().fadeIn();
					alert('Tag repetido');
				},
				typeaheadjs: {
				    name: 'tags',
				    displayKey: 'tag',
				    valueKey: 'tag',
				    source: tags_servidor.ttAdapter()
				}
			});

	  		$('#seleccionar_radio').click(function(){
	  			if(opened == 'radio') return;
	  			opened = 'radio';
	  			$(this).removeClass('btn-warning').addClass('btn-success');
	  			$('#seleccionar_bbox').removeClass('btn-sucess').addClass('btn-warning');
	  			$('#toggle_bbox').hide();
	  			$('#toggle_radio').show();
	  		});

	  		$('#seleccionar_bbox').click(function(){
	  			if(opened == 'bbox') return;
	  			opened = 'bbox';
	  			$(this).removeClass('btn-warning').addClass('btn-success');
	  			$('#seleccionar_radio').removeClass('btn-sucess').addClass('btn-warning');
	  			$('#toggle_radio').hide();
	  			$('#toggle_bbox').show();
	  		});
	  		if(opened == 'radio')
	  			$('#toggle_bbox').hide();

		  	$('.datepicker').datepicker({ format: 'dd/mm/yyyy', language: 'es', todayBtn: true, todayHighlight: true });

		  	$(dialog.getModalBody()).find('#punto_centro_buffer').click(function(event){
				
				map.removeInteraction(bbox);
				if(control) map.unByKey(control);

				dialog.close();
				  
				control = map.on('click', function(e){
					var coor = e.coordinate;
					dialog.open();
					$(dialog.getModalBody()).find('#lon_centro').val(coor[0]);
					$(dialog.getModalBody()).find('#lat_centro').val(coor[1]);
					$(dialog.getModalBody()).find('#radio').val('');
					//$(dialog.getModalBody()).find('#bbox').empty().hide();
					
					map.unByKey(control);
				});
			});

		  	$(dialog.getModalBody()).find('#punto_min').click(function(event){
				
				map.removeInteraction(bbox);
				if(control) map.unByKey(control);

				dialog.close();
				  
				control = map.on('click', function(e){
					var coor = e.coordinate;
					dialog.open();
					var lonmax = $(dialog.getModalBody()).find('#lon_max').val();
					var latmax = $(dialog.getModalBody()).find('#lat_max').val();

					if(latmax != '' && latmax < coor[1] || 
						lonmax != '' && lonmax < coor[0]){
						BootstrapDialog.alert({ message : 'La latitud y la longitud máxima debe ser mayor que la latitud y la longitud mínima.'});
						return;
					}
					$(dialog.getModalBody()).find('#lon_min').val(coor[0]);
					$(dialog.getModalBody()).find('#lat_min').val(coor[1]);
					
					map.unByKey(control);
				});
			});

		  	$(dialog.getModalBody()).find('#punto_max').click(function(event){
				
				map.removeInteraction(bbox);
				if(control) map.unByKey(control);

				dialog.close();
				  
				control = map.on('click', function(e){
					var coor = e.coordinate;
					dialog.open();
					var lonmin = $(dialog.getModalBody()).find('#lon_min').val();
					var latmin = $(dialog.getModalBody()).find('#lat_min').val();

					if(latmin != '' && latmin > coor[1] || 
						lonmin != '' && lonmin > coor[0]){
						BootstrapDialog.alert({ message : 'La latitud y la longitud máxima debe ser mayor que la latitud y la longitud mínima.'});
						return;
					}
					$(dialog.getModalBody()).find('#lon_max').val(coor[0]);
					$(dialog.getModalBody()).find('#lat_max').val(coor[1]);
					
					map.unByKey(control);
				});
			});

			$(dialog.getModalBody()).find('#buscar_bbox').click(function(event){
				
				if(control) map.unByKey(control);

		  		q_dialog.close();

  				map.addInteraction(bbox);

  				bbox.on('boxend', function(){
      				var extension = bbox.getGeometry().getExtent();
      				//alert(extension);
      				//dialog.close();
      				q_dialog.open();
					//$(dialog.getModalBody()).find('#lon_centro').val('').parent().hide();
					//$(dialog.getModalBody()).find('#lat_centro').val('').parent().hide();
					//$(dialog.getModalBody()).find('#radio').val('').parent().hide();
					dialog.setData('bbox', extension);

					$(dialog.getModalBody()).find('#lat_min').val(extension[1]);
					$(dialog.getModalBody()).find('#lon_min').val(extension[0]);
					$(dialog.getModalBody()).find('#lat_max').val(extension[3]);
					$(dialog.getModalBody()).find('#lon_max').val(extension[2]);
					//alert(dialog.getData('bbox'));
					//$(dialog.getModalBody()).find('#bbox').empty().append('BBOX = [' + dialog.getData('bbox') + ']').show(); 	
					map.removeInteraction(bbox);
      			});
		  	});

	  	}
  	});

	num_denuncias_io.on('error_query', function(data){
		q_dialog.getButton('buscar_btn').enable().stopSpin();
		BootstrapDialog.show({ 
			title: 'Error consultando', 
			message: data.msg, 
			closable: true, 
			onshow : function(dialog){$(dialog.getModalHeader()).css('background', 'rgb(200,50,50)')},
			onshown: function(dialog){setTimeout(function(){dialog.close()}, 2000);}
		});
	});
  
	num_denuncias_io.on('api', function(data){
		// data --> info que genera la consulta del usuario
		//alert(typeof(data));
		$(q_dialog.getModalBody()).find('#lat_min').val('');
		$(q_dialog.getModalBody()).find('#lon_min').val('');
		$(q_dialog.getModalBody()).find('#lat_max').val('');
		$(q_dialog.getModalBody()).find('#lon_max').val('');
		$(q_dialog.getModalBody()).find('#lon_centro').val('');
		$(q_dialog.getModalBody()).find('#lat_centro').val('');
		$(q_dialog.getModalBody()).find('#radio').val('');

    	$(q_dialog.getModalBody()).find('#titulo').val('');
    	$(q_dialog.getModalBody()).find('#tags').tagsinput('removeAll');
    	$(q_dialog.getModalBody()).find('#username').val('');  
    	$(q_dialog.getModalBody()).find('#fecha_desde').val(''); 
    	$(q_dialog.getModalBody()).find('#fecha_hasta').val('');

		q_dialog.setData('bbox');
		q_dialog.getButton('buscar_btn').enable().stopSpin();

		//$(q_dialog.getModalBody()).find('#lon_centro').val('').parent().show();
		//$(q_dialog.getModalBody()).find('#lat_centro').val('').parent().show();
		//$(q_dialog.getModalBody()).find('#radio').val('').parent().show();
		//$(q_dialog.getModalBody()).find('#bbox').empty().hide(); 

		BootstrapDialog.alert({
			message: '¡' + data.query.length + ' denuncias encontradas de acuerdo a tus criterios de búsqueda!',
			title: 'Resultado de tu búsqueda',
			type: BootstrapDialog.TYPE_WARNING
		});
		
		$.each(BootstrapDialog.dialogs, function(id, dialog){
			setTimeout(function(){
				dialog.close();
			}, 2000);
		});

		vector.getSource().clear();

		data.query.forEach(function(denuncia){		
			var feature, 
			feature_marker,
			type = denuncia.geometria.type, 
			coordinates = denuncia.geometria.coordinates;
			
			if(type == 'Point'){
		    	feature = new ol.Feature({
		    		  geometry: new ol.geom.Point(coordinates),
		    		  name: 'Denuncia - Punto'
		    	});
		    	
		    }
		    else if(type == 'LineString'){
		    	feature = new ol.Feature({
		    		geometry: new ol.geom.LineString(coordinates),
		    		name: 'Denuncia - Polígono'
		    	});
		    }
		    else if(type == 'Polygon'){
		    	feature = new ol.Feature({
		    		geometry: new ol.geom.Polygon(coordinates),
		    		name: 'Denuncia - Polígono'
		    	});
		    }

		    feature_marker = new ol.Feature({
		    	geometry : new ol.geom.Point(denuncia.centro.coordinates),
		    	name : 'Denuncia Marker'
		    });

			denuncia.tipo = type;
			denuncia.coordenadas = coordinates;

			feature.attributes = {
				type : 'denuncia',
				from : 'query',
				denuncia: denuncia
			};
			feature_marker.attributes = {
				type : 'marker',
				marker_type : 'buscar',
				denuncia: denuncia
			};
			if(!features_cache[denuncia.gid]){
				features_cache[denuncia.gid] = feature;
				clusterSource.getSource().addFeature(feature_marker);
			}
		});
		
	});
  
	function query_ (){
		q_dialog.open();
	}

	button.innerHTML = '<i class="fa fa-search"></i>';
	button.addEventListener('click', query_, false);

	var element = document.createElement('div');
	element.setAttribute('data-toggle', 'left');
	element.setAttribute('title', 'Buscar');
	element.setAttribute('data-content', 'Buscar denuncias por sus atributos');
	element.className = 'buscar_denuncias ol-unselectable ol-control';
	element.appendChild(button);

	ol.control.Control.call(this, {
		element: element,
		target: options.target
	});

};

ol.inherits(app.QueryDenuncias, ol.control.Control);