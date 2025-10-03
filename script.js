// Slideshow functionality
let slideIndex = 1;
let slideInterval;

function showSlides(n) {
    let slides = document.getElementsByClassName('slide');
    let dots = document.getElementsByClassName('dot');
    
    if (n > slides.length) {
        slideIndex = 1;
    }
    if (n < 1) {
        slideIndex = slides.length;
    }
    
    for (let i = 0; i < slides.length; i++) {
        slides[i].classList.remove('active');
    }
    
    for (let i = 0; i < dots.length; i++) {
        dots[i].classList.remove('active');
    }
    
    if (slides[slideIndex - 1]) {
        slides[slideIndex - 1].classList.add('active');
    }
    if (dots[slideIndex - 1]) {
        dots[slideIndex - 1].classList.add('active');
    }
}

function currentSlide(n) {
    clearInterval(slideInterval);
    showSlides(slideIndex = n);
    startSlideshow();
}

function nextSlide() {
    showSlides(slideIndex += 1);
}

function startSlideshow() {
    slideInterval = setInterval(nextSlide, 4000);
}

// FAQ functionality
function initializeFAQ() {
    const faqQuestions = document.querySelectorAll('.faq-question');
    
    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            const faqItem = question.parentElement;
            const isActive = faqItem.classList.contains('active');
            
            // Close all FAQ items
            document.querySelectorAll('.faq-item').forEach(item => {
                item.classList.remove('active');
            });
            
            // Open clicked item if it wasn't active
            if (!isActive) {
                faqItem.classList.add('active');
            }
        });
    });
}

// Countdown timer functionality
function updateCountdown() {
    const now = new Date().getTime();
    const endTime = now + (24 * 60 * 60 * 1000); // 24 hours from now
    
    const timer = setInterval(() => {
        const currentTime = new Date().getTime();
        const timeLeft = endTime - currentTime;
        
        if (timeLeft <= 0) {
            clearInterval(timer);
            document.getElementById('hours').textContent = '00';
            document.getElementById('minutes').textContent = '00';
            document.getElementById('seconds').textContent = '00';
            return;
        }
        
        const hours = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
        
        document.getElementById('hours').textContent = hours.toString().padStart(2, '0');
        document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
        document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');
    }, 1000);
}

// Smooth scrolling for anchor links
function initializeSmoothScroll() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Animation on scroll
function initializeScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    const animatedElements = document.querySelectorAll('.testimonial-card, .faq-item, .video-container');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

// Enhanced button interactions
function initializeButtonEffects() {
    const buttons = document.querySelectorAll('.cta-button');
    
    buttons.forEach(button => {
        button.addEventListener('mouseenter', () => {
            button.style.transform = 'translateY(-2px) scale(1.02)';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.transform = 'translateY(0) scale(1)';
        });
        
        button.addEventListener('mousedown', () => {
            button.style.transform = 'translateY(0) scale(0.98)';
        });
        
        button.addEventListener('mouseup', () => {
            button.style.transform = 'translateY(-2px) scale(1.02)';
        });
    });
}

// Initialize all functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeScreenshotsGallery();
    initializeFAQ();
    initializeFAQDropdown();
    updateCountdown();
    initializeSmoothScroll();
    initializeScrollAnimations();
    initializeButtonEffects();
});

