let quizData = [];
let currentIdx = 0;
let demonicPower = 0;
let combo = 0;

async function initGame() {
    try {
        // Fetching the 60 questions from your data folder
        const response = await fetch('../data/questions.json');
        const data = await response.json();
        
        // ANAL-RETENTIVE CHECK: Ensure data is loaded
        if (!data.questions || data.questions.length === 0) {
            throw new Error("No questions found in JSON file.");
        }

        quizData = data.questions;
        console.log("Game Initialized. Questions Loaded: " + quizData.length);
        
        renderQuestion();
    } catch (err) {
        console.error("Critical Failure:", err);
        document.getElementById('question-text').innerText = "Failed to summon questions. Check JSON syntax.";
    }
}

function updateRank(power) {
    const rankDisplay = document.getElementById('rank-display');
    let rank = "Lower-Class Devil";
    let cssClass = "rank-low";

    if (power >= 5000) { 
        rank = "Ultimate-Class Devil"; 
        cssClass = "rank-ultimate";
    } else if (power >= 2500) { 
        rank = "High-Class Devil"; 
        cssClass = "rank-high";
    } else if (power >= 1000) { 
        rank = "Middle-Class Devil"; 
        cssClass = "rank-middle";
    }

    rankDisplay.innerText = `Rank: ${rank}`;
    rankDisplay.className = cssClass;
}

function updateMentorImage(imageFileName) {
    const imgElement = document.getElementById('mentor-img');
    // Default to Rias if image is missing
    const path = `../assets/images/${imageFileName || 'rias_neutral.png'}`;
    imgElement.src = path;
}

function renderQuestion() {
    // ANAL-RETENTIVE CHECK: End game if out of questions
    if (currentIdx >= quizData.length) {
        showFinalResults();
        return;
    }

    const q = quizData[currentIdx];
    document.getElementById('question-text').innerText = `[${currentIdx + 1}/${quizData.length}] ${q.question}`;
    
    const container = document.getElementById('options-container');
    container.innerHTML = '';
    container.classList.remove('hidden');
    document.getElementById('feedback-area').classList.add('hidden');

    updateMentorImage(q.mentor);

    // Boosted Gear Logic
    const wrapper = document.getElementById('game-wrapper');
    if (combo >= 3) {
        wrapper.classList.add('boost-active');
    } else {
        wrapper.classList.remove('boost-active');
    }

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
        explanation.innerHTML = `<span style="color:var(--dxd-gold); font-weight:bold;">BOOSTED! CRITICAL HIT!</span><br><br>${q.explanation}`;
    } else {
        combo = 0;
        explanation.innerHTML = `<span style="color:red; font-weight:bold;">RETIRED! DAMAGE TAKEN!</span><br><br>${q.explanation}`;
    }

    document.getElementById('score-display').innerText = `Demonic Power: ${demonicPower}`;
    updateRank(demonicPower);
    
    feedback.classList.remove('hidden');
    document.getElementById('options-container').classList.add('hidden');
}

function showFinalResults() {
    const finalRank = document.getElementById('rank-display').innerText;
    const container = document.getElementById('ui-container');
    container.innerHTML = `
        <div style="text-align:center; padding: 20px;">
            <h2 style="color:var(--dxd-gold)">RATING GAME SETTLED</h2>
            <p style="font-size: 1.5rem;">Total Power: ${demonicPower}</p>
            <h3 class="rank-ultimate">${finalRank}</h3>
            <button onclick="location.reload()">Re-Enter the Academy</button>
        </div>
    `;
}

document.getElementById('next-btn').onclick = () => {
    currentIdx++;
    renderQuestion();
};

initGame();
