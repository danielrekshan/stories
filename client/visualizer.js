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
    window.stage.transitionTo({
      duration: 0.5,
      scale:{
        x: 1,
        y: 1
      }
    });
    
  },
  zoom: function (amount){
    var scale = window.stage.getScale();
    var x = scale['x']*amount
    var y = scale['y']*amount
    // var old_x_pos = window.stage.getPosition()['x']
    // var old_y_pos = window.stage.getPosition()['y']

    // var old_apparent_width = window.stage.getWidth() * (1/scale['x']);
    // var old_apparent_height = window.stage.getHeight() * (1/scale['y']);



    // var to_scale = {x:x, y:y}


    // // var new_apparent_width = window.stage.getWidth() * (1/x);
    // // var new_apparent_height = window.stage.getHeight() * (1/y);
    

    // // var old_hyp = Math.sqrt(Math.pow(old_apparent_width, 2) + Math.pow(old_apparent_height, 2));
    // // var new_hyp = Math.sqrt(Math.pow(new_apparent_width, 2) + Math.pow(new_apparent_height, 2));
    // // var offset_hyp = (old_hyp/2)-(new_hyp/2)


    // // var theta = Math.asin(old_apparent_height/old_hyp);
    
    // // var offset_x = Math.cos(theta) * offset_hyp;
    // // var offset_y = Math.sin(theta) * offset_hyp;
    // // console.log('offset_x: '+ offset_x)
    // // console.log('offset_7: '+ offset_y)
    // var target_x = old_x_pos + Visualizer.apparent_center()[0]
    // var target_y = old_y_pos + Visualizer.apparent_center()[1]

    // var target = [target_x, target_y];
    // var x_pos = -(target[0] - window.center[0]) 
    // var y_pos = -(target[1]*scale['y'] - window.center[1])
    // console.log(x_pos)
    window.stage.transitionTo({

      duration: 0.5,

      scale:{
        x: x,
        y: y
      }

    });
    
    // window.stage.transitionTo({
    //   x: Visualizer.apparent_center[0],
    //   y: Visualizer.apparent_center[1],
    //   duration: 0.5
    // });
    
    // window.stage.setPosition(offset_x, offset_y)
    //window.center = [$(window).width()/2,$(window).height()/2]
    
  },
  centerOn: function (happening) {
    var target = [happening.x_position, happening.y_position];
    var scale = window.stage.getScale();
    var x = -(target[0]*scale['x'] - window.center[0]) 
    var y = -(target[1]*scale['y'] - window.center[1])
    window.stage.transitionTo({
      x: x,
      y: y,
      duration: 0.5
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
    var group = new Kinetic.Group({id: happening._id+"_context"});
    layer.add(group);
    Visualizer.makeCircle(happening.context, happening, group);
    window.stage.draw(layer)
  },
  makeCircle: function (start_text, happening, group, radius) {
    if (radius == undefined) {
      var radius = ((happening.name.length/2)*happening.name_size);
    }
    var font_size = happening.name_size / 2
    var circ = Math.PI * (radius * 2);
    var max_letters = circ / font_size;
    var text = start_text.substring(0, max_letters);
    var numRadsPerLetter = 2 * Math.PI / text.length;
    var x = 0;
    var y = 0;
    var letter = false;
    var last_at_east = 0

    for(var i=0;i<text.length;i++){
      x = (Math.cos(i*numRadsPerLetter) * (radius)) + parseInt(happening.x_position);
      y = (Math.sin(i*numRadsPerLetter) * (radius)) + parseInt(happening.y_position); 
      if (i*numRadsPerLetter == 0)
        last_at_east = i;
      var diff = i - last_at_east
      
      x = x - (font_size*1.5)*((text.length - diff)/text.length)
      
      letter = new Kinetic.Text({
        fontFamily: 'Andale Mono, monospace',
        x: x,
        y: y,
        text: text[i],
        fontSize: happening.context_size,
        rotation: i * numRadsPerLetter + 1.57, // right angle in rads
        fill: happening.context_color,
        name: "letters"
      });
      group.add(letter);
    }
    if (start_text.length > max_letters) {
      var new_text = start_text.substring(max_letters+1, start_text.length);
      var new_radius = radius + font_size * 1.5;
      Visualizer.makeCircle(new_text, happening, group, new_radius);
    }
  },
  drawHappening: function (happening) {
    if (window.stage.get('#'+happening._id).length > 0) {
      window.stage.get('#'+happening._id)[0].remove();
    }

    var new_layer = new Kinetic.Layer({name:'stories', draggable: true, id: happening._id});
    new_layer.on('click, dragstart', function(){
      Session.set('selected', happening._id);
      console.log(new_layer.getChildren())
      console.log('remving group '+ happening._id)
      if (new_layer.children.length > 0) {

        new_layer.children[1].remove()
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
