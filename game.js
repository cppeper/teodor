const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    const scale = Math.min(window.innerWidth / canvas.width, window.innerHeight / canvas.height);
    canvas.style.transformOrigin = '0 0'; // Set the transform origin to top left
    canvas.style.transform = `scale(${scale})`; // Scale the canvas
    canvas.style.width = `${canvas.width * scale}px`;
    canvas.style.height = `${canvas.height * scale}px`;
}

function detectMobile() {
    return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
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

let tripleJump = false; // Флаг тройного прыжка
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
let coinInvincible = false; // Флаг неуязвимости после сбора монет
let coinInvincibleTime = 0; // Время неуязвимости после сбора монет
let doubleJump = false; // Флаг двойного прыжка
let gameOver = false;   // Флаг окончания игры
let fallingThroughPlatform = false; // Флаг для отслеживания падения через платформу

const character = {
    x: 50,
    y: canvas.height - 150,
    width: 85 увеличенный размер персонажа
    height: 110, // увеличенный размер персонажа
    dx: 0,
    dy: 0,
    speed: 10, // увеличенная скорость персонажа для большей динамики
    jumping: false,
    isAlive: true,
    jumpCount: 0, // Добавлено для отслеживания количества прыжков
    maxJumps: 3  // Максимальное количество прыжков (тройной прыжок)
};

const obstacles = []; // Массив для препятствий (шипы)
const platforms = []; // Массив для платформ
const coins = [];     // Массив для монет
const enemies = [];   // Массив для врагов
const projectiles = []; // Массив для снарядов
const floors = [];    // Массив для пола

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
    doubleJump = false;
    tripleJump = false;
    backgroundOffset = 0;
    generateObstacles();
    generatePlatforms();
    generateCoins();
    generateEnemies();
    generateFloors();
    gameLoop();
}

let facingLeft = false; // Отслеживание направления, в котором смотрит персонаж

function drawCharacter() {
    ctx.save(); // Сохраните текущее состояние контекста

    if (invincible) {
        ctx.globalAlpha = 0.4; // Прозрачность при неуязвимости после коллизии
    } else if (coinInvincible) {
        ctx.globalAlpha = 0.8;
        ctx.filter = 'brightness(1.8)'; // Желтый цвет при неуязвимости после сбора монет
    } else {
        ctx.globalAlpha = 1.0;
        ctx.filter = 'none';
    }

    // Определение, нужно ли менять направление персонажа
    if (character.dx < 0 && !facingLeft) {
        facingLeft = true;
    } else if (character.dx > 0 && facingLeft) {
        facingLeft = false;
    }

    // Отображение персонажа с учетом направления
    if (facingLeft) {
        ctx.scale(-1, 1); // Отразите по горизонтали
        if (character.jumping || character.dy !== 0) {
            ctx.drawImage(jumpingSprite, -character.x - character.width, character.y, -character.width, character.height);
        } else {
            ctx.drawImage(characterSprite, -character.x - character.width, character.y, -character.width, character.height);
        }
    } else {
        ctx.scale(1, 1); // Нормальное отображение
        if (character.jumping || character.dy !== 0) {
            ctx.drawImage(jumpingSprite, character.x, character.y, character.width, character.height);
        } else {
            ctx.drawImage(characterSprite, character.x, character.y, character.width, character.height);
        }
    }

    ctx.restore(); // Восстановите состояние контекста
    ctx.globalAlpha = 1.0; // Сброс прозрачности
    ctx.filter = 'none'; // Сброс фильтра
}

