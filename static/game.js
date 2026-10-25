const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const statusText = document.getElementById("status");
const bestText = document.getElementById("best");
const restartButton = document.getElementById("restart");

const ground = 250;
const cubeSize = 25;

let cube;
let obstacles;
let score;
let speed;
let rotation;

// Variables for Delta Time tracking
let lastTime = 0;
let obstacleTimer = 0;
const obstacleSpawnInterval = 1.35; // Spawn a spike every 1.35 seconds (matches your old frame loop)

let playing = false;
let gameOver = false;

let best = Number(
  localStorage.getItem("neonRushBest") || 0
);

bestText.textContent = best;

// Initialize or restart the game
function resetGame() {
  cube = {
    x: 100,
    y: ground - cubeSize,
    size: cubeSize,
    velocity: 0
  };

  obstacles = [];
  score = 0;
  speed = 260; // Initial speed in pixels per second
  obstacleTimer = 0;
  rotation = 0;

  playing = false;
  gameOver = false;

  statusText.textContent =
    "PRESS SPACE OR CLICK TO START";

  // Reset timing anchors so the game doesn't jump on first frame
  lastTime = performance.now();

  draw();
}

// Start playing or jump
function jump() {
  if (gameOver) {
    resetGame();
    return;
  }

  if (!playing) {
    playing = true;
    statusText.textContent = "RUNNING";
    lastTime = performance.now(); // Reset time when game actually unpauses
  }

  // Jump only when touching the ground
  if (cube.y >= ground - cube.size - 1) {
    cube.velocity = -520; // Velocity in pixels per second
  }
}

// Create an obstacle
function addObstacle() {
  const size = 28 + Math.random() * 12;

  obstacles.push({
    x: canvas.width,
    size: size
  });
}

// Update physics, obstacles, and collisions based on actual time passed
function update(dt) {
  if (!playing || gameOver) return;

  // 1. Tick score based on seconds passed instead of frames
  score += 5.5 * dt; 
  
  // 2. Scale game speed relative to score (pixels per second)
  speed = 260 + Math.min(score * 3, 160);

  // 3. Gravity applied per second
  cube.velocity += 1500 * dt; 
  cube.y += cube.velocity * dt;

  // Landing
  if (cube.y >= ground - cube.size) {
    cube.y = ground - cube.size;
    cube.velocity = 0;
    rotation = 0;
  }

  // 4. Time-based obstacle spawning
  obstacleTimer += dt;
  if (obstacleTimer >= obstacleSpawnInterval) {
    addObstacle();
    obstacleTimer = 0; // Reset timer
  }

  // Move obstacles and check collisions
  for (const obstacle of obstacles) {
    // Move spike based on pixels per second * time passed
    obstacle.x -= speed * dt;

    const size = obstacle.size;

    const hit =
      cube.x + cube.size - 5 > obstacle.x &&
      cube.x + 5 < obstacle.x + size &&
      cube.y + cube.size - 3 > ground - size &&
      cube.y + 3 < ground;

    if (hit) {
      endGame();
      return;
    }
  }

  // Remove obstacles off-screen
  obstacles = obstacles.filter(
    obstacle => obstacle.x + obstacle.size > 0
  );
}

// End the game
function endGame() {
  playing = false;
  gameOver = true;

  const finalScore = Math.floor(score);

  if (finalScore > best) {
    best = finalScore;

    localStorage.setItem(
      "neonRushBest",
      best
    );

    bestText.textContent = best;
  }

  statusText.textContent =
    "GAME OVER · SCORE " +
    finalScore +
    " · CLICK TO RETRY";
}

// Draw everything
function draw() {
  ctx.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  // Background grid
  ctx.strokeStyle = "#242342";
  ctx.lineWidth = 1;

  for (let x = 0; x < canvas.width; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, ground);
    ctx.stroke();
  }

  for (let y = 10; y < ground; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // Ground
  ctx.fillStyle = "#1a1730";

  ctx.fillRect(
    0,
    ground,
    canvas.width,
    canvas.height - ground
  );

  ctx.fillStyle = "#4deeea";
  ctx.fillRect(0, ground, canvas.width, 3);

  // Cube rotation around its center
  ctx.save();

  ctx.translate(
    cube.x + cube.size / 2,
    cube.y + cube.size / 2
  );

  ctx.rotate(rotation);

  ctx.fillStyle = "#a78bfa";

  ctx.fillRect(
    -cube.size / 2,
    -cube.size / 2,
    cube.size,
    cube.size
  );

  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;

  ctx.strokeRect(
    -cube.size / 2 + 3,
    -cube.size / 2 + 3,
    cube.size - 6,
    cube.size - 6
  );

  ctx.restore();

  // Draw spikes
  for (const obstacle of obstacles) {
    ctx.fillStyle = "#ff5277";

    ctx.beginPath();

    ctx.moveTo(
      obstacle.x,
      ground
    );

    ctx.lineTo(
      obstacle.x + obstacle.size / 2,
      ground - obstacle.size
    );

    ctx.lineTo(
      obstacle.x + obstacle.size,
      ground
    );

    ctx.closePath();
    ctx.fill();
  }

  // Score
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 18px Arial";

  ctx.fillText(
    "SCORE " + Math.floor(score),
    20,
    30
  );

  // Start screen
  if (!playing && !gameOver) {
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";

    ctx.font = "bold 22px Arial";

    ctx.fillText(
      "NEON RUSH",
      canvas.width / 2,
      100
    );

    ctx.font = "15px Arial";

    ctx.fillText(
      "PRESS SPACE OR CLICK",
      canvas.width / 2,
      130
    );

    ctx.textAlign = "left";
  }

  // Game over screen
  if (gameOver) {
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";

    ctx.font = "bold 28px Arial";

    ctx.fillText(
      "GAME OVER",
      canvas.width / 2,
      105
    );

    ctx.font = "16px Arial";

    ctx.fillText(
      "Click or press SPACE to retry",
      canvas.width / 2,
      135
    );

    ctx.textAlign = "left";
  }
}

// Main game loop passing accurate timestamps
function loop(currentTime) {
  // Calculate delta time in seconds
  let dt = (currentTime - lastTime) / 1000;
  lastTime = currentTime;

  // Cap max delta time to prevent massive teleportation glitches if the tab freezes
  if (dt > 0.1) dt = 0.1;

  // Scale airborne rotation per second rather than per frame
  const isAirborne = cube.y < ground - cube.size - 0.5;
  if (playing && isAirborne) {
    rotation += 6.5 * dt; 
  } else {
    rotation = 0;
  }

  update(dt);
  draw();

  requestAnimationFrame(loop);
}

// Keyboard controls
document.addEventListener("keydown", event => {
  if (
    event.code === "Space" ||
    event.code === "ArrowUp"
  ) {
    event.preventDefault();

    if (!event.repeat) {
      jump();
    }
  }
});

// Mouse and touchscreen controls
canvas.addEventListener("pointerdown", jump);

// Restart button
restartButton.addEventListener(
  "click",
  resetGame
);

// Start the game loop passing the initial hardware timestamp
resetGame();
requestAnimationFrame(loop);
