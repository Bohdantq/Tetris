const PLAYFILED_COLUMNS = 10;
const PLAYFILED_ROWS = 20;
let playfield;
let cells;
let isPaused = false;
let timedId;
let isGameOver = false;
let score = 0;
let scoreElement = document.getElementById('score-value');
let btnStart = document.querySelector('.btn-start');
let pause = document.querySelector('.btn-pause');
let btnRestart = document.querySelector('.btn-restart');

let overlay = document.querySelector('.overlay');
let timeGame = document.querySelector('.time-game');

const TETROMINO_NAMES = ['T', 'O', 'L', 'J', 'I', 'S', 'Z'];

const TETROMINOES = {
	T: [
		[0, 0, 0],
		[1, 1, 1],
		[0, 1, 0],
	],
	O: [
		[1, 1],
		[1, 1],
	],
	L: [
		[0, 1, 0],
		[0, 1, 0],
		[0, 1, 1],
	],
	J: [
		[0, 0, 1],
		[0, 0, 1],
		[0, 1, 1],
	],
	I: [
		[0, 1, 0, 0],
		[0, 1, 0, 0],
		[0, 1, 0, 0],
		[0, 1, 0, 0],
	],
	S: [
		[0, 1, 1],
		[1, 1, 0],
		[0, 0, 0],
	],
	Z: [
		[1, 1, 0],
		[0, 1, 1],
		[0, 0, 0],
	],
};

let tetromino = {
	name: '',
	matrix: [],
	column: 0,
	row: 0,
};

// -----------------------------------------
// COMMON
// -----------------------------------------
function init() {
	score = 0;
	scoreElement.innerHTML = 0;
	isGameOver = false;
	generateTetromino();
	moveDown();
}

generatePlayfield();
cells = document.querySelectorAll('.tetris div');

function convertPositionToIndex(row, col) {
	return row * PLAYFILED_COLUMNS + col;
}

function randomFigure(array) {
	const randomIndex = Math.floor(Math.random() * array.length);
	return array[randomIndex];
}

// -----------------------------------------
// GENERATION
// -----------------------------------------
function generateTetromino() {
	const nameTetro = randomFigure(TETROMINO_NAMES);
	const matrix = TETROMINOES[nameTetro];

	const columnTetro = Math.floor(PLAYFILED_COLUMNS / 2 - matrix.length / 2);
	const rowTetro = -2;

	tetromino = {
		name: nameTetro,
		matrix: matrix,
		column: columnTetro,
		row: rowTetro,
	};
}

function generatePlayfield() {
	for (let i = 0; i < PLAYFILED_COLUMNS * PLAYFILED_ROWS; i++) {
		const div = document.createElement('div');
		document.querySelector('.tetris').append(div);
	}

	playfield = new Array(PLAYFILED_ROWS)
		.fill()
		.map(() => new Array(PLAYFILED_COLUMNS).fill(0));
}

// -----------------------------------------
// KEYBOARD KEYS
// -----------------------------------------

btnStart.addEventListener('click', function () {
	init()
})

pause.addEventListener('click', function () {
	togglePaused();
})

function togglePaused() {
	if (isPaused) {
		startLoop();
		timeGameStart();
	} else {
		stopLoop();
		timeGameStop();
	}

	isPaused = !isPaused;
}

btnRestart.addEventListener('click', function () {
	stopLoop();
	timeGameStop();

	document.querySelector('.tetris').innerHTML = ''; //Clear the playfield

	// Reset game state
	score = 0;
	scoreElement.innerHTML = 0;
	isGameOver = false;
	isPaused = false;
	i = 0;

	overlay.style.display = 'none';

	generatePlayfield();
	cells = document.querySelectorAll('.tetris div');
	generateTetromino();
})

document.addEventListener('keydown', onKeyDown);

function onKeyDown(event) {
	if (event.key == 'Escape') {
		togglePaused();
	}
	if (!isPaused) {
		if (event.key == ' ') {
			dropTetrominoDown();
		}
		if (event.key == 'ArrowUp') {
			rotate();
		}
		if (event.key == 'ArrowLeft') {
			moveTetrominoLeft();
		}
		if (event.key == 'ArrowRight') {
			moveTetrominoRight();
		}
		if (event.key == 'ArrowDown') {
			moveTetrominoDown();
		}

	}
	draw();
}
// Панель управління для моб версій і не тільки
// const btnLeft = document.querySelector('.ArrowLeft')
// const btnRight = document.querySelector('.ArrowRight')

// btnLeft.addEventListener('click', function () {
// 	moveTetrominoLeft()
// 	draw()
// })

// btnRight.addEventListener('click', function () {
// 	moveTetrominoLeft()
// 	draw()
// })

function moveTetrominoDown() {
	tetromino.row += 1;
	if (!isValid()) {
		tetromino.row -= 1;
		placeTetromino();
	}
}
function moveTetrominoLeft() {
	tetromino.column -= 1;
	if (!isValid()) {
		tetromino.column += 1;
	}
}
function moveTetrominoRight() {
	tetromino.column += 1;
	if (!isValid()) {
		tetromino.column -= 1;
	}
}

function draw() {
	cells.forEach((el) => el.removeAttribute('class'));
	drawPlayfield();
	drawTetromino();
}

function dropTetrominoDown() {
	while (isValid()) {
		tetromino.row++;
	}
	tetromino.row--;
}

