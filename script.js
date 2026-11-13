/* =========================================================
   SILENT VILLAGE
========================================================= */


/* =========================================================
   GLOBAL VARIABLES
========================================================= */

let currentUser = null;
let currentUsername = "";
let currentRoom = "";
let isHost = false;

let players = {};
let roomData = {};

let playerX = 1200;
let playerY = 800;

let keys = {};

let canvas;
let ctx;

let cameraX = 0;
let cameraY = 0;

let gameStarted = false;

let currentRole = "UNKNOWN";

let lastPositionUpdate = 0;

let gameTimer = 60;


/* =========================================================
   SCREEN MANAGEMENT
========================================================= */

function hideAllScreens() {

    document
        .querySelectorAll(".screen, .openingScreen, .gameScreen")
        .forEach(screen => {

            screen.classList.add("hidden");

        });

}


function showScreen(id) {

    hideAllScreens();

    const screen = document.getElementById(id);

    if (screen) {
        screen.classList.remove("hidden");
    }

}


/* =========================================================
   LOGIN / SIGNUP SCREENS
========================================================= */

function showLogin() {

    showScreen("loginScreen");

}


function showSignup() {

    showScreen("signupScreen");

}


/* =========================================================
   LOGIN
========================================================= */

function login() {

    const username =
        document
            .getElementById("loginUsername")
            .value
            .trim();

    const password =
        document
            .getElementById("loginPassword")
            .value;

    const message =
        document.getElementById("loginMessage");


    if (!username || !password) {

        message.textContent =
            "Please enter your username and password.";

        return;

    }


    message.textContent = "Entering village...";


    const email =
        username.toLowerCase() +
        "@silentvillage.game";


    auth
        .signInWithEmailAndPassword(email, password)

        .then(() => {

            currentUsername = username;

            document
                .getElementById("usernameDisplay")
                .textContent = username;

            showScreen("menuScreen");

        })

        .catch(error => {

            message.textContent =
                error.message;

        });

}


/* =========================================================
   SIGN UP
========================================================= */

function signup() {

    const username =
        document
            .getElementById("signupUsername")
            .value
            .trim();

    const password =
        document
            .getElementById("signupPassword")
            .value;

    const confirm =
        document
            .getElementById("signupConfirm")
            .value;

    const message =
        document.getElementById("signupMessage");


    if (!username || !password || !confirm) {

        message.textContent =
            "Please complete all fields.";

        return;

    }


    if (password !== confirm) {

        message.textContent =
            "Passwords do not match.";

        return;

    }


    if (username.length < 3) {

        message.textContent =
            "Username must be at least 3 characters.";

        return;

    }


    if (password.length < 6) {

        message.textContent =
            "Password must be at least 6 characters.";

        return;

    }


    message.textContent =
        "Creating account...";


    const email =
        username.toLowerCase() +
        "@silentvillage.game";


    auth
        .createUserWithEmailAndPassword(
            email,
            password
        )

        .then(result => {

            currentUser =
                result.user;

            currentUsername =
                username;


            return database
                .ref("users/" + result.user.uid)
                .set({

                    username: username,

                    createdAt:
                        firebase.database.ServerValue.TIMESTAMP

                });

        })

        .then(() => {

            document
                .getElementById("usernameDisplay")
                .textContent =
                currentUsername;

            showScreen("menuScreen");

        })

        .catch(error => {

            message.textContent =
                error.message;

        });

}


/* =========================================================
   AUTH STATE
========================================================= */

auth.onAuthStateChanged(user => {

    if (user) {

        currentUser = user;

        const savedName =
            user.email
                ? user.email.split("@")[0]
                : "Player";


        currentUsername =
            savedName;


        const display =
            document.getElementById(
                "usernameDisplay"
            );

        if (display) {
            display.textContent =
                currentUsername;
        }

    }

});


/* =========================================================
   LOGOUT
========================================================= */

function logout() {

    if (currentRoom) {

        leaveRoom();

    }


    auth
        .signOut()

        .then(() => {

            currentUser = null;

            currentUsername = "";

            currentRoom = "";

            showScreen("loginScreen");

        });

}


/* =========================================================
   ROOM CODE
========================================================= */

function generateRoomCode() {

    const chars =
        "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    let code = "";

    for (let i = 0; i < 6; i++) {

        code +=
            chars[
                Math.floor(
                    Math.random() *
                    chars.length
                )
            ];

    }

    return code;

}


