document.addEventListener('DOMContentLoaded', function() {
    // Input Elements
    const addColorButton = document.getElementById("add-color");
    const removeColorButton = document.getElementById("remove-color");
    const stitchesPerRowInput = document.getElementById("stitches-per-row");
    const stitchTypeSelect = document.getElementById("stitch-type");
    const colorChangeToleranceInput = document.getElementById("color-change-tolerance");
    const gridlinesCheckbox = document.getElementById("gridlines");
    const generateButton = document.getElementById("generate-button");
    const repeatLengthDisplay = document.getElementById("repeat-length");
    const decrementStitchesButton = document.getElementById("decrement-stitches");
    const incrementStitchesButton = document.getElementById("increment-stitches");
    const poolingCanvas = document.getElementById("poolingCanvas");
    const gridlineIntervalSelect = document.getElementById("gridline-interval"); // Get the new select

    addColorButton.addEventListener("click", addColor);
    removeColorButton.addEventListener("click", removeColor);

    function addColor(color = '', count = '') { // Add optional parameters
        const colorInputsContainer = document.getElementById("color-inputs");

        const inputGroup = document.createElement('div');
        inputGroup.classList.add('color-input-group');
        inputGroup.draggable = true; // Make it draggable
        addDragAndDropHandlers(inputGroup); // Add drag-and-drop handlers

        const colorInput = document.createElement('input');
        colorInput.type = 'text';
        colorInput.placeholder = 'Color Name or Hex Code';
        colorInput.classList.add('color-name-input');
        colorInput.value = color; // Set default color

        const countInput = document.createElement('input');
        countInput.type = 'number';
        countInput.placeholder = 'Stitch Count';
        countInput.classList.add('stitch-count-input');
        countInput.min = "1";
        countInput.value = count; // Set default count


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
        const tolerance = parseInt(colorChangeToleranceInput.value, 10);
        const showGridlines = gridlinesCheckbox.checked;
        const repeatCount = parseInt(document.getElementById("repeat-count").value, 10);
        const gridlineInterval = gridlineIntervalSelect.value; // Get selected interval

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
        //Pass gridlineInterval
        drawPatternToCanvas(sequence, stitchesPerRow, stitchType, tolerance, showGridlines, repeatLength, repeatCount, gridlineInterval);
    }

    function drawPatternToCanvas(sequence, stitchesPerRow, stitchType, tolerance, showGridlines, repeatLength, repeatCount, gridlineInterval) {
        const canvas = poolingCanvas;
        const ctx = canvas.getContext('2d');

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
            if (currentStitchInColor >= currentColorInfo.count + tolerance) {
                sequenceIndex = (sequenceIndex + 1) % sequence.length;
                currentColorInfo = sequence[sequenceIndex];
                currentStitchInColor = 0;
            }
        }
        let totalStitchCount = 0;
        let offset = 0;

        while (totalStitchCount < repeatLength * repeatCount) {
            const x = goingRight ? currentStitchInRow * stitchWidth : (stitchesPerRow - 1 - currentStitchInRow) * stitchWidth;
            const y = currentRow * stitchHeight;
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

        // --- Gridlines ---
        if (showGridlines || gridlineInterval === "pixel") {
            ctx.strokeStyle = 'lightgray';
            ctx.lineWidth = 1;
            for (let i = 0; i <= canvas.height / stitchHeight; i++) {
                ctx.beginPath();
                ctx.moveTo(0, i * stitchHeight);
                ctx.lineTo(canvas.width, i * stitchHeight);
                ctx.stroke();
            }
            for (let i = 0; i <= stitchesPerRow; i++) {
                ctx.beginPath();
                ctx.moveTo(i * stitchWidth, 0);
                ctx.lineTo(i * stitchWidth, canvas.height);
                ctx.stroke();
            }
        }

        // Draw major gridlines and labels
        if (gridlineInterval !== "pixel" && !isNaN(parseInt(gridlineInterval))) {
            const interval = parseInt(gridlineInterval);
            ctx.strokeStyle = 'black'; // Major gridlines are black
            ctx.lineWidth = 2; // Thicker lines
            ctx.font = "12px sans-serif"; // Font for labels

            // Vertical lines and labels
            for (let i = interval; i < stitchesPerRow; i += interval) {
                const x = i * stitchWidth;
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, canvas.height);
                ctx.stroke();
                ctx.fillText(i, x + 2, 10); // Add label (x + 2 for slight offset)
            }

            // Horizontal lines and labels
            for (let i = interval; i < canvas.height / stitchHeight; i += interval) {
                const y = i * stitchHeight;
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(canvas.width, y);
                ctx.stroke();
                ctx.fillText(i, 2, y - 2);  // Add label (y - 2 for slight offset)
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

    let dragSrcEl = null; // Keep track of the element being dragged

    function handleDragStart(e) {
        dragSrcEl = this; // 'this' refers to the element being dragged
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', this.innerHTML);
        this.classList.add('dragging'); // Add dragging class for styling
    }

    function handleDragOver(e) {
        if (e.preventDefault) {
            e.preventDefault(); // Necessary. Allows us to drop.
        }
        e.dataTransfer.dropEffect = 'move';
        return false;
    }

    function handleDragEnter(e) {
        this.classList.add('over'); // Add a class for visual feedback
    }

    function handleDragLeave(e) {
        this.classList.remove('over'); // Remove the class
    }

    function handleDrop(e) {
        if (e.stopPropagation) {
            e.stopPropagation(); // Stops the browser from redirecting.
        }

        // Don't do anything if dropping the same column we're dragging.
        if (dragSrcEl != this) {
            // Get the parent element (the color-inputs container)
            const parent = this.parentNode;

            // Get the next sibling of the target element
            const nextSibling = this.nextSibling;

            // Insert the dragged element before the target element
            parent.insertBefore(dragSrcEl, this);

            // If the target had a next sibling, insert the target before it
            // Otherwise, append the target to the parent (it was the last child)
            if (nextSibling) {
                parent.insertBefore(this, nextSibling);
            } else {
                parent.appendChild(this);
            }
        }

        return false;
    }

    function handleDragEnd(e) {
        // Remove the 'dragging' class from all color input groups
        const colorInputGroups = document.querySelectorAll('.color-input-group');
        colorInputGroups.forEach(function(group) {
            group.classList.remove('dragging');
            group.classList.remove('over');
        });
        generatePattern(); // Regenerate the pattern after drag-and-drop
    }

    // --- Default Colors ---
    addColor('blue', '4');
    addColor('yellow', '2');
    addColor('red', '3');
    addColor('yellow', '2');
    generatePattern(); //make sure pattern generates on load.
});