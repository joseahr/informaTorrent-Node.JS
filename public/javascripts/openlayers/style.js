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
  'selected' :
    new ol.style.Style({
        image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
            anchor: [0.5, 1],
            anchorXUnits: 'fraction',
            anchorYUnits: 'fraction',
            src: '/files/images/pin_amarillo.svg',
        }))
    })
  ,
  'visor' : [
    new ol.style.Style({
        image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
            anchor: [0.5, 1],
            anchorXUnits: 'fraction',
            anchorYUnits: 'fraction',
            src: '/files/images/pin.svg',
        }))
    })
  ]
},
styleFunction = function(feature, resolution) {
  return styles[feature.getGeometry().getType()];
},
styleMarkers = function(feature, resolution) {
  return styles_markers[feature.attributes.marker_type];
};
