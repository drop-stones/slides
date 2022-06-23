/// Invert colors of SVG files.
(function() {
  var scheme = window.getComputedStyle(document.body).colorScheme;
  //console.log(scheme);
  if (scheme == 'dark') {
    var images = document.getElementsByTagName('img');
    for (var i = 0; i < images.length; i++) {
      // console.log(images[i]);
      images[i].style.filter += "invert(100%)";
      images[i].style.filter += "grayscale(50%)";
    }
  }
})();