const CELL_PIXEL_SIZE = 20;
const TOTAL_COLUMNS = 25;
const TOTAL_ROWS = 50;

function main() {

    // Default values for interface inputs
    let helpShown = true;
    let gridOn = false;
    let song = document.createElement("audio");
    song.src = "/megalovania.mp3"
    document.getElementById("bpmDisplay").innerText = "BPM: " + document.getElementById("bpmInput").value.padStart(3, '0');

    // Hook up inputs
    document.getElementById("stepButton").onclick = toggleSimulation;
    document.getElementById("restartButton").onclick = restartAudio;
    document.getElementById("gridButton").onclick = toggleGrid;
    document.getElementById("clearButton").onclick = clearCanvas;
    document.getElementById("mp3Input").onchange = updateAudio;
    document.getElementById("helpButton").onclick = toggleHelp;
    document.getElementById("rRange").oninput = updateColors;
    document.getElementById("gRange").oninput = updateColors;
    document.getElementById("bRange").oninput = updateColors;
    document.getElementById("helpDisplay").onclick = hideHelp;
    document.getElementById("removeButton").onclick = removeSong;
    document.getElementById("bpmInput").onchange = updateSpeed;

    // Initialize canvas
    const canvas = document.getElementById('boardDisplay');

    // Initialize array with Zeroes
    let boardArray = Array(TOTAL_ROWS).fill(0).map(() => Array(TOTAL_COLUMNS).fill(0));


    // Check support for canvas
    if (!canvas.getContext) {
        return;
    }

    // Get render context
    let ctx = canvas.getContext('2d');
    redrawBoardDisplay(boardArray);


    let paint = false
    canvas.addEventListener("mousedown", (event) => paint = true);
    canvas.addEventListener("mouseup", (event) => paint = false);
    canvas.addEventListener("mousemove", highlightMouseTile);
    canvas.addEventListener("click", highlightMouseTile);


    function highlightMouseTile(event) {
        if (!paint && event.type !== "click") {
            return;
        }
        let rect = canvas.getBoundingClientRect();

        let mouseX = Math.floor(event.clientX - rect.left);
        let mouseY = Math.floor(event.clientY - rect.top);

        boardArray[Math.floor(mouseX / CELL_PIXEL_SIZE)][Math.floor(mouseY / CELL_PIXEL_SIZE)] = 1;
        redrawBoardDisplay(boardArray);
    }

    // update display with array for next cycle
    function redrawBoardDisplay(updatedArray) {

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // loop through array and color if cell is alive
        for (let r = 0; r < TOTAL_ROWS; r++) {
            for (let c = 0; c < TOTAL_COLUMNS; c++) {

                if (updatedArray[r][c] === 1) {

                    // get selected color value
                    let rVal = document.getElementById("rRange").value;
                    let gVal = document.getElementById("gRange").value;
                    let bVal = document.getElementById("bRange").value;

                    ctx.fillStyle = `rgb(${rVal},${gVal},${bVal})`;
                    ctx.fillRect((r * CELL_PIXEL_SIZE), (c * CELL_PIXEL_SIZE), CELL_PIXEL_SIZE, CELL_PIXEL_SIZE);
                }

                // Draw grid
                if (gridOn) {
                    ctx.strokeStyle = "#ababab";
                    ctx.strokeRect((r * CELL_PIXEL_SIZE), (c * CELL_PIXEL_SIZE), CELL_PIXEL_SIZE, CELL_PIXEL_SIZE);
                }
            }
        }
    }


    // Starts the simulation based on what exists in the canvas
    let interval = null;
    let intervalMS = 500;
    function toggleSimulation(e) {
        e.preventDefault();

        let icon = document.getElementById("stepIcon");
        let sans = document.getElementById("sans");

        if (interval === null) {
            interval = setInterval(runGeneration, intervalMS);
            icon.classList.replace("fa-play", "fa-pause");
            song.play().then().catch(()=>console.log("NO AUDIO FILE SPECIFIED"));
            sans.src = "/sans.gif";
        }
        else {
            clearInterval(interval);
            icon.classList.replace("fa-pause", "fa-play");
            interval = null;
            song.pause();
            sans.src = "/sans-still.png";
        }
    }

    function restartAudio(e) {
        e.preventDefault();
        song.currentTime = 0;
        toggleSimulation(e);    // Trigger cell propagation immediately to ensure same tempo
        toggleSimulation(e);    // Need to call again to reset icon to original status
    }

    function toggleGrid(e) {
        e.preventDefault();

        let icon = document.getElementById("gridIcon");
        if (gridOn) {
            gridOn = false;
            redrawBoardDisplay(boardArray);
            icon.classList.replace("fa-border-all", "fa-border-none");
        }
        else {
            gridOn = true;
            redrawBoardDisplay(boardArray);
            icon.classList.replace("fa-border-none", "fa-border-all");
        }
    }

    function clearCanvas(e) {
        e.preventDefault();

        // Initialize new array with Zeroes
        boardArray = Array(TOTAL_ROWS).fill(0).map(() => Array(TOTAL_COLUMNS).fill(0));
        redrawBoardDisplay(boardArray);
    }

    function updateAudio(e) {
        e.preventDefault();

        let uploadedFile = document.getElementById("mp3Input").files[0];

        document.getElementById("nowPlaying").innerText = "Selected song: " + uploadedFile.name;
        document.getElementById("removeButton").style.display = "inline";

        song.src = URL.createObjectURL(uploadedFile);
    }

    function toggleHelp(e) {
        e.preventDefault();

        let helpDisplay = document.getElementById("helpDisplay");

        if (helpShown) {
            helpDisplay.style.display = "none";
        }
        else {
            helpDisplay.style.display = "block";
        }

        helpShown = !helpShown;
    }
    function updateColors(e) {
        e.preventDefault();
        redrawBoardDisplay(boardArray);
    }

    function hideHelp(e) {
        e.preventDefault();
        document.getElementById("helpDisplay").style.display = "none";
        helpShown = false;
    }

    function removeSong(e) {
        e.preventDefault();

        if (interval != null) {
            clearInterval(interval);
            document.getElementById("stepIcon").classList.replace("fa-pause", "fa-play");
            interval = null;
        }

        song.pause();
        song = document.createElement("audio");

        document.getElementById("nowPlaying").innerText = "Selected song: none";
        document.getElementById("removeButton").style.display = "none";
    }

    function updateSpeed(e) {
        e.preventDefault();
        let rangeValue = document.getElementById("bpmInput").value;
        intervalMS = 60000 / rangeValue;
        clearInterval(interval);
        document.getElementById("stepIcon").classList.replace("fa-pause", "fa-play");
        document.getElementById("bpmDisplay").innerText = "BPM: " + rangeValue.padStart(3, '0');
        interval = null;
        song.pause();
        song.currentTime = 0;
    }

    // execute one cycle of the simulation
    // note: unfortunately this function cannot be combined with redrawBoardDisplay as it would prevent live updating via mouse click
    function runGeneration() {

        // must maintain a separate array of results to avoid conflicts during iteration
        let newBoardArray = Array(TOTAL_ROWS).fill(0).map(() => Array(TOTAL_COLUMNS).fill(0));

        for (let r = 0; r < TOTAL_ROWS; r++) {
            for (let c = 0; c < TOTAL_COLUMNS; c++) {
                newBoardArray[r][c] = cellStatus(r,c);
            }
        }

        boardArray = newBoardArray;
        redrawBoardDisplay(boardArray);
    }

    // Evaluates the status of a single cell based on Conway's rules
    function cellStatus(r, c) {
        let lookups = [[0,1], [1,1], [1,0], [1,-1], [0,-1], [-1,-1], [-1,0], [-1,1]];
        let totalNeighbors = 0;

        lookups.forEach((entry)=>{
            let neighborRow = r + entry[1];
            let neighborCol = c + entry[0];

            if (neighborRow > TOTAL_ROWS - 1 || neighborRow < 0 || neighborCol > TOTAL_COLUMNS - 1 || neighborCol < 0) {
                return; //Outside of bounds
            }

            if (boardArray[neighborRow][neighborCol] === 1) {
                totalNeighbors++;
            }
        });

        if (boardArray[r][c] === 1 && totalNeighbors < 2) {
            return 0;
        }
        else if (boardArray[r][c] === 1 && totalNeighbors > 3) {
            return 0;
        }
        else if (boardArray[r][c] === 0 && totalNeighbors === 3) {
            return 1;
        }
        else {
            return boardArray[r][c];
        }

    }
}
