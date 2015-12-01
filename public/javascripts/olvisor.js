$(function(){
	var resolutions = new Array(22);
	var matrixIds = new Array(22);
	var resInicial = 0.703125;
	
	for (var i=0; i < 22; i++){
		matrixIds[i] = "EPSG:4326:" + i;
		resolutions[i] = resInicial/Math.pow(2,i);
	}
	
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
    		center: ol.proj.fromLonLat([-0.47343, 39.42811], 'EPSG:4258'),
    		minZoom: 0,
    		maxZoom: 10
    		// Importante poner nuestra proyección, aunque es un parámetro opcional HAY QUE PONERLO!
    	})
    });
    
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
    
    
    
    var select = new ol.interaction.Select();
    
    map.addInteraction(select); // Seleccionar feature
    
    /*
     * Estilos para el GeoJSON
     */
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
    var vector = new ol.layer.Vector({
        source: new ol.source.Vector({
            format: format
        }),
        style: styleFunction
    });
    
    var json = JSON.parse(geojsonDenuncia);
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
    
	vector.getSource().addFeature(feature);
	//alert(JSON.stringify(JSON.parse(geojsonDenuncia)));
    //vector.getSource().forEachFeature(function(f){alert(f)});
	map.addLayer(vector);
	
	var geom = feature.getGeometry().getExtent();
	var size = /** @type {ol.Size} */ (map.getSize());
	
	map.getView().fit(geom,size);
	
    
});