/**
 * Cache Manager for El Rayan Website
 * Handles localStorage caching and version management
 */

const CacheManager = {
  // Version identifier - change this when you update the website
  VERSION: '1.0.0',
  CACHE_KEY: 'elrayan_site_cache',
  LAST_VISIT_KEY: 'elrayan_last_visit',
  
  /**
   * Initialize cache manager
   */
  init() {
    const cachedVersion = localStorage.getItem(this.CACHE_KEY);
    const lastVisit = localStorage.getItem(this.LAST_VISIT_KEY);
    
    // Check if this is a first visit or if version changed
    if (!cachedVersion || cachedVersion !== this.VERSION) {
      console.log('Cache initialized or updated to version:', this.VERSION);
      this.clearAndRebuildCache();
    } else {
      console.log('Using cached data from version:', this.VERSION);
      this.loadFromCache();
    }
    
    // Update last visit timestamp
    localStorage.setItem(this.LAST_VISIT_KEY, new Date().toISOString());
    
    // Register service worker for resource caching
    this.registerServiceWorker();
  },
  
  /**
   * Clear old cache and rebuild with current data
   */
  clearAndRebuildCache() {
    // Store the current version
    localStorage.setItem(this.CACHE_KEY, this.VERSION);
    
    // Cache site data
    const siteData = this.getSiteData();
    localStorage.setItem('elrayan_site_data', JSON.stringify(siteData));
    
    // Pre-cache critical resources
    this.preloadCriticalResources();
    
    console.log('Cache rebuilt successfully');
  },
  
  /**
   * Load data from cache
   */
  loadFromCache() {
    const cachedData = localStorage.getItem('elrayan_site_data');
    if (cachedData) {
      try {
        const data = JSON.parse(cachedData);
        console.log('Loaded cached site data:', data);
        return data;
      } catch (e) {
        console.error('Error parsing cached data:', e);
        this.clearAndRebuildCache();
      }
    }
  },
  
  /**
   * Get current site data to cache
   */
  getSiteData() {
    return {
      version: this.VERSION,
      timestamp: new Date().toISOString(),
      contacts: {
        telegram: [
          { name: 'الاسدالات وملابس المحجبات', url: 'https://t.me/nagahs333' },
          { name: 'اللانجيري', url: 'https://t.me/abdo44321' },
          { name: 'البيتي', url: 'https://t.me/abdo32132' }
        ],
        whatsapp: { name: 'رقم الحجز', url: 'https://wa.me/+201055009975' },
        phones: [
          { name: 'هاتف', number: '01070222258' },
          { name: 'هاتف 2', number: '01008145662' }
        ],
        location: 'https://maps.app.goo.gl/UVyAR4K6z4RyXXiy9?g_st=awb'
      },
      branding: {
        name: 'باب الريان',
        subtitle: 'احدي مصانع مس دودو و مس تاج'
      }
    };
  },
  
  /**
   * Preload critical resources for faster load
   */
  preloadCriticalResources() {
    const criticalResources = [
      './assets/images/logo.png',
      './assets/images/background.jpg',
      './assets/css/styles.css'
    ];
    
    criticalResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = resource;
      document.head.appendChild(link);
    });
  },
  
  /**
   * Register Service Worker for offline caching
   */
  registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js')
        .then(registration => {
          console.log('Service Worker registered:', registration.scope);
        })
        .catch(error => {
          console.log('Service Worker registration failed:', error);
        });
    }
  },
  
  /**
   * Force update the cache (call this when you make changes)
   */
  forceUpdate() {
    localStorage.removeItem(this.CACHE_KEY);
    localStorage.removeItem('elrayan_site_data');
    this.init();
  },
  
  /**
   * Get cache statistics
   */
  getStats() {
    const lastVisit = localStorage.getItem(this.LAST_VISIT_KEY);
    const version = localStorage.getItem(this.CACHE_KEY);
    
    return {
      version: version,
      lastVisit: lastVisit,
      isFirstVisit: !lastVisit,
      cacheSize: this.getCacheSize()
    };
  },
  
  /**
   * Calculate approximate cache size in bytes
   */
  getCacheSize() {
    let total = 0;
    for (let key in localStorage) {
      if (key.startsWith('elrayan_')) {
        total += localStorage[key].length * 2; // UTF-16 = 2 bytes per char
      }
    }
    return total;
  }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  CacheManager.init();
});

// Export for global access
window.CacheManager = CacheManager;
