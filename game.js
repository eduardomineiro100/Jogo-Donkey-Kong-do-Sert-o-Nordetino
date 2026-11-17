const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');
const scoreEl = document.querySelector('#score');
const livesEl = document.querySelector('#lives');
const overlay = document.querySelector('#message');
const startButton = document.querySelector('#startButton');

const W = canvas.width, H = canvas.height;
const keys = {};
let running = false, score = 0, lives = 3, last = 0, won = false;
const hero = { x: 78, y: 552, w: 26, h: 35, vx: 0, vy: 0, grounded: false, ladder: null };
const platforms = [
    { x: 28, y: 592, w: 904, s: 0 }, { x: 90, y: 489, w: 740, s: -1 },
    { x: 40, y: 382, w: 790, s: 1 }, { x: 132, y: 274, w: 755, s: -1 },
    { x: 46, y: 167, w: 630, s: 1 }, { x: 366, y: 80, w: 500, s: -1 },
];
const ladders = [
    { x: 170, y: 489, h: 103 }, { x: 710, y: 382, h: 107 }, { x: 220, y: 274, h: 108 }, { x: 755, y: 167, h: 107 }, { x: 475, y: 80, h: 87 }
];
let barrels = [], nextBarrel = 0;

addEventListener('keydown', e => { keys[e.code] = true; if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault(); });
addEventListener('keyup', e => keys[e.code] = false);
startButton.onclick = start;

function start() {
    running = true; won = false; score = 0; lives = 3; barrels = []; nextBarrel = 0;
    Object.assign(hero, { x: 78, y: 552, vx: 0, vy: 0, ladder: null });
    scoreEl.textContent = '000000'; livesEl.textContent = lives; overlay.classList.add('hidden'); last = performance.now(); requestAnimationFrame(loop);
}
function slopeY(p, x) { return p.y + p.s * (x - p.x) * .075; }
function platformBelow(x, y) { return platforms.find(p => x + 20 > p.x && x < p.x + p.w && y >= slopeY(p, x) - 6 && y <= slopeY(p, x) + 12); }
function update(dt) {
    if (!running) return;
    const climbing = ladders.find(l => hero.x + hero.w / 2 > l.x - 12 && hero.x + hero.w / 2 < l.x + 20 && hero.y + hero.h > l.y && hero.y < l.y + l.h);
    hero.vx = (keys.ArrowLeft ? -1 : 0) + (keys.ArrowRight ? 1 : 0); hero.vx *= 180;
    if (climbing && (keys.ArrowUp || keys.ArrowDown)) { hero.ladder = climbing; hero.vy = keys.ArrowUp ? -150 : 150; } else { hero.ladder = null; hero.vy += 650 * dt; }
    if ((keys.Space || keys.ArrowUp) && hero.grounded && !climbing) { hero.vy = -330; hero.grounded = false; }
    hero.x = Math.max(16, Math.min(W - 42, hero.x + hero.vx * dt)); hero.y += hero.vy * dt; hero.grounded = false;
    const p = platformBelow(hero.x, hero.y + hero.h);
    if (p && hero.vy >= 0 && !hero.ladder) { hero.y = slopeY(p, hero.x) - hero.h; hero.vy = 0; hero.grounded = true; }
    if (hero.y > H + 30) hit();
    if (hero.x > 465 && hero.x < 530 && hero.y < 70) finish();
    if (performance.now() > nextBarrel) { spawnBarrel(); nextBarrel = performance.now() + 1700; }
    barrels.forEach(b => { b.x += b.vx * dt; const p = platforms[b.level]; b.y = slopeY(p, b.x) - b.r; if (b.x < p.x || b.x > p.x + p.w) { b.level++; if (b.level >= platforms.length) b.dead = true; else { const q = platforms[b.level]; b.x = b.vx > 0 ? q.x + 4 : q.x + q.w - 4; b.vx *= -1; } } if (Math.abs((b.x) - (hero.x + hero.w / 2)) < 20 && Math.abs((b.y) - (hero.y + hero.h / 2)) < 25) hit(); });
    barrels = barrels.filter(b => !b.dead);
}
function spawnBarrel() { barrels.push({ x: 810, y: 65, r: 12, vx: -105, level: 5 }); }
function hit() { if (!running) return; lives--; livesEl.textContent = lives; if (lives <= 0) return end('FIM DE JOGO', 'O Coronel venceu desta vez.'); Object.assign(hero, { x: 78, y: 552, vx: 0, vy: 0 }); barrels = []; }
function finish() { if (!running || won) return; won = true; score += 5000; scoreEl.textContent = String(score).padStart(6, '0'); end('VOCÊ CONSEGUIU!', 'Maria está a salvo sob a lua do sertão.'); }
function end(title, text) { running = false; overlay.querySelector('.eyebrow').textContent = title; overlay.querySelector('h1').innerHTML = won ? 'VIVA O<br><em>SERTÃO!</em>' : 'TENTE<br><em>DE NOVO</em>'; overlay.querySelectorAll('p')[1].innerHTML = text; startButton.textContent = 'JOGAR NOVAMENTE'; overlay.classList.remove('hidden'); }
function loop(t) { const dt = Math.min(.035, (t - last) / 1000); last = t; update(dt); draw(); if (running) requestAnimationFrame(loop); }