/* =========================================================
   CREATE ROOM
========================================================= */

function createRoom() {

    if (!currentUser) {

        return;

    }


    const code =
        generateRoomCode();


    const playerData = {

        username:
            currentUsername,

        x: 1200,

        y: 800,

        alive: true,

        role: "Villager",

        ready: true,

        joinedAt:
            firebase.database.ServerValue.TIMESTAMP

    };


    database
        .ref("rooms/" + code)

        .set({

            host:
                currentUser.uid,

            started: false,

            phase: "night",

            timer: 60,

            secretWord:
                "SILENTVILLAGE",

            letters: {},

            players: {

                [currentUser.uid]:
                    playerData

            }

        })

        .then(() => {

            currentRoom = code;

            isHost = true;

            showLobby();

        })

        .catch(error => {

            document
                .getElementById("menuMessage")
                .textContent =
                error.message;

        });

}


/* =========================================================
   JOIN ROOM
========================================================= */

function joinRoom() {

    const input =
        document.getElementById(
            "roomCodeInput"
        );

    const message =
        document.getElementById(
            "menuMessage"
        );


    const code =
        input.value
            .trim()
            .toUpperCase();


    if (!code) {

        message.textContent =
            "Enter a room code.";

        return;

    }


    database
        .ref("rooms/" + code)

        .once("value")

        .then(snapshot => {

            if (!snapshot.exists()) {

                throw new Error(
                    "Village not found."
                );

            }


            const room =
                snapshot.val();


            const playerCount =
                room.players
                    ? Object.keys(room.players).length
                    : 0;


            if (playerCount >= 20) {

                throw new Error(
                    "This village is full."
                );

            }


            return database
                .ref(
                    "rooms/" +
                    code +
                    "/players/" +
                    currentUser.uid
                )

                .set({

                    username:
                        currentUsername,

                    x:
                        1200 +
                        Math.random() *
                        100,

                    y:
                        800 +
                        Math.random() *
                        100,

                    alive: true,

                    role: "Villager",

                    ready: true,

                    joinedAt:
                        firebase.database.ServerValue.TIMESTAMP

                })

                .then(() => {

                    currentRoom = code;

                    isHost =
                        room.host ===
                        currentUser.uid;

                    showLobby();

                });

        })

        .catch(error => {

            message.textContent =
                error.message;

        });

}


/* =========================================================
   SHOW LOBBY
========================================================= */

function showLobby() {

    showScreen("lobbyScreen");

    document
        .getElementById("roomCode")
        .textContent =
        currentRoom;


    listenToLobby();

}


/* =========================================================
   LOBBY LISTENER
========================================================= */

function listenToLobby() {

    if (!currentRoom) {
        return;
    }


    database
        .ref(
            "rooms/" +
            currentRoom
        )

        .on("value", snapshot => {

            if (!snapshot.exists()) {
                return;
            }


            const room =
                snapshot.val();


            roomData = room;


            const roomPlayers =
                room.players || {};


            players =
                roomPlayers;


            const container =
                document.getElementById(
                    "lobbyPlayers"
                );


            container.innerHTML = "";


            Object.keys(roomPlayers)
                .forEach(uid => {

                    const player =
                        roomPlayers[uid];


                    const div =
                        document.createElement(
                            "div"
                        );


                    div.className =
                        "lobbyPlayer";


                    div.textContent =
                        player.username;


                    container.appendChild(
                        div
                    );

                });


            const count =
                Object.keys(roomPlayers)
                    .length;


            document
                .getElementById(
                    "lobbyCount"
                )
                .textContent =
                count +
                " / 20 players";


            const startButton =
                document.getElementById(
                    "startButton"
                );


            if (isHost) {

                startButton.style.display =
                    "block";

                if (count >= 3) {

                    startButton.disabled =
                        false;

                    startButton.textContent =
                        "START GAME";

                } else {

                    startButton.disabled =
                        true;

                    startButton.textContent =
                        "NEED 3 PLAYERS";

                }

            } else {

                startButton.style.display =
                    "none";

            }


            if (room.started) {

                startGameClient();

            }

        });

}


/* =========================================================
   START GAME
========================================================= */

