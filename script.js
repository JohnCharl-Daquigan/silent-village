/* =====================================================
   SILENT VILLAGE
   Minimum Players: 3
   Maximum Players: 20
   ===================================================== */


/* ================= ACCOUNT SYSTEM ================= */

let accounts =
    JSON.parse(
        localStorage.getItem(
            "silentVillageAccounts"
        )
    ) || {};

let currentUser =
    localStorage.getItem(
        "silentVillageCurrentUser"
    );


function saveAccounts() {

    localStorage.setItem(
        "silentVillageAccounts",
        JSON.stringify(accounts)
    );

}


/* ================= SCREEN SYSTEM ================= */

function hideAllScreens() {

    document
        .querySelectorAll(".screen")
        .forEach(screen => {

            screen.classList.add("hidden");

        });

}


function showScreen(id) {

    hideAllScreens();

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
        document.getElementById(
            "signupMessage"
        );


    if (!username || !password) {

        message.textContent =
            "Please complete all fields.";

        return;

    }


    if (password !== confirm) {

        message.textContent =
            "Passwords do not match.";

        return;

    }


    if (password.length < 6) {

        message.textContent =
            "Password must be at least 6 characters.";

        return;

    }


    if (accounts[username]) {

        message.textContent =
            "Username already exists.";

        return;

    }


    accounts[username] = {

        username: username,

        password: password

    };


    saveAccounts();


    message.style.color =
        "#2ecc71";

    message.textContent =
        "Account created successfully!";


    setTimeout(() => {

        showLogin();

    }, 1000);

}


/* ================= LOGIN ================= */

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
        document.getElementById(
            "loginMessage"
        );


    if (!accounts[username]) {

        message.textContent =
            "Account not found.";

        return;

    }


    if (
        accounts[username].password !==
        password
    ) {

        message.textContent =
            "Incorrect password.";

        return;

    }


    currentUser = username;


    localStorage.setItem(
        "silentVillageCurrentUser",
        username
    );


    document
        .getElementById("currentUser")
        .textContent =
        username;


    showScreen("homeScreen");

}


/* ================= LOGOUT ================= */

function logout() {

    currentUser = null;


    localStorage.removeItem(
        "silentVillageCurrentUser"
    );


    showScreen("loginScreen");

}


/* ================= GAME VARIABLES ================= */

let room = null;

let gameStarted = false;

let myRole = null;

let secretWord = null;

let clues = [];

let players = [];

let timerValue = 60;

let timerInterval = null;


/* ================= SECRET WORDS ================= */

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


/* ================= CLUES ================= */

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


/* ================= CREATE ROOM ================= */

function createRoom() {

    room =
        Math.random()
            .toString(36)
            .substring(2, 7)
            .toUpperCase();


    players = [

        {

            name: currentUser,

            alive: true,

            votes: 0

        }

    ];


    document
        .getElementById(
            "displayRoomCode"
        )
        .textContent =
        room;


    updatePlayerList();


    showScreen(
        "lobbyScreen"
    );

}


/* ================= JOIN ROOM ================= */

