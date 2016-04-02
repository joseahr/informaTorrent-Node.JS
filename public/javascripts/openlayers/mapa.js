var ip = window.location.href.toString().split(':' + window.location.port)[0] + ":8001";
var mousePositionControl = new ol.control.MousePosition({
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
    var image = new Image();
    image.crossOrigin = "anonymous";
    try {
      image.src = canvas.toDataURL('image/png');
    }
    catch(e){
      BootstrapDialog.show({
        title : 'Error exportando mapa', 
        message : 'Vuelva a recargar la página y pruebe otra vez. No añada capas de servidores externos.',
        onshow : function(dialog){$(dialog.getModalHeader()).css('background', 'rgb(200,50,50)')}
      });
    }
    //window.open(image.src);

    var a = document.createElement('a');

    a.setAttribute('href', image.src);
    a.setAttribute('download', 'export_mapa_torrent.png');
    a.setAttribute('target', 'blank_');

    document.body.appendChild(a);
    a.click();

    map.renderSync();
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
    url: ip + '/geoserver/jahr/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=jahr:denuncias_centroides' + 
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
playing = false,
año_min = 2016,
año_max = new Date().getFullYear(),
interval = function(){

  console.log(playing);

  var values = $("#slider_date").dateRangeSlider("values"),
  bounds = $("#slider_date").dateRangeSlider("bounds"),
  mes = (values.max.getDate() == 31 && values.max.getMonth() <12) ? values.max.getMonth() + 1: values.max.getMonth(),
  dia = (values.max.getDate() == 31) ? 1 : values.max.getDate() + 1;
  max = new Date(values.min.getFullYear(), mes, dia),
  min = values.min;

  document.getElementById('fecha_max').innerHTML = '<p style=" margin : 0 auto; max-width : 300px; border-radius : 5px; background : rgba(0,0,0,0.5); color : #fff">' + values.min.getDate() + '/' + (values.min.getMonth() + 1) + '/' + values.min.getFullYear() + ' - ' +
    dia + '/' + (mes + 1) + '/' + values.min.getFullYear() + '</p>';

  //console.log(values.max.toString(), bounds.max.toString());
  if(!(values.max.getFullYear() == bounds.max.getFullYear() &&
    values.max.getMonth() == bounds.max.getMonth() &&
    values.max.getDate() == bounds.max.getDate()) && playing)
  {
    $("#slider_date").dateRangeSlider("values", min, max);
    animacionDenuncia({fecha_min: formatDate(min), fecha_max: formatDate(max)});
    $('#fecha_max').show();
    setTimeout(interval, 500);
  }
  else{
    playing = false;
    $('#play').find('i').attr('class', 'fa fa-play');
    $("#slider_date").dateRangeSlider("enable");
    $('#anyos').selectpicker('show');
    $('#fecha_max').hide();
    //clearInterval(interval);
  }
}; 
/*var ol3d = new olcs.OLCesium({
  map : map
}),
scene = ol3d.getCesiumScene(),
terrainProvider = new Cesium.CesiumTerrainProvider({
  url : '//assets.agi.com/stk-terrain/world'
});*/

//ol3d.setEnabled(true);

//scene.terrainProvider = terrainProvider;

/********* INICIAMOS EL RANGE SLIDER *****/
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

/************ Cambio los valores RangeSlider manualmente, llammamos a la animacion ********/
$('#slider_date').bind('valuesChanging', function(e, data){
  //console.log(data.values.min.toString(), data.values.max.toString())
  animacionDenuncia({fecha_min: formatDate(data.values.min), fecha_max: formatDate(data.values.max)});
});

/*************** Si activamos la capa HeatMap abrimos el menú animación ***************/
denunciasHeatMap.on('change:visible', function(e){

  var visible = e.target.getVisible();

  if (visible){
    $('#heatmap_anim').show();
    $('#anyos').empty();
    for(var i = año_min; i<= año_max; i++){
      console.log(i);
      $('<option value="' + i + '">' + i + '</option>').appendTo('#anyos');
    };
    $('.ui-rangeSlider-container').css('width', '100%');
    $('#anyos').css('min-width', '0px').attr('class', 'btn-sm').selectpicker({
      width : '100px',
    }).selectpicker('mobile');
    $('.bootstrap-select').css('float', 'right');

    $('#anyos').change(function(){
      var $anyos = $(this);
      console.log($anyos.val());
      $("#slider_date").dateRangeSlider("bounds", new Date($anyos.val(), 0, 1), new Date($anyos.val(), 11, 31, 23, 59, 59));
      $("#slider_date").dateRangeSlider("values", new Date($anyos.val(), 0, 1), new Date($anyos.val(), 11, 31, 23, 59, 59));
    });

  }
  else
    $('#heatmap_anim').hide();
});

/********************   Hacemos click en play animación  *************/
$('#play').click(function(e){

  if(playing){
    playing = false;
    $(this).find('i').attr('class', 'fa fa-play');
    $("#slider_date").dateRangeSlider("enable");
    $('#anyos').selectpicker('show');
  }
  else{
    playing = true;
    var b = $("#slider_date").dateRangeSlider("bounds");
    //$("#slider_date").dateRangeSlider("values", b.min);
    interval();
    $("#slider_date").dateRangeSlider("disable");
    $('#anyos').selectpicker('hide');
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