function startGame() {

    if (!isHost) {
        return;
    }


    const playerIds =
        Object.keys(players);


    if (playerIds.length < 3) {

        alert(
            "At least 3 players are required."
        );

        return;

    }


    const shuffled =
        [...playerIds]
            .sort(() => Math.random() - 0.5);


    const wolfId =
        shuffled[0];


    const sheriffId =
        shuffled[1];


    const updates = {};


    playerIds.forEach(uid => {

        let role =
            "Villager";


        if (uid === wolfId) {

            role = "Wolf";

        } else if (uid === sheriffId) {

            role = "Sheriff";

        }


        updates[
            "rooms/" +
            currentRoom +
            "/players/" +
            uid +
            "/role"
        ] = role;

        updates[
            "rooms/" +
            currentRoom +
            "/players/" +
            uid +
            "/alive"
        ] = true;

    });


    updates[
        "rooms/" +
        currentRoom +
        "/started"
    ] = true;


    updates[
        "rooms/" +
        currentRoom +
        "/phase"
    ] = "night";


    updates[
        "rooms/" +
        currentRoom +
        "/timer"
    ] = 60;


    database
        .ref()
        .update(updates)

        .then(() => {

            startGameClient();

        });

}


/* =========================================================
   START GAME CLIENT
========================================================= */

function startGameClient() {

    if (gameStarted) {
        return;
    }


    gameStarted = true;


    showScreen("gameScreen");


    setupCanvas();

    loadGameData();

    startGameLoop();

    setupKeyboard();

}


/* =========================================================
   CANVAS
========================================================= */

function setupCanvas() {

    canvas =
        document.getElementById(
            "gameCanvas"
        );


    if (!canvas) {
        return;
    }


    ctx =
        canvas.getContext("2d");


    resizeCanvas();


    window.addEventListener(
        "resize",
        resizeCanvas
    );

}


function resizeCanvas() {

    if (!canvas) {
        return;
    }


    canvas.width =
        window.innerWidth;

    canvas.height =
        window.innerHeight;

}


/* =========================================================
   GAME DATA
========================================================= */

function loadGameData() {

    database
        .ref(
            "rooms/" +
            currentRoom +
            "/players"
        )

        .on("value", snapshot => {

            players =
                snapshot.val() || {};


            if (
                currentUser &&
                players[currentUser.uid]
            ) {

                const me =
                    players[currentUser.uid];


                currentRole =
                    me.role || "Villager";


                playerX =
                    me.x || playerX;


                playerY =
                    me.y || playerY;


                document
                    .getElementById(
                        "roleText"
                    )
                    .textContent =
                    currentRole
                        .toUpperCase();


                updateRoleButtons();

            }

        });


    database
        .ref(
            "rooms/" +
            currentRoom
        )

        .on("value", snapshot => {

            roomData =
                snapshot.val() || {};


            updateGameHUD();

        });


    database
        .ref(
            "rooms/" +
            currentRoom +
            "/chat"
        )

        .limitToLast(50)

        .on("value", snapshot => {

            displayChat(
                snapshot.val() || {}
            );

        });

}


/* =========================================================
   HUD
========================================================= */

function updateGameHUD() {

    const phase =
        roomData.phase || "night";


    document
        .getElementById("phaseText")
        .textContent =
        phase.toUpperCase();


    document
        .getElementById("timer")
        .textContent =
        roomData.timer || 60;


    let word =
        roomData.word ||
        "_____________";


    let formatted = "";


    for (let i = 0; i < word.length; i++) {

        formatted +=
            word[i] === "_"
                ? "_ "
                : word[i] + " ";

    }


    document
        .getElementById(
            "wordProgress"
        )
        .textContent =
        formatted.trim();

}


/* =========================================================
   ROLE BUTTONS
========================================================= */

function updateRoleButtons() {

    const killButton =
        document.getElementById(
            "killButton"
        );

    const sheriffButton =
        document.getElementById(
            "sheriffButton"
        );


    if (currentRole === "Wolf") {

        killButton.classList.remove(
            "hidden"
        );

    } else {

        killButton.classList.add(
            "hidden"
        );

    }


    if (currentRole === "Sheriff") {

        sheriffButton.classList.remove(
            "hidden"
        );

    } else {

        sheriffButton.classList.add(
            "hidden"
        );

    }

}


/* =========================================================
   KEYBOARD
========================================================= */

function setupKeyboard() {

    window.addEventListener(
        "keydown",
        event => {

            keys[event.key] = true;

        }
    );


    window.addEventListener(
        "keyup",
        event => {

            keys[event.key] = false;

        }
    );

}


function keyDown(key) {

    keys[key] = true;

}


function keyUp(key) {

    keys[key] = false;

}


/* =========================================================
   GAME LOOP
========================================================= */

