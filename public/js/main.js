$(window).on("load", () => {
  $('.preloader-wrapper').fadeOut();
  $('body').removeClass('preloader-site');
});

if (typeof lockedNavbar == 'undefined') {
  $(window).on("scroll", () => {
      if (document.body.scrollTop > 40 || document.documentElement.scrollTop > 40) {
          $("#scrolledNavbar").toggleClass("scrolled-nav", true);
      } else {
          $("#scrolledNavbar").toggleClass("scrolled-nav", false);
      }
  })
  $("#scrolledNavbar").toggleClass("scrolled-nav", (document.body.scrollTop > 40 || document.documentElement.scrollTop > 40));
}else{
  $("#bodyWrapper").toggleClass("scrolled",true);
  $("#scrolledNavbar").toggleClass("scrolled-nav", true);
}