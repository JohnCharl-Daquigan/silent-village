/* =====================================================
   SILENT VILLAGE
   ONLINE MULTIPLAYER
   3 - 20 PLAYERS
   ===================================================== */


/* ================= GAME DATA ================= */

const secretWords = [

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


const clueDatabase = {

    house: [
        "Someone lives here.",
        "It has walls.",
        "It provides shelter."
    ],

    forest: [
        "It contains trees.",
        "Animals may live here.",
        "It is outside the village."
    ],

    church: [
        "People gather here.",
        "There is usually a bell.",
        "It is an old building."
    ],

    market: [
        "People buy things here.",
        "There are many goods.",
        "Villagers visit this place."
    ],

    barn: [
        "Animals may stay here.",
        "It is usually made of wood.",
        "It is used for storage."
    ],

    river: [
        "Water flows here.",
        "It can be found outside.",
        "Fish may live here."
    ]

};


/* ================= VARIABLES ================= */

let currentUser = null;

let currentUsername = null;

let currentRoom = null;

let roomListener = null;

let timerInterval = null;

let clues = [];


/* ================= SCREEN ================= */

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


/* ================= SIGN UP ================= */

function showSignup() {

    showScreen("signupScreen");

}


function showLogin() {

    showScreen("loginScreen");

}


async function signup() {

    const username =
        document
            .getElementById("signupUsername")
            .value
            .trim();

    const email =
        document
            .getElementById("signupEmail")
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
        document.getElementById(
            "signupMessage"
        );


    if (
        !username ||
        !email ||
        !password
    ) {

        message.textContent =
            "Complete all fields.";

        return;

    }


    if (
        password !==
        confirm
    ) {

        message.textContent =
            "Passwords do not match.";

        return;

    }


    if (
        password.length <
        6
    ) {

        message.textContent =
            "Password must be at least 6 characters.";

        return;

    }


    try {

        const result =
            await auth.createUserWithEmailAndPassword(
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

                email: email

            });


        message.style.color =
            "#2ecc71";

        message.textContent =
            "Account created!";


        setTimeout(
            showLogin,
            1000
        );


    } catch (error) {

        message.textContent =
            error.message;

    }

}


/* ================= LOGIN ================= */

async function login() {

    const email =
        document
            .getElementById("loginEmail")
            .value
            .trim();

    const password =
        document
            .getElementById("loginPassword")
            .value;

    const message =
        document.getElementById(
            "loginMessage"
        );


    try {

        await auth
            .signInWithEmailAndPassword(
                email,
                password
            );


    } catch (error) {

        message.textContent =
            error.message;

    }

}


/* ================= LOGOUT ================= */

async function logout() {

    if (currentRoom) {

        await leaveRoom();

    }


    await auth.signOut();

}


/* ================= AUTH STATE ================= */

auth.onAuthStateChanged(
    async user => {

        if (!user) {

            currentUser =
                null;

            currentUsername =
                null;

            showScreen(
                "loginScreen"
            );

            return;

        }


        currentUser =
            user;


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
            user.email;


        document
            .getElementById(
                "currentUsername"
            )
            .textContent =
            currentUsername;


        showScreen(
            "homeScreen"
        );

    }
);


/* ================= ROOM CODE ================= */

function generateRoomCode() {

    const characters =
        "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    let code = "";


    for (
        let i = 0;
        i < 5;
        i++
    ) {

        code +=
            characters[
                Math.floor(
                    Math.random() *
                    characters.length
                )
            ];

    }


    return code;

}


/* ================= CREATE ROOM ================= */

