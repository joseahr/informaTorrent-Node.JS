window.app = window.app || {};
var app = window.app;

/**
 * Control Creado para dibujar, eliminar, editar puntos lineas y polígonos
 */
app.Draw = function(opt_options, aux) {

  var options = opt_options || {};

  var wktFormat = new ol.format.WKT(),
	vectorSource = new ol.source.Vector(),
	vectorLayer = new ol.layer.Vector({
		source: vectorSource
	});

  map.addLayer(vectorLayer);

  this.getSource = function(){
  	return vectorSource;
  };

  this.toWKT = function(){
  	var wkt;
	vectorLayer.getSource().forEachFeature(function(feature){

		wkt = wktFormat.writeFeature(feature.clone());
		console.log('wkt: ' + wkt);
		return;
	});
	return wkt;
  };

  var denuncia = options.denuncia;
  if (denuncia){
  	var type = denuncia.geometria.type, 
	coordenadas = denuncia.geometria.coordinates;

	var feature;

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

  var loc_anterior;
  vectorSource.once('addfeature', function(e){
  	loc_anterior = e.feature;
  	console.log('FEATURE ANTERIOR: ', e.feature);
  });

  var button = document.createElement('button');
  button.setAttribute('id', 'show_menu');
  button.innerHTML = '<i class="fa fa-pencil"></i>';
  
  var active = false;
  
  var draw, listener; // Control de dibujar
  
  this.activar = function(bool){
  	  active = bool;
	  if(!bool){
	  	button.innerHTML = '<i class="fa fa-pencil"></i>';
	  	map.removeInteraction(draw);
	  	map.removeInteraction(modify);
	  }
	  else {
	  	map.getControls().forEach(function(control){
	  		if(control instanceof app.GetFeatureInfo){
	  			control.activar(false);
	  		}
	  	});
	  }
  };
  
  var this_ = this;
  
  var select = new ol.interaction.Select();

  map.addInteraction(select); // Seleccionar feature
  
  var modify = new ol.interaction.Modify({
	  features: select.getFeatures(),
	  // the SHIFT key must be pressed to delete vertices, so
	  // that new vertices can be drawn at the same position
	  // of existing vertices
	  deleteCondition: function(event) {
	    return ol.events.condition.shiftKeyOnly(event) && ol.events.condition.singleClick(event);
	  }
  });
  
  this.removeDraw = function(){
	  map.removeInteraction(draw);
  }
  
  this.removeModify = function(){
	  map.removeInteraction(modify);
  };
  
  /*
   * ESFERA GRS80, para realizar cálculos de la distancia más precisos
   * sobre una esfera de Radio 6378137 m
   */
  var grs80 = new ol.Sphere(6378137),
  sketch, // Feature que se está dibujando
  helpTooltipElement, // Elemento HTML (mensaje de ayuda)
  helpTooltip, // Overlay para ver el mensaje de ayuda
  measureTooltipElement, // Elemento HTML (mensaje de medición)
  measureTooltip, // Overlay para ver el mensaje de medición
  continuePolygonMsg = 'Click para continuar dibujado el polígono', // Mensaje que se muestra cuando un usuario dibuja un polígono
  continueLineMsg = 'Click para continuar dibujado la línea', // Mensaje que se muestra cuando un usuario dibuja una línea
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
  lastTooltip; // El último mensaje de ayuda

  /**
   * Nuevo mensaje de Info
   */
  function createHelpTooltip() {
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
  }


  /**
   * Nuevo mensaje de medición
   */
  function createMeasureTooltip() {
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
  }


  map.on('pointermove', pointerMoveHandler); // Mensaje línea / Polígono
  createMeasureTooltip();
  createHelpTooltip();

  
  function addInteraction(tipo) {
		
		draw = new ol.interaction.Draw({
			source: vectorSource,
			type: tipo
		});
		
	    draw.on('drawstart', function(evt){
	    	if (lastTooltip)
	    		map.removeOverlay(lastTooltip);
	    	vectorSource.clear();
	    	wkt = undefined;
	    	sketch = evt.feature;
	    	
	        /** @type {ol.Coordinate|undefined} */
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
	    	
	    }, this);
	    
	    draw.on('drawend', function(evt){
	    	if (!aux){
	    		measureTooltipElement.className = 'tooltip tooltip-static';
		        measureTooltip.setOffset([0, -7]);
		        // unset sketch
		        sketch = null;
		        // unset tooltip so that a new one can be created
		        lastTooltip = measureTooltip;
		        measureTooltipElement = null;
		        createMeasureTooltip();
		        ol.Observable.unByKey(listener);
	    	}
	    	else {
	    		measureTooltipElement.className = 'tooltip tooltip-static';
				measureTooltip.setOffset([0, -7]);
				// unset sketch
				sketch = null;
				// unset tooltip so that a new one can be created
				lastTooltip = measureTooltip;
				measureTooltipElement = null;
				createMeasureTooltip();
				ol.Observable.unByKey(listener);
				
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
						vectorSource.dispatchChangeEvent(); 
						dialog.close();
					}},
					{label:'Aceptar', action: function(dialog){
						dialog.close();

						var xhr = new XMLHttpRequest();
				
						xhr.open('POST', '/app/perfil/editar_loc' , true); // Método POST
			
						xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8"); // Especificamos cabecera
				
						xhr.send(JSON.stringify({wkt: wkt, distancia: val})); // Enviamos petición
						
						xhr.onload = function(){
				
						  	var res = JSON.parse(xhr.responseText);

							BootstrapDialog.show({
				
								title: 'Actualizar localización',
								message: res.msg,
								buttons: [{label: 'Cerrar', action: function(dialog){dialog.close();}}],
								onshown: function(dialog){setTimeout(function(){

									dialog.close();
									if(res.error) {
						 				vectorSource.clear();
						 				console.log(loc_anterior);
						 				vectorSource.addFeature(loc_anterior);
						 				vectorSource.dispatchChangeEvent(); 
						 				console.log('ERROR JODER: QUITAMOS TO Y PONEMOS LO DE ANTES');
						 			}

								}, 3000);}
				
							});
					
							if(res.error){
					
								if (lastTooltip)
									map.removeOverlay(lastTooltip);
								vectorSource.clear();	
								wkt = undefined;	
								sketch = evt.feature;
					
							}
					
				
						}

					}}],

					onshown: function(dialog){
						$('#distancia').selectpicker({
					  		width: '100%'
				  		});
						$('#distancia').change(function(event){
							val = $('#distancia').val();
							//alert(val);
						});
					}

				});
	    	}
	    }, this);
	    
	    /**
	     * format length output
	     * @param {ol.geom.LineString} line
	     * @return {string}
	     */
	    var formatLength = function(line) {
	    	
	        var coordinates = line.getCoordinates();
	        length = 0;
	        var sourceProj = map.getView().getProjection();
	        for (var i = 0, ii = coordinates.length - 1; i < ii; ++i) {
	          var c1 = ol.proj.transform(coordinates[i], sourceProj, 'EPSG:4326');
	          var c2 = ol.proj.transform(coordinates[i + 1], sourceProj, 'EPSG:4326');
	          length += grs80.haversineDistance(c1, c2);
	        }
	      
	      var output;
	      if (length > 100) {
	        output = (Math.round(length / 1000 * 100) / 100) +
	            ' ' + 'km';
	      } else {
	        output = (Math.round(length * 100) / 100) +
	            ' ' + 'm';
	      }
	      return output;
	    };


	    /**
	     * format length output
	     * @param {ol.geom.Polygon} polygon
	     * @return {string}
	     */
	    var formatArea = function(polygon) {
	    	
	      var area;
	      var sourceProj = map.getView().getProjection();
	      var geom = /** @type {ol.geom.Polygon} */(polygon.clone().transform(
	          sourceProj, 'EPSG:4326'));
	      var coordinates = geom.getLinearRing(0).getCoordinates();
	      area = Math.abs(grs80.geodesicArea(coordinates));
	      
	      var output;
	      if (area > 10000) {
	        output = (Math.round(area / 1000000 * 100) / 100) +
	            ' ' + 'km<sup>2</sup>';
	      } else {
	        output = (Math.round(area * 100) / 100) +
	            ' ' + 'm<sup>2</sup>';
	      }
	      return output;
	    };
	    
	    map.addInteraction(draw);
	} // Fin de función addInteraction()
  
  function draw_ (){
	  
	  var message;
	  
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
	  
	  this_.activar(!active);
	  var a = aux ? 'localización preferida' : 'geometría para la denuncia'
	  if(active)
		  BootstrapDialog.show({
			  title: 'Dibujar ' + a,
			  message: message,
			  buttons: [{label: 'Cerrar', action: function(dialog){dialog.close();}}],
			  onshown: function(dialog){
				  $('#dibujar').selectpicker({
					  width: '100%'
				  });
				  
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
						  addInteraction('LineString');
						  active = true;
						  button.innerHTML = '<i class="fa fa-pencil" style="color:#ffbb00"></i>';
					  }
					  else if(opcion == 'poligono'){
						  if(draw) map.removeInteraction(draw);
						  map.removeInteraction(modify);
						  addInteraction('Polygon');
						  active = true;
						  button.innerHTML = '<i class="fa fa-pencil" style="color:#ffbb00"></i>';
					  }
					  else if(opcion == 'editar'){
						  if(draw) map.removeInteraction(draw);
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
							  buttons: [{label: 'Cancelar', action: function(dialog_){dialog_.close();dialog.close();}},
								  		{label: 'Aceptar', action: function(dialog_){
											  map.removeInteraction(modify);
											  vectorSource.clear();
											  map.removeOverlay(lastTooltip);
											  dialog_.close();
								  		}}]
						  });
					  }
					  else if(opcion == 'nada'){
					  	  button.innerHTML = '<i class="fa fa-pencil"></i>';
						  map.removeInteraction(modify);
						  map.removeInteraction(draw);
						  active = false;
					  }
					  
				  });
			  }
		  });
	  
  }

  button.addEventListener('click', draw_, false);

  var element = document.createElement('div');
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
