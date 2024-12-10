// let radius = 200; // Радиус окружности
let radius; // Радиус окружности в зависимости от размера элемента холста
// let ballSize = 20; // Размер шара
let ballSize; // Размер шара в зависимости от размера элемента холста
let arcSize; // Размер дуги (угол в радианах)
let arcPos; // Начало дуги
let gravity = 0.1; // Гравитация
let initialSpeed = 7; // Начальная скорость
let ballIsFree = false; // Флаг для проверки вылета шарика из окружности
let ballIsInFigure = false; // Флаг для проверки вылета шарика из окружности
let timerElement; // Элемент таймера
let timer = 0; // Таймер попытки
let maxTime = 4; // Максимальное время (в секундах)
let ballColors = ["red", "blue", "green", "yellow", "purple"]; // Цвета шариков
let balls = []; // Массив всех шариков (включая замороженные)

let trail; // Массив шариков для трейла (а вернее позиций шариков)
let trailLength = 10; // Длина трейла (в шариках)
let trailSizeMult = 1; // Число, на которое умножается размер шарика при создании трейла
let trailColor; // Цвет трейла
let trailColorAlpha = 30; // Непрозрачность трейла
let doTrailDecrease = false; // Размер шариков трейла будет уменьшаться ближе к концу трейла

let activeBall; // Текущий активный шарик
let HitCircle;
let frozen;
let HitBall;
let Success;

let timerId; // Для плавного угасания трейла
let timerIdTimeOut; // Для отмены запуска функций после фриза при ресете



// создаём холст/полотно с размерами элемента-родителя
const canvasWrapperDiv = document.getElementById('canvas-wrapper');
const canvasWrapperWidth = canvasWrapperDiv.offsetWidth;
const canvasWrapperHeight = canvasWrapperDiv.offsetHeight;


const radiusSliderMax = Math.min(canvasWrapperWidth, canvasWrapperHeight) / 2; // Максимальный радиус окружности для слайдера
const radiusSliderMin = radiusSliderMax / 10; // Минимальный радиус окружности для слайдера

document.getElementById('radius-slider').min = radiusSliderMin;
document.getElementById('radius-slider').max = radiusSliderMax;


const ballRadiusSliderMax = radiusSliderMax / 5; // Максимальный радиус шариков для слайдера
const ballRadiusSliderMin = radiusSliderMin / 5; // Минимальный радиус шариков для слайдера

document.getElementById('ball-radius-slider').min = ballRadiusSliderMin;
document.getElementById('ball-radius-slider').max = ballRadiusSliderMax;



function preload() {
    soundFormats('wav', 'mp3');
    HitCircle = loadSound("sounds/hitCircle.wav");
    frozen = loadSound("sounds/frozen.wav");
    HitBall = loadSound("sounds/hitBall.wav");
    Success = loadSound("sounds/success.wav");
}

function setup() {
    // создаём холст/полотно с размерами элемента-родителя
    const canvas = createCanvas(canvasWrapperWidth, canvasWrapperHeight);

    canvas.parent(document.getElementById('canvas-wrapper'));

    timerElement = document.getElementById('timer');
    generateArcPos(); // Генерация позиции маленького шара
    spawnNewBall(); // Создаём первый шарик

    radius = Math.min(canvasWrapperWidth, canvasWrapperHeight) / 3; // Начальный радиус окружности

    ballSize = radius / 5; // Начальный радиус шара

    arcSize = Math.PI / 4; // Начальный размер дуги

    createTrail(); // Создаём трейл


    // Поправка значений у слайдеров
    document.getElementById('radius-value').textContent = radius.toFixed(0);
    document.getElementById('radius-slider').value = radius;

    document.getElementById('ball-radius-value').textContent = ballSize.toFixed(0);
    document.getElementById('ball-radius-slider').value = ballSize;

    document.getElementById('arc-size-value').textContent = arcSize.toFixed(1);
    document.getElementById('arc-size-slider').value = arcSize;

}

function createTrail() {
    trail = [];
    trailColor = color(activeBall.color);
    trailColor.setAlpha(trailColorAlpha);
    for (let i = 0; i < trailLength; i++) {
        trail.push(createVector(width / 2, height / 2));
    }
}

