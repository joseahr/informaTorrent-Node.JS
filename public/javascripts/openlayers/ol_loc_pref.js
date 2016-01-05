var resolutions = new Array(22),
	matrixIds = new Array(22),
	resInicial = 0.703125,
	wkt,
	wktFormat = new ol.format.WKT(),
	vectorSource = new ol.source.Vector(),
	vectorLayer = new ol.layer.Vector({
		source: vectorSource
	}),
	isDrawInteractionActive = false,
	draw; // Control de dibujar

for (var i=0; i < 22; i++){
	matrixIds[i] = "EPSG:4326:" + i;
	resolutions[i] = resInicial/Math.pow(2,i);
}

function toWKT(){ // Convertimos la geometría de la denuncia a WKT,
				  // Se ejecuta cuando enviamos los datos al servidor
	vectorSource.forEachFeature(function(feature){

		wkt = wktFormat.writeFeature(feature.clone());
		console.log('wkt: ' + wkt);
		alert('WKTTT: ' + wkt);
		
	});
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
  if (evt.dragging || !isDrawInteractionActive) {
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

// Añadimos Control OverviewMap
map.addControl(new ol.control.OverviewMap({
	   layers: [new ol.layer.Tile(ignBase.getProperties())], 
	   view: new ol.View({ // Importante añadir la View con nuestra proyección
		   projection: proj  
	   })
}));

// Geometría que estamos dibujando
map.addLayer(vectorLayer);

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
		'</select>';

		var val = 0;

		BootstrapDialog.show({
			title: 'Cambiar ubicación preferida y distancia de aviso',
			message: $(html),
			buttons: [{label:'Aceptar', action: function(dialog){
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

			
				$('#distancia').change(function(event){
					val = $('#distancia').val();
					alert(val);
				});

				alert($('#distancia').val());

			}

		});
		
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