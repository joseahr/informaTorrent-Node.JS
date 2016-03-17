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
}),
/*getAllofEm = function() {

  var allLayers = [];

  var mapLayers = map.getLayers().getArray();

  mapLayers.forEach(function (layer, i) {
    if (layer instanceof ol.layer.Group && layer.getVisible() == true ) {
      layer.getLayers().getArray().forEach(function(sublayer, j, layers) {
        if(sublayer.getVisible())
          allLayers.push(sublayer);
      })
    } else if ( !(layer instanceof ol.layer.Group) && layer.getVisible() == true ) {
      if(layer.getVisible())
        allLayers.push(layer);
    }
  });

  return allLayers;
},*/
imprimir_mapa = function(){
  /*var extension = map.getView().calculateExtent(map.getSize());
  var capas_activas = [];
  getAllofEm().forEach(function(layer){
    console.log(layer.getSource());
    if(layer.getSource() && layer.getSource() instanceof ol.source.TileWMS)
      capas_activas.push(layer.getSource().getParams().LAYERS);
  });

  var width = map.getSize()[0],
  height = map.getSize()[1];

  //console.log(map.getSize());
  window.open('http://' + ip + ':8080/geoserver/jahr/wms?service=WMS&request=GetMap&version=1.1.0&layers=' 
    + capas_activas.join(',') + '&bbox=' + extension + '&width=' + width + '&height=' + height 
    + '&srs=EPSG:4258&format=application/pdf');*/
  map.once('postcompose', function(event) {
    var canvas = event.context.canvas;
    canvas.crossOrigin = "anonymous";
    var image = new Image();
    image.crossOrigin = "anonymous";
    image.src = canvas.toDataURL('image/png');
    window.open(image.src);
  });

},
contextmenu_items = [{
    text: '<i class="fa fa-print"></i> Imprimir mapa',
    callback: imprimir_mapa
  },
  '-' // Separador
],
contextmenu = new ContextMenu({
  width: 190,
  default_items: true,
  items: contextmenu_items
}),
animacionDenuncia = function(data){

  //console.log(data);
  sourcehm = new ol.source.Vector({
    crossOrigin: 'anonymous',
    url: 'http://' + ip + ':8080/geoserver/jahr/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=jahr:denuncias_centroides' + 
      '&viewparams=fecha_min:' + data.fecha_min + ';fecha_max:' + data.fecha_max + '&outputFormat=application/json',
    format: new ol.format.GeoJSON({
      extractStyles: false
    })
  });

  denunciasHeatMap.setSource(sourcehm);
  if(!denunciasHeatMap.getVisible())
    denunciasHeatMap.setVisible(true);
},
formatDate = function(date) {
  var d = new Date(date),
  month = '' + (d.getMonth() + 1),
  day = '' + d.getDate(),
  year = d.getFullYear();

  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;

  return [year, month, day].join('-');
},
months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

$('#slider_date').dateRangeSlider({
  valueLabels:"change",
  durationIn: 1000,
  durationOut: 1000,
  arrows : false,
  bounds: {min: new Date(new Date().getFullYear(), 0, 1), max: new Date(new Date().getFullYear(), 11, 31, 23, 59, 59)},
  defaultValues: {min: new Date(new Date().getFullYear(), 0, 1), max: new Date()},
  scales: [{
    first: function(value){ return value; },
    end: function(value) {return value; },
    next: function(value){
      var next = new Date(value);
      return new Date(next.setMonth(value.getMonth() + 1));
    },
    label: function(value){
      return months[value.getMonth()];
    },

  }]
});

$('#slider_date').bind('valuesChanging', function(e, data){
  //console.log(data.values.min.toString(), data.values.max.toString())
  animacionDenuncia({fecha_min: formatDate(data.values.min), fecha_max: formatDate(data.values.max)});
});

var playing = false;

var año_min = 2016,
año_max = new Date().getFullYear();

var interval = function(){

   console.log(playing);

  var values = $("#slider_date").dateRangeSlider("values"),
  bounds = $("#slider_date").dateRangeSlider("bounds"),
  mes = (values.min.getDay() == 31) ? values.min.getMonth() + 1: values.min.getMonth(),
  dia = (values.min.getDay() == 31) ? 1 : values.min.getDate() + 1;
  max = new Date(2016, mes, dia + 1),
  min = new Date(2016, mes, dia);

  //console.log(values.max.toString(), bounds.max.toString());
  if(!(values.max.getFullYear() == bounds.max.getFullYear() &&
    values.max.getMonth() == bounds.max.getMonth() &&
    values.max.getDate() == bounds.max.getDate()) && playing)
  {
    setTimeout(interval, 500);
  }
  else
    playing = false;
    //clearInterval(interval);

  $("#slider_date").dateRangeSlider("values", min, max);
  animacionDenuncia({fecha_min: formatDate(min), fecha_max: formatDate(max)});

};

denunciasHeatMap.on('change:visible', function(e){

  var visible = e.target.getVisible();
  if (visible){
    $('#heatmap_anim').show();
    for(var i = año_min; i<= año_max; i++){
      console.log(i);
      $('<option value="' + i + '">' + i + '</option>').appendTo('#anyos');
    };
    $('.ui-rangeSlider-container').css('width', '100%');
    $('#anyos').css('min-width', '0px').attr('class', 'btn-sm').selectpicker({
      width : '100px',
    })
  }
  else
    $('#heatmap_anim').hide();
});

$('#play').click(function(e){

  if(playing){
    playing = false;
    $(this).find('i').attr('class', 'fa fa-play');
  }
  else{
    playing = true;
    interval();
    $(this).find('i').attr('class', 'fa fa-pause');
  }

});

denunciasHeatMap.setVisible(false);
/******************* EVENTOS **********************/
geocoder.on('addresschosen', function(e){
  var coor = e.coordinate;
  geocoder.getSource().forEachFeature(function(f){
    //console.log(coor + ' ' + f.getGeometry().getCoordinates());
    var coor_ = f.getGeometry().getCoordinates();
    if( coor_[0] != coor[0] && coor_[1] != coor[1]) {
      console.log(coor + ' ' + f.getGeometry().getCoordinates());
      geocoder.getSource().removeFeature(f);
    }        
  });
});

map.addControl(contextmenu);
map.addControl(geocoder);
map.addControl(new ol.control.OverviewMap({
  layers: [new ol.layer.Tile(ignBase.getProperties())],
  view: new ol.View({ // Importante añadir la View con nuestra proyección
    projection: proj
  })
}));

groupCartoTorrentWMS = new ol.layer.Group({
  title: 'Cartografía de Torrent WMS',
  layers: [municipio, manzanas, viales, caminos, nom_viales, portales, denunciasHeatMap]
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
