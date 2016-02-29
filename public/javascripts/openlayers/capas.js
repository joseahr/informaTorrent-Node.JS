/**
 * Variables de las capas de los visores
 */

var ip = 'http://192.168.1.14:8080'

var resolutions = new Array(22),
	matrixIds = new Array(22),
	resInicial = 0.703125;

for (var i=0; i < 22; i++){
	matrixIds[i] = "EPSG:4326:" + i;
	resolutions[i] = resInicial/Math.pow(2,i);
}

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
	source: new ol.source.TileWMS({
		url: ip + '/geoserver/jahr/wms',
		params: {'FORMAT': format, 
             	 'VERSION': '1.1.0',
             	 tiled: true,
             	 LAYERS: 'jahr:ortofoto',
             	 STYLES: '',
		}
	})
});

//Municipio
var municipio = new ol.layer.Tile({
	title: 'Municipio',
	visible: true,
	source: new ol.source.TileWMS({
		url: ip + '/geoserver/jahr/wms',
		params: {'FORMAT': format, 
             	 'VERSION': '1.1.0',
             	 tiled: true,
             	 LAYERS: 'jahr:muni_torrent',
             	 STYLES: '',
		}
	})
});

// Manzanas
var manzanas = new ol.layer.Tile({
	title: 'Manzanas',
	visible: true,
	source: new ol.source.TileWMS({
		url: ip + '/geoserver/jahr/wms',
		params: {'FORMAT': format, 
             	 'VERSION': '1.1.0',
             	 tiled: true,
             	 LAYERS: 'jahr:manzanas',
             	 STYLES: '',
		}
	})
});

// Viales
var viales = new ol.layer.Tile({
	title: 'Viales',
	visible: true,
	source: new ol.source.TileWMS({
		url: ip + '/geoserver/jahr/wms',
		params: {'FORMAT': format, 
             	 'VERSION': '1.1.0',
             	 tiled: true,
             	 LAYERS: 'jahr:viales',
             	 STYLES: '',
		}
	})
});

// Caminos
var caminos = new ol.layer.Tile({
	title: 'Caminos',
	visible: true,
	source: new ol.source.TileWMS({
		url: ip + '/geoserver/jahr/wms',
		params: {'FORMAT': format, 
             	 'VERSION': '1.1.0',
             	 tiled: true,
             	 LAYERS: 'jahr:caminos',
             	 STYLES: '',
		}
	})
});

// Etiquetas Viales
var nom_viales = new ol.layer.Tile({
	title: 'Etiquetado Calles',
	visible: true,
	source: new ol.source.TileWMS({
		url: ip + '/geoserver/jahr/wms',
		params: {'FORMAT': format, 
             	 'VERSION': '1.1.0',
             	 tiled: true,
             	 LAYERS: 'jahr:nombres_viales',
             	 STYLES: '',
		}
	})
});


// Portales
var portales = new ol.layer.Tile({
	title: 'Portales',
	visible: true,
	source: new ol.source.TileWMS({
		url: ip + '/geoserver/jahr/wms',
		params: {'FORMAT': format, 
             	 'VERSION': '1.1.0',
             	 tiled: true,
             	 LAYERS: 'jahr:portales',
             	 STYLES: '',
		}
	})
});


// Denuncias
var denuncias_puntos = new ol.layer.Tile({
	title: 'Denuncias Puntual',
	visible: true,
	source: new ol.source.TileWMS({
		url: ip + '/geoserver/jahr/wms',
		params: {'FORMAT': format, 
             	 'VERSION': '1.1.0',
             	 tiled: true,
             	 LAYERS: 'jahr:denuncias_puntos',
             	 STYLES: '',
		}
	})
});
var denuncias_lineas = new ol.layer.Tile({
	title: 'Denuncias Lineal',
	visible: true,
	source: new ol.source.TileWMS({
		url: ip + '/geoserver/jahr/wms',
		params: {'FORMAT': format, 
             	 'VERSION': '1.1.0',
             	 tiled: true,
             	 LAYERS: 'jahr:denuncias_lineas',
             	 STYLES: '',
		}
	})
});
var denuncias_poligonos = new ol.layer.Tile({
	title: 'Denuncias Poligonal',
	visible: true,
	source: new ol.source.TileWMS({
		url: ip + '/geoserver/jahr/wms',
		params: {'FORMAT': format, 
             	 'VERSION': '1.1.0',
             	 tiled: true,
             	 LAYERS: 'jahr:denuncias_poligonos',
             	 STYLES: '',
		}
	})
});

