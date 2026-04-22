const navbar = document.getElementById('navbar');
const hero = document.getElementById('hero');

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) {
            navbar.classList.add('visible');
        } else {
            navbar.classList.remove('visible');
        }
    });
}, {
    threshold: 0.5 
});

if (hero) {
    observer.observe(hero);
}

const sparkStat = document.getElementById('spark-stat');
if (sparkStat) {
    sparkStat.addEventListener('click', () => {
        const isExpanded = sparkStat.classList.contains('expanded');
        if (isExpanded) {
            sparkStat.textContent = sparkStat.getAttribute('data-short');
            sparkStat.classList.remove('expanded');
        } else {
            sparkStat.textContent = sparkStat.getAttribute('data-full');
            sparkStat.classList.add('expanded');
        }
    });
}