
import fs from 'fs';
import path from 'path';

// Read the file
const filePath = 'f:\\pro\\frontend-citizen\\src\\data\\indiaMapPaths.ts';
const content = fs.readFileSync(filePath, 'utf8');

// Regex to extract path strings: "path": "..."
const pathRegex = /"path":\s*"([^"]+)"/g;
let match;
let allNumbers = [];
let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

while ((match = pathRegex.exec(content)) !== null) {
    const pathStr = match[1];
    // Extract numbers (integer or float)
    const numbers = pathStr.match(/[-+]?[0-9]*\.?[0-9]+/g);

    if (numbers) {
        // SVG path usually M x y ...
        // We know M is followed by x, then y.
        // We can just grab all numbers. X and Y coordinates are usually distinct in range or interleaved.
        // But simply finding min/max of ALL numbers might be misleading if X and Y ranges overlap.
        // However, usually path commands are: X Y X Y.
        // Let's iterate and treat even idx as X, odd as Y (roughly, simpler commands).
        // Actually, SVG commands are letter then numbers.
        // "M 353.8 12.3 l 4.6 2.4" -> M (x y) l (dx dy)
        // Ah, relative commands (l) make this hard! 'l' means delta!
        // If the paths use lowercase 'l', I need to track absolute position.

        // Let's parse properly.
    }
}

// Re-parsing properly with absolute tracking
function getBounds() {
    let globalMinX = Infinity;
    let globalMaxX = -Infinity;
    let globalMinY = Infinity;
    let globalMaxY = -Infinity;

    let match;
    // Reset regex
    const pathRegex2 = /"path":\s*"([^"]+)"/g;

    while ((match = pathRegex2.exec(content)) !== null) {
        const pathStr = match[1];
        const tokens = pathStr.trim().split(/\s+/);

        let currentX = 0;
        let currentY = 0;

        for (let i = 0; i < tokens.length; i++) {
            const cmd = tokens[i];

            if (cmd === 'M') {
                // Move absolute
                currentX = parseFloat(tokens[++i]);
                currentY = parseFloat(tokens[++i]);

                if (currentX < globalMinX) globalMinX = currentX;
                if (currentX > globalMaxX) globalMaxX = currentX;
                if (currentY < globalMinY) globalMinY = currentY;
                if (currentY > globalMaxY) globalMaxY = currentY;

            } else if (cmd === 'l') {
                // Line relative
                const dx = parseFloat(tokens[++i]);
                const dy = parseFloat(tokens[++i]);

                currentX += dx;
                currentY += dy;

                if (currentX < globalMinX) globalMinX = currentX;
                if (currentX > globalMaxX) globalMaxX = currentX;
                if (currentY < globalMinY) globalMinY = currentY;
                if (currentY > globalMaxY) globalMaxY = currentY;
            } else if (cmd === 'L') {
                // Line absolute
                currentX = parseFloat(tokens[++i]);
                currentY = parseFloat(tokens[++i]);

                if (currentX < globalMinX) globalMinX = currentX;
                if (currentX > globalMaxX) globalMaxX = currentX;
                if (currentY < globalMinY) globalMinY = currentY;
                if (currentY > globalMaxY) globalMaxY = currentY;
            }
            // Ignore Z
        }
    }
    return { globalMinX, globalMaxX, globalMinY, globalMaxY };
}

const bounds = getBounds();
console.log('Bounds:', bounds);
console.log(`Suggested viewBox: "${bounds.globalMinX} ${bounds.globalMinY} ${bounds.globalMaxX - bounds.globalMinX} ${bounds.globalMaxY - bounds.globalMinY}"`);
