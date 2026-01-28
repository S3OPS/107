/**
 * UI Module - DOM manipulation and rendering
 * Handles all visual updates with cached element references for performance
 */
import GameConfig from './config.js';

// Element cache for performance optimization
let elementCache = {};

// Audio elements cache
let audioCache = {
    correct: null
};

/**
 * Initialize audio elements
 */
function initAudio() {
    if (GameConfig.audio.enabled) {
        try {
            audioCache.correct = new Audio(GameConfig.audio.correctSound);
            audioCache.correct.volume = GameConfig.audio.volume;
            // Pre-load audio
            audioCache.correct.load();
        } catch (err) {
            console.warn('Could not initialize audio:', err);
        }
    }
}

/**
 * Play sound effect for correct answers
 */
function playSound() {
    if (!GameConfig.audio.enabled) return;
    
    try {
        if (audioCache.correct) {
            // Reset and play
            audioCache.correct.currentTime = 0;
            audioCache.correct.play().catch(() => {
                // Audio play may fail due to user interaction requirements
            });
        }
    } catch (err) {
        // Silently fail - audio is non-critical
    }
}

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
        retryBtn: document.getElementById(ids.retryBtn),
        timerDisplay: document.getElementById(ids.timerDisplay),
        modeNormal: document.getElementById(ids.modeNormal),
        modeTimed: document.getElementById(ids.modeTimed),
        modeDescription: document.getElementById(ids.modeDescription)
    };
    
    // Setup keyboard navigation for quiz options
    setupKeyboardNavigation();
    
    // Initialize audio
    initAudio();
    
    // Setup mode selection handlers
    setupModeSelection();
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
}

/**
 * Highlight the correct and selected answers visually
 * @param {number} selectedIndex - Index of selected option
 * @param {number} correctIndex - Index of correct option
 */
function highlightAnswers(selectedIndex, correctIndex) {
    const container = elementCache.optionsContainer;
    if (!container) return;
    
    const buttons = container.querySelectorAll('button');
    buttons.forEach((btn, i) => {
        btn.disabled = true; // Disable all buttons after answering
        if (i === correctIndex) {
            btn.classList.add('answer-correct');
        }
        if (i === selectedIndex && selectedIndex !== correctIndex) {
            btn.classList.add('answer-incorrect');
        }
    });
}

/**
 * Show feedback area with explanation
 * @param {boolean} isCorrect - Whether answer was correct
 * @param {string} explanation - Explanation text
 * @param {Object} options - Additional options (combo, points, selectedIndex, correctIndex)
 */
