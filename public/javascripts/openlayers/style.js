/*
 * Estilos para el GeoJSON
 */
var image = new ol.style.Circle({
	radius: 3,
	fill: new ol.style.Fill({
    color: '#a10000'
  }),
	stroke: new ol.style.Stroke({color: '#fff', width: 1})
}),
styles = {
  'Point': [new ol.style.Style({
    image: image
  })],
  'LineString': [new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: '#e38d80',
      width: 2
    })
  })],
  'MultiLineString': [new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: 'green',
      width: 1
    })
  })],
  'MultiPoint': [new ol.style.Style({
    image: image
  })],
  'MultiPolygon': [new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: 'yellow',
      width: 1
    }),
    fill: new ol.style.Fill({
      color: 'rgba(255, 255, 0, 0.1)'
    })
  })],
  'Polygon': [new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: '#fff',
      lineDash: [4],
      width: 1
    }),
    fill: new ol.style.Fill({
      color: [255, 187, 0, 0.5],
      opacity : 0.5,
    })
  })],
  'GeometryCollection': [new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: 'magenta',
      width: 2
    }),
    fill: new ol.style.Fill({
      color: 'magenta'
    }),
    image: new ol.style.Circle({
      radius: 10,
      fill: null,
      stroke: new ol.style.Stroke({
        color: 'magenta'
      })
    })
  })],
  'Circle': [new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: 'red',
      width: 2
    }),
    fill: new ol.style.Fill({
      color: 'rgba(255,0,0,0.2)'
    })
  })]
},
styles_markers = {
  'posicion' :
    new ol.style.Style({
        image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
            anchor: [0.5, 1],
            scale : 0.5,
            offsetY : -15,
            anchorXUnits: 'fraction',
            anchorYUnits: 'fraction',
            src: '/files/images/location.svg',
        }))
    })
  ,
  'posicion_linea' : new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: '#00bbff',
      width: 2,
      lineDash : [4]
    })
  }),
  'distancia' : new ol.style.Style({
    text: new ol.style.Text({
      text: '',
      scale: 1.3,
      fill: new ol.style.Fill({
        color: '#00bbff'
      }),
      stroke: new ol.style.Stroke({
        color: '#fff',
        width: 3
      })
    })
  }),
  'visor' : marker('fa-asterisk', '#40cdeb'),
  'buscar' : marker('fa-search', '#91a043'),
  'nueva' : marker('fa-plus-circle', '#ef4428')
},
styleFunction = function(feature, resolution) {
  return styles[feature.getGeometry().getType()];
},
styleMarkers = function(feature, resolution) {
  console.log(styles_markers[feature.attributes.marker_type]);
  return styles_markers[feature.attributes.marker_type];
};


// Style for the clusters
var styleCacheCluster = {};
function getClusterStyle (feature, resolution){ 
  var size = feature.get('features').length;
  var style = styleCacheCluster[size];
  if(size == 1){
    return styles_markers[feature.get('features')[0].attributes.marker_type];
  }
  if (!style){
    var color = size > 8 ? "192,0,0" : size > 2 ? "255,128,0" : "0,128,0";
    var radius = Math.max(8, Math.min(size*0.75, 20));
    var dash = 2*Math.PI*radius/6;
    var dash = [ 0, dash, dash, dash, dash, dash, dash ];
    style = styleCacheCluster[size] = [ 
      new ol.style.Style({ 
        image: new ol.style.Circle({ 
          radius: radius,
          stroke: new ol.style.Stroke({ 
            color:"rgba("+color+",0.5)", 
            width:15 ,
            lineDash: dash
          }),
          fill: new ol.style.Fill({ 
            color:"rgba("+color+",1)"
          })
        }),
        text: new ol.style.Text({ 
          text: size.toString(),
          fill: new ol.style.Fill({ 
            color: '#fff'
          })
        })
      })
    ];
  }
  return style;
};

function marker(icono, color){
  return [
    new ol.style.Style({ 
      image: new ol.style.Shadow({ 
        radius: 15,
        blur: 5,
        offsetX: 0,
        offsetY: 0,
        fill: new ol.style.Fill({
          color: "rgba(0,0,0,0.5)"
        })
      })
    }),
    new ol.style.Style({ 
      image: new ol.style.FontSymbol({

        form: 'poi', //"hexagone", 
        gradient: true,
        glyph: icono,//car[Math.floor(Math.random()*car.length)], 
        fontSize: 1,
        radius: 15, 
        /*rotation: -5,*/
        offsetY: -18 ,
        color: '#fff',
        fill: new ol.style.Fill({
          color: color
        }),
        stroke: new ol.style.Stroke({
          color: '#fff',
          width: 2
        })
      }),
      stroke: new ol.style.Stroke({
        width: 2,
        color: '#f80'
      }),
      fill: new ol.style.Fill({
        color: [255, 136, 0, 0.6]
      })
    })
  ]
};