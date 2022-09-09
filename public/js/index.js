const socket = io();

// DOM Elements
const openCreateRoomBox = document.getElementById("open-create-room-box");
const openJoinRoomBox = document.getElementById("open-join-room-box");
const createRoomBox = document.getElementById("create-room-box");
const roomIdInput = document.getElementById("room-id");
const cancelCreateActionBtn = document.getElementById("cancel-create-action");
const gameplayChoices = document.getElementById("gameplay-choices");
const createRoomBtn = document.getElementById("create-room-btn");
const gameplayScreen = document.querySelector(".gameplay-screen");
const startScreen = document.querySelector(".start-screen");
const cancelJoinActionBtn = document.getElementById("cancel-join-action");
const joinBoxRoom = document.getElementById("join-room-box");
const joinRoomBtn = document.getElementById("join-room-btn");
const joinRoomInput = document.getElementById("join-room-input");
const joinRandomBtn = document.getElementById("join-random");
const errorMessage = document.getElementById("error-message");
const playerOne = document.getElementById("player-1");
const playerTwo = document.getElementById("player-2");
const waitMessage = document.getElementById("wait-message");
const rock = document.getElementById("rock");
const paper = document.getElementById("paper");
const scissor = document.getElementById("scissor");
const myScore = document.getElementById("my-score");
const enemyScore = document.getElementById("enemy-score");
const playerOneTag = document.getElementById("player-1-tag");
const playerTwoTag = document.getElementById("player-2-tag");
const winMessage = document.getElementById("win-message");
const eRock = document.getElementById("e-rock");
const ePaper = document.getElementById("e-paper");
const eScissor = document.getElementById("e-scissor");

//Game variables
let canChoose = false;
let playerOneConnected = false;
let playerTwoIsConnected = false;
let canChangePick = true;
let playerId = 0;
let myChoice = "";
let enemyChoice = "";
let roomId = "";
let myScorePoints = 0;
let enemyScorePoints = 0;

//event listeners (for stuff like clicking)
openCreateRoomBox.addEventListener("click", function(){
    gameplayChoices.style.display = "none";
    createRoomBox.style.display = "block";
});

cancelCreateActionBtn.addEventListener("click", function(){
    gameplayChoices.style.display = "block";
    createRoomBox.style.display = "none";
});

createRoomBtn.addEventListener("click", function(){
    let id = roomIdInput.value;

    //remove error message
    errorMessage.innerHTML = "";
    errorMessage.style.display = "none";

    socket.emit("create-room", id);

});

openJoinRoomBox.addEventListener("click", function(){
    gameplayChoices.style.display = "none";
    joinBoxRoom.style.display = "block";
});

cancelJoinActionBtn.addEventListener("click", function(){
    gameplayChoices.style.display = "block";
    joinBoxRoom.style.display = "none";
});

joinRoomBtn.addEventListener("click", function(){
    let id = joinRoomInput.value;

    //remove error message
    errorMessage.innerHTML = "";
    errorMessage.style.display = "none";

    socket.emit("join-room", id);
});

joinRandomBtn.addEventListener("click", function(){
    errorMessage.innerHTML = "";
    errorMessage.style.display = "none";
    socket.emit("join-random");
});

rock.addEventListener("click", function(){
    if(canChoose && myChoice === "" && playerOneConnected && playerTwoIsConnected){
        myChoice = "rock";
        choose(myChoice);
        socket.emit("make-move", {playerId, myChoice, roomId});
    }
    else if(!canChoose && myChoice === "rock" && canChangePick){
        removeChoice("rock");
        socket.emit("remove-move", {playerId, roomId});
    }
});

paper.addEventListener("click", function(){
    if(canChoose && myChoice === "" && playerOneConnected && playerTwoIsConnected){
        myChoice = "paper";
        choose(myChoice);
        socket.emit("make-move", {playerId, myChoice, roomId});
    }
    else if(!canChoose && myChoice === "paper" && canChangePick){
        removeChoice("paper");
        socket.emit("remove-move", {playerId, roomId});
    }
});

scissor.addEventListener("click", function(){
    if(canChoose && myChoice === "" && playerOneConnected && playerTwoIsConnected){
        myChoice = "scissors";
        choose(myChoice);
        socket.emit("make-move", {playerId, myChoice, roomId});
    }
    else if(!canChoose && myChoice === "scissors" && canChangePick){
        removeChoice("scissors");
        socket.emit("remove-move", {playerId, roomId});
    }
});


//Socket
socket.on("display-error", error => {
    errorMessage.style.display = "block";
    let p = document.createElement("p");
    p.innerHTML = error;
    errorMessage.appendChild(p);
});

socket.on("room-created", id => {
    playerId = 1;
    roomId = id;

    setPlayerTag(1);

    startScreen.style.display = "none";
    gameplayScreen.style.display = "block";
});

socket.on("room-joined", id => {
    playerId = 2;
    roomId = id;

    playerOneConnected = true;
    playerJoinTheGame(1);
    setPlayerTag(2);
    setWaitMessage(false);

    startScreen.style.display = "none";
    gameplayScreen.style.display = "block";
});

//sends signal to server that the first player has joined the game
socket.on("player-1-connected", () => {
    playerJoinTheGame(1);
    playerOneConnected = true;
});

