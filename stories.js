
Happenings = new Meteor.Collection('happenings');
Stories = new Meteor.Collection('stories');

if (Meteor.isClient) {
  function newStory() {
    var story_id = Stories.insert({'name':'new story', 'user_id': Meteor.userId()});
    console.log("NEW STORY ID: "+story_id)
    Session.set('story_id', story_id);
    Template.entry.new_entry();
    window.stage.reset();
    window.stage.setDraggable(true);
  }

  function drawHappenings() {
    var story_id = Session.get('story_id');
    console.log("DH, story_id: " + story_id)
    var happenings = Happenings.find({story_id:Session.get('story_id')})
    happenings.forEach(function(happening) {
      Visualizer.drawHappening(happening)
    })
  }

  var startUpdateListener = function() {
    // todo should only use this to gather new happenings in the story
    // each story should get an auto run, so only it is updated when changed.
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
    if (Session.get('story_id') == undefined) {
      console.log("undefined new stroy, creating")
      var story = Stories.findOne();
      conosle.log(story)
      if (story) {
        Session.set('story_id', story._id);
      } else {
        // var story_id = Stories.insert({'name':'new story', 'user_id': Meteor.userId()});
        // Session.set('story_id', story_id);
      }
    }
    $('#new_story').on('click', function(){
      newStory();
    });
    startUpdateListener()
    Accounts.ui.config({
      requestPermissions: {
        facebook: ['user_likes'],
        github: ['user', 'repo']
      },
      requestOfflineToken: {
        google: true
      },
      passwordSignupFields: 'USERNAME_AND_OPTIONAL_EMAIL'
    });


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

  Template.story.update_name = function () {
    var name = $('#story_name').val();
    console.log("updating name: " + name);
    var story_id = Session.get('story_id');
    Stories.update(story_id, { name: name })
  }

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
      user_id: Meteor.userId(),
      story_id: Template.selected_story.story()._id,
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
      Happenings.update(happening._id, { $set: new_attributes })
    } else {
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
      Template.entry.submit_entry();
    }
  };

  Template.selected_story.events = {
    'change #story_name': function () {
      console.log('change name')
      Template.story.update_name();
    }
  }

  Template.entry.events[okcancel_events('.entry_inputs input')] = make_okcancel_handler({
    ok: function () {
      Template.entry.submit_entry()
    }
  });

  Template.legend.happenings = function () {
    var story_id = Session.get('story_id');
    return Happenings.find({'story_id':story_id}, {sort: {time: -1} })
  };

  Template.legend.events({
    'click': function () {
      Session.set('selected', this._id);
      Visualizer.centerOn(this);
    }
  });

  Template.stories.events({
    'click': function () {
      Session.set('story_id', this._id);
      window.stage.reset();
      window.stage.setDraggable(true);
      drawHappenings();
      console.log("clicked!")
      
    }
  });

  Template.stories.stories = function () {
    var stories = Stories.find();
    return stories;
  };

  Template.selected_story.story = function () {
    // if (Stories.findOne({}) == undefined) {
    //   Stories.insert({name: 'first story', user_id: Meteor.userId()});
    //   return Stories.findOne({});
    // }
    console.log("story id: "+Session.get("story_id"))
    var story_id = Session.get('story_id');
    if (story_id) {
      var story = Stories.findOne(story_id);
    } else {
      var story = Stories.findOne({});
    }

    
    if (story) {
      Session.set('story_id', story._id);
    }
    Session.set('story', story);
    return story;
  }

}

if (Meteor.isServer) {
  Meteor.startup(function () {
  });
}
