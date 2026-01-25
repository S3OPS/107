let quizData = [];
let currentIdx = 0;
let demonicPower = 0;
let combo = 0;

async function initGame() {
    try {
        // We need to move up one more directory to find the data folder from inside src
        const response = await fetch('../data/questions.json'); 
        const data = await response.json();
        quizData = data.questions;
        renderQuestion();
    } catch (err) {
        console.error("Failed to summon questions:", err);
    }
}

function updateRank(power) {
    const rankDisplay = document.getElementById('rank-display');
    let rank = "Lower-Class Devil";
    let cssClass = "rank-low";

    if (power >= 1000) { 
        rank = "Ultimate-Class Devil"; 
        cssClass = "rank-ultimate";
    } else if (power >= 500) { 
        rank = "High-Class Devil"; 
        cssClass = "rank-high";
    } else if (power >= 200) { 
        rank = "Middle-Class Devil"; 
        cssClass = "rank-middle";
    }

    rankDisplay.innerText = `Rank: ${rank}`;
    rankDisplay.className = cssClass;
}

// NEW FUNCTION: Swaps the character image
function updateMentorImage(imageFileName) {
    const imgElement = document.getElementById('mentor-img');
    // Set the source path dynamically based on the JSON data
    imgElement.src = `../assets/images/${imageFileName}`;
}

function renderQuestion() {
    const q = quizData[currentIdx];
    document.getElementById('question-text').innerText = q.question;
    const container = document.getElementById('options-container');
    container.innerHTML = '';

    // Call the new function here to swap mentors when a new question loads
    updateMentorImage(q.mentor);

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
    // ... [rest of handleAnswer function is the same as before] ...
    const q = quizData[currentIdx];
    const feedback = document.getElementById('feedback-area');
    const explanation = document.getElementById('explanation');
    
    if (choice === q.answer) {
        combo++;
        let points = (combo >= 3) ? 200 : 100;
        demonicPower += points;
        explanation.innerHTML = `<span style="color:var(--dxd-gold)">CRITICAL HIT!</span><br>${q.explanation}`;
    } else {
        combo = 0;
        explanation.innerHTML = `<span style="color:red">DAMAGE TAKEN!</span><br>${q.explanation}`;
    }

    document.getElementById('score-display').innerText = `Demonic Power: ${demonicPower}`;
    updateRank(demonicPower);
    
    feedback.classList.remove('hidden');
    document.getElementById('options-container').classList.add('hidden');
}

document.getElementById('next-btn').onclick = () => {
    currentIdx++;
    if (currentIdx < quizData.length) {
        document.getElementById('feedback-area').classList.add('hidden');
        document.getElementById('options-container').classList.remove('hidden');
        renderQuestion();
    } else {
        const finalRank = document.getElementById('rank-display').innerText;
        document.getElementById('quiz-box').innerHTML = `<h2>Rating Game Settled!</h2><p>Final Rank: ${finalRank}</p>`;
    }
};

initGame();
