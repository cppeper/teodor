const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ===================== Настройки игры =====================
const BASE_WIDTH = 1280; // Базовая ширина холста
const BASE_HEIGHT = 720; // Базовая высота холста

// Глобальные переменные игры
let gameSpeed = 4; // Инициализируем до использования в resizeCanvas

// Функция для определения мобильного устройства
function detectMobile() {
    return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Функция для динамического масштабирования холста
function resizeCanvas() {
    if (detectMobile()) {
        // Для мобильных устройств устанавливаем размер холста на весь экран
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        gameSpeed = 2; // Уменьшаем скорость для мобильных устройств
    } else {
        // Для десктопов устанавливаем базовые размеры
        canvas.width = BASE_WIDTH;
        canvas.height = BASE_HEIGHT;

        // Вычисляем масштаб
        const scale = Math.min(window.innerWidth / BASE_WIDTH, window.innerHeight / BASE_HEIGHT);

        // Применяем CSS-трансформацию для масштабирования холста
        canvas.style.transformOrigin = '0 0';
        canvas.style.transform = `scale(${scale})`;

        // Устанавливаем размеры через стили
        canvas.style.width = `${BASE_WIDTH * scale}px`;
        canvas.style.height = `${BASE_HEIGHT * scale}px`;

        gameSpeed = 4; // Стандартная скорость для десктопа
    }
}

// Инициализация размеров холста при загрузке
resizeCanvas();

// Добавляем обработчик события изменения размера окна
window.addEventListener('resize', resizeCanvas);

// ===================== Инициализация спрайтов и звуков =====================
const stumpSprite = document.getElementById('stumpSprite');
const gameOverSprite = document.getElementById('gameOverSprite');
const shvabraSprite = document.getElementById('shvabraSprite');
const jumpingSprite = document.getElementById('jumpingSprite');
const platformSprite = document.getElementById('platformSprite');
const characterSprite = document.getElementById('characterSprite');
const coinSprite = document.getElementById('coinSprite');
const greenCoinSprite = document.getElementById('greenCoinSprite'); // Новая спрайт для зелёных монет
const enemySprite = document.getElementById('enemySprite');
const decorationSprite = document.getElementById('decorationSprite');
const healthSprite = document.getElementById('healthSprite');
const expSprite = document.getElementById('expSprite');

const backgroundMusic = document.getElementById('backgroundMusic');
const jumpSound = document.getElementById('jumpSound');
const collisionSound = document.getElementById('collisionSound');
const shootSound = document.getElementById('shootSound'); // Спрайт для стрельбы
const enemyHitSound = document.getElementById('enemyHitSound'); // Спрайт для попадания во врага

// ===================== Глобальные переменные игры =====================
let tripleJump = false;
const gravity = 0.5;
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
let canShoot = false; // Флаг для возможности стрельбы
const playerBullets = []; // Массив для пуль, выпущенных игроком

// Герой
const character = {
    x: 50,
    y: BASE_HEIGHT - 150,
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
const projectiles = []; // Вражеские пули
const floors = [];

// ===================== Функция сброса игры =====================
function resetGame() {
    // Сброс параметров героя
    character.x = 50;
    character.y = BASE_HEIGHT - 150;
    character.dx = 0;
    character.dy = 0;
    character.isAlive = true;
    character.jumping = false;
    character.jumpCount = 0;

    // Сброс глобальных переменных
    gameSpeed = detectMobile() ? 2 : 4;
    score = 0;
    lives = 3;
    invincible = false;
    invincibleTime = 0;
    coinInvincible = false;
    coinInvincibleTime = 0;
    canShoot = false;
    gameOver = false;
    fallingThroughPlatform = false;
    cameraOffset = 0;
    backgroundOffset = 0;
    coinOffset = 0;
    coinDirection = 1;
    playerBullets.length = 0;

    // Очистка массивов игровых объектов
    obstacles.length = 0;
    platforms.length = 0;
    coins.length = 0;
    enemies.length = 0;
    projectiles.length = 0;
    floors.length = 0;

    // Генерация стартовых объектов
    generateFloors();
    generatePlatforms();
    generateCoins();
    generateEnemies();

    // Запуск фоновой музыки
    backgroundMusic.currentTime = 0;
    backgroundMusic.play();

    // Запуск игрового цикла
    requestAnimationFrame(gameLoop);
}

// ===================== Рисуем персонажа =====================
function drawCharacter() {
    ctx.save();
    ctx.translate(-cameraOffset, 0);
    // Эффект мигания при неуязвимости
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

// ===================== Рисуем препятствия =====================
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
        if (coin.type === 'normal') {
            ctx.drawImage(coinSprite, coin.x - coin.radius, coin.y - coin.radius + coinOffset, coin.radius * 2.5, coin.radius * 2.5);
        } else if (coin.type === 'green') {
            ctx.drawImage(greenCoinSprite, coin.x - coin.radius, coin.y - coin.radius + coinOffset, coin.radius * 2.5, coin.radius * 2.5);
        }
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

// ===================== Рисуем вражеские пули =====================
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

// ===================== Рисуем пули игрока =====================
function drawPlayerBullets() {
    ctx.save();
    ctx.translate(-cameraOffset, 0);
    ctx.fillStyle = 'white'; // Белые пули
    playerBullets.forEach(bullet => {
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.restore();
}

// ===================== Рисуем пол =====================
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
    const bgWidth = BASE_WIDTH * 1.5; // Увеличенный фон для предотвращения мерцания
    ctx.save();
    ctx.translate(-cameraOffset, 0);
    // Рисуем фон трижды, чтобы создать эффект бесконечного движения
    ctx.drawImage(decorationSprite, -backgroundOffset, 0, bgWidth, BASE_HEIGHT);
    ctx.drawImage(decorationSprite, bgWidth - backgroundOffset, 0, bgWidth, BASE_HEIGHT);
    ctx.drawImage(decorationSprite, 2 * bgWidth - backgroundOffset, 0, bgWidth, BASE_HEIGHT);
    ctx.restore();
}

// ===================== Обновление персонажа =====================
function updateCharacter() {
    character.dy += gravity;
    character.y += character.dy;
    character.x += character.dx;

    // Проверка столкновения с землёй (нижний край холста)
    if (character.y + character.height > BASE_HEIGHT - 50) {
        character.y = BASE_HEIGHT - 50 - character.height;
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

    // Проверка столкновения с препятствиями
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

    // Ограничиваем передвижение по оси X в пределах карты (удалено ограничение правой границы)
    if (character.x < 0) {
        character.x = 0;
    }

    if (character.dy === 0) {
        fallingThroughPlatform = false;
    }
}

// ===================== Проверка коллизии (прямоугольник с прямоугольником) =====================
function isColliding(rect1, rect2) {
    const adjustedRect1 = {
        x: rect1.x + 10,
        y: rect1.y + 10,
        width: rect1.width - 20,
        height: rect1.height - 20
    };
    return (
        adjustedRect1.x < rect2.x + rect2.width &&
        adjustedRect1.x + adjustedRect1.width > rect2.x &&
        adjustedRect1.y < rect2.y + rect2.height &&
        adjustedRect1.y + adjustedRect1.height > rect2.y
    );
}

// ===================== Проверка коллизии (круг с прямоугольником) =====================
function isCollidingCircleRect(circle, rect) {
    const distX = Math.abs(circle.x - rect.x - rect.width / 2);
    const distY = Math.abs(circle.y - rect.y - rect.height / 2);
    
    if (distX > (rect.width / 2 + circle.radius)) { return false; }
    if (distY > (rect.height / 2 + circle.radius)) { return false; }
    
    if (distX <= (rect.width / 2)) { return true; } 
    if (distY <= (rect.height / 2)) { return true; }
    
    const dx = distX - rect.width / 2;
    const dy = distY - rect.height / 2;
    return (dx * dx + dy * dy <= (circle.radius * circle.radius));
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
            if (coin.type === 'normal') {
                score += 10;
            } else if (coin.type === 'green') {
                score += 50; // Больше очков за зелёные монеты
                canShoot = true; // Включаем возможность стрельбы
                // Дополнительный эффект, например, увеличение скорости или временная неуязвимость
            }

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
            // Если персонаж падает сверху на врага
            if (character.dy > 0) {
                enemies.splice(index, 1);
                score += 20;
                character.dy = -10;

                // Дополнительная жизнь
                if (lives < 10) {
                    lives += 1;
                }
            } else if (!invincible && !coinInvincible) {
                // Если соприкоснулись не сверху
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
    ctx.clearRect(0, 0, BASE_WIDTH, BASE_HEIGHT);
}

// ===================== Генерация пола =====================
function generateFloors() {
    const floorWidth = 1000; // Ширина одного сегмента пола
    const totalWidth = BASE_WIDTH * 10; // Увеличенный запас для появления объектов

    for (let i = 0; i < totalWidth / floorWidth; i++) {
        const floor = {
            x: i * floorWidth,
            y: BASE_HEIGHT - 50,
            width: floorWidth,
            height: 50
        };
        floors.push(floor);
    }
}

// ===================== Генерация препятствий =====================
function generateObstacles() {
    const obstacle = {
        x: BASE_WIDTH + Math.random() * 1000, // Добавлен случайный запас
        y: BASE_HEIGHT - 120,
        width: 110,
        height: 140,
        speed: gameSpeed
    };
    obstacles.push(obstacle);
}

// ===================== Генерация платформ =====================
function generatePlatforms() {
    const platform = {
        x: BASE_WIDTH + Math.random() * 1000, // Добавлен случайный запас
        y: Math.random() < 0.5 ? BASE_HEIGHT - 220 : BASE_HEIGHT - 460,
        width: 100,
        height: 35,
        speed: gameSpeed
    };
    platforms.push(platform);
}

// ===================== Генерация монет =====================
function generateCoins() {
    for (let i = 0; i < 4; i++) {
        const type = Math.random() < 0.2 ? 'green' : 'normal'; // 20% зелёных монет
        const coin = {
            x: BASE_WIDTH + i * 800 + 300, // Добавлен запас для появления объектов
            y: Math.random() < 0.5 ? BASE_HEIGHT - 200 : BASE_HEIGHT - 460,
            radius: 10, // Уменьшил радиус для меньшего размера
            type: type
        };
        coins.push(coin);
    }
}

// ===================== Генерация врагов =====================
function generateEnemies() {
    for (let i = 0; i < 5; i++) { // Уменьшил количество для оптимизации
        const enemy = {
            x: BASE_WIDTH + i * 750 + 1000, // Большой запас для появления объектов за экраном
            y: BASE_HEIGHT - 150,
            width: 100,
            height: 100,
            dy: 0
        };
        enemies.push(enemy);
    }
}

// ===================== Генерация вражеских пуль =====================
function generateProjectiles() {
    enemies.forEach(enemy => {
        if (Math.random() < 0.005) { // Небольшой шанс, что враг выстрелит
            const projectile = {
                x: enemy.x,
                y: enemy.y + enemy.height / 2,
                radius: 3, // Уменьшил радиус для меньшего размера
                dx: -5 // Увеличил скорость пули
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
        if (enemy.y + enemy.height > BASE_HEIGHT - 50) {
            enemy.y = BASE_HEIGHT - 50 - enemy.height;
            enemy.dy = 0;
        }
        // Если враг вышел за левый край, удаляем его
        if (enemy.x + enemy.width <= 0) {
            enemies.splice(index, 1);
        }
    });
}

// ===================== Обновление вражеских пуль =====================
function updateProjectiles() {
    projectiles.forEach((projectile, index) => {
        projectile.x += projectile.dx;
        // Если снаряд вышел за левый край, удаляем
        if (projectile.x + projectile.radius < 0) {
            projectiles.splice(index, 1);
        }
        // Проверка столкновения со героем
        if (isCollidingCircleRect(projectile, character) && !invincible && !coinInvincible) {
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

// ===================== Обновление пуль игрока =====================
function updatePlayerBullets() {
    playerBullets.forEach((bullet, index) => {
        bullet.x += bullet.dx;
        // Удаляем пули, вышедшие за правый край экрана
        if (bullet.x - bullet.radius > BASE_WIDTH + cameraOffset) {
            playerBullets.splice(index, 1);
        }
    });
}

// ===================== Проверка столкновений пуль игрока с врагами =====================
function handleBulletCollisions() {
    playerBullets.forEach((bullet, bIndex) => {
        enemies.forEach((enemy, eIndex) => {
            if (isCollidingCircleRect(bullet, enemy)) {
                // Удаляем пульку и врага
                playerBullets.splice(bIndex, 1);
                enemies.splice(eIndex, 1);
                score += 30; // Увеличиваем счёт за уничтожение врага
                playSound(enemyHitSound); // Воспроизводим звук попадания
            }
        });
    });
}

// ===================== Сбор зелёных монет и стрельба =====================
function shootBullet() {
    const bullet = {
        x: character.x + character.width, // Начальная позиция пули
        y: character.y + character.height / 2,
        radius: 5, // Размер пули
        dx: 10 // Скорость пули
    };
    playerBullets.push(bullet);
    playSound(shootSound); // Воспроизводим звук стрельбы
}

// ===================== Обновление камеры =====================
function updateCamera() {
    const centerX = BASE_WIDTH / 2;
    if (character.x > centerX) {
        cameraOffset = character.x - centerX;
    } else {
        cameraOffset = 0;
    }
}

// ===================== HUD (жизни, очки) =====================
function drawHUD() {
    // Рисуем жизни
    for (let i = 0; i < lives; i++) {
        ctx.drawImage(healthSprite, 40 + i * 40, 20, 45, 40);
    }

    // Рисуем опыт или другую информацию
    ctx.drawImage(expSprite, 15, 60, 170, 60);

    // Рисуем очки
    ctx.fillStyle = 'orange';
    ctx.font = 'bold 35px Arial';
    ctx.fillText(score, 155, 103);
}

// ===================== Главный игровой цикл =====================
let animationFrameId; // Для управления анимацией

function gameLoop() {
    if (gameOver) {
        // Отрисовка экрана Game Over
        clearCanvas();
        drawBackground();
        drawFloors();
        ctx.drawImage(gameOverSprite, BASE_WIDTH / 2 - 100, BASE_HEIGHT / 2 - 50, 200, 100);
        return; // Прерываем игровой цикл
    }

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
    drawPlayerBullets();
    drawHUD();

    updateCharacter();
    collectCoins();
    hitEnemies();
    updateCoins();
    updateEnemies();
    updateProjectiles();
    updatePlayerBullets();
    handleBulletCollisions();

    // Обновляем скорость игры
    updateGameSpeed();

    // Двигаем объекты
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
            floor.x = BASE_WIDTH;
        }
    });

    projectiles.forEach(projectile => {
        projectile.x -= gameSpeed;
    });

    playerBullets.forEach(bullet => {
        bullet.x -= gameSpeed;
    });

    // Смещение фона
    backgroundOffset += gameSpeed / 20;
    if (backgroundOffset >= BASE_WIDTH * 1.5) {
        backgroundOffset = 0;
    }

    // Запрашиваем следующий кадр
    animationFrameId = requestAnimationFrame(gameLoop);
}

// ===================== Генерация игровых объектов через setInterval =====================

// Генерация препятствий (швабр)
const obstacleInterval = 4000; // каждые 4 секунды
setInterval(() => {
    if (Math.random() < 0.8) { // Увеличил вероятность спауна
        generateObstacles();
    }
}, obstacleInterval);

// Генерация платформ
const platformInterval = 5000; // каждые 5 секунд
setInterval(() => {
    generatePlatforms();
}, platformInterval);

// Генерация монет
const coinInterval = 3000; // каждые 3 секунды
setInterval(() => {
    generateCoins();
}, coinInterval);

// Генерация врагов
const enemyInterval = 7000; // каждые 7 секунд
setInterval(() => {
    generateEnemies();
}, enemyInterval);

// ===================== Управление с клавиатуры =====================
document.addEventListener('keydown', (e) => {
    if (e.key === 'a' || e.key === 'ф' || e.key === 'A' || e.key === 'Ф') {
        character.dx = -character.speed;
    } else if (e.key === 'd' || e.key === 'в' || e.key === 'D' || e.key === 'В') {
        character.dx = character.speed;
    } else if ((e.key === ' ' || e.key === 'Spacebar') && character.jumpCount < character.maxJumps) {
        character.dy = -12;
        character.jumpCount++;
        character.jumping = true;
        playSound(jumpSound);
    } else if ((e.key === 'f' || e.key === 'F') && canShoot && !gameOver) { // Клавиша для стрельбы
        shootBullet();
    } else if ((e.key === 'p' || e.key === 'P') && !gameOver) { // Клавиша паузы
        togglePause();
    } else if ((e.key === ' ' || e.key === 'Spacebar') && gameOver) {
        resetGame();
    } else if (e.key === 's' || e.key === 'ы' || e.key === 'S' || e.key === 'Ы') {
        fallingThroughPlatform = true;
    }
});

// Обработчик отпускания клавиш (для остановки движения)
document.addEventListener('keyup', (e) => {
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
    const touchX = e.touches[0].clientX - canvas.getBoundingClientRect().left;
    const touchY = e.touches[0].clientY - canvas.getBoundingClientRect().top;

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

canvas.addEventListener('touchend', () => {
    character.dx = 0;
});

// ===================== Добавление кнопок паузы и меню =====================
function addControlButtons() {
    // Создаём кнопку паузы
    const pauseButton = document.createElement('button');
    pauseButton.innerText = 'Пауза';
    pauseButton.style.position = 'absolute';
    pauseButton.style.top = '20px';
    pauseButton.style.right = '20px';
    pauseButton.style.padding = '10px 20px';
    pauseButton.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
    pauseButton.style.border = 'none';
    pauseButton.style.borderRadius = '5px';
    pauseButton.style.cursor = 'pointer';
    pauseButton.style.zIndex = '10';
    document.body.appendChild(pauseButton);

    // Создаём кнопку меню
    const menuButton = document.createElement('button');
    menuButton.innerText = 'Меню';
    menuButton.style.position = 'absolute';
    menuButton.style.top = '20px';
    menuButton.style.left = '20px';
    menuButton.style.padding = '10px 20px';
    menuButton.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
    menuButton.style.border = 'none';
    menuButton.style.borderRadius = '5px';
    menuButton.style.cursor = 'pointer';
    menuButton.style.zIndex = '10';
    document.body.appendChild(menuButton);

    // Обработчик паузы
    pauseButton.addEventListener('click', () => {
        togglePause();
    });

    // Обработчик меню (можно расширить функциональность)
    menuButton.addEventListener('click', () => {
        alert('Меню игры:\n1. Продолжить\n2. Рестарт');
        // Здесь можно добавить реальное меню
    });
}

// ===================== Функция паузы =====================
let isPaused = false;
function togglePause() {
    isPaused = !isPaused;
    if (isPaused) {
        backgroundMusic.pause();
        cancelAnimationFrame(animationFrameId);
        // Изменяем текст кнопки
        const pauseButton = document.querySelector('button');
        if (pauseButton) pauseButton.innerText = 'Продолжить';
    } else {
        backgroundMusic.play();
        gameLoop();
        // Изменяем текст кнопки
        const pauseButton = document.querySelector('button');
        if (pauseButton) pauseButton.innerText = 'Пауза';
    }
}

// ===================== Функция проигрывания звука =====================
function playSound(sound) {
    if (sound) { // Проверяем, определён ли звук
        sound.currentTime = 0;
        sound.play();
    }
}

// ===================== Запуск игры при загрузке страницы =====================
window.onload = () => {
    addControlButtons();
    resetGame();
};
