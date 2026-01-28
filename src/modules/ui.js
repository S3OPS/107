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
        progressContainer: document.getElementById(ids.progressContainer),
        questionText: document.getElementById(ids.questionText),
        optionsContainer: document.getElementById(ids.optionsContainer),
        feedbackArea: document.getElementById(ids.feedbackArea),
        explanation: document.getElementById(ids.explanation),
        mentorImg: document.getElementById(ids.mentorImg),
        scoreDisplay: document.getElementById(ids.scoreDisplay),
        rankDisplay: document.getElementById(ids.rankDisplay),
        uiContainer: document.getElementById(ids.uiContainer),
        nextBtn: document.getElementById(ids.nextBtn),
        loadingIndicator: document.getElementById(ids.loadingIndicator),
        errorDisplay: document.getElementById(ids.errorDisplay),
        errorMessage: document.getElementById(ids.errorMessage),
        retryBtn: document.getElementById(ids.retryBtn)
    };
    
    // Setup keyboard navigation for quiz options
    setupKeyboardNavigation();
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
    const clampedPercent = Math.min(100, Math.max(0, percent));
    if (elementCache.progressBar) {
        elementCache.progressBar.style.width = `${clampedPercent}%`;
    }
    // Update ARIA attributes for accessibility
    if (elementCache.progressContainer) {
        elementCache.progressContainer.setAttribute('aria-valuenow', Math.round(clampedPercent));
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
 * Allows: alphanumeric, dots, hyphens, underscores
 * @param {string} filename - Raw filename
 * @returns {string} Sanitized filename
 */
function sanitizeFilename(filename) {
    // Remove any path traversal attempts and invalid characters
    // Underscores allowed as they're common in filenames
    return filename.replace(/[^a-zA-Z0-9._\-]/g, '').replace(/\.+/g, '.');
}

/**
 * Render answer options as buttons
 * @param {string[]} options - Array of option texts
 * @param {Function} onSelect - Callback when option is selected
 */
function renderOptions(options, onSelect) {
    const container = elementCache.optionsContainer;
    if (!container) return;

    // Store callback for keyboard navigation
    container._onSelect = onSelect;

    // Use DocumentFragment for batch DOM insertion (performance optimization)
    const fragment = document.createDocumentFragment();
    
    options.forEach((opt, i) => {
        const btn = document.createElement('button');
        btn.textContent = opt; // Using textContent prevents XSS
        btn.type = 'button';
        btn.setAttribute('data-option-index', i);
        btn.setAttribute('aria-label', `Option ${i + 1}: ${opt}`);
        btn.addEventListener('click', () => onSelect(i), { once: true });
        fragment.appendChild(btn);
    });

    // Replace content in single operation for better performance
    container.replaceChildren(fragment);
    container.classList.remove('hidden');
    
    // Focus first option for accessibility
    const firstButton = container.querySelector('button');
    if (firstButton) {
        firstButton.focus();
    }
}

/**
 * Show feedback area with explanation
 * @param {boolean} isCorrect - Whether answer was correct
 * @param {string} explanation - Explanation text
 */
function showFeedback(isCorrect, explanation) {
    if (elementCache.explanation) {
        // Create status span programmatically for CSP compliance
        const statusSpan = document.createElement('span');
        statusSpan.className = isCorrect ? 'feedback-correct' : 'feedback-incorrect';
        statusSpan.textContent = isCorrect ? 'CRITICAL HIT!' : 'DAMAGE TAKEN!';
        
        // Clear and rebuild content safely
        elementCache.explanation.textContent = '';
        elementCache.explanation.appendChild(statusSpan);
        elementCache.explanation.appendChild(document.createElement('br'));
        elementCache.explanation.appendChild(document.createElement('br'));
        elementCache.explanation.appendChild(document.createTextNode(explanation));
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
 * @param {Function} onRestart - Callback for restart button
 */
function renderResults(score, rank, passed, onRestart) {
    const container = elementCache.uiContainer;
    if (!container) return;

    const scoreText = score.toFixed(1);
    
    // Create elements programmatically for better security and CSP compliance
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'text-align:center; padding: 20px;';
    
    const heading = document.createElement('h2');
    const message = document.createElement('p');
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = passed ? 'Re-Train at the Academy' : 'Retry the Academy';
    button.addEventListener('click', onRestart || (() => location.reload()));
    
    if (passed) {
        wrapper.style.border = '3px solid green';
        wrapper.style.background = '#003300';
        heading.style.color = 'greenyellow';
        heading.textContent = 'FAA PART 107 CERTIFICATE EARNED!';
        
        message.innerHTML = `Congratulations, Devil! You passed the FAA Rating Game with a score of: <strong>${scoreText}%</strong>`;
        
        const rankHeading = document.createElement('h3');
        rankHeading.className = 'rank-ultimate';
        rankHeading.textContent = rank;
        
        wrapper.appendChild(heading);
        wrapper.appendChild(message);
        wrapper.appendChild(rankHeading);
    } else {
        heading.style.color = 'var(--dxd-red)';
        heading.textContent = 'RATING GAME FAILED!';
        message.textContent = `You scored ${scoreText}%. The minimum passing score is 70%. You must retry the academy!`;
        
        wrapper.appendChild(heading);
        wrapper.appendChild(message);
    }
    
    wrapper.appendChild(button);
    
    // Clear and append in one operation
    container.replaceChildren(wrapper);
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

/**
 * Show loading indicator
 */
function showLoading() {
    elementCache.loadingIndicator?.classList.remove('hidden');
    elementCache.errorDisplay?.classList.add('hidden');
}

/**
 * Hide loading indicator
 */
function hideLoading() {
    elementCache.loadingIndicator?.classList.add('hidden');
}

/**
 * Show error message with retry option
 * @param {string} message - Error message to display
 * @param {Function} onRetry - Callback for retry button
 */
function showError(message, onRetry) {
    hideLoading();
    
    if (elementCache.errorMessage) {
        elementCache.errorMessage.textContent = message;
    }
    
    elementCache.errorDisplay?.classList.remove('hidden');
    
    if (elementCache.retryBtn && onRetry) {
        // Remove any existing listeners and add new one
        const newRetryBtn = elementCache.retryBtn.cloneNode(true);
        elementCache.retryBtn.parentNode.replaceChild(newRetryBtn, elementCache.retryBtn);
        elementCache.retryBtn = newRetryBtn;
        elementCache.retryBtn.addEventListener('click', onRetry);
    }
}

/**
 * Hide error display
 */
function hideError() {
    elementCache.errorDisplay?.classList.add('hidden');
}

/**
 * Set up keyboard navigation for quiz options
 * Allows arrow keys to navigate and Enter/Space to select
 */
function setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
        const container = elementCache.optionsContainer;
        if (!container || container.classList.contains('hidden')) return;
        
        const buttons = Array.from(container.querySelectorAll('button'));
        if (buttons.length === 0) return;
        
        const currentFocused = document.activeElement;
        const currentIndex = buttons.indexOf(currentFocused);
        
        switch (e.key) {
            case 'ArrowDown':
            case 'ArrowRight':
                e.preventDefault();
                if (currentIndex < buttons.length - 1) {
                    buttons[currentIndex + 1].focus();
                } else {
                    buttons[0].focus(); // Wrap to first
                }
                break;
                
            case 'ArrowUp':
            case 'ArrowLeft':
                e.preventDefault();
                if (currentIndex > 0) {
                    buttons[currentIndex - 1].focus();
                } else {
                    buttons[buttons.length - 1].focus(); // Wrap to last
                }
                break;
                
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
                // Number keys for quick selection (1-5)
                const numIndex = parseInt(e.key, 10) - 1;
                if (numIndex < buttons.length) {
                    e.preventDefault();
                    buttons[numIndex].click();
                }
                break;
        }
    });
}

/**
 * Set click handler for retry button
 * @param {Function} handler - Click handler function
 */
function onRetryClick(handler) {
    if (elementCache.retryBtn) {
        elementCache.retryBtn.addEventListener('click', handler);
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
    showLoading,
    hideLoading,
    showError,
    hideError,
    onRetryClick,
    escapeHtml
};
