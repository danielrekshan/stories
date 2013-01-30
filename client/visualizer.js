Handlebars.registerHelper('defaultValue', function(value, standard) {
  if (value == undefined) {
    return standard;
  } else {
    return value;
  }
});

Handlebars.registerHelper('defaultPosition', function(value, dimensionX) {
  if (value == undefined) {
    if (dimensionX == 'true'){
      return $(window).width()/2;
    } else {
      return $(window).height()/2;
    }
  } else {
    return value;
  }
});

var Visualizer = {
  updateContainer: function () {
    window.stage.setWidth($(window).width())
    window.stage.setHeight($(window).height())
    window.center = [$(window).width()/2,$(window).height()/2]
  },
  apparent_center: function(to_scale){
    if (to_scale) {
      var scale = to_scale;
    } else {
      var scale = window.stage.getScale();
    }
    
    var x = window.center[0] * (1/scale['x']);
    var y = window.center[1] * (1/scale['y']);
    return [x,y];
  },
  center_position: function() {
    var x = window.stage.getPosition()['x'] + Visualizer.apparent_center()[0];
    var y = window.stage.getPosition()['y'] + Visualizer.apparent_center()[1];
    return [x,y];
  },
  zoom_center: function (){
    Visualizer.hide_contexts;
    window.stage.transitionTo({
      duration: 0.5,
      scale:{
        x: 1,
        y: 1
      },
      callback: function(){
        Visualizer.show_contexts();
      }
    });
    
  },
  origin: {
        x: 0,
        y: 0
  },
  scale: 1,

  zoom: function (amount){
    Visualizer.hide_contexts();
    // var scale = window.stage.getScale();
    // var old_scale = scale['x']
    // var newscale = scale['x']*amount
    // var x = scale['x']*amount
    // var y = scale['y']*amount
  

    var newscale = Visualizer.scale * amount;
    var mx = Visualizer.apparent_center()[0];
    var my = Visualizer.apparent_center()[1];
    console.log(mx)
    Visualizer.origin.x = mx / Visualizer.scale + Visualizer.origin.x - mx / newscale;
    Visualizer.origin.y = my / Visualizer.scale + Visualizer.origin.y - my / newscale;
    var offset_x = window.stage.getWidth()/2;
    var offset_y = window.stage.getHeight()/2;
    console.log('after')
    window.vis = Visualizer.origin
    window.stage.transitionTo({

      duration: 0.5,

      offset: {x:Visualizer.origin.x, y:Visualizer.origin.y},
      scale:{
        x: newscale,
        y: newscale
      },
      callback: function(){
        Visualizer.show_contexts();
      }

    });
   Visualizer.scale *= amount;
  },
  centerOn: function (happening) {
    Visualizer.hide_contexts();
    var target = [happening.x_position, happening.y_position];
    var scale = window.stage.getScale();
    var x = -(target[0]*scale['x'] - window.center[0]) 
    var y = -(target[1]*scale['y'] - window.center[1])
    window.stage.transitionTo({
      x: x,
      y: y,
      offset: {x:0,y:0},
      duration: 0.5,
      callback: function(){
        Visualizer.show_contexts();
      }
    });
  },
  centerOnSelected: function () {
    Visualizer.centerOn(Template.entry.happening());
  },
  drawName: function (happening) {
    var offset = (happening.name.length/2.5) * happening.name_size
    var text = new Kinetic.Text({
      x: happening.x_position,
      y: happening.y_position,
      offset: [offset,happening.name_size/2],
      text: happening.name,
      fontSize: happening.name_size,
      fontFamily: 'Andale Mono, monospace',
      fill: happening.name_color,
      draggable: false
    });
    
    var layer = window.stage.get('#'+happening._id)[0];
    
    layer.add(text);
  },
  drawContext: function (happening) {
    var layer = window.stage.get('#'+happening._id)[0];
    if (layer.get('#'+happening._id).length > 0) {
      layer.get('#'+happening._id)[0].remove();
    };
    
    
    Visualizer.makeCircle(happening.context, happening, layer);
    
    window.stage.draw(layer)
  },
  
  generatePath: function(start_text, happening, radius, path) {
    if (radius == undefined) {
      var radius = ((happening.name.length/2)*happening.name_size);
    }
    var font_size = happening.name_size / 2;
    var circ = Math.PI * (radius * 2);

    var max_letters = circ / happening.context_size;
    var text = start_text.substring(0, max_letters);
    var numRadsPerLetter = 2 * Math.PI / text.length;
    var x = 0;
    var y = 0;
    var letter = false;
    var last_at_east = 0

    
    if (path == undefined) {
      var path = [];
    };
    for(var i=0;i<text.length;i++){


      x = (Math.cos(i*numRadsPerLetter) * (radius)) + parseInt(happening.x_position);
      y = (Math.sin(i*numRadsPerLetter) * (radius)) + parseInt(happening.y_position); 
      
      if (i > 0 && i*numRadsPerLetter == 0 ) {
        last_at_east = i;
        radius += + font_size * 1.5;
      }
      var diff = i - last_at_east
      x = x - (font_size*1.5)*((text.length - diff)/text.length)
      path.push({x:x,y:y})

    };
    if (start_text.length > max_letters) {
      var new_text = start_text.substring(max_letters+1, start_text.length);
      var new_radius = radius + font_size * 1.5;
      Visualizer.generatePath(new_text, happening, new_radius, path);
    };
    return path;
  },
  makeCircle: function (start_text, happening, layer, radius) {
    var path = Visualizer.generatePath(happening.context, happening, radius, [])
    window.path = path
    var lineFunction = d3.svg.line().x(function(d) { return d.x; }).y(function(d) { return d.y; }).interpolate("linear");
    var path_data = lineFunction(path);
    var textpath = new Kinetic.TextPath({
        fill: happening.context_color,
        fontSize: happening.context_size,
        fontFamily: 'Andale Mono, monospace',
        text: happening.context,
        data: path_data
      });
    layer.add(textpath);
  },
  createHappening: function(happening) {
    if (window.stage.get('#'+happening._id).length > 0) {
      window.stage.get('#'+happening._id)[0].remove();
    }
    var new_layer = new Kinetic.Layer({name:'stories', draggable: true, id: happening._id});
    new_layer.on('mousedown', function(){
      Session.set('selected', happening._id);
      if (new_layer.children.length > 0 && happening.context.length > 500) {
        new_layer.children[1].hide()
      }
    });
    new_layer.on('mousedown'), function(){
      window.stage.setDraggable(false);

    };
    new_layer.on('mouseup'), function(){
      window.stage.setDraggable(true);
    };
    new_layer.on('dragend', function(){
      var old_x = parseInt($('#entry_x_position').val());
      var old_y = parseInt($('#entry_y_position').val());

      $('#entry_x_position').val(this.getPosition()['x'] + old_x);
      $('#entry_y_position').val(this.getPosition()['y'] + old_y);
      $('#position_change').trigger('click');
    });

    window.stage.add(new_layer)
    Visualizer.drawName(happening);
    Visualizer.drawContext(happening);

    window.stage.draw(new_layer);
  },
  updateHappening: function (happening) {
    var layer = window.stage.get('#'+happening._id)[0];
    var name = layer.getChildren()[0];
    var context = layer.getChildren()[1];

    context.setFill(happening.context_color);
    name.setFill(happening.name_color);
    window.stage.draw(layer);
  },

  drawHappening: function (happening) {

    //     if there is a layer
    //   if need to redraw
    //     redraw
    //   else
    //     update layer
    // else
    //   redraw layer
    // end

    var redraw = false;
    if (window.stage.get('#'+happening._id).length > 0) {
      var layer = window.stage.get('#'+happening._id)[0];
      window.l = layer;
      var old_name = layer.getChildren()[0].getText();
      var old_name_size = parseInt(layer.getChildren()[0].getFontSize());
      window.group = layer.getChildren()[1]
      window.happening = happening
      var old_context = layer.getChildren()[1].getText();
      var old_context_size = parseInt(layer.getChildren()[1].getFontSize());

      if (happening.name != old_name || happening.name_size != old_name_size){
        redraw = true;
      }
      if (happening.context != old_context || happening.context_size != old_context_size){
        redraw = true;
      }
      if (happening.x_position != layer.getChildren()[0].getX() || happening.y_position != layer.getChildren()[0].getY()) {
        redraw = true;
      }


    } else {
      redraw = true;
    }

    if (redraw) {
      Visualizer.createHappening(happening);
    } else {
      Visualizer.updateHappening(happening);
    }
  },
  hide_contexts: function(){
    window.stage.children.forEach(function(layer){
      if (layer.getChildren()[1].getText().length >100) {
        layer.getChildren()[1].hide();
      }
      window.stage.draw(layer);
    });
  },
  show_contexts: function(){
    window.stage.children.forEach(function(layer){
      if (layer.getChildren()[1].getText().length >100) {
        layer.getChildren()[1].show();
      }
      window.stage.draw(layer);
    });

  }
};



Meteor.startup(function () {
  window.name_font_size = 20;
  window.happenings = {};
  window.center = [$(window).width()/2,$(window).height()/2]
  window.stage = new Kinetic.Stage({
    container: "container",
    width: $(window).width(),
    height: $(window).height(),
    draggable: true
  });
  window.stage.on('mouseover', function() {
    document.body.style.cursor = 'pointer';
  });
  window.stage.on('mouseout', function() {
    document.body.style.cursor = 'default';
  });

  window.stage.getContainer().addEventListener('mouseup', function(evt) {
    console.log('dragend')
    Visualizer.show_contexts();
  });
 
  window.stage.getContainer().addEventListener('mousedown', function(evt) {
    console.log("CLICK")
    Visualizer.hide_contexts();
  });
  $(window).resize(function() {
    Visualizer.updateContainer();
  });


  // window.groups = {}
  // window.centers = {}
  // window.name_font_size = 20
  // window.center = [$(window).width()/2,$(window).height()/2]
  // window.stage = new Kinetic.Stage({
  //   container: "container",
  //   width: 100,
  //   height: 100
  // });
  // window.layerz = {}
  // window.group = new Kinetic.Group();
  // $(window).resize(function() {
  //   updateContainer();
  // });
  

});