async function createRoom() {

    let code =
        generateRoomCode();


    let snapshot =
        await database
            .ref(
                "rooms/" +
                code
            )
            .once("value");


    while (
        snapshot.exists()
    ) {

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


    currentRoom =
        code;


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


    await addPlayer(
        code
    );


    listenToRoom();


    showScreen(
        "lobbyScreen"
    );

}


/* ================= JOIN ROOM ================= */

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
        document.getElementById(
            "roomMessage"
        );


    if (!input) {

        message.textContent =
            "Enter a room code.";

        return;

    }


    const snapshot =
        await database
            .ref(
                "rooms/" +
                input
            )
            .once("value");


    if (!snapshot.exists()) {

        message.textContent =
            "Room not found.";

        return;

    }


    const room =
        snapshot.val();


    if (
        room.status !==
        "lobby"
    ) {

        message.textContent =
            "This game has already started.";

        return;

    }


    const players =
        room.players || {};


    if (
        Object.keys(players).length >=
        20
    ) {

        message.textContent =
            "This village is full.";

        return;

    }


    currentRoom =
        input;


    await addPlayer(
        input
    );


    listenToRoom();


    showScreen(
        "lobbyScreen"
    );

}


/* ================= ADD PLAYER ================= */

async function addPlayer(code) {

    const playerRef =
        database
            .ref(
                "rooms/" +
                code +
                "/players/" +
                currentUser.uid
            );


    await playerRef.set({

        uid:
            currentUser.uid,

        username:
            currentUsername,

        alive:
            true,

        role:
            "",

        votes:
            0

    });

}


/* ================= ROOM LISTENER ================= */

function listenToRoom() {

    if (roomListener) {

        roomListener.off();

    }


    roomListener =
        database.ref(
            "rooms/" +
            currentRoom
        );


    roomListener.on(
        "value",
        snapshot => {

            const room =
                snapshot.val();


            if (!room) {

                showScreen(
                    "homeScreen"
                );

                return;

            }


            if (
                room.status ===
                "lobby"
            ) {

                showScreen(
                    "lobbyScreen"
                );


                updateLobby(
                    room
                );

            }


            if (
                room.status ===
                "playing"
            ) {

                showScreen(
                    "gameScreen"
                );


                updateGame(
                    room
                );

            }


            if (
                room.status ===
                "meeting"
            ) {

                showScreen(
                    "gameScreen"
                );


                updateGame(
                    room
                );


                showMeeting(
                    room
                );

            }


            if (
                room.status ===
                "ended"
            ) {

                showGameOver(
                    room
                );

            }

        }
    );

}


/* ================= UPDATE LOBBY ================= */

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


    list.innerHTML =
        "";


    const players =
        room.players || {};


    const playerArray =
        Object.values(
            players
        );


    playerArray.forEach(
        player => {

            const div =
                document.createElement(
                    "div"
                );


            div.className =
                "player";


            div.textContent =
                player.username;


            list.appendChild(
                div
            );

        }
    );


    document
        .getElementById(
            "playerCount"
        )
        .textContent =
        `${playerArray.length} / 20 players`;


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


/* ================= START GAME ================= */

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


    const players =
        Object.values(
            room.players || {}
        );


    if (
        players.length <
        3
    ) {

        alert(
            "At least 3 players are required."
        );

        return;

    }


    if (
        players.length >
        20
    ) {

        alert(
            "Maximum 20 players."
        );

        return;

    }


    if (
        room.host !==
        currentUser.uid
    ) {

        return;

    }


    assignRoles(
        players
    );

}


/* ================= ASSIGN ROLES ================= */

async function assignRoles(players) {

    const shuffled =
        [...players]
            .sort(
                () =>
                    Math.random() -
                    0.5
            );


    let wolfCount = 1;

    let sheriffCount = 1;


    if (
        players.length >=
        10
    ) {

        wolfCount = 2;

    }


    if (
        players.length >=
        15
    ) {

        wolfCount = 2;

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
            ] =
                role;

        }
    );


    const word =
        secretWords[
            Math.floor(
                Math.random() *
                secretWords.length
            )
        ];


    updates[
        "rooms/" +
        currentRoom +
        "/secretWord"
    ] =
        word;


    updates[
        "rooms/" +
        currentRoom +
        "/status"
    ] =
        "playing";


    updates[
        "rooms/" +
        currentRoom +
        "/phase"
    ] =
        "explore";


    updates[
        "rooms/" +
        currentRoom +
        "/timer"
    ] =
        60;


    updates[
        "rooms/" +
        currentRoom +
        "/startedAt"
    ] =
        Date.now();


    await database
        .ref()
        .update(
            updates
        );

}


/* ================= UPDATE GAME ================= */

