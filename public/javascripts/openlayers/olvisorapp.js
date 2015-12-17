console.log(denuncias + ' denuncias' + typeof(denuncias) );
denuncias.forEach(function(denuncia){
	console.log('denuncia añadida bdd' + JSON.parse(denuncia.geom).type);
	var feature, type = JSON.parse(denuncia.geom).type;
	
	if(type == 'Point'){
    	feature = new ol.Feature({
    		  geometry: new ol.geom.Point(JSON.parse(denuncia.geom).coordinates),
    		  name: 'Denuncia - Punto'
    	});
    }
    else if(type == 'LineString'){
    	feature = new ol.Feature({
    		geometry: new ol.geom.LineString(JSON.parse(denuncia.geom).coordinates),
    		name: 'Denuncia - Polígono'
    	});
    }
    else if(type == 'Polygon'){
    	feature = new ol.Feature({
    		geometry: new ol.geom.Polygon(JSON.parse(denuncia.geom).coordinates),
    		name: 'Denuncia - Polígono'
    	});
    }
	console.log(feature);
	vector.getSource().addFeature(feature);
});

map.addLayer(vector);

var select = new ol.interaction.Select();

map.addInteraction(select); // Seleccionar feature