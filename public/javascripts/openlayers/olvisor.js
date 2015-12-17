var select = new ol.interaction.Select();

map.addInteraction(select); // Seleccionar feature

/*
 *  Cargamos la denuncia en el mapa
 */
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

map.addLayer(vector);

var geom = feature.getGeometry().getExtent();
var size = map.getSize();

map.getView().fit(geom,size);