function startGameLoop() {

    function loop() {

        updatePlayer();

        updateCamera();

        drawGame();

        requestAnimationFrame(
            loop
        );

    }


    requestAnimationFrame(
        loop
    );

}


/* =========================================================
   PLAYER MOVEMENT
========================================================= */

function updatePlayer() {

    if (!currentUser || !gameStarted) {
        return;
    }


    const me =
        players[currentUser.uid];


    if (!me || me.alive === false) {
        return;
    }


    let dx = 0;
    let dy = 0;


    if (
        keys["ArrowUp"] ||
        keys["w"] ||
        keys["W"]
    ) {
        dy -= 4;
    }


    if (
        keys["ArrowDown"] ||
        keys["s"] ||
        keys["S"]
    ) {
        dy += 4;
    }


    if (
        keys["ArrowLeft"] ||
        keys["a"] ||
        keys["A"]
    ) {
        dx -= 4;
    }


    if (
        keys["ArrowRight"] ||
        keys["d"] ||
        keys["D"]
    ) {
        dx += 4;
    }


    if (dx === 0 && dy === 0) {
        return;
    }


    const length =
        Math.sqrt(
            dx * dx +
            dy * dy
        );


    if (length > 0) {

        dx =
            dx / length * 4;

        dy =
            dy / length * 4;

    }


    playerX += dx;

    playerY += dy;


    playerX =
        Math.max(
            50,
            Math.min(
                2350,
                playerX
            )
        );


    playerY =
        Math.max(
            50,
            Math.min(
                1550,
                playerY
            )
        );


    const now =
        Date.now();


    /*
       Do not write to Firebase every frame.
       Update position approximately 10 times
       per second.
    */

    if (
        now -
        lastPositionUpdate >
        100
    ) {

        lastPositionUpdate =
            now;


        database
            .ref(
                "rooms/" +
                currentRoom +
                "/players/" +
                currentUser.uid
            )

            .update({

                x: playerX,

                y: playerY

            });

    }

}


/* =========================================================
   CAMERA
========================================================= */

function updateCamera() {

    if (!canvas) {
        return;
    }


    cameraX =
        playerX -
        canvas.width / 2;


    cameraY =
        playerY -
        canvas.height / 2;


    cameraX =
        Math.max(
            0,
            Math.min(
                2400 -
                canvas.width,
                cameraX
            )
        );


    cameraY =
        Math.max(
            0,
            Math.min(
                1600 -
                canvas.height,
                cameraY
            )
        );

}


/* =========================================================
   DRAW GAME
========================================================= */

function drawGame() {

    if (!ctx || !canvas) {
        return;
    }


    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    ctx.save();


    ctx.translate(
        -cameraX,
        -cameraY
    );


    drawMap();

    drawPlayers();


    ctx.restore();

}


/* =========================================================
   MAP
========================================================= */

function drawMap() {

    /*
       Ground
    */

    ctx.fillStyle =
        "#29432d";

    ctx.fillRect(
        0,
        0,
        2400,
        1600
    );


    /*
       Paths
    */

    ctx.fillStyle =
        "#7d704f";

    ctx.fillRect(
        0,
        730,
        2400,
        140
    );

    ctx.fillRect(
        1120,
        0,
        160,
        1600
    );


    /*
       Town House
    */

    drawBuilding(
        1000,
        650,
        400,
        260,
        "#76533a",
        "TOWN HOUSE"
    );


    /*
       Houses
    */

    drawBuilding(
        350,
        300,
        260,
        180,
        "#684734",
        "HOUSE"
    );


    drawBuilding(
        1750,
        280,
        260,
        180,
        "#684734",
        "HOUSE"
    );


    drawBuilding(
        300,
        1100,
        280,
        190,
        "#684734",
        "HOUSE"
    );


    drawBuilding(
        1750,
        1100,
        280,
        190,
        "#684734",
        "HOUSE"
    );


    /*
       Barn
    */

    drawBuilding(
        680,
        1080,
        330,
        230,
        "#774032",
        "BARN"
    );


    /*
       Church
    */

    drawBuilding(
        1450,
        1050,
        320,
        250,
        "#665f52",
        "CHURCH"
    );


    /*
       Trees
    */

    for (
        let x = 100;
        x < 2300;
        x += 180
    ) {

        for (
            let y = 100;
            y < 1500;
            y += 180
        ) {

            if (
                x > 900 &&
                x < 1500 &&
                y > 550 &&
                y < 1000
            ) {
                continue;
            }


            drawTree(
                x,
                y
            );

        }

    }

}