function rect(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(x, y, w, h) }
function draw() { ctx.clearRect(0, 0, W, H); drawSky(); platforms.forEach(drawPlatform); ladders.forEach(drawLadder); drawCabore(); drawMaria(); barrels.forEach(drawBarrel); drawHero(); }
function drawSky() { const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#3b2340'); g.addColorStop(.52, '#d66043'); g.addColorStop(1, '#f2a04b'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#ffe9a5'; ctx.beginPath(); ctx.arc(140, 105, 48, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#8e3940';[[0, 300, 190], [155, 335, 230], [600, 330, 220], [760, 270, 240]].forEach(([x, y, w]) => { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w * .48, y - w * .34); ctx.lineTo(x + w, y); ctx.fill() }); ctx.fillStyle = '#552d35'; ctx.fillRect(0, 572, W, 68); for (let x = 15; x < W; x += 105) { ctx.fillStyle = '#4a633b'; ctx.fillRect(x, 530, 8, 42); ctx.fillRect(x - 10, 542, 28, 8); ctx.fillRect(x - 7, 518, 8, 32); ctx.fillRect(x + 14, 515, 8, 32); } }
function drawPlatform(p) { ctx.strokeStyle = '#372229'; ctx.lineWidth = 14; ctx.beginPath(); ctx.moveTo(p.x, slopeY(p, p.x)); ctx.lineTo(p.x + p.w, slopeY(p, p.x + p.w)); ctx.stroke(); ctx.strokeStyle = '#f0a13f'; ctx.lineWidth = 7; ctx.stroke(); for (let x = p.x + 7; x < p.x + p.w; x += 22) { rect(x, slopeY(p, x) - 3, 5, 5, '#ffe09a') } }
function drawLadder(l) { ctx.strokeStyle = '#f4d17b'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(l.x, l.y); ctx.lineTo(l.x, l.y + l.h); ctx.moveTo(l.x + 20, l.y); ctx.lineTo(l.x + 20, l.y + l.h); for (let y = l.y + 11; y < l.y + l.h; y += 14) { ctx.moveTo(l.x, y); ctx.lineTo(l.x + 20, y) } ctx.stroke(); }
function drawHero() { const x = hero.x, y = hero.y; rect(x + 6, y + 8, 16, 18, '#d34f35'); rect(x + 4, y + 25, 8, 10, '#24374a'); rect(x + 16, y + 25, 8, 10, '#24374a'); ctx.fillStyle = '#9b5135'; ctx.beginPath(); ctx.arc(x + 14, y + 7, 9, 0, Math.PI * 2); ctx.fill(); rect(x + 3, y, 22, 5, '#e3bd61'); rect(x + 1, y + 15, 5, 13, '#a85a36'); rect(x + 22, y + 15, 5, 13, '#a85a36'); }
function drawBarrel(b) { ctx.fillStyle = '#7e382d'; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#f6b24b'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(b.x, b.y, b.r - 3, 0, Math.PI * 2); ctx.stroke(); rect(b.x - 12, b.y - 2, 24, 4, '#e87835'); }
function drawCabore() { const x = 805, y = 26; rect(x, y + 23, 55, 30, '#593032'); ctx.fillStyle = '#a45937'; ctx.beginPath(); ctx.arc(x + 28, y + 20, 19, 0, Math.PI * 2); ctx.fill(); rect(x + 5, y, 46, 8, '#9c4832'); rect(x + 14, y - 8, 27, 13, '#d59b48'); rect(x + 20, y + 17, 5, 5, '#241b24'); rect(x + 34, y + 17, 5, 5, '#241b24'); }
function drawMaria() { const x = 490, y = 33; ctx.fillStyle = '#6f3e31'; ctx.beginPath(); ctx.arc(x + 13, y + 9, 10, 0, Math.PI * 2); ctx.fill(); rect(x + 3, y + 18, 21, 28, '#f0d577'); rect(x, y + 21, 4, 18, '#ba643d'); rect(x + 23, y + 21, 4, 18, '#ba643d'); rect(x + 1, y, 25, 5, '#34222c'); }