function joinRoom() {

    const input =
        document
            .getElementById(
                "roomCode"
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


    room = input;


    players = [

        {

            name: currentUser,

            alive: true,

            votes: 0

        }

    ];


    document
        .getElementById(
            "displayRoomCode"
        )
        .textContent =
        room;


    updatePlayerList();


    showScreen(
        "lobbyScreen"
    );

}


/* ================= PLAYER LIST ================= */

function updatePlayerList() {

    const list =
        document.getElementById(
            "playerList"
        );


    list.innerHTML = "";


    players.forEach(player => {

        const div =
            document.createElement(
                "div"
            );


        div.className =
            "player";


        div.textContent =
            player.name;


        list.appendChild(div);

    });


    document
        .getElementById(
            "playerCount"
        )
        .textContent =
        `${players.length} / 20 players`;

}


/* ================= START GAME ================= */

function startGame() {

    if (players.length < 3) {

        alert(
            "At least 3 players are required to start the game."
        );

        return;

    }


    startGameLogic();

}


/* ================= START GAME LOGIC ================= */

function startGameLogic() {

    gameStarted = true;


    assignRoles();


    secretWord =
        secretWords[
            Math.floor(
                Math.random() *
                secretWords.length
            )
        ];


    clues = [];


    showScreen(
        "gameScreen"
    );


    updateRoleUI();


    addLog(
        "The game has begun. Find the Wolf!"
    );


    startTimer();

}


/* ================= ROLE ASSIGNMENT ================= */

function assignRoles() {

    const random =
        Math.random();


    if (random < 0.20) {

        myRole =
            "WOLF";

    }

    else if (random < 0.40) {

        myRole =
            "SHERIFF";

    }

    else {

        myRole =
            "VILLAGER";

    }

}


/* ================= ROLE UI ================= */

function updateRoleUI() {

    const roleDisplay =
        document.getElementById(
            "roleDisplay"
        );


    const roleDescription =
        document.getElementById(
            "roleDescription"
        );


    roleDisplay.textContent =
        myRole;


    if (
        myRole ===
        "WOLF"
    ) {

        roleDisplay.style.color =
            "#e74c3c";


        roleDescription.textContent =
            "Eliminate players and protect your secret word.";


        document
            .getElementById(
                "secretWordBox"
            )
            .classList.remove(
                "hidden"
            );


        document
            .getElementById(
                "secretWord"
            )
            .textContent =
            secretWord;


        document
            .getElementById(
                "wolfKillButton"
            )
            .classList.remove(
                "hidden"
            );

    }


    else if (
        myRole ===
        "SHERIFF"
    ) {

        roleDisplay.style.color =
            "#3498db";


        roleDescription.textContent =
            "Find the Wolf and shoot them if you catch them killing.";


        document
            .getElementById(
                "sheriffButton"
            )
            .classList.remove(
                "hidden"
            );

    }


    else {

        roleDisplay.style.color =
            "#2ecc71";


        roleDescription.textContent =
            "Search for clues and discover the Wolf's secret word.";

    }

}


/* ================= SEARCH LOCATION ================= */

function searchLocation(location) {

    if (
        myRole ===
        "WOLF"
    ) {

        addLog(
            "You searched the " +
            location +
            "."
        );

        return;

    }


    const locationClues =
        clueDatabase[
            location
        ];


    if (!locationClues) {

        return;

    }


    const clue =
        locationClues[
            Math.floor(
                Math.random() *
                locationClues.length
            )
        ];


    if (
        !clues.includes(clue)
    ) {

        clues.push(clue);


        displayClues();


        addLog(
            "You discovered a clue at the " +
            location +
            "."
        );

    }

    else {

        addLog(
            "You found nothing new at the " +
            location +
            "."
        );

    }

}


/* ================= DISPLAY CLUES ================= */

function displayClues() {

    const list =
        document.getElementById(
            "clueList"
        );


    list.innerHTML = "";


    if (
        clues.length ===
        0
    ) {

        list.innerHTML =
            "<p>No clues discovered yet.</p>";

        return;

    }


    clues.forEach(clue => {

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

    });

}


/* ================= WOLF KILL ================= */

function wolfKill() {

    if (
        myRole !==
        "WOLF"
    ) {

        return;

    }


    const alivePlayers =
        players.filter(
            player =>
                player.alive &&
                player.name !==
                currentUser
        );


    if (
        alivePlayers.length ===
        0
    ) {

        addLog(
            "There are no players left to eliminate."
        );

        return;

    }


    const target =
        alivePlayers[
            Math.floor(
                Math.random() *
                alivePlayers.length
            )
        ];


    target.alive =
        false;


    addLog(
        target.name +
        " has been eliminated."
    );


    checkWolfWin();

}


/* ================= SHERIFF SHOOT ================= */

function sheriffShoot() {

    if (
        myRole !==
        "SHERIFF"
    ) {

        return;

    }


    const result =
        Math.random();


    if (
        result < 0.5
    ) {

        addLog(
            "The Sheriff shot the Wolf!"
        );


        endGame(

            "SHERIFF WINS!",

            "The Sheriff successfully caught the Wolf."

        );

    }

    else {

        addLog(
            "The Sheriff missed!"
        );

    }

}


/* ================= MEETING ================= */

function startMeeting() {

    document
        .getElementById(
            "meetingPanel"
        )
        .classList.remove(
            "hidden"
        );


    document
        .getElementById(
            "phaseText"
        )
        .textContent =
        "Village Meeting";


    addLog(
        "A village meeting has started."
    );


    displayVotePlayers();

}


/* ================= VOTE PLAYERS ================= */

function displayVotePlayers() {

    const list =
        document.getElementById(
            "voteList"
        );


    list.innerHTML =
        "<h4>Players</h4>";


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
                    player.name;


                const button =
                    document.createElement(
                        "button"
                    );


                button.textContent =
                    "Vote";


                button.onclick =
                    () =>
                        votePlayer(
                            player
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

function votePlayer(player) {

    if (
        !player.alive
    ) {

        return;

    }


    player.votes =
        (player.votes || 0) +
        1;


    addLog(

        currentUser +
        " voted for " +
        player.name

    );


    const totalVotes =
        players.reduce(
            (total, player) =>

                total +
                (player.votes || 0),

            0
        );


    const aliveCount =
        players.filter(
            player =>
                player.alive
        ).length;


    if (
        totalVotes >=
        aliveCount
    ) {

        finishVoting();

    }

}


/* ================= FINISH VOTING ================= */

function finishVoting() {

    let highest =
        0;


    let selected =
        null;


    players
        .filter(
            player =>
                player.alive
        )
        .forEach(
            player => {

                if (
                    (player.votes || 0) >
                    highest
                ) {

                    highest =
                        player.votes || 0;


                    selected =
                        player;

                }

            }
        );


    if (!selected) {

        return;

    }


    selected.alive =
        false;


    addLog(

        selected.name +
        " was voted out."

    );


    /*
        If the eliminated player
        is the Wolf, villagers win.
    */


    if (
        selected.role ===
        "WOLF"
    ) {

        endGame(

            "VILLAGERS WIN!",

            "The Wolf was discovered and eliminated."

        );

        return;

    }


    checkWolfWin();

}


/* ================= GUESS SECRET WORD ================= */

function submitGuess() {

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


    addLog(

        currentUser +
        " guessed: " +
        guess

    );


    if (
        guess ===
        secretWord
    ) {

        endGame(

            "VILLAGERS WIN!",

            "The Wolf's secret word was discovered."

        );

    }

    else {

        addLog(
            "Wrong guess! The Wolf remains hidden."
        );


        input.value =
            "";

    }

}


/* ================= CHECK WOLF WIN ================= */

function checkWolfWin() {

    const alive =
        players.filter(
            player =>
                player.alive
        );


    /*
        If only one player remains,
        the Wolf wins in this prototype.
    */


    if (
        alive.length <=
        1
    ) {

        endGame(

            "WOLF WINS!",

            "The Wolf eliminated the village."

        );

    }

}


/* ================= GAME TIMER ================= */

function startTimer() {

    clearInterval(
        timerInterval
    );


    timerValue =
        60;


    document
        .getElementById(
            "timer"
        )
        .textContent =
        timerValue;


    timerInterval =
        setInterval(
            () => {

                timerValue--;


                document
                    .getElementById(
                        "timer"
                    )
                    .textContent =
                    timerValue;


                if (
                    timerValue <=
                    0
                ) {

                    clearInterval(
                        timerInterval
                    );


                    startMeeting();

                }

            },
            1000
        );

}


/* ================= GAME LOG ================= */

function addLog(message) {

    const log =
        document.getElementById(
            "gameLog"
        );


    const entry =
        document.createElement(
            "div"
        );


    entry.className =
        "log-entry";


    entry.textContent =
        message;


    log.prepend(
        entry
    );

}


/* ================= END GAME ================= */

function endGame(
    title,
    description
) {

    clearInterval(
        timerInterval
    );


    document
        .getElementById(
            "winnerText"
        )
        .textContent =
        title;


    document
        .getElementById(
            "winnerDescription"
        )
        .textContent =
        description;


    showScreen(
        "gameOverScreen"
    );

}


/* ================= RETURN HOME ================= */

function returnHome() {

    gameStarted =
        false;


    myRole =
        null;


    secretWord =
        null;


    clues =
        [];


    players =
        [];


    room =
        null;


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
        "<p>No clues discovered yet.</p>";


    showScreen(
        "homeScreen"
    );

}


/* ================= LEAVE ROOM ================= */

function leaveRoom() {

    players =
        [];


    room =
        null;


    showScreen(
        "homeScreen"
    );

}


/* ================= AUTO LOGIN ================= */

window.addEventListener(
    "load",
    () => {

        if (currentUser) {

            document
                .getElementById(
                    "currentUser"
                )
                .textContent =
                currentUser;


            showScreen(
                "homeScreen"
            );

        }

        else {

            showScreen(
                "loginScreen"
            );

        }

    }
);