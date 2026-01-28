/**
 * Configuration Module - Game settings and constants
 * Separated from main logic for easier maintenance and testing
 */
const GameConfig = {
    // Scoring thresholds and points
    scoring: {
        basePoints: 100,
        comboMultiplier: 2,
        comboThreshold: 3
    },

    // Rank thresholds based on demonic power
    ranks: [
        { minPower: 8000, name: "Ultimate-Class Devil", cssClass: "rank-ultimate" },
        { minPower: 4000, name: "High-Class Devil", cssClass: "rank-high" },
        { minPower: 1500, name: "Middle-Class Devil", cssClass: "rank-middle" },
        { minPower: 0, name: "Lower-Class Devil", cssClass: "rank-low" }
    ],

    // Game rules
    rules: {
        passingScore: 70,
        dataPath: '../data/questions.json'
    },

    // DOM element IDs for caching
    elements: {
        startScreen: 'start-screen',
        gameWrapper: 'game-wrapper',
        beginBtn: 'begin-btn',
        progressBar: 'progress-bar',
        progressContainer: 'progress-container',
        questionText: 'question-text',
        optionsContainer: 'options-container',
        feedbackArea: 'feedback-area',
        explanation: 'explanation',
        mentorImg: 'mentor-img',
        scoreDisplay: 'score-display',
        rankDisplay: 'rank-display',
        uiContainer: 'ui-container',
        nextBtn: 'next-btn',
        loadingIndicator: 'loading-indicator',
        errorDisplay: 'error-display',
        errorMessage: 'error-message',
        retryBtn: 'retry-btn'
    },

    // Default images
    defaultMentor: 'rias_neutral.png',
    assetsPath: '../assets/images/',

    // Audio settings
    audio: {
        enabled: true,
        correctSound: '../assets/audio/audio.wav',
        volume: 0.5
    },

    // Storage keys for localStorage
    storage: {
        highScore: 'dxd_academy_high_score',
        bestRank: 'dxd_academy_best_rank'
    }
};

// Freeze config to prevent accidental modifications (security)
// Deep freeze rank objects individually
GameConfig.ranks.forEach(rank => Object.freeze(rank));
Object.freeze(GameConfig);
Object.freeze(GameConfig.scoring);
Object.freeze(GameConfig.ranks);
Object.freeze(GameConfig.rules);
Object.freeze(GameConfig.elements);
Object.freeze(GameConfig.audio);
Object.freeze(GameConfig.storage);

export default GameConfig;
