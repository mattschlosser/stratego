const UP = 0;
const DOWN = 1;
const LEFT = 2;
const RIGHT = 3;

function array_2d(m, n) {
    var arr = new Array(m);
    for (var i = 0; i < arr.length; i++) {
        arr[i] = new Array(n);
    }
    return arr;
}

function dir(action) {
    switch (action) {
        case DOWN: return "DOWN";
        case UP: return "UP";
        case LEFT: return "LEFT";
        case RIGHT: return "RIGHT";
        default: throw new Error();
    }
}

function invalid_mask() {
    var invalid = new Array(10);
    for (var i = 0; i < invalid.length; i++) {
        invalid[i] = new Array(10);
        invalid[i].fill(0);
    }
    
    for (var i = 4; i < 6; i++) {
        for (var j = 2; j < 4; j++) {
            invalid[i][j] = 1;
        }
    }
    for (var i = 4; i < 6; i++) {
        for (var j = 6; j < 8; j++) {
            invalid[i][j] = 1;
        }
    }
    return invalid;
}

class Game {
    constructor() {
        this.state = array_2d(10,10);
        this.players = new Array(2);
        this.turn = 0;
        this.invalid = invalid_mask();
        this.interval;
        this.newGame();
    }
    newGame() {
        this.turn = 0;
        this.state = array_2d(10,10);
        for (var i = 0; i < this.players.length; i++) {
            this.players[i] = new Player(i);
            this.moveToBoard(this.players[i].selection, i)
        }
        var x = this;
        this.interval = setInterval(() => {this.go()}, 1);
    }
    moveToBoard(selection, p) {
        // takes a players selection, and their player #, and adds their setup to the state
        for (var i = 0+6*p; i < 4+6*p; i++) {
            for (var j = 0; j < this.state.length; j++) {
                // TODO note player 2 selection must be inverted...
                this.state[i][j] = selection[i-6*p][j]; 
                selection[i-6*p][j].x = j;
                selection[i-6*p][j].y = i;
            }
        }
    }
    go() {
        var piece, action;
        do {
            piece = this.players[this.turn].choosePiece();
            if (piece === null) {
                clearInterval(this.interval);
                var x = alert(`Player ${this.turn+1} loses. No more moves!`);
                this.newGame();
            }
            // TODO try each action before moving onto another piece
            action = Math.floor(Math.random()*4);
        } while (!this.playerCanMove(piece,action));
        this.move(piece, action);
        this.turn = (this.turn+3)%2;
    }
    playerCanMove(piece, action) {
        // checks if a move is valid
        // locate the piece in the board
        // check if action leads to an empty location, is on the board, etc
        var x, y;
        [x,y] = [piece.x, piece.y];
        // bombs and flags aren't moveable to begin with...
        if (!piece.isMovable) return false;
        var other;
        switch(action) {
            case LEFT: 
                if (x === 0) return false;
                other = this.state[y][x-1];
                if (other) {
                    if (other.player === piece.player) return false;
                } 
                if (this.invalid[y][x-1]) return false;
                break;
            case RIGHT:
                if (x === 9) return false;
                other = this.state[y][x+1];
                if (other) {
                    if (other.player === piece.player) return false;
                } 
                if (this.invalid[y][x+1]) return false;
                break;
            case UP:
                if (y === 0) return false;
                other = this.state[y-1][x];
                if (other) {
                    if (other.player === piece.player) return false;
                } 
                if (this.invalid[y-1][x]) return false;
                break;
            case DOWN:
                if (y === 9) return false;
                other = this.state[y+1][x];
                if (other) {
                    if (other.player === piece.player) return false;
                } 
                if (this.invalid[y+1][x]) return false;
                break;
            default: break;
        }
        if (other && other.known) {
            // the other value is known
            if (!piece.defeats(other, true)) {

                console.log(`Player ${this.turn+1} was going to move ` +
                            `his ${piece.name} at ${piece.x},${piece.y} ${dir(action)} but avoided doing so as he knew that ${other.x},${other.y} was a ${other.name}`)
                return false;
            }
        }
        return true;
    }
    killPiece(piece) {
        var p = piece.player;
        this.players[p].pieces.killPiece(piece);
        piece.killPiece();
    }
    move(piece, action) {
        var x, y;
        [x,y] = [piece.x, piece.y];
        switch(action) {
            case LEFT: 
                // TODO check for wins
                var other = this.state[y][x-1];
                if (!other) {
                    this.state[y][x-1] = piece;
                    piece.x = x-1;
                } else if (other.isFlag()) {
                    clearInterval(this.interval);
                    alert(`Player ${this.turn+1} wins!`);
                    this.state[y][x-1] = piece;
                    piece.x = x-1;
                } else if (piece.defeats(other)) {
                    this.state[y][x-1] = piece;
                    piece.x = x-1;
                    this.killPiece(other);
                } else if (!other.defeats(piece)) {
                    this.state[y][x-1] = null;
                    this.killPiece(other);
                    this.killPiece(piece);
                } else {
                    this.killPiece(piece);
                }
                break;
            case RIGHT:
                var other = this.state[y][x+1];
                if (!other) {
                    this.state[y][x+1] = piece;
                    piece.x = x+1;
                } else if (other.isFlag()) {
                    clearInterval(this.interval);
                    alert(`Player ${this.turn+1} wins!`);
                    this.state[y][x+1] = piece;
                    piece.x = x+1;
                } else if (piece.defeats(other)) {
                    this.state[y][x+1] = piece;
                    piece.x = x+1;
                    this.killPiece(other);
                } else if (!other.defeats(piece)) {
                    this.state[y][x+1] = null;
                    this.killPiece(other);
                    this.killPiece(piece);
                } else {
                    this.killPiece(piece);
                }
                break;
            case UP:
                var other = this.state[y-1][x];
                if (!other) {
                    this.state[y-1][x] = piece;
                    piece.y = y-1;
                } else if (other.isFlag()) {
                    clearInterval(this.interval);
                    alert(`Player ${this.turn+1} wins!`);
                    this.state[y-1][x] = piece;
                    piece.y = y-1;
                } else if (piece.defeats(other)) {
                    this.state[y-1][x] = piece;
                    piece.y = y-1;
                    this.killPiece(other);
                } else if (!other.defeats(piece)) {
                    this.state[y-1][x] = null;
                    this.killPiece(other);
                    this.killPiece(piece);
                } else {
                    this.killPiece(piece);
                }
                break;
            case DOWN:
                var other = this.state[y+1][x];
                if (!other) {
                    this.state[y+1][x] = piece;
                    piece.y = y+1;
                }  else if (other.isFlag()) {
                    clearInterval(this.interval);
                    alert(`Player ${this.turn+1} wins!`);
                    this.state[y+1][x] = piece;
                    piece.y = y+1;
                } else if (piece.defeats(other)) {
                    this.state[y+1][x] = piece;
                    piece.y = y+1;
                    this.killPiece(other);
                } else if (!other.defeats(piece)) {
                    this.state[y+1][x] = null;
                    this.killPiece(other);
                    this.killPiece(piece);
                } else {
                    this.killPiece(piece);
                }
                break;
            default: break;
        }
        this.state[y][x] = null;
        drawGame();
    }
}

