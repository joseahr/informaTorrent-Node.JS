var wkt,
	wktFormat = new ol.format.WKT(),
	vectorSource = new ol.source.Vector(),
	vectorLayer = new ol.layer.Vector({
		source: vectorSource
	});

map.addLayer(vectorLayer);

function toWKT(){
	vectorLayer.getSource().forEachFeature(function(feature){

		wkt = wktFormat.writeFeature(feature.clone());
		console.log('wkt: ' + wkt);
		//alert(wkt);
	});
};


//console.log('showMAp');
/**
************* CARGAR GEOMETRÍA DENUNCIA
**/
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
