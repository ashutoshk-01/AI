class PerformanceTracker {
    constructor() {
        this.gamesPlayed = 0;
        this.gamesWon = 0;
        this.totalTime = 0;
        this.totalMoves = 0;
        this.totalCorrectFlags = 0;
        this.totalDecisionTime = 0;
    }

    recordGame(won, time, moves, correctFlags, decisionTime) {
        this.gamesPlayed++;
        if (won) this.gamesWon++;
        this.totalTime += time;
        this.totalMoves += moves;
        this.totalCorrectFlags += correctFlags;
        this.totalDecisionTime += decisionTime;
    }

    getResults() {
        return {
            winRate: this.gamesWon / this.gamesPlayed,
            avgCompletionTime: this.totalTime / this.gamesPlayed,
            avgMovesPerGame: this.totalMoves / this.gamesPlayed,
            efficiency: this.totalCorrectFlags / this.totalMoves,
            avgDecisionTime: this.totalDecisionTime / this.totalMoves
        };
    }
}
class Minesweeper {
    constructor(rows, cols, mines) {
        this.rows = rows;
        this.cols = cols;
        this.mines = mines;
        this.board = [];
        this.revealed = [];
        this.flagged = [];
        this.gameOver = false;
        this.minesLeft = mines;
        this.timeElapsed = 0;
        this.timerInterval = null;
        this.aiAgent = new AIAgent(this);
        this.performanceTracker = new PerformanceTracker();
        this.moves = 0;
        this.correctFlags = 0;

        this.initializeBoard();
        this.renderBoard();
        this.setupEventListeners();
        this.startTimer();
    }

    initializeBoard() {
        for (let i = 0; i < this.rows; i++) {
            this.board[i] = new Array(this.cols).fill(0);
            this.revealed[i] = new Array(this.cols).fill(false);
            this.flagged[i] = new Array(this.cols).fill(false);
        }

        // Place mines randomly
        let minesPlaced = 0;
        while (minesPlaced < this.mines) {
            const row = Math.floor(Math.random() * this.rows);
            const col = Math.floor(Math.random() * this.cols);
            if (this.board[row][col] !== -1) {
                this.board[row][col] = -1;
                minesPlaced++;
                this.updateAdjacentCells(row, col);
            }
        }
    }

