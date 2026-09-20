/* =========================================================
   ARROWHEAD 7.0 — TAP-AWAY GAME ENGINE

   FEATURES
   ---------------------------------------------------------
   ✓ 3 lives per level
   ✓ Same-level retry
   ✓ Infinite procedural levels
   ✓ Saved current level
   ✓ Saved unlocked levels
   ✓ Level Select
   ✓ Pause / Resume
   ✓ Restart Level
   ✓ Dashboard
   ✓ High Score / Statistics
   ✓ Coins / Level Rewards
   ✓ SINGLE REWARD CALCULATION
   ✓ Local Scoreboard
   ✓ GLOBAL ONLINE LEADERBOARD
   ✓ LIVE PLAYERS
   ✓ Supabase connection
   ✓ Achievement Badges
   ✓ Touch + Mouse
   ✓ Mobile + Laptop
   ✓ Q&A handled by qa.js
   ✓ EXACTLY ONE Q&A after every 10 levels
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

    const levelSelectScreen =
        document.getElementById("levelSelectScreen");

    const levelGrid =
        document.getElementById("levelGrid");


    /* =====================================================
       STATE
    ===================================================== */

    let playerName = "";

    let currentLevel = 1;

    let unlockedLevel = 1;

    let score = 0;

    let coins = 0;

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
       SESSION
    ===================================================== */

    let sessionAttempts = 0;

    let sessionSuccessfulMoves = 0;


    /* =====================================================
       ONLINE STATE
    ===================================================== */

    let onlineConnected = false;

    let globalLeaderboard = [];

    let livePlayers = [];


    /* =====================================================
       STORAGE KEYS
    ===================================================== */

    const PROFILE_KEY =
        "arrowhead-profile";

    const PROGRESS_KEY =
        "arrowhead-progress";

    const LEADERBOARD_KEY =
        "arrowhead-leaderboard";


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

            perfectLevels: 0,

            levelsCompleted: 0,

            qaCorrect: 0,

            coins: 0,

            badges: []

        };

    }


    /* =====================================================
       PROFILE
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


    function saveProfile() {

        try {

            localStorage.setItem(
                PROFILE_KEY,
                JSON.stringify(profile)
            );

        }

        catch {

            /* Storage unavailable */

        }

    }


    /* =====================================================
       PROGRESS
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

                    score: 0,

                    coins: 0

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
                    ),

                coins:
                    Math.max(
                        0,
                        Number(
                            data.coins
                        ) || 0
                    )

            };

        }

        catch {

            return {

                currentLevel: 1,

                unlockedLevel: 1,

                score: 0,

                coins: 0

            };

        }

    }


    function saveProgress() {

        try {

            localStorage.setItem(

                PROGRESS_KEY,

                JSON.stringify({

                    currentLevel,

                    unlockedLevel,

                    score,

                    coins

                })

            );

        }

        catch {

            /* Storage unavailable */

        }

    }


    /* =====================================================
       BADGES
    ===================================================== */

    const BADGES = [

        {
            id: "first-clear",
            icon: "🎯",
            name: "FIRST CLEAR",
            description:
                "Complete your first level.",
            check:
                () => profile.levelsCompleted >= 1
        },

        {
            id: "perfect",
            icon: "💯",
            name: "PERFECT",
            description:
                "Complete a level without mistakes.",
            check:
                () => profile.perfectLevels >= 1
        },

        {
            id: "five-streak",
            icon: "🔥",
            name: "FIVE STREAK",
            description:
                "Complete five levels.",
            check:
                () => profile.levelsCompleted >= 5
        },

        {
            id: "logic-master",
            icon: "🧠",
            name: "LOGIC MASTER",
            description:
                "Reach Level 10.",
            check:
                () => profile.highLevel >= 10
        },

        {
            id: "arrow-expert",
            icon: "🚀",
            name: "ARROW EXPERT",
            description:
                "Reach Level 25.",
            check:
                () => profile.highLevel >= 25
        },

        {
            id: "arrowhead-master",
            icon: "👑",
            name: "ARROWHEAD MASTER",
            description:
                "Reach Level 50.",
            check:
                () => profile.highLevel >= 50
        },

        {
            id: "infinite-mind",
            icon: "♾️",
            name: "INFINITE MIND",
            description:
                "Reach Level 100.",
            check:
                () => profile.highLevel >= 100
        },

        {
            id: "qa-master",
            icon: "🧩",
            name: "CHALLENGE MASTER",
            description:
                "Answer a milestone Q&A correctly.",
            check:
                () => profile.qaCorrect >= 1
        }

    ];


    function loadBadges() {

        if (
            !Array.isArray(
                profile.badges
            )
        ) {

            profile.badges = [];

        }

        return profile.badges;

    }


    function unlockBadges() {

        loadBadges();

        const newlyUnlocked = [];


        BADGES.forEach(
            badge => {

                if (

                    badge.check() &&

                    !profile.badges.includes(
                        badge.id
                    )

                ) {

                    profile.badges.push(
                        badge.id
                    );

                    newlyUnlocked.push(
                        badge
                    );

                }

            }
        );


        if (
            newlyUnlocked.length
        ) {

            saveProfile();

            showBadgeNotification(
                newlyUnlocked
            );

        }

    }


    /* =====================================================
       BADGE TOAST
    ===================================================== */

    function showBadgeNotification(
        badges
    ) {

        const old =
            document.getElementById(
                "arrowBadgeToast"
            );

        if (old) {

            old.remove();

        }


        const toast =
            document.createElement(
                "div"
            );


        toast.id =
            "arrowBadgeToast";


        toast.innerHTML = `

            <div class="badge-toast-inner">

                <div class="badge-toast-title">
                    🏅 BADGE UNLOCKED
                </div>

                <div class="badge-toast-items">

                    ${badges.map(
                        badge => `

                        <div class="badge-toast-item">

                            <span>
                                ${badge.icon}
                            </span>

                            <div>

                                <strong>
                                    ${badge.name}
                                </strong>

                                <small>
                                    ${badge.description}
                                </small>

                            </div>

                        </div>

                    `
                    ).join("")}

                </div>

            </div>

        `;


        document.body.appendChild(
            toast
        );


        addAchievementStyles();


        requestAnimationFrame(
            () => {

                toast.classList.add(
                    "show"
                );

            }
        );


        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

                setTimeout(
                    () => {

                        if (toast) {
                            toast.remove();
                        }

                    },
                    300
                );

            },
            3500
        );

    }


    /* =====================================================
       ACHIEVEMENT STYLES
    ===================================================== */

    function addAchievementStyles() {

        if (
            document.getElementById(
                "arrowheadAchievementStyles"
            )
        ) {

            return;

        }


        const style =
            document.createElement(
                "style"
            );


        style.id =
            "arrowheadAchievementStyles";


        style.textContent = `

            #arrowBadgeToast {

                position: fixed;
                top: 25px;
                right: 25px;
                z-index: 100000;

                width:
                    min(90vw, 360px);

                transform:
                    translateX(120%);

                opacity: 0;

                transition:
                    transform .3s ease,
                    opacity .3s ease;

            }

            #arrowBadgeToast.show {

                transform:
                    translateX(0);

                opacity: 1;

            }

            .badge-toast-inner {

                padding: 18px;

                border:
                    1px solid
                    rgba(255,255,255,.18);

                border-radius: 14px;

                background:
                    rgba(12,12,12,.96);

                box-shadow:
                    0 20px 60px
                    rgba(0,0,0,.55);

                backdrop-filter:
                    blur(12px);

            }

            .badge-toast-title {

                color: #fff;

                font-size: 11px;

                font-weight: 800;

                letter-spacing: 2px;

                margin-bottom: 12px;

            }

            .badge-toast-item {

                display: flex;

                align-items: center;

                gap: 12px;

                padding: 8px 0;

                color: #fff;

            }

            .badge-toast-item > span {

                font-size: 25px;

            }

            .badge-toast-item strong {

                display: block;

                font-size: 10px;

                letter-spacing: 1px;

            }

            .badge-toast-item small {

                display: block;

                margin-top: 3px;

                color:
                    rgba(255,255,255,.48);

                font-size: 8px;

            }

            .arrow-dashboard-section {

                margin-top: 25px;

                padding-top: 25px;

                border-top:
                    1px solid
                    rgba(255,255,255,.08);

            }

            .arrow-section-title {

                margin-bottom: 15px;

                color: #fff;

                font-size: 13px;

                font-weight: 800;

                letter-spacing: 2px;

                text-align: center;

            }

            .arrow-badges-grid {

                display: grid;

                grid-template-columns:
                    repeat(4, 1fr);

                gap: 10px;

            }

            .arrow-badge {

                min-height: 105px;

                padding: 12px 8px;

                border:
                    1px solid
                    rgba(255,255,255,.1);

                border-radius: 10px;

                background:
                    rgba(255,255,255,.025);

                text-align: center;

            }

            .arrow-badge.locked {

                opacity: .3;

                filter: grayscale(1);

            }

            .arrow-badge-icon {

                font-size: 27px;

                margin-bottom: 7px;

            }

            .arrow-badge-name {

                color: #fff;

                font-size: 8px;

                font-weight: 800;

                letter-spacing: 1px;

            }

            .arrow-badge-description {

                margin-top: 5px;

                color:
                    rgba(255,255,255,.42);

                font-size: 7px;

                line-height: 1.4;

            }

            .arrow-scoreboard {

                width: 100%;

                overflow-x: auto;

            }

            .arrow-score-row {

                display: grid;

                grid-template-columns:
                    42px
                    minmax(100px, 1fr)
                    90px
                    70px
                    70px;

                align-items: center;

                gap: 8px;

                min-width: 390px;

                padding: 11px 8px;

                border-bottom:
                    1px solid
                    rgba(255,255,255,.06);

                color: #fff;

                font-size: 9px;

            }

            .arrow-score-row.header {

                color:
                    rgba(255,255,255,.35);

                font-size: 7px;

                font-weight: 800;

                letter-spacing: 1px;

            }

            .arrow-score-row.me {

                background:
                    rgba(255,255,255,.07);

                border-radius: 6px;

            }

            .arrow-live-player {

                display: flex;

                align-items: center;

                justify-content: space-between;

                gap: 12px;

                padding: 11px 12px;

                margin: 6px 0;

                border:
                    1px solid
                    rgba(255,255,255,.08);

                border-radius: 10px;

                background:
                    rgba(255,255,255,.025);

                color: #fff;

            }

            .arrow-live-left {

                min-width: 0;

            }

            .arrow-live-name {

                font-size: 10px;

                font-weight: 800;

            }

            .arrow-live-status {

                color: rgba(255,255,255,.45);

                font-size: 8px;

                margin-top: 4px;

            }

            .arrow-live-dot {

                color: #6cff8b;

                font-size: 10px;

                margin-right: 5px;

            }

            .arrow-live-coins {

                white-space: nowrap;

                font-size: 9px;

            }

            @media (max-width:600px) {

                .arrow-badges-grid {

                    grid-template-columns:
                        repeat(2, 1fr);

                }

                #arrowBadgeToast {

                    top: 12px;
                    right: 12px;

                }

            }

        `;


        document.head.appendChild(
            style
        );

    }


    /* =====================================================
       LOGIN
    ===================================================== */

    window.startGame =
        function () {

            const name =
                playerNameInput
                    ? playerNameInput.value.trim()
                    : "";


            if (!name) {

                if (playerNameInput) {
                    playerNameInput.focus();
                }

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


            const progress =
                loadProgress();


            currentLevel =
                progress.currentLevel;

            unlockedLevel =
                progress.unlockedLevel;

            score =
                progress.score;

            coins =
                Math.max(
                    profile.coins || 0,
                    progress.coins || 0
                );


            profile.coins =
                coins;


            levelAttempts = 0;

            levelSuccessfulMoves = 0;

            levelMistakes = 0;

            sessionAttempts = 0;

            sessionSuccessfulMoves = 0;

            lives = 3;

            paused = false;

            busy = false;

            gameStarted = true;


            saveProfile();


            showGameScreen();


            updateScore();

            updateLives();

            loadLevel();


            connectOnline();

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
       ONLINE CONNECTION
    ===================================================== */

    async function connectOnline() {

        try {

            if (
                !window.ArrowheadOnline ||
                typeof window.ArrowheadOnline.init !==
                "function"
            ) {

                console.warn(
                    "ARROWHEAD: Online system unavailable."
                );

                return;

            }


            const connected =
                window.ArrowheadOnline.init();


            if (!connected) {

                console.warn(
                    "ARROWHEAD: Offline mode."
                );

                return;

            }


            onlineConnected = true;


            const onlinePlayer =
                await window.ArrowheadOnline.registerPlayer(
                    playerName
                );


            if (onlinePlayer) {

                /*
                 * Restore the larger online balance
                 * if this browser has an older local copy.
                 */

                coins =
                    Math.max(
                        coins,
                        Number(
                            onlinePlayer.coins
                        ) || 0
                    );


                profile.coins =
                    coins;


                saveProfile();

                saveProgress();

            }


            window.ArrowheadOnline.startRefresh();


            console.log(
                "ARROWHEAD: ONLINE MODE ACTIVE"
            );


        }

        catch (error) {

            onlineConnected = false;

            console.warn(
                "ARROWHEAD: Online connection failed.",
                error
            );

        }

    }


    /* =====================================================
       ONLINE LIVE DATA
    ===================================================== */

    window.addEventListener(
        "arrowhead-online-update",
        event => {

            const data =
                event.detail || {};


            globalLeaderboard =
                Array.isArray(
                    data.leaderboard
                )
                    ? data.leaderboard
                    : [];


            livePlayers =
                Array.isArray(
                    data.livePlayers
                )
                    ? data.livePlayers
                    : [];


            if (
                dashboard &&
                !dashboard.classList.contains(
                    "hidden"
                )
            ) {

                updateDashboard();

            }

        }
    );


    /* =====================================================
       SHOW GAME
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


        lives = 3;


        updateLives();

        updateScore();


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
            (data, index) => {

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
            data.col * cellSize +
            cellSize / 2;


        const cy =
            offsetY +
            data.row * cellSize +
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

            row: data.row,

            col: data.col,

            direction:
                data.direction,

            dr: data.dr,

            dc: data.dc,

            removed: false

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

    function selectArrow(piece) {

        if (

            busy ||

            paused ||

            piece.removed

        ) {

            return;

        }


        levelAttempts++;

        sessionAttempts++;


        const clear =
            canLeave(piece);


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
       CHECK PATH
    ===================================================== */

    function canLeave(piece) {

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


            row += piece.dr;

            col += piece.dc;

        }


        return true;

    }


    /* =====================================================
       REMOVE ARROW
    ===================================================== */

    function removeArrow(piece) {

        if (
            piece.removed
        ) {

            return;

        }


        piece.removed = true;


        let exitX = 0;

        let exitY = 0;


        const distance = 1000;


        if (
            piece.direction === "↑"
        ) {

            exitY = -distance;

        }

        else if (
            piece.direction === "→"
        ) {

            exitX = distance;

        }

        else if (
            piece.direction === "↓"
        ) {

            exitY = distance;

        }

        else if (
            piece.direction === "←"
        ) {

            exitX = -distance;

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


        score += points;


        updateScore();


        saveProgress();


        progressEl.textContent =
            `${removedCount} / ${totalArrows}`;


        messageEl.textContent =
            "CLEAR — NICE MOVE";


        syncOnlineScore();


        if (
            removedCount >= totalArrows
        ) {

            finishLevel();

        }

    }


    /* =====================================================
       SINGLE REWARD CALCULATION
       
       THIS IS THE ONLY PLACE WHERE
       LEVEL REWARD IS CALCULATED.
    ===================================================== */

    function calculateLevelCoins() {

        let reward = 10;


        reward +=
            Math.floor(
                currentLevel / 5
            ) * 2;


        if (
            levelMistakes === 0
        ) {

            reward += 10;

        }


        return Math.min(
            reward,
            250
        );

    }


    /* =====================================================
       AWARD LEVEL REWARD
    ===================================================== */

    function awardLevelReward() {

        /*
         * ONE calculation.
         */

        const reward =
            calculateLevelCoins();


        /*
         * Add exactly that reward
         * to the local balance.
         */

        coins += reward;


        profile.coins =
            coins;


        saveProfile();

        saveProgress();


        showCoinReward(
            reward
        );


        return reward;

    }


    /* =====================================================
       ONLINE SCORE SYNC
    ===================================================== */

    async function syncOnlineScore() {

        if (
            !onlineConnected ||
            !window.ArrowheadOnline
        ) {

            return;

        }


        try {

            if (
                typeof window.ArrowheadOnline.updateScore ===
                "function"
            ) {

                await window.ArrowheadOnline.updateScore(
                    currentLevel,
                    score
                );

            }

        }

        catch (error) {

            console.warn(
                "ARROWHEAD: Score sync failed.",
                error
            );

        }

    }


    /* =====================================================
       ONLINE LEVEL SYNC
       
       IMPORTANT:
       NO REWARD CALCULATION HERE.
       
       The reward was already calculated by
       calculateLevelCoins().
    ===================================================== */

    async function syncOnlineLevel(
        completedLevel,
        reward
    ) {

        if (
            !onlineConnected ||
            !window.ArrowheadOnline
        ) {

            return;

        }


        try {

            if (
                typeof window.ArrowheadOnline.completeLevel ===
                "function"
            ) {

                const result =
                    await window.ArrowheadOnline.completeLevel(

                        completedLevel,

                        score,

                        coins,

                        profile.levelsCompleted,

                        reward

                    );


                if (result) {

                    /*
                     * Online.js should now return
                     * the exact same coin balance.
                     */

                    const onlineCoins =
                        Number(
                            result.totalCoins
                        ) || 0;


                    if (
                        onlineCoins >
                        coins
                    ) {

                        coins =
                            onlineCoins;


                        profile.coins =
                            coins;


                        saveProfile();

                        saveProgress();

                    }

                }

            }

        }

        catch (error) {

            console.warn(
                "ARROWHEAD: Online level sync failed.",
                error
            );

        }

    }


    /* =====================================================
       COIN TOAST
    ===================================================== */

    function showCoinReward(
        amount
    ) {

        const old =
            document.getElementById(
                "arrowCoinToast"
            );


        if (old) {
            old.remove();
        }


        const toast =
            document.createElement(
                "div"
            );


        toast.id =
            "arrowCoinToast";


        toast.textContent =
            `🪙 +${amount} COINS`;


        toast.style.cssText = `

            position:fixed;

            left:50%;

            top:22%;

            transform:
                translate(-50%,-10px);

            z-index:100000;

            padding:10px 18px;

            border:
                1px solid
                rgba(255,255,255,.18);

            border-radius:999px;

            background:
                rgba(12,12,12,.95);

            color:#fff;

            font-size:11px;

            font-weight:800;

            letter-spacing:1.5px;

            opacity:0;

            transition:
                opacity .25s ease,
                transform .25s ease;

            pointer-events:none;

        `;


        document.body.appendChild(
            toast
        );


        requestAnimationFrame(
            () => {

                toast.style.opacity =
                    "1";

                toast.style.transform =
                    "translate(-50%,0)";

            }
        );


        setTimeout(
            () => {

                toast.style.opacity =
                    "0";

                toast.style.transform =
                    "translate(-50%,-15px)";


                setTimeout(
                    () => {

                        if (toast) {
                            toast.remove();
                        }

                    },
                    250
                );

            },
            1300
        );

    }


    /* =====================================================
       FINISH LEVEL
    ===================================================== */

    function finishLevel() {

        if (
            busy
        ) {

            return;

        }


        busy = true;


        stopTimer();


        const elapsed =
            (
                performance.now() -
                levelStartTime
            ) / 1000;


        if (
            levelMistakes === 0
        ) {

            profile.perfectLevels++;

        }


        if (

            profile.bestTime === null ||

            elapsed <
            profile.bestTime

        ) {

            profile.bestTime =
                elapsed;

        }


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


        profile.attempts +=
            levelAttempts;


        profile.successfulMoves +=
            levelSuccessfulMoves;


        profile.levelsCompleted++;


        /*
         * ================================================
         * SINGLE REWARD CALCULATION
         * ================================================
         *
         * awardLevelReward()
         * calls calculateLevelCoins()
         * exactly once.
         */

        const reward =
            awardLevelReward();


        /*
         * Save local profile.
         */

        saveProfile();


        unlockBadges();


        /*
         * Unlock next level.
         */

        unlockedLevel =
            Math.max(
                unlockedLevel,
                currentLevel + 1
            );


        saveProgress();


        /*
         * Remember the level that was actually completed.
         */

        const completedLevel =
            currentLevel;


        /*
         * ================================================
         * ONLINE SYNC
         * ================================================
         *
         * Send the SAME reward.
         * online.js does NOT calculate it again.
         */

        syncOnlineLevel(
            completedLevel,
            reward
        );


        updateLeaderboard();


        /*
         * IMPORTANT:
         *
         * Q&A IS HANDLED ONLY BY qa.js.
         *
         * EXACTLY ONE Q&A AFTER:
         *
         * Level 10
         * Level 20
         * Level 30
         * Level 40
         * ...
         */


        currentLevel++;


        saveProgress();


        messageEl.textContent =
            `LEVEL ${completedLevel} CLEAR ✓  +${reward} COINS`;


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
       LOCAL LEADERBOARD
    ===================================================== */

    function getLeaderboard() {

        try {

            const saved =
                localStorage.getItem(
                    LEADERBOARD_KEY
                );


            if (!saved) {
                return [];
            }


            const data =
                JSON.parse(
                    saved
                );


            return Array.isArray(data)
                ? data
                : [];

        }

        catch {

            return [];

        }

    }


    function saveLeaderboard(
        board
    ) {

        try {

            localStorage.setItem(
                LEADERBOARD_KEY,
                JSON.stringify(board)
            );

        }

        catch {

            /* Storage unavailable */

        }

    }


    function updateLeaderboard() {

        if (!playerName) {
            return;
        }


        const board =
            getLeaderboard();


        const record = {

            name:
                playerName,

            score:
                profile.highScore,

            level:
                profile.highLevel,

            coins:
                profile.coins || 0,

            accuracy:

                profile.attempts > 0

                    ? Math.round(

                        (
                            profile.successfulMoves /
                            profile.attempts

                        ) * 100

                    )

                    : 0,

            updatedAt:
                Date.now()

        };


        const existing =
            board.find(
                entry =>
                    String(
                        entry.name
                    ).toLowerCase() ===
                    String(
                        playerName
                    ).toLowerCase()
            );


        if (existing) {

            existing.score =
                Math.max(
                    Number(
                        existing.score
                    ) || 0,
                    record.score
                );


            existing.level =
                Math.max(
                    Number(
                        existing.level
                    ) || 1,
                    record.level
                );


            existing.coins =
                Math.max(
                    Number(
                        existing.coins
                    ) || 0,
                    record.coins
                );


            existing.accuracy =
                record.accuracy;


            existing.updatedAt =
                record.updatedAt;

        }

        else {

            board.push(
                record
            );

        }


        board.sort(
            (a, b) =>
                (
                    Number(b.score) || 0
                ) -
                (
                    Number(a.score) || 0
                )
        );


        saveLeaderboard(
            board.slice(
                0,
                10
            )
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


                    if (timerEl) {

                        timerEl.textContent =
                            elapsed.toFixed(2);

                    }

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

        if (scoreEl) {

            scoreEl.textContent =
                score;

        }

    }


    /* =====================================================
       LIVES
    ===================================================== */

    function updateLives() {

        if (!livesEl) {
            return;
        }


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
       PAUSE
    ===================================================== */

    window.pauseGame =
        function () {

            if (

                !gameStarted ||

                busy ||

                paused

            ) {

                return;

            }


            if (
                document.getElementById(
                    "arrowQuestionOverlay"
                )
            ) {

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

            if (
                !paused
            ) {

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
                    rgba(0,0,0,.82);

                opacity: 0;

                pointer-events: none;

                transition:
                    opacity .2s ease;

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
                    rgba(255,255,255,.16);

                border-radius: 18px;

                background:
                    rgba(15,15,15,.96);

                box-shadow:
                    0 25px 80px
                    rgba(0,0,0,.6);

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
                    rgba(255,255,255,.08);

                color: #fff;

                border:
                    1px solid
                    rgba(255,255,255,.15);

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
       GAME OVER
    ===================================================== */

    function endGame() {

        busy = true;


        stopTimer();

        clearNextLevelTimer();


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


        profile.coins =
            Math.max(
                profile.coins || 0,
                coins
            );


        saveProfile();


        updateLeaderboard();


        saveProgress();


        unlockBadges();


        syncOnlineScore();


        if (finalScoreEl) {

            finalScoreEl.innerHTML =

                `<strong>${score}</strong>
                 <span>POINTS</span>
                 <small>
                    LEVEL ${currentLevel}
                 </small>`;

        }


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
       PLAY AGAIN
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


            coins =
                Math.max(
                    profile.coins || 0,
                    progress.coins || 0
                );


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


            connectOnline();

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
       DASHBOARD UPDATE
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


        if (welcomeEl) {

            welcomeEl.textContent =
                `WELCOME, ${
                    profile.name ||
                    playerName ||
                    "PLAYER"
                }`;

        }


        if (highScoreEl) {

            highScoreEl.textContent =
                profile.highScore;

        }


        if (highLevelEl) {

            highLevelEl.textContent =
                profile.highLevel;

        }


        if (gamesPlayedEl) {

            gamesPlayedEl.textContent =
                profile.gamesPlayed;

        }


        if (accuracyEl) {

            accuracyEl.textContent =
                `${accuracy}%`;

        }


        if (bestTimeEl) {

            bestTimeEl.textContent =

                profile.bestTime === null

                    ? "--"

                    : `${profile.bestTime.toFixed(2)}s`;

        }


        if (perfectLevelsEl) {

            perfectLevelsEl.textContent =
                profile.perfectLevels;

        }


        unlockBadges();


        renderDashboardExtras();

    }


    /* =====================================================
       DASHBOARD EXTRAS
    ===================================================== */

    function renderDashboardExtras() {

        let container =
            document.getElementById(
                "arrowDashboardExtras"
            );


        if (!container) {

            container =
                document.createElement(
                    "div"
                );


            container.id =
                "arrowDashboardExtras";


            const panel =
                dashboard.querySelector(
                    ".dashboard-panel"
                );


            if (panel) {

                panel.appendChild(
                    container
                );

            }

        }


        if (!container) {
            return;
        }


        const badges =
            loadBadges();


        const localBoard =
            getLeaderboard();


        const board =
            globalLeaderboard.length
                ? globalLeaderboard
                : localBoard;


        const liveHTML =
            livePlayers.length

                ? livePlayers.map(
                    player => {

                        const safeName =
                            escapeHTML(
                                player.name ||
                                "PLAYER"
                            );

                        const playerLevel =
                            Number(
                                player.level
                            ) || 1;

                        const playerScore =
                            Number(
                                player.score
                            ) || 0;

                        const playerCoins =
                            Number(
                                player.coins
                            ) || 0;

                        return `

                            <div
                                class="arrow-live-player"
                            >

                                <div
                                    class="arrow-live-left"
                                >

                                    <div
                                        class="arrow-live-name"
                                    >

                                        <span
                                            class="arrow-live-dot"
                                        >
                                            ●
                                        </span>

                                        ${safeName}

                                    </div>

                                    <div
                                        class="arrow-live-status"
                                    >

                                        Level
                                        ${playerLevel}
                                        •
                                        ${playerScore}
                                        pts

                                    </div>

                                </div>

                                <div
                                    class="arrow-live-coins"
                                >
                                    🪙 ${playerCoins}
                                </div>

                            </div>

                        `;

                    }
                ).join("")

                : `

                    <div
                        style="
                            text-align:center;
                            color:rgba(255,255,255,.35);
                            font-size:9px;
                            padding:12px;
                        "
                    >
                        No other players online
                    </div>

                `;


        container.innerHTML = `

            <div class="arrow-dashboard-section">

                <div class="arrow-section-title">
                    🟢 LIVE PLAYERS
                </div>

                <div>
                    ${liveHTML}
                </div>

            </div>


            <div class="arrow-dashboard-section">

                <div class="arrow-section-title">
                    🪙 COINS
                </div>

                <div style="
                    text-align:center;
                    color:#fff;
                    font-size:26px;
                    font-weight:900;
                    letter-spacing:2px;
                ">
                    🪙 ${profile.coins || 0}
                </div>

            </div>


            <div class="arrow-dashboard-section">

                <div class="arrow-section-title">
                    🏅 BADGES
                </div>

                <div class="arrow-badges-grid">

                    ${BADGES.map(
                        badge => {

                            const unlocked =
                                badges.includes(
                                    badge.id
                                );


                            return `

                                <div
                                    class="
                                        arrow-badge
                                        ${
                                            unlocked
                                                ? ""
                                                : "locked"
                                        }
                                    "
                                >

                                    <div
                                        class="arrow-badge-icon"
                                    >
                                        ${
                                            unlocked
                                                ? badge.icon
                                                : "🔒"
                                        }
                                    </div>

                                    <div
                                        class="arrow-badge-name"
                                    >
                                        ${badge.name}
                                    </div>

                                    <div
                                        class="
                                            arrow-badge-description
                                        "
                                    >
                                        ${badge.description}
                                    </div>

                                </div>

                            `;

                        }
                    ).join("")}

                </div>

            </div>


            <div class="arrow-dashboard-section">

                <div class="arrow-section-title">
                    🌍 GLOBAL LEADERBOARD
                </div>

                <div class="arrow-scoreboard">

                    <div
                        class="
                            arrow-score-row
                            header
                        "
                    >

                        <span>#</span>

                        <span>PLAYER</span>

                        <span>SCORE</span>

                        <span>LEVEL</span>

                        <span>COINS</span>

                    </div>


                    ${
                        board.length

                            ? board.map(
                                (
                                    entry,
                                    index
                                ) => `

                                    <div
                                        class="
                                            arrow-score-row
                                            ${
                                                String(
                                                    entry.name
                                                ).toLowerCase() ===
                                                String(
                                                    playerName
                                                ).toLowerCase()
                                                    ? "me"
                                                    : ""
                                            }
                                        "
                                    >

                                        <span>
                                            ${
                                                index + 1
                                            }
                                        </span>

                                        <span>
                                            ${
                                                escapeHTML(
                                                    entry.name
                                                )
                                            }
                                        </span>

                                        <span>
                                            ${
                                                Number(
                                                    entry.score
                                                ) || 0
                                            }
                                        </span>

                                        <span>
                                            ${
                                                Number(
                                                    entry.level
                                                ) || 1
                                            }
                                        </span>

                                        <span>
                                            🪙 ${
                                                Number(
                                                    entry.coins
                                                ) || 0
                                            }
                                        </span>

                                    </div>

                                `
                            ).join("")

                            : `

                                <div
                                    class="
                                        arrow-score-row
                                    "
                                >

                                    <span>—</span>

                                    <span>
                                        ${
                                            onlineConnected
                                                ? "No players yet"
                                                : "Offline scoreboard"
                                        }
                                    </span>

                                    <span>—</span>

                                    <span>—</span>

                                    <span>—</span>

                                </div>

                            `
                    }

                </div>

            </div>

        `;

    }


    /* =====================================================
       ESCAPE HTML
    ===================================================== */

    function escapeHTML(
        value
    ) {

        return String(
            value
        )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

    }


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

            if (
                levelSelectScreen
            ) {

                levelSelectScreen.classList.add(
                    "hidden"
                );

            }


            showDashboard();

        };


    /* =====================================================
       GAME API
    ===================================================== */

    window.ArrowheadGame = {

        getPlayerData() {

            return {

                name:
                    profile.name ||
                    playerName,

                level:
                    currentLevel,

                score:
                    score,

                coins:
                    coins,

                completedLevels:
                    profile.levelsCompleted || 0

            };

        },


        getGlobalLeaderboard() {

            return globalLeaderboard;

        },


        getLivePlayers() {

            return livePlayers;

        },


        getLocalLeaderboard() {

            return getLeaderboard();

        },


        refreshDashboard() {

            updateDashboard();

        }

    };


    /* =====================================================
       ONLINE CLEANUP
    ===================================================== */

    window.addEventListener(
        "beforeunload",
        () => {

            try {

                if (
                    window.ArrowheadOnline &&
                    typeof window.ArrowheadOnline.offline ===
                    "function"
                ) {

                    window.ArrowheadOnline.offline();

                }

            }

            catch {

                /* Ignore cleanup errors */

            }

        }
    );


    /* =====================================================
       STARTUP
    ===================================================== */

    addPauseStyles();

    addAchievementStyles();


})();