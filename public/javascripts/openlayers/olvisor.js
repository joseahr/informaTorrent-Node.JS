$(function(){
	
    /*
     * MousePositionControl --> ol.control.MousePosition
     */
	var mousePositionControl = new ol.control.MousePosition({
        coordinateFormat: ol.coordinate.toStringHDMS, // Formto Grados Minutos Segundos
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
    		projection: proj, // ETRS89
    		zoom: 3,
    		center: ol.proj.fromLonLat([-0.47343, 39.42811], 'EPSG:4258'),
    		minZoom: 0,
    		maxZoom: 10
    		// Importante poner nuestra proyección, aunque es un parámetro opcional en el center HAY QUE PONERLO!
    	})
    });
    
    map.addLayer(groupCapasBase); // Añadimos grupo de Capas 1
    map.addLayer(groupCartoTorrentWMST); // Añadimos grupo de Capas 2
    
    // Añadimos Control OverviewMap
    map.addControl(new ol.control.OverviewMap({
 	   layers: [new ol.layer.Tile(ignBase.getProperties())], 
 	   view: new ol.View({ // Importante añadir la View con nuestra proyección
 		   projection: proj  
 	   })
    }));
    
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
	
    
});