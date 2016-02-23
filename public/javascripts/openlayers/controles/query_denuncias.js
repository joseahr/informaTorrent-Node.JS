window.app = window.app || {};
var app = window.app;

/**
 * Control Creado para filtrar denuncias en el mapa
 */
app.QueryDenuncias = function(opt_options) {
	
	var options = opt_options || {};

  	var button = document.createElement('button');
  	button.innerHTML = '<i class="fa fa-search"></i>';

  	var this_ = this;
  
	num_denuncias_io.on('api', function(data){
		// data --> info que genera la consulta del usuario
		//alert(typeof(data));
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
		var geojson = new ol.format.GeoJSON();
		data.query.forEach(function(denuncia){
		
			//alert(JSON.stringify(denuncia));
			var feature, type = JSON.parse(denuncia.geometria).type;
			//alert('tipo ' + type);
			if(type == 'Point'){
		    	feature = new ol.Feature({
		    		  geometry: new ol.geom.Point(JSON.parse(denuncia.geometria).coordinates),
		    		  name: 'Denuncia - Punto'
		    	});
		    	
		    }
		    else if(type == 'LineString'){
		    	feature = new ol.Feature({
		    		geometry: new ol.geom.LineString(JSON.parse(denuncia.geometria).coordinates),
		    		name: 'Denuncia - Polígono'
		    	});
		    }
		    else if(type == 'Polygon'){
		    	feature = new ol.Feature({
		    		geometry: new ol.geom.Polygon(JSON.parse(denuncia.geometria).coordinates),
		    		name: 'Denuncia - Polígono'
		    	});
		    }
		    
			feature.attributes = {
				denuncia: denuncia
			};
			
			vector.getSource().addFeature(feature);			
			
		});
		
	});
  
	function query_ (){
		  
	  var html = '<div class="row">' +
	  			'<div class="col-lg-6"><div class="input-group"><span class="input-group-addon">Título</span>' +
	  			'<input class="form-control btn-default" id="titulo" type="text" name="titulo" placeholder="buscar por título..."></input></div></div>' + 
	  			'<div class="col-lg-6"><div class="input-group"><span class="input-group-addon"><i class="fa fa-tags"></i></span>' +
	  			'<input class="form-control btn-default" id="tags" type="text" name="tags" placeholder="contiene el tag..."></input></div></div>' +
	  			'<div class="col-lg-6" style="margin-top: 20px;" ><div class="input-group"><span class="input-group-addon"><i class="fa fa-user"></i></span>' +
	  			'<input class="form-control btn-default" id="username" type="text" name="username" placeholder="denunciado por..."></input></div></div>' +
	  			'<div class="col-lg-6"></div>' +
	  			'<div class="col-lg-12"><h4> Denuncias cercanas a...</h4><p> Introduce el centro y el radio de búsqueda. Para saber las coordenadas del centro dirígete a <a href="http://epsg.io/4258/map" target="_blank">http://epsg.io/4258/map</a>. El separador decimal es el punto "." o la coma ",". O haz click <a id="punto_centro_buffer" href="#">aquí</a> para dibujar un punto en el mapa </p></div>' +
	  			'<div class="col-lg-4" style="margin-top: 20px;" ><div class="input-group"><span class="input-group-addon">φ</span>' +
	  			'<input class="form-control btn-default" id="lat_centro" type="text" name="lat" placeholder="Latitud del centro del buffer (φ)"></input></div></div>' +
	  			'<div class="col-lg-4" style="margin-top: 20px;" ><div class="input-group"><span class="input-group-addon">λ</i></span>' +
	  			'<input class="form-control btn-default" id="lon_centro" type="text" name="lon" placeholder="Longitud del centro del buffer (λ)"></input></div></div>' +
	  			'<div class="col-lg-4" style="margin-top: 20px;" ><div class="input-group"><span class="input-group-addon"><i class="glyphicon glyphicon-record"></i></span>' +
	  			'<input class="form-control btn-default" id="radio" type="text" name="username" placeholder="Radio del buffer"></input></div></div>' +
	  			'<div class="col-lg-12"><h4> Buscar por fecha</h4><p>Buscar denuncias por fecha</p></div>' +
	  			'<div class="col-lg-6"><div class="input-group"><span class="input-group-addon"><i class="fa fa-calendar"></i></span>' +
	  			'<input  autocomplete="off" class="form-control btn-default datepicker" id="fecha_desde" type="text" name="titulo" placeholder="Desde dd/mm/aaaa"></input></div></div>' + 
	  			'<div class="col-lg-6"><div class="input-group"><span class="input-group-addon"><i class="fa fa-calendar"></i></span>' +
	  			'<input  autocomplete="off" class="form-control btn-default datepicker" id="fecha_hasta" type="text" name="tags" placeholder="Hasta dd/mm/aaaa"></input></div></div>' +
	  			'</div>';
	  
	  BootstrapDialog.show({
		  title: 'Buscar denuncias por...', 
		  message: html,
		  draggable: true,
		  autodestroy: false,
		  buttons: [{label: 'Cerrar', action: function(dialog){dialog.close();}}, 
		            {label: 'Buscar', action: function(dialog){
		            	var data = {};
		            	data.titulo = $(dialog.getModalBody()).find('#titulo').val();
		            	data.tags = $(dialog.getModalBody()).find('#tags').val();
		            	data.username = $(dialog.getModalBody()).find('#username').val(); 
		            	data.lon = $(dialog.getModalBody()).find('#lon_centro').val();
		            	data.lat = $(dialog.getModalBody()).find('#lat_centro').val(); 
		            	data.buffer_radio = $(dialog.getModalBody()).find('#radio').val(); 
		            	data.fecha_desde = $(dialog.getModalBody()).find('#fecha_desde').val(); 
		            	data.fecha_hasta = $(dialog.getModalBody()).find('#fecha_hasta').val(); 
		            	num_denuncias_io.emit('query', data);
		            }}],
		  onshown: function(dialog){ 
			  $('.datepicker').datepicker({ format: 'dd/mm/yyyy', language: 'es', todayBtn: true, todayHighlight: true });
			  $(dialog.getModalBody()).find('#punto_centro_buffer').click(function(event){
				  dialog.close();
				  var a = map.on('click', function(e){
					  var coor = e.coordinate;
					  dialog.open();
					  $(dialog.getModalBody()).find('#lon_centro').val(coor[0]);
					  $(dialog.getModalBody()).find('#lat_centro').val(coor[1]);
						  map.unByKey(a);
					  });
				  });
			  }
		  });
	
	}

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