/* =====================================================
   MINI TETRIS GAME.JS — FINAL v6
   ===================================================== */

/* ================== DOM ================== */
const lobbyScreen = document.getElementById("lobby");
const gameScreen = document.getElementById("game");
const gameOverScreen = document.getElementById("gameover");

const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const restartBtn = document.getElementById("restartBtn");
const backBtn = document.getElementById("backBtn");
const playAgainBtn = document.getElementById("playAgainBtn");
const backLobbyBtn = document.getElementById("backLobbyBtn");

const nameInput = document.getElementById("playerName");
const difficultySelect = document.getElementById("difficulty");

const uiName = document.getElementById("uiName");
const uiScore = document.getElementById("uiScore");
const uiTime = document.getElementById("uiTime");
const finalScore = document.getElementById("finalScore");

const leaderboardEl = document.getElementById("leaderboard");

/* ================== CANVAS ================== */
const canvas = document.getElementById("tetris");
const ctx = canvas.getContext("2d");
ctx.scale(30, 30);

const nextCanvas = document.getElementById("nextCanvas");
const nextCtx = nextCanvas.getContext("2d");
nextCtx.scale(30, 30);

/* ================== GAME STATE ================== */
let state = "lobby";
let playerName = "";
let difficulty = "";

let score = 0;
let paused = false;
let validGameFinished = false;

/* ================== LEVEL STYLE ================== */
const levelColor = {
  easy: "#2ecc71",
  normal: "#3498db",
  hard: "#e67e22",
  extreme: "#e74c3c"
};

/* ================== DIFFICULTY ================== */
const modes = {
  easy:    { drop: 1000, time: null, score: 100 },
  normal:  { drop: 600,  time: 180,  score: 100 },
  hard:    { drop: 300,  time: 120,  score: 120 },
  extreme: { drop: 160,  time: 60,   score: 150 }
};

let dropInterval = 1000;
let timeLeft = null;

/* ================== MATRIX ================== */
const arena = Array.from({ length: 20 }, () => Array(10).fill(0));

