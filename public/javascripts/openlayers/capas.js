/**
 * Variables de las capas de los visores
 */

var resolutions = new Array(22),
matrixIds = new Array(22),
resInicial = 0.703125,
layerVectorVacia = new ol.layer.Vector({
	title:'Vacía',
	type: 'base'
}),
Tile = function(opciones){
	return new ol.layer.Tile({
		title: opciones.titulo,
		visible: true,
		source: new ol.source.TileWMS({
			url: 'http://' + ip + ':8080/geoserver/jahr/wms',
			params: {
				'FORMAT': format, 
	            'VERSION': '1.1.0',
	            tiled: true,
	            LAYERS: opciones.capa,
	            STYLES: '',
			}
		})
	});
},
TileWMST = function(opciones){
	return new ol.layer.Tile({
		title: opciones.titulo,
		visible: false,
		source: new ol.source.WMTS({
			url: 'http://' + ip + ':8080/geoserver/gwc/service/wmts',
			layer:opciones.capa,
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
};

for (var i=0; i < 22; i++){
	matrixIds[i] = "EPSG:4326:" + i;
	resolutions[i] = resInicial/Math.pow(2,i);
}

/*
 *  Capa de nuestro servidor WMS
 */

// Ortofoto
var orto = Tile({
	titulo : 'Ortofoto',
	capa : 'jahr:ortofoto',
});

//Municipio
var municipio = Tile({
	titulo : 'Municipio',
	capa : 'jahr:muni_torrent',
});

// Manzanas
var manzanas = Tile({
	titulo : 'Manzanas',
	capa : 'jahr:manzanas',
});

// Viales
var viales = Tile({
	titulo : 'Viales',
	capa : 'jahr:viales',
});

// Caminos
var caminos = Tile({
	titulo : 'Caminos',
	capa : 'jahr:caminos',
});

// Etiquetas Viales
var nom_viales = Tile({
	titulo : 'Etiquetado Calles',
	capa : 'jahr:nombres_viales',
});

// Portales
var portales = Tile({
	titulo : 'Portales',
	capa : 'jahr:portales',
});

// Denuncias
var denuncias_puntos = Tile({
	titulo : 'Denuncias Puntual',
	capa : 'jahr:denuncias_puntos',
});

var denuncias_lineas = Tile({
	titulo : 'Denuncias Lineal',
	capa : 'jahr:denuncias_lineas',
});
var denuncias_poligonos = Tile({
	titulo : 'Denuncias Poligonal',
	capa : 'jahr:denuncias_poligonos',
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

/*
 *  Capa de nuestro servidor WMS Teselado (GeoWebCache)
 */

// Ortofoto
var ortoWMST = TileWMST({
	titulo : 'WMST - Ortofoto',
	capa : 'jahr:ortofoto'
});

//Municipio
var municipioWMST = TileWMST({
	titulo : 'WMST - Municipio',
	capa : 'jahr:muni_torrent'
});

// Manzanas
var manzanasWMST = TileWMST({
	titulo : 'WMST - Manzanas',
	capa : 'jahr:manzanas'
});

// Viales
var vialesWMST = TileWMST({
	titulo : 'WMST - Viales',
	capa : 'jahr:viales'
});

// Caminos
var caminosWMST = TileWMST({
	titulo : 'WMST - Caminos',
	capa : 'jahr:caminos'
});

// Etiquetas Viales
var nom_vialesWMST = TileWMST({
	titulo : 'WMST - Etiquetado Calles',
	capa : 'jahr:nombres_viales'
});

// Portales
var portalesWMST = TileWMST({
	titulo : 'WMST - Portales',
	capa : 'jahr:portales'
});

// Denuncias
var denuncias_puntos_WMST = TileWMST({
	titulo : 'WMST - Denuncias Puntual',
	capa : 'jahr:denuncias_puntos'
});

var denuncias_lineas_WMST = TileWMST({
	titulo : 'WMST - Denuncias Lineal',
	capa : 'jahr:denuncias_lineas'
});

var denuncias_poligonos_WMST = TileWMST({
	titulo : 'WMST - Denuncias Poligonal',
	capa : 'jahr:denuncias_poligonos'
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