//Denuncias Heat Map

var denunciasHeatMap = new ol.layer.Heatmap({
  title: 'Zonas más conflictivas',
  source: new ol.source.Vector({
    url: ip + '/geoserver/jahr/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=jahr:denuncias_centroides&outputFormat=application/json',
    format: new ol.format.GeoJSON({
      extractStyles: false
    })
  }),
  blur: 10,
  radius: 10
});
denunciasHeatMap.getSource().on('addfeature', function(event){
	event.feature.setGeometry(new ol.geom.Point(ol.extent.getCenter(event.feature.getGeometry().getExtent())));
});

/*
 *  Capa de nuestro servidor WMS Teselado (GeoWebCache)
 */

// Ortofoto
var ortoWMST = new ol.layer.Tile({
	title: 'Ortofoto',
	visible: false,
	source: new ol.source.WMTS({
		url: ip + '/geoserver/gwc/service/wmts',
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
var municipioWMST = new ol.layer.Tile({
	title: 'Municipio',
	visible: false,
	source: new ol.source.WMTS({
		url: ip + '/geoserver/gwc/service/wmts',
		layer:'jahr:muni_torrent',
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

// Manzanas
var manzanasWMST = new ol.layer.Tile({
	title: 'Manzanas',
	visible: false,
	source: new ol.source.WMTS({
		url: ip + '/geoserver/gwc/service/wmts',
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
var vialesWMST = new ol.layer.Tile({
	title: 'Viales',
	visible: false,
	source: new ol.source.WMTS({
		url: ip + '/geoserver/gwc/service/wmts',
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
var caminosWMST = new ol.layer.Tile({
	title: 'Caminos',
	visible: false,
	source: new ol.source.WMTS({
		url: ip + '/geoserver/gwc/service/wmts',
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
var nom_vialesWMST = new ol.layer.Tile({
	title: 'Etiquetado Calles',
	visible: false,
	source: new ol.source.WMTS({
		url: ip + '/geoserver/gwc/service/wmts',
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
var portalesWMST = new ol.layer.Tile({
	title: 'Portales',
	visible: false,
	source: new ol.source.WMTS({
		url: ip + '/geoserver/gwc/service/wmts',
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

// Denuncias
var denuncias_puntos_WMST = new ol.layer.Tile({
	title: 'Denuncias Puntual',
	visible: false,
	source: new ol.source.WMTS({
		url: ip + '/geoserver/gwc/service/wmts',
		layer:'jahr:denuncias_puntos',
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

var denuncias_lineas_WMST = new ol.layer.Tile({
	title: 'Denuncias Lineal',
	visible: false,
	source: new ol.source.WMTS({
		url: ip + '/geoserver/gwc/service/wmts',
		layer:'jahr:denuncias_lineas',
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

var denuncias_poligonos_WMST = new ol.layer.Tile({
	title: 'Denuncias Polígonos',
	visible: false,
	source: new ol.source.WMTS({
		url: ip + '/geoserver/gwc/service/wmts',
		layer:'jahr:denuncias_poligonos',
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
var groupCartoTorrentWMS = new ol.layer.Group({
	title: 'Cartografía de Torrent WMS',
	layers: [orto, municipio, manzanas, viales, caminos, nom_viales, portales, 
	         denuncias_puntos, denuncias_lineas, denuncias_poligonos, denunciasHeatMap]
});
var groupCartoTorrentWMST = new ol.layer.Group({
	title: 'Cartografía de Torrent WMS Teselado',
	layers: [ortoWMST, municipioWMST, manzanasWMST, vialesWMST, 
	         caminosWMST, nom_vialesWMST, portalesWMST, 
	         denuncias_puntos_WMST, denuncias_lineas_WMST, denuncias_poligonos_WMST]
}); 
