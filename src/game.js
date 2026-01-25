let quizData = [];
let currentIdx = 0;
let demonicPower = 0;
let combo = 0;

// Initialize when page loads
async function initGame() {
    try {
        const response = await fetch('../data/questions.json');
        const data = await response.json();
        quizData = data.questions;
        
        // Setup Begin Button
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

    // Update Mentor Image
    document.getElementById('mentor-img').src = `../assets/images/${q.mentor || 'rias_neutral.png'}`;

    // Boost Glow
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
    const finalRank = document.getElementById('rank-display').innerText;
    document.getElementById('ui-container').innerHTML = `
        <div style="text-align:center; padding: 20px;">
            <h2 style="color:var(--dxd-gold)">RATING GAME SETTLED</h2>
            <p style="font-size: 1.5rem;">Final Demonic Power: ${demonicPower}</p>
            <h3 class="rank-ultimate">${finalRank}</h3>
            <button onclick="location.reload()">RE-TRAIN AT THE ACADEMY</button>
        </div>
    `;
}

document.getElementById('next-btn').onclick = () => {
    currentIdx++;
    renderQuestion();
};

initGame();
