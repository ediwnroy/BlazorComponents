function SVGUtils() {
    const ARROW = "M2.5,2.5 L25,12.5 L2.5,22.5 L10,12.5 L2.5,2.5Z";
    const POINTS = "28,15 2,28 9.3,14.8 2,2";

    this.createPolygon = function () {
        return document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    };

    this.createPath = function () {
        return document.createElementNS("http://www.w3.org/2000/svg", "path");
    };

    this.createCircle = function () {
        return  document.createElementNS("http://www.w3.org/2000/svg", "circle");
    };

    this.curveLine = function (line, x, y, x2, y2) {
        const { cp1X, cp1Y, cp2X, cp2Y } = getControlPoints(x2, y2, x, y);

        line.setAttribute("d", `M ${x2} ${y2} C ${cp1X} ${cp1Y} ${cp2X} ${cp2Y} ${x} ${y}`);
    };

    this.translatePolygonD = function (d, x, y) {
        return d.replace(/(-?\d*\.?\d+),\s*(-?\d*\.?\d+)/g, (_,  x0, y0) => {
            const nx = parseFloat(x0) + x;
            const ny = parseFloat(y0) + y;
            return `${nx},${ny}`;
        });
    };

    this.rotatePolygonD = function (angleDeg, centerX = 0, centerY = 0) {
        const angleRad = angleDeg * (Math.PI / 180);

        const points = POINTS.trim().split(" ");
        const rotatedPoints = points.map((point) => {
            const [x, y] = point.split(",").map(x => parseFloat(x));

            const xRel = x - centerX;
            const yRel = y - centerY;

            const xr = xRel * Math.cos(angleRad) - yRel * Math.sin(angleRad);
            const yr = xRel * Math.sin(angleRad) + yRel * Math.cos(angleRad);

            return `${(xr + centerX).toFixed(2)},${(yr + centerY).toFixed(2)} `;
        });

        return rotatedPoints.join(" ");
    };

    this.translatePathD = function (d, x, y) {
        return d.replace(/([ML])\s*(-?\d*\.?\d+),\s*(-?\d*\.?\d+)/g, (_, cmd, x0, y0) => {
            const nx = parseFloat(x0) + x;
            const ny = parseFloat(y0) + y;
            return `${cmd}${nx},${ny}`;
        });
    };

    this.rotatePathD = function (d, angleDeg, centerX = 0, centerY = 0) {
        const angleRad = angleDeg * (Math.PI / 180);

        const t = d.replace(/([ML])([^ML]+)/g, (match, cmd, coords) => {
            const points = coords.trim().split(" ");
            const rotatedPoints = points.map((point) => {
                const [x, y] = point.split(",").map(x => parseFloat(x));

                const xRel = x - centerX;
                const yRel = y - centerY;

                const xr = xRel * Math.cos(angleRad) - yRel * Math.sin(angleRad);
                const yr = xRel * Math.sin(angleRad) + yRel * Math.cos(angleRad);

                return `${(xr + centerX).toFixed(2)},${(yr + centerY).toFixed(2)} `;
            });

            return cmd + rotatedPoints.join(" ");
        });

        return t.trim()
    };

    function getControlPoints(x0, y0, x3, y3) {
        const cp = findPointCloserToStart(x0, y0, x3, y3, .45);
        const cp2 = findPointCloserToStart(x0, y0, x3, y3, .55);

        return {
            cp1X: cp.x,
            cp1Y: y0,
            cp2X: cp2.x,
            cp2Y: y3
        };
    }

    function findPointCloserToStart(x0, y0, x3, y3, t) {
        const x = (1 - t) * x0 + t * x3;
        const y = (1 - t) * y0 + t * y3;
        return { x, y };
    }
}