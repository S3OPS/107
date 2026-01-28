/**
 * DxD Academy: FAA Part 107 Rating Game
 * 
 * Main entry point - orchestrates game flow using modular components.
 * Modular architecture enables separation of concerns:
 *   - config.js: Mission parameters and constants
 *   - state.js: Game state tracking
 *   - quiz.js: Quiz mechanics and scoring
 *   - ui.js: Rendering and DOM operations
 * 
 * @version 2.1.0 - Added accessibility and error handling improvements
 */

import GameConfig from './modules/config.js';
import GameState from './modules/state.js';
import * as UI from './modules/ui.js';
import * as Quiz from './modules/quiz.js';

/**
 * Initialize the game application
 * Uses the Great Eagles approach - fast async initialization
 */
async function initGame() {
    try {
        // Initialize UI element cache (performance optimization)
        UI.initUI();
        
        // Show loading indicator while fetching data
        UI.showLoading();
        
        // Load quiz data with validation
        const success = await Quiz.loadQuizData();
        
        // Hide loading indicator
        UI.hideLoading();
        
        if (!success) {
            UI.showError(
                "Failed to load quiz data. Please check your connection and try again.",
                () => {
                    UI.hideError();
                    initGame(); // Retry initialization
                }
            );
            return;
        }
        
        // Set up event handlers
        UI.onBeginClick(startGame);
        UI.onNextClick(advanceQuestion);
        
    } catch (err) {
        console.error("Critical Failure:", err);
        UI.hideLoading();
        UI.showError(
            "An unexpected error occurred. Please refresh the page.",
            () => location.reload()
        );
    }
}

/**
 * Start the game when user clicks begin
 */
function startGame() {
    UI.showGameScreen();
    renderQuestion();
}

/**
 * Render the current question
 */
function renderQuestion() {
    if (!Quiz.hasMoreQuestions()) {
        showFinalResults();
        return;
    }

    const info = Quiz.getQuestionInfo();
    if (!info) return;

    // Update progress bar
    UI.updateProgressBar(GameState.getProgress());
    
    // Update question text
    UI.updateQuestion(info.current, info.total, info.text);
    
    // Update mentor image
    UI.updateMentor(info.mentor);
    
    // Apply combo effect
    UI.setBoostEffect(GameState.isComboActive(GameConfig.scoring.comboThreshold));
    
    // Render options with click handler
    UI.renderOptions(info.options, handleAnswer);
    
    // Hide feedback from previous question
    UI.hideFeedback();
}

/**
 * Handle answer selection
 * @param {number} choice - Index of selected option
 */
function handleAnswer(choice) {
    const result = Quiz.processAnswer(choice);
    
    // Update UI with result
    UI.showFeedback(result.isCorrect, result.explanation);
    UI.updateScore(GameState.demonicPower);
    
    // Update rank display
    const rank = Quiz.getRank(GameState.demonicPower);
    UI.updateRank(rank.name, rank.cssClass);
}

/**
 * Advance to the next question
 */
function advanceQuestion() {
    GameState.nextQuestion();
    renderQuestion();
}

/**
 * Show final results screen
 */
function showFinalResults() {
    const finalScore = GameState.getFinalScore();
    const rank = Quiz.getRank(GameState.demonicPower);
    const passed = Quiz.hasPassed();
    
    UI.renderResults(finalScore, `Rank: ${rank.name}`, passed);
}

// Initialize game when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
} else {
    initGame();
}
