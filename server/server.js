class gameManager {
  constructor (white, black, turn, moves) {
      this.white = white;
      this.black = black;
      this.turn = turn;
      this.moves = moves;
      this.board = [];
      this.whitePawnsMoved = new Array(8).fill(false);
      this.blackPawnsMoved = new Array(8).fill(false);
  }

  startMatch() {
    this.board = fenToMatrix(startingPosition);

    this.white.emit('startMatch', this.getMin());
    this.black.emit('startMatch', this.getMin());

    console.log('Starting a match!');
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

  verifyMove(socket, moveStr) {
    // variables
    let move = strToMove(moveStr);

    // no actual movement
    if (arraysEqual(move.oldIndex, move.newIndex))
      return false;

    let availableMoves = [];

    // PLAYER IS WHITE
    if (socket == this.white) {
      if (this.turn % 2 == 0) { // if turn is not white
        return false;
      }
      if (getPieceColor(move.piece) != 'white')
        return false;

      if (move.piece == 0) {
        availableMoves = this.getPawnMoves(move.piece, move.oldIndex);
        console.log(availableMoves); // TESTING PURPOSES
        if (arrayContainsList(availableMoves, move.newIndex)) {
          if (move.oldIndex[0] - move.newIndex[0] == 2) {
            this.whitePawnsMoved[move.oldIndex[1]] = true;
          }
          return true;
        }
      }

      return false;      
    }
    // PLAYER IS BLACK
    else {
      if (this.turn % 2 != 0) {// if turn is not black
        return false;
      }
      if (getPieceColor(move.piece) != 'black')
        return false;

      return true;
    }
  }

  doMove(socket, moveStr) {
    this.turn++;
    this.moves.push(moveStr);

    let socketBoard = this.board;

    if (socket == this.white) {
      socketBoard = addMoveToBoard(this.board, strToMove(moveStr));
      this.board = socketBoard;
    } else {
      socketBoard = addMoveToBoard(this.board.slice().reverse(), strToMove(moveStr));
      this.board = socketBoard.slice().reverse();
    }

    // report move
    socket.emit('chessMove', {
      board: socketBoard,
    });
    this.getOpponent(socket).emit('chessMove', {
      board: socketBoard.slice().reverse(),
    })
  }

  getMin() {
    return {
      white: this.white.id,
      black: this.black.id,
      turn: this.turn,
      moves: this.moves,
      board: this.board
    };
  }

  getPawnMoves(piece, index) {
    let y = index[0]; let x = index[1];
    let moves = [];

    if (getPieceColor(piece) == 'white') {
      // if pawn hasn't been moved yet and can jump 2
      if (!this.whitePawnsMoved[x]) {
        if (this.board[y - 2][x] == -1) {
          moves.push([y - 2, x]);
        }
      }
    } else {
      if (!this.blackPawnsMoved[x]) {
        if (this.board[y - 2][x] == -1) {
          moves.push([y - 2, x]);
        }
      }
    }

    if (this.board[y - 1][x] == -1) {
      moves.push([y - 1, x]);
    }

    return moves;
  }
}

const express = require('express');
const app = express();
const http = require('http');
const { parse } = require('path/posix');
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
let Piece = {
  P: 0,
  B: 1,
  N: 2,
  R: 3,
  Q: 4,
  K: 5,
  p: 6,
  b: 7,
  n: 8,
  r: 9,
  q: 10,
  k: 11
};
let startingPosition = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR";

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

    socket.on('requestMove', function(move) {
      // fimd relevant game
      for (let i = 0; i < games.length; i++) {
        if (games[i].white.id == socket.id || games[i].black.id == socket.id) {
          let game = games[i];
          // verify move legality
          if (game.verifyMove(socket, move)) { 
            game.doMove(socket, move);
          }
        }
      }
    })
});

server.listen(port, () => {
    console.log(`listening on *:${port}`);
});

function strToMove(str) {
  let move = {
    piece: -1,
    oldIndex: [],
    newIndex: [],
    eatMove: false,
    eatenPiece: -1
  };
   // example str = 4/7/3/x/11/0/4
  let spaces = 0;
  if (str[1] != '/') {
    move.piece = parseInt(str[0] + str[1]);
    spaces++;
  } else {
    move.piece = parseInt(str[0]);
  }
  move.oldIndex = [parseInt(str[2 + spaces]), parseInt(str[4 + spaces])];
  if (str[6 + spaces] == 'x') { // if eat move
    move.eatMove = true;
  }
  if (move.eatMove) {
    if (str[9 + spaces] != '/') {
      move.eatenPiece = parseInt(str[8 + spaces] + str[9 + spaces]);
      spaces++;
    } else {
      move.eatenPiece = parseInt(str[8 + spaces]);
    }

    move.newIndex = [parseInt(str[10 + spaces]), parseInt(str[12 + spaces])];
  } else {
    move.newIndex = [parseInt(str[8 + spaces]), parseInt(str[10 + spaces])];
  }

  return move;
}

function getFlippedMove(move) {
  move.oldIndex[0] = 7 - move.oldIndex[0];
  move.newIndex[0] = 7 - move.newIndex[0];

  return move;
}

function fenToMatrix(fen) {
  let matrix = Array(8).fill(null).map(() => Array(8).fill(0));
  let y = 0; let x = 0;

  // iterate through FEN string
  for (let i = 0; i < fen.length; i++) {
    if (fen[i] == '/') {
      y += 1; x = 0;
    } else if (/^\d+$/.test(fen[i])) { // if char is a number
      let n = parseInt(fen[i]); 
      while (n > 0) {
        matrix[y][x] = -1;
        x++;
        n--;
      }
    } else {
      for (let key in Piece) {
        if (key == fen[i]) {
          matrix[y][x] = Piece[key];
          x++;
        }
      }
    }
  }

  return matrix;
}

function addMoveToBoard(board, move) {
  let matrix = board;
  matrix[move.oldIndex[0]][move.oldIndex[1]] = -1;
  matrix[move.newIndex[0]][move.newIndex[1]] = move.piece;

  return matrix;
}

function getPieceColor(piece) {
  if (piece < 6)
    return 'white';
  
  return 'black';
}

function arraysEqual(arr1, arr2) {
  if (arr1.length != arr2.length)
    return false;

  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] != arr2[i])
      return false;
  }

  return true;
}

function arrayContainsList(arr, list) { // example input: {[0, 0], [1, 1], [2, 2]}, [1, 1]
  for (let i = 0; i < arr.length; i++) {
    if (arraysEqual(arr[i], list))
      return true;
  }

  return false;
}