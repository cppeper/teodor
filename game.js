// ===================== Основные настройки холста и контекста =====================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Функция для определения мобильного устройства
function detectMobile() {
    return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Функция для динамического масштабирования
function resizeCanvas() {
    // Если мобильное устройство, то просто подгоняем размер холста под размер экрана
    if (detectMobile()) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    } else {
        // Иначе - используем трансформацию: исходно canvas может быть, скажем, 1280×720
        // и мы подгоняем его пропорционально размеру окна
        const originalWidth = 1280;  // Можно менять под вашу игру
        const originalHeight = 720;  // Можно менять под вашу игру

        // Ставим "базовый" размер холста (здесь чтобы не ломался рендер при ресайзе)
        canvas.width = originalWidth;
        canvas.height = originalHeight;

        // Вычисляем масштаб, чтобы вписать игру в текущий размер окна
        const scale = Math.min(window.innerWidth / originalWidth, window.innerHeight / originalHeight);

        // Применяем CSS-трансформацию
        canvas.style.transformOrigin = '0 0';
        canvas.style.transform = `scale(${scale})`;

        // Можно уточнить размеры через стили (но для коллизий используйте всё равно canvas.width/height!)
        canvas.style.width = `${originalWidth * scale}px`;
        canvas.style.height = `${originalHeight * scale}px`;
    }
}

// Сразу вызываем resizeCanvas при загрузке страницы
resizeCanvas();

// Если хотим реагировать на ресайз окна в реальном времени, раскомментируйте:
// window.addEventListener('resize', resizeCanvas);

// ===================== Глобальные переменные игры =====================
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

// Изображения и звуки
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

// Герой
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

// ===================== Функция сброса игры =====================
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

    // Генерируем стартовый набор
    generateFloors();
    // Немного начальных объектов
    generateCoins();
    generateEnemies();
    generatePlatforms();

    // Запускаем игровой цикл
    gameLoop();
}

// ===================== Рисуем персонажа =====================
function drawCharacter() {
    ctx.save();
    ctx.translate(-cameraOffset, 0);

    // Если персонаж неуязвим, меняем прозрачность/фильтр
    ctx.globalAlpha = invincible ? 0.4 : (coinInvincible ? 0.8 : 1.0);
    ctx.filter = coinInvincible ? 'brightness(1.8)' : 'none';

    const sprite = (character.jumping || character.dy !== 0) ? jumpingSprite : characterSprite;

    // Проверяем направление
    if (character.dx < 0) {
        // Отражение по оси X
        ctx.scale(-1, 1);
        ctx.drawImage(
            sprite,
            -character.x - character.width,
            character.y,
            -character.width,
            character.height
        );
    } else {
        ctx.drawImage(
            sprite,
            character.x,
            character.y,
            character.width,
            character.height
        );
    }

    // Возвращаем настройки
    ctx.restore();
    ctx.globalAlpha = 1.0;
    ctx.filter = 'none';
}