function drawObstacles() {
    obstacles.forEach(obstacle => {
        ctx.drawImage(shvabraSprite, obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    });
}

function drawPlatforms() {
    platforms.forEach(platform => {
        ctx.drawImage(platformSprite, platform.x, platform.y, platform.width, platform.height);
    });
}

function drawCoins() {
    coins.forEach(coin => {
        ctx.drawImage(coinSprite, coin.x - coin.radius, coin.y - coin.radius + coinOffset, coin.radius * 2.5, coin.radius * 2.5); // увеличенные монеты
    });
}

function drawEnemies() {
    enemies.forEach(enemy => {
        ctx.drawImage(enemySprite, enemy.x, enemy.y, enemy.width, enemy.height);
    });
}

function drawProjectiles() {
    ctx.fillStyle = 'blue';
    projectiles.forEach(projectile => {
        ctx.beginPath();
        ctx.arc(projectile.x, projectile.y, projectile.radius, 0, Math.PI * 2);
        ctx.fill();
    });
}

function drawFloors() {
    ctx.fillStyle = '#D2B48C'; // Цвет, соответствующий RGB (72, 97, 34)
    floors.forEach(floor => {
        ctx.fillRect(floor.x, floor.y, floor.width, floor.height);
    });
}

function drawBackground() {
    const bgWidth = canvas.width * 1.2; // увеличенный фон для уменьшения швов
    ctx.drawImage(decorationSprite, -backgroundOffset, 0, bgWidth, canvas.height);
    ctx.drawImage(decorationSprite, bgWidth - backgroundOffset, 0, bgWidth, canvas.height);
    ctx.drawImage(decorationSprite, 2 * bgWidth - backgroundOffset, 0, bgWidth, canvas.height);
}

function updateCharacter() {
    character.dy += gravity;
    character.y += character.dy;
    character.x += character.dx;

    if (character.y + character.height > canvas.height - 50) {
        character.y = canvas.height - 50 - character.height;
        character.dy = 0;
        character.jumping = false;
        character.jumpCount = 0;  // Сброс счетчика прыжков
        fallingThroughPlatform = false; // Сброс флага при касании пола
    }

    platforms.forEach(platform => {
        if (!fallingThroughPlatform && character.dy >= 0 && character.y + character.height > platform.y &&
            character.y + character.height < platform.y + platform.height &&
            character.x + character.width > platform.x &&
            character.x < platform.x + platform.width) {
            character.y = platform.y - character.height;
            character.dy = 0;
            character.jumping = false;
            character.jumpCount = 0;  // Сброс счетчика прыжков
        }
    });

    obstacles.forEach(obstacle => {
        if (isColliding(character, obstacle) && !invincible && !coinInvincible) {
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

    // Сброс флага `fallingThroughPlatform`, если персонаж не падает
    if (character.dy === 0) {
        fallingThroughPlatform = false;
    }
}

function isColliding(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

function collectCoins() {
    coins.forEach((coin, index) => {
        if (isColliding(character, {x: coin.x - coin.radius, y: coin.y - coin.radius + coinOffset, width: coin.radius * 2.5, height: coin.radius * 2.5})) {
            coins.splice(index, 1);
            score += 50;

            if (score % 100 === 0) {
                coinInvincible = true;
                coinInvincibleTime = 240; //
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
                character.dy = -10; // Make character jump up after hitting an enemy

                if (lives < 10) { // Проверка, чтобы жизни не превышали максимальное значение
                    lives += 1;
                }
            } else if (!invincible && !coinInvincible) {
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
    const obstacleInterval = 4500; // Интервал генерации препятствий в миллисекундах
    setInterval(() => {
        if (Math.random() < 0.2) { // Уменьшена вероятность появления препятствий
            const obstacle = {
                x: canvas.width,
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

    ctx.drawImage(expSprite, 15, 60, 170, 60); // Увеличен размер изображения

    ctx.fillStyle = 'orange'; // Изменен цвет на оранжевый
    ctx.font = 'bold 35px Arial'; // Увеличен размер и сделан жирным
    ctx.fillText(score, 155, 103);
}

function generatePlatforms() {
    function createPlatform() {
        const platform = {
            x: canvas.width,
            y: Math.random() < 0.1 ? canvas.height - 220 : canvas.height - 460, // Некоторые платформы будут выше
            width: 100,
            height: 35,
            speed: gameSpeed
        };
        platforms.push(platform);

        const nextInterval = Math.random() * 2000 + 9000; // от 3 до 8 секунд
        setTimeout(createPlatform, nextInterval);
    }

    createPlatform();
}

function generateCoins() {
    for (let i = 0; i < 4; i++) { // уменьшено количество монет
        const coin = {
            x: canvas.width + i * 400,
            y: canvas.height - 200,
            radius: 20 // увеличенный размер монет
        };
        coins.push(coin);
    }
}

function generateEnemies() {
    for (let i = 0; i < 17; i++) {
        const enemy = {
            x: canvas.width + i * 450, // увеличенное количество врагов
            y: canvas.height - 150,
            width: 100, // увеличенный размер врагов
            height: 100 // увеличенный размер врагов
        };
        enemies.push(enemy);
    }
}

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

function updateCoins() {
    if (coinOffset > 20 || coinOffset < -20) {
        coinDirection *= -1;
    }
    coinOffset += coinDirection * 0.5;
}

function updateEnemies() {
    enemies.forEach(enemy => {
        if (Math.random() < 0.02) {
            enemy.dy = -15;
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

    backgroundOffset += gameSpeed / 20;
    if (backgroundOffset >= canvas.width * 1.3) {
        backgroundOffset = 0;
    }

    if (Math.random() < 0.01) generateObstacles();
    if (Math.random() < 0.01) generatePlatforms();
    if (Math.random() < 0.01) generateCoins();
    if (Math.random() < 0.01) generateEnemies();
    generateProjectiles();

    drawHUD();

    if (character.isAlive) {
        requestAnimationFrame(gameLoop);
    } else {
        ctx.drawImage(gameOverSprite, canvas.width / 2 - 100, canvas.height / 2 - 50, 200, 100);
    }
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'a' || e.key === 'ф' || e.key === 'A' || e.key === 'Ф') {
        character.dx = -character.speed;
    } else if (e.key === 'd' || e.key === 'в' || e.key === 'D' || e.key === 'В') {
        character.dx = character.speed;
    } else if (e.key === ' ' && character.jumpCount < character.maxJumps) {
        character.dy = -12; // уменьшенная сила прыжка
        character.jumpCount++;
        character.jumping = true;
        playSound(jumpSound);
    } else if (e.key === ' ' && gameOver) {
        resetGame();
    } else if (e.key === 's' || e.key === 'ы' || e.key === 'S' || e.key === 'Ы') {
        fallingThroughPlatform = true; // Устанавливаем флаг для падения через платформу
    }
});

canvas.addEventListener('touchstart', (e) => {
    const touchX = e.touches[0].clientX;
    const touchY = e.touches[0].clientY;

    if (touchY > character.y + character.height) {
        fallingThroughPlatform = true; // Устанавливаем флаг для падения через платформу при тапе вниз
    } else if (touchY < character.y) {
        if (character.jumpCount < character.maxJumps) {
            character.dy = -12; // уменьшенная сила прыжка
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

/**
 * Запуск игры
 */
resetGame();

function playSound(sound) {
    sound.currentTime = 0;
    sound.play();
}
