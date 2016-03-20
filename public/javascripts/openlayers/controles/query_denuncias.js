window.app = window.app || {};
var app = window.app;

/**
 * Control Creado para filtrar denuncias en el mapa
 */
app.QueryDenuncias = function(opt_options) {
	
	var options = opt_options || {},
	button = document.createElement('button'),
	this_ = this,
	geojson = new ol.format.GeoJSON(),
	bbox = new ol.interaction.DragBox({
       	//condition: ol.events.condition.platformModifierKeyOnly
    }), 
	html = '<div class="row">' +
		'<div class="col-lg-6">' +
			'<div class="input-group" style="margin-top: 20px;">' +
				'<span class="input-group-addon">Título</span>' +
				'<input class="form-control btn-default" id="titulo" type="text" name="titulo" placeholder="buscar por título..."></input>' +
			'</div>' +
		'</div>' + 
		'<div class="col-lg-6" style="margin-top: 20px;">' +
			'<div class="input-group">' +
				'<span class="input-group-addon"><i class="fa fa-tags"></i></span>' +
				'<input class="form-control btn-default" id="tags" type="text" name="tags" placeholder="contiene el tag..."></input>' +
			'</div>' +
		'</div>' +
		'<div class="col-lg-6" style="margin-top: 20px;">' +
			'<div class="input-group">' +
				'<span class="input-group-addon"><i class="fa fa-user"></i></span>' +
				'<input class="form-control btn-default" id="username" type="text" name="username" placeholder="denunciado por..."></input>' +
			'</div>' + 
		'</div>' +
		'<div class="col-lg-6"></div>' +
		'<div class="col-lg-12">' + 
			'<h4> Denuncias cercanas a...</h4>' +
			'<p> Introduce el centro y el radio de búsqueda. Para obtener las coordenadas del centro dirígete a <a href="http://epsg.io/4258/map" target="_blank">http://epsg.io/4258/map</a>. El separador decimal es el punto "." o la coma ",".' + 
			' O haz click <a id="punto_centro_buffer" href="#">aquí</a> para dibujar un punto en el mapa. También puede usar seleccionar por <a id="buscar_bbox" href="#">BBOX</a></p>' +
		'</div>' +
		'<div class="col-lg-4" style="margin-top: 20px;">' +
			'<div class="input-group">' +
				'<span class="input-group-addon">φ</span>' +
				'<input class="form-control btn-default" id="lat_centro" type="text" name="lat" placeholder="Latitud del centro del buffer (φ)"></input>' +
			'</div>' + 
		'</div>' +
		'<div class="col-lg-4" style="margin-top: 20px;">' +
			'<div class="input-group">' + 
				'<span class="input-group-addon">λ</i></span>' +
				'<input class="form-control btn-default" id="lon_centro" type="text" name="lon" placeholder="Longitud del centro del buffer (λ)"></input>' + 
			'</div>' + 
		'</div>' +
		'<div class="col-lg-4" style="margin-top: 20px;">' + 
			'<div class="input-group">' + 
				'<span class="input-group-addon"><i class="glyphicon glyphicon-record"></i></span>' +
				'<input class="form-control btn-default" id="radio" type="text" name="username" placeholder="Radio del buffer"></input>' + 
			'</div>' + 
		'</div>' +
		'<div class="col-lg-12" id="bbox"></div>' +
		'<div class="col-lg-12">' + 
			'<h4> Buscar por fecha</h4>' + 
			'<p>Buscar denuncias por fecha</p>' + 
		'</div>' +
		'<div class="col-lg-6" style="margin-top: 20px;">' + 
			'<div class="input-group">' + 
				'<span class="input-group-addon"><i class="fa fa-calendar"></i></span>' +
				'<input  autocomplete="off" class="form-control btn-default datepicker" id="fecha_desde" type="text" name="titulo" placeholder="Desde dd/mm/aaaa"></input>' +
			'</div>' +
		'</div>' + 
		'<div class="col-lg-6" style="margin-top: 20px;">' + 
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
            	data.titulo = $(dialog.getModalBody()).find('#titulo').val();
            	data.tags = $(dialog.getModalBody()).find('#tags').val();
            	data.username = $(dialog.getModalBody()).find('#username').val(); 
            	data.lon = $(dialog.getModalBody()).find('#lon_centro').val();
            	data.lat = $(dialog.getModalBody()).find('#lat_centro').val(); 
            	data.buffer_radio = $(dialog.getModalBody()).find('#radio').val(); 
            	data.fecha_desde = $(dialog.getModalBody()).find('#fecha_desde').val(); 
            	data.fecha_hasta = $(dialog.getModalBody()).find('#fecha_hasta').val();
            	data.bbox = dialog.getData('bbox');
            	num_denuncias_io.emit('query', data);
            	dialog.setData('bbox');
            	this.disable();
            	this.spin();
	    }}],
	  	onshown: function(dialog){ 
		  	$('.datepicker').datepicker({ format: 'dd/mm/yyyy', language: 'es', todayBtn: true, todayHighlight: true });

		  	$(dialog.getModalBody()).find('#punto_centro_buffer').click(function(event){
			
				dialog.close();
				  
				var a = map.on('click', function(e){
					var coor = e.coordinate;
					dialog.open();
					$(dialog.getModalBody()).find('#lon_centro').val(coor[0]).parent().show();
					$(dialog.getModalBody()).find('#lat_centro').val(coor[1]).parent().show();
					$(dialog.getModalBody()).find('#radio').val('').parent().show();
					$(dialog.getModalBody()).find('#bbox').empty().hide();
					
					dialog.setData('bbox');
					map.unByKey(a);
				});
			});

			$(dialog.getModalBody()).find('#buscar_bbox').click(function(event){

		  		dialog.close();

  				map.addInteraction(bbox);

  				bbox.on('boxend', function(){
      				var extension = bbox.getGeometry().getExtent();
      				//alert(extension);
      				//dialog.close();
      				dialog.open();
					$(dialog.getModalBody()).find('#lon_centro').val('').parent().hide();
					$(dialog.getModalBody()).find('#lat_centro').val('').parent().hide();
					$(dialog.getModalBody()).find('#radio').val('').parent().hide();
					dialog.setData('bbox', extension);
					//alert(dialog.getData('bbox'));
					$(dialog.getModalBody()).find('#bbox').empty().append('BBOX = [' + dialog.getData('bbox') + ']').show(); 	
					map.removeInteraction(bbox);		
      			});
		  	});

	  	}
  	});

	num_denuncias_io.on('error_query', function(data){
		$(q_dialog.getModalBody()).find('#lon_centro').val('').parent().show();
		$(q_dialog.getModalBody()).find('#lat_centro').val('').parent().show();
		$(q_dialog.getModalBody()).find('#radio').val('').parent().show();
		$(q_dialog.getModalBody()).find('#bbox').empty().hide(); 
		BootstrapDialog.show({ 
			title: 'Error consultando', 
			message: data.msg, 
			closable: true, 
			onshown: function(dialog){setTimeout(function(){dialog.close()}, 2000);}
		});
	});
  
	num_denuncias_io.on('api', function(data){
		// data --> info que genera la consulta del usuario
		//alert(typeof(data));
		q_dialog.setData('bbox');
		q_dialog.getButton('buscar_btn').enable().stopSpin();

		$(q_dialog.getModalBody()).find('#lon_centro').val('').parent().show();
		$(q_dialog.getModalBody()).find('#lat_centro').val('').parent().show();
		$(q_dialog.getModalBody()).find('#radio').val('').parent().show();
		$(q_dialog.getModalBody()).find('#bbox').empty().hide(); 

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
			var feature, type = denuncia.geometria.type, coordinates = denuncia.geometria.coordinates;
			
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

			denuncia.tipo = type;
			denuncia.coordenadas = coordinates;

			feature.attributes = {
				denuncia: denuncia
			};
			
			console.log(feature.attributes);
			vector.getSource().addFeature(feature);
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