function draw() {
    background(12, 12, 14);

    // Рисуем окружность
    if (!ballIsFree) {
        noFill();
        stroke(255, 255, 255);
        circle(width / 2, height / 2, radius * 2);
    }

    noFill();

    // Рисуем дугу
    if (!ballIsFree) {
        strokeWeight(3)
        stroke(12, 12, 14);
        arc(width / 2, height / 2, radius * 2, radius * 2, -(arcPos + arcSize), -arcPos);
        strokeWeight(1);
    }

    noStroke();

    // Отрисовка трейла
    fill(trailColor);

    let i = trailLength;
    for (let ballPos of trail) {
        ellipse(ballPos.x, ballPos.y, ballSize * trailSizeMult * (1 - doTrailDecrease * (i / trailLength)));
        // ballSize * trailSizeMult - трейл будет размером как и шарики, но умноженным на множитель (как правило, меньший или равный 1 (и очевидно больше 0))
        // doTrailDecrease нужен просто как замена ифа (если он 0 то (ballSize * trailSizeMult) просто умножается на 1). С помощью умножения на (1 - doTrailDecrease * (i / trailLength)) достигается плавное уменьшение размеров шариков в трейле.
        i--;
    }

    // Отрисовка всех шариков
    for (let ball of balls) {
        fill(ball.color);
        ellipse(ball.pos.x, ball.pos.y, ballSize);
    }

    // Обновляем активный шарик, если он есть
    if (activeBall) {
        updateActiveBall();
    }

    // Обновляем таймер
    updateTimerDisplay();
}

function updateActiveBall() {
    activeBall.acc.set(0, gravity);
    activeBall.vel.add(activeBall.acc);
    activeBall.pos.add(activeBall.vel);


    // Проверяем столкновение с окружностью
    const distFromCenter = dist(activeBall.pos.x, activeBall.pos.y, width / 2, height / 2);


    let polarAngle;
    // Расчёт полярного угла центра круга (по отношению к центру окружности)
    X = (activeBall.pos.x - width / 2);
    Y = (-activeBall.pos.y + height / 2);
    if (X >= 0 && Y >= 0) {
        polarAngle = Math.atan(Y / X);
    }
    if (X <= 0 && Y >= 0) {
        polarAngle = PI + Math.atan(Y / X);
    }
    if (X <= 0 && Y <= 0) {
        polarAngle = PI + Math.atan(Y / X);
    }
    if (X >= 0 && Y <= 0) {
        polarAngle = TWO_PI + Math.atan(Y / X);
    }



    if (!ballIsFree) {
        if ((distFromCenter + ballSize / 2 >= radius) && (polarAngle < (arcPos + arcSize) - ballSize / 2 / radius) && (polarAngle > arcPos + ballSize / 2 / radius) && distFromCenter + ballSize / 2 >= radius) {
            ballIsFree = true;

            Success.play();
            activeBall.vel.mult(1);
            return;
        }

        if (distFromCenter + ballSize / 2 >= radius) {

            handleCollisionWithCircle(activeBall);
        }
    } else {
        handleCollisionWithWalls(activeBall);
    }

    for (let ball of balls) {
        if (ball !== activeBall && checkCollision(activeBall, ball)) {
            handleCollisionWithBall(activeBall, ball);
        }
    }


    timer += deltaTime / 1000;
    if (timer > maxTime) {
        frozen.play();
        activeBall.vel.set(0, 0);
        activeBall.acc.set(0, 0);
        activeBall = null;

        // timerId запуска плавного угасания трейла, timerId и timerIdTimeOut для отмены запуска функций после фриза при ресете 
        timerId = setInterval(drawTrail, 1000 / 60);
        timerIdTimeOut = setTimeout(() => { clearInterval(timerId); spawnNewBall(); createTrail(); }, 1000);
    }

    // "Передвижение" трейла (удаление конечного элемента и добавление позиции активного шарика в начало)
    updateTrail(activeBall);
}

function handleCollisionWithCircle(ball) {
    const normal = createVector(ball.pos.x - width / 2, ball.pos.y - height / 2).normalize();
    ball.pos = createVector(
        width / 2 + normal.x * (radius - ballSize / 2),
        height / 2 + normal.y * (radius - ballSize / 2)
    );
    const dot = ball.vel.dot(normal);
    ball.vel.sub(p5.Vector.mult(normal, 2 * dot));
    ball.vel.rotate(random(-0.2, 0.2));
    ball.vel.mult(0.95);

    HitCircle.play();
}

function handleCollisionWithBall(active, frozen) {
    const normal = createVector(active.pos.x - frozen.pos.x, active.pos.y - frozen.pos.y).normalize();
    const overlap = ballSize - dist(active.pos.x, active.pos.y, frozen.pos.x, frozen.pos.y);
    active.pos.add(p5.Vector.mult(normal, overlap));
    const dot = active.vel.dot(normal);
    active.vel.sub(p5.Vector.mult(normal, 2 * dot));
    active.vel.mult(0.95);
    HitBall.play();
}

