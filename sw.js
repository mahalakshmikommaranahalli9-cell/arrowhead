/* =========================================================
   ARROWHEAD — SERVICE WORKER
========================================================= */

const CACHE_NAME = "arrowhead-v7";

const FILES = [
    "./",
    "./index.html",
    "./style.css",
    "./levels.js",
    "./game.js",
    "./manifest.json"
];


self.addEventListener(
    "install",
    event => {

        event.waitUntil(

            caches
                .open(CACHE_NAME)
                .then(
                    cache =>
                        cache.addAll(FILES)
                )

        );

        self.skipWaiting();

    }
);


self.addEventListener(
    "activate",
    event => {

        event.waitUntil(

            caches
                .keys()
                .then(
                    keys =>

                        Promise.all(

                            keys
                                .filter(
                                    key =>
                                        key !== CACHE_NAME
                                )
                                .map(
                                    key =>
                                        caches.delete(key)
                                )

                        )

                )

        );

        self.clients.claim();

    }
);


self.addEventListener(
    "fetch",
    event => {

        event.respondWith(

            fetch(event.request)

                .then(response => {

                    const copy =
                        response.clone();


                    caches
                        .open(CACHE_NAME)
                        .then(
                            cache =>
                                cache.put(
                                    event.request,
                                    copy
                                )
                        );


                    return response;

                })

                .catch(
                    () =>
                        caches.match(
                            event.request
                        )
                )

        );

    }
);