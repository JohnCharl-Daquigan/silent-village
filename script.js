/* ==========================================
   SILENT VILLAGE
   ONLINE MULTIPLAYER
   USERNAME + PASSWORD
   ========================================== */


const WORDS = [
    "APPLE",
    "RIVER",
    "MOON",
    "FOREST",
    "CHURCH",
    "HOUSE",
    "FLOWER",
    "BREAD",
    "CANDLE",
    "BELL",
    "HORSE",
    "FIRE",
    "RAIN",
    "TREE",
    "GOLD"
];


const CLUES = {

    house: [
        "Someone lives here.",
        "It provides shelter.",
        "It has walls."
    ],

    forest: [
        "There are many trees.",
        "Animals may live here.",
        "It is outside the village."
    ],

    church: [
        "People gather here.",
        "There may be a bell.",
        "It is an old building."
    ],

    market: [
        "People buy things here.",
        "Many goods can be found here.",
        "Villagers visit this place."
    ],

    barn: [
        "Animals may stay here.",
        "It can be used for storage.",
        "It is often made of wood."
    ],

    river: [
        "Water flows here.",
        "Fish may live here.",
        "It is outside the village."
    ]

};


let currentUser = null;
let currentUsername = null;
let currentRoom = null;
let roomRef = null;
let roomListener = null;
let timerInterval = null;
let lastTimer = null;


/* ==========================================
   SCREEN FUNCTIONS
   ========================================== */

function hideScreens() {

    document
        .querySelectorAll(".screen")
        .forEach(screen => {
            screen.classList.add("hidden");
        });

}


function showScreen(id) {

    hideScreens();

    document
        .getElementById(id)
        .classList.remove("hidden");

}


function showSignup() {
    showScreen("signupScreen");
}


function showLogin() {
    showScreen("loginScreen");
}


/* ==========================================
   USERNAME
   ========================================== */

function makeEmail(username) {

    return username
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        + "@silentvillage.local";

}


/* ==========================================
   SIGN UP
   ========================================== */

