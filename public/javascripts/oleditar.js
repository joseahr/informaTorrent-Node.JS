var image = new ol.style.Circle({
	radius: 5,
	fill: null,
	stroke: new ol.style.Stroke({color: 'red', width: 1})
});

var styles = {
		  'Point': [new ol.style.Style({
		    image: image
		  })],
		  'LineString': [new ol.style.Style({
		    stroke: new ol.style.Stroke({
		      color: 'green',
		      width: 1
		    })
		  })],
		  'MultiLineString': [new ol.style.Style({
		    stroke: new ol.style.Stroke({
		      color: 'green',
		      width: 1
		    })
		  })],
		  'MultiPoint': [new ol.style.Style({
		    image: image
		  })],
		  'MultiPolygon': [new ol.style.Style({
		    stroke: new ol.style.Stroke({
		      color: 'yellow',
		      width: 1
		    }),
		    fill: new ol.style.Fill({
		      color: 'rgba(255, 255, 0, 0.1)'
		    })
		  })],
		  'Polygon': [new ol.style.Style({
		    stroke: new ol.style.Stroke({
		      color: 'blue',
		      lineDash: [4],
		      width: 3
		    }),
		    fill: new ol.style.Fill({
		      color: 'rgba(0, 0, 255, 0.1)'
		    })
		  })],
		  'GeometryCollection': [new ol.style.Style({
		    stroke: new ol.style.Stroke({
		      color: 'magenta',
		      width: 2
		    }),
		    fill: new ol.style.Fill({
		      color: 'magenta'
		    }),
		    image: new ol.style.Circle({
		      radius: 10,
		      fill: null,
		      stroke: new ol.style.Stroke({
		        color: 'magenta'
		      })
		    })
		  })],
		  'Circle': [new ol.style.Style({
		    stroke: new ol.style.Stroke({
		      color: 'red',
		      width: 2
		    }),
		    fill: new ol.style.Fill({
		      color: 'rgba(255,0,0,0.2)'
		    })
	})]
};

var styleFunction = function(feature, resolution) {
  return styles[feature.getGeometry().getType()];
};

/******/
//alert(geojsonDenuncia);
var format = new ol.format.GeoJSON();

var wkt;

var wktFormat = new ol.format.WKT();

var vectorSource = new ol.source.Vector({
    format: format
});

var vectorLayer = new ol.layer.Vector({
    source: vectorSource,
    style: styleFunction
});

function toWKT(){
	vectorLayer.getSource().forEachFeature(function(feature){

		wkt = wktFormat.writeFeature(feature.clone());
		console.log('wkt: ' + wkt);
		//alert(wkt);
	});
};

