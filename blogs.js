const blogFiles = [
    'post1.md',
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

/**
 * Parse Markdown file with Frontmatter
 */
function parseMarkdownFile(markdownText) {
    const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
    const match = markdownText.match(frontmatterRegex);
    
    let metadata = {};
    let content = markdownText;

    if (match) {
        const frontmatter = match[1];
        content = markdownText.slice(match[0].length).trim();
        
        const lines = frontmatter.split('\n');
        lines.forEach(line => {
            if (!line.trim()) return;
            const colonIndex = line.indexOf(':');
            if (colonIndex === -1) return;
            
            const key = line.slice(0, colonIndex).trim();
            let value = line.slice(colonIndex + 1).trim();
            
            if ((value.startsWith('"') && value.endsWith('"')) || 
                (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }
            
            metadata[key] = value;
        });
    } else {
        content = markdownText.trim();
    }

    return {
        title: metadata.title || "Untitled Post",
        date: metadata.date || "",
        subtitle: metadata.subtitle || "",
        thumbnail: metadata.thumbnail || "",
        tag: metadata.tag || "",
        content: content
    };
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
                    const text = await res.text();
                    blogCache[file] = parseMarkdownFile(text);
                } else {
                    console.error(`Failed to load: ${file}`);
                }
            } catch(e) {
                console.error(`Error loading ${file}:`, e);
            }
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
        
        const thumbnailHtml = data.thumbnail 
            ? `<div class="blog-post-image"><img src="${escapeHtml(data.thumbnail)}" alt="thumbnail"></div>` 
            : '';

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

    document.body.classList.add("show-fluid");

    document.getElementById("list-view").style.display = "none";
    document.getElementById("main-header").style.display = "none";
    document.getElementById("navbar").style.display = "none";
    
    singleView.style.display = "block";
    singleView.classList.remove("slide-up-active");
    void singleView.offsetWidth;
    singleView.classList.add("slide-up-active");
    
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Render LaTeX with KaTeX
    if (typeof renderMathInElement !== "undefined") {
        renderMathInElement(singleView, {
            delimiters: [
                {left: "$$", right: "$$", display: true},
                {left: "$", right: "$", display: false}
            ],
            throwOnError: false
        });
    }
}

function backToBlogs() {
    document.body.classList.remove("show-fluid");

    const singleView = document.getElementById("single-view");
    singleView.style.display = "none";
    singleView.classList.remove("slide-up-active");
    
    document.getElementById("list-view").style.display = "block";
    document.getElementById("main-header").style.display = "block";
    document.getElementById("navbar").style.display = ""; 
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleSort() {
    isDescending = !isDescending;
    document.getElementById("sort-btn").innerText = isDescending ? "Newest First" : "Oldest First";
    renderBlogs();
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const sortBtn = document.getElementById('sort-btn');
    if (sortBtn) sortBtn.addEventListener('click', toggleSort);
    
    renderBlogs();
    
    const navbar = document.getElementById('navbar');
    if (navbar) {
        setTimeout(() => navbar.classList.add('visible'), 100);
    }
});