window.app = window.app || {};
var app = window.app;

/**
 * Control Creado para hacer peticiones Bitly
 */
app.Bitly = function(opt_options) {

  var options = opt_options || {},
  this_ = this,
  button = document.createElement('button'),
  element = document.createElement('div');
  
  function bitly_ (){
    var url = window.location.href;
    var username="informatorrent";
    var key="R_3bc837c675464243a333743a1c7a02e3";

    $.ajax({
      url:"http://api.bit.ly/v3/shorten",
      data:{longUrl:url,apiKey:key,login:username},
      dataType:"jsonp",
      success:function(v) {
        var bit_url=v.data.url;
        BootstrapDialog.show({
          title : 'LINK ',
          message : $('<p>Comparte el link : <a href="' + bit_url + '" target = "_blank">' + bit_url + '</a><p>'),
          onshow : function(dialog){
            dialog.getModalHeader().replaceWith($('<div class="row" style="margin: 0px; padding-top: 5px; border-top-left-radius: 10px; border-top-right-radius: 10px; background: url(&#39;http://www.batlleiroig.com/wp-content/uploads/247_parc_central_st_cugat_8.jpg&#39;); background-size: cover; background-repeat: no-repeat;">' + 
              '<div class="bootstrap-dialog-close-button">' + 
                '<button class="close" style="color : #fff; margin-right : 10px;">X</button>' +
              '</div>' +
              '<div class="col-xs-6" style="text-align: center; color: #fff; font-weight : bold;">' +
              '<i class="fa fa-share" style="font-size : 60px; color : #00bbff; text-shadow: 2px 2px #fff;"></i>' + 
                '<h4 style="padding : 2px; color : #00bbff; background : rgba(0,0,0,0.7); border-radius : 15px;"> Link hacia el mapa actual</h4>' +
              '</div>' +
            '</div>'));
            dialog.getModalDialog().find('.close').click(function(){dialog.close()});
            dialog.getModalBody().parent().css('border-radius', '15px');
            dialog.getModalBody().css('padding-top', '10px');
          }
        });
      }
    });
  }

  button.innerHTML = '<i class="fa fa-share"></i>';
  button.addEventListener('click', bitly_, false);

  element.setAttribute('data-toggle', 'left');
  element.setAttribute('title', 'Bitly');
  element.setAttribute('data-content', 'Compartir el estado del mapa actual');
  element.className = 'bitly ol-unselectable ol-control';
  element.appendChild(button);

  ol.control.Control.call(this, {
    element: element,
    target: options.target
  });

};

ol.inherits(app.Bitly, ol.control.Control);
