(function(){
const allowLevels = ["queen","king","maou"];
function isAllowed(){
  const level = document.body.getAttribute("data-user-level");
  return allowLevels.includes(level);
}

// blok klik kanan
document.addEventListener("contextmenu", function(e){
  if(!isAllowed()){
    e.preventDefault();
  }
});

// blok shortcut keyboard
document.addEventListener("keydown", function(e){
  if(isAllowed()) return;
  // F12
  if(e.key === "F12"){
    e.preventDefault();
  }
  // Ctrl combinations
  if(e.ctrlKey){
    const key = e.key.toLowerCase();
    if(
      key === "u" || // view source
      key === "s" || // save
      key === "x" || // cut
      key === "p" || // print
      key === "i" || // devtools
      key === "j" || // devtools
      key === "k"   // console
    ){
      e.preventDefault();
    }
  }
  // Ctrl+Shift+I / Ctrl+Shift+J
  if(e.ctrlKey && e.shiftKey){
    const key = e.key.toLowerCase();
    if(key === "i" || key === "j" || key === "c"){
      e.preventDefault();
    }
  }
});
})();