/* =========================================================
   BUILDING
========================================================= */

function drawBuilding(
    x,
    y,
    width,
    height,
    color,
    name
) {

    ctx.fillStyle =
        "rgba(0,0,0,.3)";

    ctx.fillRect(
        x + 12,
        y + 12,
        width,
        height
    );


    ctx.fillStyle =
        color;

    ctx.fillRect(
        x,
        y,
        width,
        height
    );


    ctx.fillStyle =
        "#4b2b20";

    ctx.beginPath();

    ctx.moveTo(
        x - 20,
        y
    );

    ctx.lineTo(
        x + width / 2,
        y - 90
    );

    ctx.lineTo(
        x + width + 20,
        y
    );

    ctx.closePath();

    ctx.fill();


    ctx.fillStyle =
        "#241711";

    ctx.fillRect(
        x + width / 2 - 30,
        y + height - 90,
        60,
        90
    );


    ctx.fillStyle =
        "white";

    ctx.font =
        "bold 22px Rajdhani";

    ctx.textAlign =
        "center";

    ctx.fillText(
        name,
        x + width / 2,
        y + height + 35
    );

}


/* =========================================================
   TREE
========================================================= */

function drawTree(x, y) {

    ctx.fillStyle =
        "#543b25";

    ctx.fillRect(
        x - 10,
        y + 20,
        20,
        55
    );


    ctx.fillStyle =
        "#183c23";

    ctx.beginPath();

    ctx.arc(
        x,
        y,
        45,
        0,
        Math.PI * 2
    );

    ctx.fill();


    ctx.fillStyle =
        "#24542f";

    ctx.beginPath();

    ctx.arc(
        x - 25,
        y + 10,
        35,
        0,
        Math.PI * 2
    );

    ctx.fill();


    ctx.beginPath();

    ctx.arc(
        x + 25,
        y + 10,
        35,
        0,
        Math.PI * 2
    );

    ctx.fill();

}


/* =========================================================
   DRAW PLAYERS
========================================================= */

function drawPlayers() {

    Object.keys(players)
        .forEach(uid => {

            const player =
                players[uid];


            if (
                player.alive === false
            ) {
                return;
            }


            const x =
                player.x || 1200;

            const y =
                player.y || 800;


            let color =
                "#5fa8ff";


            if (player.role === "Wolf") {

                color =
                    "#e42d35";

            } else if (
                player.role === "Sheriff"
            ) {

                color =
                    "#3f8fd0";

            }


            /*
               Hide other players' roles
               visually from the player.
            */

            ctx.fillStyle =
                color;


            ctx.beginPath();

            ctx.arc(
                x,
                y,
                22,
                0,
                Math.PI * 2
            );

            ctx.fill();


            ctx.fillStyle =
                "#10131b";

            ctx.beginPath();

            ctx.arc(
                x,
                y - 25,
                15,
                0,
                Math.PI * 2
            );

            ctx.fill();


            ctx.fillStyle =
                "white";

            ctx.font =
                "bold 17px Rajdhani";

            ctx.textAlign =
                "center";

            ctx.fillText(
                player.username || "Player",
                x,
                y + 50
            );

        });

}


/* =========================================================
   INTERACT
========================================================= */

function interact() {

    alert(
        "You are exploring the village. Look for clues and letters."
    );

}


/* =========================================================
   WOLF ATTACK
========================================================= */

function wolfAttack() {

    if (currentRole !== "Wolf") {
        return;
    }


    const target =
        findNearestPlayer();


    if (!target) {

        alert(
            "No player is close enough."
        );

        return;

    }


    database
        .ref(
            "rooms/" +
            currentRoom +
            "/players/" +
            target.uid +
            "/alive"
        )

        .set(false);

}


/* =========================================================
   SHERIFF
========================================================= */

function sheriffAttack() {

    if (currentRole !== "Sheriff") {
        return;
    }


    const target =
        findNearestPlayer();


    if (!target) {

        alert(
            "No player is close enough."
        );

        return;

    }


    if (target.role === "Wolf") {

        database
            .ref(
                "rooms/" +
                currentRoom +
                "/players/" +
                target.uid +
                "/stunned"
            )

            .set(true);


        alert(
            "The Wolf has been stunned!"
        );

    } else {

        alert(
            "That player is not the Wolf."
        );

    }

}


/* =========================================================
   FIND NEAREST PLAYER
========================================================= */

