/**
 * Variables de las capas de los visores
 */

 var ip = window.location.href.toString().split(':' + window.location.port)[0] + ':8081';

var resolutions = new Array(22),
matrixIds = new Array(22),
resInicial = 0.703125,
layerVectorVacia = new ol.layer.Vector({
	noSwitcherDelete : true,
	title:'Vacía',
	type: 'base'
}),
Tile = function(opciones){
	return new ol.layer.Tile({
		noSwitcherDelete : true,
		legend : opciones.legend,
		name: opciones.titulo,
		visible: true,
		source: new ol.source.TileWMS({
			crossOrigin: 'anonymous', // So important maniguiiiiii
			url: opciones.url,
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
		noSwitcherDelete : true,
		legend : opciones.legend,
		name: opciones.titulo,
		visible: false,
		source: new ol.source.WMTS({
			crossOrigin: 'anonymous',
			url: opciones.url,
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
function leyenda_servidor(capa){
	return ip + '/geoserver/jahr/ows?service=WMS&request=GetLegendGraphic&format=image%2Fpng&width=20&height=20&layer=' + capa;
};

// Ortofoto
var orto = Tile({
	titulo : 'Ortofoto',
	capa : 'jahr:ortofoto',
	url : ip + '/geoserver/jahr/wms',
	legend : leyenda_servidor('ortofoto'),
});

//Municipio
var municipio = Tile({
	titulo : 'Municipio',
	capa : 'jahr:muni_torrent',
	url : ip + '/geoserver/jahr/wms',
	legend : leyenda_servidor('muni_torrent'),
});

// Manzanas
var manzanas = Tile({
	titulo : 'Manzanas',
	capa : 'jahr:manzanas',
	url : ip + '/geoserver/jahr/wms',
	legend : leyenda_servidor('manzanas'),
});

// Viales
var viales = Tile({
	titulo : 'Viales',
	capa : 'jahr:viales',
	url : ip + '/geoserver/jahr/wms',
	legend : leyenda_servidor('viales'),
});

// Caminos
var caminos = Tile({
	titulo : 'Caminos',
	capa : 'jahr:caminos',
	url : ip + '/geoserver/jahr/wms',
	legend : leyenda_servidor('caminos'),
});

// Etiquetas Viales
var nom_viales = Tile({
	titulo : 'Etiquetado Calles',
	capa : 'jahr:nombres_viales',
	url : ip + '/geoserver/jahr/wms',
	legend : leyenda_servidor('nombres_viales'),
});

// Portales
var portales = Tile({
	titulo : 'Portales',
	capa : 'jahr:portales',
	url : ip + '/geoserver/jahr/wms',
	legend : leyenda_servidor('portales'),
});

// Denuncias
var denuncias_puntos = Tile({
	titulo : 'Denuncias Puntual',
	capa : 'jahr:denuncias_puntos',
	url : ip + '/geoserver/jahr/wms',
	legend : leyenda_servidor('denuncias_puntos'),
});

var denuncias_lineas = Tile({
	titulo : 'Denuncias Lineal',
	capa : 'jahr:denuncias_lineas',
	url : ip + '/geoserver/jahr/wms',
	legend : leyenda_servidor('denuncias_lineas'),
});
var denuncias_poligonos = Tile({
	titulo : 'Denuncias Poligonal',
	capa : 'jahr:denuncias_poligonos',
	url : ip + '/geoserver/jahr/wms',
	legend : leyenda_servidor('denuncias_poligonos'),
});

//Denuncias Heat Map
var denunciasHeatMap = new ol.layer.Heatmap({
  noSwitcherDelete : true,
  title: 'Zonas más conflictivas',
  source: new ol.source.Vector({
  	crossOrigin: 'anonymous',
    url: ip + '/geoserver/jahr/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=jahr:denuncias_centroides' + 
    	'&outputFormat=application/json',
    format: new ol.format.GeoJSON({
      extractStyles: false
    })
  }),
  blur: 10,
  radius: 10
});

/*
=================================================
===== Capas Servidor de Torrent en Cascada  =====
=================================================
*/
var arboles = Tile({
	titulo : 'Árboles Sueltos',
	capa : 'jahr:Arbol_Aislado',
	url : ip + '/geoserver/jahr/wms',
});
arboles.setVisible(false);
var areas_recreativas = Tile({
	titulo : 'Áreas Recreativas',
	capa : 'jahr:Areas_Recreativas',
	url : ip + '/geoserver/jahr/wms',
});
areas_recreativas.setVisible(false);
var nom_ejes = Tile({
	titulo : 'Nombre Ejes',
	capa : 'jahr:B_EJES_4326',
	url : ip + '/geoserver/jahr/wms',
});
nom_ejes.setVisible(false);
var nom_ejes_valenciano = Tile({
	titulo : 'Nombre Ejes Valencià',
	capa : 'jahr:B_EJES_4326_valenciano',
	url : ip + '/geoserver/jahr/wms',
});
nom_ejes_valenciano.setVisible(false);
var carpas = Tile({
	titulo : 'Carpas Falleras',
	capa : 'jahr:Carpes',
	url : ip + '/geoserver/jahr/wms',
});
carpas.setVisible(false);
var centros_educativos = Tile({
	titulo : 'Centros Educativos',
	capa : 'jahr:Centros_Educativos',
	url : ip + '/geoserver/jahr/wms',
});
centros_educativos.setVisible(false);
var centros_municipales = Tile({
	titulo : 'Centros Municipales',
	capa : 'jahr:Centros_Municipales',
	url : ip + '/geoserver/jahr/wms',
});
centros_municipales.setVisible(false);
var centros_de_culto = Tile({
	titulo : 'Centros de Culto',
	capa : 'jahr:Centros_de_Culto',
	url : ip + '/geoserver/jahr/wms',
});
centros_de_culto.setVisible(false);
var centros_de_salud = Tile({
	titulo : 'Centros de Salud',
	capa : 'jahr:Centros_de_Salud',
	url : ip + '/geoserver/jahr/wms',
});
centros_de_salud.setVisible(false);
var centros_deportivos = Tile({
	titulo : 'Centros Deportivos',
	capa : 'jahr:Deportes',
	url : ip + '/geoserver/jahr/wms',
});
centros_deportivos.setVisible(false);
var cultura_museos = Tile({
	titulo : 'Entidades Culturales y Museos',
	capa : 'jahr:Entidades_Culturales_y_Museos',
	url : ip + '/geoserver/jahr/wms',
});
cultura_museos.setVisible(false);
var fallas = Tile({
	titulo : 'Entidades Falleras',
	capa : 'jahr:Falles',
	url : ip + '/geoserver/jahr/wms',
});
fallas.setVisible(false);
var farmacias = Tile({
	titulo : 'Farmacias',
	capa : 'jahr:Farmacias',
	url : ip + '/geoserver/jahr/wms',
});
farmacias.setVisible(false);
var gasolineras = Tile({
	titulo : 'Gasolineras',
	capa : 'jahr:Gasolineras',
	url : ip + '/geoserver/jahr/wms',
});
gasolineras.setVisible(false);
var lugares_interes = Tile({
	titulo : 'Lugares de Interés',
	capa : 'jahr:Lugares_Interes',
	url : ip + '/geoserver/jahr/wms',
});
lugares_interes.setVisible(false);
var musica = Tile({
	titulo : 'Música',
	capa : 'jahr:Musica',
	url : ip + '/geoserver/jahr/wms',
});
musica.setVisible(false);
var org_y_empresas = Tile({
	titulo : 'Organismos Autónomos y Empresas Municipales',
	capa : 'jahr:Organismos_Autonomos_y_Empresas_Municipales',
	url : ip + '/geoserver/jahr/wms',
});
org_y_empresas.setVisible(false);
var nom_parajes = Tile({
	titulo : 'Nombres de Parajes',
	capa : 'jahr:Nombres_Parajes_',
	url : ip + '/geoserver/jahr/wms',
});
nom_parajes.setVisible(false);
var parques_y_jardines = Tile({
	titulo : 'Parques y Jardines',
	capa : 'jahr:Parques_y_Jardines',
	url : ip + '/geoserver/jahr/wms',
});
parques_y_jardines.setVisible(false);
var piscinas = Tile({
	titulo : 'Piscinas',
	capa : 'jahr:Piscina',
	url : ip + '/geoserver/jahr/wms',
});
piscinas.setVisible(false);
var comisarias = Tile({
	titulo : 'Comisarías de Policía',
	capa : 'jahr:Policia',
	url : ip + '/geoserver/jahr/wms',
});
comisarias.setVisible(false);
var ropa_amiga = Tile({
	titulo : 'Ropa Amiga',
	capa : 'jahr:ROPA_AMIGA',
	url : ip + '/geoserver/jahr/wms',
});
ropa_amiga.setVisible(false);
var referencias_cat = Tile({
	titulo : 'Referencias Catastrales',
	capa : 'jahr:Referencia_Catastral',
	url : ip + '/geoserver/jahr/wms',
});
referencias_cat.setVisible(false);
var torrent_bici = Tile({
	titulo : 'Torrent Bici',
	capa : 'jahr:TorrentBici',
	url : ip + '/geoserver/jahr/wms',
});
torrent_bici.setVisible(false);
var vados = Tile({
	titulo : 'Vados',
	capa : 'jahr:Vados',
	url : ip + '/geoserver/jahr/wms',
});
vados.setVisible(false);
var tercera_edad = Tile({
	titulo : 'Tercera Edad',
	capa : 'jahr:tercera_Edat',
	url : ip + '/geoserver/jahr/wms',
});
tercera_edad.setVisible(false);
var wifi_torrent = Tile({
	titulo : 'Wifi Torrent',
	capa : 'jahr:wifiTORRENT',
	url : ip + '/geoserver/jahr/wms',
});
wifi_torrent.setVisible(false);

/*
 *  Capa de nuestro servidor WMS Teselado (GeoWebCache)
 */

// Ortofoto
var ortoWMST = TileWMST({
	titulo : 'WMST - Ortofoto',
	capa : 'jahr:ortofoto',
	url : ip + '/geoserver/gwc/service/wmts',
	legend : leyenda_servidor('ortofoto'),
});

//Municipio
var municipioWMST = TileWMST({
	titulo : 'WMST - Municipio',
	capa : 'jahr:muni_torrent',
	url : ip + '/geoserver/gwc/service/wmts',
	legend : leyenda_servidor('muni_torrent'),
});

// Manzanas
var manzanasWMST = TileWMST({
	titulo : 'WMST - Manzanas',
	capa : 'jahr:manzanas',
	url : ip + '/geoserver/gwc/service/wmts',
	legend : leyenda_servidor('manzanas'),
});

// Viales
var vialesWMST = TileWMST({
	titulo : 'WMST - Viales',
	capa : 'jahr:viales',
	url : ip + '/geoserver/gwc/service/wmts',
	legend : leyenda_servidor('viales'),
});

// Caminos
var caminosWMST = TileWMST({
	titulo : 'WMST - Caminos',
	capa : 'jahr:caminos',
	url : ip + '/geoserver/gwc/service/wmts',
	legend : leyenda_servidor('caminos'),
});

// Etiquetas Viales
var nom_vialesWMST = TileWMST({
	titulo : 'WMST - Etiquetado Calles',
	capa : 'jahr:nombres_viales',
	url : ip + '/geoserver/gwc/service/wmts',
	legend : leyenda_servidor('nombres_viales'),
});

// Portales
var portalesWMST = TileWMST({
	titulo : 'WMST - Portales',
	capa : 'jahr:portales',
	url : ip + '/geoserver/gwc/service/wmts',
	legend : leyenda_servidor('portales'),
});

// Denuncias
var denuncias_puntos_WMST = TileWMST({
	titulo : 'WMST - Denuncias Puntual',
	capa : 'jahr:denuncias_puntos',
	url : ip + '/geoserver/gwc/service/wmts',
	legend : leyenda_servidor('denuncias_puntos'),
});

var denuncias_lineas_WMST = TileWMST({
	titulo : 'WMST - Denuncias Lineal',
	capa : 'jahr:denuncias_lineas',
	url : ip + '/geoserver/gwc/service/wmts',
	legend : leyenda_servidor('denuncias_lineas'),
});

var denuncias_poligonos_WMST = TileWMST({
	titulo : 'WMST - Denuncias Poligonal',
	capa : 'jahr:denuncias_poligonos',
	url : ip + '/geoserver/gwc/service/wmts',
	legend : leyenda_servidor('denuncias_poligonos'),
});

/*
 * Capas de otros servidores WMS
 */

//Mapa base del IGN
var ignBase = new ol.layer.Tile({
	noSwitcherDelete : true,
	name: 'IGN Base',
	visible: true,
	source: new ol.source.TileWMS({
		url: 'http://www.ign.es/wms-inspire/ign-base',
		crossOrigin: 'anonymous',
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
	noSwitcherDelete : true,
	name: 'Ortofoto PNOA',
	visible: false,
	source: new ol.source.TileWMS({
		url: 'http://www.ign.es/wms-inspire/pnoa-ma',
		crossOrigin: 'anonymous',
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
	noSwitcherDelete : true,
	name: 'Capas Base',
	layers: [layerVectorVacia, ignBase, ortoPNOA]
});

var groupCartoTorrentWMS = new ol.layer.Group({
	noSwitcherDelete : true,
	name : 'Cartografía de Torrent WMS',
	layers: [orto, municipio, manzanas, viales, caminos, /*nom_viales,*/ portales, 
	    denuncias_puntos, denuncias_lineas, denuncias_poligonos, denunciasHeatMap
	]
});

var torrent_cascada = new ol.layer.Group({
	noSwitcherDelete : true,
	name : 'WMS de Torrent en cascada',
	layers : [	    // Carto Oficial
	    arboles, areas_recreativas, nom_ejes, nom_ejes_valenciano, carpas,
	    centros_educativos, centros_municipales, centros_de_culto, centros_de_salud,
	    centros_deportivos, cultura_museos, fallas, farmacias, gasolineras, 
	    lugares_interes, musica, org_y_empresas, nom_parajes, parques_y_jardines, 
	    piscinas, comisarias, ropa_amiga, referencias_cat, torrent_bici, vados,
	    tercera_edad, wifi_torrent
	]
});

var groupCartoTorrentWMST = new ol.layer.Group({
	noSwitcherDelete : true,
	name: 'Cartografía de Torrent WMS Teselado',
	layers: [ortoWMST, municipioWMST, manzanasWMST, vialesWMST, 
	    caminosWMST, /*nom_vialesWMST,*/ portalesWMST, 
	    denuncias_puntos_WMST, denuncias_lineas_WMST, denuncias_poligonos_WMST]
}); 
