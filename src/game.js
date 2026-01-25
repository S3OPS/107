let quizData = [];
let currentIdx = 0;
let demonicPower = 0;
let combo = 0;
let scoreCorrect = 0; // Track number of correct answers

async function initGame() {
    try {
        const response = await fetch('../data/questions.json');
        const data = await response.json();
        quizData = data.questions;
        
        document.getElementById('begin-btn').onclick = () => {
            document.getElementById('start-screen').classList.add('hidden');
            document.getElementById('game-wrapper').classList.remove('hidden');
            renderQuestion();
        };
    } catch (err) {
        console.error("Critical Failure:", err);
    }
}

function updateProgress() {
    const percent = ((currentIdx) / quizData.length) * 100;
    document.getElementById('progress-bar').style.width = percent + "%";
}

function renderQuestion() {
    if (currentIdx >= quizData.length) {
        showFinalResults();
        return;
    }

    updateProgress();
    const q = quizData[currentIdx];
    document.getElementById('question-text').innerText = `[${currentIdx + 1}/${quizData.length}] ${q.question}`;
    
    const container = document.getElementById('options-container');
    container.innerHTML = '';
    container.classList.remove('hidden');
    document.getElementById('feedback-area').classList.add('hidden');

    document.getElementById('mentor-img').src = `../assets/images/${q.mentor || 'rias_neutral.png'}`;

    const wrapper = document.getElementById('game-wrapper');
    if (combo >= 3) { wrapper.classList.add('boost-active'); } 
    else { wrapper.classList.remove('boost-active'); }

    q.options.forEach((opt, i) => {
        const btn = document.createElement('button');
        btn.innerText = opt;
        btn.onclick = () => handleAnswer(i);
        container.appendChild(btn);
    });
}

function handleAnswer(choice) {
    const q = quizData[currentIdx];
    const feedback = document.getElementById('feedback-area');
    const explanation = document.getElementById('explanation');
    
    if (choice === q.answer) {
        scoreCorrect++; // Increment correct count
        combo++;
        let points = (combo >= 3) ? 200 : 100;
        demonicPower += points;
        explanation.innerHTML = `<span style="color:var(--dxd-gold); font-weight:bold;">CRITICAL HIT!</span><br><br>${q.explanation}`;
    } else {
        combo = 0;
        explanation.innerHTML = `<span style="color:red; font-weight:bold;">DAMAGE TAKEN!</span><br><br>${q.explanation}`;
    }

    document.getElementById('score-display').innerText = `Demonic Power: ${demonicPower}`;
    updateRank(demonicPower);
    
    feedback.classList.remove('hidden');
    document.getElementById('options-container').classList.add('hidden');
}

function updateRank(power) {
    const rankDisplay = document.getElementById('rank-display');
    let rank = "Lower-Class Devil";
    let cssClass = "rank-low";

    if (power >= 8000) { rank = "Ultimate-Class Devil"; cssClass = "rank-ultimate"; }
    else if (power >= 4000) { rank = "High-Class Devil"; cssClass = "rank-high"; }
    else if (power >= 1500) { rank = "Middle-Class Devil"; cssClass = "rank-middle"; }

    rankDisplay.innerText = `Rank: ${rank}`;
    rankDisplay.className = cssClass;
}

function showFinalResults() {
    const container = document.getElementById('ui-container');
    const finalScore = (scoreCorrect / quizData.length) * 100;
    const finalRank = document.getElementById('rank-display').innerText;

    let resultsHTML = '';

    if (finalScore >= 70) {
        resultsHTML = `
            <div style="text-align:center; padding: 20px; border: 3px solid green; background: #003300;">
                <h2 style="color: greenyellow;">FAA PART 107 CERTIFICATE EARNED!</h2>
                <p>Congratulations, Devil! You passed the FAA Rating Game with a score of: <strong>${finalScore.toFixed(1)}%</strong></p>
                <h3 class="rank-ultimate">${finalRank}</h3>
                <button onclick="location.reload()">Re-Train at the Academy</button>
            </div>
        `;
    } else {
        resultsHTML = `
            <div style="text-align:center; padding: 20px;">
                <h2 style="color: var(--dxd-red);">RATING GAME FAILED!</h2>
                <p>You scored ${finalScore.toFixed(1)}%. The minimum passing score is 70%. You must retry the academy!</p>
                <button onclick="location.reload()">Retry the Academy</button>
            </div>
        `;
    }
    
    container.innerHTML = resultsHTML;
}

document.getElementById('next-btn').onclick = () => {
    currentIdx++;
    renderQuestion();
};

initGame();
