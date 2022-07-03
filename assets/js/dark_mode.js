
/// Invert colors of SVG files.
function invertSVGColor() {
  var scheme = window.getComputedStyle(document.body).colorScheme;
  var images = document.getElementsByTagName('img');
  if (scheme == 'dark') {
    for (var i = 0; i < images.length; i++) {
      images[i].style.filter += "invert(100%)";
      images[i].style.filter += "grayscale(50%)";
    }
  } else {
    for (var i = 0; i < images.length; i++) {
      images[i].style.filter = null;
    }
  }
}

var colorSchemeObserver = new MutationObserver(function(mutations) {
  mutations.forEach(function(mutationRecord) {
    invertSVGColor();
  });
});

invertSVGColor();
const target = document.querySelector('html');
colorSchemeObserver.observe(target,
  { attributes : true, attributeFilter : ['data-darkreader-scheme'] }
);
