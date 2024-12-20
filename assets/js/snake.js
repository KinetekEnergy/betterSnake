(function () {
    /* Game Attributes */
    const canvas = document.getElementById("snake");
    const ctx = canvas.getContext("2d");

    const SCREENS = {
        SNAKE: 0,
        MENU: -1,
        GAME_OVER: 1,
        SETTING: 2,
    };

    const screenElements = {
        [SCREENS.SNAKE]: document.getElementById("snake"),
        [SCREENS.MENU]: document.getElementById("menu"),
        [SCREENS.GAME_OVER]: document.getElementById("gameover"),
        [SCREENS.SETTING]: document.getElementById("setting"),
    };

    const ele_score = document.getElementById("score_value");
    const BLOCK = 10;
    const foodImage = new Image();
    foodImage.src = "assets/images/mango.svg";
    foodImage.onload = () => {
        // Image is loaded, you can now use it
        console.log("Mango image loaded successfully");
    };
    foodImage.onerror = () => {
        console.log("Failed to load mango image");
    };


    let SCREEN = SCREENS.MENU;
    let snake, snake_dir, snake_next_dir, snake_speed;
    let food = { x: 0, y: 0 };
    let score = 0, wall = 1;
    let boss = null, ammo = 0, bullets = [], gameOver = false;

    const CONFIG = {
        FOOD_SCALE: 1,
        BOSS: {
            SIZE_MULTIPLIER: 2,
            INITIAL_HEALTH: 2,
            SPAWN_THRESHOLD: 2,
        },
        BULLET: {
            SPEED: 2,
            AMMO_PER_FOOD: 3,
        },
    };

    /* Utility Functions */
    const showScreen = (screen) => {
        SCREEN = screen;
        Object.keys(screenElements).forEach(key => {
            screenElements[key].style.display = key == screen ? "block" : "none";
        });
    };
    

    const randomPosition = (max) => Math.floor(Math.random() * (max / BLOCK));
    const drawRect = (x, y, width, height, color) => {
        ctx.fillStyle = color;
        ctx.fillRect(x * BLOCK, y * BLOCK, width * BLOCK, height * BLOCK);
    };
    const checkCollision = (x, y, otherX, otherY) => x === otherX && y === otherY;

    const spawnBoss = () => {
        boss = {
            x: randomPosition(canvas.width - CONFIG.BOSS.SIZE_MULTIPLIER),
            y: randomPosition(canvas.height - CONFIG.BOSS.SIZE_MULTIPLIER),
            width: CONFIG.BOSS.SIZE_MULTIPLIER,
            height: CONFIG.BOSS.SIZE_MULTIPLIER,
            health: CONFIG.BOSS.INITIAL_HEALTH,
        };
        drawBossHealthBar();
    };

    const drawBossHealthBar = () => {
        const healthPercentage = Math.max(0, (boss.health / CONFIG.BOSS.INITIAL_HEALTH) * 100);
        drawRect(0.1, 0.1, healthPercentage / 10, 1, "red");
        ctx.fillStyle = "white";
        ctx.font = "10px Arial";
        ctx.fillText(`${boss.health}/${CONFIG.BOSS.INITIAL_HEALTH}`, 10, 20);
    };

    const drawGrid = () => {
        for (let y = 0; y < canvas.height / BLOCK; y++) {
            for (let x = 0; x < canvas.width / BLOCK; x++) {
                drawRect(x, y, 1, 1, (x + y) % 2 === 0 ? "#AAD751" : "#A2D149");
            }
        }
    };

    const updateBullets = () => {
        bullets.forEach((bullet, index) => {
            switch (bullet.dir) {
                case 0: bullet.y -= CONFIG.BULLET.SPEED; break; // Up
                case 1: bullet.x += CONFIG.BULLET.SPEED; break; // Right
                case 2: bullet.y += CONFIG.BULLET.SPEED; break; // Down
                case 3: bullet.x -= CONFIG.BULLET.SPEED; break; // Left
            }

            if (boss && checkCollision(bullet.x, bullet.y, boss.x, boss.y)) {
                bullets.splice(index, 1);
                boss.health--;
                if (boss.health <= 0) {
                    boss = null;
                    alert("You win!");
                }
            }
        });
    };

    /* Main Game Logic */
    // Function to draw food with the mango image
    const drawFood = () => {
        ctx.drawImage(foodImage, food.x * BLOCK, food.y * BLOCK, BLOCK * CONFIG.FOOD_SCALE, BLOCK * CONFIG.FOOD_SCALE);
    };

    // Modify main game logic to increase the snake's length after eating food
    const mainLoop = () => {
        if (gameOver) return;

        // Move snake and check collisions
        snake_dir = snake_next_dir;
        let { x, y } = snake[0];
        switch (snake_dir) {
            case 0: y--; break; // Up
            case 1: x++; break; // Right
            case 2: y++; break; // Down
            case 3: x--; break; // Left
        }

        if (wall && (x < 0 || x >= canvas.width / BLOCK || y < 0 || y >= canvas.height / BLOCK)) {
            return showScreen(SCREENS.GAME_OVER);
        }

        snake.pop();
        snake.unshift({ x, y });

        if (snake.slice(1).some(part => checkCollision(part.x, part.y, x, y))) {
            return showScreen(SCREENS.GAME_OVER);
        }

        if (checkCollision(x, y, food.x, food.y)) {
            score++;
            ammo += CONFIG.BULLET.AMMO_PER_FOOD;
            updateScore(score);
            addFood();
            snake.push({ x: snake[snake.length - 1].x, y: snake[snake.length - 1].y }); // Add new segment to snake
            if (score === CONFIG.BOSS.SPAWN_THRESHOLD && !boss) spawnBoss();
        }

        drawGrid();
        snake.forEach(part => drawRect(part.x, part.y, 1, 1, "white"));
        drawFood(); // Use image for food

        if (boss) {
            drawRect(boss.x, boss.y, boss.width, boss.height, "red");
            drawBossHealthBar();
        }

        updateBullets();
        bullets.forEach(bullet => drawRect(bullet.x, bullet.y, 1, 1, "blue"));

        setTimeout(mainLoop, snake_speed);
    };


    const addFood = () => {
        food = { x: randomPosition(canvas.width), y: randomPosition(canvas.height) };
        if (snake.some(part => checkCollision(food.x, food.y, part.x, part.y))) {
            addFood();
        }
    };

    const updateScore = (newScore) => {
        ele_score.textContent = newScore;
    };

    const newGame = () => {
        showScreen(SCREENS.SNAKE);
        snake = [{ x: 10, y: 10 }];
        snake_dir = snake_next_dir = 1;
        snake_speed = 200;
        score = ammo = 0;
        bullets = [];
        boss = null;
        gameOver = false;
        updateScore(score);
        addFood();
        mainLoop();
    };

    /* Initialization */
    window.onload = () => {
        document.querySelectorAll(".new-game").forEach(button => button.onclick = newGame);
        document.querySelectorAll(".setting").forEach(button => button.onclick = () => showScreen(SCREENS.SETTING));
        window.addEventListener("keydown", (evt) => {
            if (evt.code === "ArrowUp" || evt.code === "KeyW") {
                // Move up
                if (snake_dir !== 2) snake_next_dir = 0;
            } else if (evt.code === "ArrowRight" || evt.code === "KeyD") {
                // Move right
                if (snake_dir !== 3) snake_next_dir = 1;
            } else if (evt.code === "ArrowDown" || evt.code === "KeyS") {
                // Move down
                if (snake_dir !== 0) snake_next_dir = 2;
            } else if (evt.code === "ArrowLeft" || evt.code === "KeyA") {
                // Move left
                if (snake_dir !== 1) snake_next_dir = 3;
            }

            if (evt.code === "Space" && SCREEN !== SCREENS.SNAKE) {
                newGame();
            }
            if (evt.code === "KeyR" && ammo > 0) {
                shootBullet();
            }
        });


        newGame();
    };

    const shootBullet = () => {
        bullets.push({ ...snake[0], dir: snake_dir });
        ammo--;
    };
})();
