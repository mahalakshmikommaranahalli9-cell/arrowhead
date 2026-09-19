/* =========================================================
   ARROWHEAD — INFINITE SOLVABLE TAP-AWAY LEVEL GENERATOR

   Every piece is a real Tap-Away arrow:
   ↑  ↓  ←  →

   IMPORTANT:
   Every generated level is guaranteed to have
   a valid removal sequence.

   No hardcoded levels.
   Infinite procedural generation.
========================================================= */

const ArrowLevels = (() => {

    const DIRECTIONS = {
        UP: {
            symbol: "↑",
            dr: -1,
            dc: 0
        },

        RIGHT: {
            symbol: "→",
            dr: 0,
            dc: 1
        },

        DOWN: {
            symbol: "↓",
            dr: 1,
            dc: 0
        },

        LEFT: {
            symbol: "←",
            dr: 0,
            dc: -1
        }
    };


    /* =====================================================
       RANDOM HELPERS
    ===================================================== */

    function random(min, max) {

        return Math.floor(
            Math.random() * (max - min + 1)
        ) + min;

    }


    function shuffle(array) {

        const result = [...array];

        for (
            let i = result.length - 1;
            i > 0;
            i--
        ) {

            const j =
                Math.floor(
                    Math.random() * (i + 1)
                );


            [
                result[i],
                result[j]
            ] = [
                result[j],
                result[i]
            ];

        }

        return result;

    }


    /* =====================================================
       BOARD SIZE
       Infinite difficulty
    ===================================================== */

    function getSize(level) {

        if (level <= 2) {
            return 5;
        }

        if (level <= 5) {
            return 6;
        }

        if (level <= 9) {
            return 7;
        }

        if (level <= 14) {
            return 8;
        }

        if (level <= 20) {
            return 9;
        }

        if (level <= 30) {
            return 10;
        }

        if (level <= 45) {
            return 11;
        }

        return Math.min(
            14,
            12 +
            Math.floor(
                (level - 46) / 15
            )
        );

    }


    /* =====================================================
       NUMBER OF ARROWS
    ===================================================== */

    function getTargetCount(
        level,
        size
    ) {

        const total =
            size * size;


        /*
         * Gradually becomes denser.
         */

        const percentage =
            Math.min(
                0.82,
                0.40 +
                level * 0.006
            );


        return Math.max(
            8,

            Math.min(
                total - 1,

                Math.floor(
                    total * percentage
                )
            )
        );

    }


    /* =====================================================
       DISTANCE TO EACH BOARD EDGE
    ===================================================== */

    function edgeDistances(
        row,
        col,
        size
    ) {

        return {

            up:
                row,

            down:
                size - 1 - row,

            left:
                col,

            right:
                size - 1 - col

        };

    }


    /* =====================================================
       CHOOSE A VALID OUTWARD DIRECTION

       The arrow points toward one of the nearest
       board edges.

       This gives us a guaranteed solution order:

       1. Edge arrows leave first.
       2. Next layer becomes clear.
       3. Next layer becomes clear.
       4. Continue until the center.

       Therefore no impossible cycle can be created.
    ===================================================== */

    function chooseDirection(
        row,
        col,
        size
    ) {

        const distance =
            edgeDistances(
                row,
                col,
                size
            );


        const minimum =
            Math.min(
                distance.up,
                distance.down,
                distance.left,
                distance.right
            );


        const candidates = [];


        if (
            distance.up === minimum
        ) {

            candidates.push(
                DIRECTIONS.UP
            );

        }


        if (
            distance.right === minimum
        ) {

            candidates.push(
                DIRECTIONS.RIGHT
            );

        }


        if (
            distance.down === minimum
        ) {

            candidates.push(
                DIRECTIONS.DOWN
            );

        }


        if (
            distance.left === minimum
        ) {

            candidates.push(
                DIRECTIONS.LEFT
            );

        }


        /*
         * Randomly select one of the
         * valid nearest-edge directions.
         */

        return candidates[
            random(
                0,
                candidates.length - 1
            )
        ];

    }


    /* =====================================================
       GENERATE LEVEL
    ===================================================== */

    function generateLevel(level) {

        const size =
            getSize(level);


        const targetCount =
            getTargetCount(
                level,
                size
            );


        /*
         * Create every board cell.
         */

        const cells = [];


        for (
            let row = 0;
            row < size;
            row++
        ) {

            for (
                let col = 0;
                col < size;
                col++
            ) {

                cells.push({

                    row,

                    col

                });

            }

        }


        /*
         * Randomly select the cells that
         * will contain arrows.
         */

        const selectedCells =
            shuffle(cells)
                .slice(
                    0,
                    targetCount
                );


        /*
         * Create arrows.
         */

        const arrows =
            selectedCells.map(
                cell => {

                    const direction =
                        chooseDirection(
                            cell.row,
                            cell.col,
                            size
                        );


                    return {

                        row:
                            cell.row,

                        col:
                            cell.col,

                        direction:
                            direction.symbol,

                        dr:
                            direction.dr,

                        dc:
                            direction.dc

                    };

                }
            );


        /*
         * Shuffle final display order.
         *
         * This is important:
         * the player should NOT see the
         * guaranteed solution order.
         */

        const finalArrows =
            shuffle(arrows);


        return {

            level,

            size,

            arrows:
                finalArrows,

            total:
                finalArrows.length

        };

    }


    /* =====================================================
       PUBLIC API
    ===================================================== */

    function getLevel(level) {

        const safeLevel =
            Math.max(
                1,
                Number(level) || 1
            );


        return generateLevel(
            safeLevel
        );

    }


    function getDifficulty(level) {

        const size =
            getSize(level);


        return {

            size,

            arrows:
                getTargetCount(
                    level,
                    size
                )

        };

    }


    return {

        getLevel,

        getDifficulty

    };

})();


/* =========================================================
   MAKE AVAILABLE TO game.js
========================================================= */

window.ArrowLevels =
    ArrowLevels;