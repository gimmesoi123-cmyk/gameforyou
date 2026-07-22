const targetSentence =
  "Apple grew in a tree and was eaten by this one person who doesnt like apples. It was later revealed that the apple was poisoned.";
const targetWords = targetSentence.split(/\s+/);

const state = {
  level: 0,
  timer: null,
  timeRemaining: 0,
  level2Loop: null,
  playerY: 0,
  playerSpeed: 260,
  keys: { w: false, s: false },
  level2Words: [],
  level3Picks: 0,
  level3Winner: null,
  level3Finished: false,
  level3Boxes: []
};

const statusText = document.getElementById("statusText");
const startButton = document.getElementById("startButton");
const typingInput = document.getElementById("typingInput");
const submitButton = document.getElementById("submitButton");
const timerValue = document.getElementById("timerValue");
const targetSentenceBox = document.getElementById("targetSentence");
const level1Section = document.getElementById("level1");
const level2Section = document.getElementById("level2");
const level3Section = document.getElementById("level3");
const dodgeArea = document.getElementById("dodgeArea");
const level2Status = document.getElementById("level2Status");
const level3Status = document.getElementById("level3Status");
const boxGrid = document.getElementById("boxGrid");

function setStatus(message) {
  statusText.textContent = message;
}

function showLevel(level) {
  level1Section.classList.toggle("hidden", level !== 1);
  level2Section.classList.toggle("hidden", level !== 2);
  level3Section.classList.toggle("hidden", level !== 3);
}

function showTypingPrompt() {
  targetSentenceBox.textContent = targetSentence;
  showLevel(1);
  setStatus("The sentence is shown below. Type it before the timer reaches zero.");
}

function calculateTimeLimit() {
  return Math.max(20, Math.round(targetSentence.length * 0.3));
}

function startLevel1() {
  clearInterval(state.timer);
  state.level = 1;
  showLevel(1);
  state.timeRemaining = calculateTimeLimit();
  typingInput.value = "";
  typingInput.focus();
  timerValue.textContent = state.timeRemaining;
  setStatus("Type the sentence before the timer reaches zero.");

  targetSentenceBox.textContent = targetSentence;

  state.timer = setInterval(() => {
    state.timeRemaining -= 1;
    timerValue.textContent = state.timeRemaining;
    if (state.timeRemaining <= 0) {
      clearInterval(state.timer);
      setStatus("Time is up. Press start to try again.");
    }
  }, 1000);
}

function submitLevel1() {
  const input = typingInput.value.trim();
  if (input.toLowerCase() === targetSentence.toLowerCase()) {
    clearInterval(state.timer);
    setStatus("Level 1 cleared. The words are coming for you.");
    startLevel2();
  } else {
    setStatus("The sentence did not match. Try again.");
  }
}

function startLevel2() {
  state.level = 2;
  showLevel(2);
  level2Status.textContent = "Stay alive until all words have passed.";
  dodgeArea.innerHTML = "";
  const player = document.createElement("div");
  player.id = "player";
  player.textContent = "◼";
  dodgeArea.appendChild(player);

  state.level2Words = [];
  const areaHeight = dodgeArea.clientHeight || 360;
  const areaWidth = dodgeArea.clientWidth || 700;

  targetWords.forEach((word, index) => {
    const chip = document.createElement("div");
    chip.className = "word-chip";
    chip.textContent = word;
    dodgeArea.appendChild(chip);

    const speed = 180 + Math.random() * 140;
    const drift = (Math.random() - 0.5) * 90;
    const x = areaWidth + 80 + index * 26 + Math.random() * 140;
    const y = 20 + Math.random() * Math.max(1, areaHeight - 80);

    state.level2Words.push({ chip, x, y, speed, drift, passed: false });
  });

  state.playerY = Math.max(24, areaHeight / 2 - 22);
  updatePlayerPosition();

  if (state.level2Loop) {
    cancelAnimationFrame(state.level2Loop);
  }

  let lastFrameTime = performance.now();
  const loop = (now) => {
    if (state.level !== 2) {
      return;
    }

    const delta = Math.min(0.032, (now - lastFrameTime) / 1000);
    lastFrameTime = now;
    movePlayer(delta);

    let allPassed = true;
    state.level2Words.forEach((word) => {
      if (word.passed) {
        return;
      }

      word.x -= word.speed * delta;
      word.y += word.drift * delta;
      word.chip.style.left = `${word.x}px`;
      word.chip.style.top = `${word.y}px`;

      if (word.x + word.chip.offsetWidth < -10) {
        word.passed = true;
        return;
      }

      allPassed = false;

      const playerRect = {
        left: 48,
        right: 92,
        top: state.playerY,
        bottom: state.playerY + 44
      };
      const wordRect = {
        left: word.x,
        right: word.x + word.chip.offsetWidth,
        top: word.y,
        bottom: word.y + word.chip.offsetHeight
      };

      const overlap =
        playerRect.left < wordRect.right &&
        playerRect.right > wordRect.left &&
        playerRect.top < wordRect.bottom &&
        playerRect.bottom > wordRect.top;

      if (overlap) {
        endLevel2(false);
        return;
      }
    });

    if (allPassed) {
      endLevel2(true);
      return;
    }

    state.level2Loop = requestAnimationFrame(loop);
  };

  state.level2Loop = requestAnimationFrame(loop);
}

