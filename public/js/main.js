let navbar = document.getElementById("scrolledNavbar");

if(typeof lockedNavbar == 'undefined'){
  console.log("am intrat");
  window.onscroll = myFunction();
  $("#scrolledNavbar").toggleClass("scrolled-nav",(document.body.scrollTop > 40 || document.documentElement.scrollTop > 40));
}

function myFunction() {
  console.log("scrolling");
  if (document.body.scrollTop > 40 || document.documentElement.scrollTop > 40) {
    $("#scrolledNavbar").toggleClass("scrolled-nav",true);
  } else{
    $("#scrolledNavbar").toggleClass("scrolled-nav",false);
  }
}