function findNearestPlayer() {

    let nearest = null;

    let nearestDistance =
        Infinity;


    Object.keys(players)
        .forEach(uid => {

            if (
                uid ===
                currentUser.uid
            ) {
                return;
            }


            const player =
                players[uid];


            if (
                player.alive === false
            ) {
                return;
            }


            const dx =
                (player.x || 0) -
                playerX;

            const dy =
                (player.y || 0) -
                playerY;


            const distance =
                Math.sqrt(
                    dx * dx +
                    dy * dy
                );


            if (
                distance <
                nearestDistance
            ) {

                nearestDistance =
                    distance;

                nearest = {

                    ...player,

                    uid: uid

                };

            }

        });


    if (
        nearestDistance >
        100
    ) {

        return null;

    }


    return nearest;

}


/* =========================================================
   MEETING
========================================================= */

function callMeeting() {

    const panel =
        document.getElementById(
            "meetingPanel"
        );


    panel.classList.remove(
        "hidden"
    );


    const container =
        document.getElementById(
            "votePlayers"
        );


    container.innerHTML = "";


    Object.keys(players)
        .forEach(uid => {

            const player =
                players[uid];


            if (
                player.alive === false
            ) {
                return;
            }


            if (
                uid ===
                currentUser.uid
            ) {
                return;
            }


            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "votePlayer";


            const name =
                document.createElement(
                    "span"
                );


            name.textContent =
                player.username;


            const button =
                document.createElement(
                    "button"
                );


            button.textContent =
                "VOTE";


            button.onclick = () => {

                voteFor(uid);

            };


            row.appendChild(name);

            row.appendChild(button);

            container.appendChild(row);

        });

}


/* =========================================================
   VOTE
========================================================= */

function voteFor(uid) {

    database
        .ref(
            "rooms/" +
            currentRoom +
            "/votes/" +
            currentUser.uid
        )

        .set(uid)

        .then(() => {

            alert(
                "Your vote has been recorded."
            );

        });

}


/* =========================================================
   SKIP VOTE
========================================================= */

function skipVote() {

    database
        .ref(
            "rooms/" +
            currentRoom +
            "/votes/" +
            currentUser.uid
        )

        .set("skip");


    closeMeeting();

}


/* =========================================================
   CLOSE MEETING
========================================================= */

function closeMeeting() {

    document
        .getElementById(
            "meetingPanel"
        )
        .classList.add(
            "hidden"
        );

}


/* =========================================================
   CHAT
========================================================= */

function sendChat() {

    const input =
        document.getElementById(
            "chatInput"
        );


    const message =
        input.value.trim();


    if (!message) {
        return;
    }


    database
        .ref(
            "rooms/" +
            currentRoom +
            "/chat"
        )

        .push({

            username:
                currentUsername,

            message:
                message,

            time:
                firebase.database.ServerValue.TIMESTAMP

        });


    input.value = "";

}


/* =========================================================
   DISPLAY CHAT
========================================================= */

function displayChat(messages) {

    const container =
        document.getElementById(
            "chatMessages"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    Object.values(messages)
        .forEach(message => {

            const div =
                document.createElement(
                    "div"
                );


            div.className =
                "chatMessage";


            const name =
                document.createElement(
                    "span"
                );


            name.className =
                "chatName";


            name.textContent =
                message.username +
                ": ";


            const text =
                document.createTextNode(
                    message.message
                );


            div.appendChild(name);

            div.appendChild(text);

            container.appendChild(div);

        });


    container.scrollTop =
        container.scrollHeight;

}


/* =========================================================
   LEAVE ROOM
========================================================= */

function leaveRoom() {

    if (
        currentRoom &&
        currentUser
    ) {

        database
            .ref(
                "rooms/" +
                currentRoom +
                "/players/" +
                currentUser.uid
            )

            .remove();

    }


    currentRoom = "";

    isHost = false;

    gameStarted = false;

    players = {};

    showScreen("menuScreen");

}


/* =========================================================
   RETURN TO MENU
========================================================= */

function returnToMenu() {

    gameStarted = false;

    showScreen("menuScreen");

}


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        showScreen("loginScreen");


        const chatInput =
            document.getElementById(
                "chatInput"
            );


        if (chatInput) {

            chatInput.addEventListener(
                "keydown",
                event => {

                    if (
                        event.key ===
                        "Enter"
                    ) {

                        sendChat();

                    }

                }
            );

        }

    }
);