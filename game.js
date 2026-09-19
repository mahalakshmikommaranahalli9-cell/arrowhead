/* =========================================================
   ARROWHEAD — TAP-AWAY GAME ENGINE
   Infinite Tap-Away Levels
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
       GAME STATE
    ===================================================== */

    let playerName = "";

    let currentLevel = 1;

    let score = 0;

    let lives = 3;

    let removedCount = 0;

    let totalArrows = 0;

    let attempts = 0;

    let successfulMoves = 0;

    let levelMistakes = 0;

    let levelStartTime = 0;

    let timerInterval = null;

    let nextLevelTimer = null;

    let levelData = null;

    let pieces = [];

    let busy = false;


    /* =====================================================
       STORAGE
    ===================================================== */

    const PROFILE_KEY =
        "arrowhead-profile";


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


    function saveProfile() {

        localStorage.setItem(

            PROFILE_KEY,

            JSON.stringify(profile)

        );

    }


    /* =====================================================
       LOGIN
    ===================================================== */

    window.startGame = function () {

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


        profile.gamesPlayed++;


        saveProfile();


        beginGame();

    };


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


    /* =====================================================
       START GAME
    ===================================================== */

    function beginGame() {

        stopTimer();

        clearNextLevelTimer();


        currentLevel = 1;

        score = 0;

        lives = 3;

        attempts = 0;

        successfulMoves = 0;

        levelMistakes = 0;

        busy = false;


        loginScreen.classList.add(
            "hidden"
        );

        dashboard.classList.add(
            "hidden"
        );

        gameOver.classList.add(
            "hidden"
        );

        gameScreen.classList.remove(
            "hidden"
        );


        updateScore();

        updateLives();

        loadLevel();

    }


    /* =====================================================
       LOAD LEVEL
    ===================================================== */

    function loadLevel() {

        stopTimer();

        clearNextLevelTimer();


        levelData =
            ArrowLevels.getLevel(
                currentLevel
            );


        pieces = [];

        removedCount = 0;

        totalArrows =
            levelData.arrows.length;

        levelMistakes = 0;

        busy = false;


        levelEl.textContent =
            currentLevel;


        progressEl.textContent =
            `0 / ${totalArrows}`;


        messageEl.textContent =
            "Tap an arrow with a clear path.";


        /*
         * Important:
         * Each level starts with 3 lives.
         */

        lives = 3;

        updateLives();


        renderBoard();


        levelStartTime =
            performance.now();


        startTimer();

    }


    /* =====================================================
       RENDER BOARD
       
       IMPORTANT FIX:
       The SVG is 1000 × 700.
       Cell size now uses BOTH width and height.
       Therefore no row can be generated outside
       the visible SVG.
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


        /*
         * SVG dimensions.
         */

        const VIEW_WIDTH = 1000;

        const VIEW_HEIGHT = 700;


        /*
         * Safe margins.
         */

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


        /*
         * THIS is the important fix.
         *
         * Cell size must fit BOTH
         * the width and the height.
         */

        const cellSize =
            Math.min(

                usableWidth / size,

                usableHeight / size

            );


        /*
         * Center the entire grid.
         */

        const gridWidth =
            cellSize * size;


        const gridHeight =
            cellSize * size;


        const offsetX =
            (VIEW_WIDTH -
                gridWidth) / 2;


        const offsetY =
            (VIEW_HEIGHT -
                gridHeight) / 2;


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


        /*
         * Create every arrow.
         */

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


        /* -------------------------------------------------
           CENTER OF CELL
        ------------------------------------------------- */

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


        /* -------------------------------------------------
           ARROW SIZE
        ------------------------------------------------- */

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


        /*
         * Clean upward arrow.
         */

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


        /*
         * Rotate according to direction.
         */

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


        /* -------------------------------------------------
           INVISIBLE HIT AREA
        ------------------------------------------------- */

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


        /* -------------------------------------------------
           PIECE DATA
        ------------------------------------------------- */

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


        /* -------------------------------------------------
           TAP / CLICK
        ------------------------------------------------- */

        hit.addEventListener(

            "pointerdown",

            event => {

                event.preventDefault();

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


        if (piece.removed) {

            return;

        }


        attempts++;


        /*
         * Check the entire path.
         */

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


        successfulMoves++;


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


        /*
         * Follow the arrow all the way
         * to the board edge.
         */

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


        /*
         * Direction-based exit.
         */

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


        /*
         * Score.
         */

        const points =
            Math.max(

                10,

                100 -
                currentLevel * 2

            );


        score +=
            points;


        updateScore();


        /*
         * Progress.
         */

        progressEl.textContent =
            `${removedCount} / ${totalArrows}`;


        messageEl.textContent =
            "CLEAR — NICE MOVE";


        /*
         * ALL ARROWS REMOVED.
         */

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
         * High level.
         */

        profile.highLevel =
            Math.max(

                profile.highLevel,

                currentLevel

            );


        /*
         * High score.
         */

        profile.highScore =
            Math.max(

                profile.highScore,

                score

            );


        /*
         * Save statistics.
         */

        profile.attempts +=
            attempts;


        profile.successfulMoves +=
            successfulMoves;


        saveProfile();


        messageEl.textContent =
            `LEVEL ${currentLevel} CLEAR ✓`;


        /*
         * Automatically move to
         * the next infinite level.
         */

        nextLevelTimer =
            setTimeout(

                () => {

                    nextLevelTimer =
                        null;


                    currentLevel++;


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


        timerInterval =
            setInterval(

                () => {

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

        livesEl.textContent =
            "♥ ".repeat(
                Math.max(
                    0,
                    lives
                )
            ).trim();


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


        profile.highScore =
            Math.max(

                profile.highScore,

                score

            );


        profile.attempts +=
            attempts;


        profile.successfulMoves +=
            successfulMoves;


        saveProfile();


        finalScoreEl.innerHTML =

            `<strong>${score}</strong>
             <span>POINTS</span>`;


        gameOver.classList.remove(
            "hidden"
        );

    }


    /* =====================================================
       RETRY
    ===================================================== */

    window.restartGame =
        function () {

            stopTimer();

            clearNextLevelTimer();


            gameOver.classList.add(
                "hidden"
            );


            currentLevel = 1;

            score = 0;

            lives = 3;

            attempts = 0;

            successfulMoves = 0;

            levelMistakes = 0;

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


            gameOver.classList.add(
                "hidden"
            );


            gameScreen.classList.add(
                "hidden"
            );


            loginScreen.classList.add(
                "hidden"
            );


            dashboard.classList.remove(
                "hidden"
            );


            updateDashboard();

        };


    function updateDashboard() {

        const totalAttempts =
            profile.attempts;


        const accuracy =

            totalAttempts > 0

                ? Math.round(

                    (
                        profile.successfulMoves /
                        totalAttempts

                    ) * 100

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
       PLAY AGAIN
    ===================================================== */

    window.playAgain =
        function () {

            stopTimer();

            clearNextLevelTimer();


            dashboard.classList.add(
                "hidden"
            );


            gameScreen.classList.remove(
                "hidden"
            );


            currentLevel = 1;

            score = 0;

            lives = 3;

            attempts = 0;

            successfulMoves = 0;

            levelMistakes = 0;

            busy = false;


            updateScore();

            updateLives();


            loadLevel();

        };


})();