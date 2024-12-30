const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    if (detectMobile()) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    } else {
        const scale = Math.min(window.innerWidth / canvas.width, window.innerHeight / canvas.height);
        canvas.style.transformOrigin = '0 0';
        canvas.style.transform = `scale(${scale})`;
        canvas.style.width = `${canvas.width * scale}px`;
        canvas.style.height = `${canvas.height * scale}px`;
    }
}

function detectMobile() {
    return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function updateGameSpeed() {
    // Линейное увеличение скорости до максимума 4 раз
    const maxMultiplier = 4;
    const scoreFactor = 1000; // Параметр, определяющий, как быстро растет скорость
    const multiplier = Math.min(1 + score / scoreFactor, maxMultiplier);
    gameSpeed = 4 * multiplier;
}

if (detectMobile()) {
    resizeCanvas();
}

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const stumpSprite = document.getElementById('stumpSprite');
const gameOverSprite = document.getElementById('gameOverSprite');
const shvabraSprite = document.getElementById('shvabraSprite');
const jumpingSprite = document.getElementById('jumpingSprite');
const platformSprite = document.getElementById('platformSprite');
const characterSprite = document.getElementById('characterSprite');
const coinSprite = document.getElementById('coinSprite');
const enemySprite = document.getElementById('enemySprite');
const decorationSprite = document.getElementById('decorationSprite');
const backgroundMusic = document.getElementById('backgroundMusic');
const jumpSound = document.getElementById('jumpSound');
const collisionSound = document.getElementById('collisionSound');
const healthSprite = document.getElementById('healthSprite');
const expSprite = document.getElementById('expSprite');

// Добавлено: новые элементы
const greenCoinSprite = document.getElementById('greenCoinSprite');
const shootSound = document.getElementById('shootSound');

let tripleJump = false;
const gravity = 0.5;
let gameSpeed = 4;
let score = 0;
let backgroundOffset = 0;
let coinOffset = 0;
let coinDirection = 1;
let lives = 3;
let invincible = false;
let invincibleTime = 0;
let coinInvincible = false;
let coinInvincibleTime = 0;
let doubleJump = false;
let gameOver = false;
let fallingThroughPlatform = false;
let cameraOffset = 0;

// Добавлено: новые переменные
let powerUps = [];
let shootingEnabled = false;
let shootingTimer = 0;
let totalCoinsCollected = 0;

const character = {
    x: 50,
    y: canvas.height - 150,
    width: 95,
    height: 120,
    dx: 0,
    dy: 0,
    speed: 10,
    jumping: false,
    isAlive: true,
    jumpCount: 0,
    maxJumps: 3
};

const obstacles = [];
const platforms = [];
const coins = [];
const enemies = [];
const projectiles = [];
const floors = [];

function resetGame() {
    character.x = 50;
    character.y = canvas.height - 150;
    character.dx = 0;
    character.dy = 0;
    character.isAlive = true;
    gameSpeed = 4;
    score = 0;
    totalCoinsCollected = 0; // Добавлено
    lives = 3;
    invincible = false;
    invincibleTime = 0;
    coinInvincible = false;
    coinInvincibleTime = 0;
    shootingEnabled = false; // Добавлено
    shootingTimer = 0; // Добавлено
    obstacles.length = 0;
    platforms.length = 0;
    coins.length = 0;
    enemies.length = 0;
    projectiles.length = 0;
    powerUps.length = 0; // Добавлено
    floors.length = 0;
    gameOver = false;
    doubleJump = false;
    tripleJump = false;
    backgroundOffset = 0;
    generateObstacles();
    generatePlatforms();
    generateCoins();
    generateEnemies();
    generateFloors();
    generatePowerUps(); // Добавлено
    gameLoop();
}

let facingLeft = false;

function drawCharacter() {
    ctx.save();
    ctx.translate(-cameraOffset, 0);
    ctx.globalAlpha = invincible ? 0.4 : (coinInvincible ? 0.8 : 1.0);
    ctx.filter = coinInvincible ? 'brightness(1.8)' : 'none';

    const sprite = character.jumping || character.dy !== 0 ? jumpingSprite : characterSprite;
    if (character.dx < 0) {
        ctx.scale(-1, 1);
        ctx.drawImage(sprite, -character.x - character.width, character.y, -character.width, character.height);
    } else {
        ctx.drawImage(sprite, character.x, character.y, character.width, character.height);
    }

    ctx.restore();
    ctx.globalAlpha = 1.0;
    ctx.filter = 'none';
}

function drawObstacles() {
    ctx.save();
    ctx.translate(-cameraOffset, 0);
    obstacles.forEach(obstacle => {
        ctx.drawImage(shvabraSprite, obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    });
    ctx.restore();
}

function drawPlatforms() {
    ctx.save();
    ctx.translate(-cameraOffset, 0);
    platforms.forEach(platform => {
        ctx.drawImage(platformSprite, platform.x, platform.y, platform.width, platform.height);
    });
    ctx.restore();
}

function drawCoins() {
    ctx.save();
    ctx.translate(-cameraOffset, 0);
    coins.forEach(coin => {
        ctx.drawImage(coinSprite, coin.x - coin.radius, coin.y - coin.radius + coinOffset, coin.radius * 2.5, coin.radius * 2.5);
    });
    ctx.restore();
}

// Добавлено: функция отрисовки зелёных монеток
function drawPowerUps() {
    ctx.save();
    ctx.translate(-cameraOffset, 0);
    powerUps.forEach(powerUp => {
        if (powerUp.type === 'greenCoin') {
            ctx.drawImage(greenCoinSprite, powerUp.x, powerUp.y, powerUp.width, powerUp.height);
        }
    });
    ctx.restore();
}

function drawEnemies() {
    ctx.save();
    ctx.translate(-cameraOffset, 0);
    enemies.forEach(enemy => {
        ctx.drawImage(enemySprite, enemy.x, enemy.y, enemy.width, enemy.height);
    });
    ctx.restore();
}

function drawProjectiles() {
    ctx.save();
    ctx.translate(-cameraOffset, 0);
    ctx.fillStyle = 'blue';
    projectiles.forEach(projectile => {
        ctx.beginPath();
        ctx.arc(projectile.x, projectile.y, projectile.radius, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.restore();
}

function drawFloors() {
    ctx.save();
    ctx.translate(-cameraOffset, 0);
    ctx.fillStyle = '#D2B48C';
    floors.forEach(floor => {
        ctx.fillRect(floor.x, floor.y, floor.width, floor.height);
    });
    ctx.restore();
}

function drawBackground() {
    const bgWidth = canvas.width * 1.5; // Увеличенный фон для предотвращения мерцания
    ctx.save();
    ctx.translate(-cameraOffset, 0);
    ctx.drawImage(decorationSprite, -backgroundOffset, 0, bgWidth, canvas.height);
    ctx.drawImage(decorationSprite, bgWidth - backgroundOffset, 0, bgWidth, canvas.height);
    ctx.drawImage(decorationSprite, 2 * bgWidth - backgroundOffset, 0, bgWidth, canvas.height);
    ctx.restore();
}

function updateCharacter() {
    character.dy += gravity;
    character.y += character.dy;
    character.x += character.dx;

    if (character.y + character.height > canvas.height - 50) {
        character.y = canvas.height - 50 - character.height;
        character.dy = 0;
        character.jumping = false;
        character.jumpCount = 0;
        fallingThroughPlatform = false;
    }

    platforms.forEach(platform => {
        if (!fallingThroughPlatform && character.dy >= 0 && character.y + character.height > platform.y &&
            character.y + character.height < platform.y + platform.height &&
            character.x + character.width > platform.x &&
            character.x < platform.x + platform.width) {
            character.y = platform.y - character.height;
            character.dy = 0;
            character.jumping = false;
            character.jumpCount = 0;
        }
    });

    obstacles.forEach(obstacle => {
        if (isColliding(character, obstacle) && !invincible && !coinInvincible) {
            playSound(collisionSound);
            lives -= 1;
            invincible = true;
            invincibleTime = 120;
            if (lives <= 0) {
                character.isAlive = false;
                gameOver = true;
            }
        }
    });

    if (character.x < 0) {
        character.x = 0;
    }
    if (character.x + character.width > canvas.width) {
        character.x = canvas.width - character.width;
    }

    if (character.dy === 0) {
        fallingThroughPlatform = false;
    }
}

function isColliding(rect1, rect2) {
    const characterCollider = {
        x: rect1.x + 10,
        y: rect1.y + 10,
        width: rect1.width - 20,
        height: rect1.height - 20
    };
    return characterCollider.x < rect2.x + rect2.width &&
           characterCollider.x + characterCollider.width > rect2.x &&
           characterCollider.y < rect2.y + rect2.height &&
           characterCollider.y + characterCollider.height > rect2.y;
}

function collectCoins() {
    coins.forEach((coin, index) => {
        if (isColliding(character, {x: coin.x - coin.radius, y: coin.y - coin.radius + coinOffset, width: coin.radius * 2.5, height: coin.radius * 2.5})) {
            coins.splice(index, 1);
            score += 10;
            totalCoinsCollected += 1;

            if (totalCoinsCollected >= 20) { // Добавлено
                lives += 1;
                totalCoinsCollected = 0;
            }

            if (score % 100 === 0) {
                coinInvincible = true;
                coinInvincibleTime = 180;
            }
        }
    });

    powerUps.forEach((powerUp, index) => { // Добавлено
        if (isColliding(character, powerUp)) {
            if (powerUp.type === 'greenCoin') {
                powerUps.splice(index, 1);
                shootingEnabled = true;
                shootingTimer = 600; // 10 секунд при 60 FPS
            }
        }
    });
}

function hitEnemies() {
    enemies.forEach((enemy, index) => {
        if (isColliding(character, enemy)) {
            if (character.dy > 0) {
                enemies.splice(index, 1);
                score += 20;
                character.dy = -10;

                if (lives < 10) {
                    lives += 1;
                }
            } else if (!invincible && !coinInvincible) {
                playSound(collisionSound);
                lives -= 1;
                invincible = true;
                invincibleTime = 120;
                if (lives <= 0) {
                    character.isAlive = false;
                    gameOver = true;
                }
            }
        }
    });
}

function handleInvincibility() {
    if (invincible) {
        invincibleTime -= 1;
        if (invincibleTime <= 0) {
            invincible = false;
        }
    }

    if (coinInvincible) {
        coinInvincibleTime -= 1;
        if (coinInvincibleTime <= 0) {
            coinInvincible = false;
        }
    }
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function generateObstacles() {
    const obstacleInterval = 4000;
    setInterval(() => {
        if (Math.random() < 0.2) {
            const obstacle = {
                x: canvas.width + 1000, // Добавлен запас для появления объектов
                y: canvas.height - 120,
                width: 110,
                height: 140,
                speed: gameSpeed
            };
            obstacles.push(obstacle);
        }
    }, obstacleInterval);
}

function drawHUD() {
    for (let i = 0; i < lives; i++) {
        ctx.drawImage(healthSprite, 40 + i * 40, 20, 45, 40);
    }

    ctx.drawImage(expSprite, 15, 60, 170, 60);

    ctx.fillStyle = 'orange';
    ctx.font = 'bold 35px Arial';
    ctx.fillText(score, 155, 103);
}

function generatePlatforms() {
    function createPlatform() {
        const platform = {
            x: canvas.width + 1000, // Увеличен запас для появления объектов
            y: Math.random() < 0.1 ? canvas.height - 220 : canvas.height - 460,
            width: 100,
            height: 35,
            speed: gameSpeed
        };
        platforms.push(platform);

        const nextInterval = Math.random() * 1000 + 9000;
        setTimeout(createPlatform, nextInterval);
    }

    createPlatform();
}

function generateCoins() {
    for (let i = 0; i < 4; i++) {
        const coin = {
            x: canvas.width + i * 800 + 300, // Добавлен запас для появления объектов
            y: Math.random() < 0.5 ? canvas.height - 200 : canvas.height - 460,
            radius: 20
        };
        coins.push(coin);
    }
}

function generateEnemies() {
    for (let i = 0; i < 20; i++) {
        const enemy = {
            x: canvas.width + i * 750 + 1000, // Большой запас для появления объектов за экраном
            y: canvas.height - 150,
            width: 100,
            height: 100
        };
        enemies.push(enemy);
    }
}

function generateFloors() {
    const floorWidth = 1000; // Ширина одного сегмента пола
    const totalWidth = canvas.width * 10; // Увеличенный запас для появления объектов

    for (let i = 0; i < totalWidth / floorWidth; i++) {
        const floor = {
            x: i * floorWidth,
            y: canvas.height - 50,
            width: floorWidth,
            height: 50
        };
        floors.push(floor);
    }
}

// Добавлено: функция генерации power-ups
function generatePowerUps() {
    const powerUpInterval = 10000; // Интервал генерации каждые 10 секунд
    setInterval(() => {
        const powerUp = {
            x: canvas.width + 1000, // Позиция появления
            y: Math.random() < 0.5 ? canvas.height - 200 : canvas.height - 460,
            width: 30,
            height: 30,
            type: 'greenCoin' // Тип монетки
        };
        powerUps.push(powerUp);
    }, powerUpInterval);
}

function generateProjectiles() {
    enemies.forEach(enemy => {
        if (Math.random() < 0.005) { // Уменьшен шанс для баланса
            const projectile = {
                x: enemy.x,
                y: enemy.y + enemy.height / 2,
                radius: 5,
                dx: -3
            };
            projectiles.push(projectile);
        }
    });
}

function updateCoins() {
    if (coinOffset > 20 || coinOffset < -20) {
        coinDirection *= -1;
    }
    coinOffset += coinDirection * 0.5;
}

function updateEnemies() {
    enemies.forEach((enemy, index) => {
        if (Math.random() < 0.02) {
            enemy.dy = -15;
        }
        enemy.dy += gravity;
        enemy.y += enemy.dy;
        if (enemy.y + enemy.height > canvas.height - 50) {
            enemy.y = canvas.height - 50 - enemy.height;
            enemy.dy = 0;
        }

        enemy.x -= gameSpeed;

        // Удаление врагов, которые полностью вышли за границы экрана
        if (enemy.x + enemy.width <= 0) {
            enemies.splice(index, 1);
        }
    });
}

function drawEnemies() {
    ctx.save();
    ctx.translate(-cameraOffset, 0);
    enemies.forEach(enemy => {
        ctx.drawImage(enemySprite, enemy.x, enemy.y, enemy.width, enemy.height);
    });
    ctx.restore();

    console.log('Drawing enemies:', enemies.length); // Временный лог для проверки
}

function isCollidingWithVirtualCollider(projectile, rect) {
    const collider = {
        x: rect.x + 10,
        y: rect.y + 10,
        width: rect.width - 20,
        height: rect.height - 20
    };

    const distX = Math.abs(projectile.x - (collider.x + collider.width / 2));
    const distY = Math.abs(projectile.y - (collider.y + collider.height / 2));

    if (distX > (collider.width / 2 + projectile.radius) || distY > (collider.height / 2 + projectile.radius)) {
        return false;
    }

    if (distX <= (collider.width / 2) || distY <= (collider.height / 2)) {
        return true;
    }

    const dx = distX - collider.width / 2;
    const dy = distY - collider.height / 2;
    return (dx * dx + dy * dy <= (projectile.radius * projectile.radius));
}

function updateProjectiles() {
    projectiles.forEach((projectile, index) => {
        projectile.x += projectile.dx;
        if (projectile.x + projectile.radius < 0) {
            projectiles.splice(index, 1);
        }
        if (isCollidingWithCharacter(projectile, character) && !invincible && !coinInvincible) {
            playSound(collisionSound);
            lives -= 1;
            invincible = true;
            invincibleTime = 120;
            projectiles.splice(index, 1);
            if (lives <= 0) {
                character.isAlive = false;
                gameOver = true;
            }
        }
    });
}

function isCollidingWithCharacter(projectile, character) {
    const projectileCollider = {
        x: projectile.x - projectile.radius,
        y: projectile.y - projectile.radius,
        width: projectile.radius * 2,
        height: projectile.radius * 2
    };

    const characterCollider = {
        x: character.x,
        y: character.y,
        width: character.width,
        height: character.height
    };

    return isRectColliding(projectileCollider, characterCollider);
}

function isRectColliding(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

function updateCamera() {
    const centerX = canvas.width / 2;
    if (character.x > centerX) {
        cameraOffset = character.x - centerX;
    } else {
        cameraOffset = 0;
    }
}

function gameLoop() {
    clearCanvas();
    updateCamera();
    drawBackground();
    drawFloors();
    handleInvincibility();
    drawCharacter();
    drawObstacles();
    drawPlatforms();
    drawCoins();
    drawPowerUps(); // Добавлено
    drawEnemies();
    drawProjectiles();
    updateCharacter();
    collectCoins();
    hitEnemies();
    updateCoins();
    updateEnemies();
    updateProjectiles();
    autoShoot(); // Добавлено
    
    // Обновляем скорость игры
    updateGameSpeed();

    obstacles.forEach(obstacle => {
        obstacle.x -= gameSpeed;
    });

    platforms.forEach(platform => {
        platform.x -= gameSpeed;
    });

    coins.forEach(coin => {
        coin.x -= gameSpeed;
    });

    enemies.forEach(enemy => {
        enemy.x -= gameSpeed;
    });

    powerUps.forEach(powerUp => { // Добавлено
        powerUp.x -= gameSpeed;
    });

    floors.forEach(floor => {
        floor.x -= gameSpeed;
        if (floor.x + floor.width < 0) {
            floor.x = canvas.width;
        }
    });

    projectiles.forEach(projectile => {
        projectile.x -= gameSpeed;
    });

    backgroundOffset += gameSpeed / 20;
    if (backgroundOffset >= canvas.width * 1.5) {
        backgroundOffset = 0;
    }

    if (Math.random() < 0.01) generateObstacles();
    if (Math.random() < 0.01) generatePlatforms();
    if (Math.random() < 0.01) generateCoins();
    if (Math.random() < 0.01) generateEnemies();
    generateProjectiles();

    drawHUD();

    if (shootingEnabled && shootingTimer > 0) { // Добавлено
        // Показываем таймер или индикацию активации
        ctx.fillStyle = 'yellow';
        ctx.font = '20px Arial';
        ctx.fillText('Auto Shoot Active', 20, 100);
    }

    if (character.isAlive) {
        requestAnimationFrame(gameLoop);
    } else {
        ctx.drawImage(gameOverSprite, canvas.width / 2 - 100, canvas.height / 2 - 50, 200, 100);
    }
}

// Добавлено: функция автоматической стрельбы
function autoShoot() {
    if (shootingEnabled && shootingTimer > 0) {
        // Создаём снаряд
        const projectile = {
            x: character.x + character.width,
            y: character.y + character.height / 2,
            radius: 5,
            dx: 5
        };
        projectiles.push(projectile);
        playSound(shootSound); // Убедитесь, что у вас есть звук выстрела
        shootingTimer -= 1;
        if (shootingTimer <= 0) {
            shootingEnabled = false;
        }
    }
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'a' || e.key === 'ф' || e.key === 'A' || e.key === 'Ф') {
        character.dx = -character.speed;
    } else if (e.key === 'd' || e.key === 'в' || e.key === 'D' || e.key === 'В') {
        character.dx = character.speed;
    } else if (e.key === ' ' && character.jumpCount < character.maxJumps) {
        character.dy = -12;
        character.jumpCount++;
        character.jumping = true;
        playSound(jumpSound);
    } else if (e.key === ' ' && gameOver) {
        resetGame();
    } else if (e.key === 's' || e.key === 'ы' || e.key === 'S' || e.key === 'Ы') {
        fallingThroughPlatform = true;
    }
    // Добавлено: обработка клавиши для стрельбы
    else if (e.key === 'f' || e.key === 'Ф') {
        shoot();
    }
});

canvas.addEventListener('touchstart', (e) => {
    const touchX = e.touches[0].clientX;
    const touchY = e.touches[0].clientY;

    if (touchY > character.y + character.height) {
        fallingThroughPlatform = true;
    } else if (touchY < character.y) {
        if (character.jumpCount < character.maxJumps) {
            character.dy = -12;
            character.jumpCount++;
            character.jumping = true;
            playSound(jumpSound);
        }
    } else if (touchX < character.x) {
        character.dx = -character.speed;
    } else if (touchX > character.x + character.width) {
        character.dx = character.speed;
    }
});

canvas.addEventListener('touchend', (e) => {
    character.dx = 0;
});

// Добавлено: функция для ручной стрельбы
function shoot() {
    const projectile = {
        x: character.x + character.width,
        y: character.y + character.height / 2,
        radius: 5,
        dx: 5
    };
    projectiles.push(projectile);
    playSound(shootSound);
}

resetGame();

function playSound(sound) {
    sound.currentTime = 0;
    sound.play();
}