class Player {
    constructor(id) {
        this.id = id;
        this.state = new Array(10);
        for (var i = 0; i < this.state.length; i++) {
            this.state[i] = new Array(10);
        }
        this.pieces = new Pieces(this.id);
        this.selection = this.setup();
    }
    choosePiece() {
        return this.pieces.choosePiece();
    }
    chooseAction() {
        x,y,z = move_random_piece();
        state[x+z][y] = state[x][y];
        state[x][y] = null;
    };
    setup() {
        var starting = array_2d(4,10);
        for (var i = 0; i < 10; i++) {
            for (var j = 0; j < 4; j++) {
                starting[j][i] = this.pieces.select();
            }
        }
        return starting;
    }
}

class Piece {
    constructor(value, spy, bomb, flag, player) {
        this.value = value;
        this.spy = spy;
        this.bomb = bomb;
        this.flag = flag;
        this.alive = true;
        this.chosen = false;
        this.player = player;
        this.x = -1;
        this.y = -1;
        this.known = false;
    }
    isFlag() {
        return this.flag;
    }
    defeats(other, check) {
        if (!check)
            this.known = true;
        if (!other.alive) return true;
        if (this.value < other.value || (this.spy && other.value == 1) || this.value === 8 && other.value === 0) {
            return true;
        } else {
            return false;
        }
    };
    get isAlive() {
        return alive;
    }
    get isChosen() {
        return chosen;
    }
    get isMovable() {
        return !this.flag && !this.bomb;
    }
    setChosen(bool) {
        this.chosen = bool;
    }
    setAlive(bool) {
        this.alive = bool;
    }
    killPiece() {
        this.alive = false;
    }
    get name() {
        if (this.value === 0) {
            return "B";
        }
        if (this.value === 10) {
            return "S";
        }
        if (this.value === 11) {
            return "F";
        }
        return this.value;
    }
}

