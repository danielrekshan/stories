Happenings = new Meteor.Collection('happenings');

if (Meteor.isClient) {
  function drawHappenings() {
    var happenings = Happenings.find({})
    happenings.forEach(function(happening) {
      Visualizer.drawHappening(happening)
    })
  }

  var startUpdateListener = function() {
    // Function called each time 'Shapes' is updated.
    var redrawCanvas = function() {

      var context = new Meteor.deps.Context()
      context.on_invalidate(redrawCanvas) // Ensures this is recalled for each update
      context.run(function() {
        drawHappenings()
      })
    }
    redrawCanvas()

  }

  Meteor.startup(function() {
    startUpdateListener()
  })
    ////////// Helpers for in-place editing //////////
  
  // Returns an event_map key for attaching "ok/cancel" events to
  // a text input (given by selector)
  var okcancel_events = function (selector) {
    return 'keyup '+selector+', keydown '+selector+', focusout '+selector;
  };
  
  // Creates an event handler for interpreting "escape", "return", and "blur"
  // on a text field and calling "ok" or "cancel" callbacks.
  var make_okcancel_handler = function (options) {
    var ok = options.ok || function () {};
    var cancel = options.cancel || function () {};
  
    return function (evt) {
      if (evt.type === "keydown" && evt.which === 27) {
        // escape = cancel
        cancel.call(this, evt);
      } else if (evt.type === "keyup" && evt.which === 13) {
        // blur/return/enter = ok/submit if non-empty
        var value = String(evt.target.value || "");
        if (value)
          ok.call(this, value, evt);
        else
          cancel.call(this, evt);
      }
    };
  };

  Template.entry.happening = function () {
    return Happenings.findOne(Session.get("selected"));
  };

  Template.entry.submit_entry = function () {
    var name = $('#entry_name').val();
    var context = $('#entry_context').val();
    var ts = Date.now() / 1000;
    var name_size = $('#entry_name_size').val();
    var x_position = $('#entry_x_position').val();
    var y_position = $('#entry_y_position').val();
    var name_color = $('#entry_name_color').val();
    var context_color = $('#entry_context_color').val();
    var context_size = $('#entry_context_size').val();


    var happening_id = $('#selected_happening_id').val()
    var happening = Happenings.findOne(happening_id)

    var new_attributes = {
      name:name, 
      context: context, 
      name_color: name_color,
      context_size: context_size,
      context_color: context_color,
      time: ts, 
      name_size: name_size,
      x_position: x_position,
      y_position: y_position
    }

    if (happening) {
      console.log('yes')
      Happenings.update(happening._id, { $set: new_attributes })
    } else {
      console.log('new')
      var happening_id = Happenings.insert(new_attributes)

    }
    happening = Happenings.findOne(happening_id)
    Visualizer.drawHappening(happening)
    Session.set('selected', happening._id);
  };

  Template.entry.new_entry = function () {
    Session.set('selected', null)
    $('#entry_x_position').val(Visualizer.apparent_center()[0]);
    $('#entry_y_position').val(Visualizer.apparent_center()[1]);
  };



  Template.entry.events = {
    'click #new_entry': function(){
      Template.entry.new_entry();
    },
    'click #zoom_in': function(){
      Visualizer.zoom(1.1);
    },
    'click #zoom_center': function(){
      Visualizer.zoom_center();
    },
    'click #zoom_out': function(){
      Visualizer.zoom(0.9);
    },
    
    'change .change_submit, click #position_change':function(){
      console.log('change')
      Template.entry.submit_entry();
    }
  };

  Template.entry.events[okcancel_events('.entry_inputs input')] = make_okcancel_handler({
    ok: function () {
      Template.entry.submit_entry()
    }
  });

  Template.story.happenings = function () {
    return Happenings.find({}, {sort: {time: -1} })
  };

  Template.story.events({
    'click': function () {
      Session.set('selected', this._id);
      Visualizer.centerOn(this);
    }
  });

}

if (Meteor.isServer) {
  Meteor.startup(function () {
    
    
  });
}
