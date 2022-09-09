//coming from https://www.youtube.com/watch?v=q7xw9K6ah1c&list=PLhbZWg5iN5xUVrNZh3Jwou19lnnqCHczK&index=4

//requiring stuff / importing
const express = require("express");
const http = require("http");
const path = require("path");
const socketio = require("socket.io");

const app = express();

//create server with http
const server = http.createServer(app);

//import modules from other js files
const {userConnected, connectedUsers, initializeChoices, moves, makeMove, removeMove, choices} = require("./util/users");
const {createRoom, joinRoom, exitRoom, rooms} = require("./util/rooms");

//app is making some dir name public
app.use(express.static(path.join(__dirname, "public")));

const io = socketio(server);

io.on("connection", socket =>{
    //on create a room
    socket.on("create-room", (roomId) => {
        //if room already exists
        if(rooms[roomId]){
            //throw an error since this room already exists
            const error = "This room already exists";
            socket.emit("display-error", error);
        }
        //otherwise, room does not exist
        else{
            //create the room and connect the current user
            userConnected(socket.client.id);
            createRoom(roomId, socket.client.id);
            socket.emit("room-created", roomId);
            socket.emit("player-1-connected");
            socket.join(roomId);
        }
    });

    //on joining a room
    socket.on("join-room", roomId => {
        //if the room does not exist
        if(!rooms[roomId]){
            //throw an error since it doesn't exist
            const error = "This room doesn't exist";
            socket.emit("display-error", error);
        }
        else{
            //join the room that is currently there
            userConnected(socket.client.id);
            joinRoom(roomId, socket.client.id);
            socket.join(roomId);

            socket.emit("room-joined", roomId);
            socket.emit("player-2-connected");
            socket.broadcast.to(roomId).emit("player-2-connected");
            initializeChoices(roomId);
            
        }
    });

    //on trying to join a random room
    socket.on("join-random", () => {
        let roomId = "";

        //loop through all current rooms
        for(let id in rooms){
            if(rooms[id][1] === ""){
                roomId = id;
                break;
            }
        }

        //if no room id found
        if(roomId === ""){
            //throw an error stating there were no rooms available
            const error = "All rooms are full or none exist";
            socket.emit("display-error", error);
        }
        else{
            //join the randomly selected room
            userConnected(socket.client.id);
            joinRoom(roomId, socket.client.id);
            socket.join(roomId);

            socket.emit("room-joined", roomId);
            socket.emit("player-2-connected");
            socket.broadcast.to(roomId).emit("player-2-connected");
            initializeChoices(roomId);
        }
    });

    socket.on("signal-choice", (playerId, highlighted) => {
        if(playerId === 1){
            io.to(roomId).emit("signal-e-choice", (2, highlighted));
        }
        else{
            io.to(roomId).emit("signal-e-choice", (1, highlighted));
        }
        
    });

    socket.on("remove-move", ({playerId, roomId}) => {
        removeMove(roomId, playerId);

        if(playerId === 1){
            io.to(roomId).emit("signal-e-choice", ([2, false]));
        }
        else{
            io.to(roomId).emit("signal-e-choice", ([1, false]));
        }
    });

    //on making a move
    socket.on("make-move", ({playerId, myChoice, roomId}) => {
        //call make a move function
        makeMove(roomId, playerId, myChoice);

        //show to the enemy player that we have made a choice
        if(playerId === 1){
            io.to(roomId).emit("signal-e-choice", ([2, true]));
        }
        else{
            io.to(roomId).emit("signal-e-choice", ([1, true]));
        }

        //if these two choices are not empty
        if(choices[roomId][0] !== "" && choices[roomId][1] !== ""){
            //get the choices from both players
            let playerOneChoice = choices[roomId][0];
            let playerTwoChoice = choices[roomId][1];

            io.to(roomId).emit("show-e-selected", ([playerOneChoice, playerTwoChoice]));

            //if the two choices are equal
            if(playerOneChoice === playerTwoChoice){
                let message = "Both of you chose " + playerOneChoice + ". The match is a Draw.";
                //to all in the room except the sender, draw
                io.to(roomId).emit("draw", message);
            }
            //player 1 wins
            else if(moves[playerOneChoice] === playerTwoChoice){
                let enemyChoice = "";

                if(playerId === 1){
                    enemyChoice = playerTwoChoice;
                }
                else{
                    enemyChoice = playerOneChoice;
                }

                //broadcast player 1's victory
                io.to(roomId).emit("player-1-wins", {myChoice, enemyChoice});
            }
            else{
                let enemyChoice = "";

                if(playerId === 1){
                    enemyChoice = playerTwoChoice;
                }
                else{
                    enemyChoice = playerOneChoice;
                }

                //broadcast player 2's victory
                io.to(roomId).emit("player-2-wins", {myChoice, enemyChoice});
            }

            choices[roomId] = ["", ""];
        }
    });

    socket.on("disconnect", () => {
        if(connectedUsers[socket.client.id]){
            let player;
            let roomId;

            for(let id in rooms){
                if(rooms[id][0] === socket.client.id || rooms[id][1] === socket.client.id){
                    if(rooms[id][0] === socket.client.id){
                        player = 1;
                    }
                    else{
                        player = 2;
                    }

                    roomId = id;
                    break;
                }
            }

            exitRoom(roomId, player);

            if(player === 1){
                io.to(roomId).emit("player-1-disconnected")
            }
            else{
                io.to(roomId).emit("player-2-disconnected")
            }
        }
    });
})

server.listen(process.env.PORT || 5000, () => console.log("Server started on port 5000..."));