socket.on("player-2-connected", () => {
    playerJoinTheGame(2);
    playerTwoIsConnected = true;
    canChoose = true;
    setWaitMessage(false);
});

socket.on("player-1-disconnected", function(){
    reset();
});

socket.on("player-2-disconnected", function(){
    canChoose = false;
    playerTwoLeftTheGame()
    setWaitMessage(true);
    enemyScorePoints = 0;
    myScorePoints = 0;
    displayScore();
});

socket.on("draw", message => {
    canChangePick = false;
    setWinningMessage(message);
});

socket.on("signal-e-choice", ([id, isFade]) => {
    if(playerId === id){
        if(isFade){
            eRock.classList.add("faded");
            ePaper.classList.add("faded");
            eScissor.classList.add("faded");
        }
        else{
            eRock.classList.remove("faded");
            ePaper.classList.remove("faded");
            eScissor.classList.remove("faded");
        }
        
    }
});

socket.on("show-e-selected", ([p1Choice, p2Choice]) => {
    if(playerId === 1){
        showEChoice(p2Choice);
    }
    else{
        showEChoice(p1Choice);
    }
});

socket.on("player-1-wins", ({myChoice, enemyChoice}) => {
    canChangePick = false;
    if(playerId === 1){
        let message = `You chose ${myChoice} and the enemy chose ${enemyChoice}. You Win!`;
        setWinningMessage(message);
        myScorePoints++;
    }
    else{
        let message = `You chose ${myChoice} and the enemy chose ${enemyChoice}. You Lose!`;
        setWinningMessage(message);
        enemyScorePoints++;
    }

    displayScore();
});

socket.on("player-2-wins", ({myChoice, enemyChoice}) => {
    canChangePick = false;
    if(playerId === 2){
        let message = `You chose ${myChoice} and the enemy chose ${enemyChoice}. You Win!`;
        setWinningMessage(message);
        myScorePoints++;
    }
    else{
        let message = `You chose ${enemyChoice} and the enemy chose ${myChoice}. You Lose!`;
        setWinningMessage(message);
        enemyScorePoints++;
    }

    displayScore();
});

//Functions
function setPlayerTag(playerId){
    if(playerId === 1){
        playerOneTag.innerText = "You (Player 1)";
        playerTwoTag.innerText = "Enemy (Player 2)";
    }
    else{
        playerOneTag.innerText = "Enemy (Player 1)";
        playerTwoTag.innerText = "You (Player 2)";
    }
}

function playerJoinTheGame(playerId){
    if(playerId === 1){
        playerOne.classList.add("connected");
    }
    else{
        playerTwo.classList.add("connected");
    }
}

function setWaitMessage(display){
    if(display){
        let p = document.createElement("p");
        p.innerText = "Waiting for another player to join..."
        waitMessage.appendChild(p);
    }
    else{
        waitMessage.innerHTML = "";
    }
}

function reset(){
    canChoose = false;
    canChangePick = true;
    playerOneConnected = false;
    playerTwoIsConnected = false;
    startScreen.style.display = "block";
    gameplayChoices.style.display = "block";
    gameplayScreen.style.display = "none";
    joinBoxRoom.style.display = "none";
    createRoomBox.style.display = "none";
    playerTwo.classList.remove("connected");
    playerOne.classList.remove("connected");
    myScorePoints = 0;
    enemyScorePoints = 0;
    displayScore();
    setWaitMessage(true);
}

function playerTwoLeftTheGame(){
    playerTwoIsConnected = false;
    playerTwo.classList.remove("connected");
}

function displayScore(){
    myScore.innerText = myScorePoints;
    enemyScore.innerText = enemyScorePoints;
}

function showEChoice(choice){
    if(choice === "rock"){
        eRock.classList.remove("faded");
        eRock.classList.add("e-selected");
    }
    else if(choice === "paper"){
        ePaper.classList.remove("faded");
        ePaper.classList.add("e-selected");
    }
    else{
        eScissor.classList.remove("faded");
        eScissor.classList.add("e-selected");
    }
}

function choose(choice){
    if(choice === "rock"){
        rock.classList.add("my-choice");
    }
    else if(choice === "paper"){
        paper.classList.add("my-choice");
    }
    else{
        scissor.classList.add("my-choice");
    }

    canChoose = false;
}

function removeChoice(choice){
    if(choice === "rock"){
        rock.classList.remove("my-choice");
    }
    else if(choice === "paper"){
        paper.classList.remove("my-choice");
    }
    else{
        scissor.classList.remove("my-choice");
    }

    canChoose = true;
    myChoice = "";
}

function removeFade(){
    if (eRock.classList.contains("e-selected")){
        eRock.classList.remove("e-selected");
        ePaper.classList.remove("faded");
        eScissor.classList.remove("faded");
    }
    else if (ePaper.classList.contains("e-selected")){
        eRock.classList.remove("faded");
        ePaper.classList.remove("e-selected");
        eScissor.classList.remove("faded");
    }
    else {
        eRock.classList.remove("faded");
        ePaper.classList.remove("faded");
        eScissor.classList.remove("e-selected");
    }
}

function setWinningMessage(message){
    let p = document.createElement("p");
    p.innerText = message;

    winMessage.appendChild(p);

    setTimeout(() => {
        canChangePick = true;
        removeChoice(myChoice);
        removeFade();
        winMessage.innerHTML = "";
    }, 2500);
}