function showFeedback(isCorrect, explanation, options = {}) {
    // Play sound effect
    if (isCorrect) {
        playSound(true);
    }
    
    // Highlight answers if indices provided
    if (typeof options.selectedIndex === 'number' && typeof options.correctIndex === 'number') {
        highlightAnswers(options.selectedIndex, options.correctIndex);
    }
    
    if (elementCache.explanation) {
        // Create status span programmatically for CSP compliance
        const statusSpan = document.createElement('span');
        statusSpan.className = isCorrect ? 'feedback-correct' : 'feedback-incorrect';
        
        // Enhanced feedback messages
        let statusText = isCorrect ? 'CRITICAL HIT!' : 'DAMAGE TAKEN!';
        if (isCorrect && options.combo && options.combo >= 3) {
            statusText = `🔥 COMBO x${options.combo}! CRITICAL HIT!`;
        }
        statusSpan.textContent = statusText;
        
        // Show points earned
        const pointsText = isCorrect && options.points 
            ? ` (+${options.points} Demonic Power)` 
            : '';
        
        // Clear and rebuild content safely
        elementCache.explanation.textContent = '';
        elementCache.explanation.appendChild(statusSpan);
        
        if (pointsText) {
            const pointsSpan = document.createElement('span');
            pointsSpan.className = 'points-earned';
            pointsSpan.textContent = pointsText;
            elementCache.explanation.appendChild(pointsSpan);
        }
        
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
 * @param {Object} stats - Additional stats (demonicPower, maxCombo, isNewHighScore, highScore)
 * @param {Function} onRestart - Callback for restart button
 */
function renderResults(score, rank, passed, stats = {}, onRestart) {
    const container = elementCache.uiContainer;
    if (!container) return;

    const scoreText = score.toFixed(1);
    
    // Create elements programmatically for better security and CSP compliance
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'text-align:center; padding: 20px;';
    wrapper.className = 'results-wrapper';
    
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
        
        // Build message safely using textContent
        message.textContent = `Congratulations, Devil! You passed the FAA Rating Game with a score of: ${scoreText}%`;
        
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
    
    // Add stats section
    if (stats.demonicPower !== undefined) {
        const statsDiv = document.createElement('div');
        statsDiv.className = 'final-stats';
        statsDiv.style.cssText = 'margin: 20px 0; padding: 15px; background: rgba(0,0,0,0.3); border-radius: 8px;';
        
        // Show game mode if timed
        if (stats.gameMode === 'timed') {
            const modeStat = document.createElement('p');
            modeStat.textContent = '⏱️ Timed Mode';
            modeStat.style.cssText = 'color: var(--dxd-gold); font-weight: bold; margin-bottom: 10px;';
            statsDiv.appendChild(modeStat);
        }
        
        // Create power stat safely
        const powerStat = document.createElement('p');
        const powerLabel = document.createElement('strong');
        powerLabel.textContent = 'Final Demonic Power: ';
        powerStat.appendChild(powerLabel);
        powerStat.appendChild(document.createTextNode(stats.demonicPower.toString()));
        statsDiv.appendChild(powerStat);
        
        if (stats.maxCombo !== undefined && stats.maxCombo > 0) {
            const comboStat = document.createElement('p');
            const comboLabel = document.createElement('strong');
            comboLabel.textContent = 'Max Combo: ';
            comboStat.appendChild(comboLabel);
            comboStat.appendChild(document.createTextNode(`${stats.maxCombo}x 🔥`));
            statsDiv.appendChild(comboStat);
        }
        
        if (stats.isNewHighScore) {
            const newHighScore = document.createElement('p');
            newHighScore.className = 'new-high-score';
            newHighScore.textContent = '🎉 NEW HIGH SCORE! 🎉';
            statsDiv.appendChild(newHighScore);
        } else if (stats.highScore > 0) {
            const highScoreStat = document.createElement('p');
            const highScoreLabel = document.createElement('strong');
            highScoreLabel.textContent = 'High Score: ';
            highScoreStat.appendChild(highScoreLabel);
            highScoreStat.appendChild(document.createTextNode(stats.highScore.toString()));
            highScoreStat.style.color = '#888';
            statsDiv.appendChild(highScoreStat);
        }
        
        wrapper.appendChild(statsDiv);
    }
    
    // Add category performance section
    if (stats.categoryStats && stats.categoryStats.length > 0) {
        const categorySection = renderCategoryStats(stats.categoryStats);
        wrapper.appendChild(categorySection);
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
        // Remove existing listener before adding new one
        if (elementCache._retryHandler) {
            elementCache.retryBtn.removeEventListener('click', elementCache._retryHandler);
        }
        elementCache._retryHandler = onRetry;
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
 * Allows arrow keys to navigate and number keys to select
 */
function setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
        const container = elementCache.optionsContainer;
        if (!container || container.classList.contains('hidden')) return;
        
        // Don't interfere with text input fields
        const activeElement = document.activeElement;
        const tagName = activeElement?.tagName?.toLowerCase();
        if (tagName === 'input' || tagName === 'textarea') return;
        
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
                // Number keys for quick selection (1-5) - only when focused on options
                if (currentIndex >= 0) {
                    const numIndex = parseInt(e.key, 10) - 1;
                    if (numIndex < buttons.length) {
                        e.preventDefault();
                        buttons[numIndex].click();
                    }
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

// Track currently selected game mode
let selectedMode = 'study';

/**
 * Setup mode selection button handlers
 */
function setupModeSelection() {
    const modeDescriptions = {
        study: 'Take your time to learn - no time pressure',
        timed: '30 seconds per question - bonus points for fast answers!'
    };

    if (elementCache.modeNormal) {
        elementCache.modeNormal.addEventListener('click', () => {
            setSelectedMode('study');
            if (elementCache.modeDescription) {
                elementCache.modeDescription.textContent = modeDescriptions.study;
            }
        });
    }

    if (elementCache.modeTimed) {
        elementCache.modeTimed.addEventListener('click', () => {
            setSelectedMode('timed');
            if (elementCache.modeDescription) {
                elementCache.modeDescription.textContent = modeDescriptions.timed;
            }
        });
    }
}

/**
 * Set the selected game mode
 * @param {string} mode - 'study' or 'timed'
 */
function setSelectedMode(mode) {
    selectedMode = mode;
    
    // Update button states
    if (elementCache.modeNormal) {
        elementCache.modeNormal.classList.toggle('mode-selected', mode === 'study');
        elementCache.modeNormal.setAttribute('aria-pressed', mode === 'study');
    }
    if (elementCache.modeTimed) {
        elementCache.modeTimed.classList.toggle('mode-selected', mode === 'timed');
        elementCache.modeTimed.setAttribute('aria-pressed', mode === 'timed');
    }
}

/**
 * Get the selected game mode
 * @returns {string} Selected mode
 */
function getSelectedMode() {
    return selectedMode;
}

/**
 * Show/hide timer display
 * @param {boolean} show - Whether to show timer
 */
function showTimer(show) {
    if (elementCache.timerDisplay) {
        elementCache.timerDisplay.classList.toggle('hidden', !show);
    }
}

/**
 * Update timer display
 * @param {number} seconds - Seconds remaining
 */
function updateTimer(seconds) {
    if (elementCache.timerDisplay) {
        const isLow = seconds <= 10;
        elementCache.timerDisplay.textContent = `⏱️ ${seconds}s`;
        elementCache.timerDisplay.classList.toggle('timer-low', isLow);
        elementCache.timerDisplay.classList.toggle('timer-critical', seconds <= 5);
    }
}

/**
 * Render category performance in results
 * @param {Array} categoryStats - Array of category performance objects
 * @returns {HTMLElement} Category stats element
 */
function renderCategoryStats(categoryStats) {
    const container = document.createElement('div');
    container.className = 'category-stats';
    container.style.cssText = 'margin: 20px 0; padding: 15px; background: rgba(0,0,0,0.3); border-radius: 8px; text-align: left;';
    
    const heading = document.createElement('h4');
    heading.textContent = '📊 Category Performance';
    heading.style.cssText = 'color: var(--dxd-gold); margin-bottom: 10px; text-align: center;';
    container.appendChild(heading);
    
    if (categoryStats.length === 0) {
        const noData = document.createElement('p');
        noData.textContent = 'No category data available';
        noData.style.color = '#888';
        container.appendChild(noData);
        return container;
    }
    
    // Find weak areas (below 70%)
    const weakAreas = categoryStats.filter(cat => cat.percentage < 70);
    
    categoryStats.forEach(cat => {
        const row = document.createElement('div');
        row.style.cssText = 'display: flex; justify-content: space-between; margin: 5px 0; padding: 5px; border-radius: 4px;';
        
        const isWeak = cat.percentage < 70;
        if (isWeak) {
            row.style.background = 'rgba(139, 0, 0, 0.3)';
        }
        
        const label = document.createElement('span');
        label.textContent = cat.category;
        label.style.color = isWeak ? '#ff6666' : 'white';
        
        const score = document.createElement('span');
        score.textContent = `${cat.correct}/${cat.total} (${cat.percentage}%)`;
        score.style.color = isWeak ? '#ff6666' : '#4ade80';
        score.style.fontWeight = 'bold';
        
        row.appendChild(label);
        row.appendChild(score);
        container.appendChild(row);
    });
    
    // Add weak area summary
    if (weakAreas.length > 0) {
        const weakSummary = document.createElement('p');
        weakSummary.style.cssText = 'margin-top: 15px; padding: 10px; background: rgba(139, 0, 0, 0.2); border-radius: 4px; color: #ff9999; font-size: 0.9em;';
        weakSummary.textContent = `⚠️ Focus on: ${weakAreas.map(w => w.category).join(', ')}`;
        container.appendChild(weakSummary);
    }
    
    return container;
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
    escapeHtml,
    highlightAnswers,
    playSound,
    getSelectedMode,
    showTimer,
    updateTimer,
    renderCategoryStats
};
