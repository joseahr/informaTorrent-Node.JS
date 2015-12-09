/**
 * Variables de las capas de los visores
 */

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
		url: 'http://localhost:8080/geoserver/jahr/wms',
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
		url: 'http://localhost:8080/geoserver/jahr/wms',
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
		url: 'http://localhost:8080/geoserver/jahr/wms',
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
		url: 'http://localhost:8080/geoserver/jahr/wms',
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
		url: 'http://localhost:8080/geoserver/jahr/wms',
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
		url: 'http://localhost:8080/geoserver/jahr/wms',
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
		url: 'http://localhost:8080/geoserver/jahr/wms',
		params: {'FORMAT': format, 
             	 'VERSION': '1.1.0',
             	 tiled: true,
             	 LAYERS: 'jahr:portales',
             	 STYLES: '',
		}
	})
});


// Denuncias
var denuncias = new ol.layer.Tile({
	title: 'Denuncias',
	visible: true,
	source: new ol.source.TileWMS({
		url: 'http://localhost:8080/geoserver/jahr/wms',
		params: {'FORMAT': format, 
             	 'VERSION': '1.1.0',
             	 tiled: true,
             	 LAYERS: 'jahr:denuncias',
             	 STYLES: '',
		}
	})
});

/*
 *  Capa de nuestro servidor WMS Teselado (GeoWebCache)
 */

// Ortofoto
var ortoWMST = new ol.layer.Tile({
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
var municipioWMST = new ol.layer.Tile({
	title: 'Municipio',
	visible: false,
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
var manzanasWMST = new ol.layer.Tile({
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
var vialesWMST = new ol.layer.Tile({
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
var caminosWMST = new ol.layer.Tile({
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
var nom_vialesWMST = new ol.layer.Tile({
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
var portalesWMST = new ol.layer.Tile({
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

// Denuncias
var denunciasWMST = new ol.layer.Tile({
	title: 'Denuncias',
	visible: false,
	source: new ol.source.WMTS({
		url: 'http://localhost:8080/geoserver/gwc/service/wmts',
		layer:'jahr:denuncias',
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
	layers: [orto, municipio, manzanas, viales, caminos, nom_viales, portales, denuncias]
});
var groupCartoTorrentWMST = new ol.layer.Group({
	title: 'Cartografía de Torrent WMS Teselado',
	layers: [ortoWMST, municipioWMST, manzanasWMST, vialesWMST, 
	         caminosWMST, nom_vialesWMST, portalesWMST, denunciasWMST]
}); 