window.MathJax = {
  tex: {
    macros: {
      bm: ["{\\boldsymbol{#1}}",1],
      inlineMath: [['$', '$'], ['\\(', '\\)']],
      processEscape: true // use \$ to produce dollar mark
    }
  },
  chtml: {
    mtextInheritFont: true
  },
};