// Получаем доступ к холсту и контексту
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Функция для изменения размера холста
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

// Функция для определения мобильного устройства
function detectMobile() {
    return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Инициализация холста
if (detectMobile()) {
    resizeCanvas();
}
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Загрузка изображений и звуков
const stumpSprite = document.getElementById('stumpSprite');
const gameOverSprite = document.getElementById('gameOverSprite');
const shvabraSprite = document.getElementById('shvabraSprite');
const jumpingSprite = document.getElementById('jumpingSprite');
const platformSprite = document.getElementById('platformSprite');
const characterSprite = document.getElementById('characterSprite');
const coinSprite = document.getElementById('coinSprite');
const enemySprite = document.getElementById('enemySprite');
const decorationSprite = document.getElementById('decorationSprite');
const healthSprite = document.getElementById('healthSprite');
const expSprite = document.getElementById('expSprite');

const backgroundMusic = document.getElementById('backgroundMusic');
const jumpSound = document.getElementById('jumpSound');
const collisionSound = document.getElementById('collisionSound');

// Глобальные переменные игры
const gravity = 0.5;
let gameSpeed = 4;
let score = 0;
let backgroundOffset = 0;
let coinOffset = 0;
let coinAnimationFrame = 0;
let lives = 3;
let invincible = false;
let invincibleTime = 0;
let coinInvincible = false;
let coinInvincibleTime = 0;
let gameOver = false;
let fallingThroughPlatform = false;
let cameraOffset = 0;

// Объект персонажа
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

// Массивы игровых объектов
const obstacles = [];
const platforms = [];
const coins = [];
const enemies = [];
const projectiles = [];
const floors = [];

// Функция сброса игры
function resetGame() {
    character.x = 50;
    character.y = canvas.height - 150;
    character.dx = 0;
    character.dy = 0;
    character.isAlive = true;
    gameSpeed = 4;
    score = 0;
    lives = 3;
    invincible = false;
    invincibleTime = 0;
    coinInvincible = false;
    coinInvincibleTime = 0;
    obstacles.length = 0;
    platforms.length = 0;
    coins.length = 0;
    enemies.length = 0;
    projectiles.length = 0;
    floors.length = 0;
    gameOver = false;
    backgroundOffset = 0;
    cameraOffset = 0;
    generateFloors();
    generateObstacles();
    generatePlatforms();
    generateCoins();
    generateEnemies();
    gameLoop();
}

// Создание холста для фона для оптимизации
let backgroundCanvas = document.createElement('canvas');
backgroundCanvas.width = canvas.width * 1.5; // Увеличенный фон для предотвращения мерцания
backgroundCanvas.height = canvas.height;
let backgroundCtx = backgroundCanvas.getContext('2d');

// Отрисовка статичного фона один раз
function drawStaticBackground() {
    backgroundCtx.drawImage(decorationSprite, 0, 0, backgroundCanvas.width, backgroundCanvas.height);
}
drawStaticBackground();

// Функция отрисовки фона
function drawBackground() {
    ctx.save();
    ctx.translate(-cameraOffset % backgroundCanvas.width, 0);
    ctx.drawImage(backgroundCanvas, 0, 0);
    ctx.drawImage(backgroundCanvas, backgroundCanvas.width, 0);
    ctx.restore();
}

// Функция отрисовки персонажа
function drawCharacter() {
    ctx.save();
    ctx.translate(-cameraOffset, 0);
    ctx.globalAlpha = invincible ? 0.4 : (coinInvincible ? 0.8 : 1.0);
    ctx.filter = coinInvincible ? 'brightness(1.8)' : 'none';

    const sprite = character.jumping || character.dy !== 0 ? jumpingSprite : characterSprite;
    if (character.dx < 0) {
        ctx.scale(-1, 1);
        ctx.drawImage(sprite, -character.x - character.width, character.y, character.width, character.height);
    } else {
        ctx.drawImage(sprite, character.x, character.y, character.width, character.height);
    }

    ctx.restore();
    ctx.globalAlpha = 1.0;
    ctx.filter = 'none';
}

// Функция отрисовки препятствий
function drawObstacles() {
    ctx.save();
    ctx.translate(-cameraOffset, 0);
    obstacles.forEach(obstacle => {
        ctx.drawImage(shvabraSprite, obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    });
    ctx.restore();
}

// Функция отрисовки платформ
function drawPlatforms() {
    ctx.save();
    ctx.translate(-cameraOffset, 0);
    platforms.forEach(platform => {
        ctx.drawImage(platformSprite, platform.x, platform.y, platform.width, platform.height);
    });
    ctx.restore();
}

// Функция отрисовки монет
function drawCoins() {
    ctx.save();
    ctx.translate(-cameraOffset, 0);
    coins.forEach(coin => {
        ctx.drawImage(coinSprite, coin.x - coin.radius, coin.y - coin.radius + coinOffset, coin.radius * 2.5, coin.radius * 2.5);
    });
    ctx.restore();
}

// Функция отрисовки врагов
function drawEnemies() {
    ctx.save();
    ctx.translate(-cameraOffset, 0);
    enemies.forEach(enemy => {
        ctx.drawImage(enemySprite, enemy.x, enemy.y, enemy.width, enemy.height);
    });
    ctx.restore();
}

// Функция отрисовки снарядов
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

// Функция отрисовки пола
function drawFloors() {
    ctx.save();
    ctx.translate(-cameraOffset, 0);
    ctx.fillStyle = '#D2B48C';
    floors.forEach(floor => {
        ctx.fillRect(floor.x, floor.y, floor.width, floor.height);
    });
    ctx.restore();
}

// Функция обновления персонажа
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

// Функция проверки столкновения
function isColliding(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// Функция сбора монет
function collectCoins() {
    coins.forEach((coin, index) => {
        if (isColliding(character, {
            x: coin.x - coin.radius,
            y: coin.y - coin.radius + coinOffset,
            width: coin.radius * 2.5,
            height: coin.radius * 2.5
        })) {
            coins.splice(index, 1);
            score += 10;

            if (score % 100 === 0) {
                coinInvincible = true;
                coinInvincibleTime = 180;
            }
        }
    });
}

// Функция обработки столкновений с врагами
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

// Функция обработки неуязвимости
function handleInvincibility() {
    if (invincible) {
        invincibleTime--;
        if (invincibleTime <= 0) {
            invincible = false;
        }
    }
    if (coinInvincible) {
        coinInvincibleTime--;
        if (coinInvincibleTime <= 0) {
            coinInvincible = false;
        }
    }
}

// Функция очистки холста
function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// Функция генерации препятствий с ограничением их количества
function generateObstacles() {
    if (obstacles.length < 5 && Math.random() < 0.02) {
        const obstacle = {
            x: canvas.width + 1000,
            y: canvas.height - 120,
            width: 110,
            height: 140,
            speed: gameSpeed
        };
        obstacles.push(obstacle);
    }
}

// Функция отрисовки HUD (жизни и счёт)
function drawHUD() {
    for (let i = 0; i < lives; i++) {
        ctx.drawImage(healthSprite, 40 + i * 40, 20, 45, 40);
    }

    ctx.drawImage(expSprite, 15, 60, 170, 60);

    ctx.fillStyle = 'orange';
    ctx.font = 'bold 35px Arial';
    ctx.fillText(score, 155, 103);
}

// Функция генерации платформ
function generatePlatforms() {
    if (platforms.length < 5 && Math.random() < 0.02) {
        const platform = {
            x: canvas.width + 1000,
            y: Math.random() < 0.5 ? canvas.height - 220 : canvas.height - 460,
            width: 100,
            height: 35,
            speed: gameSpeed
        };
        platforms.push(platform);
    }
}

// Функция генерации монет
function generateCoins() {
    if (coins.length < 10 && Math.random() < 0.02) {
        const coin = {
            x: canvas.width + 1000,
            y: Math.random() < 0.5 ? canvas.height - 200 : canvas.height - 460,
            radius: 20
        };
        coins.push(coin);
    }
}

// Функция генерации врагов
function generateEnemies() {
    if (enemies.length < 5 && Math.random() < 0.01) {
        const enemy = {
            x: canvas.width + 1000,
            y: canvas.height - 150,
            width: 100,
            height: 100,
            dy: 0
        };
        enemies.push(enemy);
    }
}

// Функция генерации пола
function generateFloors() {
    const floorWidth = 1000;
    const totalWidth = canvas.width * 10;

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

// Функция генерации снарядов
function generateProjectiles() {
    enemies.forEach(enemy => {
        if (Math.random() < 0.005) {
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

// Функция обновления монет с плавной анимацией
function updateCoins() {
    coinAnimationFrame += 0.1;
    coinOffset = Math.sin(coinAnimationFrame) * 10;
}

// Функция обновления врагов
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

        if (enemy.x + enemy.width < 0) {
            enemies.splice(index, 1);
        }
    });
}

// Функция обновления снарядов
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

// Функция проверки столкновения с персонажем
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

    return isColliding(projectileCollider, characterCollider);
}

// Функция обновления камеры
function updateCamera() {
    const centerX = canvas.width / 2;
    if (character.x > centerX) {
        cameraOffset = character.x - centerX;
    } else {
        cameraOffset = 0;
    }
}

// Основной игровой цикл
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
    drawEnemies();
    drawProjectiles();
    updateCharacter();
    collectCoins();
    hitEnemies();
    updateCoins();
    updateEnemies();
    updateProjectiles();
    updateGameSpeed();

    updateObstacles();
    updatePlatforms();

    obstacles.forEach((obstacle, index) => {
        obstacle.x -= gameSpeed;
        if (obstacle.x + obstacle.width < 0) {
            obstacles.splice(index, 1);
        }
    });

    platforms.forEach((platform, index) => {
        platform.x -= gameSpeed;
        if (platform.x + platform.width < 0) {
            platforms.splice(index, 1);
        }
    });

    coins.forEach((coin, index) => {
        coin.x -= gameSpeed;
        if (coin.x + coin.radius * 2.5 < 0) {
            coins.splice(index, 1);
        }
    });

    floors.forEach(floor => {
        floor.x -= gameSpeed;
        if (floor.x + floor.width < 0) {
            floor.x = canvas.width;
        }
    });

    backgroundOffset += gameSpeed / 20;
    if (backgroundOffset >= backgroundCanvas.width) {
        backgroundOffset = 0;
    }

    generateObstacles();
    generatePlatforms();
    generateCoins();
    generateEnemies();
    generateProjectiles();

    drawHUD();

    if (character.isAlive) {
        requestAnimationFrame(gameLoop);
    } else {
        ctx.drawImage(gameOverSprite, canvas.width / 2 - 100, canvas.height / 2 - 50, 200, 100);
    }
}

// Обработчик нажатия клавиш
document.addEventListener('keydown', (e) => {
    if (e.repeat) return; // Игнорировать повторные события при удержании клавиши
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
});

// Обработчик отпускания клавиш
document.addEventListener('keyup', (e) => {
    if (
        e.key === 'a' || e.key === 'ф' || e.key === 'A' || e.key === 'Ф' ||
        e.key === 'd' || e.key === 'в' || e.key === 'D' || e.key === 'В'
    ) {
        character.dx = 0;
    }
});

// Обработчик сенсорного ввода
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

// Обработчик окончания сенсорного ввода
canvas.addEventListener('touchend', (e) => {
    character.dx = 0;
});

// Функция воспроизведения звука
function playSound(sound) {
    const clone = sound.cloneNode();
    clone.play();
}

// Функция обновления скорости игры
function updateGameSpeed() {
    const maxMultiplier = 4;
    const scoreFactor = 1000;
    const multiplier = Math.min(1 + score / scoreFactor, maxMultiplier);
    gameSpeed = 4 * multiplier;
}

// Запуск игры
resetGame();
