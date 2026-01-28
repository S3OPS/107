/**
 * Quiz Logic Module - Core game mechanics
 * Handles scoring, rank calculation, and answer processing
 */
import GameConfig from './config.js';
import GameState from './state.js';

/**
 * Fisher-Yates shuffle algorithm for randomizing questions
 * @param {Array} array - Array to shuffle
 * @returns {Array} Shuffled array
 */
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Calculate points for a correct answer
 * @returns {number} Points earned
 */
function calculatePoints() {
    const { basePoints, comboMultiplier, comboThreshold } = GameConfig.scoring;
    return GameState.isComboActive(comboThreshold) 
        ? basePoints * comboMultiplier 
        : basePoints;
}

/**
 * Process an answer selection
 * @param {number} choice - Index of selected option
 * @returns {Object} Result object containing:
 *   - isCorrect {boolean} Whether the answer was correct
 *   - points {number} Points earned for this answer
 *   - explanation {string} Explanation text for the answer
 *   - correctAnswer {number} Index of the correct answer
 *   - category {string} Question category
 *   - combo {number} Current combo streak count
 */
function processAnswer(choice) {
    const question = GameState.getCurrentQuestion();
    if (!question) {
        return { isCorrect: false, points: 0, explanation: 'Error: No question loaded.', correctAnswer: -1, category: '', combo: 0 };
    }

    const isCorrect = choice === question.answer;
    let points = 0;

    if (isCorrect) {
        points = calculatePoints();
        GameState.recordCorrect(points);
    } else {
        GameState.recordIncorrect();
    }

    return {
        isCorrect,
        points,
        explanation: question.explanation || '',
        correctAnswer: question.answer,
        category: question.category || '',
        combo: GameState.combo
    };
}

/**
 * Determine rank based on demonic power
 * @param {number} power - Current demonic power
 * @returns {Object} Rank object with name and cssClass
 */
function getRank(power) {
    for (const rank of GameConfig.ranks) {
        if (power >= rank.minPower) {
            return { name: rank.name, cssClass: rank.cssClass };
        }
    }
    // Default fallback (should never reach due to 0 threshold)
    return { name: "Lower-Class Devil", cssClass: "rank-low" };
}

/**
 * Check if final score passes the exam
 * @returns {boolean}
 */
function hasPassed() {
    return GameState.getFinalScore() >= GameConfig.rules.passingScore;
}

/**
 * Load quiz data from JSON file
 * @returns {Promise<boolean>} Success status
 */
async function loadQuizData() {
    try {
        const response = await fetch(GameConfig.rules.dataPath);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Validate data structure
        if (!data || !Array.isArray(data.questions) || data.questions.length === 0) {
            throw new Error('Invalid quiz data format');
        }

        // Validate each question has required fields
        for (const q of data.questions) {
            if (typeof q.question !== 'string' || 
                !Array.isArray(q.options) || 
                q.options.length < 2 ||
                typeof q.answer !== 'number' ||
                q.answer < 0 || 
                q.answer >= q.options.length) {
                throw new Error('Invalid question format');
            }
            
            // Validate each option is a string
            for (const opt of q.options) {
                if (typeof opt !== 'string') {
                    throw new Error('Invalid option format: options must be strings');
                }
            }
            
            // Validate optional fields if present
            if (q.explanation !== undefined && typeof q.explanation !== 'string') {
                throw new Error('Invalid explanation format: must be a string');
            }
            if (q.mentor !== undefined && typeof q.mentor !== 'string') {
                throw new Error('Invalid mentor format: must be a string');
            }
        }

        // Shuffle questions for replay variety
        GameState.quizData = shuffleArray(data.questions);
        GameState.isInitialized = true;
        
        // Load high score from localStorage
        loadHighScore();
        
        return true;
    } catch (err) {
        console.error("Failed to load quiz data:", err);
        return false;
    }
}

/**
 * Check if there are more questions
 * @returns {boolean}
 */
function hasMoreQuestions() {
    return GameState.currentIdx < GameState.quizData.length;
}

/**
 * Get current question info for display
 * @returns {Object|null} Question info object
 */
function getQuestionInfo() {
    const question = GameState.getCurrentQuestion();
    if (!question) return null;

    return {
        current: GameState.currentIdx + 1,
        total: GameState.quizData.length,
        text: question.question,
        options: question.options,
        mentor: question.mentor,
        category: question.category || 'General',
        combo: GameState.combo
    };
}

/**
 * Load high score from localStorage
 */
function loadHighScore() {
    try {
        const savedScore = localStorage.getItem(GameConfig.storage.highScore);
        const savedRank = localStorage.getItem(GameConfig.storage.bestRank);
        if (savedScore) {
            GameState.highScore = parseInt(savedScore, 10) || 0;
        }
        if (savedRank) {
            GameState.bestRank = savedRank;
        }
    } catch (err) {
        // localStorage may be unavailable (private browsing, etc.)
        console.warn('Could not load high score:', err);
    }
}

/**
 * Save high score to localStorage
 * @returns {boolean} Whether a new high score was set
 */
function saveHighScore() {
    const currentPower = GameState.demonicPower;
    const isNewHighScore = currentPower > GameState.highScore;
    
    if (isNewHighScore) {
        try {
            localStorage.setItem(GameConfig.storage.highScore, currentPower.toString());
            const rank = getRank(currentPower);
            localStorage.setItem(GameConfig.storage.bestRank, rank.name);
            GameState.highScore = currentPower;
            GameState.bestRank = rank.name;
        } catch (err) {
            console.warn('Could not save high score:', err);
        }
    }
    
    return isNewHighScore;
}

/**
 * Get high score info
 * @returns {Object} High score data
 */
function getHighScoreInfo() {
    return {
        highScore: GameState.highScore,
        bestRank: GameState.bestRank
    };
}

export {
    calculatePoints,
    processAnswer,
    getRank,
    hasPassed,
    loadQuizData,
    hasMoreQuestions,
    getQuestionInfo,
    saveHighScore,
    getHighScoreInfo
};
