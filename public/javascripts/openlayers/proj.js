/**
 * Proyección ETRS89, resoluciones para nuestro servicio Teselado
 */

// EPSG: 4258 ETRS89 --> http://epsg.io
proj4.defs("EPSG:4258","+proj=longlat +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +no_defs");
//Obtenemos la proyección definida
var proj = ol.proj.get('EPSG:4258');
// formato de imagen de las peticiones al servidor WMS
var format = 'image/png';
// Cogemos una extensión que incluya un poco más que nuestro municipio
var bounds = [-0.65, 39.35,
              -0.40, 39.46];
// Le damos una extensión a la proyección
// Esto es requerido para calcular el nivel de zoom 0
// El zoom 0 se adaptaría a la extensión de nuestro municipio
proj.setExtent(bounds);
