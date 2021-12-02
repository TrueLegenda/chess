class gameManager {
  constructor (white, black, turn, moves) {
      this.white = white;
      this.black = black;
      this.turn = turn;
      this.moves = moves;
      this.min = {
        white: this.white.id,
        black: this.black.id,
        turn: this.turn,
        moves: this.moves
      };
  }

  startMatch() {
    this.white.emit('startMatch', this.min);
    this.black.emit('startMatch', this.min);
  }

  getCurrentTurn() {
    if (turn % 2 != -1)
      return "white";
    return "black";
  }

  getOpponent(player) {
    if (player == this.white)
      return this.black;
    return this.white;
  }

  verifyMove(socket, move, board) {
    // PLAYER IS WHITE
    if (socket == this.white) {
      if (this.turn % 2 == 0) // if turn is not white
        return false;

      
    }
  }
}

const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const io = require('socket.io')(server, {
    cors: {
      origin: '*',
    }
  });
let port = 19280;
let connections = [];
let queue = [];
let games = [];

io.on('connection', (socket) => {
    console.log('new connection: ' + socket.id);
    connections.push(socket);
    
    // handle matchmaking
    if (queue.length > 0) {
      // create a new game
      let player2 = queue.pop();

      // GAME MANAGER METHOD
      game = new gameManager(socket, player2, 1, []);
      games.push(game);
      game.startMatch();
    } else {
      queue.push(socket);
    }

    socket.on('disconnect', function() {
      for (let game in games) {
        if (socket.id == game.white || socket.id == game.black) {
          games = games.filter(x => game != x);
        }
      }

      connections = connections.filter(x => socket != x);
      queue = queue.filter(x => socket != x);
    });

    socket.on('requestMove', function(data) {
      for (let i = 0; i < games.length; i++) {
        if (games[i].white.id == socket.id || games[i].black.id == socket.id) {
          let game = games[i];
          let opponent = game.getOpponent(socket);
          if (game.verifyMove(socket, data.move, data.board)) { // verify move legality

          }
        }
      }
    })
});

function getSocketById(id, conns) {
  for (let i = 0; i < conns.length; i++) {
    if (conns[i].id == id)
      return conns[i];
  }

  return null;
}

server.listen(port, () => {
    console.log(`listening on *:${port}`);
});