document.addEventListener('DOMContentLoaded', function() {
    // --- Input Elements --- (No changes here)
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

    // --- Event Listeners for Add/Remove Color --- (No changes here)
    addColorButton.addEventListener("click", addColor);
    removeColorButton.addEventListener("click", removeColor);

    // --- Function to Add Color Input --- (No changes here)
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

        // Update preview on color input change
        colorInput.addEventListener('input', function() {
            preview.style.backgroundColor = this.value;
        });

        inputGroup.appendChild(colorInput);
        inputGroup.appendChild(countInput);
        inputGroup.appendChild(preview);
        colorInputsContainer.appendChild(inputGroup);
    }

    // --- Function to Remove Color Input --- (No changes here)
    function removeColor() {
        const colorInputsContainer = document.getElementById("color-inputs");
        const inputGroups = colorInputsContainer.getElementsByClassName('color-input-group');
        if (inputGroups.length > 0) {
            colorInputsContainer.removeChild(inputGroups[inputGroups.length - 1]);
        }
    }

    // --- Event Listeners for Stitch Count Control --- (No changes here)
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

    // --- Function to Parse Color Sequence --- (No changes here)
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

    // --- Event Listener for Generate Button --- (No changes here)
    generateButton.addEventListener("click", generatePattern);


    // --- Main Function to Generate Pattern --- (No changes here)
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

        // Greatest Common Divisor
        function gcd(a, b) {
            while (b) {
                [a, b] = [b, a % b];
            }
            return a;
        }

        // Least Common Multiple
        function lcm(a, b) {
            return (a * b) / gcd(a, b);
        }

        drawPatternToCanvas(sequence, stitchesPerRow, stitchType, showGridlines, repeatLength, repeatCount, gridlineInterval);
    }

    // --- Function to Draw Pattern on Canvas --- (No changes here)
    function drawPatternToCanvas(sequence, stitchesPerRow, stitchType, showGridlines, repeatLength, repeatCount, gridlineInterval) {
        const canvas = poolingCanvas;
        const ctx = canvas.getContext('2d');

        // Offsets for drawing (match CSS padding)
        const topOffset = 20;
        const leftOffset = 30;

        const stitchWidth = 10;
        let stitchHeight;
        switch (stitchType) {
            case 'sc':   stitchHeight = 10;   break;
            case 'dc':   stitchHeight = 20;   break;
            case 'hdc':  stitchHeight = 15;   break;
            case 'tr':   stitchHeight = 30;   break;
            case 'linen':stitchHeight = 20;   break;
            default:     stitchHeight = 10;
        }

        // Determine effective stitches per row (linen uses double cells)
        const effectiveStitches = (stitchType === 'linen') ? stitchesPerRow * 2 : stitchesPerRow;

        // Set canvas size including offsets
        canvas.width = effectiveStitches * stitchWidth + leftOffset;
        // For linen, rows are based on drawn stitches (half per row)
        canvas.height = Math.ceil((repeatLength * repeatCount) / stitchesPerRow) * stitchHeight + topOffset;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        let currentRow = 0;
        let currentStitchInCol = 0;
        let sequenceIndex = 0;
        let currentStitchInColor = 0;
        let currentColorInfo = sequence[sequenceIndex];
        let goingRight = true; // Direction of stitching

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

        // Draw stitches
        while (totalStitchCount < repeatLength * repeatCount) {
            const x = (goingRight ? currentStitchInCol * stitchWidth : (effectiveStitches - 1 - currentStitchInCol) * stitchWidth) + leftOffset;
            const y = currentRow * stitchHeight + topOffset;
            const currentColor = getCurrentColor();

            if (stitchType === 'linen') {
                // For linen, only every other cell gets a stitch
                const shouldDraw = goingRight
                    ? ((currentStitchInCol + (currentRow % 2)) % 2 === 0)
                    : (((effectiveStitches - 1 - currentStitchInCol) + (currentRow % 2)) % 2 === 0);

                if (shouldDraw) {
                    ctx.fillStyle = currentColor;
                    ctx.fillRect(x, y, stitchWidth, stitchHeight);
                    advanceToNextColor();
                    totalStitchCount++;
                }
            } else {
                ctx.fillStyle = currentColor;
                ctx.fillRect(x, y, stitchWidth, stitchHeight);
                advanceToNextColor();
                totalStitchCount++;
            }

            currentStitchInCol++;
            if (currentStitchInCol >= effectiveStitches) {
                currentStitchInCol = 0;
                currentRow++;
                goingRight = !goingRight; // Change direction
            }
        }

        // --- Gridline Drawing Functions ---
        function drawMajorGridlines(interval, stitchType) {
            if (isNaN(parseInt(interval))) return;

            ctx.strokeStyle = 'black';
            ctx.lineWidth = 2;

            if (stitchType === 'linen') {
                // Linen Stitch Gridline Logic (COMPLETELY REWRITTEN and CORRECT)
                for (let i = parseInt(interval); i < stitchesPerRow; i += parseInt(interval)) {
                    // Calculate the x position based on the ACTUAL stitch count,
                    // accounting for the double-wide cells.
                    const x = leftOffset + i * stitchWidth * 2 + stitchWidth; // + stitchWidth to put it AFTER the stitch
                    ctx.beginPath();
                    ctx.moveTo(x, topOffset);
                    ctx.lineTo(x, canvas.height);
                    ctx.stroke();

                }
            } else {
                // Original logic for non-linen stitches
                for (let i = parseInt(interval); i < effectiveStitches; i += parseInt(interval)) {
                    const x = i * stitchWidth + leftOffset;
                    ctx.beginPath();
                    ctx.moveTo(x, topOffset);
                    ctx.lineTo(x, canvas.height);
                    ctx.stroke();
                }
            }

            // Horizontal lines (no change needed)
            for (let i = parseInt(interval); i * stitchHeight < canvas.height - topOffset; i += parseInt(interval)) {
                const y = i * stitchHeight + topOffset;
                ctx.beginPath();
                ctx.moveTo(leftOffset, y);
                ctx.lineTo(canvas.width, y);
                ctx.stroke();
            }
        }

        function drawThinGridlines() {
            if (!showGridlines) return;

            ctx.strokeStyle = 'lightgray';
            ctx.lineWidth = 1;
            for (let i = 0; i <= (canvas.height - topOffset) / stitchHeight; i++) {
                ctx.beginPath();
                ctx.moveTo(leftOffset, i * stitchHeight + topOffset);
                ctx.lineTo(canvas.width, i * stitchHeight + topOffset);
                ctx.stroke();
            }
            for (let i = 0; i <= effectiveStitches; i++) {
                ctx.beginPath();
                ctx.moveTo(i * stitchWidth + leftOffset, topOffset);
                ctx.lineTo(i * stitchWidth + leftOffset, canvas.height);
                ctx.stroke();
            }
        }

        function drawGridLabels(interval, stitchType) {
            if (isNaN(parseInt(interval))) return;

            const fontSize = 12;
            ctx.fillStyle = 'black';

            if (stitchType === 'linen') {
                // Linen Stitch Label Logic (COMPLETELY REWRITTEN and CORRECT)
                for (let i = parseInt(interval); i < stitchesPerRow; i += parseInt(interval)) {
                    // Calculate the x position based on the ACTUAL stitch count
                    const x = leftOffset + i * stitchWidth * 2 + stitchWidth;  // + stitchWidth to put it AFTER the stitch
                    const label = String(i);
                    const textWidth = ctx.measureText(label).width;
                    ctx.fillText(label, x - textWidth / 2, topOffset - 4);
                }

            } else {
                // Original logic for non-linen stitches
                for (let i = parseInt(interval); i < effectiveStitches; i += parseInt(interval)) {
                    const x = i * stitchWidth + leftOffset;
                    const label = String(i);
                    const textWidth = ctx.measureText(label).width;
                    ctx.fillText(label, x - textWidth / 2, topOffset - 4);
                }
            }

            // Horizontal labels (no change needed)
            for (let i = parseInt(interval); i * stitchHeight < canvas.height - topOffset; i += parseInt(interval)) {
                const y = i * stitchHeight + topOffset;
                ctx.fillText(i, 3, y + fontSize / 2 - 2);
            }
        }

        // Draw gridlines and labels based on settings
        if (gridlineInterval !== 'none') {
            drawMajorGridlines(gridlineInterval, stitchType);
            drawGridLabels(gridlineInterval, stitchType);
        }

        // Draw border outline separately (always if checked)
        if (document.getElementById("show-outline").checked) {
            drawThinGridlines();
        }
    }
     // --- Drag and Drop Functions ---
    function addDragAndDropHandlers(element) {
        element.addEventListener('dragstart', handleDragStart);
        element.addEventListener('dragover', handleDragOver); // Needed to allow drop
        element.addEventListener('drop', handleDrop);
        element.addEventListener('dragend', handleDragEnd);
    }

    let dragSrcEl = null; // Element being dragged

    function handleDragStart(e) {
        dragSrcEl = this;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', this.innerHTML);
        this.classList.add('dragging');
    }

    function handleDragOver(e) {
        if (e.preventDefault) {
            e.preventDefault(); // Necessary to allow dropping
        }
        e.dataTransfer.dropEffect = 'move';
        return false;
    }

    function handleDrop(e) {
        if (e.stopPropagation) {
            e.stopPropagation(); // Stops browser redirection
        }

        if (dragSrcEl != this) {
            const parent = this.parentNode;
            const nextSibling = this.nextSibling;

            // Move dragged element before drop target
            parent.insertBefore(dragSrcEl, this);

            // Re-insert original target if needed
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
        });
        generatePattern(); // Regenerate pattern after reordering
    }

    // --- Initialize with Default Colors ---
    addColor('blue', '4');
    addColor('yellow', '2');
    addColor('red', '3');
    addColor('yellow', '2');
    generatePattern(); // Generate initial pattern
});