$(document).ready(function() {

//Show comments
$('.comments-section').hide();
$('.see-comments').on('click', function(){
	// $('.comments-section').toggle();
	var trying = $(this).next('.comments-section');
	trying.toggle();
})

// Side Menu left is opened by button
$('.ui.left.sidebar')
    .sidebar('attach events', '.ui.top.attached.demo.menu');

// Button main Page
$('.start-grams').on('click', function(){
	location.href='/all';
});

$('.comment-input').on('keypress', function(event) {
	if (event.which === 13) {
		var $input = $(this),
			comment = $input.val(),
			id = $input.data('id');
		$input.val('');
		window.alert('Comment posted!');
		$ul = $('#ul_' + id);
		$.post('/api/comments', {id: id, comment: comment}).done(function(data) {	
			console.log(data);
			$ul.empty();
			data.forEach(function(comment){
				$ul.append('<li style="list-style: none;"><i class="quote left icon"></i>' + comment + '<i class="quote right icon"></i></li>');
			})
		});
	}
})

$('.heart.outline.like.icon').on('click', function(){
	var $input = $(this),
			id = $input.data('id');
			$(this).removeClass('outline');
			// var numOfLikes = $('#post_' + id).text();
			// $('#post_' + id).text(parseInt(numOfLikes) + 1);
	$.post('/api/likes', {id: id}).done(function(data) {	
		$('#post_' + id).text(data);
		console.log(data);
		});
})

$('.ui.form.creategram')
  .form({
    name: {
      identifier  : 'name',
      rules: [
        {
          type   : 'empty',
          prompt : 'Please enter the dog name'
        }
      ]
    },
    description: {
      identifier  : 'description',
      rules: [
        {
          type   : 'empty',
          prompt : 'Please enter a description'
        },
        {
          type   : 'length[6]',
          prompt : 'Please enter a description with at least 6 letters'
        }
      ]
    },
    location: {
      identifier : 'location',
      rules: [
        {
          type   : 'empty',
          prompt : 'Please enter a location'
        }
      ]
    },
    image: {
      identifier : 'image',
      rules: [
        {
          type   : 'empty',
          prompt : 'Please upload an image'
        }
      ]
    },
  }, 
  {
    inline : true,
    on     : 'blur',
  });

$('.ui.form.sendusabark')
  .form({
    name: {
      identifier  : 'name',
      rules: [
        {
          type   : 'empty',
          prompt : 'Please enter your name'
        }
      ]
    },
    description: {
      identifier  : 'email',
      rules: [
        {
          type   : 'empty',
          prompt : 'Please enter your email'
        }
      ]
    },
    location: {
      identifier : 'message',
      rules: [
        {
          type   : 'empty',
          prompt : 'Please enter a message'
        }
      ]
    }
  }, 
  {
    inline : true,
    on     : 'blur',
});

$('.ui.form.red.login-form')
  .form({
    username: {
      identifier  : 'username',
      rules: [
        {
          type   : 'empty',
          prompt : 'Please enter your username'
        }
      ]
    },
    password: {
      identifier  : 'password',
      rules: [
        {
          type   : 'empty',
          prompt : 'Please enter your password'
        }
      ]
    }
  }, 
  {
    inline : true,
    on     : 'blur',
  }
);

$('.ui.form.signup-form')
  .form({
    usernname: {
      identifier  : 'username',
      rules: [
        {
          type   : 'empty',
          prompt : 'Please enter your username'
        }
      ]
    },
    password: {
      identifier  : 'password',
      rules: [
        {
          type   : 'empty',
          prompt : 'Please enter your password'
        }
      ]
    },
    password_confirmation: {
      identifier  : 'password_confirm',
      rules: [
        {
          type   : 'empty',
          prompt : 'Please enter a password confirmation'
        }
      ]
    },
    image: {
      identifier  : 'image',
      rules: [
        {
          type   : 'empty',
          prompt : 'Please select a profile picture'
        }
      ]
    }
  }, 
  {
    inline : true,
    on     : 'blur',
  }
);





});
