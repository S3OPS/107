let quizData = [];
let currentIdx = 0;
let demonicPower = 0;

// 1. Fetch the data from the relative path
async function initGame() {
    try {
        const response = await fetch('../data/questions.json');
        const data = await response.json();
        quizData = data.questions;
        renderQuestion();
    } catch (err) {
        console.error("Failed to summon questions:", err);
    }
}

// 2. Display the question and High School DxD themed UI
function renderQuestion() {
    const q = quizData[currentIdx];
    document.getElementById('question-text').innerText = q.question;
    const container = document.getElementById('options-container');
    container.innerHTML = ''; // Clear previous

    q.options.forEach((opt, i) => {
        const btn = document.createElement('button');
        btn.innerText = opt;
        btn.onclick = () => handleAnswer(i);
        container.appendChild(btn);
    });
}

// 3. Handle the "Rating Game" battle logic
function handleAnswer(choice) {
    const q = quizData[currentIdx];
    const feedback = document.getElementById('feedback-area');
    const explanation = document.getElementById('explanation');

    if (choice === q.answer) {
        demonicPower += 100;
        explanation.innerText = "Correct! " + q.explanation;
    } else {
        explanation.innerText = "Failure! " + q.explanation;
    }

    document.getElementById('score-display').innerText = `Demonic Power: ${demonicPower}`;
    feedback.classList.remove('hidden');
    document.getElementById('options-container').classList.add('hidden');
}

// 4. Progress to next question
document.getElementById('next-btn').onclick = () => {
    currentIdx++;
    if (currentIdx < quizData.length) {
        document.getElementById('feedback-area').classList.add('hidden');
        document.getElementById('options-container').classList.remove('hidden');
        renderQuestion();
    } else {
        alert("Rating Game Over! Your final Power: " + demonicPower);
    }
};

initGame();
