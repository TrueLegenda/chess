class gameManager {
  constructor (white, black, turn, moves) {
      this.white = white;
      this.black = black;
      this.turn = turn;
      this.moves = moves;
      this.board = [];
      this.castlingConditions = {
        whiteConditions: {
          kingMoved: false,
          rookMoved: false
        },
        blackConditions: {
          kingMoved: false,
          rookMoved: false
        }
      };
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
      
      // verify piece location 
      if (this.board[move.oldIndex[0]][move.oldIndex[1]] != move.piece) {
        return false;
      }

      if (getPieceColor(move.piece) != 'white')
        return false;

        // PAWN
      if (move.piece == Piece.P) {
        availableMoves = this.getPawnMoves(move.piece, move.oldIndex);
        if (arrayContainsList(availableMoves, move.newIndex)) {
          return true;
        }
      }
    }
    // PLAYER IS BLACK
    else {
      if (this.turn % 2 != 0) {// if turn is not black
        return false;
      }
      // verify piece location 
      if (this.board.slice().reverse()[move.oldIndex[0]][move.oldIndex[1]] != move.piece) {
        return false;
      }

      if (getPieceColor(move.piece) != 'black')
        return false;

      // PAWN
      if (move.piece == Piece.p) { 
        availableMoves = this.getPawnMoves(move.piece, move.oldIndex);
        if (arrayContainsList(availableMoves, move.newIndex)) {
          return true;
        }
      }
    }

    // BISHOP
    if (move.piece == Piece.b || move.piece == Piece.B) {
      availableMoves = this.getBishopMoves(move.piece, move.oldIndex);
    }

    // KNIGHT
    if (move.piece == Piece.n || move.piece == Piece.N) {
      availableMoves = this.getKnightMoves(move.piece, move.oldIndex);
    }

    // ROOK
    if (move.piece == Piece.r || move.piece == Piece.R) {
      availableMoves = this.getRookMoves(move.piece, move.oldIndex);
    }

    // QUEEN
    if (move.piece == Piece.q || move.piece == Piece.Q) {
      availableMoves = this.getQueenMoves(move.piece, move.oldIndex);
    } 


    // KING
    if (move.piece == Piece.k || move.piece == Piece.K) {
      availableMoves = this.getKingMoves(move.piece, move.oldIndex);
    }
    
    if (arrayContainsList(availableMoves, move.newIndex)) {
      return true;
    }
    console.log(this.castlingConditions);
    return false;
  }

  doMove(socket, moveStr) {
    this.turn++;
    this.moves.push(moveStr);

    this.addMoveToBoard(strToMove(moveStr));

    let socketBoard = this.board.slice();

    if (socket == this.black) {
      socketBoard.reverse();
    }

    // report move
    socket.emit('chessMove', {
      board: socketBoard,
    });
    this.getOpponent(socket).emit('chessMove', {
      board: socketBoard.reverse(),
    })
  }

  addMoveToBoard(move) {
    let matrix = this.board.slice();
    if (getPieceColor(move.piece) == 'black') {
      matrix.reverse();
    }

    // CASTLING
    if (move.piece == Piece.K || move.piece == Piece.k) {
      if (move.newIndex[0] == 7 && move.newIndex[1] == 1) { // QUEENSIDE
        
        if (getPieceColor(move.piece) == 'white') {
          if (!this.castlingConditions.whiteConditions.kingMoved && !this.castlingConditions.whiteConditions.rookMoved) {
            // update variables
            this.castlingConditions.whiteConditions.kingMoved = true; this.castlingConditions.whiteConditions.rookMoved = true;

            matrix[7][0] = -1; matrix[7][4] = -1;
            matrix[7][1] = Piece.K; matrix[7][2] = Piece.R;
            this.board = matrix; return;
          }
        }
        else if (getPieceColor(move.piece) == 'black') {
          if (!this.castlingConditions.blackConditions.kingMoved && !this.castlingConditions.blackConditions.rookMoved) {
            // update variables
            this.castlingConditions.blackConditions.kingMoved = true; this.castlingConditions.blackConditions.rookMoved = true;

            matrix[7][0] = -1; matrix[7][4] = -1;
            matrix[7][1] = Piece.k; matrix[7][2] = Piece.r;
            matrix.reverse();
            this.board = matrix; return;
          }
        }
      }
      if (move.newIndex[0] == 7 && move.newIndex[1] == 6) { // KINGSIDE
        
        if (getPieceColor(move.piece) == 'white') {
          if (!this.castlingConditions.whiteConditions.kingMoved && !this.castlingConditions.whiteConditions.rookMoved) {
            // update variables
            this.castlingConditions.whiteConditions.kingMoved = true; this.castlingConditions.whiteConditions.rookMoved = true;

            matrix[7][7] = -1; matrix[7][4] = -1;
            matrix[7][6] = Piece.K; matrix[7][5] = Piece.R;
            this.board = matrix; return;
          }
        }
        else if (getPieceColor(move.piece) == 'black') {
          if (!this.castlingConditions.blackConditions.kingMoved && !this.castlingConditions.blackConditions.rookMoved) {
            // update variables
            this.castlingConditions.blackConditions.kingMoved = true; this.castlingConditions.blackConditions.rookMoved = true;

            matrix[7][7] = -1; matrix[7][4] = -1;
            matrix[7][6] = Piece.k; matrix[7][5] = Piece.r;
            matrix.reverse();
            this.board = matrix; return;
          }
        }
      }
    }

    if (move.piece == Piece.R) {
      this.castlingConditions.whiteConditions.rookMoved = true;
    } else if (move.piece == Piece.r) {
      this.castlingConditions.blackConditions.rookMoved = true;
    }
    if (move.piece == Piece.K) {
      this.castlingConditions.whiteConditions.rookMoved = true;
    } else if (move.piece == Piece.k) {
      this.castlingConditions.blackConditions.rookMoved = true;
    }

    matrix[move.oldIndex[0]][move.oldIndex[1]] = -1;
    matrix[move.newIndex[0]][move.newIndex[1]] = move.piece;

    if (getPieceColor(move.piece) == 'black') {
      matrix.reverse();
    }

    this.board = matrix;
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
    let board = this.board.slice();

    // jump 2 squares
    if (getPieceColor(piece) == 'white') {
      // if pawn hasn't been moved yet and can jump 2
      if (this.board[6][x] == Piece.P && y == 6) {
        if (this.board[y - 2][x] == -1 && this.board[y - 1][x] == -1) {
          moves.push([y - 2, x]);
        }
      }
    } else if (getPieceColor(piece) == 'black') {
      board.reverse();
      if (board[6][x] == Piece.p && y == 6) {
        if (board[y - 2][x] == -1 && board[y - 1][x] == -1) {
          moves.push([y - 2, x]);
        }
      }
    }

    // normal move
    if (board[y - 1][x] == -1) {
      moves.push([y - 1, x]);
    }

    // eat move (while checking for board borders)
    if (y > 0) {
      if (x > 0) {
        if (getPieceColor(board[y - 1][x - 1]) != getPieceColor(piece) && getPieceColor(board[y - 1][x - 1]) != null) {
          moves.push([y - 1, x - 1]);
        }
      }
      
      if (x < 7) {
        if (getPieceColor(board[y - 1][x + 1]) != getPieceColor(piece) && getPieceColor(board[y - 1][x + 1]) != null) {
          moves.push([y - 1, x + 1]);
        }
      }
    }

    return moves;
  }

  getBishopMoves(piece, index) {
    let y = index[0]; let x = index[1];
    let availableMoves = [];
    let board = this.board.slice();

    if (getPieceColor(piece) == 'black') {
      board.reverse();
    }

    // y - i | x + i
    for (let i = 1; i < 8; i++) {
      if (y - i < 0 || x + i > 7) { // stop condition (out of bounds)
        break;
      }
      if (board[y - i][x + i] == -1) {
        availableMoves.push([y - i, x + i]);
      }
      else if (getPieceColor(piece) != getPieceColor(board[y - i][x + i])) {
        availableMoves.push([y - i, x + i]);
        break;
      }
      else {
        break;
      }
    }

    // y - i | x - i
    for (let i = 1; i < 8; i++) {
      if (y - i < 0 || x - i < 0) { // stop condition (out of bounds)
        break;
      }
      if (board[y - i][x - i] == -1) {
        availableMoves.push([y - i, x - i]);
      }
      else if (getPieceColor(piece) != getPieceColor(board[y - i][x - i])) {
        availableMoves.push([y - i, x - i]);
        break;
      }
      else {
        break;
      }
    }

    // y + i | x - i
    for (let i = 1; i < 8; i++) {
      if (y + i > 7 || x - i < 0) { // stop condition (out of bounds)
        break;
      }
      if (board[y + i][x - i] == -1) {
        availableMoves.push([y + i, x - i]);
      }
      else if (getPieceColor(piece) != getPieceColor(board[y + i][x - i])) {
        availableMoves.push([y + i, x - i]);
        break;
      }
      else {
        break;
      }
    }

    // y + i | x + i
    for (let i = 1; i < 8; i++) {
      if (y + i > 7 || x + i > 7) { // stop condition (out of bounds)
        break;
      }
      if (board[y + i][x + i] == -1) {
        availableMoves.push([y + i, x + i]);
      }
      else if (getPieceColor(piece) != getPieceColor(board[y + i][x + i])) {
        availableMoves.push([y + i, x + i]);
        break;
      }
      else {
        break;
      }
    }

    return availableMoves;
  }

  getKnightMoves(piece, index) {
    let y = index[0]; let x = index[1];
    let availableMoves = [];
    let board = this.board.slice();

    if (getPieceColor(piece) == 'black') {
      board.reverse();
    }

    // up 2
    if (y - 2 >= 0) {
      // right 1
      if (x + 1 <= 7) {
        // if square is empty or contains opponent piece
        if ((board[y - 2][x + 1] != -1 && getPieceColor(piece) != getPieceColor(board[y - 2][x + 1])) || board[y - 2][x + 1] == -1) {
          availableMoves.push([y - 2, x + 1]);
        }
      }
      // left 1
      if (x - 1 >= 0) {
        // if square is empty or contains opponent piece
        if ((board[y - 2][x - 1] != -1 && getPieceColor(piece) != getPieceColor(board[y - 2][x - 1])) || board[y - 2][x - 1] == -1) {
          availableMoves.push([y - 2, x - 1]);
        }
      }
    }

    // up 1
    if (y - 1 >= 0) {
      // right 2
      if (x + 2 <= 7) {
        // if square is empty or contains opponent piece
        if ((board[y - 1][x + 2] != -1 && getPieceColor(piece) != getPieceColor(board[y - 1][x + 2])) || board[y - 1][x + 2] == -1) {
          availableMoves.push([y - 1, x + 2]);
        }
      }
      // left 2
      if (x - 2 >= 0) {
        // if square is empty or contains opponent piece
        if ((board[y - 1][x - 2] != -1 && getPieceColor(piece) != getPieceColor(board[y - 1][x - 2])) || board[y - 1][x - 2] == -1) {
          availableMoves.push([y - 1, x - 2]);
        }
      }
    }

    // down 2
    if (y + 2 <= 7) {
      // right 1
      if (x + 1 <= 7) {
        // if square is empty or contains opponent piece
        if ((board[y + 2][x + 1] != -1 && getPieceColor(piece) != getPieceColor(board[y + 2][x + 1])) || board[y + 2][x + 1] == -1) {
          availableMoves.push([y + 2, x + 1]);
        }
      }
      // left 1
      if (x - 1 >= 0) {
        // if square is empty or contains opponent piece
        if ((board[y + 2][x - 1] != -1 && getPieceColor(piece) != getPieceColor(board[y + 2][x - 1])) || board[y + 2][x - 1] == -1) {
          availableMoves.push([y + 2, x - 1]);
        }
      }
    }

    // down 1
    if (y + 1 <= 7) {
      // right 2
      if (x + 2 <= 7) {
        // if square is empty or contains opponent piece
        if ((board[y + 1][x + 2] != -1 && getPieceColor(piece) != getPieceColor(board[y + 1][x + 2])) || board[y + 1][x + 2] == -1) {
          availableMoves.push([y + 1, x + 2]);
        }
      }
      // left 2
      if (x - 2 >= 0) {
        // if square is empty or contains opponent piece
        if ((board[y + 1][x - 2] != -1 && getPieceColor(piece) != getPieceColor(board[y + 1][x - 2])) || board[y + 1][x - 2] == -1) {
          availableMoves.push([y + 1, x - 2]);
        }
      }
    }

    return availableMoves;
  }

  getRookMoves(piece, index) {
    let y = index[0]; let x = index[1];
    let availableMoves = [];
    let board = this.board.slice();

    if (getPieceColor(piece) == 'black') {
      board.reverse();
    }

    // up
    for (let i = 1; i < 8; i++) {
      if (y - i >= 0) {
        if (board[y - i][x] == -1) {
          availableMoves.push([y - i, x]);
        } else if (board[y - i][x] != -1 && getPieceColor(piece) != getPieceColor(board[y - i][x])) {
          availableMoves.push([y - i, x]);
          break;
        } else {
          break;
        }
      }
    }

    // down
    for (let i = 1; i < 8; i++) {
      if (y + i <= 7) {
        if (board[y + i][x] != -1 && getPieceColor(piece) != getPieceColor(board[y + i][x])) {
          availableMoves.push([y + i, x]);
          break;
        } else if (board[y + i][x] == -1) {
          availableMoves.push([y + i, x]);
        } else {
          break;
        }
      }
    }

    // right
    for (let i = 1; i < 8; i++) {
      if (x + i <= 7) {
        if (board[y][x + i] != -1 && getPieceColor(piece) != getPieceColor(board[y][x + i])) {
          availableMoves.push([y, x + i]);
          break;
        } else if (board[y][x + i] == -1) {
          availableMoves.push([y, x + i]);
        } else {
          break;
        }
      }
    }

    // left
    for (let i = 1; i < 8; i++) {
      if (x - i >= 0) {
        if (board[y][x - i] != -1 && getPieceColor(piece) != getPieceColor(board[y][x - i])) {
          availableMoves.push([y, x - i]);
          break;
        } else if (board[y][x - i] == -1) {
          availableMoves.push([y, x - i]);
        } else {
          break;
        }
      }
    }

    return availableMoves;
  }

  getQueenMoves(piece, index) {
    let availableMoves = [];

    availableMoves = this.getRookMoves(piece, index);
    availableMoves = availableMoves.concat(this.getBishopMoves(piece, index));

    return availableMoves;
  }

  getKingMoves(piece, index) {
    let y = index[0]; let x = index[1];
    let availableMoves = [];
    let board = this.board.slice();
    let potentialSquare = -1;

    if (getPieceColor(piece) == 'black') {
      board.reverse();
    }

    // up
    if (y - 1 >= 0) {
      potentialSquare = board[y - 1][x];
      if (potentialSquare == -1 || (potentialSquare != -1 && getPieceColor(piece) != getPieceColor(potentialSquare))) {
        availableMoves.push([y - 1, x]);
      }
      // left + up
      if (x - 1 >= 0) {
        potentialSquare = board[y - 1][x - 1];
        if (potentialSquare == -1 || (potentialSquare != -1 && getPieceColor(piece) != getPieceColor(potentialSquare))) {
          availableMoves.push([y - 1, x - 1]);
        }
      }
      // right + up
      if (x + 1 <= 7) {
        potentialSquare = board[y - 1][x + 1];
        if (potentialSquare == -1 || (potentialSquare != -1 && getPieceColor(piece) != getPieceColor(potentialSquare))) {
          availableMoves.push([y - 1, x + 1]);
        }
      }
    }
    
    // left
    if (x - 1 >= 0) {
      potentialSquare = board[y][x - 1];
      if (potentialSquare == -1 || (potentialSquare != -1 && getPieceColor(piece) != getPieceColor(potentialSquare))) {
        availableMoves.push([y, x - 1]);
      }
    }

    // right
    if (x + 1 <= 7) {
      potentialSquare = board[y][x + 1];
      if (potentialSquare == -1 || (potentialSquare != -1 && getPieceColor(piece) != getPieceColor(potentialSquare))) {
        availableMoves.push([y, x + 1]);
      }
    }

    // down
    if (y + 1 <= 7) {
      potentialSquare = board[y + 1][x];
      if (potentialSquare == -1 || (potentialSquare != -1 && getPieceColor(piece) != getPieceColor(potentialSquare))) {
        availableMoves.push([y + 1, x]);
      }
      // left + down
      if (x - 1 >= 0) {
        potentialSquare = board[y + 1][x - 1];
        if (potentialSquare == -1 || (potentialSquare != -1 && getPieceColor(piece) != getPieceColor(potentialSquare))) {
          availableMoves.push([y + 1, x - 1]);
        }
      }
      // right + down
      if (x + 1 <= 7) {
        potentialSquare = board[y + 1][x + 1];
        if (potentialSquare == -1 || (potentialSquare != -1 && getPieceColor(piece) != getPieceColor(potentialSquare))) {
          availableMoves.push([y + 1, x + 1]);
        }
      }
    }

    // castling
    // QUEEN SIDE
    if (getPieceColor(piece) == 'white') { // white
      if (!this.castlingConditions.whiteConditions.kingMoved && !this.castlingConditions.whiteConditions.rookMoved) { // if relevant pieces haven't yet moved
        if (board[y][x - 1] == -1 && board[y][x - 2] == -1 && board[y][x - 3] == -1) { // space between king and rook is clear
          availableMoves.push([7, 1]);
        }
      }
    }
    if (getPieceColor(piece) == 'black') { // black
      if (!this.castlingConditions.blackConditions.kingMoved && !this.castlingConditions.blackConditions.rookMoved) { // if relevant pieces haven't yet moved
        if (board[y][x - 1] == -1 && board[y][x - 2] == -1 && board[y][x - 3] == -1) { // space between king and rook is clear
          availableMoves.push([7, 1]);
        }
      }
    }

    // KING SIDE
    if (getPieceColor(piece) == 'white') { // black
      if (!this.castlingConditions.whiteConditions.kingMoved && !this.castlingConditions.whiteConditions.rookMoved) { // if relevant pieces haven't yet moved
        if (board[y][x + 1] == -1 && board[y][x + 2] == -1) { // space between king and rook is clear
          availableMoves.push([7, 6]);
        }
      }
    }

    if (getPieceColor(piece) == 'black') { // black
      if (!this.castlingConditions.blackConditions.kingMoved && !this.castlingConditions.blackConditions.rookMoved) { // if relevant pieces haven't yet moved
        if (board[y][x + 1] == -1 && board[y][x + 2] == -1) { // space between king and rook is clear
          availableMoves.push([7, 6]);
        }
      }
    }

    return availableMoves;
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

function getPieceColor(piece) {
  if (piece < 0)
    return null;
  else if (piece < 6)
    return 'white';
  else
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

function arrayContainsList(arr, list) {
  for (let i = 0; i < arr.length; i++) {
    if (arraysEqual(arr[i], list))
      return true;
  }

  return false;
}