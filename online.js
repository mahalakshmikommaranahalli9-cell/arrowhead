/* =========================================================
   ARROWHEAD — ONLINE SYSTEM 8.0

   SINGLE SOURCE OF TRUTH FOR REWARDS
   ---------------------------------------------------------
   IMPORTANT:
   game.js calculates the reward.
   online.js NEVER calculates rewards.

   game.js sends:
       level
       score
       coins
       completedLevels
       reward

   Supabase stores exactly those values.
========================================================= */

(() => {

    "use strict";

    /* =====================================================
       SUPABASE
    ===================================================== */

    const SUPABASE_URL =
        "https://gsoceycracdwddjtqdku.supabase.co";

    const SUPABASE_KEY =
        "sb_publishable_Qgo1OIVKRD4x-xqnZo1kPA_nTjGG9KI";


    let supabaseClient = null;
    let onlinePlayer = null;

    let onlineReady = false;

    let heartbeatTimer = null;
    let refreshTimer = null;


    const PLAYER_ID_KEY =
        "arrowhead-online-player-id";


    /* =====================================================
       INIT
    ===================================================== */

    function initOnlineSystem() {

        try {

            if (!window.supabase) {

                console.warn(
                    "ARROWHEAD ONLINE: Supabase library missing."
                );

                return false;
            }


            supabaseClient =
                window.supabase.createClient(
                    SUPABASE_URL,
                    SUPABASE_KEY
                );


            onlineReady = true;

            console.log(
                "ARROWHEAD ONLINE: Connected."
            );

            return true;

        } catch (error) {

            console.error(
                "ARROWHEAD ONLINE: Init failed.",
                error
            );

            onlineReady = false;

            return false;
        }
    }


    /* =====================================================
       PLAYER ID
    ===================================================== */

    function getPlayerId() {

        try {

            return localStorage.getItem(
                PLAYER_ID_KEY
            );

        } catch {

            return null;
        }
    }


    function savePlayerId(id) {

        try {

            localStorage.setItem(
                PLAYER_ID_KEY,
                id
            );

        } catch {

            /* Storage unavailable */

        }
    }


    /* =====================================================
       PLAYER NAME
    ===================================================== */

    function cleanName(name) {

        const value =
            String(
                name || "Player"
            )
            .trim()
            .replace(/\s+/g, " ")
            .slice(0, 50);

        return value || "Player";
    }


    /* =====================================================
       REGISTER PLAYER
    ===================================================== */

    async function registerOnlinePlayer(name) {

        if (
            !onlineReady ||
            !supabaseClient
        ) {
            return null;
        }


        try {

            const playerName =
                cleanName(name);


            const savedId =
                getPlayerId();


            /* ---------------------------------------------
               RESTORE EXISTING PLAYER
            --------------------------------------------- */

            if (savedId) {

                const {
                    data,
                    error
                } =
                    await supabaseClient
                        .from("players")
                        .select("*")
                        .eq("id", savedId)
                        .maybeSingle();


                if (
                    !error &&
                    data
                ) {

                    onlinePlayer =
                        data;


                    await supabaseClient
                        .from("players")
                        .update({

                            name:
                                playerName,

                            online:
                                true,

                            last_seen:
                                new Date().toISOString()

                        })
                        .eq(
                            "id",
                            onlinePlayer.id
                        );


                    onlinePlayer.name =
                        playerName;


                    startHeartbeat();


                    return onlinePlayer;
                }
            }


            /* ---------------------------------------------
               CREATE NEW PLAYER
            --------------------------------------------- */

            const playerId =
                (
                    window.crypto &&
                    typeof crypto.randomUUID ===
                    "function"
                )
                    ? crypto.randomUUID()
                    : (
                        Date.now().toString(36) +
                        Math.random()
                            .toString(36)
                            .slice(2)
                    );


            const playerData = {

                id:
                    playerId,

                name:
                    playerName,

                level:
                    1,

                score:
                    0,

                coins:
                    0,

                completed_levels:
                    0,

                online:
                    true,

                last_seen:
                    new Date().toISOString()

            };


            const {
                data,
                error
            } =
                await supabaseClient
                    .from("players")
                    .insert(playerData)
                    .select()
                    .single();


            if (error) {

                console.error(
                    "ARROWHEAD ONLINE: Registration failed.",
                    error
                );

                return null;
            }


            onlinePlayer =
                data;


            savePlayerId(
                data.id
            );


            startHeartbeat();


            return data;

        } catch (error) {

            console.error(
                "ARROWHEAD ONLINE: Registration error.",
                error
            );

            return null;
        }
    }


    /* =====================================================
       HEARTBEAT
    ===================================================== */

    async function sendHeartbeat() {

        if (
            !onlineReady ||
            !supabaseClient ||
            !onlinePlayer
        ) {
            return;
        }


        try {

            const {
                data,
                error
            } =
                await supabaseClient
                    .from("players")
                    .update({

                        online:
                            true,

                        last_seen:
                            new Date().toISOString()

                    })
                    .eq(
                        "id",
                        onlinePlayer.id
                    )
                    .select()
                    .single();


            if (
                !error &&
                data
            ) {

                onlinePlayer =
                    data;
            }

        } catch (error) {

            console.warn(
                "ARROWHEAD ONLINE: Heartbeat failed.",
                error
            );
        }
    }


    function startHeartbeat() {

        stopHeartbeat();

        sendHeartbeat();

        heartbeatTimer =
            setInterval(
                sendHeartbeat,
                10000
            );
    }


    function stopHeartbeat() {

        if (heartbeatTimer) {

            clearInterval(
                heartbeatTimer
            );

            heartbeatTimer = null;
        }
    }


    /* =====================================================
       OFFLINE
    ===================================================== */

    async function markPlayerOffline() {

        stopHeartbeat();


        if (
            !onlineReady ||
            !supabaseClient ||
            !onlinePlayer
        ) {
            return;
        }


        try {

            await supabaseClient
                .from("players")
                .update({

                    online:
                        false,

                    last_seen:
                        new Date().toISOString()

                })
                .eq(
                    "id",
                    onlinePlayer.id
                );

        } catch (error) {

            console.warn(
                "ARROWHEAD ONLINE: Offline update failed.",
                error
            );
        }
    }


    /* =====================================================
       SCORE UPDATE
    ===================================================== */

    async function updateOnlineScore(
        level,
        score
    ) {

        if (
            !onlineReady ||
            !supabaseClient ||
            !onlinePlayer
        ) {
            return null;
        }


        try {

            const safeLevel =
                Math.max(
                    1,
                    Math.floor(
                        Number(level) || 1
                    )
                );


            const safeScore =
                Math.max(
                    0,
                    Math.floor(
                        Number(score) || 0
                    )
                );


            const {
                data,
                error
            } =
                await supabaseClient
                    .from("players")
                    .update({

                        level:
                            safeLevel,

                        score:
                            safeScore,

                        online:
                            true,

                        last_seen:
                            new Date().toISOString()

                    })
                    .eq(
                        "id",
                        onlinePlayer.id
                    )
                    .select()
                    .single();


            if (error) {

                console.warn(
                    "ARROWHEAD ONLINE: Score update failed.",
                    error
                );

                return null;
            }


            onlinePlayer =
                data;


            return data;

        } catch (error) {

            console.warn(
                "ARROWHEAD ONLINE: Score error.",
                error
            );

            return null;
        }
    }


    /* =====================================================
       COMPLETE LEVEL
       
       IMPORTANT:
       NO reward calculation here.
       
       game.js sends the exact final state.
    ===================================================== */

    async function completeOnlineLevel(
        level,
        score,
        coins,
        completedLevels,
        reward
    ) {

        if (
            !onlineReady ||
            !supabaseClient ||
            !onlinePlayer
        ) {
            return null;
        }


        try {

            const safeLevel =
                Math.max(
                    1,
                    Math.floor(
                        Number(level) || 1
                    )
                );


            const safeScore =
                Math.max(
                    0,
                    Math.floor(
                        Number(score) || 0
                    )
                );


            const safeCoins =
                Math.max(
                    0,
                    Math.floor(
                        Number(coins) || 0
                    )
                );


            const safeCompletedLevels =
                Math.max(
                    0,
                    Math.floor(
                        Number(completedLevels) || 0
                    )
                );


            const safeReward =
                Math.max(
                    0,
                    Math.floor(
                        Number(reward) || 0
                    )
                );


            const nextLevel =
                Math.max(
                    Number(
                        onlinePlayer.level || 1
                    ),
                    safeLevel + 1
                );


            const finalScore =
                Math.max(
                    Number(
                        onlinePlayer.score || 0
                    ),
                    safeScore
                );


            /* ---------------------------------------------
               SAVE EXACT LOCAL STATE
            --------------------------------------------- */

            const {
                data,
                error
            } =
                await supabaseClient
                    .from("players")
                    .update({

                        level:
                            nextLevel,

                        score:
                            finalScore,

                        coins:
                            safeCoins,

                        completed_levels:
                            safeCompletedLevels,

                        online:
                            true,

                        last_seen:
                            new Date().toISOString()

                    })
                    .eq(
                        "id",
                        onlinePlayer.id
                    )
                    .select()
                    .single();


            if (error) {

                console.warn(
                    "ARROWHEAD ONLINE: Level save failed.",
                    error
                );

                return null;
            }


            onlinePlayer =
                data;


            return {

                coinsEarned:
                    safeReward,

                totalCoins:
                    Number(
                        data.coins
                    ) || 0,

                level:
                    Number(
                        data.level
                    ) || nextLevel,

                score:
                    Number(
                        data.score
                    ) || finalScore,

                completedLevels:
                    Number(
                        data.completed_levels
                    ) || safeCompletedLevels

            };

        } catch (error) {

            console.error(
                "ARROWHEAD ONLINE: Complete level error.",
                error
            );

            return null;
        }
    }


    /* =====================================================
       GLOBAL LEADERBOARD
    ===================================================== */

    async function getGlobalLeaderboard() {

        if (
            !onlineReady ||
            !supabaseClient
        ) {
            return [];
        }


        try {

            const {
                data,
                error
            } =
                await supabaseClient
                    .from("players")
                    .select(
                        "name,level,score,coins,completed_levels"
                    )
                    .order(
                        "score",
                        {
                            ascending:
                                false
                        }
                    )
                    .order(
                        "level",
                        {
                            ascending:
                                false
                        }
                    )
                    .limit(20);


            if (error) {

                console.warn(
                    "ARROWHEAD ONLINE: Leaderboard failed.",
                    error
                );

                return [];
            }


            return data || [];

        } catch (error) {

            console.error(
                "ARROWHEAD ONLINE: Leaderboard error.",
                error
            );

            return [];
        }
    }


    /* =====================================================
       LIVE PLAYERS
    ===================================================== */

    async function getLivePlayers() {

        if (
            !onlineReady ||
            !supabaseClient
        ) {
            return [];
        }


        try {

            const cutoff =
                new Date(
                    Date.now() - 30000
                ).toISOString();


            const {
                data,
                error
            } =
                await supabaseClient
                    .from("players")
                    .select(
                        "name,level,score,coins,last_seen"
                    )
                    .eq(
                        "online",
                        true
                    )
                    .gte(
                        "last_seen",
                        cutoff
                    )
                    .order(
                        "score",
                        {
                            ascending:
                                false
                        }
                    )
                    .limit(30);


            if (error) {

                console.warn(
                    "ARROWHEAD ONLINE: Live players failed.",
                    error
                );

                return [];
            }


            return data || [];

        } catch (error) {

            console.error(
                "ARROWHEAD ONLINE: Live players error.",
                error
            );

            return [];
        }
    }


    /* =====================================================
       REFRESH
    ===================================================== */

    async function refreshOnlineData() {

        if (!onlineReady) {

            return {
                leaderboard: [],
                livePlayers: []
            };
        }


        const [
            leaderboard,
            livePlayers
        ] =
            await Promise.all([
                getGlobalLeaderboard(),
                getLivePlayers()
            ]);


        window.dispatchEvent(
            new CustomEvent(
                "arrowhead-online-update",
                {
                    detail: {
                        leaderboard,
                        livePlayers
                    }
                }
            )
        );


        return {
            leaderboard,
            livePlayers
        };
    }


    /* =====================================================
       AUTO REFRESH
    ===================================================== */

    function startOnlineRefresh() {

        stopOnlineRefresh();

        refreshOnlineData();


        refreshTimer =
            setInterval(
                refreshOnlineData,
                10000
            );
    }


    function stopOnlineRefresh() {

        if (refreshTimer) {

            clearInterval(
                refreshTimer
            );

            refreshTimer = null;
        }
    }


    /* =====================================================
       TAB VISIBILITY
    ===================================================== */

    document.addEventListener(
        "visibilitychange",
        () => {

            if (
                document.visibilityState ===
                "visible"
            ) {

                sendHeartbeat();
                refreshOnlineData();
            }
        }
    );


    /* =====================================================
       PAGE EXIT
    ===================================================== */

    window.addEventListener(
        "beforeunload",
        () => {

            markPlayerOffline();

        }
    );


    /* =====================================================
       PUBLIC API
    ===================================================== */

    window.ArrowheadOnline = {

        init:
            initOnlineSystem,

        registerPlayer:
            registerOnlinePlayer,

        heartbeat:
            sendHeartbeat,

        offline:
            markPlayerOffline,

        updateScore:
            updateOnlineScore,

        completeLevel:
            completeOnlineLevel,

        leaderboard:
            getGlobalLeaderboard,

        livePlayers:
            getLivePlayers,

        refresh:
            refreshOnlineData,

        startRefresh:
            startOnlineRefresh,

        stopRefresh:
            stopOnlineRefresh,

        getPlayer:
            () => onlinePlayer,

        isReady:
            () => onlineReady

    };


    console.log(
        "ARROWHEAD ONLINE 8.0 loaded."
    );

})();