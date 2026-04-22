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