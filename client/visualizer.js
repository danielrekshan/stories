
Handlebars.registerHelper('defaultValue', function(value, standard) {
  if (value == undefined) {
    return standard;
  } else {
    return value;
  }
});


function xPosition(happening) {
  if (happening.x_position == undefined) {
    return 10
  }
  return happening.x_position
};

function yPosition(happening) {
  if (happening.y_position == undefined) {
    return 50
  }
  return happening.y_position
};

function drawName(happening) {
  var offset = (happening.name.length/2.5) * happening.name_size
  var text = new Kinetic.Text({
    x: xPosition(happening),
    y: yPosition(happening),
    offset: [offset,happening.name_size/2],
    text: happening.name,
    fontSize: happening.name_size,
    fontFamily: 'Andale Mono, monospace',
    fill: 'black',
    draggable: false
  });
  
  var layer = window.stage.get('#'+happening._id)[0];
  
  layer.add(text);
  
};

function drawContext(happening) {
  var layer = window.stage.get('#'+happening._id)[0];
  if (layer.get('#'+happening._id).length > 0) {
    layer.get('#'+happening._id)[0].remove();
  };
  var group = new Kinetic.Group({id: happening._id+"_context"});
  layer.add(group);
  makeCircle(happening.context, happening, group);
  window.stage.draw(layer)
};

function makeCircle(start_text, happening, group, radius) {
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
      fontSize: font_size,
      rotation: i * numRadsPerLetter + 1.57, // right angle in rads
      fill: 'black',
      name: "letters"
    });
    group.add(letter);
  }
  if (start_text.length > max_letters) {
    var new_text = start_text.substring(max_letters+1, start_text.length);
    var new_radius = radius + font_size * 1.5;
    makeCircle(new_text, happening, group, new_radius);
  }
}

function drawHappening(happening) {
  if (window.stage.get('#'+happening._id).length > 0) {
    window.stage.get('#'+happening._id)[0].remove();
  }

  var new_layer = new Kinetic.Layer({name:'stories', draggable: true, id: happening._id});
  new_layer.on('click, dragstart', function(){
    Session.set('selected', happening._id);
  });
  new_layer.on('dragend', function(){
    var old_x = parseInt($('#entry_x_position').val());
    var old_y = parseInt($('#entry_y_position').val());

    $('#entry_x_position').val(this.getPosition()['x'] + old_x);
    $('#entry_y_position').val(this.getPosition()['y'] + old_y);
    $('#position_change').trigger('click');
  });

  window.stage.add(new_layer)
  drawName(happening);
  drawContext(happening);
  window.stage.draw(new_layer);
};


Meteor.startup(function () {
  window.name_font_size = 20;
  window.happenings = {};
  window.stage = new Kinetic.Stage({
    container: "container",
    width: $(window).width(),
    height: $(window).height() -200
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
