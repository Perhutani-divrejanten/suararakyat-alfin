// Load Latest News section dynamically from articles.json
async function loadLatestNews() {
    try {
        const response = await fetch('articles.json');
        const articles = await response.json();

        // Get articles 2-5 (they are 0-indexed, so slice 2,6 gets indices 2,3,4,5)
        // These should be the 3rd, 4th, 5th, 6th articles
        const latestArticles = articles.slice(2, 6);

        // Find the Latest News section-title h4
        const sectionTitles = document.querySelectorAll('.section-title h4');
        let latestNewsRow = null;

        for (let title of sectionTitles) {
            if (title.textContent.trim() === 'Latest News') {
                // Get the parent row that contains this section
                const sectionDiv = title.closest('.section-title');
                const colDiv = sectionDiv.closest('.col-12');
                const rowDiv = colDiv.closest('.row');
                if (rowDiv) {
                    latestNewsRow = rowDiv;
                }
                break;
            }
        }

        if (!latestNewsRow) {
            console.error('Latest news row container not found');
            return;
        }

        // Find all col divs after the section-title and remove them
        const sectionDiv = latestNewsRow.querySelector('.section-title');
        const colDivs = latestNewsRow.querySelectorAll('[class*="col-lg"]');
        
        let foundSection = false;
        for (let col of colDivs) {
            if (foundSection) {
                col.remove();
            }
            if (col.querySelector('.section-title')) {
                foundSection = true;
            }
        }

        // Create the latest news items
        let adsAdded = false;
        latestArticles.forEach((article, index) => {
            const colDiv = document.createElement('div');
            colDiv.className = 'col-lg-6';
            
            const articleHtml = `
                <div class="position-relative mb-3">
                    <a href="${article.url}">
                        <img class="img-fluid w-100" src="${article.image || 'img/placeholder.jpg'}" style="object-fit: cover;" alt="${article.title}">
                    </a>
                    <div class="bg-white border border-top-0 p-4">
                        <div class="mb-2">
                            <a class="badge badge-primary news-badge mr-2" href="news.html?category=${encodeURIComponent(article.category || 'News')}">${article.category || 'News'}</a>
                            <a class="text-body" href=""><small>${article.date || 'No date'}</small></a>
                        </div>
                        <a class="h4 d-block mb-3 text-secondary text-uppercase font-weight-bold" href="${article.url}">${article.title}</a>
                        <p class="m-0">${article.excerpt || ''}</p>
                    </div>
                    <div class="d-flex justify-content-between bg-white border border-top-0 p-4">
                        <div class="d-flex align-items-center">
                            <img class="rounded-circle mr-2" src="img/alfin.jpg" width="25" height="25" alt="${article.author || 'Author'}">
                            <small>${article.author || 'Alfin Syawalan'}</small>
                        </div>
                    </div>
                </div>
            `;
            
            colDiv.innerHTML = articleHtml;
            latestNewsRow.appendChild(colDiv);
            
            // Add advertisement after first 2 articles
            if (index === 1 && !adsAdded) {
                const adDiv = document.createElement('div');
                adDiv.className = 'col-lg-12 mb-3';
                adDiv.innerHTML = '<a href="https://htmlcodex.com/downloading/?item=1541"><img class="img-fluid w-100" src="img/ads-728x90.png" alt=""></a>';
                latestNewsRow.appendChild(adDiv);
                adsAdded = true;
            }
        });

        console.log('✅ Latest news loaded successfully');

    } catch (error) {
        console.error('❌ Error loading latest news:', error);
    }
}

// Load latest news when DOM is ready
document.addEventListener('DOMContentLoaded', loadLatestNews);