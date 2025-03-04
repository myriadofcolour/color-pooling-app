document.addEventListener('DOMContentLoaded', function() {
    // --- Input Elements ---
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

    // --- Event Listeners ---
    // KEEP THIS FIX: Use anonymous function to prevent passing the event.
    addColorButton.addEventListener("click", function() { addColor(); });
    removeColorButton.addEventListener("click", removeColor);
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
    generateButton.addEventListener("click", generatePattern);

   // --- Helper Functions ---
    function addColor(color = '', count = '') { // Keep default parameters
        const colorInputsContainer = document.getElementById("color-inputs");
        const inputGroup = document.createElement('div');
        inputGroup.classList.add('color-input-group');
        inputGroup.draggable = true;
        addDragAndDropHandlers(inputGroup);

        const colorInput = document.createElement('input');
        colorInput.type = 'text';
        colorInput.placeholder = 'Color Name or Hex Code';
        colorInput.classList.add('color-name-input');
        colorInput.value = color; // Use default '' if no color provided

        const countInput = document.createElement('input');
        countInput.type = 'number';
        countInput.placeholder = 'Stitch Count';
        countInput.classList.add('stitch-count-input');
        countInput.min = "1";
        countInput.value = count; // Use default '' if no count provided.

        const preview = document.createElement('div');
        preview.classList.add('color-preview');
        preview.style.backgroundColor = color; // Use default '' if no color

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

    // --- Main Generate Pattern Function --- (No Changes)
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

    // --- **RESTORED drawPatternToCanvas FUNCTION (from before addColor fix)** ---
    function drawPatternToCanvas(sequence, stitchesPerRow, stitchType, showGridlines, repeatLength, repeatCount, gridlineInterval) {
        const canvas = poolingCanvas;
        const ctx = canvas.getContext('2d');

        const topOffset = 20;
        const leftOffset = 30;
        const stitchWidth = 10;
        const stitchHeight = (stitchType === 'linen') ? 10 : (stitchType === 'dc' ? 20 : (stitchType === 'hdc' ? 15 : (stitchType === 'tr' ? 30 : 10)));

        canvas.width = stitchesPerRow * stitchWidth + leftOffset;
        canvas.height = Math.ceil((repeatLength * repeatCount) / stitchesPerRow) * stitchHeight + topOffset;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        let totalStitchCount = 0;
        let sequenceIndex = 0;
        let currentStitchInColor = 0;

        function getCurrentColor() {
            return sequence[sequenceIndex].color;
        }

        function advanceColor() {
            currentStitchInColor++;
            if (currentStitchInColor >= sequence[sequenceIndex].count) {
                sequenceIndex = (sequenceIndex + 1) % sequence.length;
                currentStitchInColor = 0;
            }
        }

        function reverseColor() {
            currentStitchInColor--;
            if (currentStitchInColor < 0) {
                sequenceIndex = (sequenceIndex - 1 + sequence.length) % sequence.length; // Correct wrap-around
                currentStitchInColor = sequence[sequenceIndex].count - 1; // Last stitch of previous color
            }
        }

        for (let row = 0; row < Math.ceil((repeatLength * repeatCount) / stitchesPerRow); row++) {
            const y = row * stitchHeight + topOffset;
            const goingRight = row % 2 === 0;

            for (let col = 0; col < stitchesPerRow; col++) {
                const x = goingRight ? (col * stitchWidth + leftOffset) : ((stitchesPerRow - 1 - col) * stitchWidth + leftOffset);

                if (stitchType === 'linen') {
                    // Linen Stitch Logic
                    const shouldDraw = goingRight ? (row + col) % 2 !== 0 : (row + (stitchesPerRow - 1 - col)) % 2 !== 0;

                    if (shouldDraw) {
                        ctx.fillStyle = getCurrentColor();
                        ctx.fillRect(x, y, stitchWidth, stitchHeight);
                        if(goingRight){
                            advanceColor();
                        } else {
                            reverseColor();
                        }
                        totalStitchCount++;
                    }
                    else{
                         if(!goingRight){
                            reverseColor(); //when its just a regular linen stitch
                        }
                    }
                } else {
                    // All other stitch types
                    ctx.fillStyle = getCurrentColor();
                    ctx.fillRect(x, y, stitchWidth, stitchHeight);
                    advanceColor();
                    totalStitchCount++;
                }
                if(totalStitchCount>= repeatLength * repeatCount) break;
            }
            if(totalStitchCount>= repeatLength * repeatCount) break;
        }

        // --- Gridline and Label Drawing Functions --- (Corrected for Linen)

        function drawMajorGridlines(interval, stitchType) {
            if (isNaN(parseInt(interval))) return;

            ctx.strokeStyle = 'black';
            ctx.lineWidth = 2;
            //for linen stitch, each drawn stitch is two spaces
            let effectiveStitchWidth = (stitchType === "linen")? stitchWidth * 2 : stitchWidth;

            for (let i = parseInt(interval); i < stitchesPerRow; i += parseInt(interval)) {
                const x = leftOffset + i * effectiveStitchWidth;  // Use effective width
                ctx.beginPath();
                ctx.moveTo(x, topOffset);
                ctx.lineTo(x, canvas.height);
                ctx.stroke();
            }

            for (let i = parseInt(interval); i * stitchHeight < canvas.height - topOffset; i += parseInt(interval)) {
                const y = i * stitchHeight + topOffset;
                ctx.beginPath();
                ctx.moveTo(leftOffset, y);
                ctx.lineTo(canvas.width, y); // No special handling
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
            //for linen stitch, each drawn stitch is two spaces
            let effectiveStitchWidth = (stitchType === "linen")? stitchWidth * 2 : stitchWidth;

            for (let i = 0; i <= stitchesPerRow; i++) { // No special handling
                ctx.beginPath();
                ctx.moveTo(i * effectiveStitchWidth + leftOffset, topOffset);
                ctx.lineTo(i * effectiveStitchWidth + leftOffset, canvas.height);
                ctx.stroke();
            }
        }

        function drawGridLabels(interval, stitchType) {
            if (isNaN(parseInt(interval))) return;

            const fontSize = 12;
            ctx.fillStyle = 'black';
            ctx.font = `${fontSize}px sans-serif`;
            //for linen stitch, each drawn stitch is two spaces
            let effectiveStitchWidth = (stitchType === "linen")? stitchWidth * 2 : stitchWidth;
            for (let i = parseInt(interval); i < stitchesPerRow; i += parseInt(interval)) {
                const x = leftOffset + i * effectiveStitchWidth; // Use effective width
                const label = String(i);
                const textWidth = ctx.measureText(label).width;
                ctx.fillText(label, x - textWidth / 2, topOffset - 4);
            }

            for (let i = parseInt(interval); i * stitchHeight < canvas.height - topOffset; i += parseInt(interval)) {
                const y = i * stitchHeight + topOffset;
                ctx.fillText(i, 3, y + fontSize / 2 - 2);
            }
        }

        if (gridlineInterval !== 'none') {
            drawMajorGridlines(gridlineInterval, stitchType);
            drawGridLabels(gridlineInterval, stitchType);
        }

        if (document.getElementById("show-outline").checked) {
            drawThinGridlines();
        }
    }
    // --- Drag and Drop ---
    function addDragAndDropHandlers(element) {
        element.addEventListener('dragstart', handleDragStart);
        element.addEventListener('dragover', handleDragOver);
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
        });
        generatePattern();
    }

    // --- Initial Setup ---
    addColor(); // Use default values.
    addColor();
    addColor();
    addColor();

    generatePattern();
});