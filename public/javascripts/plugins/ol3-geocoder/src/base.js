/**
 * @constructor
 * @extends {ol.control.Control}
 * @fires {Geocoder.EventType}
 * @param {string} control_type Nominatim|Reverse.
 * @param {object|undefined} opt_options Options.
 */
var Geocoder = function(control_type, opt_options){
  utils.assert(typeof control_type === 'string', '@param `control_type`' +
    ' should be string type!'
  );
  utils.assert(typeof opt_options === 'object' || typeof opt_options === 'undefined',
    '@param `opt_options` should be object|undefined type!'
  );
  
  control_type = control_type || 'nominatim';
  
  var nominatim = new Geocoder.Nominatim(this, opt_options);
  this.layer = nominatim.layer;
  
  ol.control.Control.call(this, {
    element: nominatim.els.container
  });
};
ol.inherits(Geocoder, ol.control.Control);

/**
 * @return {ol.source.Vector} Returns the source created by this control
 */
Geocoder.prototype.getSource = function(){
  return this.layer.getSource();
};

/**
 * @return {ol.layer.Vector} Returns the layer created by this control
 */
Geocoder.prototype.getLayer = function(){
  return this.layer;
};
