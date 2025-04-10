﻿function DiagramDomObserver(options) {
    const circleWidth = 6;
    const circleInSpace = 10;
    const delta = 20;

    let lastItemOnMouseEnter;
    let inBorderFlag = true;
    let drawingPoint = true;
    let drawingLine = !drawingPoint;
    let currentOriginPath;
    let currentDrawingLine;

    unRegisterMouseMove();
    registerMouseMove();

    unRegisterMouseDown();
    registerMouseDown();

    function diagramBuilderMouseDown(e) {
        const item = getItemFromPoint(e);
        const builder = document.querySelector("#diagram-flow-builder");

        if (drawingLine) {
            if (inBorderFlag)
                connectLine(e, item, builder);
            else
                removeLine(e, item, builder);

            setFlagDragingLine(false);
            inBorderFlag = false;
            currentOriginPath = null;
            currentDrawingLine = null;
        }

        setFlagDragingLine(inBorderFlag);
        //setFlagDrawingPoint(!drawingLine);

        if (inBorderFlag)
            addPoint(e, item, builder);

        if (!item)
            return;

        unRegisterMouseMove();
        registerMouseMove();
    }

    function connectLine(e, item, builder) {
        addPoint(e, item, builder);

        addNewLine(e, item, builder);

        removeLine();
    }

    function removeLine() {
        currentDrawingLine.remove();
    }

    function diagramBuilderMouseUp(e) {
    }

    function diagramBuilderTouchMove(e) {
        let positions = getTouchScreen(e);

        diagramBuilderMouseMove(positions);
    }

    function diagramBuilderMouseMove(e) {
        const item = getItemFromPoint(e);
        const builder = document.querySelector("#diagram-flow-builder");

        focusElement(e, item);

        drawingPlaceholderPoint(e, item, builder);

        if (drawingLine)
            drawingLineConnector(e, builder);
    }

    function drawingLineConnector(e, builder) {
        currentDrawingLine = currentDrawingLine || getLine(builder);

        moveLine(currentDrawingLine, e, builder);
    }

    //let circleTemplate1;
    //let circleTemplate2;
    //let circleTemplate3;

    function moveLine(line, e, item, builder) {
        const targetX = e.clientX;
        const targetY = e.clientY;

        const { cp1Xp, cp1Yp, cp1X, cp1Y, cp2X, cp2Y } = getControlPoints(currentOriginPath.originX, currentOriginPath.originY, targetX, targetY);

        //circleTemplate1 = circleTemplate1 || demoPoint("demo-point");
        //circleTemplate2 = circleTemplate2 || demoPoint("demo-point");
        //circleTemplate3 = circleTemplate3 || demoPoint("demo-point");


        //circleTemplate1.setAttribute("cx", cp1X);
        //circleTemplate1.setAttribute("cy", cp1Y);

        //circleTemplate2.setAttribute("cx", cp2X);
        //circleTemplate2.setAttribute("cy", cp2Y);

        //circleTemplate3.setAttribute("cx", cp1Xp);
        //circleTemplate3.setAttribute("cy", cp1Yp);
        //circleTemplate3.setAttribute("fill", 'red');

        line.setAttribute("d", `M ${currentOriginPath.originX} ${currentOriginPath.originY} C ${cp1X} ${cp1Y} ${cp2X} ${cp2Y} ${targetX} ${targetY}`);
    }

    function getControlPoints(x0, y0, x3, y3) {

        const cp = findPointCloserToStart(x0, y0, x3, y3, .45);
        const cp2 = findPointCloserToStart(x0, y0, x3, y3, .55);
        //const cp1X = cp.x;
        //const cp1Y = cp.y;
        //const cp2X = cp2.x;
        //const cp2Y = cp2.y;
        //const deg = getAngle(x0, y0, x3, y3);
        //const deg = 90;
        //const rotate = rotatePoint(x0, y0, cp1X, cp1Y, deg);
        //const rotate2 = rotatePoint(x3, y3, cp2X, cp2Y, deg);

        //console.log(`${deg}`);
        //var d = getDistance(x0, cp1Y, cp1X, cp1Y);
        //var dd = getDistance(x3, cp2Y, cp2X, cp2Y);

        return {
            //    cp1Xp: cp.x,
            //    cp1Yp: y0,
            cp1X: cp.x,
            cp1Y: y0,
            cp2X: cp2.x,
            cp2Y: y3
        };
    }

    //function rotatePoint(x1, y1, x2, y2, deg) {
    //    const rad = deg * Math.PI / 180;
    //    const xp = x2 - x1;
    //    const yp = y2 - y1;

    //    return {
    //        x: (xp * Math.cos(rad)) - (yp * Math.sin(rad)) + x1,
    //        y: (xp * Math.sin(rad)) + (yp * Math.cos(rad)) + y1,
    //    };
    //}

    //function getAngle(x1, y1, x2, y2) {
    //    const angleRad = Math.atan2(y2 - y1, x2 - x1);

    //    let angleDeg = angleRad * 180 / Math.PI;

    //    if (angleDeg < 0) {
    //        angleDeg = 360 + angleDeg;
    //    }

    //    return 360 - angleDeg;
    //    return angleDeg;
    //}

    //function getDistance(x1, y1, x2, y2) {
    //    const dx = x2 - x1;
    //    const dy = y2 - y1;
    //    return Math.sqrt(dx * dx + dy * dy);
    //}

    function findPointCloserToStart(x0, y0, x3, y3, t) {
        const x = (1 - t) * x0 + t * x3;
        const y = (1 - t) * y0 + t * y3;
        return { x, y };
    }

    //function demoPoint(className) {
    //    const svgPoints = document.querySelector("#diagram-flow-builder .connectors .points");
    //    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");

    //    circle.setAttribute("cx", "100");
    //    circle.setAttribute("cy", "100");
    //    circle.setAttribute("r", circleWidth);
    //    circle.classList.toggle(className, true);

    //    svgPoints.appendChild(circle);

    //    return circle;
    //}

    function getLine(builder) {
        var line = builder.querySelector(`.connectors .lines [data-origin-id='${currentOriginPath.originId}']`);

        if (line)
            return line;

        return createLine(builder);
    }

    function addPoint(e, item, builder) {
        var clonedPoint = builder.querySelector(".connectors .points .placeholder-connector").cloneNode();
        const svgPoints = document.querySelector("#diagram-flow-builder .connectors .points");

        clonedPoint.classList.remove("placeholder-connector");
        clonedPoint.classList.add("connector-point");

        svgPoints.appendChild(clonedPoint);

        currentOriginPath = getOriginData(clonedPoint);
    }

    function addNewLine(e, item, builder) {
        var clonedLine = currentDrawingLine.cloneNode();
        const svgPoints = document.querySelector("#diagram-flow-builder .connectors .lines");

        clonedLine.classList.remove("placeholder-path");
        clonedLine.classList.add("path");

        svgPoints.appendChild(clonedLine);
    }

    function getOriginData(point) {
        return {
            originId: point.dataset.originId,
            originX: parseFloat(point.getAttribute("cx")),
            originY: parseFloat(point.getAttribute("cy"))
        };
    }

    /**
     * Focus al elemento
     * @param {any} e
     * @param {any} item
     */
    function focusElement(e, item) {
        if (item
            && lastItemOnMouseEnter != item
            && options.events.canFocus(getItemId(item)))
            options.events.onFocusElement(getItemId(item), "in");

        if (!item && lastItemOnMouseEnter) {
            options.events.onFocusElement(getItemId(lastItemOnMouseEnter), "out");
            lastItemOnMouseEnter = null;
        }

        lastItemOnMouseEnter = item;
    }

    /**
     * Dibuja el circulo del placeholder
     * @param {any} e
     * @param {any} item
     * @returns
     */
    function drawingPlaceholderPoint(e, item, builder) {
        if (!item) {
            removeConnector();
            setFlagDrawingPoint(false);
            return;
        }

        if (item && options.events.canFocus(getItemId(item))) {
            placeholderConnector(e, item, builder);
        }
    }

    function getItemFromPoint(e) {
        try {
            return document.elementsFromPoint(e.x, e.y).filter(d => d.classList.contains("diagram-flow-item"))[0];
        } catch (e) {
            return null;
        }

    }

    function setFlagInBorder(flag) {
        inBorderFlag = flag;
    }

    function setFlagDragingLine(flag) {
        drawingLine = flag;
    }

    function setFlagDrawingPoint(flag) {
        drawingPoint = flag;
    }

    function placeholderConnector(e, item, builder) {
        let placeholderConnector = builder.querySelector(".connectors .points .placeholder-connector");

        if (!placeholderConnector)
            placeholderConnector = createPlaceholderConnector(item);

        movePlaceholder(e, placeholderConnector, item);
    }

    function movePlaceholder(e, circle, item) {
        const builder = document.querySelector("#diagram-flow-builder");
        const rect = item.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (!item || !inBorder(e, x, y, rect)) {
            removePlaceholder(builder, circle);
            setFlagInBorder(false);
            return;
        }

        setFlagInBorder(true);

        const top = y;
        const bottom = rect.height - y;
        const left = x;
        const right = rect.width - x;
        const min = Math.min(top, bottom, left, right);

        let px = 0;
        let py = 0;

        if (min === top) {
            px = x + rect.left;
            py = rect.top + circleInSpace;
        } else if (min === bottom) {
            px = x + rect.left;
            py = rect.height + rect.top - circleInSpace;
        } else if (min === left) {
            px = rect.left + circleInSpace;
            py = y + rect.top;
        } else if (min === right) {
            px = rect.width + rect.left - circleInSpace;
            py = y + rect.top;
        }

        circle.setAttribute("cx", px);
        circle.setAttribute("cy", py);
    }

    function inBorder(e, x, y, rect) {
        x = x + rect.left;
        y = y + rect.top;

        const dx = rect.left + delta;
        const dy = rect.top + delta;
        const dwidth = rect.left + rect.width - delta;
        const dheight = rect.top + rect.height - delta;

        return !((x >= dx && x <= dwidth) && (y >= dy && y <= dheight));
    }

    function removePlaceholder(builder, placeholderConnector) {
        let svgPoints = builder.querySelector(".connectors .points");

        svgPoints.removeChild(placeholderConnector);
    }

    function createPlaceholderConnector(item) {
        const svgPoints = document.querySelector("#diagram-flow-builder .connectors .points");
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");

        circle.setAttribute("cx", "100");
        circle.setAttribute("cy", "100");
        circle.setAttribute("r", circleWidth);
        circle.setAttribute("data-origin-id", getItemId(item));
        circle.classList.toggle("placeholder-connector", true);

        svgPoints.appendChild(circle);

        return circle;
    }

    function createLine(builder) {
        const lineContainer = builder.querySelector(`.connectors .lines`);
        var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        const svgPoints = document.querySelector("#diagram-flow-builder .connectors .lines");

        path.classList.add("placeholder-path");

        svgPoints.appendChild(path);

        return path;
    }

    function removeConnector() {
        setFlagInBorder(false);

        const builder = document.querySelector("#diagram-flow-builder");

        if (!builder)
            return;

        const svgPoints = builder.querySelector(".connectors .points");

        if (!svgPoints)
            return;

        const placeholder = svgPoints.querySelector(".placeholder-connector");

        if (!placeholder)
            return;

        svgPoints.removeChild(placeholder);
    }

    function getItemId(element) {
        if (!element)
            return;

        return element.dataset.id;
    }

    function getTouchScreen(e) {
        if (e.touches)
            return {
                hasTouch: e.type === "touchend" || e.type === "mouseup",
                screenX: (e.touches.length > 0 ? e.touches[0].clientX : 0),
                screenY: e.touches.length > 0 ? e.touches[0].clientY : 0,
                pageX: e.touches.length > 0 ? e.touches[0].pageX : 0,
                pageY: e.touches.length > 0 ? e.touches[0].pageY : 0
            };

        e.hasTouch = true;
        e.screenX = e.screenX;
        e.screenY = e.screenY;
        e.pageX = e.pageX;
        e.pageX = e.pageY;
        e.offsetY = e.offsetY;
        e.target = e.target;
        return e;
    }

    document.body.addEventListener('click', (e) => {

    });

    function registerMouseMove() {
        document.body.addEventListener("mousemove", diagramBuilderMouseMove);
        document.body.addEventListener("touchstart", diagramBuilderTouchMove);
    }

    function unRegisterMouseMove() {
        document.body.removeEventListener("mousemove", diagramBuilderMouseMove);
        document.body.removeEventListener("touchstart", diagramBuilderTouchMove);
    }
    function registerMouseDown() {
        document.body.addEventListener("mousedown", diagramBuilderMouseDown);
        document.body.addEventListener("mouseup", diagramBuilderMouseUp);
    }

    function unRegisterMouseDown() {
        document.body.removeEventListener("mousedown", diagramBuilderMouseDown);
        document.body.removeEventListener("mouseup", diagramBuilderMouseUp);
    }

}