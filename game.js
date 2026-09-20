/* =========================================================
   ARROWHEAD 3.0 — TAP-AWAY GAME ENGINE

   Features:
   - 3 lives per level
   - Same-level retry after Game Over
   - Infinite procedural levels
   - Saved current level
   - Saved unlocked levels
   - Level Select support
   - Pause / Resume
   - Restart Level
   - Dashboard
   - High score / statistics
   - Correct attempt tracking
   - Touch + mouse support
========================================================= */

(() => {

    "use strict";


    /* =====================================================
       DOM
    ===================================================== */

    const levelEl =
        document.getElementById("level");

    const livesEl =
        document.getElementById("lives");

    const scoreEl =
        document.getElementById("score");

    const progressEl =
        document.getElementById("progress");

    const timerEl =
        document.getElementById("timer");

    const messageEl =
        document.getElementById("message");

    const arrowBoard =
        document.getElementById("arrowBoard");

    const loginScreen =
        document.getElementById("loginScreen");

    const gameScreen =
        document.getElementById("gameScreen");

    const dashboard =
        document.getElementById("dashboard");

    const gameOver =
        document.getElementById("gameOver");

    const playerNameInput =
        document.getElementById("playerName");

    const welcomeEl =
        document.getElementById("welcome");

    const highScoreEl =
        document.getElementById("highScore");

    const highLevelEl =
        document.getElementById("highLevel");

    const gamesPlayedEl =
        document.getElementById("gamesPlayed");

    const accuracyEl =
        document.getElementById("accuracy");

    const bestTimeEl =
        document.getElementById("bestTime");

    const perfectLevelsEl =
        document.getElementById("perfectLevels");

    const finalScoreEl =
        document.getElementById("finalScore");


    /* =====================================================
       OPTIONAL LEVEL SELECT DOM
    ===================================================== */

    const levelSelectScreen =
        document.getElementById(
            "levelSelectScreen"
        );

    const levelGrid =
        document.getElementById(
            "levelGrid"
        );


    /* =====================================================
       GAME STATE
    ===================================================== */

    let playerName = "";

    let currentLevel = 1;

    let unlockedLevel = 1;

    let score = 0;

    let lives = 3;

    let removedCount = 0;

    let totalArrows = 0;

    let levelAttempts = 0;

    let levelSuccessfulMoves = 0;

    let levelMistakes = 0;

    let levelStartTime = 0;

    let pausedElapsed = 0;

    let timerInterval = null;

    let nextLevelTimer = null;

    let levelData = null;

    let pieces = [];

    let busy = false;

    let paused = false;

    let gameStarted = false;


    /* =====================================================
       GLOBAL STATISTICS
    ===================================================== */

    let sessionAttempts = 0;

    let sessionSuccessfulMoves = 0;


    /* =====================================================
       STORAGE KEYS
    ===================================================== */

    const PROFILE_KEY =
        "arrowhead-profile";

    const PROGRESS_KEY =
        "arrowhead-progress";


    /* =====================================================
       DEFAULT PROFILE
    ===================================================== */

    function defaultProfile() {

        return {

            name: "",

            highScore: 0,

            highLevel: 1,

            gamesPlayed: 0,

            attempts: 0,

            successfulMoves: 0,

            bestTime: null,

            perfectLevels: 0

        };

    }


    /* =====================================================
       LOAD PROFILE
    ===================================================== */

    function loadProfile() {

        try {

            const saved =
                localStorage.getItem(
                    PROFILE_KEY
                );


            if (!saved) {

                return defaultProfile();

            }


            return {

                ...defaultProfile(),

                ...JSON.parse(saved)

            };

        }

        catch {

            return defaultProfile();

        }

    }


    let profile =
        loadProfile();


    /* =====================================================
       SAVE PROFILE
    ===================================================== */

    function saveProfile() {

        try {

            localStorage.setItem(

                PROFILE_KEY,

                JSON.stringify(profile)

            );

        }

        catch {

            /* Storage may be unavailable */

        }

    }


    /* =====================================================
       LOAD PROGRESS
    ===================================================== */

    function loadProgress() {

        try {

            const saved =
                localStorage.getItem(
                    PROGRESS_KEY
                );


            if (!saved) {

                return {

                    currentLevel: 1,

                    unlockedLevel: 1,

                    score: 0

                };

            }


            const data =
                JSON.parse(saved);


            return {

                currentLevel:
                    Math.max(
                        1,
                        Number(
                            data.currentLevel
                        ) || 1
                    ),

                unlockedLevel:
                    Math.max(
                        1,
                        Number(
                            data.unlockedLevel
                        ) ||
                        Number(
                            data.currentLevel
                        ) ||
                        1
                    ),

                score:
                    Math.max(
                        0,
                        Number(
                            data.score
                        ) || 0
                    )

            };

        }

        catch {

            return {

                currentLevel: 1,

                unlockedLevel: 1,

                score: 0

            };

        }

    }


    /* =====================================================
       SAVE PROGRESS
    ===================================================== */

    function saveProgress() {

        try {

            localStorage.setItem(

                PROGRESS_KEY,

                JSON.stringify({

                    currentLevel,

                    unlockedLevel,

                    score

                })

            );

        }

        catch {

            /* Storage may be unavailable */

        }

    }


    /* =====================================================
       LOGIN
    ===================================================== */

    window.startGame =
        function () {

            const name =
                playerNameInput.value.trim();


            if (!name) {

                playerNameInput.focus();

                return;

            }


            playerName =
                name.substring(
                    0,
                    20
                );


            profile.name =
                playerName;


            /*
             * Count an actual game session,
             * not every level.
             */

            profile.gamesPlayed++;


            saveProfile();


            const progress =
                loadProgress();


            currentLevel =
                progress.currentLevel;


            unlockedLevel =
                progress.unlockedLevel;


            score =
                progress.score;


            levelAttempts = 0;

            levelSuccessfulMoves = 0;

            levelMistakes = 0;

            sessionAttempts = 0;

            sessionSuccessfulMoves = 0;

            lives = 3;

            paused = false;

            busy = false;

            gameStarted = true;


            showGameScreen();


            updateScore();

            updateLives();

            loadLevel();

        };


    if (playerNameInput) {

        playerNameInput.addEventListener(

            "keydown",

            event => {

                if (
                    event.key === "Enter"
                ) {

                    window.startGame();

                }

            }

        );

    }


    /* =====================================================
       SHOW GAME SCREEN
    ===================================================== */

    function showGameScreen() {

        loginScreen.classList.add(
            "hidden"
        );

        dashboard.classList.add(
            "hidden"
        );

        if (levelSelectScreen) {

            levelSelectScreen.classList.add(
                "hidden"
            );

        }

        gameOver.classList.add(
            "hidden"
        );

        gameScreen.classList.remove(
            "hidden"
        );

    }


    /* =====================================================
       LOAD LEVEL
    ===================================================== */

    function loadLevel() {

        stopTimer();

        clearNextLevelTimer();


        paused = false;

        busy = false;


        levelData =
            ArrowLevels.getLevel(
                currentLevel
            );


        pieces = [];

        removedCount = 0;

        totalArrows =
            levelData.arrows.length;


        levelAttempts = 0;

        levelSuccessfulMoves = 0;

        levelMistakes = 0;


        levelEl.textContent =
            currentLevel;


        progressEl.textContent =
            `0 / ${totalArrows}`;


        messageEl.textContent =
            "Tap an arrow with a clear path.";


        /*
         * Every level gets
         * three fresh lives.
         */

        lives = 3;

        updateLives();


        saveProgress();


        renderBoard();


        levelStartTime =
            performance.now();


        pausedElapsed = 0;


        startTimer();

    }


    /* =====================================================
       RENDER BOARD
    ===================================================== */

    function renderBoard() {

        arrowBoard.innerHTML = "";


        const svgNS =
            "http://www.w3.org/2000/svg";


        const svg =
            document.createElementNS(
                svgNS,
                "svg"
            );


        svg.classList.add(
            "arrow-board-svg"
        );


        svg.setAttribute(
            "viewBox",
            "0 0 1000 700"
        );


        svg.setAttribute(
            "preserveAspectRatio",
            "xMidYMid meet"
        );


        const VIEW_WIDTH = 1000;

        const VIEW_HEIGHT = 700;


        const horizontalMargin = 70;

        const verticalMargin = 55;


        const usableWidth =
            VIEW_WIDTH -
            horizontalMargin * 2;


        const usableHeight =
            VIEW_HEIGHT -
            verticalMargin * 2;


        const size =
            levelData.size;


        const cellSize =
            Math.min(

                usableWidth / size,

                usableHeight / size

            );


        const gridWidth =
            cellSize * size;


        const gridHeight =
            cellSize * size;


        const offsetX =
            (
                VIEW_WIDTH -
                gridWidth
            ) / 2;


        const offsetY =
            (
                VIEW_HEIGHT -
                gridHeight
            ) / 2;


        const layer =
            document.createElementNS(
                svgNS,
                "g"
            );


        layer.classList.add(
            "arrow-piece-layer"
        );


        svg.appendChild(
            layer
        );


        levelData.arrows.forEach(

            (
                data,
                index
            ) => {

                const piece =
                    createArrow(

                        data,

                        index,

                        offsetX,

                        offsetY,

                        cellSize

                    );


                pieces.push(
                    piece
                );


                layer.appendChild(
                    piece.group
                );

            }

        );


        arrowBoard.appendChild(
            svg
        );

    }


    /* =====================================================
       CREATE ARROW
    ===================================================== */

    function createArrow(

        data,

        index,

        offsetX,

        offsetY,

        cellSize

    ) {

        const svgNS =
            "http://www.w3.org/2000/svg";


        const group =
            document.createElementNS(
                svgNS,
                "g"
            );


        group.classList.add(
            "arrow-piece"
        );


        group.dataset.row =
            data.row;


        group.dataset.col =
            data.col;


        group.dataset.direction =
            data.direction;


        const cx =
            offsetX +
            data.col *
            cellSize +
            cellSize / 2;


        const cy =
            offsetY +
            data.row *
            cellSize +
            cellSize / 2;


        const arrowLength =
            Math.min(

                cellSize * 0.70,

                68

            );


        const arrowWidth =
            Math.min(

                cellSize * 0.42,

                40

            );


        const shaftWidth =
            Math.min(

                cellSize * 0.14,

                12

            );


        const headLength =
            arrowLength * 0.38;


        const tipY =
            cy -
            arrowLength / 2;


        const headBaseY =
            tipY +
            headLength;


        const bottomY =
            cy +
            arrowLength / 2;


        const shaftLeft =
            cx -
            shaftWidth / 2;


        const shaftRight =
            cx +
            shaftWidth / 2;


        const headLeft =
            cx -
            arrowWidth / 2;


        const headRight =
            cx +
            arrowWidth / 2;


        const points = [

            `${cx},${tipY}`,

            `${headLeft},${headBaseY}`,

            `${shaftLeft},${headBaseY}`,

            `${shaftLeft},${bottomY}`,

            `${shaftRight},${bottomY}`,

            `${shaftRight},${headBaseY}`,

            `${headRight},${headBaseY}`

        ].join(" ");


        const arrow =
            document.createElementNS(
                svgNS,
                "polygon"
            );


        arrow.classList.add(
            "arrow-visible"
        );


        arrow.setAttribute(
            "points",
            points
        );


        arrow.setAttribute(
            "fill",
            "#ffffff"
        );


        arrow.setAttribute(
            "stroke",
            "#ffffff"
        );


        arrow.setAttribute(
            "stroke-width",
            "1.5"
        );


        let angle = 0;


        if (
            data.direction === "→"
        ) {

            angle = 90;

        }

        else if (
            data.direction === "↓"
        ) {

            angle = 180;

        }

        else if (
            data.direction === "←"
        ) {

            angle = 270;

        }


        arrow.setAttribute(

            "transform",

            `rotate(${angle} ${cx} ${cy})`

        );


        /* =================================================
           HIT AREA
        ================================================= */

        const hit =
            document.createElementNS(
                svgNS,
                "circle"
            );


        hit.classList.add(
            "arrow-hit"
        );


        hit.setAttribute(
            "cx",
            cx
        );


        hit.setAttribute(
            "cy",
            cy
        );


        hit.setAttribute(
            "r",
            Math.min(

                cellSize * 0.43,

                42

            )

        );


        hit.setAttribute(
            "fill",
            "transparent"
        );


        hit.setAttribute(
            "stroke",
            "transparent"
        );


        hit.style.pointerEvents =
            "all";


        group.appendChild(
            arrow
        );


        group.appendChild(
            hit
        );


        const piece = {

            group,

            arrow,

            data,

            index,

            row:
                data.row,

            col:
                data.col,

            direction:
                data.direction,

            dr:
                data.dr,

            dc:
                data.dc,

            removed:
                false

        };


        hit.addEventListener(

            "pointerdown",

            event => {

                event.preventDefault();


                if (paused) {

                    return;

                }


                selectArrow(
                    piece
                );

            }

        );


        return piece;

    }


    /* =====================================================
       SELECT ARROW
    ===================================================== */

    function selectArrow(
        piece
    ) {

        if (busy) {

            return;

        }


        if (paused) {

            return;

        }


        if (piece.removed) {

            return;

        }


        levelAttempts++;

        sessionAttempts++;


        const clear =
            canLeave(
                piece
            );


        if (!clear) {

            levelMistakes++;

            lives--;


            updateLives();


            piece.group.classList.add(
                "blocked"
            );


            setTimeout(

                () => {

                    piece.group.classList.remove(
                        "blocked"
                    );

                },

                260

            );


            messageEl.textContent =
                "BLOCKED — TRY ANOTHER ARROW";


            if (
                lives <= 0
            ) {

                endGame();

            }


            return;

        }


        levelSuccessfulMoves++;

        sessionSuccessfulMoves++;


        removeArrow(
            piece
        );

    }


    /* =====================================================
       CHECK ARROW PATH
    ===================================================== */

    function canLeave(
        piece
    ) {

        let row =
            piece.row +
            piece.dr;


        let col =
            piece.col +
            piece.dc;


        while (

            row >= 0 &&

            row < levelData.size &&

            col >= 0 &&

            col < levelData.size

        ) {


            const blocked =
                pieces.some(

                    other => {

                        return (

                            !other.removed &&

                            other !== piece &&

                            other.row === row &&

                            other.col === col

                        );

                    }

                );


            if (blocked) {

                return false;

            }


            row +=
                piece.dr;


            col +=
                piece.dc;

        }


        return true;

    }


    /* =====================================================
       REMOVE ARROW
    ===================================================== */

    function removeArrow(
        piece
    ) {

        if (
            piece.removed
        ) {

            return;

        }


        piece.removed =
            true;


        let exitX = 0;

        let exitY = 0;


        const distance =
            1000;


        if (
            piece.direction === "↑"
        ) {

            exitY =
                -distance;

        }

        else if (
            piece.direction === "→"
        ) {

            exitX =
                distance;

        }

        else if (
            piece.direction === "↓"
        ) {

            exitY =
                distance;

        }

        else if (
            piece.direction === "←"
        ) {

            exitX =
                -distance;

        }


        piece.group.style.setProperty(

            "--exit-x",

            `${exitX}px`

        );


        piece.group.style.setProperty(

            "--exit-y",

            `${exitY}px`

        );


        piece.group.classList.add(
            "clearing"
        );


        removedCount++;


        const points =
            Math.max(

                10,

                100 -
                currentLevel * 2

            );


        score +=
            points;


        updateScore();


        saveProgress();


        progressEl.textContent =
            `${removedCount} / ${totalArrows}`;


        messageEl.textContent =
            "CLEAR — NICE MOVE";


        if (
            removedCount >=
            totalArrows
        ) {

            finishLevel();

        }

    }


    /* =====================================================
       FINISH LEVEL
    ===================================================== */

    function finishLevel() {

        if (busy) {

            return;

        }


        busy = true;


        stopTimer();


        const elapsed =
            (
                performance.now() -
                levelStartTime
            ) / 1000;


        /*
         * Perfect level.
         */

        if (
            levelMistakes === 0
        ) {

            profile.perfectLevels++;

        }


        /*
         * Best time.
         */

        if (

            profile.bestTime === null ||

            elapsed <
            profile.bestTime

        ) {

            profile.bestTime =
                elapsed;

        }


        /*
         * Update highest level.
         */

        profile.highLevel =
            Math.max(

                profile.highLevel,

                currentLevel

            );


        profile.highScore =
            Math.max(

                profile.highScore,

                score

            );


        /*
         * Add ONLY the statistics
         * belonging to this level.
         */

        profile.attempts +=
            levelAttempts;


        profile.successfulMoves +=
            levelSuccessfulMoves;


        saveProfile();


        /*
         * Unlock the next level.
         */

        unlockedLevel =
            Math.max(

                unlockedLevel,

                currentLevel + 1

            );


        currentLevel++;


        saveProgress();


        messageEl.textContent =
            `LEVEL ${currentLevel - 1} CLEAR ✓`;


        /*
         * Automatically continue.
         */

        nextLevelTimer =
            setTimeout(

                () => {

                    nextLevelTimer =
                        null;


                    loadLevel();

                },

                1000

            );

    }


    /* =====================================================
       TIMER
    ===================================================== */

    function startTimer() {

        stopTimer();


        if (paused) {

            return;

        }


        timerInterval =
            setInterval(

                () => {

                    if (paused) {

                        return;

                    }


                    const elapsed =
                        (
                            performance.now() -
                            levelStartTime
                        ) / 1000;


                    timerEl.textContent =
                        elapsed.toFixed(2);

                },

                40

            );

    }


    function stopTimer() {

        if (
            timerInterval !== null
        ) {

            clearInterval(
                timerInterval
            );


            timerInterval =
                null;

        }

    }


    function clearNextLevelTimer() {

        if (
            nextLevelTimer !== null
        ) {

            clearTimeout(
                nextLevelTimer
            );


            nextLevelTimer =
                null;

        }

    }


    /* =====================================================
       PAUSE
    ===================================================== */

    window.pauseGame =
        function () {

            if (!gameStarted) {

                return;

            }


            if (busy) {

                return;

            }


            if (paused) {

                return;

            }


            paused = true;


            pausedElapsed =
                (
                    performance.now() -
                    levelStartTime
                ) / 1000;


            stopTimer();


            messageEl.textContent =
                "GAME PAUSED";


            showPauseOverlay();

        };


    /* =====================================================
       RESUME
    ===================================================== */

    window.resumeGame =
        function () {

            if (!paused) {

                return;

            }


            paused = false;


            levelStartTime =
                performance.now() -
                (
                    pausedElapsed *
                    1000
                );


            hidePauseOverlay();


            messageEl.textContent =
                "Tap an arrow with a clear path.";


            startTimer();

        };


    /* =====================================================
       PAUSE OVERLAY
    ===================================================== */

    function showPauseOverlay() {

        let overlay =
            document.getElementById(
                "arrowPauseOverlay"
            );


        if (!overlay) {

            overlay =
                document.createElement(
                    "div"
                );


            overlay.id =
                "arrowPauseOverlay";


            overlay.innerHTML = `

                <div class="arrow-pause-panel">

                    <div class="arrow-pause-title">
                        GAME PAUSED
                    </div>

                    <button
                        type="button"
                        onclick="resumeGame()"
                    >
                        ▶ RESUME
                    </button>

                    <button
                        type="button"
                        onclick="restartCurrentLevel()"
                    >
                        ↻ RESTART LEVEL
                    </button>

                    <button
                        type="button"
                        onclick="stopToDashboard()"
                        class="secondary-button"
                    >
                        🏠 DASHBOARD
                    </button>

                </div>

            `;


            document.body.appendChild(
                overlay
            );


            addPauseStyles();

        }


        overlay.classList.add(
            "visible"
        );

    }


    /* =====================================================
       HIDE PAUSE OVERLAY
    ===================================================== */

    function hidePauseOverlay() {

        const overlay =
            document.getElementById(
                "arrowPauseOverlay"
            );


        if (overlay) {

            overlay.classList.remove(
                "visible"
            );

        }

    }


    /* =====================================================
       PAUSE STYLES
    ===================================================== */

    function addPauseStyles() {

        if (
            document.getElementById(
                "arrowheadPauseStyles"
            )
        ) {

            return;

        }


        const style =
            document.createElement(
                "style"
            );


        style.id =
            "arrowheadPauseStyles";


        style.textContent = `

            #arrowPauseOverlay {

                position: fixed;

                inset: 0;

                z-index: 99999;

                display: flex;

                align-items: center;

                justify-content: center;

                background:
                    rgba(0,0,0,0.82);

                opacity: 0;

                pointer-events: none;

                transition:
                    opacity 0.2s ease;

                backdrop-filter:
                    blur(10px);

            }


            #arrowPauseOverlay.visible {

                opacity: 1;

                pointer-events: auto;

            }


            .arrow-pause-panel {

                width:
                    min(90vw, 380px);

                padding: 32px;

                text-align: center;

                border:
                    1px solid
                    rgba(255,255,255,0.16);

                border-radius: 18px;

                background:
                    rgba(15,15,15,0.96);

                box-shadow:
                    0 25px 80px
                    rgba(0,0,0,0.6);

            }


            .arrow-pause-title {

                color: #fff;

                font-size: 24px;

                font-weight: 700;

                letter-spacing: 3px;

                margin-bottom: 25px;

            }


            .arrow-pause-panel button {

                width: 100%;

                margin: 7px 0;

                min-height: 48px;

                border: none;

                border-radius: 10px;

                cursor: pointer;

                font-weight: 700;

                letter-spacing: 1px;

            }


            .arrow-pause-panel
            .secondary-button {

                background:
                    rgba(255,255,255,0.08);

                color: #fff;

                border:
                    1px solid
                    rgba(255,255,255,0.15);

            }

        `;


        document.head.appendChild(
            style
        );

    }


    /* =====================================================
       RESTART CURRENT LEVEL
    ===================================================== */

    window.restartCurrentLevel =
        function () {

            hidePauseOverlay();


            stopTimer();

            clearNextLevelTimer();


            paused = false;

            busy = false;


            lives = 3;

            removedCount = 0;

            levelMistakes = 0;


            updateLives();


            loadLevel();

        };


    /* =====================================================
       STOP TO DASHBOARD
    ===================================================== */

    window.stopToDashboard =
        function () {

            hidePauseOverlay();


            stopTimer();

            clearNextLevelTimer();


            paused = false;


            saveProgress();


            busy = true;

            gameStarted = false;


            showDashboard();

        };


    /* =====================================================
       SCORE
    ===================================================== */

    function updateScore() {

        scoreEl.textContent =
            score;

    }


    /* =====================================================
       LIVES
    ===================================================== */

    function updateLives() {

        const heartCount =
            Math.max(
                0,
                lives
            );


        livesEl.textContent =
            heartCount > 0

                ? "♥ ".repeat(
                    heartCount
                ).trim()

                : "0";


        if (
            lives === 3
        ) {

            livesEl.classList.remove(
                "danger"
            );

        }

        else {

            livesEl.classList.add(
                "danger"
            );

        }

    }


    /* =====================================================
       GAME OVER
    ===================================================== */

    function endGame() {

        busy = true;


        stopTimer();

        clearNextLevelTimer();


        /*
         * Add this failed level's statistics once.
         */

        profile.attempts +=
            levelAttempts;


        profile.successfulMoves +=
            levelSuccessfulMoves;


        profile.highScore =
            Math.max(

                profile.highScore,

                score

            );


        profile.highLevel =
            Math.max(

                profile.highLevel,

                currentLevel

            );


        saveProfile();


        saveProgress();


        finalScoreEl.innerHTML =

            `<strong>${score}</strong>
             <span>POINTS</span>
             <small>LEVEL ${currentLevel}</small>`;


        gameOver.classList.remove(
            "hidden"
        );

    }


    /* =====================================================
       RETRY CURRENT LEVEL
    ===================================================== */

    window.restartGame =
        function () {

            stopTimer();

            clearNextLevelTimer();


            gameOver.classList.add(
                "hidden"
            );


            lives = 3;

            removedCount = 0;

            levelMistakes = 0;

            paused = false;

            busy = false;


            updateScore();

            updateLives();


            loadLevel();

        };


    /* =====================================================
       DASHBOARD
    ===================================================== */

    window.showDashboard =
        function () {

            stopTimer();

            clearNextLevelTimer();

            hidePauseOverlay();


            gameOver.classList.add(
                "hidden"
            );


            gameScreen.classList.add(
                "hidden"
            );


            loginScreen.classList.add(
                "hidden"
            );


            if (levelSelectScreen) {

                levelSelectScreen.classList.add(
                    "hidden"
                );

            }


            dashboard.classList.remove(
                "hidden"
            );


            updateDashboard();

        };


    /* =====================================================
       UPDATE DASHBOARD
    ===================================================== */

    function updateDashboard() {

        const totalAttempts =
            profile.attempts;


        const accuracy =

            totalAttempts > 0

                ? Math.min(

                    100,

                    Math.round(

                        (
                            profile.successfulMoves /
                            totalAttempts

                        ) * 100

                    )

                )

                : 0;


        welcomeEl.textContent =
            `WELCOME, ${
                profile.name ||
                playerName ||
                "PLAYER"
            }`;


        highScoreEl.textContent =
            profile.highScore;


        highLevelEl.textContent =
            profile.highLevel;


        gamesPlayedEl.textContent =
            profile.gamesPlayed;


        accuracyEl.textContent =
            `${accuracy}%`;


        bestTimeEl.textContent =

            profile.bestTime === null

                ? "--"

                : `${profile.bestTime.toFixed(2)}s`;


        perfectLevelsEl.textContent =
            profile.perfectLevels;

    }


    /* =====================================================
       PLAY AGAIN / CONTINUE
    ===================================================== */

    window.playAgain =
        function () {

            stopTimer();

            clearNextLevelTimer();


            const progress =
                loadProgress();


            currentLevel =
                progress.currentLevel;


            unlockedLevel =
                progress.unlockedLevel;


            score =
                progress.score;


            lives = 3;

            levelAttempts = 0;

            levelSuccessfulMoves = 0;

            levelMistakes = 0;

            paused = false;

            busy = false;

            gameStarted = true;


            showGameScreen();


            updateScore();

            updateLives();


            loadLevel();

        };


    /* =====================================================
       LEVEL SELECT
    ===================================================== */

    window.showLevelSelect =
        function () {

            stopTimer();

            clearNextLevelTimer();

            hidePauseOverlay();


            gameScreen.classList.add(
                "hidden"
            );


            dashboard.classList.add(
                "hidden"
            );


            loginScreen.classList.add(
                "hidden"
            );


            gameOver.classList.add(
                "hidden"
            );


            if (!levelSelectScreen) {

                /*
                 * The matching index.html will
                 * provide this screen.
                 */

                return;

            }


            levelSelectScreen.classList.remove(
                "hidden"
            );


            renderLevelSelect();

        };


    /* =====================================================
       RENDER LEVEL SELECT
    ===================================================== */

    function renderLevelSelect() {

        if (!levelGrid) {

            return;

        }


        levelGrid.innerHTML = "";


        /*
         * Show a useful window of levels.
         *
         * Infinite levels continue beyond this.
         */

        const visibleLevels =
            Math.max(

                24,

                unlockedLevel + 8

            );


        for (
            let level = 1;
            level <= visibleLevels;
            level++
        ) {

            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";


            button.className =
                "level-card";


            if (
                level <
                unlockedLevel
            ) {

                button.classList.add(
                    "completed"
                );

            }


            if (
                level ===
                unlockedLevel
            ) {

                button.classList.add(
                    "current"
                );

            }


            if (
                level >
                unlockedLevel
            ) {

                button.classList.add(
                    "locked"
                );

                button.disabled =
                    true;

            }


            const number =
                document.createElement(
                    "strong"
                );


            number.textContent =
                level;


            const status =
                document.createElement(
                    "span"
                );


            if (
                level <
                unlockedLevel
            ) {

                status.textContent =
                    "✓";

            }

            else if (
                level ===
                unlockedLevel
            ) {

                status.textContent =
                    "PLAY";

            }

            else {

                status.textContent =
                    "🔒";

            }


            button.appendChild(
                number
            );


            button.appendChild(
                status
            );


            if (
                level <=
                unlockedLevel
            ) {

                button.addEventListener(

                    "click",

                    () => {

                        selectLevel(
                            level
                        );

                    }

                );

            }


            levelGrid.appendChild(
                button
            );

        }

    }


    /* =====================================================
       SELECT LEVEL
    ===================================================== */

    function selectLevel(
        level
    ) {

        const requested =
            Math.max(
                1,
                Number(level) || 1
            );


        if (
            requested >
            unlockedLevel
        ) {

            return;

        }


        currentLevel =
            requested;


        /*
         * Selecting an older level
         * should not destroy the
         * player's saved progress.
         *
         * Score remains available.
         */

        paused = false;

        busy = false;

        gameStarted = true;


        saveProgress();


        showGameScreen();


        updateScore();

        updateLives();


        loadLevel();

    }


    window.selectLevel =
        selectLevel;


    /* =====================================================
       BACK TO DASHBOARD
    ===================================================== */

    window.backToDashboard =
        function () {

            if (levelSelectScreen) {

                levelSelectScreen.classList.add(
                    "hidden"
                );

            }


            showDashboard();

        };


    /* =====================================================
       STARTUP
    ===================================================== */

    addPauseStyles();


})();