// Screenshots Gallery functionality
function initializeScreenshotsGallery() {
    const gallery = document.getElementById('screenshots-gallery');
    const screenshots = document.querySelectorAll('.screenshot-item');
    
    if (!gallery) return;
    
    // Duplicate screenshots for infinite scroll effect
    const originalScreenshots = Array.from(screenshots);
    originalScreenshots.forEach(screenshot => {
        const clone = screenshot.cloneNode(true);
        // Re-add event listeners to cloned elements
        const link = clone.getAttribute('data-link');
        if (link) {
            clone.addEventListener('click', () => {
                window.open(link, '_blank', 'noopener,noreferrer');
            });
        }
        
        clone.addEventListener('mouseenter', () => {
            clone.style.transform = 'translateY(-8px) scale(1.05)';
        });
        
        clone.addEventListener('mouseleave', () => {
            clone.style.transform = 'translateY(0) scale(1)';
        });
        
        gallery.appendChild(clone);
    });
    
    let isScrolling = false;
    let startX = 0;
    let scrollLeft = 0;
    
    // Mouse drag scrolling
    gallery.addEventListener('mousedown', (e) => {
        isScrolling = true;
        gallery.style.cursor = 'grabbing';
        gallery.style.animationPlayState = 'paused';
        startX = e.pageX - gallery.offsetLeft;
        scrollLeft = gallery.scrollLeft;
    });
    
    gallery.addEventListener('mouseleave', () => {
        isScrolling = false;
        gallery.style.cursor = 'grab';
        gallery.style.animationPlayState = 'running';
    });
    
    gallery.addEventListener('mouseup', () => {
        isScrolling = false;
        gallery.style.cursor = 'grab';
        gallery.style.animationPlayState = 'running';
    });
    
    gallery.addEventListener('mousemove', (e) => {
        if (!isScrolling) return;
        e.preventDefault();
        const x = e.pageX - gallery.offsetLeft;
        const walk = (x - startX) * 2;
        gallery.scrollLeft = scrollLeft - walk;
    });
    
    // Touch scrolling for mobile
    let startTouchX = 0;
    let touchScrollLeft = 0;
    
    gallery.addEventListener('touchstart', (e) => {
        gallery.style.animationPlayState = 'paused';
        startTouchX = e.touches[0].pageX - gallery.offsetLeft;
        touchScrollLeft = gallery.scrollLeft;
    });
    
    gallery.addEventListener('touchmove', (e) => {
        const x = e.touches[0].pageX - gallery.offsetLeft;
        const walk = (x - startTouchX) * 2;
        gallery.scrollLeft = touchScrollLeft - walk;
    });
    
    gallery.addEventListener('touchend', () => {
        gallery.style.animationPlayState = 'running';
    });
    
    // Navigation buttons
    const scrollLeftBtn = document.getElementById('scroll-left');
    const scrollRightBtn = document.getElementById('scroll-right');
    
    if (scrollLeftBtn) {
        scrollLeftBtn.addEventListener('click', () => {
            gallery.scrollLeft -= 300;
        });
    }
    
    if (scrollRightBtn) {
        scrollRightBtn.addEventListener('click', () => {
            gallery.scrollLeft += 300;
        });
    }
    
    // Click handlers for all screenshots (original + cloned)
    const allScreenshots = document.querySelectorAll('.screenshot-item');
    allScreenshots.forEach(screenshot => {
        screenshot.addEventListener('click', (e) => {
            const link = screenshot.getAttribute('data-link');
            if (link) {
                window.open(link, '_blank', 'noopener,noreferrer');
            }
        });
        
        // Add hover effect
        screenshot.addEventListener('mouseenter', () => {
            screenshot.style.transform = 'translateY(-8px) scale(1.05)';
        });
        
        screenshot.addEventListener('mouseleave', () => {
            screenshot.style.transform = 'translateY(0) scale(1)';
        });
    });
    
    // Wheel scrolling
    gallery.addEventListener('wheel', (e) => {
        e.preventDefault();
        gallery.style.animationPlayState = 'paused';
        gallery.scrollLeft += e.deltaY;
        
        // Resume animation after scrolling stops
        clearTimeout(gallery.wheelTimeout);
        gallery.wheelTimeout = setTimeout(() => {
            gallery.style.animationPlayState = 'running';
        }, 1000);
    });
}

// FAQ Dropdown functionality
function initializeFAQDropdown() {
    const faqSelect = document.getElementById('faq-select');
    const faqAnswers = document.querySelectorAll('.faq-answer-item');
    
    if (faqSelect) {
        faqSelect.addEventListener('change', (e) => {
            const selectedValue = e.target.value;
            
            // Hide all answers
            faqAnswers.forEach(answer => {
                answer.classList.remove('active');
            });
            
            // Show selected answer
            if (selectedValue) {
                const selectedAnswer = document.querySelector(`[data-faq="${selectedValue}"]`);
                if (selectedAnswer) {
                    selectedAnswer.classList.add('active');
                }
            }
        });
    }
}

// Handle video placeholder clicks
document.addEventListener('click', (e) => {
    if (e.target.closest('.video-placeholder')) {
        const placeholder = e.target.closest('.video-placeholder');
        placeholder.style.transform = 'scale(0.95)';
        setTimeout(() => {
            placeholder.style.transform = 'scale(1)';
        }, 150);
        
        // Add your video loading logic here
        console.log('Video placeholder clicked - ready for video integration');
    }
});
