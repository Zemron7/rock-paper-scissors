const connectedUsers = {};
const choices = {};
const moves = {
    "rock" : "scissors",
    "paper" : "rock",
    "scissors" : "paper"
};

const initializeChoices = (roomId) => {
    choices[roomId] = ["", ""]
}

const userConnected = (userId) => {
    connectedUsers[userId] = true;
}

const makeMove = (roomId, player, choice) => {
    if(choices[roomId]){
        choices[roomId][player - 1] = choice;
    }
}

const removeMove = (roomId, player) => {
    if(choices[roomId]){
        choices[roomId][player - 1] = "";
    }
}

module.exports = {connectedUsers, initializeChoices, userConnected, makeMove, removeMove, moves, choices};