class Pieces {
    // this is a catalogue of each piece for each player
    constructor(player) {
        // create a bank of pieces
        this.bank = Array();
        this.board = new Array();
        this.movable =  new Array();
        this.dead = new Array();
        this.bank.push(new Piece(1,false, false, false, player));
        this.bank.push(new Piece(2,false, false, false, player));

        this.bank.push(new Piece(3,false, false, false, player));
        this.bank.push(new Piece(3,false, false, false, player));

        this.bank.push(new Piece(4,false, false, false, player));
        this.bank.push(new Piece(4,false, false, false, player));
        this.bank.push(new Piece(4,false, false, false, player));

        this.bank.push(new Piece(5,false, false, false, player));
        this.bank.push(new Piece(5,false, false, false, player));
        this.bank.push(new Piece(5,false, false, false, player));
        this.bank.push(new Piece(5,false, false, false, player));

        this.bank.push(new Piece(6,false, false, false, player));
        this.bank.push(new Piece(6,false, false, false, player));
        this.bank.push(new Piece(6,false, false, false, player));
        this.bank.push(new Piece(6,false, false, false, player));

        this.bank.push(new Piece(7,false, false, false, player));
        this.bank.push(new Piece(7,false, false, false, player));
        this.bank.push(new Piece(7,false, false, false, player));
        this.bank.push(new Piece(7,false, false, false, player));
        this.bank.push(new Piece(7,false, false, false, player));

        this.bank.push(new Piece(8,false, false, false, player));
        this.bank.push(new Piece(8,false, false, false, player));
        this.bank.push(new Piece(8,false, false, false, player));
        this.bank.push(new Piece(8,false, false, false, player));
        this.bank.push(new Piece(8,false, false, false, player));
        // 9
        this.bank.push(new Piece(9,false, false, false, player));
        this.bank.push(new Piece(9,false, false, false, player));
        this.bank.push(new Piece(9,false, false, false, player));
        this.bank.push(new Piece(9,false, false, false, player));
        this.bank.push(new Piece(9,false, false, false, player));
        this.bank.push(new Piece(9,false, false, false, player));
        this.bank.push(new Piece(9,false, false, false, player));
        this.bank.push(new Piece(9,false, false, false, player));
        // spy
        this.bank.push(new Piece(10,true, false, false, player));
        // bombs
        this.bank.push(new Piece(0,false, true, false, player));
        this.bank.push(new Piece(0,false, true, false, player));
        this.bank.push(new Piece(0,false, true, false, player));
        this.bank.push(new Piece(0,false, true, false, player));
        this.bank.push(new Piece(0,false, true, false, player));
        this.bank.push(new Piece(0,false, true, false, player));
        //flag 
        this.bank.push(new Piece(11, false, false, true, player));
    }
    select() {
        // removes a piece from the bank and places it on the board
        var key = Math.floor(Math.random()*this.bank.length);
        var piece = this.bank.splice(key,1)[0];
        piece.setChosen(true);
        this.board.push(piece);
        if (piece.isMovable) {
            this.movable.push(piece);
        }
        return piece;
    }
    choosePiece() {
        // chooses a piece still 
        var key, piece;
        if (!this.movable.length) return null;
        key = Math.floor(Math.random()*this.movable.length);
        piece = this.movable[key];
        return piece;
    }
    killPiece(piece) {
        // removes a piece form the board and places it in the dead pile
        piece.setAlive(false);
        var toKill = this.board.findIndex(value => (value === piece));
        var removed = this.board.splice(toKill,1)[0];
        if (piece.isMovable) {
            var toKill2 = this.movable.findIndex(value => (value === piece));
            this.movable.splice(toKill2, 1);
        }
        this.dead.push(removed);
    }
    // pick a random number
    // remove the piece
    // 

}

// now we need each player to choose a game
var game = new Game();


function drawGame() {
    var canvas = document.getElementById("myCanvas");
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0,0,canvas.width, canvas.height);
    const BOX_WIDTH = 40;
    ctx.font = `${BOX_WIDTH*0.60}px sans-serif`;
    ctx.textBaseline = "top";
    // var p1 = game.players[0].selection;
    // var p2 = game.players[1].selection;
    var state = game.state;
    state.forEach((row,j) => {
        row.forEach((item,i) => {
            if (item && item.alive) {
                ctx.fillStyle = (item.player) ? "#3333dd" : "#dd3333";
                ctx.fillRect(i*BOX_WIDTH,j*BOX_WIDTH,BOX_WIDTH,BOX_WIDTH);
                if (item.known)
                    ctx.fillStyle = "#ffffff";
                else 
                    ctx.fillStyle = (item.player) ? "#7777dd" : "#dd7777";
                ctx.fillText(item.name, i*BOX_WIDTH+10,j*BOX_WIDTH+10);
            }
        })
        ctx.stroke();
    })
    var invalid = invalid_mask();
    // wait
    invalid.forEach((row,i) => {
        row.forEach((item,j) => {
            if (item === 0) 
                ctx.rect(j*BOX_WIDTH,i*BOX_WIDTH,BOX_WIDTH,BOX_WIDTH);
        })
        ctx.stroke();
    });
    
    ctx.beginPath();
    ctx.arc(3*BOX_WIDTH, 5*BOX_WIDTH, BOX_WIDTH*0.90, 0, 2 *Math.PI);
    ctx.fillStyle = "#7878ff";
    ctx.arc(7*BOX_WIDTH, 5*BOX_WIDTH, BOX_WIDTH*0.90, 0, 2 *Math.PI);
    ctx.fillStyle = "#7878ff";
    ctx.fill();
}

//drawGame();
//game.go();
//game.interval = setInterval(() => {game.go()}, 1);