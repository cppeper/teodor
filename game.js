const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const stumpSprite = document.getElementById('stumpSprite');
const gameOverSprite = document.getElementById('gameOverSprite');

stumpSprite.onload = () => console.log("Stump sprite loaded");
gameOverSprite.onload = () => console.log("Game Over sprite loaded");


const gravity = 0.5;  // Гравитация для персонажа и врагов
let gameSpeed = 4;   // Скорость игры, увеличена для большей динамики
let score = 0;       // Текущий счет
let backgroundOffset = 0;  // Смещение фона для эффекта движения
let coinOffset = 0;  // Смещение для анимации монет
let coinDirection = 1; // Направление движения монет
let enemyDirection = 1; // Направление движения врагов
let lives = 3;       // Количество жизней персонажа
let invincible = false; // Флаг неуязвимости персонажа после столкновения
let invincibleTime = 0; // Время неуязвимости

let doubleJump = false; // Флаг двойного прыжка
let gameOver = false;   // Флаг окончания игры

const characterSprite = document.getElementById('characterSprite');
const coinSprite = document.getElementById('coinSprite');
const enemySprite = document.getElementById('enemySprite');
const decorationSprite = document.getElementById('decorationSprite');

const backgroundMusic = document.getElementById('backgroundMusic');
const jumpSound = document.getElementById('jumpSound');
const collisionSound = document.getElementById('collisionSound');

backgroundMusic.play();

const character = {
    x: 50,
    y: canvas.height - 150,
    width: 100, // увеличенный размер персонажа
    height: 100, // увеличенный размер персонажа
    dx: 0,
    dy: 0,
    speed: 8, // увеличенная скорость персонажа для большей динамики
    jumping: false,
    isAlive: true
};

const obstacles = []; // Массив для препятствий (шипы)
const platforms = []; // Массив для платформ
const coins = [];     // Массив для монет
const enemies = [];   // Массив для врагов
const projectiles = []; // Массив для снарядов
const floors = [];    // Массив для пола

/**
 * Функция для сброса игры до начального состояния
 */
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
    obstacles.length = 0;
    platforms.length = 0;
    coins.length = 0;
    enemies.length = 0;
    projectiles.length = 0;
    floors.length = 0;
    gameOver = false;
    doubleJump = false;
    backgroundOffset = 0;
    generateObstacles();
    generatePlatforms();
    generateCoins();
    generateEnemies();
    generateFloors();
    gameLoop();
}

/**
 * Функция для отрисовки персонажа
 */
function drawCharacter() {
    ctx.drawImage(characterSprite, character.x, character.y, character.width, character.height);
}

/**
 * Функция для отрисовки шипов (препятствий)
 */
 
function drawObstacles() {
    ctx.fillStyle = 'red';
    obstacles.forEach(obstacle => {
        ctx.beginPath();
        ctx.moveTo(obstacle.x, obstacle.y + obstacle.height);
        ctx.lineTo(obstacle.x + obstacle.width / 2, obstacle.y);
        ctx.lineTo(obstacle.x + obstacle.width, obstacle.y + obstacle.height);
        ctx.closePath();
        ctx.fill();
    });
}

/**
 * Функция для отрисовки платформ
 */
function drawPlatforms() {
    ctx.fillStyle = 'gray';
    platforms.forEach(platform => {
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
    });
}

/**
 * Функция для отрисовки монет
 */
function drawCoins() {
    coins.forEach(coin => {
        ctx.drawImage(coinSprite, coin.x - coin.radius, coin.y - coin.radius + coinOffset, coin.radius * 2.5, coin.radius * 2.5); // увеличенные монеты
    });
}

/**
 * Функция для отрисовки врагов
 */
function drawEnemies() {
    enemies.forEach(enemy => {
        ctx.drawImage(enemySprite, enemy.x, enemy.y, enemy.width, enemy.height);
    });
}

/**
 * Функция для отрисовки снарядов
 */
function drawProjectiles() {
    ctx.fillStyle = 'blue';
    projectiles.forEach(projectile => {
        ctx.beginPath();
        ctx.arc(projectile.x, projectile.y, projectile.radius, 0, Math.PI * 2);
        ctx.fill();
    });
}

/**
 * Функция для отрисовки пола
 */
function drawFloors() {
    ctx.fillStyle = 'green';
    floors.forEach(floor => {
        ctx.fillRect(floor.x, floor.y, floor.width, floor.height);
    });
}

/**
 * Функция для отрисовки фона
 */
