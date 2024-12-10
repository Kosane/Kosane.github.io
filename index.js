let pos, vel, acc; // Позиция, скорость и ускорение
let radius; // Радиус окружности
let ballSize; // Начальный размер шара
let gravity = 0.2; // Гравитация
let initialSpeed = 7; // Постоянная начальная скорость

let ballColor;

let audio = new Audio();
let lastHitTime = 0; // Последнее время столкновения

// Флаги для изменения размеров
let canChangeBallSize = false;
let canChangeCircleSize = false;

// Загрузка аудио
function preload() {
    soundFormats('wav', 'mp3');
}

// Cоздаём холст/полотно с размерами элемента-родителя
const canvasWrapperDiv = document.getElementById('canvas-wrapper');
const canvasWrapperWidth = canvasWrapperDiv.offsetWidth;
const canvasWrapperHeight = canvasWrapperDiv.offsetHeight;


const radiusSliderMax = Math.min(canvasWrapperWidth, canvasWrapperHeight) / 2; // Максимальный радиус окружности для слайдера
const radiusSliderMin = radiusSliderMax / 10; // Минимальный радиус окружности для слайдера


document.getElementById('radius-slider').min = radiusSliderMin;
document.getElementById('radius-slider').max = radiusSliderMax;

// Инициализация
function setup() {
    // создаём холст/полотно с размерами элемента-родителя
    const canvas = createCanvas(canvasWrapperWidth, canvasWrapperHeight);

    canvas.parent(document.getElementById('canvas-wrapper'));

    respawnBall();
    acc = createVector(0, gravity);

    // Кнопка выбора трека
    document.getElementById('select-track-btn').addEventListener('click', () => {
        document.getElementById('track-input').click();
    });

    // Кнопка выбора трека
    document.getElementById('track-input').addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            audio.src = URL.createObjectURL(file);
        }
    });
    //Кнопка удаления трека
    document.getElementById('delete-track-btn').addEventListener('click', () => {
        audio.pause();
        audio.currentTime = 0;
        audio.src = "";
        const trackInput = document.getElementById('track-input');
        trackInput.value = "";
    });


    // Кнопка вкл/выкл изменения размера шара
    document.getElementById('toggle-ball-size-btn').addEventListener('click', () => {
        canChangeBallSize = !canChangeBallSize;
        const btn = document.getElementById('toggle-ball-size-btn');
        btn.textContent = `Изменение размера шара: ${canChangeBallSize ? 'Вкл' : 'Выкл'}`;
    });

    // Кнопка вкл/выкл изменения радиуса окружности
    document.getElementById('toggle-circle-size-btn').addEventListener('click', () => {
        canChangeCircleSize = !canChangeCircleSize;
        const btn = document.getElementById('toggle-circle-size-btn');
        btn.textContent = `Изменение радиуса окружности: ${canChangeCircleSize ? 'Вкл' : 'Выкл'}`;
    });
}

// Отрисовка и логика
function draw() {
    background(12, 12, 14);

    acc.set(0, gravity);
    vel.add(acc);
    pos.add(vel);

    noFill();
    stroke(255, 255, 255);
    circle(width / 2, height / 2, radius * 2);

    const currentTime = millis() / 1000;

    let ballBlue = 255 - (currentTime - lastHitTime) * 510;

    if (255 - (currentTime - lastHitTime) * 510 < 0) {
        ballBlue = 0
    }

    // для прозрачности вместо синего цвета
    // ballColor = color("red");
    // console.log();
    // ballColor.setAlpha(ballBlue);
    // fill(ballColor);

    fill(255 - ballBlue, 0, ballBlue)
    noStroke();

    ellipse(pos.x, pos.y, ballSize);

    handleCollision();
}

function handleCollision() {
    const distFromCenter = dist(pos.x, pos.y, width / 2, height / 2);
    const halfBallSize = ballSize / 2;

    const currentTime = millis() / 1000;
    if (currentTime - lastHitTime > 0.5) {
        audio.pause();
    }

    if (distFromCenter + halfBallSize >= radius) {
        let normal = createVector(pos.x - width / 2, pos.y - height / 2).normalize();

        // Корректировка позиции
        pos = createVector(
            width / 2 + normal.x * (radius - halfBallSize),
            height / 2 + normal.y * (radius - halfBallSize)
        );

        let dot = vel.dot(normal);

        // Улучшенное отражение с добавлением случайности
        vel.sub(p5.Vector.mult(normal, 2 * dot));

        // Добавляем небольшой случайный угол
        vel.rotate(random(-0.2, 0.2));

        // Уменьшаем скорость на небольшой процент
        vel.mult(0.95);

        // Восстанавливаем приблизительную начальную скорость
        vel.setMag(initialSpeed * 0.9);

        // Проверка времени для проигрывания звука
        const currentTime = millis() / 1000;
        if (currentTime - lastHitTime > 0.5) {
            audio.currentTime = 0;
        }

        audio.play();
        lastHitTime = currentTime;

        // Изменение размеров шара и окружности
        if (canChangeCircleSize) {
            if (radius > 20) {
                radius -= 1;
            } else if (radius === 20) {
                radius = 200;
            }
        }

        if (canChangeBallSize) {
            ballSize += 5;
            const MAX_BALL_SIZE = 500;
            ballSize = min(ballSize, MAX_BALL_SIZE);
        }
    }
}

function respawnBall() {
    radius = Math.min(canvasWrapperWidth, canvasWrapperHeight) / 3; // Начальный радиус окружности
    ballSize = radius / 5; // Начальный размер шара
    document.getElementById('radius-value').innerText = parseInt(radius);
    document.getElementById('radius-slider').value = parseInt(radius);

    let angle = random(0, TWO_PI);
    let distance = random(0, radius - 10);
    pos = createVector(
        width / 2 + cos(angle) * distance,
        height / 2 + sin(angle) * distance
    );

    let direction = createVector(cos(angle), sin(angle));
    vel = direction.mult(initialSpeed);
}

document.getElementById('respawn-btn').addEventListener('click', () => {
    respawnBall();
});

document.getElementById('radius-slider').addEventListener('input', (event) => {
    const value = Number(event.target.value);
    radius = value;
    document.getElementById('radius-value').textContent = value;
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