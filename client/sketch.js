let size;
let pieces = [];
let whiteStartingPosition = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR"; // rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR
let blackStartingPosition = "RNBQKBNR/PPPPPPPP/8/8/8/8/pppppppp/rnbqkbnr";
let startingPosition = whiteStartingPosition;
let board;
let Piece;
let mousePositionOnClick = new Array(2).fill(0);
let clickedPieceIndex = new Array(2).fill(-1);
let imageSetting;
let character;
let Player = {
  WHITE: "white",
  BLACK: "black"
};
let gameInfo;

// connectivity
let port = 19280;
let socket = io(`http://localhost:${port}`);
// determine player color
socket.on('startMatch', (data) => {
  gameInfo = data;

  if (socket.id == gameInfo.white) {
    character = Player.WHITE;
    applyBoardNotation(whiteStartingPosition);
  } else {
    character = Player.BLACK;
    applyBoardNotation(blackStartingPosition);
  }

  console.log("you are playing as " + character);
});

socket.on('chessMove', (data) => {
  if (data.move != null)
    board = parseMoveToBoard(data.move);
  gameInfo = data.game;
})

function preload() {
  // load white pieces
  pieces.push(loadImage("https://i.imgur.com/5aAQo9B.png")); // pawn
  pieces.push(loadImage("https://i.imgur.com/Ogp0HUg.png")); // bishop
  pieces.push(loadImage("https://i.imgur.com/oNQGgMN.png")); // knight
  pieces.push(loadImage("https://i.imgur.com/AGjBZ8z.png")); // rook
  pieces.push(loadImage("https://i.imgur.com/aEHn0os.png")); // queen
  pieces.push(loadImage("https://i.imgur.com/8kjIzyd.png")); // king
  
  // load black pieces
  pieces.push(loadImage("https://i.imgur.com/IUHGYCI.png")); // pawn
  pieces.push(loadImage("https://i.imgur.com/yE35P0i.png")); // bishop
  pieces.push(loadImage("https://i.imgur.com/qicpw7C.png")); // knight
  pieces.push(loadImage("https://i.imgur.com/p9JXeQp.png")); // rook
  pieces.push(loadImage("https://i.imgur.com/rR3SSLj.png")); // queen
  pieces.push(loadImage("https://i.imgur.com/IDq7IiT.png")); // king
}

function setup() {
  size = windowHeight - 40;
  createCanvas(size, size);

  Piece = {
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
  imageSetting = {
    centered: "Centered",
    mousePoint: "Mouse Point"
  };
  applyBoardNotation(startingPosition);
}

function draw() {
  background('#769656');

  // draw board
  fill('#eeeed2');
  rectMode(CORNER);
  noStroke();

  for(let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      let x = i; if (j % 2 == 1) x -= 1;
      if (i % 2 == 1) {
        rect(x * (size / 8), j * (size / 8), size / 8);
      }
    }
  }

  // display pieces on board
  displayPieces(board);

  // dragging pieces
  if (mouseIsPressed) {
    if (mousePositionOnClick[0] != 0 && mousePositionOnClick[1] != 0 && clickedPieceIndex[0] != -1) {
      displayPiece(board[clickedPieceIndex[1]][clickedPieceIndex[0]], mouseX, mouseY, imageSetting.mousePoint);
    }
  }
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

function displayPiece(piece, posX, posY, setting) {
  if (piece == -1)
    return;

  imageMode(CENTER);
  let x; let y;

  if (setting == imageSetting.centered) {
    x = posX * (size / 8) + (size / 16);
    y = posY * (size / 8) + (size / 16);
  } else if (setting == imageSetting.mousePoint) {
    x = posX; y = posY;
  }

  image(pieces[piece], x, y, size / 8 - 5, size / 8 - 5);
}

function displayPieces(matrix) {
  for (let i = 0; i < matrix.length; i++) {
    for (let j = 0; j < matrix[i].length; j++) {
      if (i == clickedPieceIndex[0] && j == clickedPieceIndex[1]) { // ignore dragged piece
        continue;
      }
      displayPiece(matrix[j][i], i, j, imageSetting.centered);
    }
  }
}

function applyBoardNotation(fen) {
  board = fenToMatrix(fen);
}

function verifyBoundaries() {
  return !(mouseX < 0 || mouseX > size || mouseY < 0 || mouseY > size);
}

function getIndexOnMouse() {
  let x = Math.floor(mouseX / (size / 8));
  let y = Math.floor(mouseY / (size / 8));

  return [x, y];
}

function mousePressed() {
  // check boundaries
  if (!verifyBoundaries())
    return;

  let indexX = getIndexOnMouse()[0]; let indexY = getIndexOnMouse()[1];

  // get clicked piece information (piece, pos)
  if (board[indexY][indexX] != -1) {
    mousePositionOnClick[0] = mouseX; mousePositionOnClick[1] = mouseY;
    clickedPieceIndex[0] = indexX; clickedPieceIndex[1] = indexY;
  }
}

function mouseReleased() {
  let piece;
  if (clickedPieceIndex[0] != -1) {
    piece = board[clickedPieceIndex[1]][clickedPieceIndex[0]];
    let pos = [getIndexOnMouse()[1], getIndexOnMouse()[0]];
    
    requestMove(piece, clickedPieceIndex, pos);
  }

  // reset variables
  clickedPieceIndex.fill(-1);
}

function moveToStr(piece, oldIndex, newIndex) {
  let move = "";
  move += piece.toString() + "/" + oldIndex[1].toString() + "/" + oldIndex[0].toString() + "/";
  if (board[newIndex[0]][newIndex[1]] != -1)
    move += 'x' + "/" + board[newIndex[0]][newIndex[1]].toString() + "/";
  else 
    move += '-' + "/";
  move += newIndex[0].toString() + "/" + newIndex[1].toString();

  return move;
}

function requestMove(piece, oldIndex, newIndex) {
  // save move as phrase
  let move = moveToStr(piece, oldIndex, newIndex);
  console.log(move);
  // report to server
  socket.emit('requestMove', move);
}

function pieceIsOfColor(piece, color) {
  return piece < 6 && color == Player.WHITE;
}

function ArrayContainsList(array, list) {
  for (let i = 0; i < array.length; i++) {
    if (array[i][0] == list[0] && array[i][1] == list[1])
      return true;
  }
  return false;
}

function parseMoveToBoard(move) {
  /* move example
{
  piece: 0,
  oldIndex: [ 6, 4 ],
  newIndex: [ 4, 4 ],
  eatMove: false,
  eatenPiece: -1
}
  */

  let matrix = board;
  matrix[move.oldIndex[0]][move.oldIndex[1]] = -1;
  matrix[move.newIndex[0]][move.newIndex[1]] = move.piece;

  return matrix;
}