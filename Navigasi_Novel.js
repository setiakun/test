(function() {
  // Ambil elemen pertama dengan class NavJS
  var container = document.querySelector('.NavJS');
  if (!container) return;

  var label = container.getAttribute('data-label');
  if (!label) return;

  // Tampilkan UI navigasi
  container.innerHTML = `
    <div id="PrevNextNav">
      <button id="prevBtn">Prev</button>
      <button id="homeBtn">Home</button>
      <button id="nextBtn">Next</button>
    </div>
    <select id="chapterSelect"><option>Memuat daftar bab...</option></select>
  `;

  var select = document.getElementById('chapterSelect');
  var prevBtn = document.getElementById('prevBtn');
  var nextBtn = document.getElementById('nextBtn');
  var homeBtn = document.getElementById('homeBtn');

  var posts = [];
  var loaded = 0;
  var total = 0;
  var currentIndex = -1;
  var currentUrl = location.href.split('?')[0];
  var feedUrl = '//' + location.hostname + '/feeds/posts/default/-/' + encodeURIComponent(label) + '?alt=json-in-script&callback=navCallback&start-index=';

  function loadFeed(start) {
    var script = document.createElement('script');
    script.src = feedUrl + start + '&max-results=500';
    script.onerror = function() {
      select.innerHTML = '<option>Gagal memuat data. Coba refresh.</option>';
      prevBtn.disabled = true;
      nextBtn.disabled = true;
      homeBtn.disabled = true;
    };
    document.body.appendChild(script);
  }

  window.navCallback = function(json) {
    if (!json.feed.entry) {
      select.innerHTML = '<option>Tidak ada bab ditemukan</option>';
      prevBtn.disabled = true;
      nextBtn.disabled = true;
      homeBtn.disabled = true;
      return;
    }

    total = parseInt(json.feed.openSearch$totalResults.$t) || 0;
    var entries = json.feed.entry;

    for (var i = 0; i < entries.length; i++) {
      var title = entries[i].title.$t;
      var link = '#';
      for (var j = 0; j < entries[i].link.length; j++) {
        if (entries[i].link[j].rel === 'alternate') {
          link = entries[i].link[j].href.split('?')[0];
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
    if (loaded < total) {
      loadFeed(loaded + 1);
    } else {
      initNavigation();
    }
  };

  function initNavigation() {
    // Urutkan dari bab tertua ke terbaru
    posts.sort(function(a, b) { return a.date - b.date; });

    select.innerHTML = '';
    for (var i = 0; i < posts.length; i++) {
      var option = document.createElement('option');
      option.value = posts[i].url;
      option.textContent = posts[i].title;
      select.appendChild(option);
      if (posts[i].url === currentUrl) {
        currentIndex = i;
        select.selectedIndex = i;
      }
    }

    // Jika halaman saat ini bukan bab (misal daftar isi), nonaktifkan Prev/Next
    if (currentIndex === -1) {
      prevBtn.disabled = true;
      nextBtn.disabled = true;
      homeBtn.onclick = function() {
        location.href = '/search/label/' + encodeURIComponent(label);
      };
      select.innerHTML = '<option>Halaman ini bukan bab</option>';
      return;
    }

    // Tombol Prev
    prevBtn.onclick = function() {
      if (currentIndex > 0) location.href = posts[currentIndex - 1].url;
    };

    // Tombol Next
    nextBtn.onclick = function() {
      if (currentIndex < posts.length - 1) location.href = posts[currentIndex + 1].url;
    };

    // Tombol Home => ke halaman daftar isi (semua postingan dengan label ini)
    homeBtn.onclick = function() {
      location.href = '/search/label/' + encodeURIComponent(label);
    };

    // Nonaktifkan tombol jika di ujung
    if (currentIndex === 0) prevBtn.disabled = true;
    if (currentIndex === posts.length - 1) nextBtn.disabled = true;

    // Navigasi via dropdown
    select.addEventListener('change', function() {
      location.href = this.value;
    });
  }

  // Mulai ambil data dari bab pertama
  loadFeed(1);
})();
