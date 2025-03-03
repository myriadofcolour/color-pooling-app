document.addEventListener('DOMContentLoaded', function() {
    // Input Elements
    const addColorButton = document.getElementById("add-color");
    const removeColorButton = document.getElementById("remove-color");
    const stitchesPerRowInput = document.getElementById("stitches-per-row");
    const stitchTypeSelect = document.getElementById("stitch-type");
    const gridlinesCheckbox = document.getElementById("show-outline");
    const generateButton = document.getElementById("generate-button");
    const repeatLengthDisplay = document.getElementById("repeat-length");
    const decrementStitchesButton = document.getElementById("decrement-stitches");
    const incrementStitchesButton = document.getElementById("increment-stitches");
    const poolingCanvas = document.getElementById("poolingCanvas");
    const gridlineIntervalSelect = document.getElementById("gridline-interval");

    addColorButton.addEventListener("click", addColor);
    removeColorButton.addEventListener("click", removeColor);

    function addColor(color = '', count = '') {
        const colorInputsContainer = document.getElementById("color-inputs");

        const inputGroup = document.createElement('div');
        inputGroup.classList.add('color-input-group');
        inputGroup.draggable = true;
        addDragAndDropHandlers(inputGroup);

        const colorInput = document.createElement('input');
        colorInput.type = 'text';
        colorInput.placeholder = 'Color Name or Hex Code';
        colorInput.classList.add('color-name-input');
        colorInput.value = color;

        const countInput = document.createElement('input');
        countInput.type = 'number';
        countInput.placeholder = 'Stitch Count';
        countInput.classList.add('stitch-count-input');
        countInput.min = "1";
        countInput.value = count;


        const preview = document.createElement('div');
        preview.classList.add('color-preview');
        preview.style.backgroundColor = color;

        colorInput.addEventListener('input', function() {
            preview.style.backgroundColor = this.value;
        });

        inputGroup.appendChild(colorInput);
        inputGroup.appendChild(countInput);
        inputGroup.appendChild(preview);
        colorInputsContainer.appendChild(inputGroup);
    }

    function removeColor() {
        const colorInputsContainer = document.getElementById("color-inputs");
        const inputGroups = colorInputsContainer.getElementsByClassName('color-input-group');
        if (inputGroups.length > 0) {
            colorInputsContainer.removeChild(inputGroups[inputGroups.length - 1]);
        }
    }

    decrementStitchesButton.addEventListener("click", () => {
        let currentValue = parseInt(stitchesPerRowInput.value, 10);
        if (currentValue > 1) {
            stitchesPerRowInput.value = currentValue - 1;
            generatePattern();
        }
    });

    incrementStitchesButton.addEventListener("click", () => {
        let currentValue = parseInt(stitchesPerRowInput.value, 10);
        stitchesPerRowInput.value = currentValue + 1;
        generatePattern();
    });

    function parseColorSequence() {
        const colorInputsContainer = document.getElementById("color-inputs");
        const inputGroups = colorInputsContainer.getElementsByClassName('color-input-group');
        const sequence = [];

        for (const inputGroup of inputGroups) {
            const colorInput = inputGroup.querySelector('.color-name-input');
            const countInput = inputGroup.querySelector('.stitch-count-input');

            const color = colorInput.value.trim();
            const count = parseInt(countInput.value, 10);

            if (color && !isNaN(count)) {
                sequence.push({ color, count });
            }
        }
        return sequence;
    }

    generateButton.addEventListener("click", generatePattern);

    function generatePattern() {
        const sequence = parseColorSequence();
        const stitchesPerRow = parseInt(stitchesPerRowInput.value, 10);
        const stitchType = stitchTypeSelect.value;
        const showGridlines = gridlinesCheckbox.checked;
        const repeatCount = parseInt(document.getElementById("repeat-count").value, 10);
        const gridlineInterval = gridlineIntervalSelect.value;

        const totalStitchesInSequence = sequence.reduce((sum, item) => sum + item.count, 0);
        const repeatLength = lcm(totalStitchesInSequence, stitchesPerRow);
        repeatLengthDisplay.textContent = "Pattern repeats every " + repeatLength + " stitches.";

        function gcd(a, b) {
            while (b) {
                [a, b] = [b, a % b];
            }
            return a;
        }

        function lcm(a, b) {
            return (a * b) / gcd(a, b);
        }

        drawPatternToCanvas(sequence, stitchesPerRow, stitchType, showGridlines, repeatLength, repeatCount, gridlineInterval);
    }

    function drawPatternToCanvas(sequence, stitchesPerRow, stitchType, showGridlines, repeatLength, repeatCount, gridlineInterval) {
        const canvas = poolingCanvas;
        const ctx = canvas.getContext('2d');

        // --- OFFSETS (Match CSS Padding) ---
        const topOffset = 20;  // Match CSS padding-top
        const leftOffset = 30; // Match CSS padding-left
        const labelOffset = 5; // Fine-tuning.

        const stitchWidth = 10;
        let stitchHeight;
        switch (stitchType) {
            case 'sc': stitchHeight = 10; break;
            case 'dc': stitchHeight = 20; break;
            case 'hdc': stitchHeight = 15; break;
            case 'tr': stitchHeight = 30; break;
            case 'linen': stitchHeight = 20; break;
            default: stitchHeight = 10;
        }

        // --- CORRECT Canvas Size Calculation ---
        canvas.width = stitchesPerRow * stitchWidth;
        canvas.height = Math.ceil(repeatLength * repeatCount / stitchesPerRow) * stitchHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        let currentRow = 0;
        let currentStitchInRow = 0;
        let sequenceIndex = 0;
        let currentStitchInColor = 0;
        let currentColorInfo = sequence[sequenceIndex];
        let goingRight = true;

        function getCurrentColor() {
            return sequence[sequenceIndex].color;
        }

        function advanceToNextColor() {
            currentStitchInColor++;
            if (currentStitchInColor >= currentColorInfo.count) {
                sequenceIndex = (sequenceIndex + 1) % sequence.length;
                currentColorInfo = sequence[sequenceIndex];
                currentStitchInColor = 0;
            }
        }
        let totalStitchCount = 0;
        let offset = 0;

        // --- Draw Stitches (WITH OFFSETS) ---
        while (totalStitchCount < repeatLength * repeatCount) {
            // Apply offsets here!
            const x = (goingRight ? currentStitchInRow * stitchWidth : (stitchesPerRow - 1 - currentStitchInRow) * stitchWidth) + leftOffset;
            const y = (currentRow * stitchHeight) + topOffset;
            const currentColor = getCurrentColor();

            if (stitchType === 'linen') {
                offset = 2;
                let drawStitch = false;
                if (goingRight) {
                    drawStitch = (currentStitchInRow + (currentRow % 2)) % 2 === 0;
                } else {
                    drawStitch = ((stitchesPerRow - 1) - currentStitchInRow + (currentRow % 2)) % 2 === 0;
                }

                if (drawStitch) {
                    ctx.fillStyle = currentColor;
                    ctx.fillRect(x, y, stitchWidth, stitchHeight);
                }

                if ((currentStitchInRow + (currentRow % 2)) % 2 === 0) {
                    advanceToNextColor();
                }
            } else {
                ctx.fillStyle = currentColor;
                ctx.fillRect(x, y, stitchWidth, stitchHeight);
                advanceToNextColor();
            }

            currentStitchInRow++;
            totalStitchCount++;

            if (currentStitchInRow >= stitchesPerRow) {
                currentStitchInRow = 0;
                currentRow++;
                goingRight = !goingRight;
            }
        }
// --- Draw Major Gridlines (BEFORE Labels, WITH OFFSETS) ---
if (!isNaN(parseInt(gridlineInterval))) {
    const interval = parseInt(gridlineInterval);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.font = "12px sans-serif";
    ctx.fillStyle = 'black';

    // Vertical lines (WITH OFFSETS)
    for (let i = interval; i < stitchesPerRow; i += interval) {
        const x = i * stitchWidth + leftOffset; // Add offset
        ctx.beginPath();
        ctx.moveTo(x, topOffset); // Start from topOffset
        ctx.lineTo(x, canvas.height + topOffset);  // Go down to canvas.height + topOffset
        ctx.stroke();
    }

    // Horizontal lines (WITH OFFSETS)
    for (let i = interval; i < canvas.height / stitchHeight; i += interval) {
        const y = i * stitchHeight + topOffset; // Add offset
        ctx.beginPath();
        ctx.moveTo(leftOffset, y); // Start from leftOffset
        ctx.lineTo(canvas.width + leftOffset, y); // Extend past canvas
        ctx.stroke();
    }
}


// --- Draw Thin Gridlines (BEFORE Labels, WITH OFFSETS) ---
if (showGridlines) {
    ctx.strokeStyle = 'lightgray';
    ctx.lineWidth = 1;
    for (let i = 0; i <= canvas.height / stitchHeight; i++) {
        ctx.beginPath();
        ctx.moveTo(leftOffset, i * stitchHeight + topOffset); // Add offsets
        ctx.lineTo(canvas.width + leftOffset, i * stitchHeight + topOffset); // Add offsets and extend
        ctx.stroke();
    }
    for (let i = 0; i <= stitchesPerRow; i++) {
        ctx.beginPath();
        ctx.moveTo(i * stitchWidth + leftOffset, topOffset); // Add offsets
        ctx.lineTo(i * stitchWidth + leftOffset, canvas.height + topOffset); // Add offsets and extend
        ctx.stroke();
    }
}

// --- Draw Labels (WITH CORRECT OFFSETS, and *AFTER* drawing everything else) ---
if (!isNaN(parseInt(gridlineInterval))) {
    const interval = parseInt(gridlineInterval);
    const fontSize = 12;

    // Top Labels (Vertical Gridlines)
    for (let i = interval; i < stitchesPerRow; i += interval) {
        const x = i * stitchWidth + leftOffset; // Canvas x + container offset
        const label = String(i);
        const textWidth = ctx.measureText(label).width;
        // CORRECTED Y:  Use topOffset - fontSize (to move it above)
        ctx.fillText(label, x - textWidth / 2, topOffset - 4); // Center horizontally
    }

    // Left Labels (Horizontal Gridlines)
    for (let i = interval; i < canvas.height / stitchHeight; i += interval) {
        const y = i * stitchHeight + topOffset;  // Canvas y + container offset
        // CORRECTED X: Use leftOffset, subtract a little for visual centering.
        ctx.fillText(i, 3, y + fontSize / 2 - 2); // Adjust vertical centering
    }
}
}

// --- Drag and Drop Functionality ---
function addDragAndDropHandlers(element) {
element.addEventListener('dragstart', handleDragStart);
element.addEventListener('dragover', handleDragOver);
element.addEventListener('dragenter', handleDragEnter);
element.addEventListener('dragleave', handleDragLeave);
element.addEventListener('drop', handleDrop);
element.addEventListener('dragend', handleDragEnd);
}

let dragSrcEl = null;

function handleDragStart(e) {
dragSrcEl = this;
e.dataTransfer.effectAllowed = 'move';
e.dataTransfer.setData('text/html', this.innerHTML);
this.classList.add('dragging');
}

function handleDragOver(e) {
if (e.preventDefault) {
    e.preventDefault();
}
e.dataTransfer.dropEffect = 'move';
return false;
}

function handleDragEnter(e) {
this.classList.add('over');
}

function handleDragLeave(e) {
this.classList.remove('over');
}

function handleDrop(e) {
if (e.stopPropagation) {
    e.stopPropagation();
}
if (dragSrcEl != this) {
    const parent = this.parentNode;
    const nextSibling = this.nextSibling;
    parent.insertBefore(dragSrcEl, this);

    if (nextSibling) {
        parent.insertBefore(this, nextSibling);
    } else {
        parent.appendChild(this);
    }
}

return false;
}

function handleDragEnd(e) {
const colorInputGroups = document.querySelectorAll('.color-input-group');
colorInputGroups.forEach(function(group) {
    group.classList.remove('dragging');
    group.classList.remove('over');
});
generatePattern();
}

// --- Default Colors ---
addColor('blue', '4');
addColor('yellow', '2');
addColor('red', '3');
addColor('yellow', '2');
generatePattern();
});