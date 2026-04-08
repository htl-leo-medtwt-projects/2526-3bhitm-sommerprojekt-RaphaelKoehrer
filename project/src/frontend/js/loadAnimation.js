document.addEventListener('DOMContentLoaded', () => {
            Products.renderFeatured('featuredProducts');
            Products.renderCategories('categoriesGrid');
            if (typeof Animations !== 'undefined') {
                Animations.initParticles('hero-canvas');
                Animations.typeWriter('hero-typewriter', ['KöhrerGainz!', 'Beast Mode!', 'Deine Gainz!']);
            }
        });