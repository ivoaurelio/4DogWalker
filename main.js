document.addEventListener('DOMContentLoaded', () => {
    // === Mobile Menu Toggle ===
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const mobileMenu = document.querySelector('.mobile-menu');
    const mobileLinks = document.querySelectorAll('.mobile-menu a');

    if (mobileMenuToggle && mobileMenu) {
        mobileMenuToggle.addEventListener('click', () => {
            mobileMenu.classList.toggle('active');
            // Toggle icon between menu and x
            const icon = mobileMenuToggle.querySelector('i');
            if (mobileMenu.classList.contains('active')) {
                icon.setAttribute('data-lucide', 'x');
            } else {
                icon.setAttribute('data-lucide', 'menu');
            }
            lucide.createIcons(); // Re-render icons
        });

        // Close mobile menu when a link is clicked
        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.remove('active');
                mobileMenuToggle.querySelector('i').setAttribute('data-lucide', 'menu');
                lucide.createIcons();
            });
        });
    }

    // === Navbar Scroll Effect ===
    const navbar = document.querySelector('.navbar');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // === Intersection Observer for Scroll Animations ===
    // Elements to animate
    const fadeUpElements = document.querySelectorAll('.fade-up');
    const fadeInLeftElements = document.querySelectorAll('.fade-in-left');
    const fadeInRightElements = document.querySelectorAll('.fade-in-right');

    // Observer Options
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15 // Trigger when 15% of the element is visible
    };

    // Observer Callback
    const observerCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Add visible class to trigger CSS transition
                entry.target.classList.add('visible');
                // Unobserve after animating once
                observer.unobserve(entry.target);
            }
        });
    };

    // Create Observer
    const observer = new IntersectionObserver(observerCallback, observerOptions);

    // Observe all animate elements
    fadeUpElements.forEach(el => observer.observe(el));
    fadeInLeftElements.forEach(el => observer.observe(el));
    fadeInRightElements.forEach(el => observer.observe(el));

    // Initially trigger observation for elements already in viewport on load
    // (A slight delay ensures CSS rules are fully applied before checking)
    setTimeout(() => {
        fadeUpElements.forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom >= 0) {
                el.classList.add('visible');
            }
        });

        fadeInRightElements.forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom >= 0) {
                el.classList.add('visible');
            }
        });

        fadeInLeftElements.forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom >= 0) {
                el.classList.add('visible');
            }
        });
    }, 100);

    // === Scheduling Form Handler ===
    const schedulingForm = document.getElementById('scheduling-form');
    if (schedulingForm) {
        schedulingForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const tutorName = document.getElementById('tutorName').value.trim();
            const petName = document.getElementById('petName').value.trim();
            const scheduleDay = document.getElementById('scheduleDay').value;
            const scheduleTime = document.getElementById('scheduleTime').value;

            if (!tutorName || !petName || !scheduleDay || !scheduleTime) {
                alert("Por favor, preencha todos os campos do formulário para agendar a visita.");
                return;
            }

            const message = `Olá! 🐶\n\nMeu nome é *${tutorName}* e eu gostaria de agendar uma visita técnica para o meu pet, o(a) *${petName}*.\n\nO melhor horário para nós seria na *${scheduleDay}* às *${scheduleTime}*.\n\nAguardo confirmação!`;

            const whatsappUrl = `https://wa.me/5551989353003?text=${encodeURIComponent(message)}`;

            window.open(whatsappUrl, '_blank');
        });
    }
});
