document.addEventListener('DOMContentLoaded', () => {

    // --- API Utility with Retry Mechanism ---
    /**
     * Fetch with retry logic for 503 MODEL_CAPACITY_EXHAUSTED errors
     */
    async function fetchWithRetry(url, options = {}, retries = 3) {
        try {
            const response = await fetch(url, options);
            
            // Check if response is 503
            if (response.status === 503) {
                const data = await response.json().catch(() => ({}));
                
                // Check if reason matches
                if (data.reason === "MODEL_CAPACITY_EXHAUSTED" || response.statusText.includes("CAPACITY")) {
                    if (retries > 0) {
                        console.warn(`503 Model Capacity Exhausted. Retrying in 15 seconds... (\${retries} retries left)`);
                        
                        // Wait for 15 seconds
                        await new Promise(resolve => setTimeout(resolve, 15000));
                        
                        // Retry the request
                        return fetchWithRetry(url, options, retries - 1);
                    } else {
                        throw new Error("Max retries reached. Service is still unavailable.");
                    }
                }
            }
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: \${response.status}`);
            }
            return response;
        } catch (error) {
            console.error("Fetch error:", error);
            throw error;
        }
    }

    // --- State Elements ---
    const menuGrid = document.getElementById('menuGrid');
    const menuFilters = document.getElementById('menuFilters');
    const locationsGrid = document.getElementById('locationsGrid');
    const carouselContainer = document.getElementById('carouselContainer');
    const navbar = document.getElementById('navbar');
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileNav = document.getElementById('mobileNav');
    const floatingOffer = document.getElementById('floatingOffer');
    const closeOfferBtn = document.getElementById('closeOffer');
    
    // Modal Elements
    const productModal = document.getElementById('productModal');
    const modalOverlay = document.getElementById('modalOverlay');
    const modalClose = document.getElementById('modalClose');
    const modalBody = document.getElementById('modalBody');

    // --- Render Functions ---
    
    // Populate Menu Grid
    function renderMenu(category = 'all') {
        menuGrid.innerHTML = ''; // Clear current grid
        
        const filteredProducts = category === 'all' 
            ? productsData 
            : productsData.filter(product => product.category === category);
            
        if (filteredProducts.length === 0) {
            menuGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 2rem;">No items found in this category.</p>';
            return;
        }

        filteredProducts.forEach(product => {
            const itemElement = document.createElement('div');
            itemElement.classList.add('menu-item', 'fade-in');
            
            const badgeHtml = product.badge ? `<span class="badge">${product.badge}</span>` : '';
            
            itemElement.innerHTML = `
                ${badgeHtml}
                <img src="${product.image}" alt="${product.name}" class="menu-item-img" loading="lazy">
                <div class="menu-item-content">
                    <h3 class="menu-item-title">${product.name}</h3>
                    <p class="menu-item-desc">${product.description}</p>
                    <div class="menu-item-footer">
                        <span class="menu-item-price">${product.price}</span>
                        <a href="https://wa.me/917401017555?text=Hi,%20I%20would%20like%20to%20order%20the%20${encodeURIComponent(product.name)}." target="_blank" class="btn btn-primary btn-sm">Order Now <i class="fab fa-whatsapp" style="margin-left: 5px;"></i></a>
                    </div>
                </div>
            `;
            menuGrid.appendChild(itemElement);
        });
        
        // Re-attach event listeners to new buttons
        attachModalListeners();
    }

    // Populate Extra Carousel
    function renderCarousel() {
        if (!carouselContainer) return;
        
        const customThemeCakes = [
            {
                name: "Barbie Doll Shape Cake",
                image: "Customized cake Previews/Barbie Doll Shape cake.png"
            },
            {
                name: "Lion Theme",
                image: "Customized cake Previews/Lion Theme.png"
            },
            {
                name: "Princess Theme Crown Two Tier",
                image: "Customized cake Previews/Princess Theme with crown two tier.png"
            },
            {
                name: "Triple Color Icing Three Tier",
                image: "Customized cake Previews/tripple color icing with three tier.png"
            }
        ];
        
        customThemeCakes.forEach(product => {
            const itemElement = document.createElement('div');
            itemElement.classList.add('carousel-item');
            
            itemElement.innerHTML = `
                <img src="${product.image}" alt="${product.name}" loading="lazy">
                <h4 style="color: var(--primary-color)">${product.name}</h4>
                <a href="#contact" class="btn btn-secondary btn-sm" style="margin-top: 0.5rem;">Order Custom</a>
            `;
            carouselContainer.appendChild(itemElement);
        });
    }

    // Populate Locations
    function renderLocations() {
        if (!locationsGrid) return;
        
        locationsData.forEach(loc => {
            const locElement = document.createElement('div');
            locElement.classList.add('location-card');
            
            locElement.innerHTML = `
                <i class="fas fa-map-marker-alt location-icon"></i>
                <h3 class="location-title">${loc.title}</h3>
                <div class="location-details">
                    <p><i class="fas fa-map-pin"></i> ${loc.address}</p>
                    <p><i class="fas fa-phone"></i> ${loc.phone}</p>
                    <p><i class="fas fa-clock"></i> ${loc.hours}</p>
                </div>
            `;
            locationsGrid.appendChild(locElement);
        });
    }

    // --- Interactivity ---

    // Filter Logic
    if (menuFilters) {
        menuFilters.addEventListener('click', (e) => {
            if (e.target.classList.contains('filter-btn')) {
                // Update active state
                document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                
                // Render specific category
                const filterValue = e.target.getAttribute('data-filter');
                renderMenu(filterValue);
            }
        });
    }

    // Modal Logic
    function openModal(productId) {
        const product = productsData.find(p => p.id === parseInt(productId));
        if (!product) return;
        
        modalBody.innerHTML = `
            <div class="modal-img-col">
                <img src="${product.image}" alt="${product.name}">
            </div>
            <div class="modal-info-col">
                <h2>${product.name}</h2>
                <div class="modal-price">${product.price}</div>
                <p class="modal-desc">${product.description}</p>
                
                <div class="modal-actions">
                    <a href="https://wa.me/917401017555?text=Hi, I would like to order the ${product.name}." target="_blank" class="btn btn-whatsapp w-100">
                        <i class="fab fa-whatsapp"></i> Order via WhatsApp
                    </a>
                    <button class="btn btn-secondary w-100" id="closeModalBtnInside">Close</button>
                </div>
            </div>
        `;
        
        productModal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent scrolling
        
        // Attach listener to the new close button inside modal
        document.getElementById('closeModalBtnInside').addEventListener('click', closeModal);
    }
    
    function closeModal() {
        productModal.classList.remove('active');
        document.body.style.overflow = '';
    }

    function attachModalListeners() {
        document.querySelectorAll('.view-details-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                openModal(id);
            });
        });
    }

    if (modalClose) modalClose.addEventListener('click', closeModal);
    if (modalOverlay) modalOverlay.addEventListener('click', closeModal);

    // Sticky Navbar
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        
        // Scroll reveal animation
        document.querySelectorAll('.fade-in-scroll').forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.top < window.innerHeight - 100) {
                el.classList.add('visible');
            }
        });
    });

    // Mobile Menu Toggle
    if (mobileMenuBtn && mobileNav) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileNav.classList.toggle('active');
            const icon = mobileMenuBtn.querySelector('i');
            if (mobileNav.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
        
        // Close menu on link click
        mobileNav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobileNav.classList.remove('active');
                const icon = mobileMenuBtn.querySelector('i');
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            });
        });
    }

    // Floating Offer
    setTimeout(() => {
        if (floatingOffer) floatingOffer.classList.add('show');
    }, 5000); // Show after 5 seconds
    
    if (closeOfferBtn) {
        closeOfferBtn.addEventListener('click', () => {
            floatingOffer.classList.remove('show');
        });
    }

    // Contact Form Stub
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Thank you for reaching out! We will get back to you soon.');
            contactForm.reset();
        });
    }

    // --- Initialization ---
    renderMenu();
    renderCarousel();
    renderLocations();
    
    // Trigger scroll event once to show elements already in view
    window.dispatchEvent(new Event('scroll'));
});
