// script.js

document.addEventListener('DOMContentLoaded', () => {
    const exploreMoreBtn = document.querySelector('.cta-btn');
    exploreMoreBtn.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelector('#shops-section').scrollIntoView({
            behavior: 'smooth'
        });
    });
});
