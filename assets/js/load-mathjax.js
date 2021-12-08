//window.MathJax = {
//  tex: {
//    macros: {
//      bm: ["{\\boldsymbol{#1}}",1],
//      //inlineMath: [['$', '$'], ['\\(', '\\)']],
//      processEscape: true, // use \$ to produce dollar mark
//      processEnvironments: true
//    }
//  },
//  chtml: {
//    mtextInheritFont: true,
//    displayAlign: 'left',
//    displayIndent: '2em'
//  },
//};

(function () {
  var script = document.createElement('script');
  //script.src = "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js";
  script.src = "https://cdn.jsdelivr.net/npm/mathjax@3.0.0/es5/tex-chtml.js";
  script.async = true;
  document.head.appendChild(script);
})();