    updateAdjacentCells(row, col) {
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                const newRow = row + i;
                const newCol = col + j;
                if (this.isInBounds(newRow, newCol) && this.board[newRow][newCol] !== -1) {
                    this.board[newRow][newCol]++;
                }
            }
        }
    }

    isInBounds(row, col) {
        return row >= 0 && row < this.rows && col >= 0 && col < this.cols;
    }

    renderBoard() {
        const gameBoard = document.getElementById('game-board');
        gameBoard.innerHTML = '';
        const cellSize = this.getCellSize();
        gameBoard.style.gridTemplateColumns = `repeat(${this.cols}, ${cellSize}px)`;

        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.dataset.row = i;
                cell.dataset.col = j;
                cell.style.width = `${cellSize}px`;
                cell.style.height = `${cellSize}px`;
                gameBoard.appendChild(cell);

                if (this.revealed[i][j]) {
                    cell.classList.add('revealed');
                    if (this.board[i][j] === -1) {
                        cell.classList.add('mine');
                        cell.textContent = '💣';
                    } else if (this.board[i][j] > 0) {
                        cell.textContent = this.board[i][j];
                    }
                } else if (this.flagged[i][j]) {
                    cell.classList.add('flagged');
                    cell.textContent = '🚩';
                }
            }
        }

        document.getElementById('mine-count').textContent = this.minesLeft;
    }

    getCellSize() {
        const difficulty = document.getElementById('difficulty').value;
        switch (difficulty) {
            case 'easy':
                return 30;
            case 'medium':
                return 25;
            case 'hard':
                return 20;
            default:
                return 30;
        }
    }

    setupEventListeners() {
        const gameBoard = document.getElementById('game-board');
        gameBoard.addEventListener('click', (e) => this.handleCellClick(e));
        gameBoard.addEventListener('contextmenu', (e) => this.handleRightClick(e));

        document.getElementById('new-game').addEventListener('click', () => this.newGame());
        document.getElementById('ai-move').addEventListener('click', () => this.aiAgent.makeMove());
        document.getElementById('toggle-ai').addEventListener('click', () => this.toggleAI());
    }

    handleCellClick(e) {
        if (this.gameOver) return;
        const cell = e.target;
        if (!cell.classList.contains('cell')) return;

        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);

        if (!this.flagged[row][col]) {
            this.revealCell(row, col);
        }
    }

    handleRightClick(e) {
        e.preventDefault();
        if (this.gameOver) return;
        const cell = e.target;
        if (!cell.classList.contains('cell')) return;

        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);

        if (!this.revealed[row][col]) {
            this.flagCell(row, col);
        }
    }

    revealCell(row, col) {
        if (this.revealed[row][col] || this.flagged[row][col]) return;
        this.revealed[row][col] = true;
        this.moves++;

        if (this.board[row][col] === -1) {
            this.gameOver = true;
            this.revealAllMines();
            this.endGame(false);
        } else {
            if (this.board[row][col] === 0) {
                this.revealAdjacentCells(row, col);
            }
            this.checkWin();
        }
        this.renderBoard();
    }

    flagCell(row, col) {
        if (this.revealed[row][col]) return;
        this.flagged[row][col] = !this.flagged[row][col];
        this.minesLeft += this.flagged[row][col] ? -1 : 1;
        if (this.flagged[row][col] && this.board[row][col] === -1) {
            this.correctFlags++;
        } else if (!this.flagged[row][col] && this.board[row][col] === -1) {
            this.correctFlags--;
        }
        this.renderBoard();
    }

    revealAdjacentCells(row, col) {
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                const newRow = row + i;
                const newCol = col + j;
                if (this.isInBounds(newRow, newCol) && !this.revealed[newRow][newCol] && !this.flagged[newRow][newCol]) {
                    this.revealCell(newRow, newCol);
                }
            }
        }
    }

    revealAllMines() {
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                if (this.board[i][j] === -1) {
                    this.revealed[i][j] = true;
                }
            }
        }
    }

    checkWin() {
        const totalCells = this.rows * this.cols;
        const revealedCells = this.revealed.flat().filter(cell => cell).length;
        
        if (revealedCells === totalCells - this.mines) {
            this.gameOver = true;
            this.endGame(true);
        }
    }

    endGame(won) {
        clearInterval(this.timerInterval);
        this.performanceTracker.recordGame(
            won,
            this.timeElapsed,
            this.moves,
            this.correctFlags,
            this.aiAgent.totalDecisionTime
        );
        alert(won ? "You Win!" : "Game Over!");
        console.log(this.performanceTracker.getResults());
    }

    newGame() {
        const difficulty = document.getElementById('difficulty').value;
        const settings = { easy: [9, 9, 10], medium: [16, 16, 40], hard: [16, 30, 99] };
        [this.rows, this.cols, this.mines] = settings[difficulty];

        this.minesLeft = this.mines;
        this.timeElapsed = 0;
        this.gameOver = false;
        this.moves = 0;
        this.correctFlags = 0;
        this.aiAgent.totalDecisionTime = 0;

        this.initializeBoard();
        this.renderBoard();
        this.startTimer();
    }

    startTimer() {
        clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            this.timeElapsed++;
            document.getElementById('timer').textContent = this.timeElapsed;
        }, 1000);
    }

    toggleAI() {
        this.aiAgent.toggleAI();
        document.getElementById('ai-status').textContent = this.aiAgent.enabled ? 'On' : 'Off';
    }
}

