var capas_disponibles = {
  municipio : municipio,
  manzanas : manzanas,
  viales : viales,
  caminos : caminos,
  nom_viales : nom_viales,
  portales : portales,
},
mousePositionControl = new ol.control.MousePosition({
  coordinateFormat: ol.coordinate.toStringHDMS,
}),
map = new ol.Map({
  controls: ol.control.defaults({
    attribution: false // No atribución
  }).extend([mousePositionControl, // MousePosition
    //new ol.control.FullScreen(), // FullScreen
    new ol.control.LayerSwitcher({tipLabel: 'Leyenda'}), // LayerSwitcher
    new ol.control.ScaleLine(), // ScaleLine
    //new ol.control.ZoomSlider(), // ZoomSlider
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
}),
geocoder = new Geocoder('nominatim', {
  provider: 'osm',
  //key: '__some_key__',
  lang: 'es-ES', //en-US, fr-FR
  placeholder: 'Buscar dirección ...',
  limit: 5,
  keepOpen: false
});

geocoder.on('addresschosen', function(e){
  var coor = e.coordinate;
  geocoder.getSource().forEachFeature(function(f){
    //console.log(coor + ' ' + f.getGeometry().getCoordinates());
    var coor_ = f.getGeometry().getCoordinates();
    if( coor_[0] != coor && coor_[1] != coor[1]) {
      console.log(coor + ' ' + f.getGeometry().getCoordinates());
      geocoder.getSource().removeFeature(f);
    }        
  });
});

map.addControl(geocoder);
map.addControl(new ol.control.OverviewMap({
  layers: [new ol.layer.Tile(ignBase.getProperties())],
  view: new ol.View({ // Importante añadir la View con nuestra proyección
    projection: proj
  })
}));

groupCartoTorrentWMS = new ol.layer.Group({
  title: 'Cartografía de Torrent WMS',
  layers: [municipio, manzanas, viales, caminos, nom_viales, portales]
});
   
ortoPNOA.setVisible(true);
manzanas.setVisible(false);
caminos.setVisible(false);
viales.setVisible(false);
nom_viales.setVisible(false);

map.addLayer(groupCapasBase); // Añadimos grupo de Capas 1
//map.addLayer(groupCartoTorrentWMST); // Añadimos grupo de Capas 2
map.addLayer(groupCartoTorrentWMS); // Añadimos grupo de Capas 2

ignBase.setVisible(false);
// FIN MAPA

$('#map').click(function(e){
  //alert('hideee');
  $('[data-toggle="right"], [data-toggle="left"]').popover('hide');
});
