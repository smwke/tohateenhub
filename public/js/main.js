let navbar = document.getElementById("scrolledNavbar");



if(typeof lockedNavbar == 'undefined'){
  window.onscroll = function() {myFunction()};
  $("#scrolledNavbar").toggleClass("scrolled-nav",(document.body.scrollTop > 40 || document.documentElement.scrollTop > 40));
}

function myFunction() {
  if (document.body.scrollTop > 40 || document.documentElement.scrollTop > 40) {
    $("#scrolledNavbar").toggleClass("scrolled-nav",true);
  } else{
    $("#scrolledNavbar").toggleClass("scrolled-nav",false);
  }
}