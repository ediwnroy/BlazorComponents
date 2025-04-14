function SVGUtils() {
    const _this = this;

    this.POINTS = "24,13 3,24 10,13 3,3";

    this.createPolygon = function () {
        return document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    };

    this.createPath = function () {
        return document.createElementNS("http://www.w3.org/2000/svg", "path");
    };

    this.createCircle = function () {
        return document.createElementNS("http://www.w3.org/2000/svg", "circle");
    };

    this.curveLine = function (line, x, y, x2, y2) {
        const { cp1X, cp1Y, cp2X, cp2Y } = getControlPoints(x2, y2, x, y);

        line.setAttribute("d", `M ${x2} ${y2} C ${cp1X} ${cp1Y} ${cp2X} ${cp2Y} ${x} ${y}`);
    };

    this.translatePolygonD = function (d, x, y) {
        const points = d.trim().split(/\s+/).map(p => p.split(',').map(Number));

        const bbox = getBoundingBox(points);
        const currentCenterX = (bbox.minX + bbox.maxX) / 2;
        const currentCenterY = (bbox.minY + bbox.maxY) / 2;

        const dx = x - currentCenterX;
        const dy = y - currentCenterY;

        const movedPoints = points.map(([x, y]) => [x + dx, y + dy]);
        return movedPoints.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
    };

    this.rotatePolygonD = function (angleDeg) {
        const points = this.POINTS.trim().split(/\s+/).map(p => p.split(',').map(Number));
        const angleRad = angleDeg * Math.PI / 180;
        const bbox = getBoundingBox(points);
        const cx = (bbox.minX + bbox.maxX) / 2;
        const cy = (bbox.minY + bbox.maxY) / 2;

        const rotated = points.map(([x, y]) => {
            const dx = x - cx;
            const dy = y - cy;
            const xr = dx * Math.cos(angleRad) - dy * Math.sin(angleRad);
            const yr = dx * Math.sin(angleRad) + dy * Math.cos(angleRad);
            return [xr + cx, yr + cy];
        });

        const rotatedBBox = getBoundingBox(rotated);
        const dx = bbox.minX - rotatedBBox.minX;
        const dy = bbox.minY - rotatedBBox.minY;

        const repositioned = rotated.map(([x, y]) => [x + dx, y + dy]);

        return repositioned.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
    };

    this.getCenter = function (pointString) {
        const points = pointString.trim().split(/\s+/).map(p => p.split(',').map(Number));
        const bbox = getBoundingBox(points);

        return {
            cx: (bbox.minX + bbox.maxX) / 2,
            cy: (bbox.minY + bbox.maxY) / 2
        };
    };

    this.getBoundingBoxSize = function (pointString) {
        const points = pointString.trim().split(/\s+/).map(p => p.split(',').map(Number));

        const xs = points.map(p => p[0]);
        const ys = points.map(p => p[1]);

        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);

        return {
            minX,
            maxX,
            minY,
            maxY,
            width: maxX - minX,
            height: maxY - minY
        };
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
    function getBoundingBox(points) {
        const xs = points.map(p => p[0]);
        const ys = points.map(p => p[1]);
        return {
            minX: Math.min(...xs),
            maxX: Math.max(...xs),
            minY: Math.min(...ys),
            maxY: Math.max(...ys),
        };
    }

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