// ===================== Рисуем препятствия (швабры) =====================
function drawObstacles() {
    ctx.save();
    ctx.translate(-cameraOffset, 0);
    obstacles.forEach(obstacle => {
        ctx.drawImage(shvabraSprite, obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    });
    ctx.restore();
}

// ===================== Рисуем платформы =====================
function drawPlatforms() {
    ctx.save();
    ctx.translate(-cameraOffset, 0);
    platforms.forEach(platform => {
        ctx.drawImage(platformSprite, platform.x, platform.y, platform.width, platform.height);
    });
    ctx.restore();
}

// ===================== Рисуем монеты =====================
function drawCoins() {
    ctx.save();
    ctx.translate(-cameraOffset, 0);
    coins.forEach(coin => {
        ctx.drawImage(
            coinSprite,
            coin.x - coin.radius,
            coin.y - coin.radius + coinOffset,
            coin.radius * 2.5,
            coin.radius * 2.5
        );
    });
    ctx.restore();
}

// ===================== Рисуем врагов =====================
function drawEnemies() {
    ctx.save();
    ctx.translate(-cameraOffset, 0);
    enemies.forEach(enemy => {
        ctx.drawImage(enemySprite, enemy.x, enemy.y, enemy.width, enemy.height);
    });
    ctx.restore();
}

// ===================== Рисуем снаряды (projectiles) =====================
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

// ===================== Рисуем пол (floors) =====================
function drawFloors() {
    ctx.save();
    ctx.translate(-cameraOffset, 0);
    ctx.fillStyle = '#D2B48C';
    floors.forEach(floor => {
        ctx.fillRect(floor.x, floor.y, floor.width, floor.height);
    });
    ctx.restore();
}

// ===================== Рисуем фон =====================
function drawBackground() {
    // Чтобы не было разрывов, делаем фон чуть шире (x1.5 от canvas)
    const bgWidth = canvas.width * 1.5;
    ctx.save();
    ctx.translate(-cameraOffset, 0);
    // Три подряд идущих блока фона
    ctx.drawImage(decorationSprite, -backgroundOffset, 0, bgWidth, canvas.height);
    ctx.drawImage(decorationSprite, bgWidth - backgroundOffset, 0, bgWidth, canvas.height);
    ctx.drawImage(decorationSprite, 2 * bgWidth - backgroundOffset, 0, bgWidth, canvas.height);
    ctx.restore();
}

// ===================== Обновление персонажа =====================
function updateCharacter() {
    character.dy += gravity;
    character.y += character.dy;
    character.x += character.dx;

    // Проверка столкновения с «землёй» (нижний край)
    if (character.y + character.height > canvas.height - 50) {
        character.y = canvas.height - 50 - character.height;
        character.dy = 0;
        character.jumping = false;
        character.jumpCount = 0;
        fallingThroughPlatform = false;
    }

    // Проверка столкновения с платформами
    platforms.forEach(platform => {
        if (
            !fallingThroughPlatform &&
            character.dy >= 0 &&
            character.y + character.height > platform.y &&
            character.y + character.height < platform.y + platform.height &&
            character.x + character.width > platform.x &&
            character.x < platform.x + platform.width
        ) {
            character.y = platform.y - character.height;
            character.dy = 0;
            character.jumping = false;
            character.jumpCount = 0;
        }
    });

    // Столкновение с препятствиями
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

    // Ограничиваем передвижение по X в пределах canvas
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

// ===================== Проверка коллизии (прямоугольник с прямоугольником) =====================
function isColliding(rect1, rect2) {
    const characterCollider = {
        x: rect1.x + 10,
        y: rect1.y + 10,
        width: rect1.width - 20,
        height: rect1.height - 20
    };
    return (
        characterCollider.x < rect2.x + rect2.width &&
        characterCollider.x + characterCollider.width > rect2.x &&
        characterCollider.y < rect2.y + rect2.height &&
        characterCollider.y + characterCollider.height > rect2.y
    );
}

// ===================== Сбор монет =====================
function collectCoins() {
    coins.forEach((coin, index) => {
        const coinRect = {
            x: coin.x - coin.radius,
            y: coin.y - coin.radius + coinOffset,
            width: coin.radius * 2.5,
            height: coin.radius * 2.5
        };
        if (isColliding(character, coinRect)) {
            coins.splice(index, 1);
            score += 10;

            // Каждые 100 очков даём короткую неуязвимость
            if (score % 100 === 0) {
                coinInvincible = true;
                coinInvincibleTime = 180;
            }
        }
    });
}

// ===================== Атака (прыжок) на врагов =====================
function hitEnemies() {
    enemies.forEach((enemy, index) => {
        if (isColliding(character, enemy)) {
            // Если упали сверху на врага
            if (character.dy > 0) {
                enemies.splice(index, 1);
                score += 20;
                // Отскакиваем после удара
                character.dy = -10;
                // Доп. жизнь
                if (lives < 10) {
                    lives += 1;
                }
            } else if (!invincible && !coinInvincible) {
                // Если соприкоснулись, но не сверху
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

// ===================== Обработка неуязвимости =====================
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

// ===================== Полная очистка холста =====================
function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// ===================== Генерация пола =====================
function generateFloors() {
    const floorWidth = 1000; // ширина одного сегмента пола
    const totalWidth = canvas.width * 10; // запас

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

// ===================== Генерация некоторых объектов (начальный «буст») =====================
function generateObstacles() {
    // Препятствие (швабра)
    const obstacle = {
        x: canvas.width + 1000,
        y: canvas.height - 120,
        width: 110,
        height: 140
    };
    obstacles.push(obstacle);
}
function generatePlatforms() {
    const platform = {
        x: canvas.width + 1000,
        y: Math.random() < 0.1 ? canvas.height - 220 : canvas.height - 460,
        width: 100,
        height: 35
    };
    platforms.push(platform);
}
function generateCoins() {
    // Пример: 4 монетки на разной высоте
    for (let i = 0; i < 4; i++) {
        const coin = {
            x: canvas.width + i * 300 + 300,
            y: Math.random() < 0.5 ? canvas.height - 200 : canvas.height - 460,
            radius: 20
        };
        coins.push(coin);
    }
}
function generateEnemies() {
    for (let i = 0; i < 5; i++) {
        const enemy = {
            x: canvas.width + i * 750 + 1000,
            y: canvas.height - 150,
            width: 100,
            height: 100,
            dy: 0
        };
        enemies.push(enemy);
    }
}

// ===================== Генерация снарядов (враги «стреляют») =====================
function generateProjectiles() {
    enemies.forEach(enemy => {
        // Небольшой шанс, что враг выстрелит
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

// ===================== Обновление монет (эффект плавания) =====================
function updateCoins() {
    if (coinOffset > 20 || coinOffset < -20) {
        coinDirection *= -1;
    }
    coinOffset += coinDirection * 0.5;
}

// ===================== Обновление врагов =====================
function updateEnemies() {
    enemies.forEach((enemy, index) => {
        // Случайный «прыжок» врага
        if (Math.random() < 0.02) {
            enemy.dy = -15;
        }
        enemy.dy += gravity;
        enemy.y += enemy.dy;
        if (enemy.y + enemy.height > canvas.height - 50) {
            enemy.y = canvas.height - 50 - enemy.height;
            enemy.dy = 0;
        }
        // Если ушёл далеко за левый край — удаляем
        if (enemy.x + enemy.width <= 0) {
            enemies.splice(index, 1);
        }
    });
}

// ===================== Проверка коллизии снаряда и персонажа =====================
function updateProjectiles() {
    projectiles.forEach((projectile, index) => {
        projectile.x += projectile.dx;
        // Если снаряд вышел за левый край, удаляем
        if (projectile.x + projectile.radius < 0) {
            projectiles.splice(index, 1);
        }
        // Проверка столкновения со героем
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

// Прямоугольник для снаряда
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
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}

// ===================== Обновление камеры =====================
function updateCamera() {
    const centerX = canvas.width / 2;
    if (character.x > centerX) {
        cameraOffset = character.x - centerX;
    } else {
        cameraOffset = 0;
    }
}

// ===================== HUD (жизни, очки) =====================
function drawHUD() {
    for (let i = 0; i < lives; i++) {
        ctx.drawImage(healthSprite, 40 + i * 40, 20, 45, 40);
    }

    ctx.drawImage(expSprite, 15, 60, 170, 60);

    ctx.fillStyle = 'orange';
    ctx.font = 'bold 35px Arial';
    ctx.fillText(score, 155, 103);
}

// ===================== Функция линейного роста скорости =====================
function updateGameSpeed() {
    // Линейное увеличение скорости до 4 раз
    const maxMultiplier = 4;
    const scoreFactor = 1000; // Чем меньше, тем быстрее растёт скорость
    const multiplier = Math.min(1 + score / scoreFactor, maxMultiplier);
    gameSpeed = 4 * multiplier;
}

// ===================== Единая функция спауна объектов по времени =====================
let obstacleSpawnTimer = 0;
let obstacleSpawnInterval = 3000; // раз в 3с
let platformSpawnTimer = 0;
let platformSpawnInterval = 5000; // раз в 5с
let coinSpawnTimer = 0;
let coinSpawnInterval = 4500; // раз в 4.5с
let enemySpawnTimer = 0;
let enemySpawnInterval = 7000; // раз в 7с

function spawnGameObjects(deltaTime) {
    // Увеличиваем таймеры
    obstacleSpawnTimer += deltaTime;
    platformSpawnTimer += deltaTime;
    coinSpawnTimer += deltaTime;
    enemySpawnTimer += deltaTime;

    // Проверка, не пора ли заспаунить препятствие
    if (obstacleSpawnTimer >= obstacleSpawnInterval) {
        generateObstacles();
        obstacleSpawnTimer = 0;
    }
    // Платформа
    if (platformSpawnTimer >= platformSpawnInterval) {
        generatePlatforms();
        platformSpawnTimer = 0;
    }
    // Монеты
    if (coinSpawnTimer >= coinSpawnInterval) {
        generateCoins();
        coinSpawnTimer = 0;
    }
    // Враги
    if (enemySpawnTimer >= enemySpawnInterval) {
        generateEnemies();
        enemySpawnTimer = 0;
    }
}

// ===================== Главный игровой цикл =====================
let lastTimestamp = 0;
function gameLoop(timestamp = 0) {
    // Разница во времени между кадрами (для спауна)
    const deltaTime = timestamp - lastTimestamp;
    lastTimestamp = timestamp;

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

    // Обновляем скорость
    updateGameSpeed();

    // Двигаем объекты
    obstacles.forEach((obstacle, index) => {
        obstacle.x -= gameSpeed;
        // Удаляем, если ушёл за экран
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
        if (coin.x + coin.radius * 2 < 0) {
            coins.splice(index, 1);
        }
    });
    enemies.forEach((enemy) => {
        enemy.x -= gameSpeed;
    });
    floors.forEach((floor, index) => {
        floor.x -= gameSpeed;
        // Перекидываем пол, чтобы казалось, что он бесконечный
        if (floor.x + floor.width < 0) {
            floor.x = (floors.length - 1) * floor.width;
        }
    });
    projectiles.forEach((projectile) => {
        projectile.x -= 0; // здесь - не трогаем по gameSpeed, если не хотите ускорять полёт
    });

    // Смещение фона
    backgroundOffset += gameSpeed / 20;
    const bgMax = canvas.width * 1.5;
    if (backgroundOffset >= bgMax) {
        backgroundOffset = 0;
    }

    // Генерация объектов (спауним в одном месте)
    spawnGameObjects(deltaTime);
    // Генерируем «выстрелы» врагов
    generateProjectiles();

    drawHUD();

    // Проверяем, жив ли персонаж
    if (character.isAlive) {
        requestAnimationFrame(gameLoop);
    } else {
        ctx.drawImage(gameOverSprite, canvas.width / 2 - 100, canvas.height / 2 - 50, 200, 100);
    }
}

// ===================== Управление с клавиатуры =====================
document.addEventListener('keydown', (e) => {
    // Для надёжности лучше e.code, но оставим e.key
    if (e.key === 'a' || e.key === 'ф' || e.key === 'A' || e.key === 'Ф') {
        character.dx = -character.speed;
    } else if (e.key === 'd' || e.key === 'в' || e.key === 'D' || e.key === 'В') {
        character.dx = character.speed;
    } else if ((e.key === ' ' || e.key === 'Spacebar') && character.jumpCount < character.maxJumps) {
        character.dy = -12;
        character.jumpCount++;
        character.jumping = true;
        playSound(jumpSound);
    } else if ((e.key === ' ' || e.key === 'Spacebar') && gameOver) {
        // Рестарт
        resetGame();
    } else if (e.key === 's' || e.key === 'ы' || e.key === 'S' || e.key === 'Ы') {
        fallingThroughPlatform = true;
    }
});

document.addEventListener('keyup', (e) => {
    // Останавливаем движение по оси X, когда отпускаем клавишу
    if (
        e.key === 'a' || e.key === 'ф' || 
        e.key === 'A' || e.key === 'Ф' ||
        e.key === 'd' || e.key === 'в' ||
        e.key === 'D' || e.key === 'В'
    ) {
        character.dx = 0;
    }
});

// ===================== Управление с тач-событий (мобильные) =====================
canvas.addEventListener('touchstart', (e) => {
    const touchX = e.touches[0].clientX;
    const touchY = e.touches[0].clientY;

    // Если тап ниже персонажа
    if (touchY > character.y + character.height) {
        fallingThroughPlatform = true;
    } else if (touchY < character.y) {
        // Прыжок
        if (character.jumpCount < character.maxJumps) {
            character.dy = -12;
            character.jumpCount++;
            character.jumping = true;
            playSound(jumpSound);
        }
    } else if (touchX < character.x) {
        // Движение влево
        character.dx = -character.speed;
    } else if (touchX > character.x + character.width) {
        // Движение вправо
        character.dx = character.speed;
    }
});

canvas.addEventListener('touchend', () => {
    character.dx = 0;
});

// ===================== Функция проигрывания звука =====================
function playSound(sound) {
    sound.currentTime = 0;
    sound.play();
}

// ===================== Запуск игры при загрузке страницы =====================
resetGame();
