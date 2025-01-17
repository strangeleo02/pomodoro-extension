let workDuration = 25;
let breakDuration = 5;
let timeLeft = workDuration * 60;
let timerInterval;
let isWork = true;
let isPaused = true;

const timerDisplay = document.getElementById('timer');
const statusDisplay = document.getElementById('status');
const startButton = document.getElementById('start');
const pauseButton = document.getElementById('pause');
const resetButton = document.getElementById('reset');
const workInput = document.getElementById('work-duration');
const breakInput = document.getElementById('break-duration');
const themeSwitch = document.getElementById('theme-switch');
const settingsContainer = document.querySelector('.settings');

// Theme handling
themeSwitch.addEventListener('change', () => {
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    chrome.storage.local.set({ theme: isDark ? 'dark' : 'light' });
});

// Load saved theme
chrome.storage.local.get('theme', (data) => {
    if (data.theme === 'dark') {
        document.body.classList.add('dark');
        themeSwitch.checked = true;
    }
});

// Create SVG progress circle
const createTimerProgress = () => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'timer-progress');
    svg.setAttribute('width', '200');
    svg.setAttribute('height', '200');
    svg.setAttribute('viewBox', '0 0 160 160');

    const backgroundCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    backgroundCircle.setAttribute('class', 'background');
    backgroundCircle.setAttribute('cx', '80');
    backgroundCircle.setAttribute('cy', '80');
    backgroundCircle.setAttribute('r', '70');

    const progressCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    progressCircle.setAttribute('class', 'progress');
    progressCircle.setAttribute('cx', '80');
    progressCircle.setAttribute('cy', '80');
    progressCircle.setAttribute('r', '70');

    svg.appendChild(backgroundCircle);
    svg.appendChild(progressCircle);

    const timerContainer = document.querySelector('.timer-container');
    timerContainer.appendChild(svg);

    return progressCircle;
};

const progressCircle = createTimerProgress();

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

function updateProgress() {
    const totalSeconds = isWork ? workDuration * 60 : breakDuration * 60;
    const progress = (timeLeft / totalSeconds) * 440;
    progressCircle.style.strokeDashoffset = 440 - progress;
}

function updateDisplay() {
    timerDisplay.textContent = formatTime(timeLeft);
    updateProgress();
}

function switchMode() {
    isWork = !isWork;
    if (isWork) {
        timeLeft = workDuration * 60;
        statusDisplay.textContent = "work time";
        progressCircle.style.stroke = '#4CAF50';
    } else {
        timeLeft = breakDuration * 60;
        statusDisplay.textContent = "break time";
        progressCircle.style.stroke = '#2196F3';
    }
    updateDisplay();
}

function startTimer() {
    isPaused = false;
    settingsContainer.classList.add('hidden');
    timerInterval = setInterval(() => {
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'images/icon48.png',
                title: 'Pomodoro Timer',
                message: isWork ? 'Time to take a break!' : 'Time to get back to work!'
            });
            switchMode();
            if (!isPaused) {
                startTimer();
            }
        } else {
            timeLeft--;
            updateDisplay();
        }
    }, 1000);
    startButton.disabled = true;
    pauseButton.disabled = false;
}

function pauseTimer() {
    isPaused = true;
    clearInterval(timerInterval);
    settingsContainer.classList.remove('hidden');
    startButton.disabled = false;
    pauseButton.disabled = true;
}

function resetTimer() {
    clearInterval(timerInterval);
    isPaused = true;
    settingsContainer.classList.remove('hidden');
    startButton.disabled = false;
    pauseButton.disabled = true;
    if (isWork) {
        timeLeft = workDuration * 60;
        statusDisplay.textContent = "work time";
        progressCircle.style.stroke = '#4CAF50';
    } else {
        timeLeft = breakDuration * 60;
        statusDisplay.textContent = "break time";
        progressCircle.style.stroke = '#2196F3';
    }
    updateDisplay();
}

startButton.addEventListener('click', startTimer);
pauseButton.addEventListener('click', pauseTimer);
resetButton.addEventListener('click', resetTimer);
workInput.addEventListener('change', function() {
    workDuration = parseInt(workInput.value);
    if (isWork) resetTimer();
});
breakInput.addEventListener('change', function() {
    breakDuration = parseInt(breakInput.value);
    if (!isWork) resetTimer();
});

// Initial setup
updateDisplay();