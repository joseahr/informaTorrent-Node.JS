window.app = window.app || {};
var app = window.app;

/**
 * Control Creado para hacer peticiones Ayuda
 */
app.Ayuda = function(opt_options) {

  console.log(opt_options.tipo);

  var options = opt_options || {},
  this_ = this,
  button = document.createElement('button'),
  element = document.createElement('div'),
  paginator = function(actual){
    return '<div class="col-lg-12"><div style="background : #00bbff; border-radius : 5px; color : #fff; float : right; padding : 5px;">Página ' + 
        actual + '/' + messages.length + 
    '</div></div>';
  },
  change = function(dialog_){
    var input = $(dialog_.getModalBody()).find('input');
    input.change(function(){
      console.log('change');
      Cookies.set(cookie, input.prop('checked'));
    });
  };

  var list = {
    visor : { cookie : 'visor_', messages : messages_visor()},
    denuncia : { cookie : 'denuncia', messages : messages_denuncia()},
    nueva : { cookie : 'nueva', messages : messages_nueva()},
  },
  messages = list[options.tipo].messages,
  cookie = list[options.tipo].cookie,
  message_id = 0,
  // Instancia del dialog que vamos a mostrar
  dialog = new BootstrapDialog({
    message : paginator(message_id + 1) + messages[message_id],
    autodestroy : false,
    buttons : [{
      id : 'btn-1',
      hotkey : 37,
      label : 'Anterior',
      action : function(dialog_){
        if(message_id == 0) return;
        message_id -= 1;
        dialog_.setMessage(paginator(message_id + 1) + messages[message_id]);
        if(message_id == 0) this.disable();
        dialog_.getButton('btn-2').enable();
      }
    },
    {
      id : 'btn-2',
      hotkey : 39,
      label : 'Siguiente',
      action : function(dialog_){
        if(message_id == messages.length - 1) return;

        message_id += 1;

        dialog_.setMessage(paginator(message_id + 1) + messages[message_id]);

        if(message_id == messages.length - 1) this.disable();

        dialog_.getButton('btn-1').enable();
      }
    }
    ],
    onshow : function(dialog_){
          dialog.getModalHeader().replaceWith($('<div class="row" style="margin: 0px; padding-top: 5px; border-top-left-radius: 10px; border-top-right-radius: 10px; background: url(&#39;http://www.batlleiroig.com/wp-content/uploads/247_parc_central_st_cugat_8.jpg&#39;); background-size: cover; background-repeat: no-repeat;">' + 
            '<div class="bootstrap-dialog-close-button">' + 
              '<button class="close" style="color : #fff; margin-right : 10px;">X</button>' +
            '</div>' +
            '<div class="col-xs-6" style="text-align: center; color: #fff; font-weight : bold;">' +
            '<i class="fa fa-question-circle" style="font-size : 60px; color : #00bbff; text-shadow: 2px 2px #fff;"></i>' + 
              '<h4 style="padding : 2px; color : #00bbff; background : rgba(0,0,0,0.7); border-radius : 15px;"> ¿Cómo utilizar el mapa?</h4>' +
            '</div>' +
          '</div>'));
          dialog.getModalDialog().find('.close').click(function(){dialog.close()});
          dialog.getModalBody().parent().css('border-radius', '15px');
          dialog.getModalBody().css('padding-top', '10px');
    },
    onshown : function(dialog_){
      change(dialog_);
    }
  }),
  dialog_check = new BootstrapDialog({
    message : paginator(message_id + 1) + messages[message_id],
    autodestroy : false,
    buttons : [{
      id : 'btn-1',
      hotkey : 37,
      label : 'Anterior',
      action : function(dialog_){
        if(message_id == 0) return;
        message_id -= 1;
        dialog_.setMessage(paginator(message_id + 1) + messages[message_id]);
        if(message_id == 0) this.disable();
        dialog_.getButton('btn-2').enable();
      }
    },
    {
      id : 'btn-2',
      hotkey : 39,
      label : 'Siguiente',
      action : function(dialog_){
        if(message_id == messages.length - 1) return;

        message_id += 1;

        dialog_.setMessage(paginator(message_id + 1) + messages[message_id]);

        if(message_id == messages.length - 1) this.disable();

        dialog_.getButton('btn-1').enable();

      }
    }
    ],
    onshow : function(dialog_){
          dialog_.getModalHeader().replaceWith($('<div class="row" style="margin: 0px; padding-top: 5px; border-top-left-radius: 10px; border-top-right-radius: 10px; background: url(&#39;http://www.batlleiroig.com/wp-content/uploads/247_parc_central_st_cugat_8.jpg&#39;); background-size: cover; background-repeat: no-repeat;">' + 
            '<div class="bootstrap-dialog-close-button">' + 
              '<button class="close" style="color : #fff; margin-right : 10px;">X</button>' +
            '</div>' +
            '<div class="col-xs-6" style="text-align: center; color: #fff; font-weight : bold;">' +
            '<i class="fa fa-question-circle" style="font-size : 60px; color : #00bbff; text-shadow: 2px 2px #fff;"></i>' + 
              '<h4 style="padding : 2px; color : #00bbff; background : rgba(0,0,0,0.7); border-radius : 15px;"> ¿Cómo utilizar el mapa?</h4>' +
            '</div>' +
          '</div>'));
          dialog_.getModalDialog().find('.close').click(function(){dialog_.close()});
          dialog_.getModalBody().parent().css('border-radius', '15px');
          dialog_.getModalBody().css('padding-top', '10px');
          dialog_.getModalBody().append('<div class="container-fluid col-lg-12" style="float : left; margin-top : 25px; top : -15px;"><input class="modal-check" type="checkbox"/> No volver a mostrar</div>');
    },
    onshown : function(dialog_){
      change(dialog_);
    }
  });

  showDialogIfCookie(messages, cookie);
  
  function ayuda_ (){
    dialog.open();
    console.log(message_id);
  }

  /*
  ===============================
  == DIALOGS DE AYUDA DE MAPAS == 
  ===============================
  */

  function video(source){
    return  '<div style="margin-top : 10px;"><p style="font-weight : bold">Video explicativo</p></div><video width="500" height="500" controls>' + 
      '<source src="' + source + '" type="video/webm"> Tu navegador no soporta video' +
    '</video>';
  }

  function showDialogIfCookie(messages, cookie){
    var hayCookie = Cookies.get(cookie);

    // 
    if (hayCookie && hayCookie == "true") {
      // No mostrar el dialog
      console.log('No mostramos el dialog, ha indicado anteriormente que no quiere verlo mas', hayCookie);
      }
      else{
        dialog_check.open();
        console.log('mostramos el dialog', hayCookie);
      }
  };

  function messages_nueva(){
    return ['<div class="container-fluid">' + 
      '<h4>Añadir nueva denuncia</h4>' + 
      '<p style="font-weight : bold">Controles para añadir una nueva denuncia</p>' + 
      '<p>El siguiente video muestra los elementos necesarios para añadir una nueva denuncia : </p>' + 
      '<ol><li>Dibujar geometría</li><li>Rellenar datos</li><li>Subir imágenes</li></ol>' + 
      '<p>Si estás usando un dispositivo móvil podrás capturar imágenes desde tu dispositivo</p>' +
      video('/files/videos/nueva_denuncia_en_mapa.webm') +
    '</div>',
    ];
  };

  function messages_denuncia(){
    return ['<div class="container-fluid">' + 
      '<h4>¿Qué información tiene una denuncia?</h4>' + 
      '<p style="font-weight : bold">Datos básicos</p>' + 
      '<p>Una denuncia tiene como información : </p>' + 
      '<ol><li>Título</li><li>Descripción</li><li>Imágenes</li><li>Tags</li></ol>' + 
      '<p>El video muestra cada uno de los elementos de una denuncia</p>' +
      video('/files/videos/denuncia/imagenes_descripcion.webm') +
    '</div>',
    '<div class="container-fluid">' + 
      '<h4>¿Qué información tiene una denuncia?</h4>' + 
      '<p style="font-weight : bold">Comentarios</p>' + 
      '<p>Un usuario registrado puede comentar la denuncia o contestar a comentarios.</p>' + 
      '<p>El siguiente video muestra como hacerlo.</p>' +
      video('/files/videos/denuncia/comentar_replicar.webm') +
    '</div>',
    '<div class="container-fluid">' + 
      '<h4>¿Qué información tiene una denuncia?</h4>' + 
      '<p style="font-weight : bold">Likes</p>' + 
      '<p>Un usuario registrado puede indicar que apoya la denuncia o por el contrario, dejar de apoyar la denuncia.</p>' + 
      '<p>El siguiente video muestra como hacerlo.</p>' +
      video('/files/videos/denuncia/like.webm') +
    '</div>',
    '<div class="container-fluid">' + 
      '<h4>¿Qué información tiene una denuncia?</h4>' + 
      '<p style="font-weight : bold">Compartir denuncia</p>' + 
      '<p>Comparte la denuncia en tus redes sociales.</p>' + 
      video('/files/videos/denuncia/compartir_denuncia.webm') +
    '</div>',
    ];
  };

  function messages_visor(){
    return ['<div class="container-fluid">' + 
      '<h4>Controles básicos del mapa</h4>' + 
      '<p style="font-weight : bold">Panel lateral de usuario</p>' + 
      '<p>Haciendo click en el botón que contiene nuestra imagen de usuario se desplegará un menú lateral con las opciones que podemos llevar a cabo.</p>' + 
      '<img class="img-thumbnail" src="/files/images/ayuda_mapas/visor_app/8.PNG" style="object-fit : cover; padding : 0px;"/>' + 
      video('/files/videos/visor/menu.webm') +
    '</div>',
    // Primer mensaje de ayuda
    '<div class="container-fluid">' + 
      '<h4>Controles básicos del mapa</h4>' + 
      '<p style="font-weight : bold">Control de capas</p>' + 
      '<img src="/files/images/ayuda_mapas/visor_app/10.PNG" class="img-thumbnail" style="float : left; margin-right : 10px;"></img>' + 
      '<p>Clicando en el icono accederás a un menú con todas las capas disponibles en el visor.</p>' + 
      '<p>Podrás cambiar la visibilidad de las capas y consultar la leyenda.</p>' + 
      video('/files/videos/visor/capas.webm') +
      '<p style="font-weight : bold; margin-top : 10px;">Capa "Zonas más conflictivas"</p>' + 
      '<p>Esta capa es una capa especial ya que al hacerla visible se activa un menú en el mapa con el que podremos ver de forma animada y dinámica la evolución de las denuncias en un intervalo de tiempo</p>' + 
      video('/files/videos/visor/heatmap.webm') +
    '</div>', 
    // Segundo mensaje de ayuda
    '<div class="container-fluid">' + 
      '<h4>Controles básicos del mapa</h4>' + 
      '<p style="font-weight : bold">Localizar calle por su nombre</p>' + 
      '<p>Este control sirve para localizar la ubicación de una dirección.</p>' + 
      '<p>Utiliza el servicio de geolocalización de OpenStreetMaps.</p>' + 
      '<img class="img-thumbnail" src="/files/images/ayuda_mapas/visor_app/2.PNG" style="object-fit : cover; padding : 0px;"></img>' + 
      video('/files/videos/visor/direccion.webm') +
    '</div>', 
    // Tercer mensaje de ayuda
    '<div class="container-fluid">' + 
      '<h4>Controles básicos del mapa</h4>' + 
      '<p style="font-weight : bold">Localizar mi posición en el mapa</p>' + 
      '<p>Clicando en el botón <i class="fa fa-eye"></i> podrás visualizar tu posición en el mapa.</p>' + 
      '<p>Asegúrate que las opciones de localización de tu dispositivo están activadas.</p>' + 
      '<p>La posición se irá actualizando cada vez que cambie o cambie la precisión.</p>' + 
      '<p>Para finalizar de "hacer tracking" de tu posición simplemente vuelve a darle al icono.</p>' + 
      '<img class="img-thumbnail" src="/files/images/ayuda_mapas/visor_app/3.PNG" style="object-fit : cover; padding : 0px;"></img>' + 
      video('/files/videos/visor/posicion.webm') +
    '</div>', 
    // Cuarto mensaje de ayuda
    '<div class="container-fluid">' + 
      '<h4>Controles básicos del mapa</h4>' + 
      '<p style="font-weight : bold">Seleccionar denuncias</p>' + 
      '<p>Si haces click en la imagen podrás ver las imágenes que contiene la denuncia.</p>' + 
      '<p>Al hacer click sobre una denuncia en el mapa se abrirá un diálogo donde se mostrará parte de la información de la denuncia.</p>' + 
      '<p>Para ir a la página de la denuncia, haz click en el botón "IR" situado al final del diálogo.</p>' + 
      '<img class="img-thumbnail" src="/files/images/ayuda_mapas/visor_app/4.PNG" style="object-fit : cover; padding : 0px;"></img>' + 
      video('/files/videos/visor/seleccionar_denuncia.webm') +
    '</div>', 
    // Cinco mensaje de ayuda
    '<div class="container-fluid">' + 
      '<h4>Controles básicos del mapa</h4>' + 
      '<p style="font-weight : bold">Denuncias cerca de mi posición</p>' + 
      '<p>Este control sirve para mostrar las denuncias cercanas a la posición en la que nos situamos.</p>' + 
      '<img src="/files/images/ayuda_mapas/visor_app/5.PNG" class="img-thumbnail" style="float : left; margin : 0 10 10 0px; "></img>' + 
      '<p>Las denuncias cercanas se pueden ver clicando en el botón <i class="fa fa-bullhorn"></i> que aperece al activar el control.</p>' + 
      '<p>La posición se irá actualizando cada vez que cambie o cambie la precisión así como las denuncias que están a menos de 100 metros de esa posición.</p>' + 
      '<p>Para finalizar de "hacer tracking" de tu posición simplemente vuelve a darle al icono.</p>' +
      '<img class="img-thumbnail" src="/files/images/ayuda_mapas/visor_app/6.PNG" style="object-fit : cover; padding : 0px;"></img>' + 
      video('/files/videos/visor/denuncias_cerca.webm') +
    '</div>', 
    // Sexto mensaje de ayuda
    '<div class="container-fluid">' + 
      '<h4>Controles básicos del mapa</h4>' + 
      '<p style="font-weight : bold">Buscar denuncias según criterios</p>' + 
      '<p>Este control sirve para mostrar en el mapa las denuncias que coinciden con nuestros criterios de búsqueda.</p>' + 
      '<p>Para acceder al diálogo de búsqueda haz click en el icono <i class="fa fa-search"></i></p>' + 
      '<p>El control de buscar por BBOX no está disponible para dispositivos móviles de momento.</p>' +
      '<img class="img-thumbnail" src="/files/images/ayuda_mapas/visor_app/7.PNG" style="object-fit : cover; padding : 0px;"></img>' + 
      video('/files/videos/visor/buscar_denuncias.webm') +
    '</div>',
    '<div class="container-fluid">' + 
      '<h4>Controles básicos del mapa</h4>' + 
      '<p style="font-weight : bold">Compartir el mapa actual</p>' + 
      '<p>Comparte el estado del mapa actual en tus redes sociales. Se genera un link corto mediante el servicio bitly para transformar la URL del mapa (la cual es muy larga dependiendo del número de denuncias).</p>' + 
      video('/files/videos/visor/compartir_mapa.webm') +
    '</div>'
  ]};


  button.innerHTML = '<i class="fa fa-question-circle"></i>';
  button.addEventListener('click', ayuda_, false);

  element.setAttribute('data-toggle', 'left');
  element.setAttribute('title', 'Ayuda');
  element.setAttribute('data-content', 'Aprende a utilizar las herramientas del mapa');
  element.className = 'ayuda ol-unselectable ol-control';
  element.appendChild(button);

  ol.control.Control.call(this, {
    element: element,
    target: options.target
  });

};

ol.inherits(app.Ayuda, ol.control.Control);
