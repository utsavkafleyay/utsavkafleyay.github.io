// ===== Paper Tear Interaction =====
document.addEventListener('DOMContentLoaded', () => {
    const paperLayer = document.querySelector('.paper-layer');
    const tearZone = document.querySelector('.tear-zone');
    const revealedLayer = document.querySelector('.revealed-layer');
    const resetBtn = document.querySelector('.reset-btn');

    let isDragging = false;
    let startY = 0;
    let currentY = 0;
    let tearProgress = 0;
    const tearThreshold = 150; // pixels needed to complete tear
    const tearCompleteThreshold = 0.6; // 60% progress triggers full tear

    // Get the starting Y position from mouse or touch event
    function getEventY(e) {
        return e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
    }

    // Start the tear
    function startTear(e) {
        isDragging = true;
        startY = getEventY(e);
        paperLayer.classList.add('tearing');
        e.preventDefault();
    }

    // Update tear progress while dragging
    function updateTear(e) {
        if (!isDragging) return;

        currentY = getEventY(e);
        const deltaY = Math.max(0, currentY - startY); // Only allow downward movement
        tearProgress = Math.min(1, deltaY / tearThreshold);

        // Apply transform to paper layer
        const translateY = deltaY * 0.8;
        const rotate = deltaY * 0.01;
        paperLayer.style.transform = `translateY(${translateY}px) rotate(${rotate}deg)`;

        // Update revealed layer visibility
        if (tearProgress > 0.1) {
            revealedLayer.classList.add('visible');
        }

        e.preventDefault();
    }

    // Complete or reset the tear
    function endTear() {
        if (!isDragging) return;
        isDragging = false;
        paperLayer.classList.remove('tearing');

        if (tearProgress >= tearCompleteThreshold) {
            // Complete the tear - slide paper away
            completeTear();
        } else {
            // Reset - snap back
            resetTear();
        }
    }

    // Animate paper completely away
    function completeTear() {
        paperLayer.classList.add('torn');
        paperLayer.style.transform = 'translateY(100vh) rotate(5deg)';
        revealedLayer.classList.add('visible');

        // Show reset button after animation
        setTimeout(() => {
            resetBtn.classList.add('visible');
        }, 600);
    }

    // Reset paper to original position
    function resetTear() {
        paperLayer.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        paperLayer.style.transform = 'translateY(0) rotate(0deg)';
        revealedLayer.classList.remove('visible');

        // Remove transition after animation
        setTimeout(() => {
            paperLayer.style.transition = '';
        }, 400);

        tearProgress = 0;
    }

    // Reset button click handler
    function handleReset() {
        paperLayer.classList.remove('torn');
        resetBtn.classList.remove('visible');
        resetTear();
    }

    // Event Listeners - Mouse
    tearZone.addEventListener('mousedown', startTear);
    document.addEventListener('mousemove', updateTear);
    document.addEventListener('mouseup', endTear);

    // Event Listeners - Touch
    tearZone.addEventListener('touchstart', startTear, { passive: false });
    document.addEventListener('touchmove', updateTear, { passive: false });
    document.addEventListener('touchend', endTear);

    // Reset button
    resetBtn.addEventListener('click', handleReset);

    // Keyboard accessibility - Enter or Space on tear zone
    tearZone.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            completeTear();
        }
    });

    // Make tear zone focusable
    tearZone.setAttribute('tabindex', '0');
    tearZone.setAttribute('role', 'button');
});

// ===== Quote of the Day =====
const quotes = [
    // Greek & Stoic
    { text: "No man ever steps in the same river twice, for it is not the same river and he is not the same man.", author: "Heraclitus" },
    { text: "The soul becomes dyed with the color of its thoughts.", author: "Marcus Aurelius" },
    { text: "What stands in the way becomes the way.", author: "Marcus Aurelius" },
    { text: "It is not things that disturb us, but our judgments about things.", author: "Epictetus" },

    // Eastern
    { text: "The Tao that can be told is not the eternal Tao.", author: "Lao Tzu" },
    { text: "The finger pointing at the moon is not the moon.", author: "Zen Proverb" },
    { text: "Sitting quietly, doing nothing, spring comes, and the grass grows by itself.", author: "Bashō" },
    { text: "In the beginner's mind there are many possibilities; in the expert's mind there are few.", author: "Shunryu Suzuki" },
    { text: "Form is emptiness, emptiness is form.", author: "Heart Sutra" },
    { text: "Not knowing is most intimate.", author: "Dizang" },

    // Existential
    { text: "He who has a why to live can bear almost any how.", author: "Nietzsche" },
    { text: "We do not see things as they are, we see them as we are.", author: "Anaïs Nin" },
    { text: "The limits of my language mean the limits of my world.", author: "Wittgenstein" },

    // Mystic
    { text: "I have lived on the lip of insanity, wanting to know reasons, knocking on a door. It opens. I've been knocking from the inside.", author: "Rumi" },
    { text: "Sell your cleverness and buy bewilderment.", author: "Rumi" },

    // Vedantic
    { text: "You are what your deep, driving desire is.", author: "Brihadaranyaka Upanishad" },
    { text: "The real does not die, the unreal never lived.", author: "Nisargadatta Maharaj" },
    { text: "That which you are seeking is causing you to seek.", author: "Cheri Huber" }
];

// Quote cycling
let currentQuoteIndex = Math.floor(Math.random() * quotes.length);

function displayQuote(index) {
    const quoteText = document.querySelector('.quote-text');
    const quoteAuthor = document.querySelector('.quote-author');

    if (quoteText && quoteAuthor) {
        quoteText.style.opacity = '0';
        quoteAuthor.style.opacity = '0';

        setTimeout(() => {
            quoteText.textContent = `"${quotes[index].text}"`;
            quoteAuthor.textContent = `— ${quotes[index].author}`;
            quoteText.style.opacity = '0.95';
            quoteAuthor.style.opacity = '1';
        }, 200);
    }
}

function nextQuote() {
    currentQuoteIndex = (currentQuoteIndex + 1) % quotes.length;
    displayQuote(currentQuoteIndex);
}

// Set initial quote and bind cycle button
document.addEventListener('DOMContentLoaded', () => {
    displayQuote(currentQuoteIndex);

    const cycleBtn = document.querySelector('.quote-cycle');
    if (cycleBtn) {
        cycleBtn.addEventListener('click', nextQuote);
    }
});

// ===== Pendo Configuration =====
let pendoConfig = {
    apiKey: 'ba1443fd-2b89-4180-7ac9-9415d1893b4d',
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

function initializePendo(config) {
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
        y.src = 'https://cdn.pendo-atlas.pendo-dev.com/agent/static/' + config.apiKey + '/pendo.js';
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

// Initialize Pendo with default config
initializePendo(pendoConfig);