/* ================== PIECES ================== */
const pieces = {
  I:[[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
  O:[[2,2],[2,2]],
  T:[[0,3,0],[3,3,3],[0,0,0]],
  S:[[0,4,4],[4,4,0],[0,0,0]],
  Z:[[5,5,0],[0,5,5],[0,0,0]],
  J:[[6,0,0],[6,6,6],[0,0,0]],
  L:[[0,0,7],[7,7,7],[0,0,0]]
};

const colors = [null,"cyan","yellow","purple","green","red","blue","orange"];

/* ================== PLAYER ================== */
const player = { pos:{x:0,y:0}, matrix:null };
let nextPiece = null;

/* ================== CORE ================== */
function randomPiece(){
  const keys = Object.keys(pieces);
  return pieces[keys[Math.random()*keys.length|0]];
}

function resetPlayer(){
  player.matrix = nextPiece || randomPiece();
  nextPiece = randomPiece();
  player.pos.y = 0;
  player.pos.x = (10 / 2 | 0) - (player.matrix[0].length / 2 | 0);
  if (collide()) endGame();
  drawNext();
}

function collide(){
  return player.matrix.some((row,y)=>
    row.some((v,x)=>
      v && (arena[y+player.pos.y]?.[x+player.pos.x]) !== 0
    )
  );
}

function merge(){
  player.matrix.forEach((row,y)=>{
    row.forEach((v,x)=>{
      if(v) arena[y+player.pos.y][x+player.pos.x]=v;
    });
  });
}

function sweep(){
  let cleared = 0;
  for(let y=19;y>=0;y--){
    if(arena[y].every(v=>v!==0)){
      arena.splice(y,1);
      arena.unshift(Array(10).fill(0));
      y++;
      cleared++;
      flash();
    }
  }
  if(cleared){
    score += cleared * modes[difficulty].score;
    if(timeLeft!==null) timeLeft += cleared * 10;
    updateUI();
  }
}

function flash(){
  ctx.fillStyle="rgba(255,255,255,0.35)";
  ctx.fillRect(0,0,canvas.width,canvas.height);
}

/* ================== DRAW ================== */
function drawMatrix(matrix,offset,context=ctx){
  matrix.forEach((row,y)=>{
    row.forEach((v,x)=>{
      if(v){
        context.fillStyle=colors[v];
        context.fillRect(x+offset.x,y+offset.y,1,1);
        context.strokeStyle="#000";
        context.lineWidth=0.05;
        context.strokeRect(x+offset.x,y+offset.y,1,1);
      }
    });
  });
}

function draw(){
  ctx.fillStyle="#000";
  ctx.fillRect(0,0,canvas.width,canvas.height);
  drawMatrix(arena,{x:0,y:0});
  drawMatrix(player.matrix,player.pos);
}

function drawNext(){
  nextCtx.clearRect(0,0,nextCanvas.width,nextCanvas.height);
  drawMatrix(nextPiece,{x:1,y:1},nextCtx);
}

/* ================== LOOP ================== */
let dropCounter = 0;
let lastTime = 0;

function drop(){
  player.pos.y++;
  if(collide()){
    player.pos.y--;
    merge();
    sweep();
    resetPlayer();
  }
  dropCounter = 0;
}

function update(time){
  if(state!=="playing" || paused) return;

  const delta = time - lastTime;
  lastTime = time;
  dropCounter += delta;

  if(dropCounter > dropInterval) drop();
  draw();
  requestAnimationFrame(update);
}

/* ================== TIMER ================== */
setInterval(()=>{
  if(state!=="playing" || paused || timeLeft===null) return;
  timeLeft--;
  if(timeLeft<=0) endGame();
  updateUI();
},1000);

/* ================== UI ================== */
function updateUI(){
  uiName.textContent = `${playerName} (${difficulty.toUpperCase()})`;
  uiName.style.color = levelColor[difficulty];
  uiScore.textContent = score;
  uiTime.textContent = timeLeft===null?"∞":
    `${Math.floor(timeLeft/60)}:${(timeLeft%60).toString().padStart(2,"0")}`;
}

/* ================== GAME FLOW ================== */
function startGame(){
  gameOverScreen.classList.remove("active");

  if(!nameInput.value.trim()) return alert("Nama wajib diisi!");
  if(!difficultySelect.value) return alert("Pilih level!");
  if(!confirm("Mulai game?")) return;

  playerName = nameInput.value.trim();
  difficulty = difficultySelect.value;

  score = 0;
  validGameFinished = false;
  arena.forEach(r=>r.fill(0));

  dropInterval = modes[difficulty].drop;
  timeLeft = modes[difficulty].time;

  paused = false;
  state = "playing";

  lobbyScreen.classList.remove("active");
  gameScreen.classList.add("active");

  nextPiece = randomPiece();
  resetPlayer();
  updateUI();

  lastTime = performance.now();   // 🔥 FIX UTAMA
  dropCounter = 0;
  requestAnimationFrame(update);  // 🔥 LANGSUNG JALAN
}

/* ================== GAME OVER ================== */
function endGame(){
  state = "gameover";
  finalScore.textContent = score;
  gameScreen.classList.remove("active");
  gameOverScreen.classList.add("active");
}

/* ================== CONTROLS ================== */
document.addEventListener("keydown",e=>{
  if(state!=="playing") return;

  if(e.code==="ArrowLeft"){player.pos.x--;if(collide())player.pos.x++;}
  if(e.code==="ArrowRight"){player.pos.x++;if(collide())player.pos.x--;}
  if(e.code==="ArrowDown") drop();
  if(e.code==="ArrowUp") rotate();

  if(e.code==="Space"){
    paused=!paused;
    pauseBtn.textContent=paused?"Resume":"Pause";
    if(!paused){
      lastTime = performance.now();
      requestAnimationFrame(update);
    }
  }

  if(e.code==="KeyR"){
    if(confirm("Restart game?")) startGame();
  }
});

function rotate(){
  const m = player.matrix;
  player.matrix = m[0].map((_,i)=>m.map(r=>r[i]).reverse());
  if(collide()) player.matrix = m;
}

/* ================== BUTTON EVENTS ================== */
startBtn.addEventListener("click", startGame);

pauseBtn.addEventListener("click", () => {
  if (state !== "playing") return;
  paused = !paused;
  pauseBtn.textContent = paused ? "Resume" : "Pause";
  if (!paused) {
    lastTime = performance.now();
    requestAnimationFrame(update);
  }
});

restartBtn.addEventListener("click", () => {
  if (confirm("Restart game?")) startGame();
});

backBtn.addEventListener("click", () => {
  if (!confirm("Kembali ke lobby?")) return;

  state = "lobby";
  gameScreen.classList.remove("active");
  gameOverScreen.classList.remove("active");
  lobbyScreen.classList.add("active");
});

playAgainBtn.addEventListener("click", () => {
  if (confirm("Main lagi?")) startGame();
});

backLobbyBtn.addEventListener("click", () => {
  state = "lobby";
  gameOverScreen.classList.remove("active");
  lobbyScreen.classList.add("active");
});
