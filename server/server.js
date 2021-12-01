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
      games.push({
        white: socket.id,
        black: player2.id,
        turn: 1,
        moves: []
      });

      let game = games[games.length - 1];
      startMatch(socket, player2, game);
      console.log("Match started!");
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

    socket.on('chessMove', function(move) {
      for (let i = 0; i < games.length; i++) {
        if (games[i].white == socket.id || games[i].black == socket.id) {
          let game = games[i];
          let opponent;
          // find opponent socket
          if (game.white == socket.id) {
            opponent = getSocketById(game.black, connections);
          } else {
            opponent = getSocketById(game.white, connections);
          }

          game.turn += 1;
          game.moves.push(move);

          games[i] = game;

          // emit event to opponent
          opponent.emit('chessMove', {
            move,
            game
          });
          socket.emit('chessMove', {
            move: null,
            game
          })
        }
      }
    })
});

function startMatch(white, black, gameInfo) {
  white.emit('startMatch', gameInfo);
  black.emit('startMatch', gameInfo);
}

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