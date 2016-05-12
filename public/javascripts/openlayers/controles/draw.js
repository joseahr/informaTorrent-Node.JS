window.app = window.app || {};
var app = window.app;

/**
 * Control Creado para dibujar, eliminar, editar puntos lineas y polígonos
 */
app.Draw = function(opt_options, aux) {

	var options = opt_options || {},
	geometria_modificada = false,
	grs80 = new ol.Sphere(6378137),
	lastTooltip,
  	sketch, // Feature que se está dibujando
  	helpTooltipElement, // Elemento HTML (mensaje de ayuda)
  	helpTooltip, // Overlay para ver el mensaje de ayuda
  	measureTooltipElement, // Elemento HTML (mensaje de medición)
  	measureTooltip, // Overlay para ver el mensaje de medición
  	continuePolygonMsg = 'Click para continuar dibujado el polígono', // Mensaje que se muestra cuando un usuario dibuja un polígono
  	continueLineMsg = 'Click para continuar dibujado la línea', // Mensaje que se muestra cuando un usuario dibuja una línea
	message,
	active = false,
	draw,
	listener,
	button = document.createElement('button'),
	element = document.createElement('div'),
		wktFormat = new ol.format.WKT(),
	vectorSource = new ol.source.Vector(),
	vectorLayer = new ol.layer.Vector({
		source: vectorSource,
		displayInLayerSwitcher: false,
	}),
	loc_anterior,
	denuncia = options.denuncia,
	this_ = this,
	select = new ol.interaction.Select(),
	snap = new ol.interaction.Snap({ source : vectorSource});
	addInteraction = function(tipo) {
		draw = new ol.interaction.Draw({
			source: vectorSource,
			type: tipo
		});
		draw.on('drawstart', draw_start, this);
		draw.on('drawend', draw_end, this);
		map.addInteraction(draw);
	},
	formatLength = function(line) {
    	var coordinates = line.getCoordinates();
        length = 0;
        var sourceProj = map.getView().getProjection();
        for (var i = 0, ii = coordinates.length - 1; i < ii; ++i) {
        	var c1 = ol.proj.transform(coordinates[i], sourceProj, 'EPSG:4326');
          	var c2 = ol.proj.transform(coordinates[i + 1], sourceProj, 'EPSG:4326');
          	length += grs80.haversineDistance(c1, c2);
        }
      
      	var output;

      	if(length > 150) $(measureTooltipElement).css('color', '#d54339');
      	else $(measureTooltipElement).css('color', '#fff');

      	if (length > 100) {
        	output = (Math.round(length / 1000 * 100) / 100) + ' ' + 'km';
      	} else {
        	output = (Math.round(length * 100) / 100) + ' ' + 'm';
      	}
      	return output;
    },
   	formatArea = function(polygon) {
    	var area;
      	var sourceProj = map.getView().getProjection();
      	var geom = (polygon.clone().transform(sourceProj, 'EPSG:4326'));
      	var coordinates = geom.getLinearRing(0).getCoordinates();
      	var area = Math.abs(grs80.geodesicArea(coordinates));
      
      	var output;

      	if(area > 1200) $(measureTooltipElement).css('color', '#d54339');
      	else $(measureTooltipElement).css('color', '#fff');

      	if (area > 10000) {
        	output = (Math.round(area / 1000000 * 100) / 100) + ' ' + 'km<sup>2</sup>';
      	} else {
        	output = (Math.round(area * 100) / 100) + ' ' + 'm<sup>2</sup>';
      	}
      	return output;
    },
    createMeasureTooltip = function(){
    	if (measureTooltipElement) {
      		measureTooltipElement.parentNode.removeChild(measureTooltipElement);
    	}
    	measureTooltipElement = document.createElement('div');
    	measureTooltipElement.className = 'tooltip tooltip-measure';
    	measureTooltip = new ol.Overlay({
      		element: measureTooltipElement,
      		offset: [0, -15],
      		positioning: 'bottom-center'
    	});
    	map.addOverlay(measureTooltip);
  	},
	createHelpTooltip = function(){
    	if (helpTooltipElement) {
      		helpTooltipElement.parentNode.removeChild(helpTooltipElement);
    	}
    	helpTooltipElement = document.createElement('div');
    	helpTooltipElement.className = 'tooltip hidden';
    	helpTooltip = new ol.Overlay({
      		element: helpTooltipElement,
      		offset: [15, 0],
      		positioning: 'center-left'
    	});
    	map.addOverlay(helpTooltip);
  	},
  	pointerMoveHandler = function(evt) { // Función que se ejecuta cada vez que nos movemos por el mapa
    	if (evt.dragging || !active) {
      		return;
    	}
    	var helpMsg = 'Click para empezar a dibujar';

    	if (sketch) {
      		var geom = (sketch.getGeometry());
      		if (geom instanceof ol.geom.Polygon) {
        		helpMsg = continuePolygonMsg;
      		} else if (geom instanceof ol.geom.LineString) {
        		helpMsg = continueLineMsg;
      		}
    	}

    	helpTooltipElement.innerHTML = helpMsg;
    	helpTooltip.setPosition(evt.coordinate);

    	$(helpTooltipElement).removeClass('hidden');
  	},
  	draw,
    modify = new ol.interaction.Modify({
  		features: select.getFeatures(),
  		deleteCondition: function(event) {
    		return ol.events.condition.shiftKeyOnly(event) && ol.events.condition.singleClick(event);
  		}
	});

  	this.removeDraw = function(){
		map.removeInteraction(draw);
		map.removeInteraction(snap);
  	};
  
  	this.removeModify = function(){
		map.removeInteraction(modify);
		map.removeInteraction(snap);
  	};

  	this.getSource = function(){
  		return vectorSource;
  	};

  	this.toWKT = function(){
  		if(!geometria_modificada)
  			return null;
  		var wkt;
		vectorLayer.getSource().forEachFeature(function(feature){
			wkt = wktFormat.writeFeature(feature.clone());
			console.log('wkt: ' + wkt);
			return;
		});
		return wkt;
  	}; // this.toWKT

  	this.activar = function(bool){
  		active = bool;
	  	if(!bool){
	  		button.innerHTML = '<i class="fa fa-pencil"></i>';
	  		map.removeInteraction(draw);
	  		map.removeInteraction(modify);
	  		map.removeInteraction(snap);
	  		$(helpTooltipElement).css('display', 'none');
	  	}
	  	else {
	 		$(helpTooltipElement).css('display', '');
	  	}
  	}; // this.activar 

  	// config **************************************
  	map.addLayer(vectorLayer);
  	map.addInteraction(select); // Seleccionar feature
  	map.on('pointermove', pointerMoveHandler); // Mensaje línea / Polígono
  	createMeasureTooltip();
  	createHelpTooltip();
  	button.setAttribute('id', 'show_menu');
  	button.innerHTML = '<i class="fa fa-pencil"></i>';

  	if (denuncia){
  		var type = denuncia.geometria.type, 
		coordenadas = denuncia.geometria.coordinates,
		feature;

		if(type == 'Point'){
			feature = new ol.Feature({
			 	geometry: new ol.geom.Point(coordenadas),
			  	name: 'Denuncia - Punto'
			});
		}
		else if(type == 'LineString'){
			feature = new ol.Feature({
				geometry: new ol.geom.LineString(coordenadas),
				name: 'Denuncia - Polígono'
			});
		}
		else if(type == 'Polygon'){
			feature = new ol.Feature({
				geometry: new ol.geom.Polygon(coordenadas),
				name: 'Denuncia - Polígono'
			});
		}
		console.log(feature, 'feature');
		vectorSource.addFeature(feature);

		var geom = feature.getGeometry().getExtent();
		var size = map.getSize();

		map.getView().fit(geom,size);
  	}
  	// config *******************************************

  	// ***************** Eventos draw, modify ********************	
  	vectorSource.once('addfeature', function(e){
  		loc_anterior = e.feature;
  		console.log('FEATURE ANTERIOR: ', e.feature);
  	});

	var draw_start = function(evt){
		if (lastTooltip)
	    	map.removeOverlay(lastTooltip);
	    $(measureTooltipElement).css('display', '');
	    vectorSource.clear();
	    wkt = undefined;
	    sketch = evt.feature;
	    	
	    var tooltipCoord = evt.coordinate;

	    listener = sketch.getGeometry().on('change', function(evt) {
	    	var geom = evt.target;
	        var output;
	        if (geom instanceof ol.geom.Polygon) {
	        	output = formatArea(/** @type {ol.geom.Polygon} */ (geom));
	            tooltipCoord = geom.getInteriorPoint().getCoordinates();
	        } else if (geom instanceof ol.geom.LineString) {
	            output = formatLength( /** @type {ol.geom.LineString} */ (geom));
	            tooltipCoord = geom.getLastCoordinate();
	        }
	        measureTooltipElement.innerHTML = output;
	        measureTooltip.setPosition(tooltipCoord);
	    });
	    	
	}; // drawstart
	    
	var draw_end = function(evt){
		this_.activar(false);
		geometria_modificada = true;
		if (!aux){
	    	measureTooltipElement.className = 'tooltip tooltip-static';
		    measureTooltip.setOffset([0, -7]);
		    lastTooltip = measureTooltip;
		    measureTooltipElement = null;
		    createMeasureTooltip();
		    // sketch = null;
		    //ol.Observable.unByKey(listener);
	    } else {
	    	measureTooltipElement.className = 'tooltip tooltip-static';
			measureTooltip.setOffset([0, -7]);
			//sketch = null;
			lastTooltip = measureTooltip;
			measureTooltipElement = null;
			createMeasureTooltip();
			//ol.Observable.unByKey(listener);
				
			var wkt = wktFormat.writeFeature(evt.feature.clone());
				
			//alert('wkt' + wkt);
			var html = '<p>Elige la distancia que se utilizará como radio de aviso</p><select id="distancia" data-style="btn-default">' + 
				'<option value="0">0</option>' +
				'<option value="50">50</option>' +
				'<option value="100">100</option>' +
				'<option value="150">150</option>' +
				'<option value="200">200</option>' +
				'<option value="250">250</option>' +
				'<option value="300">300</option>' +
			'</select>';

			var val = 0;

			BootstrapDialog.show({
				title: 'Cambiar ubicación preferida y distancia de aviso',
				closable: false,
				draggable: true,
				message: $(html),
				buttons: [{label:'Cerrar', action: function(dialog){
					vectorSource.clear();
					vectorSource.addFeature(loc_anterior);
					//vectorSource.dispatchChangeEvent(); 
					dialog.close();
				}},
				{label:'Aceptar', action: function(dialog){
					dialog.close();
					var xhr = new XMLHttpRequest();
					xhr.open('PUT', '/app/usuarios/perfil/localizacion' , true); // Método POST
					xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8"); // Especificamos cabecera
					xhr.send(JSON.stringify({wkt: wkt, distancia: val})); // Enviamos petición
					
					// Recibimos respuesta del servidor
					xhr.onreadystatechange = function(){
						if(xhr.status === 200 && xhr.readyState === 4)
							BootstrapDialog.show({
								title : 'OK',
								message : JSON.parse(xhr.responseText).msg,
								onshow : function(dialog){
									console.log('dialog cambia color ');
									$(dialog.getModalHeader()).css('background', '#4dac26');
								}
							});
						else if(xhr.status === 500 && xhr.readyState === 4){
							BootstrapDialog.show({
								title : 'ERROR',
								message : JSON.parse(xhr.responseText).msg,
								onshown : function(dialog){
									$(dialog.getModalHeader()).css('background', '#800000');
									setTimeout(function(){dialog.close()}, 3000);
								}
							});
			 				vectorSource.clear();
			 				console.log(loc_anterior);
			 				vectorSource.addFeature(loc_anterior);
			 				//vectorSource.dispatchChangeEvent(); 
							if (lastTooltip)
								map.removeOverlay(lastTooltip);
							wkt = undefined;	
							sketch = evt.feature;
			 				console.log('ERROR JODER: QUITAMOS TO Y PONEMOS LO DE ANTES');
						}
					}
				}}], // buttons
			    onshow : function(dialog){
			        dialog.getModalHeader().replaceWith($('<div class="row" style="margin: 0px; padding-top: 5px; border-top-left-radius: 10px; border-top-right-radius: 10px; background: url(&#39;http://www.batlleiroig.com/wp-content/uploads/247_parc_central_st_cugat_8.jpg&#39;); background-size: cover; background-repeat: no-repeat;">' + 
				      '<div class="bootstrap-dialog-close-button">' + 
				        '<button class="close" style="color : #fff; margin-right : 10px;">X</button>' +
				      '</div>' +
			          '<div class="col-xs-6" style="text-align: center; color: #fff; font-weight : bold;">' +
			          '<i class="fa fa-pencil" style="font-size : 60px; color : #00bbff; text-shadow: 2px 2px #fff;"></i>' + 
			            '<h4 style="padding : 2px; color : #00bbff; background : rgba(0,0,0,0.7); border-radius : 15px;"> Distancia de aviso</h4>' +
			          '</div>' +
			        '</div>'));
			        dialog.getModalDialog().find('.close').click(function(){dialog.close()});
			        dialog.getModalBody().parent().css('border-radius', '15px');
			        dialog.getModalBody().css('padding-top', '10px');
			    },
				onshown: function(dialog){
					$('#distancia').selectpicker({
					  	width: '100%'
				  	}).selectpicker('mobile');
					$('#distancia').change(function(event){
						val = $('#distancia').val();
						//alert(val);
					});
				}

			}); // bootstrap dialog show
	    }
	}; // drawend

	select.on('select', function(){
		console.log('deselect', select.getFeatures(), select.getFeatures().length);
		var aux = true;
		select.getFeatures().forEach(function(f){
			aux = false;
		});
		if(aux){
			map.getInteractions().forEach(function(i){
				if(i instanceof ol.interaction.Modify){
					this_.activar(false);
					map.removeInteraction(modify);
				}
			});
		}
	});

	modify.on('modifystart', function(e){
  		if (lastTooltip)
			map.removeOverlay(lastTooltip);
  		var feature = e.features.getArray()[0];
  		sketch.setGeometry(feature.getGeometry());
  	});
  	// ***************** Eventos draw, modify ********************
  
	function draw_ (){
		this_.activar(!active);

		if(aux) message = '<select id="dibujar" data-style="btn-default">' + 
			'<option value="nada">Nada</option>' +
			'<option value="punto">Punto</option>' +
		'</select>';
	  	else message = '<select id="dibujar" data-style="btn-default">' + 
			'<option value="nada">Nada</option>' +
			'<option value="punto">Punto</option>' +
			'<option value="linea">Línea</option>' +
			'<option value="poligono">Polígono</option>' +
			'<option value="editar">Editar</option>' +
			'<option value="eliminar">Eliminar</option>' +
		'</select>';
	  
	  	var a = aux ? 'localización preferida' : 'geometría para la denuncia'
	  	if(active)
		  	BootstrapDialog.show({
			  	title: 'Dibujar ' + a,
			  	message: message,
			  	buttons: [{label: 'Cerrar', action: function(dialog){dialog.close();}}],
				onshow : function(dialog){
					dialog.getModalHeader().replaceWith($('<div class="row" style="margin: 0px; padding-top: 5px; border-top-left-radius: 10px; border-top-right-radius: 10px; background: url(&#39;http://www.batlleiroig.com/wp-content/uploads/247_parc_central_st_cugat_8.jpg&#39;); background-size: cover; background-repeat: no-repeat;">' + 
			          '<div class="bootstrap-dialog-close-button">' + 
			            '<button class="close" style="color : #fff; margin-right : 10px;">X</button>' +
			          '</div>' +
					  '<div class="col-xs-6" style="text-align: center; color: #fff; font-weight : bold;">' +
					  '<i class="fa fa-pencil" style="font-size : 60px; color : #00bbff; text-shadow: 2px 2px #fff;"></i>' + 
					    '<h4 style="padding : 2px; color : #00bbff; background : rgba(0,0,0,0.7); border-radius : 15px;"> Dibujar ' + a + '</h4>' +
					  '</div>' +
					'</div>'));
					dialog.getModalDialog().find('.close').click(function(){dialog.close()});
					dialog.getModalBody().parent().css('border-radius', '15px');
					dialog.getModalBody().css('padding-top', '10px');
				},
			  	onshown: function(dialog){
				  	$('#dibujar').selectpicker({
					  	width: '100%'
				  	}).selectpicker('mobile');
				  
				  	$('#dibujar').change(function(){
					  	var opcion = $(this).val();
					  
					  	if(opcion == 'punto'){
						  	if(draw) map.removeInteraction(draw);
						  	map.removeInteraction(modify);
						  	addInteraction('Point');
						  	active = true;
						  	button.innerHTML = '<i class="fa fa-pencil" style="color:#ffbb00"></i>';
					  	}
					  	else if(opcion == 'linea'){
						  	if(draw) map.removeInteraction(draw);
						  	map.removeInteraction(modify);
						  	map.addInteraction(snap);
						  	addInteraction('LineString');
						  	active = true;
						  	button.innerHTML = '<i class="fa fa-pencil" style="color:#ffbb00"></i>';
					  	}
					  	else if(opcion == 'poligono'){
						  	if(draw) map.removeInteraction(draw);
						  	map.removeInteraction(modify);
						  	map.addInteraction(snap);
						  	addInteraction('Polygon');
						  	active = true;
						  	button.innerHTML = '<i class="fa fa-pencil" style="color:#ffbb00"></i>';
					  	}
					  	else if(opcion == 'editar'){
						  	if(draw) map.removeInteraction(draw);
						  	map.addInteraction(snap);
						  	map.addInteraction(modify);
						  	active = true;
						  	button.innerHTML = '<i class="fa fa-pencil" style="color:#ffbb00"></i>';
					  	}
					  	else if(opcion == 'eliminar'){
					  	  	button.innerHTML = '<i class="fa fa-pencil"></i>';
					  	  	active = false;
						  	BootstrapDialog.show({
							  	title: 'Eliminar denuncia dibujada',
							  	message: '¿Desea eliminar la denuncia dibujada?',
							  	buttons: [
							  		{label: 'Cancelar', action: function(dialog_){dialog_.close();dialog.close();}},
								  	{label: 'Aceptar', action: function(dialog_){
										map.removeInteraction(modify);
										map.removeInteraction(snap);
										vectorSource.clear();
										map.removeOverlay(lastTooltip);
										$(measureTooltipElement).css('display', 'none');
										dialog_.close();
								  	}}
								]
						  	});
					  	}
					  	else if(opcion == 'nada'){
					  	  	button.innerHTML = '<i class="fa fa-pencil"></i>';
						  	map.removeInteraction(modify);
						  	map.removeInteraction(draw);
						  	map.removeInteraction(snap);
						  	active = false;
					  	}
					  
				  	}); // s('DIBUJAR') CHANGE
			  	},
			  	onhide : function(d){
			  		var ii = $(d.getModalBody()).find('#dibujar').val();
			  		if(ii == 'nada' || ii == 'eliminar'){
			  			console.log('no elegiste naa mi parse');
			  			this_.activar(false);
			  		}
			  	},
		  	});  
  	} // Contructor

  	button.addEventListener('click', draw_, false);
  	element.setAttribute('data-toggle', 'left');
  	element.setAttribute('title', 'Dibujar');
  	element.setAttribute('data-content', 'Herramientas para dibujar, editar y eliminar denuncias en el mapa');
  	element.className = 'draw ol-unselectable ol-control';
  	element.appendChild(button);

  	ol.control.Control.call(this, {
    	element: element,
    	target: options.target
  	});

};
ol.inherits(app.Draw, ol.control.Control);