// -----------------------------------------
// ROTATE
// -----------------------------------------
function rotate() {
	rotateTetromino();
	draw();
}

function rotateTetromino() {
	const oldMatrix = tetromino.matrix;
	const rotatedMatrix = rotateMatrix(tetromino.matrix);
	tetromino.matrix = rotatedMatrix;
	if (!isValid()) {
		tetromino.matrix = oldMatrix;
	}
}
function rotateMatrix(matrixTetromino) {
	const N = matrixTetromino.length;
	const rotateMatrix = [];

	for (let i = 0; i < N; i++) {
		rotateMatrix[i] = [];
		for (let j = 0; j < N; j++) {
			rotateMatrix[i][j] = matrixTetromino[N - j - 1][i];
		}
	}
	return rotateMatrix;
}

// -----------------------------------------
// COLLISIONS
// -----------------------------------------
function isValid() {
	const matrixSize = tetromino.matrix.length;
	for (let row = 0; row < matrixSize; row++) {
		for (let column = 0; column < matrixSize; column++) {
			if (isOutsideOfGameboard(row, column)) {
				return false;
			}
			if (hasCollisions(row, column)) {
				return false;
			}
		}
	}
	return true;
}

function isOutsideOfTopGameboard(row) {
	return tetromino.row + row < 0;
}

function isOutsideOfGameboard(row, column) {
	return (
		tetromino.matrix[row][column] &&
		(tetromino.row + row >= PLAYFILED_ROWS ||
			tetromino.column + column < 0 ||
			tetromino.column + column >= PLAYFILED_COLUMNS)
	);
}

function hasCollisions(row, column) {
	return (
		tetromino.matrix[row][column] &&
		playfield[tetromino.row + row]?.[tetromino.column + column]
	);
}

// -----------------------------------------
// DRAW
// -----------------------------------------
function drawTetromino() {
	const name = tetromino.name;
	const tetrominoMatrixSize = tetromino.matrix.length;

	for (let row = 0; row < tetrominoMatrixSize; row++) {
		for (let column = 0; column < tetrominoMatrixSize; column++) {
			if (isOutsideOfTopGameboard(row)) { continue }
			if (!tetromino.matrix[row][column]) {
				continue;
			}
			const cellIndex = convertPositionToIndex(
				tetromino.row + row,
				tetromino.column + column
			);
			cells[cellIndex].classList.add(name);
		}
	}
}

function drawPlayfield() {
	for (let row = 0; row < PLAYFILED_ROWS; row++) {
		for (let column = 0; column < PLAYFILED_COLUMNS; column++) {
			if (!playfield[row][column]) continue;
			const nameFigure = playfield[row][column];
			const cellIndex = convertPositionToIndex(row, column);

			cells[cellIndex].classList.add(nameFigure);
		}
	}
}

function countScore(destroyRows) {
	if (destroyRows == 1) {
		score += 10;
	}
	if (destroyRows == 2) {
		score += 20;
	}
	if (destroyRows == 3) {
		score += 50;
	}
	if (destroyRows == 4) {
		score += 100;
	}
	if (destroyRows == 5) {
		score += 250;
	}
	if (destroyRows == 6) {
		score += 500;
	}
	scoreElement.innerHTML = score;
}

function placeTetromino() {
	const tetrominoMatrixSize = tetromino.matrix.length;
	for (let row = 0; row < tetrominoMatrixSize; row++) {
		for (let column = 0; column < tetrominoMatrixSize; column++) {
			if (isOutsideOfTopGameboard(row)) {
				isGameOver = true;
				overlay.style.display = 'flex';
				timeGameStop();
				timeGame.innerHTML = i + 'sek';
				return;
			}
			if (tetromino.matrix[row][column]) {
				playfield[tetromino.row + row][tetromino.column + column] =
					tetromino.name;
			}
		}
	}
	let filledRows = findFilledRows();
	removeFillRow(filledRows)
	countScore(filledRows.length)
	generateTetromino();
}

function findFilledRows() {
	const fillRows = [];
	for (let row = 0; row < PLAYFILED_ROWS; row++) {
		let filledColumns = 0;
		for (let column = 0; column < PLAYFILED_COLUMNS; column++) {
			if (playfield[row][column] != 0) {
				filledColumns++;
			}
		}
		if (PLAYFILED_COLUMNS == filledColumns) {
			fillRows.push(row);
		}
	}
	return fillRows;
}
function removeFillRow(filledRows) {
	for (let i = 0; i < filledRows.length; i++) {
		const row = filledRows[i];
		dropRowsAbove(row);
	}
}

function dropRowsAbove(rowDelete) {
	for (let row = rowDelete; row > 0; row--) {
		playfield[row] = playfield[row - 1]
	}
	playfield[0] = new Array(PLAYFILED_COLUMNS).fill(0);
}


function moveDown() {
	moveTetrominoDown();
	draw();
	stopLoop();
	startLoop();
}

function startLoop() {
	timedId = setTimeout(() => requestAnimationFrame(moveDown), 700)
}

function stopLoop() {
	clearTimeout(timedId);
	timedId = null;
}

let i = 0;
let timeGameId = null;
function timeGameStart() {
	if (!timeGameId) {
		timeGameId = setInterval(function () {
			i++
		}, 1000);
	}
}
function timeGameStop() {
	clearInterval(timeGameId)
	timeGameId = null;
}

timeGameStart();