function showMap(){
	console.log('showMAp');
	/**
	************* CARGAR GEOMETRÍA DENUNCIA
	**/
	
	console.log(json);
	
	var type = json.type;
	
	var feature;
	
	if(type == 'Point'){
		feature = new ol.Feature({
			  geometry: new ol.geom.Point(json.coordinates),
			  name: 'Denuncia - Punto'
		});
	}
	else if(type == 'LineString'){
		feature = new ol.Feature({
			geometry: new ol.geom.LineString(json.coordinates),
			name: 'Denuncia - Polígono'
		});
	}
	else if(type == 'Polygon'){
		feature = new ol.Feature({
			geometry: new ol.geom.Polygon(json.coordinates),
			name: 'Denuncia - Polígono'
		});
	}
	
	vectorSource.addFeature(feature);
	
	
	
	/////////////////////IGUAL QUE OLNUEVA.JS////////////////////////
	
	/*
	 * ESFERA GRS80, para realizar cálculos de la distancia más precisos
	 * sobre una esfera de Radio 6378137 m
	 */
	var grs80 = new ol.Sphere(6378137);
	
	/**
	 * Currently drawn feature.
	 * @type {ol.Feature}
	 */
	var sketch;
	
	
	/**
	 * The help tooltip element.
	 * @type {Element}
	 */
	var helpTooltipElement;
	
	
	/**
	 * Overlay to show the help messages.
	 * @type {ol.Overlay}
	 */
	var helpTooltip;
	
	
	/**
	 * The measure tooltip element.
	 * @type {Element}
	 */
	var measureTooltipElement;
	
	
	/**
	 * Overlay to show the measurement.
	 * @type {ol.Overlay}
	 */
	var measureTooltip;
	
	
	/**
	 * Message to show when the user is drawing a polygon.
	 * @type {string}
	 */
	var continuePolygonMsg = 'Click para continuar dibujado el polígono';
	
	
	/**
	 * Message to show when the user is drawing a line.
	 * @type {string}
	 */
	var continueLineMsg = 'Click para continuar dibujado la línea';
	
	
	/**
	 * Handle pointer move.
	 * @param {ol.MapBrowserEvent} evt
	 */
	var pointerMoveHandler = function(evt) {
	  if (evt.dragging) {
	    return;
	  }
	  /** @type {string} */
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
	};
			
	var lastTooltip;
	
	// EPSG: 4258 ETRS89 --> http://epsg.io
	proj4.defs("EPSG:4258","+proj=longlat +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +no_defs");
	//Obtenemos la proyección definida
	var proj = ol.proj.get('EPSG:4258');
	// formato de imagen de las peticiones al servidor WMS
    var format = 'image/png';
    // Cogemos una extensión que incluya un poco más que nuestro municipio
    var bounds = [-0.65, 39.35,
                  -0.40, 39.46];
    // Le damos una extensión a la proyección
    // Esto es requerido para calcular el nivel de zoom 0
    // El zoom 0 se adaptaría a la extensión de nuestro municipio
	proj.setExtent(bounds);
    // MousePosition Control --> ol.control.MousePosition
	var mousePositionControl = new ol.control.MousePosition({
        coordinateFormat: ol.coordinate.toStringHDMS,
    });
	
	// Mapa --> ol.Map
    var map = new ol.Map({
    	controls: ol.control.defaults({ 
    		attribution: false // No atribución
    	}).extend([mousePositionControl, // MousePosition
    	           new ol.control.FullScreen(), // FullScreen
    	           new ol.control.LayerSwitcher({tipLabel: 'Leyenda'}), // LayerSwitcher
    	           new ol.control.ScaleLine(), // ScaleLine
    	           new ol.control.ZoomSlider() // ZoomSlider
    	]),
    	target: 'map',
    	view: new ol.View({
    		projection: proj,
    		zoom: 3,
    		maxZoom: 10,
    		minZoom: 0,
    		center: ol.proj.fromLonLat([-0.47343, 39.42811], 'EPSG:4258')
    		// Importante poner nuestra proyección, aunque es un parámetro opcional HAY QUE PONERLO!
    	})
    });
    
    /**
     * Creates a new help tooltip
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
     * Creates a new measure tooltip
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
    
    // Capa vacía --> Cuando no queremos que haya mapa base
    var layerVectorVacia = new ol.layer.Vector({
    	title:'Vacía',
    	type: 'base'
    });
    
    /*
     *  Capa de nuestro servidor WMS
     */
    
    // Ortofoto
    var orto = new ol.layer.Tile({
    	title: 'Ortofoto',
    	visible: false,
    	source: new ol.source.WMTS({
    		url: 'http://localhost:8080/geoserver/gwc/service/wmts',
    		layer:'jahr:ortofoto',
    		matrixSet: 'EPSG:4326',
    		format: 'image/png',
    		projection: proj,
    		tileGrid: new ol.tilegrid.WMTS({
    			origin : [-180, 90],
    			resolutions : resolutions,
    			matrixIds : matrixIds
    		})
    	})
    });
    
    //Municipio
    var municipio = new ol.layer.Tile({
    	title: 'Municipio',
    	visible: true,
    	source: new ol.source.TileWMS({
    		url: 'http://localhost:8080/geoserver/jahr/wms',
    		params: {'FORMAT': format, 
                 	 'VERSION': '1.1.1',
                 	 tiled: true,
                 	 LAYERS: 'jahr:muni_torrent',
                 	 STYLES: '',
    		},
    		gutter: 200
    	})
    });
    
    // Manzanas
    var manzanas = new ol.layer.Tile({
    	title: 'Manzanas',
    	visible: false,
    	source: new ol.source.WMTS({
    		url: 'http://localhost:8080/geoserver/gwc/service/wmts',
    		layer:'jahr:manzanas',
    		matrixSet: 'EPSG:4326',
    		format: 'image/png',
    		projection: proj,
    		tileGrid: new ol.tilegrid.WMTS({
    			origin : [-180, 90],
    			resolutions : resolutions,
    			matrixIds : matrixIds
    		})
    	}),
    });
    
    // Viales
    var viales = new ol.layer.Tile({
    	title: 'Viales',
    	visible: false,
    	source: new ol.source.WMTS({
    		url: 'http://localhost:8080/geoserver/gwc/service/wmts',
    		layer:'jahr:viales',
    		matrixSet: 'EPSG:4326',
    		format: 'image/png',
    		projection: proj,
    		tileGrid: new ol.tilegrid.WMTS({
    			origin : [-180, 90],
    			resolutions : resolutions,
    			matrixIds : matrixIds
    		})
    	}),
    });
    
    // Caminos
    var caminos = new ol.layer.Tile({
    	title: 'Caminos',
    	visible: false,
    	source: new ol.source.WMTS({
    		url: 'http://localhost:8080/geoserver/gwc/service/wmts',
    		layer:'jahr:caminos',
    		matrixSet: 'EPSG:4326',
    		format: 'image/png',
    		projection: proj,
    		tileGrid: new ol.tilegrid.WMTS({
    			origin : [-180, 90],
    			resolutions : resolutions,
    			matrixIds : matrixIds
    		})
    	}),
    });
    
    // Etiquetas Viales
    var nom_viales = new ol.layer.Tile({
    	title: 'Etiquetado Calles',
    	visible: false,
    	source: new ol.source.WMTS({
    		url: 'http://localhost:8080/geoserver/gwc/service/wmts',
    		layer:'jahr:nombres_viales',
    		matrixSet: 'EPSG:4326',
    		format: 'image/png',
    		projection: proj,
    		tileGrid: new ol.tilegrid.WMTS({
    			origin : [-180, 90],
    			resolutions : resolutions,
    			matrixIds : matrixIds
    		})
    	}),
    });
    
    // Portales
    var portales = new ol.layer.Tile({
    	title: 'Portales',
    	visible: false,
    	source: new ol.source.WMTS({
    		url: 'http://localhost:8080/geoserver/gwc/service/wmts',
    		layer:'jahr:portales',
    		matrixSet: 'EPSG:4326',
    		format: 'image/png',
    		projection: proj,
    		tileGrid: new ol.tilegrid.WMTS({
    			origin : [-180, 90],
    			resolutions : resolutions,
    			matrixIds : matrixIds
    		})
    	}),
    });
    
    /*
     * Capas de otros servidores WMS
     */
    
    //Mapa base del IGN
    var ignBase = new ol.layer.Tile({
    	title: 'IGN Base',
    	visible: true,
    	source: new ol.source.TileWMS({
    		url: 'http://www.ign.es/wms-inspire/ign-base',
    		params: {'FORMAT': format, 
                 	 'VERSION': '1.1.1',
                 	 tiled: true,
                 	 LAYERS: 'IGNBaseTodo',
                 	 STYLES: '',
    		}
    	})
    });
    
    //Ortofoto PNOA
    var ortoPNOA = new ol.layer.Tile({
    	title: 'Ortofoto PNOA',
    	visible: false,
    	source: new ol.source.TileWMS({
    		url: 'http://www.ign.es/wms-inspire/pnoa-ma',
    		params: {'FORMAT': format, 
                 	 'VERSION': '1.1.1',
                 	 tiled: true,
                 	 LAYERS: 'OI.OrthoimageCoverage',
                 	 STYLES: '',
    		}
    	})
    });
    
    // Grupo de Capas 1.--> Mapas base
    // Capa vacía, mapa base ign, ortofoto PNOA
    var groupCapasBase = new ol.layer.Group({
    	title: 'Capas Base',
    	layers: [layerVectorVacia, ignBase, ortoPNOA]
    });
    
    // Grupo de Capas 2.--> Cartografía de nuestro servidor WMS
    // orto, municipio, manzanas, viales, caminos, nom_viales, portales
    var groupCartoTorrent = new ol.layer.Group({
    	title: 'Cartografía de Torrent - Overlay',
    	layers: [orto, municipio, manzanas, viales, caminos, nom_viales, portales]
    });
    
    map.addLayer(groupCapasBase); // Añadimos grupo de Capas 1
    map.addLayer(groupCartoTorrent); // Añadimos grupo de Capas 2
    
    // Añadimos Control OverviewMap
    map.addControl(new ol.control.OverviewMap({
 	   layers: [new ol.layer.Tile(ignBase.getProperties())], 
 	   view: new ol.View({ // Importante añadir la View con nuestra proyección
 		   projection: proj  
 	   })
    }));
    
    
    //alert(map.getView().getProjection().getCode());
    //map.getView().fit(bounds, map.getSize());
    
    map.addLayer(vectorLayer);
    
	var geom = feature.getGeometry().getExtent();
	var size = /** @type {ol.Size} */ (map.getSize());
	
	map.getView().fit(geom,size);

    var draw; // global so we can remove it later
    
    function addInteraction(tipo) {
    	draw = new ol.interaction.Draw({
    		source: vectorSource,
    		type: /** @type {ol.geom.GeometryType} */ tipo
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
    }
    
//    draw.on('drawstart', function(){
//    	vectorSource.clear();
//    });
    
//    draw.on('drawend', function(){
//    });
    
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
    
    $('#punto').click(function(e){
    	if(draw) map.removeInteraction(draw);
    	map.removeInteraction(modify);
    	addInteraction('Point');
    });
    
    $('#linea').click(function(e){
    	if(draw) map.removeInteraction(draw);
    	map.removeInteraction(modify);
    	addInteraction('LineString');
    });
    
    $('#poligono').click(function(e){
    	if(draw) map.removeInteraction(draw);
    	map.removeInteraction(modify);
    	addInteraction('Polygon');
    });
    
    $('#pan').click(function(e){
    	if(draw) map.removeInteraction(draw);
    	map.removeInteraction(modify);
    	//toWKT();
    });
    
    $('#editar').click(function(e){
    	if(draw) map.removeInteraction(draw);
    	map.addInteraction(modify);
    });
    
    $('#eliminar').click(function(e){
    	if(draw) map.removeInteraction(draw);
    	map.removeInteraction(modify);
    	vectorSource.clear();
    });

};
