document.addEventListener('DOMContentLoaded', function() {
        // Input Elements
        const colorSequenceInput = document.getElementById("color-sequence");
        const addColorButton = document.getElementById("add-color");
        const removeColorButton = document.getElementById("remove-color");
        const stitchesPerRowInput = document.getElementById("stitches-per-row");
        const stitchTypeSelect = document.getElementById("stitch-type");
        const rowOffsetInput = document.getElementById("row-offset");
        const colorChangeToleranceInput = document.getElementById("color-change-tolerance");
        const gridlinesCheckbox = document.getElementById("gridlines");
        const generateButton = document.getElementById("generate-button");
        const repeatLengthDisplay = document.getElementById("repeat-length");
        const decrementStitchesButton = document.getElementById("decrement-stitches");
        const incrementStitchesButton = document.getElementById("increment-stitches");
        const colorVisualization = document.getElementById("color-visualization");
        const poolingCanvas = document.getElementById("poolingCanvas");
    
        addColorButton.addEventListener("click", addColor);
        removeColorButton.addEventListener("click", removeColor);
    
        function addColor(){
            const colorName = prompt("Enter color name (e.g., Red):");
            if (colorName) { // Ensure user input exists
                const stitchCount = prompt("Enter stitch count for " + colorName + " (e.g., 10):");
                if (stitchCount && !isNaN(parseInt(stitchCount))) {
                    // Append to the textarea
                    colorSequenceInput.value += colorName + ": " + stitchCount + ",\n";
                    updateColorVisualization();
                } else {
                    alert("Invalid stitch count. Please enter a number.");
                }
            }
        }
    
        function removeColor(){
            let currentSequence = colorSequenceInput.value.trim().split(",\n");
            currentSequence.pop(); // Remove the last entry
            colorSequenceInput.value = currentSequence.join(",\n");
            updateColorVisualization();
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
    
        function updateColorVisualization() {
            colorVisualization.innerHTML = '';
            const sequence = parseColorSequence();
    
            for (let i = 0; i < sequence.length; i++) {
                let item = sequence[i];
                const preview = document.createElement('div');
                preview.classList.add('color-preview');
                preview.style.backgroundColor = item.color;
                colorVisualization.appendChild(preview);
            }
        }
    
        function parseColorSequence() {
            const sequenceString = colorSequenceInput.value.trim();
            const colorEntries = sequenceString.split(/,|\n/).filter(entry => entry.trim() !== "");
            const sequence = [];
    
            for (const entry of colorEntries) {
                const parts = entry.split(":");
                if (parts.length === 2) {
                    const color = parts[0].trim();
                    const count = parseInt(parts[1].trim(), 10);
                    if (!isNaN(count)) {
                        sequence.push({ color, count });
                    }
                }
            }
            return sequence;
        }
    
        generateButton.addEventListener("click", generatePattern);
    
        function generatePattern() {
            const sequence = parseColorSequence();
            const stitchesPerRow = parseInt(stitchesPerRowInput.value, 10);
            const stitchType = stitchTypeSelect.value;
            const rowOffset = parseInt(rowOffsetInput.value, 10);
            const tolerance = parseInt(colorChangeToleranceInput.value, 10);
            const showGridlines = gridlinesCheckbox.checked;
    
            // Calculate Repeat Length (LCM)
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
    
            drawPatternToCanvas(sequence, stitchesPerRow, stitchType, rowOffset, tolerance, showGridlines, repeatLength);
        }
    
        function drawPatternToCanvas(sequence, stitchesPerRow, stitchType, rowOffset, tolerance, showGridlines, repeatLength) {
            const canvas = poolingCanvas;
            const ctx = canvas.getContext('2d');
    
            // Canvas Setup
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
            canvas.height = Math.ceil(repeatLength / stitchesPerRow) * stitchHeight;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
    
            // Variables to Track State
            let currentRow = 0;
            let currentStitchInRow = 0;
            let sequenceIndex = 0;
            let currentStitchInColor = 0;
            let currentColorInfo = sequence[sequenceIndex];
            let goingRight = true;
    
            function getCurrentColor() {
                return sequence[sequenceIndex].color;
            }
    
            // Advance to Next Color (*** FIX APPLIED: Removed the erroneous else-if block ***)
            function advanceToNextColor() {
                currentStitchInColor++;
                if (currentStitchInColor >= currentColorInfo.count + tolerance) {
                    sequenceIndex = (sequenceIndex + 1) % sequence.length;
                    currentColorInfo = sequence[sequenceIndex];
                    currentStitchInColor = 0;
                }
            }
    
            // Main Loop: Draw stitches until reaching the repeat length
            let totalStitchCount = 0;
            let offset = 0;
            while (totalStitchCount < repeatLength) {
                const x = goingRight ? currentStitchInRow * stitchWidth : (stitchesPerRow - 1 - currentStitchInRow) * stitchWidth;
                const y = currentRow * stitchHeight;
                const currentColor = getCurrentColor();
    
                if (stitchType === 'linen') {
                    let drawStitch = false;
                    if (goingRight) {
                        drawStitch = (currentStitchInRow + offset) % 2 === 0;
                    } else {
                        drawStitch = (stitchesPerRow - 1 - currentStitchInRow + offset) % 2 === 0;
                    }
                    if ((currentRow % 2 === 0 && drawStitch) || (currentRow % 2 !== 0 && !drawStitch)) {
                        ctx.fillStyle = currentColor;
                        ctx.fillRect(x, y, stitchWidth, stitchHeight);
                    }
                } else {
                    ctx.fillStyle = currentColor;
                    ctx.fillRect(x, y, stitchWidth, stitchHeight);
                }
    
                advanceToNextColor();
                currentStitchInRow++;
                totalStitchCount++;
    
                if (currentStitchInRow >= stitchesPerRow) {
                    currentStitchInRow = 0;
                    currentRow++;
                    goingRight = !goingRight;
                    offset = (offset + rowOffset) % stitchesPerRow;
                    if(offset < 0) offset += stitchesPerRow;
                }
            }
    
            // Draw Gridlines if enabled
            if (showGridlines) {
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
        }
    
        updateColorVisualization();
        generatePattern();
    });
    