function updatePlayerPosition() {
  const player = document.getElementById("player");
  if (!player) {
    return;
  }

  const maxY = (dodgeArea.clientHeight || 360) - 44;
  state.playerY = Math.min(maxY, Math.max(0, state.playerY));
  player.style.top = `${state.playerY}px`;
}

function movePlayer(delta) {
  if (state.keys.w) {
    state.playerY -= state.playerSpeed * delta;
  }
  if (state.keys.s) {
    state.playerY += state.playerSpeed * delta;
  }
  updatePlayerPosition();
}

function endLevel2(success) {
  if (state.level !== 2) {
    return;
  }

  state.level = 2;
  if (state.level2Loop) {
    cancelAnimationFrame(state.level2Loop);
    state.level2Loop = null;
  }

  if (success) {
    level2Status.textContent = "You made it through. Moving to level 3.";
    setStatus("Level 2 cleared. The final challenge is ready.");
    setTimeout(() => startLevel3(), 800);
  } else {
    level2Status.textContent = "You were hit by a word. Try again.";
    setStatus("You were hit. Try level 2 again.");
  }
}

function startLevel3() {
  state.level = 3;
  showLevel(3);
  boxGrid.innerHTML = "";
  state.level3Picks = 0;
  state.level3Finished = false;
  state.level3Winner = Math.floor(Math.random() * 10);
  state.level3Boxes = [];

  for (let index = 0; index < 10; index += 1) {
    const button = document.createElement("button");
    button.className = "box";
    button.textContent = index + 1;
    button.addEventListener("click", () => handleLevel3Pick(index));
    boxGrid.appendChild(button);
    state.level3Boxes.push(button);
  }

  level3Status.textContent = "You have 3 picks.";
  setStatus("Choose any three boxes. The victory is hidden behind one of them.");
}

function handleLevel3Pick(index) {
  if (state.level !== 3 || state.level3Finished) {
    return;
  }

  const box = state.level3Boxes[index];
  if (!box) {
    return;
  }

  state.level3Picks += 1;

  if (index === state.level3Winner) {
    box.classList.add("win");
    box.textContent = "✓";
    level3Status.textContent = "You found the victory!";
    state.level3Finished = true;
    setStatus("Victory discovered. You won the game!");
    return;
  }

  box.classList.add("wrong");
  box.textContent = "✕";

  if (state.level3Picks >= 3) {
    level3Status.textContent = "No victory this round. Shuffling boxes.";
    setStatus("You used all three picks. The victory has been moved.");
    state.level3Finished = true;
    setTimeout(() => startLevel3(), 1100);
  } else {
    level3Status.textContent = `Wrong box. ${3 - state.level3Picks} pick${3 - state.level3Picks === 1 ? "" : "s"} left.`;
  }
}

startButton.addEventListener("click", startLevel1);
submitButton.addEventListener("click", submitLevel1);
typingInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    submitLevel1();
  }
});

window.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() === "w") {
    event.preventDefault();
    state.keys.w = true;
  }
  if (event.key.toLowerCase() === "s") {
    event.preventDefault();
    state.keys.s = true;
  }
});

window.addEventListener("keyup", (event) => {
  if (event.key.toLowerCase() === "w") {
    state.keys.w = false;
  }
  if (event.key.toLowerCase() === "s") {
    state.keys.s = false;
  }
});

window.addEventListener("resize", () => {
  if (state.level === 2) {
    updatePlayerPosition();
  }
});

showTypingPrompt();