async function signup() {

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
        document
            .getElementById("signupMessage");


    message.style.color = "#e74c3c";


    if (!username || !password || !confirm) {

        message.textContent =
            "Please complete all fields.";

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


    if (password !== confirm) {

        message.textContent =
            "Passwords do not match.";

        return;
    }


    try {

        const email =
            makeEmail(username);


        const result =
            await auth
                .createUserWithEmailAndPassword(
                    email,
                    password
                );


        await database
            .ref(
                "users/" +
                result.user.uid
            )
            .set({
                username: username,
                createdAt: Date.now()
            });


        message.style.color =
            "#2ecc71";

        message.textContent =
            "Account created!";


        document
            .getElementById("signupUsername")
            .value = "";

        document
            .getElementById("signupPassword")
            .value = "";

        document
            .getElementById("signupConfirm")
            .value = "";


        setTimeout(
            () => {
                showScreen("homeScreen");
            },
            800
        );


    } catch (error) {

        console.error(error);

        if (
            error.code ===
            "auth/email-already-in-use"
        ) {

            message.textContent =
                "Username already exists.";

        } else {

            message.textContent =
                error.message;
        }

    }

}


/* ==========================================
   LOGIN
   ========================================== */

async function login() {

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
        document
            .getElementById("loginMessage");


    if (!username || !password) {

        message.textContent =
            "Enter your username and password.";

        return;
    }


    try {

        const email =
            makeEmail(username);


        await auth
            .signInWithEmailAndPassword(
                email,
                password
            );


    } catch (error) {

        console.error(error);

        message.textContent =
            "Incorrect username or password.";

    }

}


/* ==========================================
   AUTH STATE
   ========================================== */

auth.onAuthStateChanged(
    async user => {

        if (!user) {

            currentUser = null;
            currentUsername = null;

            showScreen("loginScreen");

            return;
        }


        currentUser = user;


        const snapshot =
            await database
                .ref(
                    "users/" +
                    user.uid
                )
                .once("value");


        const data =
            snapshot.val();


        currentUsername =
            data?.username ||
            "Player";


        document
            .getElementById(
                "currentUsername"
            )
            .textContent =
            currentUsername;


        showScreen("homeScreen");

    }
);


/* ==========================================
   LOGOUT
   ========================================== */

async function logout() {

    if (currentRoom) {

        await leaveRoom();

    }

    await auth.signOut();

}


/* ==========================================
   ROOM CODE
   ========================================== */

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


/* ==========================================
   CREATE ROOM
   ========================================== */

async function createRoom() {

    try {

        let code =
            generateRoomCode();


        let snapshot =
            await database
                .ref(
                    "rooms/" +
                    code
                )
                .once("value");


        while (snapshot.exists()) {

            code =
                generateRoomCode();

            snapshot =
                await database
                    .ref(
                        "rooms/" +
                        code
                    )
                    .once("value");

        }


        currentRoom = code;


        await database
            .ref(
                "rooms/" +
                code
            )
            .set({

                host:
                    currentUser.uid,

                status:
                    "lobby",

                createdAt:
                    Date.now()

            });


        await addPlayer(code);

        listenToRoom();

        showScreen("lobbyScreen");


    } catch (error) {

        console.error(error);

        alert(
            "Could not create village: " +
            error.message
        );

    }

}


/* ==========================================
   JOIN ROOM
   ========================================== */

async function joinRoom() {

    const input =
        document
            .getElementById(
                "roomCodeInput"
            )
            .value
            .trim()
            .toUpperCase();

    const message =
        document
            .getElementById(
                "roomMessage"
            );


    if (!input) {

        message.textContent =
            "Enter a room code.";

        return;
    }


    try {

        const snapshot =
            await database
                .ref(
                    "rooms/" +
                    input
                )
                .once("value");


        if (!snapshot.exists()) {

            message.textContent =
                "Village not found.";

            return;
        }


        const room =
            snapshot.val();


        if (room.status !== "lobby") {

            message.textContent =
                "This game has already started.";

            return;
        }


        const players =
            room.players || {};


        if (
            Object.keys(players).length >= 20
        ) {

            message.textContent =
                "Village is full.";

            return;
        }


        currentRoom = input;


        await addPlayer(input);

        listenToRoom();

        showScreen("lobbyScreen");


    } catch (error) {

        message.textContent =
            error.message;

    }

}


/* ==========================================
   ADD PLAYER
   ========================================== */

async function addPlayer(code) {

    await database
        .ref(
            "rooms/" +
            code +
            "/players/" +
            currentUser.uid
        )
        .set({

            uid:
                currentUser.uid,

            username:
                currentUsername,

            alive:
                true,

            role:
                "",

            joinedAt:
                Date.now()

        });

}


/* ==========================================
   LISTEN TO ROOM
   ========================================== */

function listenToRoom() {

    if (roomListener) {

        roomListener.off();

    }


    roomRef =
        database.ref(
            "rooms/" +
            currentRoom
        );


    roomListener =
        roomRef;


    roomListener.on(
        "value",
        snapshot => {

            const room =
                snapshot.val();


            if (!room) {

                currentRoom = null;

                showScreen("homeScreen");

                return;
            }


            if (
                room.status ===
                "lobby"
            ) {

                showScreen(
                    "lobbyScreen"
                );

                updateLobby(room);

            }


            if (
                room.status ===
                "playing"
            ) {

                showScreen(
                    "gameScreen"
                );

                updateGame(room);

            }


            if (
                room.status ===
                "meeting"
            ) {

                showScreen(
                    "gameScreen"
                );

                updateGame(room);

                showMeeting(room);

            }


            if (
                room.status ===
                "ended"
            ) {

                showGameOver(room);

            }

        }
    );

}


/* ==========================================
   LOBBY
   ========================================== */

function updateLobby(room) {

    document
        .getElementById(
            "roomCodeDisplay"
        )
        .textContent =
        currentRoom;


    const list =
        document.getElementById(
            "playerList"
        );


    list.innerHTML = "";


    const players =
        Object.values(
            room.players || {}
        );


    players.forEach(
        player => {

            const div =
                document.createElement(
                    "div"
                );

            div.className =
                "player";

            div.textContent =
                player.username;


            if (
                player.uid ===
                room.host
            ) {

                div.textContent +=
                    " 👑";

            }


            list.appendChild(div);

        }
    );


    document
        .getElementById(
            "playerCount"
        )
        .textContent =
        `${players.length} / 20 players`;


    const startButton =
        document.getElementById(
            "startButton"
        );


    if (
        room.host ===
        currentUser.uid
    ) {

        startButton.classList.remove(
            "hidden"
        );

    } else {

        startButton.classList.add(
            "hidden"
        );

    }

}


/* ==========================================
   START GAME
   ========================================== */

async function startGame() {

    const snapshot =
        await database
            .ref(
                "rooms/" +
                currentRoom
            )
            .once("value");


    const room =
        snapshot.val();


    if (
        room.host !==
        currentUser.uid
    ) {

        return;

    }


    const players =
        Object.values(
            room.players || {}
        );


    if (players.length < 3) {

        alert(
            "At least 3 players are required."
        );

        return;
    }


    assignRoles(players);

}


/* ==========================================
   ASSIGN ROLES
   ========================================== */

async function assignRoles(players) {

    const shuffled =
        [...players].sort(
            () =>
                Math.random() -
                0.5
        );


    let wolfCount = 1;
    let sheriffCount = 1;


    if (players.length >= 10) {

        wolfCount = 2;

    }


    if (players.length >= 15) {

        wolfCount = 3;
        sheriffCount = 2;

    }


    const updates = {};


    shuffled.forEach(
        (player, index) => {

            let role =
                "VILLAGER";


            if (
                index <
                wolfCount
            ) {

                role =
                    "WOLF";

            }

            else if (
                index <
                wolfCount +
                sheriffCount
            ) {

                role =
                    "SHERIFF";

            }


            updates[
                "rooms/" +
                currentRoom +
                "/players/" +
                player.uid +
                "/role"
            ] = role;

        }
    );


    const word =
        WORDS[
            Math.floor(
                Math.random() *
                WORDS.length
            )
        ];


    updates[
        "rooms/" +
        currentRoom +
        "/secretWord"
    ] = word;


    updates[
        "rooms/" +
        currentRoom +
        "/status"
    ] = "playing";


    updates[
        "rooms/" +
        currentRoom +
        "/phase"
    ] = "explore";


    updates[
        "rooms/" +
        currentRoom +
        "/timer"
    ] = 60;


    updates[
        "rooms/" +
        currentRoom +
        "/startedAt"
    ] = Date.now();


    await database
        .ref()
        .update(updates);

}


/* ==========================================
   UPDATE GAME
   ========================================== */

function updateGame(room) {

    const player =
        room.players?.[
            currentUser.uid
        ];


    if (!player) {
        return;
    }


    if (!player.alive) {

        document
            .getElementById(
                "roleDescription"
            )
            .textContent =
            "You are dead. You can watch the village.";

    }


    document
        .getElementById(
            "phaseText"
        )
        .textContent =
        room.phase === "meeting"
            ? "Village Meeting"
            : "Explore the village";


    document
        .getElementById(
            "roleDisplay"
        )
        .textContent =
        player.role;


    const roleDescription =
        document.getElementById(
            "roleDescription"
        );


    const wolfAction =
        document.getElementById(
            "wolfAction"
        );


    const sheriffAction =
        document.getElementById(
            "sheriffAction"
        );


    const secretBox =
        document.getElementById(
            "secretWordBox"
        );


    wolfAction.classList.add(
        "hidden"
    );


    sheriffAction.classList.add(
        "hidden"
    );


    secretBox.classList.add(
        "hidden"
    );


    if (
        player.role ===
        "WOLF"
    ) {

        document
            .getElementById(
                "roleDisplay"
            )
            .style.color =
            "#e74c3c";


        roleDescription.textContent =
            "Eliminate the villagers and protect the secret word.";


        secretBox.classList.remove(
            "hidden"
        );


        document
            .getElementById(
                "secretWord"
            )
            .textContent =
            room.secretWord;


        if (player.alive) {

            wolfAction.classList.remove(
                "hidden"
            );

        }

    }

    else if (
        player.role ===
        "SHERIFF"
    ) {

        document
            .getElementById(
                "roleDisplay"
            )
            .style.color =
            "#3498db";


        roleDescription.textContent =
            "Find and stop the Wolf.";


        if (player.alive) {

            sheriffAction.classList.remove(
                "hidden"
            );

        }

    }

    else {

        document
            .getElementById(
                "roleDisplay"
            )
            .style.color =
            "#2ecc71";


        roleDescription.textContent =
            "Find clues and discover the Wolf.";

    }


    updateTimer(room);

    loadClues();

}


/* ==========================================
   TIMER
   ========================================== */

function updateTimer(room) {

    const timer =
        document.getElementById(
            "timer"
        );


    const value =
        room.timer || 0;


    timer.textContent =
        value;


    if (
        lastTimer !== value
    ) {

        lastTimer = value;

    }

}


/* ==========================================
   SEARCH LOCATION
   ========================================== */

async function searchLocation(location) {

    const snapshot =
        await database
            .ref(
                "rooms/" +
                currentRoom +
                "/players/" +
                currentUser.uid
            )
            .once("value");


    const player =
        snapshot.val();


    if (
        !player ||
        !player.alive
    ) {

        return;

    }


    if (
        roomIsMeeting()
    ) {

        alert(
            "Wait until the meeting ends."
        );

        return;

    }


    const clues =
        CLUES[location];


    const clue =
        clues[
            Math.floor(
                Math.random() *
                clues.length
            )
        ];


    const clueId =
        Date.now();


    await database
        .ref(
            "rooms/" +
            currentRoom +
            "/clues/" +
            currentUser.uid +
            "/" +
            clueId
        )
        .set(clue);


    await addEvent(
        currentUsername +
        " found a clue."
    );


    displayClue(clue);

}


/* ==========================================
   LOAD CLUES
   ========================================== */

async function loadClues() {

    const snapshot =
        await database
            .ref(
                "rooms/" +
                currentRoom +
                "/clues/" +
                currentUser.uid
            )
            .once("value");


    const clues =
        snapshot.val() || {};


    const list =
        document.getElementById(
            "clueList"
        );


    list.innerHTML = "";


    if (
        Object.keys(clues).length === 0
    ) {

        list.innerHTML =
            '<p class="small">No clues discovered yet.</p>';

        return;

    }


    Object.values(clues)
        .forEach(
            clue => {

                displayClue(
                    clue
                );

            }
        );

}


/* ==========================================
   DISPLAY CLUE
   ========================================== */

function displayClue(clue) {

    const list =
        document.getElementById(
            "clueList"
        );


    const div =
        document.createElement(
            "div"
        );


    div.className =
        "clue";


    div.textContent =
        clue;


    list.appendChild(div);

}


/* ==========================================
   EVENTS
   ========================================== */

async function addEvent(message) {

    const id =
        Date.now() +
        "-" +
        Math.random()
            .toString(36)
            .substring(2);


    await database
        .ref(
            "rooms/" +
            currentRoom +
            "/events/" +
            id
        )
        .set({

            message:
                message,

            time:
                Date.now()

        });

}


/* ==========================================
   LOAD EVENTS
   ========================================== */

async function loadEvents() {

    const snapshot =
        await database
            .ref(
                "rooms/" +
                currentRoom +
                "/events"
            )
            .limitToLast(30)
            .once("value");


    const events =
        snapshot.val() || {};


    const log =
        document.getElementById(
            "gameLog"
        );


    log.innerHTML = "";


    Object.values(events)
        .sort(
            (a, b) =>
                b.time -
                a.time
        )
        .forEach(
            event => {

                const div =
                    document.createElement(
                        "div"
                    );


                div.className =
                    "log";


                div.textContent =
                    event.message;


                log.appendChild(div);

            }
        );

}


/* ==========================================
   WOLF TARGET
   ========================================== */

async function openWolfTarget() {

    const snapshot =
        await database
            .ref(
                "rooms/" +
                currentRoom
            )
            .once("value");


    const room =
        snapshot.val();


    const me =
        room.players[
            currentUser.uid
        ];


    if (
        me.role !== "WOLF" ||
        !me.alive
    ) {

        return;

    }


    document
        .getElementById(
            "targetPanel"
        )
        .classList.remove(
            "hidden"
        );


    document
        .getElementById(
            "targetTitle"
        )
        .textContent =
        "Choose a player to eliminate";


    const list =
        document.getElementById(
            "targetList"
        );


    list.innerHTML = "";


    Object.values(room.players)
        .filter(
            player =>
                player.alive &&
                player.role !== "WOLF"
        )
        .forEach(
            player => {

                const div =
                    document.createElement(
                        "div"
                    );


                div.className =
                    "target";


                div.innerHTML =
                    `<span>${player.username}</span>
                     <button onclick="wolfKill('${player.uid}')">
                     ELIMINATE
                     </button>`;


                list.appendChild(div);

            }
        );

}


/* ==========================================
   WOLF KILL
   ========================================== */

async function wolfKill(targetUid) {

    const snapshot =
        await database
            .ref(
                "rooms/" +
                currentRoom
            )
            .once("value");


    const room =
        snapshot.val();


    const wolf =
        room.players[
            currentUser.uid
        ];


    if (
        wolf.role !== "WOLF" ||
        !wolf.alive
    ) {

        return;

    }


    const target =
        room.players[targetUid];


    if (
        !target ||
        !target.alive ||
        target.role === "WOLF"
    ) {

        return;

    }


    await database
        .ref(
            "rooms/" +
            currentRoom +
            "/players/" +
            targetUid +
            "/alive"
        )
        .set(false);


    await addEvent(
        target.username +
        " disappeared from the village."
    );


    document
        .getElementById(
            "targetPanel"
        )
        .classList.add(
            "hidden"
        );


    checkWin();

}


/* ==========================================
   SHERIFF TARGET
   ========================================== */

async function openSheriffTarget() {

    const snapshot =
        await database
            .ref(
                "rooms/" +
                currentRoom
            )
            .once("value");


    const room =
        snapshot.val();


    const me =
        room.players[
            currentUser.uid
        ];


    if (
        me.role !== "SHERIFF" ||
        !me.alive
    ) {

        return;

    }


    document
        .getElementById(
            "targetPanel"
        )
        .classList.remove(
            "hidden"
        );


    document
        .getElementById(
            "targetTitle"
        )
        .textContent =
        "Choose a player to investigate";


    const list =
        document.getElementById(
            "targetList"
        );


    list.innerHTML = "";


    Object.values(room.players)
        .filter(
            player =>
                player.alive &&
                player.uid !==
                currentUser.uid
        )
        .forEach(
            player => {

                const div =
                    document.createElement(
                        "div"
                    );


                div.className =
                    "target";


                div.innerHTML =
                    `<span>${player.username}</span>
                     <button onclick="sheriffInvestigate('${player.uid}')">
                     INVESTIGATE
                     </button>`;


                list.appendChild(div);

            }
        );

}


/* ==========================================
   SHERIFF INVESTIGATE
   ========================================== */

async function sheriffInvestigate(targetUid) {

    const snapshot =
        await database
            .ref(
                "rooms/" +
                currentRoom
            )
            .once("value");


    const room =
        snapshot.val();


    const sheriff =
        room.players[
            currentUser.uid
        ];


    if (
        sheriff.role !== "SHERIFF" ||
        !sheriff.alive
    ) {

        return;

    }


    const target =
        room.players[targetUid];


    if (!target || !target.alive) {

        return;

    }


    if (
        target.role ===
        "WOLF"
    ) {

        alert(
            target.username +
            " IS THE WOLF!"
        );


        await database
            .ref(
                "rooms/" +
                currentRoom +
                "/players/" +
                targetUid +
                "/alive"
            )
            .set(false);


        await addEvent(
            "The Sheriff caught the Wolf!"
        );


        await database
            .ref(
                "rooms/" +
                currentRoom
            )
            .update({
                status: "ended",
                winner: "SHERIFF"
            });


    } else {

        alert(
            target.username +
            " is NOT the Wolf."
        );

    }


    document
        .getElementById(
            "targetPanel"
        )
        .classList.add(
            "hidden"
        );

}


/* ==========================================
   MEETING
   ========================================== */

async function callMeeting() {

    const snapshot =
        await database
            .ref(
                "rooms/" +
                currentRoom +
                "/players/" +
                currentUser.uid
            )
            .once("value");


    const player =
        snapshot.val();


    if (
        !player ||
        !player.alive
    ) {

        return;

    }


    await database
        .ref(
            "rooms/" +
            currentRoom
        )
        .update({

            status:
                "meeting",

            phase:
                "meeting",

            timer:
                30,

            votes:
                {}

        });


    await addEvent(
        currentUsername +
        " called a village meeting."
    );

}


/* ==========================================
   SHOW MEETING
   ========================================== */

function showMeeting(room) {

    document
        .getElementById(
            "meetingPanel"
        )
        .classList.remove(
            "hidden"
        );


    displayVotePlayers(room);

}


/* ==========================================
   VOTE PLAYERS
   ========================================== */

function displayVotePlayers(room) {

    const list =
        document.getElementById(
            "voteList"
        );


    list.innerHTML = "";


    Object.values(room.players)
        .filter(
            player =>
                player.alive
        )
        .forEach(
            player => {

                const div =
                    document.createElement(
                        "div"
                    );


                div.className =
                    "vote";


                div.innerHTML =
                    `<span>${player.username}</span>
                     <button onclick="votePlayer('${player.uid}')">
                     VOTE
                     </button>`;


                list.appendChild(div);

            }
        );

}


/* ==========================================
   VOTE
   ========================================== */

async function votePlayer(uid) {

    const snapshot =
        await database
            .ref(
                "rooms/" +
                currentRoom
            )
            .once("value");


    const room =
        snapshot.val();


    const me =
        room.players[
            currentUser.uid
        ];


    if (!me || !me.alive) {

        return;

    }


    await database
        .ref(
            "rooms/" +
            currentRoom +
            "/votes/" +
            currentUser.uid
        )
        .set(uid);


    await addEvent(
        currentUsername +
        " voted."
    );


    checkVotes();

}


/* ==========================================
   CHECK VOTES
   ========================================== */

async function checkVotes() {

    const snapshot =
        await database
            .ref(
                "rooms/" +
                currentRoom
            )
            .once("value");


    const room =
        snapshot.val();


    const alive =
        Object.values(
            room.players || {}
        )
        .filter(
            player =>
                player.alive
        );


    const votes =
        room.votes || {};


    if (
        Object.keys(votes).length <
        alive.length
    ) {

        return;

    }


    const counts = {};


    Object.values(votes)
        .forEach(
            uid => {

                counts[uid] =
                    (counts[uid] || 0) +
                    1;

            }
        );


    let highest = 0;
    let eliminated = null;


    Object.keys(counts)
        .forEach(
            uid => {

                if (
                    counts[uid] >
                    highest
                ) {

                    highest =
                        counts[uid];

                    eliminated =
                        uid;

                }

            }
        );


    if (!eliminated) {
        return;
    }


    const target =
        room.players[
            eliminated
        ];


    await database
        .ref(
            "rooms/" +
            currentRoom +
            "/players/" +
            eliminated +
            "/alive"
        )
        .set(false);


    await addEvent(
        target.username +
        " was voted out."
    );


    await database
        .ref(
            "rooms/" +
            currentRoom +
            "/votes"
        )
        .remove();


    await database
        .ref(
            "rooms/" +
            currentRoom
        )
        .update({

            status:
                "playing",

            phase:
                "explore",

            timer:
                60

        });


    document
        .getElementById(
            "meetingPanel"
        )
        .classList.add(
            "hidden"
        );


    checkWin();

}


/* ==========================================
   SECRET WORD
   ========================================== */

async function guessWord() {

    const input =
        document.getElementById(
            "wordGuess"
        );


    const guess =
        input.value
            .trim()
            .toUpperCase();


    if (!guess) {
        return;
    }


    const snapshot =
        await database
            .ref(
                "rooms/" +
                currentRoom
            )
            .once("value");


    const room =
        snapshot.val();


    if (
        guess ===
        room.secretWord
    ) {

        await database
            .ref(
                "rooms/" +
                currentRoom
            )
            .update({

                status:
                    "ended",

                winner:
                    "VILLAGERS"

            });


    } else {

        await addEvent(
            currentUsername +
            " guessed the secret word incorrectly."
        );


        input.value = "";

        alert(
            "Wrong secret word!"
        );

    }

}


/* ==========================================
   CHECK WIN
   ========================================== */

async function checkWin() {

    const snapshot =
        await database
            .ref(
                "rooms/" +
                currentRoom
            )
            .once("value");


    const room =
        snapshot.val();


    const players =
        Object.values(
            room.players || {}
        );


    const alive =
        players.filter(
            player =>
                player.alive
        );


    const wolves =
        alive.filter(
            player =>
                player.role === "WOLF"
        );


    const villagers =
        alive.filter(
            player =>
                player.role !== "WOLF"
        );


    if (
        wolves.length === 0
    ) {

        await database
            .ref(
                "rooms/" +
                currentRoom
            )
            .update({

                status:
                    "ended",

                winner:
                    "VILLAGERS"

            });


        return;

    }


    if (
        wolves.length >=
        villagers.length
    ) {

        await database
            .ref(
                "rooms/" +
                currentRoom
            )
            .update({

                status:
                    "ended",

                winner:
                    "WOLF"

            });

    }

}


/* ==========================================
   GAME OVER
   ========================================== */

function showGameOver(room) {

    showScreen(
        "gameOverScreen"
    );


    const title =
        document.getElementById(
            "winnerText"
        );


    const description =
        document.getElementById(
            "winnerDescription"
        );


    if (
        room.winner ===
        "VILLAGERS"
    ) {

        title.textContent =
            "VILLAGERS WIN!";


        description.textContent =
            "The village discovered the Wolf and survived.";

    }


    else if (
        room.winner ===
        "SHERIFF"
    ) {

        title.textContent =
            "SHERIFF WINS!";


        description.textContent =
            "The Sheriff successfully caught the Wolf.";

    }


    else {

        title.textContent =
            "WOLF WINS!";


        description.textContent =
            "The Wolf has taken control of the village.";

    }

}


/* ==========================================
   RETURN HOME
   ========================================== */

async function returnHome() {

    await leaveRoom();

}


/* ==========================================
   LEAVE ROOM
   ========================================== */

async function leaveRoom() {

    if (!currentRoom) {

        showScreen(
            "homeScreen"
        );

        return;

    }


    try {

        await database
            .ref(
                "rooms/" +
                currentRoom +
                "/players/" +
                currentUser.uid
            )
            .remove();

    } catch (error) {

        console.error(error);

    }


    if (roomListener) {

        roomListener.off();

        roomListener =
            null;

    }


    currentRoom =
        null;


    document
        .getElementById(
            "gameLog"
        )
        .innerHTML = "";


    document
        .getElementById(
            "clueList"
        )
        .innerHTML =
        '<p class="small">No clues discovered yet.</p>';


    showScreen(
        "homeScreen"
    );

}


/* ==========================================
   MEETING CHECK
   ========================================== */

function roomIsMeeting() {

    return false;

}