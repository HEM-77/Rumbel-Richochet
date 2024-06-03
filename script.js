document.addEventListener('DOMContentLoaded', () => {
    const board = document.getElementById('board');
    const playerTurnDisplay = document.getElementById('player-turn');
    const player1TimerDisplay = document.getElementById('player1-timer');
    const player2TimerDisplay = document.getElementById('player2-timer');

    let currentPlayer = 'Player 1';
    let selectedPiece = null;
    let player1Time = 180; // 3 minutes in seconds
    let player2Time = 180; // 3 minutes in seconds
    let timerInterval = null;

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const updateTimers = () => {
        player1TimerDisplay.textContent = `Player 1 Time: ${formatTime(player1Time)}`;
        player2TimerDisplay.textContent = `Player 2 Time: ${formatTime(player2Time)}`;
    };

    const startTimer = () => {
        timerInterval = setInterval(() => {
            if (currentPlayer === 'Player 1') {
                player1Time--;
                if (player1Time <= 0) {
                    clearInterval(timerInterval);
                    alert('Player 2 wins! Player 1 ran out of time.');
                    resetGame();
                }
            } else {
                player2Time--;
                if (player2Time <= 0) {
                    clearInterval(timerInterval);
                    alert('Player 1 wins! Player 2 ran out of time.');
                    resetGame();
                }
            }
            updateTimers();
        }, 1000);
    };

    const stopTimer = () => {
        clearInterval(timerInterval);
    };

    const updatePlayerTurn = () => {
        currentPlayer = currentPlayer === 'Player 1' ? 'Player 2' : 'Player 1';
        playerTurnDisplay.textContent = `${currentPlayer}'s turn`;
        startTimer();
    };

    const initializeBoard = () => {
        for (let i = 0; i < 64; i++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.index = i;
            board.appendChild(cell);
        }
    };

    const getRandomPosition = (positions, lower, upper) => {
        let position;
        do {
            position = Math.floor(Math.random() * (upper - lower + 1)) + lower;
        } while (positions.includes(position));
        positions.push(position);
        return position;
    };

    const placePieces = (isSecondSet) => {
        const occupiedPositions = [];
        const startRow = isSecondSet ? 5 : 0;
        const endRow = isSecondSet ? 7 : 2;
        const cannonRow = isSecondSet ? 7 : 0;
        const pieces = ['titan', 'tank', 'ricochets', 'semi-ricochets'];

        const cannonPos = getRandomPosition(occupiedPositions, cannonRow * 8, (cannonRow * 8) + 7);
        const cannonCell = board.children[cannonPos];
        const cannonDiv = document.createElement('div');
        cannonDiv.classList.add('cannon');
        if (isSecondSet) cannonDiv.classList.add('second-set');
        cannonCell.appendChild(cannonDiv);

        pieces.forEach(piece => {
            if (piece !== 'cannon') {
                const piecePos = getRandomPosition(occupiedPositions, startRow * 8, (endRow * 8) + 7);
                const cell = board.children[piecePos];
                const pieceDiv = document.createElement('div');
                pieceDiv.classList.add(piece);
                if (isSecondSet) pieceDiv.classList.add('second-set');
                cell.appendChild(pieceDiv);
            }
        });
    };

    const clearHighlights = () => {
        document.querySelectorAll('.cell').forEach(cell => {
            cell.classList.remove('highlight');
            cell.removeEventListener('click', movePiece);
        });
    };

    const highlightMoves = (index, piece) => {
        const row = Math.floor(index / 8);
        const col = index % 8;
        const possibleMoves = [];
        const isCellEmpty = (row, col) => {
            if (row >= 0 && row < 8 && col >= 0 && col < 8) {
                const cellIndex = row * 8 + col;
                return !board.children[cellIndex].hasChildNodes();
            }
            return false;
        };

        if (piece !== 'cannon') {
            const directions = [
                [-1, -1], [-1, 0], [-1, 1], // Up-left, Up, Up-right
                [0, -1],          [0, 1],   // Left,       , Right
                [1, -1], [1, 0], [1, 1]    // Down-left, Down, Down-right
            ];

            directions.forEach(([dRow, dCol]) => {
                const newRow = row + dRow;
                const newCol = col + dCol;
                if (isCellEmpty(newRow, newCol)) {
                    possibleMoves.push(newRow * 8 + newCol);
                }
            });
        } else {
            if (col > 0 && isCellEmpty(row, col - 1)) possibleMoves.push(index - 1);
            if (col < 7 && isCellEmpty(row, col + 1)) possibleMoves.push(index + 1);
        }

        return possibleMoves;
    };

    const movePiece = (event) => {
        const targetIndex = parseInt(event.currentTarget.dataset.index);
        const pieceDiv = selectedPiece.parentNode.removeChild(selectedPiece);
        event.currentTarget.appendChild(pieceDiv);
        clearHighlights();
        document.getElementById('rotation-options')?.remove();
        fireBullet();
    };

    const rotatePiece = (direction) => {
        if (selectedPiece.classList.contains('ricochets')) {
            const currentRotation = selectedPiece.dataset.rotation ? parseInt(selectedPiece.dataset.rotation) : 0;
            const newRotation = direction === 'right' ? currentRotation + 90 : currentRotation - 90;
            selectedPiece.style.transform = `rotate(${newRotation}deg)`;
            selectedPiece.dataset.rotation = newRotation;
        } else if (selectedPiece.classList.contains('semi-ricochets')) {
            const currentRotation = selectedPiece.dataset.rotation ? parseInt(selectedPiece.dataset.rotation) : 45;
            const newRotation = currentRotation === 45 ? 135 : 45;
            selectedPiece.style.transform = `rotate(${newRotation}deg)`;
            selectedPiece.dataset.rotation = newRotation;
        }
        clearHighlights();
        document.getElementById('rotation-options')?.remove();
        fireBullet();
    };

    const showRotationOptions = () => {
        const rotationOptions = document.createElement('div');
        rotationOptions.id = 'rotation-options';
        rotationOptions.innerHTML = `
            <button id="rotate-left">Rotate Left</button>
            <button id="rotate-right">Rotate Right</button>
        `;
        document.body.appendChild(rotationOptions);
        document.getElementById('rotate-left').addEventListener('click', () => rotatePiece('left'));
        document.getElementById('rotate-right').addEventListener('click', () => rotatePiece('right'));
    };

    const fireBullet = () => {
        const playerCannon = currentPlayer === 'Player 1' ? document.querySelector('.cannon:not(.second-set)') : document.querySelector('.cannon.second-set');
        const cannonParentIndex = parseInt(playerCannon.parentNode.dataset.index);
        const col = cannonParentIndex % 8;
        let row = Math.floor(cannonParentIndex / 8);
        const direction = currentPlayer === 'Player 1' ? 1 : -1;

        stopTimer();  // Stop the timer when the bullet is fired

        const moveBullet = () => {
            row += direction;
            if (row < 0 || row > 7) {
                updatePlayerTurn();
                return; // Stop if it reaches the edge
            }
            const cellIndex = row * 8 + col;
            const cell = board.children[cellIndex];
            if (!cell.querySelector('.bullet')) {
                const bulletDiv = document.createElement('div');
                bulletDiv.classList.add('bullet');
                cell.appendChild(bulletDiv);
                setTimeout(() => {
                    bulletDiv.remove();
                    if (!cell.hasChildNodes()) {
                        moveBullet();
                    } else {
                        const piece = cell.firstChild;
                        handleBulletCollision(piece, cell);
                    }
                }, 500);
            }
        };
        moveBullet();
    };

    const handleBulletCollision = (piece, cell) => {
        if (piece.classList.contains('titan')) {
            alert(`${currentPlayer} wins!`);
            resetGame();
        } else if (piece.classList.contains('tank')) {
            document.querySelector('.bullet').remove(); // Bullet disappears, tank remains
        } else if (piece.classList.contains('ricochets') || piece.classList.contains('semi-ricochets')) {
            deflectBullet(piece, cell);
        } else {
            updatePlayerTurn();
        }
    };

    const deflectBullet = (piece, cell) => {
        let direction = determineDeflectionDirection(piece);
        let row = Math.floor(parseInt(cell.dataset.index) / 8);
        let col = parseInt(cell.dataset.index) % 8;

        const moveDeflectedBullet = () => {
            row += direction[0];
            col += direction[1];
            if (row < 0 || row > 7 || col < 0 || col > 7) {
                updatePlayerTurn();
                return; // Stop if it reaches the edge
            }
            const cellIndex = row * 8 + col;
            const newCell = board.children[cellIndex];
            if (!newCell.querySelector('.bullet')) {
                const bulletDiv = document.createElement('div');
                bulletDiv.classList.add('bullet');
                newCell.appendChild(bulletDiv);
                setTimeout(() => {
                    bulletDiv.remove();
                    if (!newCell.hasChildNodes()) {
                        moveDeflectedBullet();
                    } else {
                        const newPiece = newCell.firstChild;
                        handleBulletCollision(newPiece, newCell);
                    }
                }, 500);
            }
        };
        moveDeflectedBullet();
    };

    const determineDeflectionDirection = (piece) => {
        const rotation = parseInt(piece.dataset.rotation) || 0;
        switch (rotation) {
            case 45:
                return [0, 1];  // Turn right
            case 135:
                return [0, -1]; // Turn left
            case 225:
                return [0, -1]; // Turn left
            case 315:
                return [0, 1];  // Turn right
            default:
                return [0, 1];
        }
    };

    const resetGame = () => {
        board.innerHTML = '';
        currentPlayer = 'Player 1';
        playerTurnDisplay.textContent = `${currentPlayer}'s turn`;
        player1Time = 180;
        player2Time = 180;
        updateTimers();
        placePieces(false);
        placePieces(true);
        initializeEventListeners();
        startTimer();
    };

    const initializeEventListeners = () => {
        document.querySelectorAll('.cell').forEach(cell => {
            cell.addEventListener('click', event => {
                const pieceClassList = event.target.classList;
                const isPlayer1Piece = pieceClassList.contains('titan') || pieceClassList.contains('tank') || pieceClassList.contains('cannon') || pieceClassList.contains('ricochets') || pieceClassList.contains('semi-ricochets');
                const isPlayer2Piece = pieceClassList.contains('second-set');
                const isCorrectPlayerPiece = (currentPlayer === 'Player 1' && isPlayer1Piece && !isPlayer2Piece) || (currentPlayer === 'Player 2' && isPlayer2Piece);

                if (selectedPiece && cell.classList.contains('highlight')) {
                    movePiece(event);
                } else if (isCorrectPlayerPiece) {
                    clearHighlights();
                    selectedPiece = event.target;
                    const index = parseInt(cell.dataset.index);
                    const possibleMoves = highlightMoves(index, selectedPiece.className);
                    possibleMoves.forEach(moveIndex => {
                        const targetCell = board.children[moveIndex];
                        targetCell.classList.add('highlight');
                        targetCell.addEventListener('click', movePiece);
                    });
                    if (selectedPiece.classList.contains('ricochets') || selectedPiece.classList.contains('semi-ricochets')) {
                        showRotationOptions();
                    }
                } else {
                    clearHighlights();
                }
            });
        });
    };

    initializeBoard();
    placePieces(false);
    placePieces(true);
    initializeEventListeners();
    startTimer();
});
