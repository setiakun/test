(function() {
  var container = document.querySelector('.NavJS');
  if (!container) return;

  var label = container.getAttribute('data-label');
  if (!label) return;
  container.innerHTML = `
    <div id="PrevNextNav">
      <button id="prevBtn">Prev</button>
      <button id="homeBtn">Home</button>
      <button id="nextBtn">Next</button>
    </div>
    <select id="chapterSelect"><option>Memuat...</option></select>
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

  // Fungsi untuk memuat feed dengan callback unik
  function loadFeed(start) {
    var script = document.createElement('script');
    script.src = feedUrl + start + '&max-results=500';
    script.onerror = function() {
      select.innerHTML = '<option>Gagal memuat data</option>';
      prevBtn.disabled = true;
      nextBtn.disabled = true;
      homeBtn.disabled = true;
    };
    document.body.appendChild(script);
  }

  // Callback global (akan di-override jika ada dua widget, tapi aman karena hanya satu)
  window.navCallback = function(json) {
    if (!json.feed.entry) {
      select.innerHTML = '<option>Tidak ada bab</option>';
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
    // Urutkan dari yang tertua ke terbaru (ascending)
    posts.sort(function(a, b) { return a.date - b.date; });

    // Isi select
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

    // Jika currentIndex tidak ditemukan (misal halaman ini tidak ada di daftar), set ke 0
    if (currentIndex === -1) {
      currentIndex = 0;
      select.selectedIndex = 0;
      // Tetapi tombol tetap aktif? Halaman mungkin tidak terdaftar, maka nonaktifkan
      // Atau biarkan pengguna pilih manual.
      // Lebih baik nonaktifkan tombol dan beri pesan
      prevBtn.disabled = true;
      nextBtn.disabled = true;
      homeBtn.disabled = true;
      select.innerHTML = '<option>Halaman tidak ditemukan dalam daftar bab</option>';
      return;
    }

    // Event listener untuk prev
    prevBtn.onclick = function() {
      if (currentIndex > 0) {
        location.href = posts[currentIndex - 1].url;
      }
    };
    nextBtn.onclick = function() {
      if (currentIndex < posts.length - 1) {
        location.href = posts[currentIndex + 1].url;
      }
    };
    homeBtn.onclick = function() {
      // Alihkan ke halaman indeks novel, misal ke /p/daftar-novel.html atau root
      // Ubah sesuai kebutuhan, contoh:
      location.href = '/p/daftar-novel.html';
    };

    // Disable tombol jika di ujung
    if (currentIndex === 0) prevBtn.disabled = true;
    if (currentIndex === posts.length - 1) nextBtn.disabled = true;

    // Navigasi via select
    select.addEventListener('change', function() {
      location.href = this.value;
    });
  }

  // Mulai load feed dari index 1
  loadFeed(1);
})();
