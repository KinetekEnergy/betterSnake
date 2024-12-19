(function () {
    /* Attributes of Game */
    /////////////////////////////////////////////////////////////
    const canvas = document.getElementById("snake");
    const ctx = canvas.getContext("2d");

    const SCREEN_SNAKE = 0, SCREEN_MENU = -1, SCREEN_GAME_OVER = 1, SCREEN_SETTING = 2;
    const screen_snake = document.getElementById("snake");
    const ele_score = document.getElementById("score_value");
    const speed_setting = document.getElementsByName("speed");
    const wall_setting = document.getElementsByName("wall");
    
    // HTML Screen IDs (div) 
    const SCREEN_MENU = -1, SCREEN_GAME_OVER = 1, SCREEN_SETTING = 2;
    const screen_menu = document.getElementById("menu");
    const screen_game_over = document.getElementById("gameover");
    const screen_setting = document.getElementById("setting");

    const ele_score = document.getElementById("score_value");

    const BLOCK = 10;
    let SCREEN = SCREEN_MENU;
    let snake, snake_dir, snake_next_dir, snake_speed;
    let food = { x: 0, y: 0 };
    let score;
    let wall;
    
    /* Display Control */
    /////////////////////////////////////////////////////////////
    let showScreen = function (screen_opt) {
        SCREEN = screen_opt;
        switch (screen_opt) {
            case SCREEN_SNAKE:
                screen_snake.style.display = "block";
                screen_menu.style.display = "none";
                screen_setting.style.display = "none";
                screen_game_over.style.display = "none";
                break;
            case SCREEN_GAME_OVER:
                screen_snake.style.display = "block";
                screen_menu.style.display = "none";
                screen_setting.style.display = "none";
                screen_game_over.style.display = "block";
                break;
            case SCREEN_SETTING:
                screen_snake.style.display = "none";
                screen_menu.style.display = "none";
                screen_setting.style.display = "block";
                screen_game_over.style.display = "none";
                break;
        }
    };

    /* Boss Spawner */
    function spawnBoss() {
        boss = {
            x: Math.floor(Math.random() * ((canvas.width / BLOCK) - BOSS_SIZE_MULTIPLIER)),
            y: Math.floor(Math.random() * ((canvas.height / BLOCK) - BOSS_SIZE_MULTIPLIER)),
            width: BOSS_SIZE_MULTIPLIER * BLOCK,
            height: BOSS_SIZE_MULTIPLIER * BLOCK,
            health: INITIAL_BOSS_HEALTH
        };
        bossHealth = boss.health;
        drawBossHealthBar();
    }

    function drawBossHealthBar() {
        const healthPercentage = Math.max(0, (boss.health / INITIAL_BOSS_HEALTH) * 100);
        ctx.fillStyle = "red";
        ctx.fillRect(10, 10, healthPercentage * 2, 10);
        ctx.fillStyle = "white";
        ctx.font = "10px Arial";
        ctx.fillText(`${boss.health}/${INITIAL_BOSS_HEALTH}`, 10, 30);
    }

    /* Actions and Events */
    /////////////////////////////////////////////////////////////
    window.onload = function () {
        // Initialize game
        newGame();

        window.addEventListener("keydown", function (evt) {
            if (evt.code === "Space" && SCREEN !== SCREEN_SNAKE) newGame();
            if (evt.code === "KeyR" && ammo > 0) shootBullet();
        }, true);
    };

    // Key Input Handling
    window.addEventListener("keydown", function (evt) {
        if (gameOver) return;

        // Prevent snake from reversing direction
        switch (evt.key) {
            case "ArrowUp":
                if (snake_dir !== 2) snake_next_dir = 0; break;
            case "ArrowRight":
                if (snake_dir !== 3) snake_next_dir = 1; break;
            case "ArrowDown":
                if (snake_dir !== 0) snake_next_dir = 2; break;
            case "ArrowLeft":
                if (snake_dir !== 1) snake_next_dir = 3; break;
        }
    }, true);

    /* New Game setup */
    /////////////////////////////////////////////////////////////
    let newGame = function () {
        // Reset Game State
        showScreen(SCREEN_SNAKE);
        screen_snake.focus();
        score = 0;
        ammo = 0;
        boss = null;
        bullets = [];
        gameOver = false;

        altScore(score);
        snake = [{ x: 10, y: 10 }]; // Start at a fixed position
        snake_dir = 1; // Start moving to the right
        snake_next_dir = 1; // Initialize next direction
        snake_speed = 200; // Set a reasonable speed (200ms per frame)
        addFood();
        mainLoop();
    };

    /* Shooting Mechanism */
    function shootBullet() {
        const head = snake[0];
        const bullet = {
            x: head.x,
            y: head.y,
            dir: snake_dir
        };
        bullets.push(bullet);
        ammo--;
    }

    function updateBullets() {
        bullets.forEach((bullet, index) => {
            switch (bullet.dir) {
                case 0: bullet.y -= BULLET_SPEED; break; // Up
                case 1: bullet.x += BULLET_SPEED; break; // Right
                case 2: bullet.y += BULLET_SPEED; break; // Down
                case 3: bullet.x -= BULLET_SPEED; break; // Left
            }

            // Check bullet collision with boss
            if (boss && bullet.x >= boss.x && bullet.x < boss.x + BOSS_SIZE_MULTIPLIER &&
                bullet.y >= boss.y && bullet.y < boss.y + BOSS_SIZE_MULTIPLIER) {
                bullets.splice(index, 1);
                boss.health--;
                if (boss.health <= 0) {
                    boss = null;
                    alert("You win!");
                }
            }
        });
    }

    /* Main Loop */
    /////////////////////////////////////////////////////////////
    let mainLoop = function () {
        if (gameOver) return;

        let _x = snake[0].x;
        let _y = snake[0].y;
        snake_dir = snake_next_dir;   // read async event key
        
        // Direction 0 - Up, 1 - Right, 2 - Down, 3 - Left
        switch (snake_dir) {
            case 0: _y--; break;
            case 1: _x++; break;
            case 2: _y++; break;
            case 3: _x--; break;
        }
        snake.pop(); // tail is removed
        snake.unshift({ x: _x, y: _y }); // head is new in new position/orientation
        
        // Wall Checker
        if (wall === 1) {
            // Wall on, Game over test
            if (snake[0].x < 0 || snake[0].x === canvas.width / BLOCK || snake[0].y < 0 || snake[0].y === canvas.height / BLOCK) {
                showScreen(SCREEN_GAME_OVER);
                return;
            }
        } 
        else {
            // Wall Off, Circle around
            for (let i = 0, x = snake.length; i < x; i++) {
                if (snake[i].x < 0) {
                    snake[i].x = snake[i].x + (canvas.width / BLOCK);
                }
                if (snake[i].x === canvas.width / BLOCK) {
                    snake[i].x = snake[i].x - (canvas.width / BLOCK);
                }
                if (snake[i].y < 0) {
                    snake[i].y = snake[i].y + (canvas.height / BLOCK);
                }
                if (snake[i].y === canvas.height / BLOCK) {
                    snake[i].y = snake[i].y - (canvas.height / BLOCK);
                }
            }
        }
        
        // Snake vs Snake checker
        for (let i = 1; i < snake.length; i++) {
            // Game over test
            if (snake[0].x === snake[i].x && snake[0].y === snake[i].y) {
                showScreen(SCREEN_GAME_OVER);
                return;
            }
        }
        
        // Snake eats food checker
        if (checkBlock(snake[0].x, snake[0].y, food.x, food.y)) {
            snake.push({}); // Grow the snake
            score++;
            ammo += AMMO_PER_FOOD;
            altScore(score);
            addFood();
            activeDot(food.x, food.y);
        }
        
        // Repaint canvas
        ctx.beginPath();
        ctx.fillStyle = "royalblue";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Paint snake
        for (let i = 0; i < snake.length; i++) {
            activeDot(snake[i].x, snake[i].y);
        }
        
        // Paint food
        activeDot(food.x, food.y);
        // Debug
        //document.getElementById("debug").innerHTML = snake_dir + " " + snake_next_dir + " " + snake[0].x + " " + snake[0].y;
        // Recursive call after speed delay, déjà vu
        drawGrid(ctx, canvas.width, BLOCK);
        setTimeout(mainLoop, snake_speed);
    }

    /* Helpers */
    /////////////////////////////////////////////////////////////
    let altScore = function (score_val) {
        ele_score.innerHTML = String(score_val);
    };

    let addFood = function () {
        food.x = Math.floor(Math.random() * (canvas.width / BLOCK));
        food.y = Math.floor(Math.random() * (canvas.height / BLOCK));
    };

    let checkBlock = function (x, y, _x, _y) {
        return (x === _x && y === _y);
    };

    let activeDot = function (x, y) {
        ctx.fillStyle = "white";
        ctx.fillRect(x * BLOCK, y * BLOCK, BLOCK, BLOCK);
    };

    function drawGrid(ctx, canvasSize, cellSize) {
        ctx.strokeStyle = "#ccc";
        ctx.lineWidth = 0.5;

        for (let x = 0; x <= canvasSize; x += cellSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvasSize);
            ctx.stroke();
        }

        for (let y = 0; y <= canvasSize; y += cellSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvasSize, y);
            ctx.stroke();
        }
    }    
    
    /* New Game setup */
    /////////////////////////////////////////////////////////////
    let newGame = function () {
        // snake game screen
        showScreen(SCREEN_SNAKE);
        screen_snake.focus();
        // game score to zero
        score = 0;
        altScore(score);
        // initial snake
        snake = [];
        snake.push({ x: 0, y: 15 });
        snake_next_dir = 1;
        // food on canvas
        addFood();
        // activate canvas event
        canvas.onkeydown = function (evt) {
            changeDir(evt.keyCode);
        }
        mainLoop();
    }
    
    /* Key Inputs and Actions */
    /////////////////////////////////////////////////////////////
    let changeDir = function (key) {
        // test key and switch direction
        switch (key) {
            case 37:    // left arrow
                if (snake_dir !== 1)    // not right
                    snake_next_dir = 3; // then switch left
                break;
            case 38:    // up arrow
                if (snake_dir !== 2)    // not down
                    snake_next_dir = 0; // then switch up
                break;
            case 39:    // right arrow
                if (snake_dir !== 3)    // not left
                    snake_next_dir = 1; // then switch right
                break;
            case 40:    // down arrow
                if (snake_dir !== 0)    // not up
                    snake_next_dir = 2; // then switch down
                break;
        }
    }
    
    /* Dot for Food or Snake part */
    /////////////////////////////////////////////////////////////
    let activeDot = function (x, y) {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(x * BLOCK, y * BLOCK, BLOCK, BLOCK);
    }
    
    /* Random food placement */
    /////////////////////////////////////////////////////////////
    let addFood = function () {
        food.x = Math.floor(Math.random() * ((canvas.width / BLOCK) - 1));
        food.y = Math.floor(Math.random() * ((canvas.height / BLOCK) - 1));
        for (let i = 0; i < snake.length; i++) {
            if (checkBlock(food.x, food.y, snake[i].x, snake[i].y)) {
                addFood();
            }
        }
    }
    
    /* Collision Detection */
    /////////////////////////////////////////////////////////////
    let checkBlock = function (x, y, _x, _y) {
        return (x === _x && y === _y);
    }
    
    /* Update Score */
    /////////////////////////////////////////////////////////////
    let altScore = function (score_val) {
        ele_score.innerHTML = String(score_val);
    }
    
    /////////////////////////////////////////////////////////////
    // Change the snake speed...
    // 150 = slow
    // 100 = normal
    // 50 = fast
    let setSnakeSpeed = function (speed_value) {
        snake_speed = speed_value;
    }
    
    /////////////////////////////////////////////////////////////
    let setWall = function (wall_value) {
        wall = wall_value;
        if (wall === 0) { screen_snake.style.borderColor = "#606060"; }
        if (wall === 1) { screen_snake.style.borderColor = "#FFFFFF"; }
    }
})();
