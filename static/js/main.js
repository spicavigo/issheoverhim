
var HASHKEY;
function initialize(){
  if (INITMETHOD == 'NewPost'){
    updateSelect();
    $('.container').addClass('hide');
    $('#newpost').removeClass('hide');
    HASHKEY = generateUUID()
    getAllPosts()
  }
  if (INITMETHOD == 'ViewPost'){
    $('.container').addClass('hide');
    $('#postitem').removeClass('hide');
  }
  if (INITMETHOD == 'EditPost'){
    $('.container').addClass('hide');
    $('#edititem').removeClass('hide');
  }
}

function showLogin(){
  $('.container').addClass('hide');
  $('#loginbtn').removeClass('hide');
}
function updateSelect(){
  getFriends(function(){
          populateSelect("object");
          populateSelect("subject");
        });
}

function getFriends(callback){
  FB.api('/me/friends?fields=id,name,username,gender', function(response) {
        if (response.data) {
          FB.FRIENDS = response.data
          FB.FRIENDS.push(FB.USER)
          if (typeof callback === 'function') { callback(); }
        } else {
          console.log('No friends returned');
          return false;
        }
      });
}
var OBJECT = null;
var SUBJECT = null;

function populateSelect(selectid){
  var gender = '';
  if (selectid == "subject") {
    gender = SGENDER
  } else {
    gender = OGENDER
  }
  var friends = $.grep(FB.FRIENDS, function(v) {
        return v.gender === gender;
    });
  var data = new Bloodhound({
    datumTokenizer: function(d) { return Bloodhound.tokenizers.whitespace(d.name); },
    queryTokenizer: Bloodhound.tokenizers.whitespace,
    local: friends
  });
 
  // initialize the bloodhound suggestion engine
  data.initialize();
   
  // instantiate the typeahead UI
  $('#'+selectid).typeahead(null, {
    displayKey: 'name',
    source: data.ttAdapter()
  });
  $('#'+selectid).on('typeahead:selected typeahead:autocompleted', function (e, datum) {
    if (selectid == "object"){
      OBJECT = datum
    }
    if (selectid == "subject"){
      SUBJECT = datum
    }
  });
}

function answerChange(){
  var objectval = $('#object').val();
  var subjectval = $('#subject').val()
  var val = $('#answer').val();
  if (val == "ask"){
    if (OBJECT == null || SUBJECT == null || objectval != OBJECT.name || subjectval != SUBJECT.name){
      alert("You must fill all the inputs first!");
      $('#answer').val("0")
      return
    }
    hidePost();
    post(function(data){
      console.log(data)
      fbFreindRequest(data.edit)
    });
  }
}

function fbFreindRequest(link){
  console.log(link)
  FB.ui({
      method: 'send',
      link: link
    }, function(response){
      if (response == null){
        showPost()
        resetAnswer();
      } else {
        if(response.success) {
          showPost()
        } else {
          showPost();
          //resetAnswer();
        }
      }
    });
}
function post(callback){
  $.post('/post', {
    'object': OBJECT.username,
    'object_name': OBJECT.name,
    'subject': SUBJECT.username,
    'subject_name': SUBJECT.name,
    'token': FB.getAccessToken(),
    'username': FB.USER.username,
    'answer':$('#answer').val(),
    'language': $('#language').val(),
    'hashkey': HASHKEY
  }, function(response){
    HASHKEY = generateUUID()
    getAllPosts()
    if (typeof callback === 'function') { callback(response); }
  }, 'json')
}

function update(uid, hashkey){

  $.post('/update', {
    'answer':$('#editanswer').val(),
    'hashkey': hashkey,
    'uid': uid
  }, function(response){
    document.location.href='/'
  })
}

function showPost(){
  $('#post').show();
}

function hidePost(){
  $('#post').hide();
}

function resetAnswer(){
  $('#answer').val("0");
}

function getAllPosts(){
  $.post('/getallposts', {
    'token': FB.getAccessToken(),
    'username': FB.USER.username
  }, function(response){
    html = '';
    for(var i=0; i<response.length; i++){
      html += '<div class="postlink">';
      html += '<a href="'+response[i].link+'">'+response[i].title + '</a>';
      html += '<span class="glyphicon glyphicon-trash delete" data-id="'+response[i].delete+'"></span>';
      html += '<a class="glyphicon glyphicon-edit edit" href="'+response[i].edit+'"></a>';
      html += '</div>'
    }
    $('#postscontainer').html(html);
    $('#postscontainer .delete').bind('click', function(){
      $.post('/delete', {
        'token':FB.getAccessToken(),
        'username':FB.USER.username,
        'hashkey': $(this).attr('data-id')
      }, function(response){
        if (response == 'ok'){
          getAllPosts()
        }
      })
    })
    if (html.length){
      $('#posts').removeClass('hide');
    }
  }, 'json')

}

function updateLanguages(){
  var langcodes = ["en", "fr"];
  var langnames = ["English", "French"];

  var html = "";

  for (var i=0; i<langcodes.length; i++){
    html += "<option value='"+langcodes[i]+"'>"+langnames[i]+"</option>";
  }

  $("#language").html(html);
  $("#postlanguage").html(html);
  $("#editlanguage").html(html);
}

function generateUUID() {
  var d = new Date().getTime();
  var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = (d + Math.random()*16)%16 | 0;
    d = Math.floor(d/16);
    return (c=='x' ? r : (r&0x7|0x8)).toString(16);
  });
  return uuid;
};

$(function(){
  updateLanguages();
  
  $("#submit").bind('click', function(){
    post(function(response){
      console.log(response)
    })
  });
  $("#updatesubmit").bind('click', function(){
    update(function(response){
      console.log(response)
    })
  });
  $("#postanswer").unicornblast({
    start: 'hover',
    numberOfFlyBys: 4}
  );
})
