// ===== Pendo Configuration =====
// Fetches API key from serverless function to keep it out of source code

const pendoVisitorConfig = {
    visitor: {
        id: 'test_visitor',
        email: 'someone@example.com',
        full_name: 'Some One'
    },
    account: {
        id: 'test-account',
        name: 'Test Account'
    }
};

function initializePendo(apiKey, config) {
    // Remove existing Pendo script if it exists
    const existingScript = document.querySelector('script[src*="pendo.js"]');
    if (existingScript) {
        existingScript.remove();
    }

    // Initialize Pendo stub that queues calls until script loads
    (function (p, e, n, d, o) {
        var v, w, x, y, z;
        o = p[d] = p[d] || {};
        o._q = o._q || [];
        v = ['initialize', 'identify', 'updateOptions', 'pageLoad', 'track'];
        for (w = 0, x = v.length; w < x; ++w)
            (function (m) {
                o[m] =
                    o[m] ||
                    function () {
                        o._q[m === v[0] ? 'unshift' : 'push']([m].concat([].slice.call(arguments, 0)));
                    };
            })(v[w]);
        y = e.createElement(n);
        y.async = !0;
        y.src = 'https://cdn.pendo-atlas.pendo-dev.com/agent/static/' + apiKey + '/pendo.js';
        z = e.getElementsByTagName(n)[0];
        z.parentNode.insertBefore(y, z);
        
        // Initialize after stub is set up (calls are queued until script loads)
        o.initialize({
            visitor: {
                id: config.visitor.id,
                email: config.visitor.email,
                full_name: config.visitor.full_name
            },
            account: {
                id: config.account.id,
                name: config.account.name
            }
        });
    })(window, document, 'script', 'pendo');
}

// Fetch Pendo API key from serverless function and initialize
async function loadPendo() {
    try {
        const response = await fetch('/.netlify/functions/pendo-config');
        if (!response.ok) {
            console.warn('Could not load Pendo config - functions may not be deployed yet');
            return;
        }
        const data = await response.json();
        if (data.apiKey) {
            initializePendo(data.apiKey, pendoVisitorConfig);
        }
    } catch (error) {
        // Silently fail - Pendo is optional
        console.warn('Pendo initialization skipped');
    }
}

// Only load Pendo in production (when functions are available)
if (window.location.hostname !== 'localhost') {
    loadPendo();
}