function updateGame(room) {

    const player =
        room.players?.[
            currentUser.uid
        ];


    if (!player) {

        return;

    }


    document
        .getElementById(
            "phaseText"
        )
        .textContent =
        room.phase ===
        "meeting"
            ? "Village Meeting"
            : "Explore the village.";


    document
        .getElementById(
            "roleDisplay"
        )
        .textContent =
        player.role;


    const description =
        document.getElementById(
            "roleDescription"
        );


    const killButton =
        document.getElementById(
            "killButton"
        );


    const shootButton =
        document.getElementById(
            "shootButton"
        );


    const secretBox =
        document.getElementById(
            "secretWordBox"
        );


    killButton.classList.add(
        "hidden"
    );


    shootButton.classList.add(
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


        description.textContent =
            "Eliminate players and protect the secret word.";


        killButton.classList.remove(
            "hidden"
        );


        secretBox.classList.remove(
            "hidden"
        );


        document
            .getElementById(
                "secretWord"
            )
            .textContent =
            room.secretWord;

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


        description.textContent =
            "Find the Wolf and stop them.";


        shootButton.classList.remove(
            "hidden"
        );

    }


    else {

        document
            .getElementById(
                "roleDisplay"
            )
            .style.color =
            "#2ecc71";


        description.textContent =
            "Find clues and discover the Wolf's secret word.";

    }


    updateTimer(
        room
    );


    displayAlivePlayers(
        room
    );

}


/* ================= TIMER ================= */

function updateTimer(room) {

    const timer =
        document.getElementById(
            "timer"
        );


    timer.textContent =
        room.timer ||
        0;

}


/* ================= SEARCH ================= */

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
        player.role ===
        "WOLF"
    ) {

        addEvent(
            "The Wolf searched the " +
            location +
            "."
        );

        return;

    }


    const clues =
        clueDatabase[
            location
        ];


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
        .set(
            clue
        );


    addEvent(
        currentUsername +
        " discovered a clue."
    );


    displayClue(
        clue
    );

}


/* ================= DISPLAY CLUE ================= */

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


    list.appendChild(
        div
    );

}


/* ================= ADD EVENT ================= */

async function addEvent(message) {

    const eventId =
        Date.now();


    await database
        .ref(
            "rooms/" +
            currentRoom +
            "/events/" +
            eventId
        )
        .set({

            message:
                message,

            time:
                Date.now()

        });


    displayEvent(
        message
    );

}


function displayEvent(message) {

    const log =
        document.getElementById(
            "gameLog"
        );


    const div =
        document.createElement(
            "div"
        );


    div.className =
        "log-entry";


    div.textContent =
        message;


    log.prepend(
        div
    );

}


/* ================= WOLF KILL ================= */

async function wolfKill() {

    const roomSnapshot =
        await database
            .ref(
                "rooms/" +
                currentRoom
            )
            .once("value");


    const room =
        roomSnapshot.val();


    const wolf =
        room.players?.[
            currentUser.uid
        ];


    if (
        wolf?.role !==
        "WOLF"
    ) {

        return;

    }


    const targets =
        Object.values(
            room.players || {}
        ).filter(
            player =>
                player.alive &&
                player.role !==
                "WOLF"
        );


    if (
        targets.length ===
        0
    ) {

        return;

    }


    const target =
        targets[
            Math.floor(
                Math.random() *
                targets.length
            )
        ];


    await database
        .ref(
            "rooms/" +
            currentRoom +
            "/players/" +
            target.uid +
            "/alive"
        )
        .set(
            false
        );


    await addEvent(
        target.username +
        " disappeared from the village."
    );


    checkWin();

}


/* ================= SHERIFF ================= */

async function sheriffShoot() {

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
        room.players?.[
            currentUser.uid
        ];


    if (
        sheriff?.role !==
        "SHERIFF"
    ) {

        return;

    }


    const wolves =
        Object.values(
            room.players || {}
        ).filter(
            player =>
                player.alive &&
                player.role ===
                "WOLF"
        );


    if (
        wolves.length ===
        0
    ) {

        return;

    }


    const target =
        wolves[
            Math.floor(
                Math.random() *
                wolves.length
            )
        ];


    await database
        .ref(
            "rooms/" +
            currentRoom +
            "/players/" +
            target.uid +
            "/alive"
        )
        .set(
            false
        );


    await database
        .ref(
            "rooms/" +
            currentRoom +
            "/winner"
        )
        .set(
            "SHERIFF"
        );


    await database
        .ref(
            "rooms/" +
            currentRoom +
            "/status"
        )
        .set(
            "ended"
        );


    await addEvent(
        "The Sheriff caught the Wolf!"
    );

}


