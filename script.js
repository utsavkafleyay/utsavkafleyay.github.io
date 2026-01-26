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

    // Initialize new Pendo instance
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
    })(window, document, 'script', 'pendo');

    // Initialize with visitor and account
    pendo.initialize({
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
}

// Fetch Pendo API key from serverless function and initialize
async function loadPendo() {
    try {
        const response = await fetch('/.netlify/functions/pendo-config');
        if (!response.ok) {
            console.warn('Could not load Pendo config');
            return;
        }
        const { apiKey } = await response.json();
        initializePendo(apiKey, pendoVisitorConfig);
    } catch (error) {
        console.warn('Pendo initialization skipped:', error.message);
    }
}

loadPendo();
