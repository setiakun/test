function enhanceTOC() {
    if (typeof TOC_LABEL === 'undefined' || !TOC_LABEL) return;
    const labelName = TOC_LABEL;
    const container = document.getElementById('toc-container');
    if (!container) return;

    const countEl = document.createElement('div');
    countEl.id = 'chapter-count';
    container.prepend(countEl);

    const paginationEl = document.createElement('div');
    paginationEl.id = 'toc-pagination';
    container.appendChild(paginationEl);

    const tocTable = document.createElement('table');
    tocTable.id = 'toc-table';
    container.appendChild(tocTable);

    // Generate <thead>
    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr>
            <th>Chapter</th>
            <th class="date">Date</th>
        </tr>
    `;
    tocTable.appendChild(thead);

    // Create empty <tbody> that JS will populate
    const tbody = document.createElement('tbody');
    tocTable.appendChild(tbody);

    function fetchAllChapters(startIndex, collected) {
        const batchSize = 150;
        const url = '/feeds/posts/summary/-/' + encodeURIComponent(labelName)
                  + '?alt=json&orderby=published&max-results=' + batchSize
                  + '&start-index=' + startIndex;
        return fetch(url)
            .then(r => r.json())
            .then(feed => {
                const entries = feed.feed.entry || [];
                collected = collected.concat(entries);
                const totalStr = feed.feed.openSearch$totalResults ? feed.feed.openSearch$totalResults.$t : '0';
                const total = parseInt(totalStr, 10);
                if (entries.length > 0 && collected.length < total) {
                    return fetchAllChapters(startIndex + entries.length, collected);
                }
                // Deduplicate
                const unique = [];
                const seen = new Set();
                for (let i = 0; i < collected.length; i++) {
                    const links = collected[i].link || [];
                    let href = collected[i].id.$t;
                    for (let j = 0; j < links.length; j++) {
                        if (links[j].rel === 'alternate') href = links[j].href;
                    }
                    if (!seen.has(href)) {
                        seen.add(href);
                        unique.push(collected[i]);
                    }
                }
                return unique;
            });
    }

    function getEntryLink(entry) {
        const links = entry.link || [];
        for (let j = 0; j < links.length; j++) {
            if (links[j].rel === 'alternate') return links[j].href;
        }
        return '#';
    }

    fetchAllChapters(1, []).then(entries => {
        if (!entries.length) {
            tbody.innerHTML = `<tr><td colspan="2" style="text-align:center; padding:20px; color:red;">No chapters found.</td></tr>`;
            countEl.textContent = '';
            return;
        }

        entries.sort((a, b) => new Date(a.published.$t) - new Date(b.published.$t));
        const chapters = entries.slice(1); // skip first post if needed

        countEl.textContent = `${chapters.length} chapters`;

        const PAGE_SIZE = 25;
        let currentPage = 1;
        const totalPages = Math.ceil(chapters.length / PAGE_SIZE);

        function renderPage(page) {
            currentPage = page;
            const start = (page - 1) * PAGE_SIZE;
            const end = Math.min(start + PAGE_SIZE, chapters.length);
            tbody.innerHTML = '';
            if (chapters.length === 0) {
                tbody.innerHTML = `<tr><td colspan="2" style="text-align:center; padding:20px; color:red;">No chapters available.</td></tr>`;
                return;
            }
            for (let i = start; i < end; i++) {
                const dateStr = new Date(chapters[i].published.$t).toLocaleDateString();
                const tr = document.createElement('tr');
                tr.innerHTML = `<td><a href="${getEntryLink(chapters[i])}">${chapters[i].title.$t}</a></td>
                                <td class="date">${dateStr}</td>`;
                tbody.appendChild(tr);
            }
            renderPagination();
        }

        function renderPagination() {
            if (totalPages <= 1) {
                paginationEl.style.display = 'none';
                return;
            }
            paginationEl.style.display = 'flex';
            let html = '';
            html += `<button class="toc-page-btn${currentPage===1?' disabled':''}" onclick="tocGoPage(${currentPage-1})">&#171; Prev</button>`;
            for (let p = 1; p <= totalPages; p++) {
                html += `<button class="toc-page-btn${p===currentPage?' active':''}" onclick="tocGoPage(${p})">${p}</button>`;
            }
            html += `<button class="toc-page-btn${currentPage===totalPages?' disabled':''}" onclick="tocGoPage(${currentPage+1})">Next &#187;</button>`;
            paginationEl.innerHTML = html;
        }

        window.tocGoPage = function(page){
            if(page < 1 || page > totalPages) return;
            renderPage(page);
        }

        renderPage(1);
    }).catch(() => {
        tbody.innerHTML = `<tr><td colspan="2" style="text-align:center; padding:20px; color:red;">Failed to load chapters.</td></tr>`;
        countEl.textContent = '';
    });
}

window.addEventListener('DOMContentLoaded', enhanceTOC);
