
const blogFiles = [
    'post1.json'
];

let isDescending = true;
let blogCache = {};

function escapeHtml(str) {
    if (!str) return "";
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}

function getExcerpt(markdown, maxLength = 140) {
    if (!markdown) return "";
    let text = markdown
        .replace(/[#*`_~>[\]]/g, '') 
        .replace(/\n+/g, ' ')        
        .trim();
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
}


// Async Drive Mounting Engine
async function renderBlogs() {
    const container = document.getElementById("blog-container");

    if (blogFiles.length === 0) {
        container.innerHTML = '<div style="text-align:center;">No publications found.</div>';
        return;
    }

    for (const file of blogFiles) {
        if (!blogCache[file]) {
            try {
                const res = await fetch(`./src/blogs/${file}`);
                if (res.ok) {
                    blogCache[file] = await res.json();
                } else {
                    console.error(`Failed to map address for: ${file}`);
                }
            } catch(e) { console.error(`Data link transmission failure:`, e); }
        }
    }

    const sortedFiles = [...blogFiles].filter(f => blogCache[f]).sort((a, b) => {
        const dateA = new Date(blogCache[a].date || 0);
        const dateB = new Date(blogCache[b].date || 0);
        return isDescending ? dateB - dateA : dateA - dateB;
    });

    let html = "";

    sortedFiles.forEach(file => {
        const data = blogCache[file];
        
        // Build the left-side thumbnail if it exists
        const thumbnailHtml = data.thumbnail 
            ? `<div class="blog-post-image"><img src="${escapeHtml(data.thumbnail)}" alt="thumbnail"></div>` 
            : '';

        // Build the [tag] block if it exists
        const tagHtml = data.tag 
            ? `<span class="blog-tag-square">[${escapeHtml(data.tag)}]</span>` 
            : '';

        html += `
        <article class="blog-post-card" onclick="openBlog('${file}')">
            ${thumbnailHtml}
            <div class="blog-post-content">
                <h2 class="blog-title-wrap">${escapeHtml(data.title)} ${tagHtml}</h2>
                <p class="blog-desc">${escapeHtml(data.subtitle || '')}</p>
                <span class="blog-post-meta">${escapeHtml(data.date)}</span>
            </div>
        </article>`;
    });

    container.innerHTML = html;
}

function openBlog(file) {
    const data = blogCache[file];
    if (!data) return;

    const htmlContent = marked.parse(data.content || "");
    const singleView = document.getElementById("single-view");
    
    singleView.innerHTML = `
        <button class="back-btn" onclick="backToBlogs()">← back to blogs</button>
        <h1 class="single-title">${escapeHtml(data.title)}</h1>
        <div class="single-meta">${escapeHtml(data.date)}</div>
        
        <div class="parsed-markdown">${htmlContent}</div>
    `;

    // Drop global execution metrics out to trigger native Brownian background visibility
    document.body.classList.add("show-fluid");

    // Total visibility separation: Hide list, header, AND navbar
    document.getElementById("list-view").style.display = "none";
    document.getElementById("main-header").style.display = "none";
    document.getElementById("navbar").style.display = "none";
    
    // Mount text visual structures and fire standard positioning interpolation
    singleView.style.display = "block";
    singleView.classList.remove("slide-up-active");
    void singleView.offsetWidth; // Force rendering pipeline layout recalculation break
    singleView.classList.add("slide-up-active");
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function backToBlogs() {
    // Clear global state flags to return background parameters back to Julia Fractal plane
    document.body.classList.remove("show-fluid");

    // Teardown single view structure completely
    const singleView = document.getElementById("single-view");
    singleView.style.display = "none";
    singleView.classList.remove("slide-up-active");
    
    // Remount central feed systems AND navbar
    document.getElementById("list-view").style.display = "block";
    document.getElementById("main-header").style.display = "block";
    
    // Setting display to empty string clears the inline "none" style, 
    // allowing your CSS file to take over styling the navbar again safely.
    document.getElementById("navbar").style.display = ""; 
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleSort() {
    isDescending = !isDescending;
    document.getElementById("sort-btn").innerText = isDescending ? "Newest First" : "Oldest First";
    renderBlogs();
}

// Initialize System Engine Listener Attachments
document.addEventListener('DOMContentLoaded', () => {
    const sortBtn = document.getElementById('sort-btn');
    if(sortBtn) sortBtn.addEventListener('click', toggleSort);
    renderBlogs();
    
    // Trigger the navbar drop-down animation on load
    const navbar = document.getElementById('navbar');
    if (navbar) {
        setTimeout(() => {
            navbar.classList.add('visible');
        }, 100);
    }
});