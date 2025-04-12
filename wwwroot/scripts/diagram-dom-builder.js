function DiagramDomObserver(options) {
    const svgUtils = new SVGUtils();

    const ARROW = "M2.5,2.5 L25,12.5 L2.5,22.5 L10,12.5 L2.5,2.5Z";
    const INITIALSTATUS = "INITIALSTATUS";
    const SEARCHINGCONNECTION = "SEARCHINGCONNECTION";
    const CONNECTION = "CONNECTION";
    const circleWidth = 6;
    const circleInSpace = 10;
    const delta = 20;

    let lastItemOnMouseEnter;
    let inBorderFlag = true;
    let currentOriginPath;
    let currentDrawingLine;
    let actionStatus = INITIALSTATUS;
    let positionHoverPoint;
    let affectedItems;

    unRegisterMouseMove();
    registerMouseMove();

    unRegisterMouseDown();
    registerMouseDown();

    this.refreshingPosition = function (elementId) {
        affectedItems = affectedItems || getAffectedItems(elementId);

        affectedItems.lines.forEach(x => x.domElement.style.stroke = "red");
        affectedItems.points.forEach(x => x.domElement.style.fill = "red");
    };

    this.endRefreshingPosition = function (elementId) {
        affectedItems = null;
    };

    function getAffectedItems(elementId) {
        const line1 = Array.from(document.querySelectorAll(`.diagram-flow-builder .connectors .lines [data-destination-id='${elementId}']`));
        const line2 = Array.from(document.querySelectorAll(`.diagram-flow-builder .connectors .lines [data-origin-id='${elementId}']`));

        return {
            lines: [...line1, ...line2]
                .map(d => {
                    var position = getPosition(d);
                    return {
                        domElement: d,
                        position: position
                    };
                }),
            points: Array.from(document.querySelectorAll(`.diagram-flow-builder .connectors .points [data-point-id='${elementId}']`))
                .map(d => {
                    var position = getPosition(d);
                    return {
                        domElement: d,
                        position: position
                    };
                }),
        };
    }

    function getPosition(e) {
        //switch (e.tagName) {

        //    case "polygon": return getPolygonPosition(e);
        //    case "circle": return getCirclePosition(e);
        //    case "path": return getPathPosition(e);
        //}

        const box = e.getBBox();

        return {
            x: box.x + (box.width / 2),
            y: box.y + (box.height / 2)
        };
    }

    function getPolygonPosition(e) {
    }

    function getCirclePosition(e) {
    }

    function getPathPosition(e) {
    }

    function diagramBuilderMouseDown(e) {
        const item = getItemFromPoint(e);
        const builder = document.querySelector("#diagram-flow-builder");

        switch (actionStatus) {
            case INITIALSTATUS:
                if (inBorderFlag) {
                    addOriginPoint(builder);
                    actionStatus = SEARCHINGCONNECTION;
                }
                break;

            case SEARCHINGCONNECTION:
                connectPoint(e, item, builder);
                actionStatus = INITIALSTATUS;
                currentOriginPath = null;
                currentDrawingLine = null;
                break;

            case CONNECTION:
                break;
        }
    }

    function diagramBuilderMouseMove(e) {
        const item = getItemFromPoint(e);
        const builder = document.querySelector("#diagram-flow-builder");

        focusElement(e, item);

        drawingPlaceholderPoint(e, item, builder);

        if (actionStatus === SEARCHINGCONNECTION)
            drawingLineConnector(e, builder);
    }

    function connectPoint(e, item, builder) {
        if (inBorderFlag)
            connectLine(e, item, builder);
        else {
            removeLine(e, item, builder);
            removePoint(e, item, builder);
        }
    }

    function connectLine(e, item, builder) {
        setDestinationPoint(builder);

        svgUtils.curveLine(currentDrawingLine, currentOriginPath.destinationX, currentOriginPath.destinationY, currentOriginPath.originX, currentOriginPath.originY);

        addDestinationPoint(e, item, builder);

        addNewLine(e, item, builder);

        removeLine();
    }

    function removeLine() {
        if (currentDrawingLine)
            currentDrawingLine.remove();
    }

    function removePoint(e, item, builder) {
        const point = document.querySelector(`#diagram-flow-builder .connectors .points [data-origin-id='${currentOriginPath.originId}'][no-connected]`);

        point.remove();
    }

    function diagramBuilderMouseUp(e) {
    }

    function diagramBuilderTouchMove(e) {
        let positions = getTouchScreen(e);

        diagramBuilderMouseMove(positions);
    }

    function drawingLineConnector(e, builder) {
        currentDrawingLine = currentDrawingLine || getLine(builder);

        const targetX = e.clientX;
        const targetY = e.clientY;

        svgUtils.curveLine(currentDrawingLine, targetX, targetY, currentOriginPath.originX, currentOriginPath.originY);
    }

    function getLine(builder) {
        //var line = builder.querySelector(`.connectors .lines [data-origin-id='${currentOriginPath.originId}']`);

        //if (line)
        //    return line;

        return createLine(builder);
    }

    function addOriginPoint(builder) {
        var clonedPoint = builder.querySelector(".connectors .points .placeholder-connector").cloneNode();
        const svgPoints = document.querySelector("#diagram-flow-builder .connectors .points");

        clonedPoint.classList.remove("placeholder-connector");
        clonedPoint.classList.add("connector-point");
        clonedPoint.classList.add("connector-point-origin");

        clonedPoint.setAttribute("no-connected", "");
        clonedPoint.setAttribute("data-point-id", clonedPoint.dataset.originId);

        svgPoints.appendChild(clonedPoint);

        currentOriginPath = getOriginData(clonedPoint);
    }

    function setDestinationPoint(builder) {
        var point = builder.querySelector(".connectors .points .placeholder-connector");
        var originPoint = builder.querySelector(`.connectors .points [data-point-id='${currentOriginPath.originId}']`);

        const data = getOriginData(point);

        currentOriginPath.destinationId = data.originId;
        currentOriginPath.destinationX = data.originX;
        currentOriginPath.destinationY = data.originY;

        originPoint.setAttribute("data-destination-id", data.originId);
    }

    function addDestinationPoint(e, item, builder) {
        var path = svgUtils.createPolygon();
        const svgPoints = document.querySelector("#diagram-flow-builder .connectors .points");
        const originPoint = document.querySelector(`#diagram-flow-builder .connectors .points [data-origin-id='${currentOriginPath.originId}'][no-connected]`);

        const x0 = currentOriginPath.destinationX;
        const y0 = currentOriginPath.destinationY;
        const x1 = currentOriginPath.originX;
        const y1 = currentOriginPath.originY;

        path.classList.add("connector-point");
        path.classList.add("connector-point-destination");
        //path.setAttribute("points", svgUtils.rotatePolygonD(getDegDirection(x0, y0, x1, y1), 13.75, 12.5), x0 - 14, y0 - 12);
        path.setAttribute("points", svgUtils.translatePolygonD(svgUtils.rotatePolygonD(getDegDirection(x0, y0, x1, y1), 13.75, 12.5), x0 - 15, y0 - 11));
        path.setAttribute("data-destination-id", currentOriginPath.destinationId);
        path.setAttribute("data-origin-id", currentOriginPath.originId);
        path.setAttribute("data-point-id", currentOriginPath.destinationId);

        originPoint.removeAttribute("no-connected");

        svgPoints.appendChild(path);

        return path;
    }

    function getDegDirection(x0, y0, x1, y1) {
        switch (positionHoverPoint) {
            case "BOTTOM":
                return getAngle(x1, y1, x0, y0, 0);
            case "TOP":
                return getAngle(x1, y1, x0, y0, -30);
            case "LEFT": return 0;
            case "RIGHT": return 180;
        }
    }

    function getAngle(x1, y1, x2, y2, deg = 360) {
        const angleRad = Math.atan2(y2 - y1, x2 - x1);
        let angleDeg = angleRad * 180 / Math.PI;

        if (angleDeg < 0)
            angleDeg += deg;

        return parseInt(angleDeg);
    }

    function addNewLine(e, item, builder) {
        var clonedLine = currentDrawingLine.cloneNode();
        const svgPoints = document.querySelector("#diagram-flow-builder .connectors .lines");

        clonedLine.classList.remove("placeholder-path");
        clonedLine.classList.add("path");
        clonedLine.setAttribute("data-origin-id", currentOriginPath.originId);
        clonedLine.setAttribute("data-destination-id", currentOriginPath.destinationId);

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
            positionHoverPoint = "TOP";
        } else if (min === bottom) {
            px = x + rect.left;
            py = rect.height + rect.top - circleInSpace;
            positionHoverPoint = "BOTTOM";
        } else if (min === left) {
            px = rect.left + circleInSpace;
            py = y + rect.top;
            positionHoverPoint = "LEFT";
        } else if (min === right) {
            px = rect.width + rect.left - circleInSpace;
            py = y + rect.top;
            positionHoverPoint = "RIGHT";
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
        const circle = svgUtils.createCircle();

        circle.setAttribute("cx", "100");
        circle.setAttribute("cy", "100");
        circle.setAttribute("r", circleWidth);
        circle.setAttribute("data-origin-id", getItemId(item));
        circle.classList.toggle("placeholder-connector", true);

        svgPoints.appendChild(circle);

        return circle;
    }

    function createLine(builder) {
        var path = svgUtils.createPath();
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