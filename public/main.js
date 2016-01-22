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
		$.post('/api/comments', {id: id, comment: comment}).done(function(data) {	
		});
	}
})

$('.heart.outline.like.icon').on('click', function(){
	var $input = $(this),
			id = $input.data('id');
	$.post('/api/likes', {id: id}).done(function(data) {	
		});
})

});