/**
 * State Management Module - Centralized game state
 * Encapsulates state to prevent global pollution and enable easier testing
 */
const GameState = {
    quizData: [],
    currentIdx: 0,
    demonicPower: 0,
    combo: 0,
    maxCombo: 0,
    scoreCorrect: 0,
    isInitialized: false,
    highScore: 0,
    bestRank: null,

    /**
     * Reset all state values to initial defaults
     */
    reset() {
        this.quizData = [];
        this.currentIdx = 0;
        this.demonicPower = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.scoreCorrect = 0;
        this.isInitialized = false;
    },

    /**
     * Advance to the next question
     * @returns {boolean} Whether there are more questions
     */
    nextQuestion() {
        this.currentIdx++;
        return this.currentIdx < this.quizData.length;
    },

    /**
     * Get current question data
     * @returns {Object|null} Current question object or null if out of bounds
     */
    getCurrentQuestion() {
        if (this.currentIdx >= 0 && this.currentIdx < this.quizData.length) {
            return this.quizData[this.currentIdx];
        }
        return null;
    },

    /**
     * Record a correct answer
     * @param {number} points - Points to add
     */
    recordCorrect(points) {
        this.scoreCorrect++;
        this.combo++;
        if (this.combo > this.maxCombo) {
            this.maxCombo = this.combo;
        }
        this.demonicPower += points;
    },

    /**
     * Record an incorrect answer
     */
    recordIncorrect() {
        this.combo = 0;
    },

    /**
     * Check if combo bonus is active
     * @param {number} threshold - Combo threshold for bonus
     * @returns {boolean}
     */
    isComboActive(threshold) {
        return this.combo >= threshold;
    },

    /**
     * Calculate final score percentage
     * @returns {number}
     */
    getFinalScore() {
        if (this.quizData.length === 0) return 0;
        return (this.scoreCorrect / this.quizData.length) * 100;
    },

    /**
     * Get progress percentage
     * @returns {number}
     */
    getProgress() {
        if (this.quizData.length === 0) return 0;
        return (this.currentIdx / this.quizData.length) * 100;
    }
};

export default GameState;