/* ================= MEETING ================= */

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
                30

        });


    await addEvent(
        currentUsername +
        " called a village meeting."
    );

}


/* ================= SHOW MEETING ================= */

function showMeeting(room) {

    document
        .getElementById(
            "meetingPanel"
        )
        .classList.remove(
            "hidden"
        );


    displayVotePlayers(
        room
    );

}


/* ================= DISPLAY VOTES ================= */

function displayVotePlayers(room) {

    const list =
        document.getElementById(
            "voteList"
        );


    list.innerHTML =
        "";


    const players =
        Object.values(
            room.players || {}
        );


    players
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
                    "vote-player";


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


                button.onclick =
                    () =>
                        votePlayer(
                            player.uid
                        );


                div.appendChild(
                    name
                );


                div.appendChild(
                    button
                );


                list.appendChild(
                    div
                );

            }
        );

}


/* ================= VOTE ================= */

async function votePlayer(uid) {

    const voteRef =
        database
            .ref(
                "rooms/" +
                currentRoom +
                "/votes/" +
                currentUser.uid
            );


    await voteRef.set(
        uid
    );


    await addEvent(
        currentUsername +
        " voted."
    );


    checkVotes();

}


/* ================= CHECK VOTES ================= */

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


    const alivePlayers =
        Object.values(
            room.players || {}
        ).filter(
            player =>
                player.alive
        );


    const votes =
        room.votes || {};


    if (
        Object.keys(votes).length <
        alivePlayers.length
    ) {

        return;

    }


    const counts = {};


    Object.values(
        votes
    ).forEach(
        uid => {

            counts[uid] =
                (counts[uid] || 0) +
                1;

        }
    );


    let highest =
        0;


    let eliminated =
        null;


    Object.keys(
        counts
    ).forEach(
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


    await database
        .ref(
            "rooms/" +
            currentRoom +
            "/players/" +
            eliminated +
            "/alive"
        )
        .set(
            false
        );


    const eliminatedPlayer =
        room.players[
            eliminated
        ];


    await addEvent(
        eliminatedPlayer.username +
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


    checkWin();

}


/* ================= WORD GUESS ================= */

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

    }

    else {

        await addEvent(
            currentUsername +
            " made a wrong guess."
        );

        input.value =
            "";

    }

}


/* ================= CHECK WIN ================= */

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
                player.role ===
                "WOLF"
        );


    const villagers =
        alive.filter(
            player =>
                player.role !==
                "WOLF"
        );


    if (
        wolves.length ===
        0
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


/* ================= GAME OVER ================= */

function showGameOver(room) {

    clearInterval(
        timerInterval
    );


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
            "The village discovered the Wolf's secret.";

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


/* ================= RETURN HOME ================= */

async function returnHome() {

    if (currentRoom) {

        await leaveRoom();

    }


    document
        .getElementById(
            "gameLog"
        )
        .innerHTML =
        "";


    document
        .getElementById(
            "clueList"
        )
        .innerHTML =
        "<p>No clues yet.</p>";


    showScreen(
        "homeScreen"
    );

}


/* ================= LEAVE ROOM ================= */

async function leaveRoom() {

    if (!currentRoom) {

        showScreen(
            "homeScreen"
        );

        return;

    }


    await database
        .ref(
            "rooms/" +
            currentRoom +
            "/players/" +
            currentUser.uid
        )
        .remove();


    if (roomListener) {

        roomListener.off();

        roomListener =
            null;

    }


    currentRoom =
        null;


    showScreen(
        "homeScreen"
    );

}


/* ================= INITIALIZE ================= */

document
    .getElementById(
        "meetingPanel"
    )
    .classList.add(
        "hidden"
    );