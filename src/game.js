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
 * @version 2.3.0 - Added PWA support, timed mode, category performance tracking
 */

import GameConfig from './modules/config.js';
import GameState from './modules/state.js';
import * as UI from './modules/ui.js';
import * as Quiz from './modules/quiz.js';

// Maximum number of retry attempts for loading data
const MAX_RETRY_ATTEMPTS = 3;
let retryAttempts = 0;

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
        
        // Load quiz data with validation (questions are shuffled)
        const success = await Quiz.loadQuizData();
        
        // Hide loading indicator
        UI.hideLoading();
        
        if (!success) {
            retryAttempts++;
            if (retryAttempts < MAX_RETRY_ATTEMPTS) {
                UI.showError(
                    `Failed to load quiz data (attempt ${retryAttempts}/${MAX_RETRY_ATTEMPTS}). Please check your connection and try again.`,
                    () => {
                        UI.hideError();
                        initGame(); // Retry initialization
                    }
                );
            } else {
                UI.showError(
                    "Failed to load quiz data after multiple attempts. Please refresh the page to try again.",
                    () => location.reload()
                );
            }
            return;
        }
        
        // Reset retry counter on success
        retryAttempts = 0;
        
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
    // Set game mode from UI selection
    GameState.gameMode = UI.getSelectedMode();
    
    // Show timer if in timed mode
    const isTimedMode = GameState.gameMode === 'timed';
    UI.showTimer(isTimedMode);
    
    UI.showGameScreen();
    renderQuestion();
}

/**
 * Render the current question
 */
function renderQuestion() {
    // Clear any existing timer
    GameState.clearTimer();
    
    if (!Quiz.hasMoreQuestions()) {
        showFinalResults();
        return;
    }

    const info = Quiz.getQuestionInfo();
    if (!info) return;

    // Update progress bar
    UI.updateProgressBar(GameState.getProgress());
    
    // Update question text with category
    const questionText = info.category 
        ? `[${info.category}] ${info.text}`
        : info.text;
    UI.updateQuestion(info.current, info.total, questionText);
    
    // Update mentor image
    UI.updateMentor(info.mentor);
    
    // Apply combo effect
    UI.setBoostEffect(GameState.isComboActive(GameConfig.scoring.comboThreshold));
    
    // Render options with click handler
    UI.renderOptions(info.options, handleAnswer);
    
    // Hide feedback from previous question
    UI.hideFeedback();
    
    // Start timer if in timed mode
    if (GameState.gameMode === 'timed') {
        startQuestionTimer();
    }
}

/**
 * Start the timer for timed mode
 */
function startQuestionTimer() {
    GameState.timeRemaining = GameConfig.timer.questionTime;
    UI.updateTimer(GameState.timeRemaining);
    
    GameState.timerInterval = setInterval(() => {
        GameState.timeRemaining--;
        UI.updateTimer(GameState.timeRemaining);
        
        if (GameState.timeRemaining <= 0) {
            // Time's up - auto-submit wrong answer
            GameState.clearTimer();
            handleTimeUp();
        }
    }, 1000);
}

/**
 * Handle time running out
 */
function handleTimeUp() {
    const question = GameState.getCurrentQuestion();
    const category = question ? question.category : '';
    
    // Record as incorrect with category tracking
    GameState.recordIncorrect();
    GameState.recordCategoryResult(category, false);
    
    // Show feedback
    UI.showFeedback(false, 'Time\'s up! The answer was: ' + (question ? question.options[question.answer] : 'Unknown'), {
        selectedIndex: -1,
        correctIndex: question ? question.answer : 0,
        combo: 0,
        points: 0
    });
    
    UI.updateScore(GameState.demonicPower);
}

/**
 * Handle answer selection
 * @param {number} choice - Index of selected option
 */
function handleAnswer(choice) {
    // Stop timer if in timed mode
    GameState.clearTimer();
    
    const question = GameState.getCurrentQuestion();
    const category = question ? question.category : '';
    
    const result = Quiz.processAnswer(choice);
    
    // Track category performance
    GameState.recordCategoryResult(category, result.isCorrect);
    
    // Calculate time bonus if in timed mode
    let timeBonus = 0;
    if (GameState.gameMode === 'timed' && result.isCorrect) {
        timeBonus = Quiz.calculateTimeBonus(GameState.timeRemaining);
        if (timeBonus > 0) {
            GameState.demonicPower += timeBonus;
        }
    }
    
    // Update UI with enhanced feedback including visual highlighting
    const totalPoints = result.points + timeBonus;
    const feedbackOptions = {
        selectedIndex: choice,
        correctIndex: result.correctAnswer,
        combo: result.combo,
        points: result.points
    };
    
    // Add time bonus info to feedback
    let explanation = result.explanation;
    if (timeBonus > 0) {
        explanation += ` ⚡ Time Bonus: +${timeBonus}!`;
    }
    
    UI.showFeedback(result.isCorrect, explanation, feedbackOptions);
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
    // Clear any timer
    GameState.clearTimer();
    
    const finalScore = GameState.getFinalScore();
    const rank = Quiz.getRank(GameState.demonicPower);
    const passed = Quiz.hasPassed();
    
    // Save high score and category stats
    const isNewHighScore = Quiz.saveHighScore();
    Quiz.saveCategoryStats();
    
    const highScoreInfo = Quiz.getHighScoreInfo();
    const categoryPerformance = Quiz.getCategoryPerformance();
    
    // Prepare stats for display
    const stats = {
        demonicPower: GameState.demonicPower,
        maxCombo: GameState.maxCombo,
        isNewHighScore: isNewHighScore,
        highScore: highScoreInfo.highScore,
        categoryStats: categoryPerformance,
        gameMode: GameState.gameMode
    };
    
    UI.renderResults(finalScore, `Rank: ${rank.name}`, passed, stats);
}

// Initialize game when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
} else {
    initGame();
}
