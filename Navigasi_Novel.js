document.addEventListener("DOMContentLoaded", function(){
  var container = document.getElementById("NavJS");
  if(!container) return;
  var label = container.getAttribute("data-label");
  if(!label) return;
  var protocol = location.protocol;
  var host = location.hostname;
  var currentUrl = location.href.split("?")[0];
  container.innerHTML = `<div id="PrevNextNav"><button id="prevBtn">Prev</button><button id="homeBtn">Home</button><button id="nextBtn">Next</button></div>
      <select id="chapterSelect"><option>Loading...</option></select>`;
  var select = document.getElementById("chapterSelect");
  var prevBtn = document.getElementById("prevBtn");
  var nextBtn = document.getElementById("nextBtn");
  var homeBtn = document.getElementById("homeBtn");
  var posts = [];
  var loaded = 0;
  function loadFeed(start){
    var script = document.createElement("script");
    script.src = protocol+"//"+host+"/feeds/posts/default/-/"+encodeURIComponent(label)+"?alt=json-in-script&callback=navCallback&start-index="+start+"&max-results=500";
    document.body.appendChild(script);
  }
  window.navCallback = function(json){
    if(!json.feed.entry) return;
    var total = parseInt(json.feed.openSearch$totalResults.$t);
    var entries = json.feed.entry;
    for(var i=0;i<entries.length;i++){
      var title = entries[i].title.$t;
      var link = "#";
      for(var j=0;j<entries[i].link.length;j++){
        if(entries[i].link[j].rel === "alternate"){
          link = entries[i].link[j].href.split("?")[0];
          break;
        }
      }
      posts.push({
        title: title,
        url: link,
        date: new Date(entries[i].published.$t)
      });
    }

    loaded += entries.length;
    if(loaded < total){
      loadFeed(loaded + 1);
    }else{
      initNavigation();
    }
  };

  function initNavigation(){
    // Urutkan dari terlama ke terbaru (oldest to newest)
    posts.sort(function(a, b) { return a.date - b.date; }); 
    select.innerHTML = "";
    var currentIndex = -1;
    for(var i = 0; i < posts.length; i++){
      var option = document.createElement("option");
      option.value = posts[i].url;
      option.textContent = posts[i].title;
      select.appendChild(option);
      if(posts[i].url === currentUrl){currentIndex = i;select.selectedIndex = i;}
    }
    // PREV button (navigate to previous post)
    prevBtn.onclick = function(){if(currentIndex > 0){location.href = posts[currentIndex - 1].url;}};
    // NEXT button (navigate to next post)
    nextBtn.onclick = function(){if(currentIndex < posts.length - 1){location.href = posts[currentIndex + 1].url;}};
    // HOME button (navigate to the first post)
    homeBtn.onclick = function(){location.href = posts[0].url;};
    // Disable NEXT button if you're on the latest post (the newest post after sorting)
    if(currentIndex === posts.length - 1) nextBtn.disabled = true;
    // Disable PREV button if you're on the first post (the oldest post after sorting)
    if(currentIndex === 0) prevBtn.disabled = true;
    // When selecting a post from the dropdown, navigate to the selected post
    select.addEventListener("change", function(){location.href = this.value;});
  }
  loadFeed(1);
});
