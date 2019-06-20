$(window).on("load", () => {
  $('.preloader-wrapper').fadeOut();
  $('body').removeClass('preloader-site');
});

if (typeof lockedNavbar == 'undefined') {
  $(window).on("scroll", () => {
    if (document.body.scrollTop > 500 || document.documentElement.scrollTop > 500) {
      $("#scrolledNavbar").toggleClass("scrolled-nav", true);
    } else {
      $("#scrolledNavbar").toggleClass("scrolled-nav", false);
    }
  })
  $("#scrolledNavbar").toggleClass("scrolled-nav", (document.body.scrollTop > 500 || document.documentElement.scrollTop > 500));
} else {
  $("#bodyWrapper").toggleClass("scrolled", true);
  $("#scrolledNavbar").toggleClass("scrolled-nav", true);
}

// Display an alert with a message on top of everything that self destructs after ${timeout}
function successAlert(message,timeout) {
  let alert = document.createElement("div");
  alert.classList = "alert alert-success alert-dismissible position-fixed text-center fade show";
  alert.setAttribute("role", "alert");
  alert.setAttribute("style", "top:72px;left:50%;transform: translateX(-50%);");
  alert.innerHTML = `${message}
      <button type = "button" class="close" data-dismiss="alert" aria-label="Close">
      <span aria-hidden="true">&times;</span></button>`;
  $("body").append(alert);

  setTimeout(() => {
    $(alert).remove();
  }, timeout * 1000);
}