class AIAgent {
    constructor(game) {
        this.game = game;
        this.enabled = true;
        this.totalDecisionTime = 0;
    }

    makeMove() {
        if (this.game.gameOver || !this.enabled) return;

        const startTime = performance.now();
        const move = this.solveCSP();
        if (move) {
            const [row, col] = move;
            this.game.revealCell(row, col);
        } else {
            const safeMoves = this.deduceSafeMoves();
            if (safeMoves.length > 0) {
                const [row, col] = safeMoves[Math.floor(Math.random() * safeMoves.length)];
                this.game.revealCell(row, col);
            } else {
                const randomMove = this.makeRandomMove();
                if (randomMove) {
                    const [row, col] = randomMove;
                    this.game.revealCell(row, col);
                }
            }
        }
        const endTime = performance.now();
        this.totalDecisionTime += (endTime - startTime) / 1000; // Convert to seconds
    }


    solveCSP() {
        const clues = this.collectClueCells();

        for (const { row, col, value } of clues) {
            const adjacentCells = this.getAdjacentCells(row, col);
            const flaggedCount = adjacentCells.filter(({ r, c }) => this.game.flagged[r][c]).length;
            const unrevealedCount = adjacentCells.filter(({ r, c }) => !this.game.revealed[r][c] && !this.game.flagged[r][c]).length;

            if (value === flaggedCount) {
                for (const { r, c } of adjacentCells) {
                    if (!this.game.revealed[r][c] && !this.game.flagged[r][c]) {
                        return [r, c];
                    }
                }
            } else if (value === flaggedCount + unrevealedCount) {
                for (const { r, c } of adjacentCells) {
                    if (!this.game.flagged[r][c] && !this.game.revealed[r][c]) {
                        this.game.flagCell(r, c);
                    }
                }
            }
        }

        return null;
    }

    deduceSafeMoves() {
        const safeMoves = [];
        const clues = this.collectClueCells();

        for (const { row, col, value } of clues) {
            const adjacentCells = this.getAdjacentCells(row, col);
            const flaggedCount = adjacentCells.filter(({ r, c }) => this.game.flagged[r][c]).length;
            const unrevealedCount = adjacentCells.filter(({ r, c }) => !this.game.revealed[r][c] && !this.game.flagged[r][c]).length;

            if (value === flaggedCount && unrevealedCount > 0) {
                for (const { r, c } of adjacentCells) {
                    if (!this.game.revealed[r][c] && !this.game.flagged[r][c]) {
                        safeMoves.push([r, c]);
                    }
                }
            }
        }

        return safeMoves;
    }

    getAdjacentCells(row, col) {
        const adjacent = [];
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                const newRow = row + i;
                const newCol = col + j;
                if (this.game.isInBounds(newRow, newCol) && (i !== 0 || j !== 0)) {
                    adjacent.push({ r: newRow, c: newCol });
                }
            }
        }
        return adjacent;
    }

    collectClueCells() {
        const clues = [];
        for (let row = 0; row < this.game.rows; row++) {
            for (let col = 0; col < this.game.cols; col++) {
                if (this.game.revealed[row][col] && this.game.board[row][col] > 0) {
                    clues.push({ row, col, value: this.game.board[row][col] });
                }
            }
        }
        return clues;
    }

    makeRandomMove() {
        const unrevealedCells = [];
        for (let row = 0; row < this.game.rows; row++) {
            for (let col = 0; col < this.game.cols; col++) {
                if (!this.game.revealed[row][col] && !this.game.flagged[row][col]) {
                    unrevealedCells.push([row, col]);
                }
            }
        }

        return unrevealedCells.length > 0 ? unrevealedCells[Math.floor(Math.random() * unrevealedCells.length)] : null;
    }

    toggleAI() {
        this.enabled = !this.enabled;
    }
}


document.addEventListener('DOMContentLoaded', () => {
    new Minesweeper(9, 9, 10); // Default settings for a new game
});