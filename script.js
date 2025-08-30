// Chess Game with 5-minute timer and piece count victory
// Page Management
function showPage(pageId) {
    // Hide all pages
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('active'));
    
    // Show selected page
    document.getElementById(pageId).classList.add('active');
    
    // Reset game if going back to menu
    if (pageId === 'mainMenu' && window.vibeChess) {
        window.vibeChess.resetGame();
    }
}

function startNewGame() {
    showPage('gamePage');
    if (window.vibeChess) {
        window.vibeChess.resetGame();
    }
}

class VibeChess {
    constructor() {
        this.board = [];
        this.currentPlayer = 'white';
        this.selectedSquare = null;
        this.gameRunning = false;
        this.timeLeft = 300; // 5 minutes in seconds
        this.timerInterval = null;
        this.whitePieceCount = 16;
        this.blackPieceCount = 16;
        
        // Chess piece symbols
        this.pieces = {
            white: {
                king: '♔',
                queen: '♕',
                rook: '♖',
                bishop: '♗',
                knight: '♘',
                pawn: '♙'
            },
            black: {
                king: '♚',
                queen: '♛',
                rook: '♜',
                bishop: '♝',
                knight: '♞',
                pawn: '♟'
            }
        };
        
        this.initializeGame();
    }
    
    initializeGame() {
        this.createBoard();
        this.setupPieces();
        this.updateDisplay();
        this.bindEvents();
    }
    
    createBoard() {
        const boardElement = document.getElementById('chessBoard');
        boardElement.innerHTML = '';
        
        this.board = [];
        for (let row = 0; row < 8; row++) {
            this.board[row] = [];
            for (let col = 0; col < 8; col++) {
                const square = document.createElement('div');
                square.className = `square ${(row + col) % 2 === 0 ? 'light' : 'dark'}`;
                square.dataset.row = row;
                square.dataset.col = col;
                
                square.addEventListener('click', () => this.handleSquareClick(row, col));
                
                boardElement.appendChild(square);
                this.board[row][col] = { piece: null, color: null, element: square };
            }
        }
    }
    
