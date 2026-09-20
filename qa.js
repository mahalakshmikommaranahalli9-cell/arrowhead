/* =========================================================
   ARROWHEAD — MILESTONE Q&A SYSTEM
   Q&A appears after every 10 completed levels.
========================================================= */

(() => {

    const PROFILE_KEY = "arrowhead-profile";
    const PROGRESS_KEY = "arrowhead-progress";
    const QA_KEY = "arrowhead-qa-state";
    const LEADERBOARD_KEY = "arrowhead-leaderboard";

    const QUESTIONS = [
        {
            question: "Which planet is known as the Red Planet?",
            options: ["Earth", "Mars", "Jupiter", "Venus"],
            answer: 1
        },
        {
            question: "What does HTML stand for?",
            options: [
                "HyperText Markup Language",
                "HighText Machine Language",
                "HyperTool Markup Logic",
                "HomeText Machine Language"
            ],
            answer: 0
        },
        {
            question: "Which language is mainly used for styling web pages?",
            options: ["Python", "Java", "CSS", "C"],
            answer: 2
        },
        {
            question: "How many bits are in one byte?",
            options: ["4", "8", "16", "32"],
            answer: 1
        },
        {
            question: "Which device is used to connect different networks?",
            options: ["Router", "Keyboard", "Monitor", "Printer"],
            answer: 0
        },
        {
            question: "Which company created the Android operating system?",
            options: ["Microsoft", "Google", "IBM", "Intel"],
            answer: 1
        },
        {
            question: "What is the brain of a computer commonly called?",
            options: ["RAM", "Hard Disk", "CPU", "Monitor"],
            answer: 2
        },
        {
            question: "Which symbol is commonly used for JavaScript comments?",
            options: ["//", "##", "<!--", "**"],
            answer: 0
        },
        {
            question: "What does AI stand for?",
            options: [
                "Automated Internet",
                "Artificial Intelligence",
                "Advanced Interface",
                "Applied Information"
            ],
            answer: 1
        },
        {
            question: "Which one is NOT a programming language?",
            options: ["Python", "JavaScript", "HTML", "Java"],
            answer: 2
        },
        {
            question: "What does CPU stand for?",
            options: [
                "Central Processing Unit",
                "Computer Power Utility",
                "Central Program User",
                "Core Processing Utility"
            ],
            answer: 0
        },
        {
            question: "Which protocol is commonly used to browse websites?",
            options: ["HTTP", "FTP", "SMTP", "SSH"],
            answer: 0
        }
    ];

    const BADGES = [
        {
            title: "FIRST MILESTONE",
            icon: "🧠"
        },
        {
            title: "LOGIC RUNNER",
            icon: "⚡"
        },
        {
            title: "ARROW MASTER",
            icon: "🎯"
        },
        {
            title: "CODE THINKER",
            icon: "💻"
        },
        {
            title: "PUZZLE HUNTER",
            icon: "🔥"
        },
        {
            title: "BRAIN ARCHITECT",
            icon: "🏆"
        }
    ];

    let lastObservedLevel = null;
    let modalOpen = false;
    let observerStarted = false;

    function readJSON(key, fallback) {
        try {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : fallback;
        } catch {
            return fallback;
        }
    }

    function saveJSON(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    function getProfile() {
        const profile = readJSON(PROFILE_KEY, {});

        if (!Array.isArray(profile.badges)) {
            profile.badges = [];
        }

        return profile;
    }

    function saveProfile(profile) {
        saveJSON(PROFILE_KEY, profile);
    }

    function getProgress() {
        return readJSON(PROGRESS_KEY, {
            currentLevel: 1,
            unlockedLevel: 1,
            score: 0
        });
    }

    function getQAState() {
        return readJSON(QA_KEY, {
            completedMilestones: [],
            checkpoints: {},
            answered: {}
        });
    }

    function saveQAState(state) {
        saveJSON(QA_KEY, state);
    }

    function getCurrentScore() {
        const scoreElement = document.getElementById("score");

        if (!scoreElement) {
            return Number(getProgress().score) || 0;
        }

        const number = parseInt(
            scoreElement.textContent.replace(/[^\d-]/g, ""),
            10
        );

        return Number.isFinite(number) ? number : 0;
    }

    function setCurrentScore(value) {

        value = Math.max(0, Math.floor(Number(value) || 0));

        const scoreElement = document.getElementById("score");

        if (scoreElement) {
            scoreElement.textContent = value;
        }

        const progress = getProgress();
        progress.score = value;
        saveJSON(PROGRESS_KEY, progress);

        const profile = getProfile();

        if (value > (profile.highScore || 0)) {
            profile.highScore = value;
        }

        saveProfile(profile);
    }

    function getMilestoneBadge(milestone) {

        const index =
            Math.max(0, Math.floor(milestone / 10) - 1) %
            BADGES.length;

        return BADGES[index];
    }

    function addBadge(milestone) {

        const profile = getProfile();

        if (!profile.badges.some(b => b.milestone === milestone)) {

            const badge = getMilestoneBadge(milestone);

            profile.badges.push({
                milestone,
                title: badge.title,
                icon: badge.icon,
                earnedAt: new Date().toISOString()
            });

            saveProfile(profile);
        }
    }

    function removeBadge(milestone) {

        const profile = getProfile();

        profile.badges =
            profile.badges.filter(
                badge => badge.milestone !== milestone
            );

        saveProfile(profile);
    }

    function addLeaderboardEntry() {

        const profile = getProfile();
        const progress = getProgress();

        const name =
            profile.name ||
            localStorage.getItem("arrowhead-player-name") ||
            "PLAYER";

        const score = getCurrentScore();

        if (score <= 0) return;

        let leaderboard =
            readJSON(LEADERBOARD_KEY, []);

        leaderboard.push({
            name,
            score,
            level: Math.max(
                1,
                Number(progress.currentLevel) || 1
            ),
            date: new Date().toLocaleDateString()
        });

        leaderboard.sort((a, b) => b.score - a.score);

        leaderboard = leaderboard.slice(0, 10);

        saveJSON(
            LEADERBOARD_KEY,
            leaderboard
        );
    }

    function ensureStyles() {

        if (document.getElementById("arrowheadQAStyles")) {
            return;
        }

        const style = document.createElement("style");

        style.id = "arrowheadQAStyles";

        style.textContent = `

        #arrowheadQAOverlay {

            position: fixed;
            inset: 0;

            z-index: 99999;

            display: flex;
            align-items: center;
            justify-content: center;

            padding: 20px;

            background:
                radial-gradient(
                    circle at center,
                    rgba(40,40,40,.45),
                    rgba(0,0,0,.96)
                );

            backdrop-filter: blur(12px);

            animation: qaFade .25s ease;
        }

        @keyframes qaFade {

            from {
                opacity: 0;
            }

            to {
                opacity: 1;
            }
        }

        .arrowhead-qa-card {

            width: min(650px, 94vw);

            background:
                linear-gradient(
                    145deg,
                    #171717,
                    #080808
                );

            border: 1px solid rgba(255,255,255,.16);

            border-radius: 22px;

            padding: 34px;

            box-shadow:
                0 30px 100px rgba(0,0,0,.8);

            text-align: center;

            color: #fff;
        }

        .qa-milestone {

            font-size: 11px;

            letter-spacing: 4px;

            color: #aaa;

            margin-bottom: 10px;
        }

        .qa-title {

            font-size: clamp(24px,5vw,42px);

            font-weight: 900;

            letter-spacing: 3px;

            margin-bottom: 8px;
        }

        .qa-subtitle {

            color: #aaa;

            font-size: 13px;

            margin-bottom: 28px;
        }

        .qa-question {

            font-size: clamp(18px,3vw,25px);

            font-weight: 700;

            line-height: 1.45;

            margin: 25px 0;
        }

        .qa-options {

            display: grid;

            grid-template-columns:
                repeat(2, minmax(0,1fr));

            gap: 12px;

            margin-top: 20px;
        }

        .qa-option {

            min-height: 58px;

            padding: 12px 15px;

            border-radius: 12px;

            border: 1px solid rgba(255,255,255,.14);

            background: rgba(255,255,255,.04);

            color: #fff;

            cursor: pointer;

            font-weight: 700;

            transition:
                transform .18s ease,
                background .18s ease,
                border-color .18s ease;
        }

        .qa-option:hover {

            transform: translateY(-2px);

            background: rgba(255,255,255,.1);

            border-color: rgba(255,255,255,.35);
        }

        .qa-option.correct {

            background: rgba(40,180,100,.22);

            border-color: rgba(70,220,130,.7);
        }

        .qa-option.wrong {

            background: rgba(220,50,50,.2);

            border-color: rgba(255,80,80,.65);
        }

        .qa-result {

            min-height: 25px;

            margin-top: 18px;

            font-size: 14px;

            font-weight: 800;

            letter-spacing: 1px;
        }

        .qa-actions {

            display: flex;

            justify-content: center;

            gap: 12px;

            margin-top: 25px;

            flex-wrap: wrap;
        }

        .qa-button {

            border: 1px solid rgba(255,255,255,.2);

            background: #fff;

            color: #000;

            border-radius: 10px;

            padding: 13px 22px;

            font-weight: 900;

            letter-spacing: 1px;

            cursor: pointer;

            min-width: 130px;
        }

        .qa-skip {

            background: transparent;

            color: #aaa;

            border-color: rgba(255,255,255,.12);
        }

        .qa-warning {

            margin-top: 16px;

            font-size: 11px;

            line-height: 1.5;

            color: #888;

        }

        .arrowhead-badge-panel {

            margin-top: 30px;

            padding: 22px;

            border: 1px solid rgba(255,255,255,.12);

            border-radius: 16px;

            background: rgba(255,255,255,.025);
        }

        .arrowhead-badge-title {

            font-size: 11px;

            letter-spacing: 3px;

            color: #999;

            margin-bottom: 15px;
        }

        .arrowhead-badge-list {

            display: flex;

            flex-wrap: wrap;

            gap: 10px;

        }

        .arrowhead-badge {

            display: inline-flex;

            align-items: center;

            gap: 8px;

            padding: 9px 12px;

            border-radius: 10px;

            background: rgba(255,255,255,.06);

            border: 1px solid rgba(255,255,255,.1);

            font-size: 11px;

            font-weight: 800;

            letter-spacing: .5px;
        }

        .arrowhead-scoreboard {

            margin-top: 30px;

            padding: 22px;

            border: 1px solid rgba(255,255,255,.12);

            border-radius: 16px;

            background: rgba(255,255,255,.025);

        }

        .arrowhead-score-row {

            display: grid;

            grid-template-columns: 35px 1fr 80px 60px;

            gap: 10px;

            align-items: center;

            padding: 10px 0;

            border-bottom: 1px solid rgba(255,255,255,.07);

            font-size: 12px;
        }

        .arrowhead-score-row:last-child {

            border-bottom: 0;
        }

        @media(max-width:600px) {

            .arrowhead-qa-card {

                padding: 24px 18px;

            }

            .qa-options {

                grid-template-columns: 1fr;

            }

            .arrowhead-score-row {

                grid-template-columns:
                    30px 1fr 70px 50px;

                font-size: 10px;
            }
        }
        `;

        document.head.appendChild(style);
    }

    function createOverlay(milestone) {

        ensureStyles();

        const overlay =
            document.createElement("div");

        overlay.id =
            "arrowheadQAOverlay";

        const question =
            QUESTIONS[
                Math.floor(
                    Math.random() *
                    QUESTIONS.length
                )
            ];

        const badge =
            getMilestoneBadge(milestone);

        overlay.innerHTML = `

            <div class="arrowhead-qa-card">

                <div class="qa-milestone">
                    MILESTONE ${milestone}
                </div>

                <div class="qa-title">
                    🧠 BRAIN BREAK
                </div>

                <div class="qa-subtitle">
                    You cleared ${milestone} levels!
                    Time for one quick question.
                </div>

                <div class="qa-question">
                    ${question.question}
                </div>

                <div class="qa-options"></div>

                <div
                    class="qa-result"
                    id="qaResult"
                    aria-live="polite"
                ></div>

                <div class="qa-actions">

                    <button
                        class="qa-button"
                        id="qaContinue"
                        type="button"
                        style="display:none;"
                    >
                        CONTINUE →
                    </button>

                    <button
                        class="qa-button qa-skip"
                        id="qaSkip"
                        type="button"
                    >
                        SKIP
                    </button>

                </div>

                <div class="qa-warning">
                    ⏭ SKIP = lose this milestone's
                    badge + score earned in this
                    10-level block.
                </div>

            </div>
        `;

        const optionsContainer =
            overlay.querySelector(".qa-options");

        question.options.forEach(
            (option, index) => {

                const button =
                    document.createElement("button");

                button.type = "button";

                button.className =
                    "qa-option";

                button.textContent =
                    option;

                button.addEventListener(
                    "click",
                    () => {

                        if (
                            overlay.dataset.answered === "true"
                        ) {
                            return;
                        }

                        overlay.dataset.answered = "true";

                        const buttons =
                            optionsContainer.querySelectorAll(
                                ".qa-option"
                            );

                        buttons.forEach(
                            btn =>
                                btn.disabled = true
                        );

                        const result =
                            overlay.querySelector(
                                "#qaResult"
                            );

                        if (index === question.answer) {

                            button.classList.add(
                                "correct"
                            );

                            const bonus = 500;

                            setCurrentScore(
                                getCurrentScore() + bonus
                            );

                            addBadge(milestone);

                            const state =
                                getQAState();

                            state.completedMilestones.push(
                                milestone
                            );

                            state.answered[milestone] =
                                "correct";

                            saveQAState(state);

                            addLeaderboardEntry();

                            result.textContent =
                                `✓ CORRECT! +${bonus} BONUS • ${badge.icon} ${badge.title}`;

                            result.style.color =
                                "#7cffae";

                        } else {

                            button.classList.add(
                                "wrong"
                            );

                            buttons[
                                question.answer
                            ].classList.add(
                                "correct"
                            );

                            const state =
                                getQAState();

                            state.completedMilestones.push(
                                milestone
                            );

                            state.answered[milestone] =
                                "wrong";

                            saveQAState(state);

                            result.textContent =
                                "✕ Not quite — but your level progress is safe.";

                            result.style.color =
                                "#ff9b9b";
                        }

                        overlay.querySelector(
                            "#qaContinue"
                        ).style.display = "inline-block";

                        overlay.querySelector(
                            "#qaSkip"
                        ).style.display = "none";
                    }
                );

                optionsContainer.appendChild(
                    button
                );
            }
        );

        overlay.querySelector(
            "#qaContinue"
        ).addEventListener(
            "click",
            () => closeOverlay(milestone)
        );

        overlay.querySelector(
            "#qaSkip"
        ).addEventListener(
            "click",
            () => {

                if (
                    overlay.dataset.answered === "true"
                ) {
                    return;
                }

                const state =
                    getQAState();

                const checkpoint =
                    Number(
                        state.checkpoints[milestone]
                    ) || 0;

                setCurrentScore(checkpoint);

                removeBadge(milestone);

                state.answered[milestone] =
                    "skipped";

                state.completedMilestones.push(
                    milestone
                );

                saveQAState(state);

                addLeaderboardEntry();

                const result =
                    overlay.querySelector(
                        "#qaResult"
                    );

                result.textContent =
                    `SKIPPED — score restored to ${checkpoint} • badge not earned`;

                result.style.color =
                    "#ffb36b";

                overlay.querySelector(
                    "#qaSkip"
                ).style.display = "none";

                overlay.querySelector(
                    "#qaContinue"
                ).style.display = "inline-block";
            }
        );

        document.body.appendChild(
            overlay
        );

        modalOpen = true;
    }

    function closeOverlay(milestone) {

        const overlay =
            document.getElementById(
                "arrowheadQAOverlay"
            );

        if (overlay) {
            overlay.remove();
        }

        modalOpen = false;

        updateDashboardExtras();

        /*
         * The normal game engine has already
         * advanced to the next level.
         * We simply let the player continue.
         */
    }

    function shouldShowMilestone(level) {

        if (
            !Number.isFinite(level) ||
            level <= 0 ||
            level % 10 !== 0
        ) {
            return false;
        }

        const milestone = level;

        const state =
            getQAState();

        return !state.completedMilestones.includes(
            milestone
        );
    }

    function handleLevelChange(level) {

        if (
            !Number.isFinite(level)
        ) {
            return;
        }

        /*
         * The game automatically changes from
         * Level 10 -> Level 11 after clearing 10.
         *
         * Therefore when we see Level 11,
         * we know Level 10 was completed.
         */

        if (
            lastObservedLevel !== null &&
            level > lastObservedLevel
        ) {

            const completedLevel =
                level - 1;

            if (
                completedLevel > 0 &&
                completedLevel % 10 === 0
            ) {

                const milestone =
                    completedLevel;

                if (
                    shouldShowMilestone(
                        milestone
                    )
                ) {

                    const state =
                        getQAState();

                    /*
                     * Score before this 10-level block.
                     *
                     * 10  -> 0
                     * 20  -> score after milestone 10
                     * 30  -> score after milestone 20
                     */

                    if (
                        state.checkpoints[
                            milestone
                        ] === undefined
                    ) {

                        const previousMilestone =
                            milestone - 10;

                        let checkpoint = 0;

                        if (
                            previousMilestone > 0 &&
                            state.checkpoints[
                                previousMilestone
                            ] !== undefined
                        ) {

                            /*
                             * Use the score recorded
                             * immediately after the
                             * previous milestone.
                             */

                            const previousStateScore =
                                state[
                                    "scoreAfter_" +
                                    previousMilestone
                                ];

                            if (
                                Number.isFinite(
                                    Number(
                                        previousStateScore
                                    )
                                )
                            ) {

                                checkpoint =
                                    Number(
                                        previousStateScore
                                    );

                            } else {

                                checkpoint =
                                    getCurrentScore();
                            }

                        } else {

                            checkpoint = 0;
                        }

                        state.checkpoints[
                            milestone
                        ] = checkpoint;

                        saveQAState(state);
                    }

                    createOverlay(
                        milestone
                    );
                }
            }
        }

        lastObservedLevel = level;
    }

    function updateCheckpointAfterAnswer() {

        const state =
            getQAState();

        const completed =
            state.completedMilestones || [];

        if (!completed.length) {
            return;
        }

        const milestone =
            Math.max(...completed);

        const answer =
            state.answered[milestone];

        if (
            answer === "correct" ||
            answer === "wrong"
        ) {

            state[
                "scoreAfter_" + milestone
            ] = getCurrentScore();

            saveQAState(state);
        }
    }

    function updateDashboardExtras() {

        const dashboard =
            document.getElementById(
                "dashboard"
            );

        if (!dashboard) {
            return;
        }

        ensureStyles();

        let badgePanel =
            document.getElementById(
                "arrowheadBadgePanel"
            );

        if (!badgePanel) {

            badgePanel =
                document.createElement("div");

            badgePanel.id =
                "arrowheadBadgePanel";

            badgePanel.className =
                "arrowhead-badge-panel";

            dashboard.appendChild(
                badgePanel
            );
        }

        const profile =
            getProfile();

        const badges =
            Array.isArray(profile.badges)
                ? profile.badges
                : [];

        badgePanel.innerHTML = `

            <div class="arrowhead-badge-title">
                🏅 BADGES
            </div>

            <div class="arrowhead-badge-list">

                ${
                    badges.length
                        ? badges.map(
                            badge => `
                                <div
                                    class="arrowhead-badge"
                                >
                                    <span>
                                        ${badge.icon}
                                    </span>

                                    <span>
                                        ${badge.title}
                                        • ${badge.milestone}
                                    </span>
                                </div>
                            `
                        ).join("")
                        : `
                            <div
                                style="
                                color:#777;
                                font-size:12px;
                                "
                            >
                                Clear 10 levels and
                                answer the milestone
                                question to earn your
                                first badge.
                            </div>
                        `
                }

            </div>
        `;

        let scoreboard =
            document.getElementById(
                "arrowheadScoreboard"
            );

        if (!scoreboard) {

            scoreboard =
                document.createElement("div");

            scoreboard.id =
                "arrowheadScoreboard";

            scoreboard.className =
                "arrowhead-scoreboard";

            dashboard.appendChild(
                scoreboard
            );
        }

        const leaderboard =
            readJSON(
                LEADERBOARD_KEY,
                []
            );

        scoreboard.innerHTML = `

            <div class="arrowhead-badge-title">
                🏆 LOCAL SCOREBOARD
            </div>

            <div
                style="
                color:#777;
                font-size:10px;
                margin-bottom:12px;
                "
            >
                Top scores saved on this browser/device
            </div>

            ${
                leaderboard.length
                    ? leaderboard.map(
                        (entry, index) => `
                            <div
                                class="
                                arrowhead-score-row
                                "
                            >
                                <strong>
                                    #${index + 1}
                                </strong>

                                <span>
                                    ${escapeHTML(
                                        entry.name
                                    )}
                                </span>

                                <strong>
                                    ${entry.score}
                                </strong>

                                <span>
                                    L${entry.level}
                                </span>
                            </div>
                        `
                    ).join("")
                    : `
                        <div
                            style="
                            color:#777;
                            font-size:12px;
                            "
                        >
                            Your best runs will appear here.
                        </div>
                    `
            }
        `;
    }

    function escapeHTML(value) {

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function findLevelElement() {

        return document.getElementById(
            "level"
        );
    }

    function startObserver() {

        if (observerStarted) {
            return;
        }

        observerStarted = true;

        const levelElement =
            findLevelElement();

        if (!levelElement) {

            setTimeout(
                startObserver,
                300
            );

            return;
        }

        lastObservedLevel =
            parseInt(
                levelElement.textContent
                    .replace(/[^\d]/g, ""),
                10
            ) || 1;

        const observer =
            new MutationObserver(() => {

                if (modalOpen) {
                    return;
                }

                const level =
                    parseInt(
                        levelElement.textContent
                            .replace(/[^\d]/g, ""),
                        10
                    );

                if (
                    Number.isFinite(level)
                ) {

                    handleLevelChange(
                        level
                    );

                    updateCheckpointAfterAnswer();
                }
            });

        observer.observe(
            levelElement,
            {
                childList: true,
                characterData: true,
                subtree: true
            }
        );

        /*
         * Dashboard can be opened later.
         * Refresh the extra sections whenever
         * the dashboard becomes visible.
         */

        setInterval(
            updateDashboardExtras,
            1000
        );
    }

    /*
     * Public helper.
     */
    window.ArrowheadQA = {

        refreshDashboard:
            updateDashboardExtras,

        showForMilestone:
            milestone => {

                if (
                    milestone &&
                    milestone % 10 === 0
                ) {

                    const state =
                        getQAState();

                    if (
                        state.checkpoints[
                            milestone
                        ] === undefined
                    ) {

                        state.checkpoints[
                            milestone
                        ] =
                            getCurrentScore();

                        saveQAState(state);
                    }

                    createOverlay(
                        milestone
                    );
                }
            }
    };

    /*
     * Start once DOM exists.
     */
    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            startObserver
        );

    } else {

        startObserver();
    }

})();