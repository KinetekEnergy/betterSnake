(function () {
    /* Attributes of Game */
    /////////////////////////////////////////////////////////////
    // Canvas & Context
    const canvas = document.getElementById("snake");
    const ctx = canvas.getContext("2d");
    
    const SCREEN_SNAKE = 0, SCREEN_MENU = -1, SCREEN_GAME_OVER = 1, SCREEN_SETTING = 2;
    const screen_snake = document.getElementById("snake");
    const screen_menu = document.getElementById("menu");
    const screen_game_over = document.getElementById("gameover");
    const screen_setting = document.getElementById("setting");

    const ele_score = document.getElementById("score_value");
    
    // Game Control
    const BLOCK = 10;   // size of block rendering
    
    // snake attributes
    let SCREEN = SCREEN_MENU;
    let snake, snake_dir, snake_next_dir, snake_speed;
    
    // food attributes
    let food = { x: 0, y: 0 };
    const foodImage = new Image();
    foodImage.src = "assets/images/mango.svg";
    const FOOD_SCALE = 1;

    // score and wall
    let score = 0;
    let wall = 1;

    // boss attributes
    let boss = null;
    let ammo = 0;
    let bullets = [];
    let bossHealth = 0; // boss CURRENT health
    const BOSS_SIZE_MULTIPLIER = 2; // Boss size multiplier compared to BLOCK
    const INITIAL_BOSS_HEALTH = 2;
    const BULLET_SPEED = 2;
    const AMMO_PER_FOOD = 3;
    const BOSS_SPAWN_THRESHOLD = 2; // the number of food the player needs to eat before boss spawns


    let gameOver = false;

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
    }
    
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
    
    /* Actions and Events  */
    /////////////////////////////////////////////////////////////
    window.onload = function () {
        // HTML Events to Functions
        button_new_game.onclick = function () { newGame(); };
        button_new_game1.onclick = function () { newGame(); };
        button_new_game2.onclick = function () { newGame(); };
        button_setting_menu.onclick = function () { showScreen(SCREEN_SETTING); };
        button_setting_menu1.onclick = function () { showScreen(SCREEN_SETTING); };
        
        // speed
        setSnakeSpeed(150);
        for (let i = 0; i < speed_setting.length; i++) {
            speed_setting[i].addEventListener("click", function () {
                for (let i = 0; i < speed_setting.length; i++) {
                    if (speed_setting[i].checked) {
                        setSnakeSpeed(speed_setting[i].value);
                    }
                }
            });
        }
        
        // wall setting
        setWall(1);
        for (let i = 0; i < wall_setting.length; i++) {
            wall_setting[i].addEventListener("click", function () {
                for (let i = 0; i < wall_setting.length; i++) {
                    if (wall_setting[i].checked) {
                        setWall(wall_setting[i].value);
                    }
                }
            });
        }
        
        // activate window events
        window.addEventListener("keydown", function (evt) {
            // spacebar detected
            if (evt.code === "Space" && SCREEN !== SCREEN_SNAKE)
                newGame();
        }, true);
    }
    window.onload = function () {
        // Initialize game
        newGame();

        window.addEventListener("keydown", function (evt) {
            if (evt.code === "Space" && SCREEN !== SCREEN_SNAKE) newGame();
            if (evt.code === "KeyR" && ammo > 0) shootBullet();
        }, true);
    };
    
    /////////////////////////////////////////////////////////////
    let mainLoop = function () {
        if (gameOver) return;

        let _x = snake[0].x;
        let _y = snake[0].y;

        // Update direction
        snake_dir = snake_next_dir;

        // Move the snake in the current direction
        switch (snake_dir) {
            case 0: _y--; break; // Up
            case 1: _x++; break; // Right
            case 2: _y++; break; // Down
            case 3: _x--; break; // Left
        }

        snake.pop(); // tail is removed
        snake.unshift({ x: _x, y: _y }); // head is new in new position/orientation
    
        // Wall Checker
        if (wall === 1) {
            if (snake[0].x < 0 || snake[0].x === canvas.width / BLOCK || snake[0].y < 0 || snake[0].y === canvas.height / BLOCK) {
                showScreen(SCREEN_GAME_OVER);
                return;
            }
        } 
        else {
            for (let i = 0, x = snake.length; i < x; i++) {
                if (snake[i].x < 0) snake[i].x += canvas.width / BLOCK;
                if (snake[i].x === canvas.width / BLOCK) snake[i].x -= canvas.width / BLOCK;
                if (snake[i].y < 0) snake[i].y += canvas.height / BLOCK;
                if (snake[i].y === canvas.height / BLOCK) snake[i].y -= canvas.height / BLOCK;
            }
        }
    
        // Snake vs Snake checker
        for (let i = 1; i < snake.length; i++) {
            if (snake[0].x === snake[i].x && snake[0].y === snake[i].y) {
                showScreen(SCREEN_GAME_OVER);
                return;
            }
        }
    
        // Handle food collision
        if (checkBlock(snake[0].x, snake[0].y, food.x, food.y)) {
            snake.push({}); // Grow the snake
            score++;
            ammo += AMMO_PER_FOOD;
            altScore(score);
            addFood();
            if (score === BOSS_SPAWN_THRESHOLD && !boss) spawnBoss(); // Spawn boss when score reaches 15
        }
    
        // Draw alternating background
        for (let y = 0; y < canvas.height / BLOCK; y++) {
            for (let x = 0; x < canvas.width / BLOCK; x++) {
                ctx.fillStyle = (x + y) % 2 === 0 ? "#AAD751" : "#A2D149";
                ctx.fillRect(x * BLOCK, y * BLOCK, BLOCK, BLOCK);
            }
        }
    
        // Draw snake
        snake.forEach(part => activeDot(part.x, part.y));
    
        // Paint food
        activeDot(food.x, food.y);

        // Draw boss if active
        if (boss) {
            ctx.fillStyle = "red";
            ctx.fillRect(boss.x * BLOCK, boss.y * BLOCK, boss.width, boss.height);
            drawBossHealthBar();
        }

        // Update and draw bullets
        updateBullets();
        bullets.forEach(bullet => activeDot(bullet.x, bullet.y));

        // Check boss collision with snake
        if (boss && snake[0].x >= boss.x && snake[0].x < boss.x + BOSS_SIZE_MULTIPLIER &&
            snake[0].y >= boss.y && snake[0].y < boss.y + BOSS_SIZE_MULTIPLIER) {
            showScreen(SCREEN_GAME_OVER);
            gameOver = true;
        }
    
        // Recursive call after speed delay
        setTimeout(mainLoop, snake_speed);
    };
    

    /* Grid Logic */
    /////////////////////////////////////////////////////////////
    function drawGrid(ctx, canvasSize, cellSize) {
        ctx.strokeStyle = "#ccc"; // Light gray for the grid lines
        ctx.lineWidth = 0.5;
    
        // Draw vertical lines
        for (let x = 0; x <= canvasSize; x += cellSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvasSize);
            ctx.stroke();
        }
    
        // Draw horizontal lines
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
        ammo = 0;
        boss = null;
        bullets = [];
        gameOver = false;
        altScore(score);
        
        // initial snake
        snake = [];
        snake = [{ x: 10, y: 10 }]; // Start at a fixed position
        snake_dir = 1; // Start moving to the right
        snake_next_dir = 1; // Initialize next direction
        snake_speed = 200;
        
        // food on canvas
        addFood();
        // activate canvas event
        canvas.onkeydown = function (evt) {
            changeDir(evt.keyCode);
        }
        mainLoop();
    }

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
    
    /* Key Inputs and Actions */
    /////////////////////////////////////////////////////////////
    let changeDir = function (key) {
        // test key and switch direction
        switch (key) {
            case 37: // left arrow
            case 65: // 'A'
                if (snake_dir !== 1) // not right
                    snake_next_dir = 3; // then switch left
                break;
            case 38: // up arrow
            case 87: // 'W'
                if (snake_dir !== 2) // not down
                    snake_next_dir = 0; // then switch up
                break;
            case 39: // right arrow
            case 68: // 'D'
                if (snake_dir !== 3) // not left
                    snake_next_dir = 1; // then switch right
                break;
            case 40: // down arrow
            case 83: // 'S'
                if (snake_dir !== 0) // not up
                    snake_next_dir = 2; // then switch down
                break;
        }        
    }
    
    /* Dot for Food or Snake part */
    /////////////////////////////////////////////////////////////
    let activeDot = function (x, y) {
        if (x === food.x && y === food.y) {
            ctx.drawImage(foodImage, x * BLOCK, y * BLOCK, BLOCK * FOOD_SCALE, BLOCK * FOOD_SCALE);
        } else {
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(x * BLOCK, y * BLOCK, BLOCK, BLOCK);
        }
    };
    
    
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