    setupPieces() {
        // Clear the board first
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                this.board[row][col].piece = null;
                this.board[row][col].color = null;
            }
        }
        
        // Set up black pieces (top of board)
        const blackBackRow = [
            'rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'
        ];
        
        for (let col = 0; col < 8; col++) {
            // Black back row
            this.board[0][col] = {
                ...this.board[0][col],
                piece: blackBackRow[col],
                color: 'black'
            };
            
            // Black pawns
            this.board[1][col] = {
                ...this.board[1][col],
                piece: 'pawn',
                color: 'black'
            };
            
            // White pawns
            this.board[6][col] = {
                ...this.board[6][col],
                piece: 'pawn',
                color: 'white'
            };
            
            // White back row
            this.board[7][col] = {
                ...this.board[7][col],
                piece: blackBackRow[col],
                color: 'white'
            };
        }
        
        this.renderBoard();
        this.updatePieceCounts();
    }
    
    renderBoard() {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = this.board[row][col];
                const element = square.element;
                
                if (square.piece && square.color) {
                    element.innerHTML = `<span class="piece">${this.pieces[square.color][square.piece]}</span>`;
                } else {
                    element.innerHTML = '';
                }
            }
        }
    }
    
    handleSquareClick(row, col) {
        if (!this.gameRunning) return;
        
        const square = this.board[row][col];
        
        // If no piece is selected
        if (!this.selectedSquare) {
            if (square.piece && square.color === this.currentPlayer) {
                this.selectSquare(row, col);
            }
            return;
        }
        
        // If clicking on the same square, deselect
        if (this.selectedSquare.row === row && this.selectedSquare.col === col) {
            this.deselectSquare();
            return;
        }
        
        // If clicking on own piece, select that piece instead
        if (square.piece && square.color === this.currentPlayer) {
            this.deselectSquare();
            this.selectSquare(row, col);
            return;
        }
        
        // Try to make a move
        if (this.isValidMove(this.selectedSquare.row, this.selectedSquare.col, row, col)) {
            this.makeMove(this.selectedSquare.row, this.selectedSquare.col, row, col);
            this.deselectSquare();
            this.switchPlayer();
        }
    }
    
    selectSquare(row, col) {
        this.selectedSquare = { row, col };
        this.board[row][col].element.classList.add('selected');
        this.showPossibleMoves(row, col);
    }
    
    deselectSquare() {
        if (this.selectedSquare) {
            this.board[this.selectedSquare.row][this.selectedSquare.col].element.classList.remove('selected');
            this.selectedSquare = null;
        }
        this.clearPossibleMoves();
    }
    
    showPossibleMoves(fromRow, fromCol) {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if (this.isValidMove(fromRow, fromCol, row, col)) {
                    this.board[row][col].element.classList.add('possible-move');
                }
            }
        }
    }
    
    clearPossibleMoves() {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                this.board[row][col].element.classList.remove('possible-move');
            }
        }
    }
    
    isValidMove(fromRow, fromCol, toRow, toCol) {
        // Check bounds
        if (toRow < 0 || toRow > 7 || toCol < 0 || toCol > 7) return false;
        
        const fromSquare = this.board[fromRow][fromCol];
        const toSquare = this.board[toRow][toCol];
        
        // Can't move to a square with own piece
        if (toSquare.piece && toSquare.color === fromSquare.color) return false;
        
        const piece = fromSquare.piece;
        const rowDiff = toRow - fromRow;
        const colDiff = toCol - fromCol;
        const absRowDiff = Math.abs(rowDiff);
        const absColDiff = Math.abs(colDiff);
        
        switch (piece) {
            case 'pawn':
                return this.isValidPawnMove(fromRow, fromCol, toRow, toCol, fromSquare.color);
            
            case 'rook':
                return (rowDiff === 0 || colDiff === 0) && this.isPathClear(fromRow, fromCol, toRow, toCol);
            
            case 'bishop':
                return absRowDiff === absColDiff && this.isPathClear(fromRow, fromCol, toRow, toCol);
            
            case 'queen':
                return ((rowDiff === 0 || colDiff === 0) || (absRowDiff === absColDiff)) && 
                       this.isPathClear(fromRow, fromCol, toRow, toCol);
            
            case 'knight':
                return (absRowDiff === 2 && absColDiff === 1) || (absRowDiff === 1 && absColDiff === 2);
            
            case 'king':
                return absRowDiff <= 1 && absColDiff <= 1;
            
            default:
                return false;
        }
    }
    
    isValidPawnMove(fromRow, fromCol, toRow, toCol, color) {
        const direction = color === 'white' ? -1 : 1;
        const rowDiff = toRow - fromRow;
        const colDiff = Math.abs(toCol - fromCol);
        
        // Moving forward
        if (colDiff === 0) {
            // One square forward
            if (rowDiff === direction && !this.board[toRow][toCol].piece) {
                return true;
            }
            // Two squares forward from starting position
            if (rowDiff === 2 * direction && 
                ((color === 'white' && fromRow === 6) || (color === 'black' && fromRow === 1)) &&
                !this.board[toRow][toCol].piece && !this.board[fromRow + direction][fromCol].piece) {
                return true;
            }
        }
        
        // Diagonal capture
        if (colDiff === 1 && rowDiff === direction && this.board[toRow][toCol].piece) {
            return true;
        }
        
        return false;
    }
    
    isPathClear(fromRow, fromCol, toRow, toCol) {
        const rowStep = toRow > fromRow ? 1 : toRow < fromRow ? -1 : 0;
        const colStep = toCol > fromCol ? 1 : toCol < fromCol ? -1 : 0;
        
        let currentRow = fromRow + rowStep;
        let currentCol = fromCol + colStep;
        
        while (currentRow !== toRow || currentCol !== toCol) {
            if (this.board[currentRow][currentCol].piece) {
                return false;
            }
            currentRow += rowStep;
            currentCol += colStep;
        }
        
        return true;
    }
    
    makeMove(fromRow, fromCol, toRow, toCol) {
        const fromSquare = this.board[fromRow][fromCol];
        const toSquare = this.board[toRow][toCol];
        
        // Move the piece
        toSquare.piece = fromSquare.piece;
        toSquare.color = fromSquare.color;
        fromSquare.piece = null;
        fromSquare.color = null;
        
        this.renderBoard();
        this.updatePieceCounts();
    }
    
    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
        this.updateDisplay();
    }
    
    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            this.updateTimer();
            
            if (this.timeLeft <= 0) {
                this.endGame();
            }
        }, 1000);
    }
    
    updateTimer() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        document.getElementById('timer').textContent = 
            `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    updatePieceCounts() {
        // Count pieces by their actual side positions on the board
        // White side = bottom half (rows 4-7), Black side = top half (rows 0-3)
        let whiteSideCount = 0;
        let blackSideCount = 0;
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = this.board[row][col];
                if (square.piece) {
                    if (row >= 4) {
                        // Bottom half - White side
                        whiteSideCount++;
                    } else {
                        // Top half - Black side
                        blackSideCount++;
                    }
                }
            }
        }
        
        this.whitePieceCount = whiteSideCount;
        this.blackPieceCount = blackSideCount;
        
        document.getElementById('whitePieces').textContent = this.whitePieceCount;
        document.getElementById('blackPieces').textContent = this.blackPieceCount;
    }
    
    updateDisplay() {
        const turnDisplay = document.getElementById('currentTurn');
        turnDisplay.textContent = `${this.currentPlayer === 'white' ? 'White' : 'Black'}'s Turn`;
        turnDisplay.style.color = this.currentPlayer === 'white' ? '#5a67d8' : '#2c3e50';
    }
    
    startGame() {
        if (this.gameRunning) return;
        
        this.gameRunning = true;
        this.timeLeft = 300; // Reset to 5 minutes
        this.currentPlayer = 'white';
        this.startTimer();
        
        // Move timer to corner
        const timerSection = document.querySelector('.timer-section');
        timerSection.classList.add('corner');
        
        document.getElementById('startBtn').textContent = 'Game Running...';
        document.getElementById('startBtn').disabled = true;
        document.getElementById('gameStatus').textContent = '';
        document.getElementById('gameStatus').style.display = 'none';
        
        this.updateTimer();
        this.updateDisplay();
    }
    
    resetGame() {
        this.gameRunning = false;
        this.currentPlayer = 'white';
        this.selectedSquare = null;
        this.timeLeft = 300;
        this.whitePieceCount = 16;
        this.blackPieceCount = 16;
        
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        // Move timer back to normal position
        const timerSection = document.querySelector('.timer-section');
        timerSection.classList.remove('corner');
        
        document.getElementById('startBtn').textContent = 'Start Game';
        document.getElementById('startBtn').disabled = false;
        document.getElementById('gameStatus').textContent = 'Click "Start Game" to begin your relaxing chess experience!';
        document.getElementById('gameStatus').className = 'game-status';
        document.getElementById('gameStatus').style.display = 'block';
        
        this.setupPieces();
        this.updateTimer();
        this.updateDisplay();
        this.clearPossibleMoves();
    }
    
    endGame() {
        this.gameRunning = false;
        
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        // Move timer back to normal position
        const timerSection = document.querySelector('.timer-section');
        timerSection.classList.remove('corner');
        
        let winner;
        let winnerText;
        let subtitle;
        
        if (this.whitePieceCount > this.blackPieceCount) {
            winner = 'white';
            winnerText = '🤍 White Side Wins! 🎉';
            subtitle = `White side: ${this.whitePieceCount} pieces vs Black side: ${this.blackPieceCount} pieces`;
        } else if (this.blackPieceCount > this.whitePieceCount) {
            winner = 'black';
            winnerText = '⚫ Black Side Wins! 🎉';
            subtitle = `Black side: ${this.blackPieceCount} pieces vs White side: ${this.whitePieceCount} pieces`;
        } else {
            winnerText = '🤝 It\'s a Tie! Great game! 🎉';
            subtitle = `Both sides have ${this.whitePieceCount} pieces!`;
        }
        
        // Update results page
        document.getElementById('winnerTitle').textContent = winnerText;
        document.getElementById('winnerSubtitle').textContent = subtitle;
        document.getElementById('finalWhiteCount').textContent = this.whitePieceCount;
        document.getElementById('finalBlackCount').textContent = this.blackPieceCount;
        
        // Show results page
        setTimeout(() => {
            showPage('resultsPage');
        }, 1000);
        
        // Also update game status temporarily
        const statusElement = document.getElementById('gameStatus');
        statusElement.textContent = winnerText;
        statusElement.className = 'game-status winner';
        statusElement.style.display = 'block';
        
        document.getElementById('startBtn').textContent = 'Start New Game';
        document.getElementById('startBtn').disabled = false;
        
        this.deselectSquare();
    }
    
    bindEvents() {
        document.getElementById('startBtn').addEventListener('click', () => {
            if (!this.gameRunning) {
                this.startGame();
            }
        });
        
        document.getElementById('resetBtn').addEventListener('click', () => {
            this.resetGame();
        });
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.vibeChess = new VibeChess();
    
    // Show main menu by default
    showPage('mainMenu');
});