function handleCollisionWithWalls(ball) {
    if (ball.pos.x - ballSize / 2 <= 0 || ball.pos.x + ballSize / 2 >= width) {
        ball.vel.x *= -1;
        HitCircle.play();
    }
    if (ball.pos.y - ballSize / 2 <= 0 || ball.pos.y + ballSize / 2 >= height) {
        ball.vel.y *= -1;
        HitCircle.play();
    }
}

function checkCollision(ball1, ball2) {
    const distance = dist(ball1.pos.x, ball1.pos.y, ball2.pos.x, ball2.pos.y);
    return distance < ballSize;
}

function generateArcPos() {
    const angle = random(0, TWO_PI);
    arcPos = angle;
}

function spawnNewBall() {
    timer = 0;
    const color = random(ballColors);
    const pos = createVector(width / 2, height / 2);
    const angle = random(0, TWO_PI);
    const vel = createVector(cos(angle), sin(angle)).mult(initialSpeed);
    const acc = createVector(0, gravity);

    const newBall = { pos, vel, acc, color };
    balls.push(newBall);
    activeBall = newBall;
}

function updateTimerDisplay() {
    const remainingTime = max(maxTime - timer, 0).toFixed(2);
    if (remainingTime <= 0) {
        timerElement.textContent = ""; // Очищаем текст таймера
        timerElement.classList.add('frozen'); // Добавляем класс для стилизации
    } else {
        timerElement.textContent = `${remainingTime}s`;
        timerElement.classList.remove('frozen'); // Убираем класс, если таймер больше 0
    }
}

//обработчик события для кнопки сброса игры
document.getElementById('reset-game-btn').addEventListener('click', resetGame);
// Функция сброса игры
function resetGame() {

    // Для отмены запуска функций после фриза при ресете
    if (timerId) {
        clearInterval(timerId);
    }

    if (timerIdTimeOut) {
        clearTimeout(timerIdTimeOut);
    }

    // Сбрасываем все параметры игры до начальных значений
    balls = [];
    activeBall = null;
    timer = 0;
    ballIsFree = false;
    generateArcPos();
    spawnNewBall();
    createTrail();
}



function drawTrail() {
    draw();
    updateTrail(null);
}

function updateTrail(ball) {
    noStroke();

    trail.shift();
    if (activeBall) {
        trailColor = color(activeBall.color);
        trailColor.setAlpha(trailColorAlpha);
        const pos = createVector(ball.pos.x, ball.pos.y);
        trail.push(pos);
    }

}

document.getElementById('radius-slider').addEventListener('input', (event) => {
    const value = Number(event.target.value);
    radius = value;
    document.getElementById('radius-value').textContent = value.toFixed(0);
});

document.getElementById('arc-size-slider').addEventListener('input', (event) => {
    const value = Number(event.target.value);
    arcSize = value;
    document.getElementById('arc-size-value').textContent = value.toFixed(1);
});

document.getElementById('ball-radius-slider').addEventListener('input', (event) => {
    const value = Number(event.target.value);
    ballSize = value;
    document.getElementById('ball-radius-value').textContent = value.toFixed(0);
});


document.getElementById('speed-slider').addEventListener('input', (event) => {
    const value = Number(event.target.value);
    initialSpeed = value;
    document.getElementById('speed-value').textContent = value.toFixed(0);
});


document.getElementById('gravity-slider').addEventListener('input', (event) => {
    const value = Number(event.target.value);
    gravity = value;
    document.getElementById('gravity-value').textContent = value.toFixed(1);
});


document.getElementById('trail-length-slider').addEventListener('input', (event) => {
    const value = Number(event.target.value);
    trailLength = value;
    document.getElementById('trail-length-value').textContent = value.toFixed(0);
});


document.getElementById('trail-color-alpha-slider').addEventListener('input', (event) => {
    const value = Number(event.target.value);
    trailColorAlpha = value;
    document.getElementById('trail-color-alpha-value').textContent = value.toFixed(0);
});


// Кнопка вкл/выкл изменения размера шара
document.getElementById('toggle-do-trail-decrease').addEventListener('click', () => {
    doTrailDecrease = !doTrailDecrease;
    const btn = document.getElementById('toggle-do-trail-decrease');
    btn.textContent = `Альтернативный трейл: ${doTrailDecrease ? 'Вкл' : 'Выкл'}`;
});