function drawBackground() {
    const bgWidth = canvas.width * 1.2; // увеличенный фон для уменьшения швов
    ctx.drawImage(decorationSprite, -backgroundOffset, 0, bgWidth, canvas.height);
    ctx.drawImage(decorationSprite, bgWidth - backgroundOffset, 0, bgWidth, canvas.height);
    ctx.drawImage(decorationSprite, 2 * bgWidth - backgroundOffset, 0, bgWidth, canvas.height);
}

/**
 * Функция для обновления состояния персонажа
 */
function updateCharacter() {
    character.dy += gravity;
    character.y += character.dy;
    character.x += character.dx;

    if (character.y + character.height > canvas.height - 50) {
        character.y = canvas.height - 50 - character.height;
        character.dy = 0;
        character.jumping = false;
        doubleJump = false;
    }

    platforms.forEach(platform => {
        if (character.y + character.height > platform.y &&
            character.y + character.height < platform.y + platform.height &&
            character.x + character.width > platform.x &&
            character.x < platform.x + platform.width) {
            character.y = platform.y - character.height;
            character.dy = 0;
            character.jumping = false;
            doubleJump = false;
        }
    });

    obstacles.forEach(obstacle => {
        if (isColliding(character, obstacle) && !invincible) {
            playSound(collisionSound);
            lives -= 1;
            invincible = true;
            invincibleTime = 120; // 2 seconds of invincibility
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
}

/**
 * Функция для проверки коллизий
 */
function isColliding(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

/**
 * Функция для сбора монет
 */
function collectCoins() {
    coins.forEach((coin, index) => {
        if (isColliding(character, {x: coin.x - coin.radius, y: coin.y - coin.radius + coinOffset, width: coin.radius * 2.5, height: coin.radius * 2.5})) {
            coins.splice(index, 1);
            score += 10;
        }
    });
}

/**
 * Функция для обработки коллизий с врагами
 */
function hitEnemies() {
    enemies.forEach((enemy, index) => {
        if (isColliding(character, enemy)) {
            if (character.dy > 0) {
                enemies.splice(index, 1);
                score += 20;
                character.dy = -10; // Make character jump up after hitting an enemy
            } else if (!invincible) {
                playSound(collisionSound);
                lives -= 1;
                invincible = true;
                invincibleTime = 120; // 2 seconds of invincibility
                if (lives <= 0) {
                    character.isAlive = false;
                    gameOver = true;
                }
            }
        }
    });
}

/**
 * Функция для обработки неуязвимости персонажа после столкновения
 */
function handleInvincibility() {
    if (invincible) {
        invincibleTime -= 1;
        if (invincibleTime <= 0) {
            invincible = false;
        }
        if (invincibleTime % 20 < 10) {
            ctx.globalAlpha = 0.5; // Make character blink
        } else {
            ctx.globalAlpha = 1.0;
        }
    } else {
        ctx.globalAlpha = 1.0;
    }
}

/**
 * Функция для очистки канваса
 */
function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

/**
 * Функция для генерации препятствий (шипов)
 */
function generateObstacles() {
    for (let i = 0; i < 3; i++) {
        const obstacle = {
            x: canvas.width + i * 800, // уменьшенное количество шипов
            y: canvas.height - 100,
            width: 50,
            height: 50
        };
        obstacles.push(obstacle);
    }
}

/**
 * Функция для генерации платформ
 */
function generatePlatforms() {
    for (let i = 0; i < 3; i++) { // уменьшено количество платформ
        const platform = {
            x: canvas.width + i * 600,
            y: canvas.height - 200,
            width: 100,
            height: 10
        };
        platforms.push(platform);
    }
}

/**
 * Функция для генерации монет
 */
function generateCoins() {
    for (let i = 0; i < 5; i++) { // уменьшено количество монет
        const coin = {
            x: canvas.width + i * 400,
            y: canvas.height - 200,
            radius: 20 // увеличенный размер монет
        };
        coins.push(coin);
    }
}

/**
 * Функция для генерации врагов
 */
function generateEnemies() {
    for (let i = 0; i < 15; i++) {
        const enemy = {
            x: canvas.width + i * 300, // увеличенное количество врагов
            y: canvas.height - 150,
            width: 100, // увеличенный размер врагов
            height: 100 // увеличенный размер врагов
        };
        enemies.push(enemy);
    }
}

/**
 * Функция для генерации пола
 */
function generateFloors() {
    for (let i = 0; i < 20; i++) { // увеличено количество пола для бесконечности
        const floor = {
            x: i * 300,
            y: canvas.height - 50,
            width: 300,
            height: 50
        };
        floors.push(floor);
    }
}

/**
 * Функция для генерации снарядов, которые враги будут бросать
 */
function generateProjectiles() {
    enemies.forEach(enemy => {
        if (Math.random() < 0.005) { // уменьшенная вероятность генерации снаряда
            const projectile = {
                x: enemy.x,
                y: enemy.y + enemy.height / 2,
                radius: 5,
                dx: -3 // скорость снаряда
            };
            projectiles.push(projectile);
        }
    });
}

/**
 * Функция для обновления состояния монет (анимация)
 */
function updateCoins() {
    if (coinOffset > 20 || coinOffset < -20) {
        coinDirection *= -1;
    }
    coinOffset += coinDirection * 0.5;
}

/**
 * Функция для обновления состояния врагов (движение и прыжки)
 */
function updateEnemies() {
    enemies.forEach(enemy => {
        if (Math.random() < 0.01) {
            enemy.dy = -10;
        }
        enemy.dy += gravity;
        enemy.y += enemy.dy;
        if (enemy.y + enemy.height > canvas.height - 50) {
            enemy.y = canvas.height - 50 - enemy.height;
            enemy.dy = 0;
        }
        enemy.x += enemyDirection * 2;
        if (enemy.x > canvas.width || enemy.x < 0) {
            enemyDirection *= -1;
        }
    });
}

/**
 * Функция для проверки коллизий снаряда с виртуальным коллайдером персонажа
 */
function isCollidingWithVirtualCollider(projectile, rect) {
    const collider = {
        x: rect.x + 10, // Смещение коллайдера
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

/**
/**
/**
 * Функция для обновления состояния снарядов (движение и удаление вне экрана)
 */
function updateProjectiles() {
    projectiles.forEach((projectile, index) => {
        projectile.x += projectile.dx;
        if (projectile.x + projectile.radius < 0) {
            projectiles.splice(index, 1);
        }
        if (isCollidingWithCharacter(projectile, character) && !invincible) {
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

/**
 * Функция для проверки коллизий снаряда с персонажем
 */
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

/**
 * Функция для проверки коллизий двух прямоугольников
 */
function isRectColliding(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

function gameLoop() {
    clearCanvas();
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

    floors.forEach(floor => {
        floor.x -= gameSpeed;
        if (floor.x + floor.width < 0) {
            floor.x = canvas.width;
        }
    });

    projectiles.forEach(projectile => {
        projectile.x -= gameSpeed;
    });

    backgroundOffset += gameSpeed / 2;
    if (backgroundOffset >= canvas.width * 1.2) {
        backgroundOffset = 0;
    }

    if (Math.random() < 0.01) generateObstacles();
    if (Math.random() < 0.01) generatePlatforms();
    if (Math.random() < 0.01) generateCoins();
    if (Math.random() < 0.01) generateEnemies();
    generateProjectiles();

    ctx.fillStyle = 'black';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${score}`, 10, 30);
    ctx.fillText(`Lives: ${lives}`, 10, 60);

    if (character.isAlive) {
        requestAnimationFrame(gameLoop);
    } else {
        ctx.drawImage(gameOverSprite, canvas.width / 2 - 100, canvas.height / 2 - 50, 200, 100);
    }
}

/**
 * Обработчик событий для управления персонажем
 */
document.addEventListener('keydown', (e) => {
    if (e.key === 'a' || e.key === 'ф' || e.key === 'A' || e.key === 'Ф') {
        character.dx = -character.speed;
    } else if (e.key === 'd' || e.key === 'в' || e.key === 'D' || e.key === 'В') {
        character.dx = character.speed;
    } else if (e.key === ' ' && !character.jumping) {
        character.dy = -12; // уменьшенная сила прыжка
        character.jumping = true;
        playSound(jumpSound);
    } else if (e.key === ' ' && character.jumping && !doubleJump) {
        character.dy = -12; // уменьшенная сила прыжка для двойного прыжка
        doubleJump = true;
        playSound(jumpSound);
    } else if (e.key === ' ' && gameOver) {
        resetGame();
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'a' || e.key === 'd' || e.key === 'ф' || e.key === 'в' || e.key === 'A' || e.key === 'D' || e.key === 'Ф' || e.key === 'В') {
        character.dx = 0;
    }
});

/**
 * Обработчик для сенсорного управления
 */
canvas.addEventListener('touchstart', (e) => {
    const touchX = e.touches[0].clientX;
    const touchY = e.touches[0].clientY;

    if (touchX > character.x && touchX < character.x + character.width && touchY > character.y && touchY < character.y + character.height) {
        if (!character.jumping) {
            character.dy = -12; // уменьшенная сила прыжка
            character.jumping = true;
            playSound(jumpSound);
        } else if (character.jumping && !doubleJump) {
            character.dy = -12; // уменьшенная сила прыжка для двойного прыжка
            doubleJump = true;
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

/**
 * Запуск игры
 */
resetGame();

function playSound(sound) {
    sound.currentTime = 0;
    sound.play();
}
