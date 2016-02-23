var wkt,
	wktFormat = new ol.format.WKT(),
	vectorSource = new ol.source.Vector(),
	vectorLayer = new ol.layer.Vector({
		source: vectorSource
	});

function toWKT(){ // Convertimos la geometría de la denuncia a WKT,
				  // Se ejecuta cuando enviamos los datos al servidor
	vectorLayer.getSource().forEachFeature(function(feature){

		wkt = wktFormat.writeFeature(feature.clone());
		console.log('wkt: ' + wkt);
		
	});
};

// Geometría que estamos dibujando
map.addLayer(vectorLayer);