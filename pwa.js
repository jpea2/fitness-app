// Check if running as standalone PWA
if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
    document.addEventListener('DOMContentLoaded', () => {
        try {
            if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen();
            } else if (document.documentElement.webkitRequestFullscreen) {
                document.documentElement.webkitRequestFullscreen();
            } else if (document.documentElement.msRequestFullscreen) {
                document.documentElement.msRequestFullscreen();
            }
        } catch (e) {
            console.log('Fullscreen request failed:', e);
        }
    });
}

// Handle PWA updates
if ('serviceWorker' in navigator) {
    let refreshing = false;

    // Handle service worker updates
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
            refreshing = true;
            window.location.reload();
        }
    });

    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(registration => {
                console.log('ServiceWorker registration successful');

                // Check for updates on page load
                registration.update();

                // Periodically check for updates (every 60 minutes)
                setInterval(() => {
                    registration.update();
                }, 1000 * 60 * 60);

                // Handle updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // New version available
                            showUpdateNotification();
                        }
                    });
                });
            })
            .catch(err => {
                console.log('ServiceWorker registration failed:', err);
            });
    });
}

// Show update notification
function showUpdateNotification() {
    // Check if we already have a notification
    if (document.getElementById('update-toast')) return;

    const toast = document.createElement('div');
    toast.id = 'update-toast';
    toast.className = 'update-toast';
    toast.innerHTML = `
        <div class="update-toast-content">
            <span>A new version is available!</span>
            <button onclick="window.location.reload()">Update Now</button>
        </div>
    `;
    document.body.appendChild(toast);

    // Add styles if they don't exist
    if (!document.getElementById('update-toast-styles')) {
        const style = document.createElement('style');
        style.id = 'update-toast-styles';
        style.textContent = `
            .update-toast {
                position: fixed;
                bottom: 80px;
                left: 50%;
                transform: translateX(-50%);
                background: var(--card-background);
                border-radius: var(--border-radius-md);
                padding: var(--spacing-md);
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                z-index: 1000;
                animation: slideUp 0.3s ease;
            }
            .update-toast-content {
                display: flex;
                align-items: center;
                gap: var(--spacing-md);
            }
            .update-toast button {
                background: var(--primary-color);
                color: white;
                border: none;
                padding: var(--spacing-sm) var(--spacing-md);
                border-radius: var(--border-radius-sm);
                cursor: pointer;
            }
            @keyframes slideUp {
                from { transform: translate(-50%, 100%); }
                to { transform: translate(-50%, 0); }
            }
        `;
        document.head.appendChild(style);
    }
}

// Function to unregister service worker and clear PWA state
async function unregisterPWA() {
    if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
            await registration.unregister();
        }
        // Clear caches
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
        console.log('PWA unregistered and caches cleared');
        // Reload the page
        window.location.reload(true);
    }
}
