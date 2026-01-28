/**
 * Quiz Logic Module - Core game mechanics
 * Handles scoring, rank calculation, and answer processing
 */
import GameConfig from './config.js';
import GameState from './state.js';

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
 * @returns {Object} Result with isCorrect, points, and explanation
 */
function processAnswer(choice) {
    const question = GameState.getCurrentQuestion();
    if (!question) {
        return { isCorrect: false, points: 0, explanation: 'Error: No question loaded.' };
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
        explanation: question.explanation || ''
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
                typeof q.answer !== 'number' ||
                q.answer < 0 || 
                q.answer >= q.options.length) {
                throw new Error('Invalid question format');
            }
        }

        GameState.quizData = data.questions;
        GameState.isInitialized = true;
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
        mentor: question.mentor
    };
}

export {
    calculatePoints,
    processAnswer,
    getRank,
    hasPassed,
    loadQuizData,
    hasMoreQuestions,
    getQuestionInfo
};
