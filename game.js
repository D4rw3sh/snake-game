const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const highEl = document.getElementById('highscore');
const overlay = document.getElementById('overlay');
const messageEl = document.getElementById('message');

const GRID = 20;
const CELL = canvas.width / GRID;
const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

let snake, dir, nextDir, food, score, speed, timer, running, gameOver;
let highscore = 0;
try { highscore = Number(localStorage.getItem('snake-highscore')) || 0; } catch {}
highEl.textContent = highscore;

function reset() {
  snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
  dir = DIRS.right;
  nextDir = dir;
  score = 0;
  speed = 130;
  gameOver = false;
  scoreEl.textContent = score;
  placeFood();
  draw();
}

function placeFood() {
  do {
    food = { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) };
  } while (snake.some(s => s.x === food.x && s.y === food.y));
}

function step() {
  dir = nextDir;
  const head = { x: snake[0].x + dir[0], y: snake[0].y + dir[1] };
  const ate = head.x === food.x && head.y === food.y;
  const body = ate ? snake : snake.slice(0, -1);

  if (head.x < 0 || head.y < 0 || head.x >= GRID || head.y >= GRID ||
      body.some(s => s.x === head.x && s.y === head.y)) {
    return endGame();
  }

  snake.unshift(head);
  if (ate) {
    score++;
    scoreEl.textContent = score;
    if (score > highscore) {
      highscore = score;
      highEl.textContent = highscore;
      try { localStorage.setItem('snake-highscore', highscore); } catch {}
    }
    placeFood();
    speed = Math.max(60, speed - 3);
    restartTimer();
  } else {
    snake.pop();
  }
  draw();
}

function draw() {
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(food.x * CELL + CELL / 2, food.y * CELL + CELL / 2, CELL / 2 - 2, 0, Math.PI * 2);
  ctx.fill();

  snake.forEach((s, i) => {
    ctx.fillStyle = i === 0 ? '#4ade80' : '#22c55e';
    ctx.fillRect(s.x * CELL + 1, s.y * CELL + 1, CELL - 2, CELL - 2);
  });
}

function restartTimer() {
  clearInterval(timer);
  timer = setInterval(step, speed);
}

function start() {
  if (gameOver) reset();
  running = true;
  overlay.classList.add('hidden');
  restartTimer();
}

function pause() {
  running = false;
  clearInterval(timer);
  messageEl.textContent = 'Pause – Leertaste zum Fortsetzen';
  overlay.classList.remove('hidden');
}

function endGame() {
  running = false;
  gameOver = true;
  clearInterval(timer);
  messageEl.textContent = `Game Over! Punkte: ${score}\nLeertaste oder tippen für neues Spiel`;
  overlay.classList.remove('hidden');
}

function setDirection(name) {
  const d = DIRS[name];
  if (!d) return;
  if (d[0] === -dir[0] && d[1] === -dir[1]) return; // keine 180°-Wende
  nextDir = d;
  if (!running) start();
}

const KEYS = {
  ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
  w: 'up', s: 'down', a: 'left', d: 'right',
};

document.addEventListener('keydown', e => {
  if (e.key === ' ') {
    e.preventDefault();
    running ? pause() : start();
    return;
  }
  const name = KEYS[e.key] || KEYS[e.key.toLowerCase()];
  if (name) { e.preventDefault(); setDirection(name); }
});

overlay.addEventListener('click', start);
document.querySelectorAll('.controls button').forEach(btn =>
  btn.addEventListener('click', () => setDirection(btn.dataset.dir)));

// Wischgesten
let touchStart = null;
canvas.addEventListener('touchstart', e => { touchStart = e.touches[0]; }, { passive: true });
canvas.addEventListener('touchend', e => {
  if (!touchStart) return;
  const t = e.changedTouches[0];
  const dx = t.clientX - touchStart.clientX, dy = t.clientY - touchStart.clientY;
  if (Math.max(Math.abs(dx), Math.abs(dy)) > 20) {
    setDirection(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
  }
  touchStart = null;
});

reset();
