(function () {
    // the game board
    const canvas = document.getElementById("snake");
    const ctx = canvas.getContext("2d");

    // menu screens
    const SCREENS = {
        SNAKE: 0,
        MENU: -1,
        GAME_OVER: 1,
        SETTING: 2,
    };

    // the different menus
    const screenElements = {
        [SCREENS.SNAKE]: document.getElementById("snake"),
        [SCREENS.MENU]: document.getElementById("menu"),
        [SCREENS.GAME_OVER]: document.getElementById("gameover"),
        [SCREENS.SETTING]: document.getElementById("setting"),
    };

    // score and ammo
    const ele_score = document.getElementById("score_value");
    const ele_ammo = document.getElementById("ammo_value");
    const BLOCK = 10;

    // food configurations (IMPORTANT)
    const foodImage = new Image();                                           // create an image for the mango
    foodImage.src = "assets/images/mango.svg";                               // path to the mango
    foodImage.onload = () => console.log("Mango image loaded successfully"); // error handling
    foodImage.onerror = () => console.log("Failed to load mango image");     // error handling

    // snake controls and other stuff
    let SCREEN = SCREENS.MENU;
    let snake, snake_dir, snake_next_dir, snake_speed;
    let food = { x: 0, y: 0 };
    let score = 0, wall = 1;

    // boss fight configs
    let boss = null;       // is the boss spawned or not?
    let lastGrowTime = 0;  // when the boss last grew
    let ammo = 0;          // your ammo
    let bullets = [];
    let gameOver = false;  // did the game end?
    const bossSpeed = 1;  // Same speed as the player

    // other configs (IMPORTANT)
    const CONFIG = {
        FOOD_SCALE: 1, // mango size
        BOSS: {
            SIZE_MULTIPLIER: 2,  // boss size
            INITIAL_HEALTH: 2,   // boss health
            SPAWN_THRESHOLD: 2,  // how many mangos you need to eat before the boss spawns
            GROW_INTERVAL: 2000, // boss grows every 2 secs
            MAX_LENGTH: 20       // boss max length
        },
        BULLET: {
            SPEED: 2,         // bullet speed
            AMMO_PER_FOOD: 3, // the number of bullets each mango gives
        },
    };

    // display the screen
    const showScreen = (screen) => {
        SCREEN = screen;
        Object.keys(screenElements).forEach(key => {
            screenElements[key].style.display = key == screen ? "block" : "none";
        });
    };

    // create a random position on the board
    const randomPosition = (max) => Math.floor(Math.random() * (max / BLOCK));

    // draw a rectangle at a coordinate, with certain size and color
    const drawRect = (x, y, width, height, color) => {
        ctx.fillStyle = color;
        ctx.fillRect(x * BLOCK, y * BLOCK, width * BLOCK, height * BLOCK);
    };

    // check if you hit something
    const checkCollision = (x1, y1, x2, y2, width1 = 1, height1 = 1, width2 = 1, height2 = 1) => {
        return (
            x1 < x2 + width2 &&
            x1 + width1 > x2 &&
            y1 < y2 + height2 &&
            y1 + height1 > y2
        );
    };

    // spawn the boss at a random position and use the configs at the top. make the health bar
    const spawnBoss = () => {
        if (boss) return;

        const x = Math.floor(canvas.width / 2 / BLOCK);
        const y = Math.floor(canvas.height / 2 / BLOCK);
        boss = {
            x, y,
            health: CONFIG.BOSS.INITIAL_HEALTH,
            body: [
                { x, y },
                { x: x + 1, y },
                { x, y: y + 1 },
                { x: x + 1, y: y + 1 }
            ]
        };

        lastGrowTime = Date.now();

        drawBossHealthBar();
    };

    const handleBulletCollisions = () => {
        if (!boss) return;

        bullets.forEach((bullet, index) => {
            boss.body.forEach((part, partIndex) => {
                if (checkCollision(bullet.x, bullet.y, part.x, part.y)) {
                    bullets.splice(index, 1);
                    boss.body.splice(partIndex, 1);
                    if (boss.body.length <= 0) {
                        boss = null;
                        alert("You win!");
                    }
                }
            });
        });
    };


    // move boss towards player
    // move boss towards player
    const moveBoss = () => {
        if (!boss) return;

        const playerHead = snake[0];
        let moveX = 0;
        let moveY = 0;

        // Calculate movement direction based on player position
        if (playerHead.x < boss.x) moveX = -1; // Move left
        else if (playerHead.x > boss.x) moveX = 1; // Move right

        if (playerHead.y < boss.y) moveY = -1; // Move up
        else if (playerHead.y > boss.y) moveY = 1; // Move down

        // Boss should avoid hitting walls or itself
        if (moveX > 0 && boss.x + boss.body.length >= canvas.width / BLOCK) moveX = 0;
        if (moveX < 0 && boss.x <= 0) moveX = 0;
        if (moveY > 0 && boss.y + boss.body.length >= canvas.height / BLOCK) moveY = 0;
        if (moveY < 0 && boss.y <= 0) moveY = 0;

        // Ensure the boss moves in only one direction (no diagonal movement)
        if (moveX !== 0 && moveY !== 0) {
            // If both directions are non-zero, prioritize the x or y axis
            if (Math.abs(playerHead.x - boss.x) > Math.abs(playerHead.y - boss.y)) {
                moveY = 0; // Prevent diagonal movement by canceling y movement
            } else {
                moveX = 0; // Prevent diagonal movement by canceling x movement
            }
        }

        // Move the entire boss body in the direction of the player
        for (let i = boss.body.length - 1; i > 0; i--) {
            boss.body[i] = { ...boss.body[i - 1] };
        }
        boss.body[0] = { x: boss.body[0].x + moveX, y: boss.body[0].y + moveY };
    };


    // boss gets longer
    const growBossPeriodically = () => {
        if (!boss || Date.now() - lastGrowTime < CONFIG.BOSS.GROW_INTERVAL) return;

        lastGrowTime = Date.now();

        const lastPart = boss.body[boss.body.length - 1];
        boss.body.push({ x: lastPart.x + 1, y: lastPart.y });

        // Increase boss size at each growth interval
        if (boss.body.length > CONFIG.BOSS.MAX_LENGTH) {
            boss.body.shift();
        }
    };



    // function to draw the health bar and display the health percentage
    const drawBossHealthBar = () => {
        const healthPercentage = Math.max(0, (boss.health / CONFIG.BOSS.INITIAL_HEALTH) * 100);
        drawRect(0.1, 0.1, healthPercentage / 10, 1, "red");
        ctx.fillStyle = "white";
        ctx.font = "10px Arial";
        ctx.fillText(`${boss.health}/${CONFIG.BOSS.INITIAL_HEALTH}`, 10, 20);
    };



    // draw the alternating grid in the background
    const drawGrid = () => {
        for (let y = 0; y < canvas.height / BLOCK; y++) {
            for (let x = 0; x < canvas.width / BLOCK; x++) {
                drawRect(x, y, 1, 1, (x + y) % 2 === 0 ? "#AAD751" : "#A2D149");
            }
        }
    };

    // bullet movement configurations
    // it configures the speed and direction they travel as well as checking if you hit the boss
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

    // Main game loop
    const mainLoop = () => {
        if (gameOver) return; // if the game ends, stop updating

        // Move snake and check collisions
        snake_dir = snake_next_dir;
        let { x, y } = snake[0];

        // the direction you face
        switch (snake_dir) {
            case 0: y--; break; // Up
            case 1: x++; break; // Right
            case 2: y++; break; // Down
            case 3: x--; break; // Left
        }

        // if you hit a wall, you die
        if (wall && (x < 0 || x >= canvas.width / BLOCK || y < 0 || y >= canvas.height / BLOCK)) {
            return showScreen(SCREENS.GAME_OVER);
        }

        // if you hit yourself, you die
        if (snake.slice(1).some(part => checkCollision(part.x, part.y, x, y))) {
            return showScreen(SCREENS.GAME_OVER);
        }

        // Check for collision with the boss (any part of the boss)
        if (boss && boss.body.some(bossPart => checkCollision(x, y, bossPart.x, bossPart.y))) {
            return showScreen(SCREENS.GAME_OVER); // End the game if you hit any part of the boss
        }

        // snake movement
        snake.pop();
        snake.unshift({ x, y });

        // check if you collided with a mango; if so, do the following...
        if (checkCollision(x, y, food.x, food.y)) {
            ammo += CONFIG.BULLET.AMMO_PER_FOOD; // add your ammo
            updateScore(score++);                // update your score
            updateAmmo(ammo);                    // update your ammo
            addFood();                           // spawn a new food
            snake.push({ x: snake[snake.length - 1].x, y: snake[snake.length - 1].y }); // make snake longer
            if (score === CONFIG.BOSS.SPAWN_THRESHOLD && !boss) spawnBoss(); // if you hit food threshold, spawn boss
        }

        // snake and boss movement
        moveBoss();  // Move the boss towards the player
        growBossPeriodically();  // Check if the boss should grow

        // Handle bullet collisions with the boss
        handleBulletCollisions();

        // Draw grid and update all elements
        drawGrid();  // Draw the alternating grid background
        snake.forEach(part => drawRect(part.x, part.y, 1, 1, "white")); // Draw the snake
        drawFood();  // Draw the food

        // if the boss is there, draw it
        if (boss) {
            boss.body.forEach(bossPart => drawRect(bossPart.x, bossPart.y, 1, 1, "red"));
            drawBossHealthBar();  // Display health bar for the boss
        }

        // Bullet updates and drawing
        updateBullets();
        bullets.forEach(bullet => drawRect(bullet.x, bullet.y, 1, 1, "blue"));

        // Continue game loop
        setTimeout(mainLoop, snake_speed);
    };


    // add food to the board
    const addFood = () => {
        food = { x: randomPosition(canvas.width), y: randomPosition(canvas.height) };
        if (snake.some(part => checkCollision(food.x, food.y, part.x, part.y))) {
            addFood();
        }
    };

    // change your score
    const updateScore = (newScore) => {
        ele_score.textContent = newScore;
    };

    // update your ammo
    const updateAmmo = (newAmmo) => {
        ele_ammo.textContent = newAmmo;
    }

    // create a new game
    const newGame = () => {
        // show the game screen
        showScreen(SCREENS.SNAKE);

        // configure the snake
        snake = [{ x: 10, y: 10 }];
        snake_dir = snake_next_dir = 1;
        snake_speed = 100;

        // configure your score and the boss info
        score = ammo = 0;
        bullets = [];
        boss = null;
        gameOver = false;

        // start the game
        updateScore(score);
        updateAmmo(ammo);
        addFood();
        mainLoop();
    };

    /* Initialization */
    window.onload = () => {
        // new game and settings
        document.querySelectorAll(".new-game").forEach(button => button.onclick = newGame);
        document.querySelectorAll(".setting").forEach(button => button.onclick = () => showScreen(SCREENS.SETTING));

        // key press mappings (WASD & arrow keys)
        const directionMap = {
            "ArrowUp": 0, "KeyW": 0,    // move up
            "ArrowRight": 1, "KeyD": 1, // move right
            "ArrowDown": 2, "KeyS": 2,  // move down
            "ArrowLeft": 3, "KeyA": 3   // move left
        };

        // listen for the key presses
        window.addEventListener("keydown", (evt) => {
            // update where you are facing to move
            if (directionMap[evt.code] !== undefined && snake_dir !== (directionMap[evt.code] + 2) % 4) {
                snake_next_dir = directionMap[evt.code];
            }

            if (evt.code === "Space" && SCREEN !== SCREENS.SNAKE) newGame(); // space = new game
            if (evt.code === "KeyR" && ammo > 0) shootBullet();              // the R key shoots
        });

        // when the window loads, immediately make a new game
        newGame();
    };

    // shoot bullets function
    const shootBullet = () => {
        if (ammo > 0) {
            bullets.push({ ...snake[0], dir: snake_dir });
            ammo--;
            updateAmmo(ammo);  // update the ammo count after shooting
        }
    };

})();
