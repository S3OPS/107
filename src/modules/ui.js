/**
 * UI Module - DOM manipulation and rendering
 * Handles all visual updates with cached element references for performance
 */
import GameConfig from './config.js';

// Element cache for performance optimization
let elementCache = {};

/**
 * Initialize UI by caching DOM element references
 * Called once at startup to avoid repeated DOM queries
 */
function initUI() {
    const ids = GameConfig.elements;
    elementCache = {
        startScreen: document.getElementById(ids.startScreen),
        gameWrapper: document.getElementById(ids.gameWrapper),
        beginBtn: document.getElementById(ids.beginBtn),
        progressBar: document.getElementById(ids.progressBar),
        questionText: document.getElementById(ids.questionText),
        optionsContainer: document.getElementById(ids.optionsContainer),
        feedbackArea: document.getElementById(ids.feedbackArea),
        explanation: document.getElementById(ids.explanation),
        mentorImg: document.getElementById(ids.mentorImg),
        scoreDisplay: document.getElementById(ids.scoreDisplay),
        rankDisplay: document.getElementById(ids.rankDisplay),
        uiContainer: document.getElementById(ids.uiContainer),
        nextBtn: document.getElementById(ids.nextBtn)
    };
}

/**
 * Get cached element reference
 * @param {string} name - Element name from config
 * @returns {HTMLElement|null}
 */
function getElement(name) {
    return elementCache[name] || null;
}

/**
 * Show the game screen, hide start screen
 */
function showGameScreen() {
    elementCache.startScreen?.classList.add('hidden');
    elementCache.gameWrapper?.classList.remove('hidden');
}

/**
 * Update progress bar width
 * @param {number} percent - Progress percentage (0-100)
 */
function updateProgressBar(percent) {
    if (elementCache.progressBar) {
        elementCache.progressBar.style.width = `${Math.min(100, Math.max(0, percent))}%`;
    }
}

/**
 * Update question text display
 * @param {number} current - Current question number (1-indexed)
 * @param {number} total - Total questions
 * @param {string} question - Question text
 */
function updateQuestion(current, total, question) {
    if (elementCache.questionText) {
        // Sanitize question text to prevent XSS
        elementCache.questionText.textContent = `[${current}/${total}] ${question}`;
    }
}

/**
 * Update mentor image
 * @param {string} imageName - Image filename
 */
function updateMentor(imageName) {
    if (elementCache.mentorImg) {
        const safeName = sanitizeFilename(imageName || GameConfig.defaultMentor);
        elementCache.mentorImg.src = `${GameConfig.assetsPath}${safeName}`;
    }
}

/**
 * Sanitize filename to prevent path traversal attacks
 * @param {string} filename - Raw filename
 * @returns {string} Sanitized filename
 */
function sanitizeFilename(filename) {
    // Remove any path traversal attempts and invalid characters
    return filename.replace(/[^a-zA-Z0-9._-]/g, '').replace(/\.+/g, '.');
}

/**
 * Render answer options as buttons
 * @param {string[]} options - Array of option texts
 * @param {Function} onSelect - Callback when option is selected
 */
function renderOptions(options, onSelect) {
    const container = elementCache.optionsContainer;
    if (!container) return;

    // Use DocumentFragment for batch DOM insertion (performance optimization)
    const fragment = document.createDocumentFragment();
    
    options.forEach((opt, i) => {
        const btn = document.createElement('button');
        btn.textContent = opt; // Using textContent prevents XSS
        btn.type = 'button';
        btn.addEventListener('click', () => onSelect(i), { once: true });
        fragment.appendChild(btn);
    });

    container.innerHTML = '';
    container.appendChild(fragment);
    container.classList.remove('hidden');
}

/**
 * Show feedback area with explanation
 * @param {boolean} isCorrect - Whether answer was correct
 * @param {string} explanation - Explanation text
 */
function showFeedback(isCorrect, explanation) {
    if (elementCache.explanation) {
        const status = isCorrect 
            ? '<span style="color:var(--dxd-gold); font-weight:bold;">CRITICAL HIT!</span>'
            : '<span style="color:red; font-weight:bold;">DAMAGE TAKEN!</span>';
        // Note: explanation comes from trusted JSON data source
        elementCache.explanation.innerHTML = `${status}<br><br>${escapeHtml(explanation)}`;
    }
    
    elementCache.feedbackArea?.classList.remove('hidden');
    elementCache.optionsContainer?.classList.add('hidden');
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Raw text
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Hide feedback area
 */
function hideFeedback() {
    elementCache.feedbackArea?.classList.add('hidden');
}

/**
 * Update score display
 * @param {number} power - Current demonic power
 */
function updateScore(power) {
    if (elementCache.scoreDisplay) {
        elementCache.scoreDisplay.textContent = `Demonic Power: ${power}`;
    }
}

/**
 * Update rank display
 * @param {string} rank - Rank name
 * @param {string} cssClass - CSS class for styling
 */
function updateRank(rank, cssClass) {
    if (elementCache.rankDisplay) {
        elementCache.rankDisplay.textContent = `Rank: ${rank}`;
        elementCache.rankDisplay.className = cssClass;
    }
}

/**
 * Apply or remove combo boost visual effect
 * @param {boolean} active - Whether boost is active
 */
function setBoostEffect(active) {
    if (elementCache.gameWrapper) {
        if (active) {
            elementCache.gameWrapper.classList.add('boost-active');
        } else {
            elementCache.gameWrapper.classList.remove('boost-active');
        }
    }
}

/**
 * Render final results screen
 * @param {number} score - Final score percentage
 * @param {string} rank - Final rank text
 * @param {boolean} passed - Whether passed the exam
 */
function renderResults(score, rank, passed) {
    const container = elementCache.uiContainer;
    if (!container) return;

    const scoreText = score.toFixed(1);
    
    if (passed) {
        container.innerHTML = `
            <div style="text-align:center; padding: 20px; border: 3px solid green; background: #003300;">
                <h2 style="color: greenyellow;">FAA PART 107 CERTIFICATE EARNED!</h2>
                <p>Congratulations, Devil! You passed the FAA Rating Game with a score of: <strong>${scoreText}%</strong></p>
                <h3 class="rank-ultimate">${escapeHtml(rank)}</h3>
                <button type="button" onclick="location.reload()">Re-Train at the Academy</button>
            </div>
        `;
    } else {
        container.innerHTML = `
            <div style="text-align:center; padding: 20px;">
                <h2 style="color: var(--dxd-red);">RATING GAME FAILED!</h2>
                <p>You scored ${scoreText}%. The minimum passing score is 70%. You must retry the academy!</p>
                <button type="button" onclick="location.reload()">Retry the Academy</button>
            </div>
        `;
    }
}

/**
 * Set click handler for begin button
 * @param {Function} handler - Click handler function
 */
function onBeginClick(handler) {
    if (elementCache.beginBtn) {
        elementCache.beginBtn.addEventListener('click', handler, { once: true });
    }
}

/**
 * Set click handler for next button
 * @param {Function} handler - Click handler function
 */
function onNextClick(handler) {
    if (elementCache.nextBtn) {
        elementCache.nextBtn.addEventListener('click', handler);
    }
}

export {
    initUI,
    getElement,
    showGameScreen,
    updateProgressBar,
    updateQuestion,
    updateMentor,
    renderOptions,
    showFeedback,
    hideFeedback,
    updateScore,
    updateRank,
    setBoostEffect,
    renderResults,
    onBeginClick,
    onNextClick,
    escapeHtml
};
