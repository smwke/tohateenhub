window.onscroll = function() {myFunction()};

function myFunction() {
  if (document.body.scrollTop > 40 || document.documentElement.scrollTop > 40) {
    document.getElementById("scrolledNavbar").className = "scrolled-nav";
  } else {
    document.getElementById("scrolledNavbar").className = "";
  }
}