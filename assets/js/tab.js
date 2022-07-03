function openTab(evt, figureName) {
  var i, tabcontent, tablinks, evtClassList, tabClassName, tabClassList;
  evtClassList = evt.currentTarget.parentElement.classList;

  // Get all elements with class="tabcontent" and hide them if the same parent
  tabcontent = document.getElementsByClassName("tabcontent");
  for (i = 0; i < tabcontent.length; i++) {
    tabClassName = tabcontent[i].parentElement.className;
    if (evtClassList.contains(tabClassName)) {
      tabcontent[i].style.display = "none";
    }
  }

  // Get all elements with class="tablinks" and remove the class "active" if the same parent
  tablinks = document.getElementsByClassName("tablinks");
  for (i = 0; i < tablinks.length; i++) {
    tabClassList = tablinks[i].parentElement.classList;
    if (evtClassList == tabClassList) {
      tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
  }

  // Show the current tab, and add an "active" class to the button that opened the tab
  document.getElementById(figureName).style.display = "block";
  evt.currentTarget.className += " active";
}

var i, defaultTabs;
defaultTabs = document.querySelectorAll('.defaultTab');
for (i = 0; i < defaultTabs.length; i++) {
  defaultTabs[i].click();
}