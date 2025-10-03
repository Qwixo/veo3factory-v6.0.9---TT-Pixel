// Cookie Consent Management
class CookieConsent {
    constructor() {
        this.consentKey = 'cookie-consent';
        this.preferencesKey = 'cookie-preferences';
        this.init();
    }

    init() {
        // Check if consent has been given
        if (!this.hasConsent()) {
            this.showBanner();
        } else {
            this.loadConsentedCookies();
        }
    }

    hasConsent() {
        return localStorage.getItem(this.consentKey) !== null;
    }

    getPreferences() {
        const prefs = localStorage.getItem(this.preferencesKey);
        return prefs ? JSON.parse(prefs) : {
            essential: true,
            analytics: false,
            marketing: false,
            functional: false
        };
    }

    savePreferences(preferences) {
        localStorage.setItem(this.preferencesKey, JSON.stringify(preferences));
        localStorage.setItem(this.consentKey, new Date().toISOString());
    }

    showBanner() {
        const banner = document.createElement('div');
        banner.id = 'cookie-banner';
        banner.innerHTML = `
            <div class="cookie-banner">
                <div class="cookie-content">
                    <div class="cookie-text">
                        <h3>🍪 Cookie Settings</h3>
                        <p>We use cookies to enhance your experience, analyze site usage, and assist in marketing. You can manage your preferences below.</p>
                    </div>
                    <div class="cookie-actions">
                        <button onclick="cookieConsent.acceptAll()" class="cookie-btn accept-all">Accept All</button>
                        <button onclick="cookieConsent.showPreferences()" class="cookie-btn manage">Manage Preferences</button>
                        <button onclick="cookieConsent.acceptEssential()" class="cookie-btn essential">Essential Only</button>
                    </div>
                    <div class="cookie-links">
                        <a href="cookie-policy.html" target="_blank">Cookie Policy</a> | 
                        <a href="privacy-policy.html" target="_blank">Privacy Policy</a>
                    </div>
                </div>
            </div>
        `;

        // Add CSS
        const style = document.createElement('style');
        style.textContent = `
            .cookie-banner {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                background: linear-gradient(135deg, #1a1a1a, #2a2a2a);
                border-top: 2px solid #FFD700;
                padding: 24px;
                z-index: 10000;
                box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.5);
            }
            
            .cookie-content {
                max-width: 1200px;
                margin: 0 auto;
                display: flex;
                align-items: center;
                gap: 24px;
                flex-wrap: wrap;
            }
            
            .cookie-text {
                flex: 1;
                min-width: 300px;
            }
            
            .cookie-text h3 {
                color: #FFD700;
                font-size: 18px;
                font-weight: 700;
                margin-bottom: 8px;
            }
            
            .cookie-text p {
                color: #e0e0e0;
                font-size: 14px;
                line-height: 1.5;
                margin: 0;
            }
            
            .cookie-actions {
                display: flex;
                gap: 12px;
                flex-wrap: wrap;
            }
            
            .cookie-btn {
                padding: 10px 20px;
                border: none;
                border-radius: 6px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                font-size: 14px;
            }
            
            .cookie-btn.accept-all {
                background: linear-gradient(135deg, #FFD700, #FFA500);
                color: #000000;
            }
            
            .cookie-btn.manage {
                background: transparent;
                color: #FFD700;
                border: 2px solid #FFD700;
            }
            
            .cookie-btn.essential {
                background: #333333;
                color: #ffffff;
                border: 1px solid #666666;
            }
            
            .cookie-btn:hover {
                transform: translateY(-2px);
            }
            
            .cookie-links {
                width: 100%;
                text-align: center;
                margin-top: 16px;
                font-size: 12px;
            }
            
            .cookie-links a {
                color: #FFD700;
                text-decoration: none;
            }
            
            .cookie-links a:hover {
                text-decoration: underline;
            }
            
            .cookie-preferences-modal {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.8);
                z-index: 10001;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 24px;
            }
            
            .preferences-content {
                background: linear-gradient(135deg, #1a1a1a, #2a2a2a);
                border: 2px solid #FFD700;
                border-radius: 12px;
                padding: 32px;
                max-width: 500px;
                width: 100%;
                max-height: 80vh;
                overflow-y: auto;
            }
            
            .preferences-content h3 {
                color: #FFD700;
                margin-bottom: 24px;
                text-align: center;
            }
            
            .cookie-category {
                margin-bottom: 20px;
                padding: 16px;
                background: rgba(255, 215, 0, 0.05);
                border-radius: 8px;
                border: 1px solid rgba(255, 215, 0, 0.2);
            }
            
            .category-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 8px;
            }
            
            .category-title {
                color: #FFD700;
                font-weight: 600;
            }
            
            .cookie-toggle {
                position: relative;
                width: 50px;
                height: 24px;
                background: #333333;
                border-radius: 12px;
                cursor: pointer;
                transition: background 0.3s ease;
            }
            
            .cookie-toggle.active {
                background: #FFD700;
            }
            
            .cookie-toggle::after {
                content: '';
                position: absolute;
                top: 2px;
                left: 2px;
                width: 20px;
                height: 20px;
                background: #ffffff;
                border-radius: 50%;
                transition: transform 0.3s ease;
            }
            
            .cookie-toggle.active::after {
                transform: translateX(26px);
            }
            
            .category-description {
                color: #cccccc;
                font-size: 14px;
                line-height: 1.4;
            }
            
            .preferences-actions {
                display: flex;
                gap: 12px;
                justify-content: center;
                margin-top: 24px;
            }
            
            @media (max-width: 768px) {
                .cookie-content {
                    flex-direction: column;
                    text-align: center;
                }
                
                .cookie-actions {
                    justify-content: center;
                }
                
                .preferences-content {
                    margin: 12px;
                    padding: 24px;
                }
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(banner);
    }

    showPreferences() {
        const preferences = this.getPreferences();
        
        const modal = document.createElement('div');
        modal.className = 'cookie-preferences-modal';
        modal.innerHTML = `
            <div class="preferences-content">
                <h3>Cookie Preferences</h3>
                
                <div class="cookie-category">
                    <div class="category-header">
                        <span class="category-title">Essential Cookies</span>
                        <div class="cookie-toggle active" data-category="essential">
                        </div>
                    </div>
                    <div class="category-description">
                        Required for basic website functionality. Cannot be disabled.
                    </div>
                </div>
                
                <div class="cookie-category">
                    <div class="category-header">
                        <span class="category-title">Analytics Cookies</span>
                        <div class="cookie-toggle ${preferences.analytics ? 'active' : ''}" data-category="analytics">
                        </div>
                    </div>
                    <div class="category-description">
                        Help us understand how visitors interact with our website.
                    </div>
                </div>
                
                <div class="cookie-category">
                    <div class="category-header">
                        <span class="category-title">Marketing Cookies</span>
                        <div class="cookie-toggle ${preferences.marketing ? 'active' : ''}" data-category="marketing">
                        </div>
                    </div>
                    <div class="category-description">
                        Used to deliver relevant advertisements and track campaigns.
                    </div>
                </div>
                
                <div class="cookie-category">
                    <div class="category-header">
                        <span class="category-title">Functional Cookies</span>
                        <div class="cookie-toggle ${preferences.functional ? 'active' : ''}" data-category="functional">
                        </div>
                    </div>
                    <div class="category-description">
                        Enhance your experience with additional features.
                    </div>
                </div>
                
                <div class="preferences-actions">
                    <button onclick="cookieConsent.saveCustomPreferences()" class="cookie-btn accept-all">Save Preferences</button>
                    <button onclick="cookieConsent.closePreferences()" class="cookie-btn essential">Cancel</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add toggle functionality
        modal.querySelectorAll('.cookie-toggle').forEach(toggle => {
            if (toggle.dataset.category !== 'essential') {
                toggle.addEventListener('click', () => {
                    toggle.classList.toggle('active');
                });
            }
        });
        
        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closePreferences();
            }
        });
    }

    saveCustomPreferences() {
        const modal = document.querySelector('.cookie-preferences-modal');
        const toggles = modal.querySelectorAll('.cookie-toggle');
        
        const preferences = {
            essential: true,
            analytics: false,
            marketing: false,
            functional: false
        };
        
        toggles.forEach(toggle => {
            const category = toggle.dataset.category;
            preferences[category] = toggle.classList.contains('active');
        });
        
        this.savePreferences(preferences);
        this.loadConsentedCookies();
        this.closeBanner();
        this.closePreferences();
    }

    acceptAll() {
        const preferences = {
            essential: true,
            analytics: true,
            marketing: true,
            functional: true
        };
        
        this.savePreferences(preferences);
        this.loadConsentedCookies();
        this.closeBanner();
    }

    acceptEssential() {
        const preferences = {
            essential: true,
            analytics: false,
            marketing: false,
            functional: false
        };
        
        this.savePreferences(preferences);
        this.loadConsentedCookies();
        this.closeBanner();
    }

    loadConsentedCookies() {
        const preferences = this.getPreferences();
        
        // Load analytics cookies
        if (preferences.analytics) {
            this.loadGoogleAnalytics();
        }
        
        // Load marketing cookies
        if (preferences.marketing) {
            this.loadMarketingCookies();
        }
        
        // Load functional cookies
        if (preferences.functional) {
            this.loadFunctionalCookies();
        }
    }

    loadGoogleAnalytics() {
        // Google Analytics implementation
        if (typeof gtag === 'undefined') {
            const script = document.createElement('script');
            script.async = true;
            script.src = 'https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID';
            document.head.appendChild(script);
            
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'GA_MEASUREMENT_ID', {
                anonymize_ip: true,
                cookie_flags: 'SameSite=None;Secure'
            });
        }
    }

    loadMarketingCookies() {
        // Marketing cookies implementation
        console.log('Marketing cookies loaded');
    }

    loadFunctionalCookies() {
        // Functional cookies implementation
        console.log('Functional cookies loaded');
    }

    closeBanner() {
        const banner = document.getElementById('cookie-banner');
        if (banner) {
            banner.remove();
        }
    }

    closePreferences() {
        const modal = document.querySelector('.cookie-preferences-modal');
        if (modal) {
            modal.remove();
        }
    }
}

// Global function to show cookie banner (for cookie policy page)
function showCookieBanner() {
    // Remove existing consent
    localStorage.removeItem('cookie-consent');
    localStorage.removeItem('cookie-preferences');
    
    // Show banner again
    if (window.cookieConsent) {
        window.cookieConsent.showBanner();
    }
}

// Initialize cookie consent
document.addEventListener('DOMContentLoaded', () => {
    window.cookieConsent = new CookieConsent();
});