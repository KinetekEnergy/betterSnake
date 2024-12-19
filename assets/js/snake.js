(function () {
    /* Attributes of Game */
    /////////////////////////////////////////////////////////////
    // Canvas & Context
    const canvas = document.getElementById("snake");
    const ctx = canvas.getContext("2d");
    
    // HTML Game IDs
    const SCREEN_SNAKE = 0;
    const screen_snake = document.getElementById("snake");
    const ele_score = document.getElementById("score_value");
    const speed_setting = document.getElementsByName("speed");
    const wall_setting = document.getElementsByName("wall");
    
    // HTML Screen IDs (div)
    const SCREEN_MENU = -1, SCREEN_GAME_OVER = 1, SCREEN_SETTING = 2;
    const screen_menu = document.getElementById("menu");
    const screen_game_over = document.getElementById("gameover");
    const screen_setting = document.getElementById("setting");
    
    // HTML Event IDs (a tags)
    const button_new_game = document.getElementById("new_game");
    const button_new_game1 = document.getElementById("new_game1");
    const button_new_game2 = document.getElementById("new_game2");
    const button_setting_menu = document.getElementById("setting_menu");
    const button_setting_menu1 = document.getElementById("setting_menu1");
    
    // Game Control
    const BLOCK = 10;   // size of block rendering
    
    let SCREEN = SCREEN_MENU;
    let snake;
    let snake_dir;
    let snake_next_dir;
    let snake_speed;
    let food = { x: 0, y: 0 };
    let score;
    let wall;
    
    /* Display Control */
    /////////////////////////////////////////////////////////////
    // 0 for the game
    // 1 for the main menu
    // 2 for the settings screen
    // 3 for the game over screen
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
    
    /* Snake is on the Go (Driver Function)  */
    /////////////////////////////////////////////////////////////
    let mainLoop = function () {
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
            snake[snake.length] = { x: snake[0].x, y: snake[0].y };
            altScore(++score);
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