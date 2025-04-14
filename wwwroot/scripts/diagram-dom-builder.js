function DiagramDomObserver(options) {
    const _this = this;
    const svgUtils = new SVGUtils();

    const ARROW = "M2.5,2.5 L25,12.5 L2.5,22.5 L10,12.5 L2.5,2.5Z";
    const INITIALSTATUS = "INITIALSTATUS";
    const SEARCHINGCONNECTION = "SEARCHINGCONNECTION";
    const CONNECTION = "CONNECTION";
    const MOVINGBOX = "MOVING-BOX";
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

    unDragAndDropSubscribe();
    dragAndDropSubscribe();

    this.refreshingPosition = function (elementId) {
        actionStatus = MOVINGBOX;

        affectedItems = affectedItems || getAffectedItems(elementId);
    };

    this.endRefreshingPosition = function (elementId) {
        //actionStatus = INITIALSTATUS;
        affectedItems = null;
    };

    function onDragItem(e) {
        if (e.type !== options.subscriptionEventOnDrag)
            return;

        switch (e.detail.action) {
            case "dragging":
                _this.refreshingPosition(e.detail.sourceId);
                break
            case "stopDragging":
                _this.endRefreshingPosition(e.detail.sourceId);
                break
        }
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

        if (!e.buttons && actionStatus == MOVINGBOX)
            actionStatus = INITIALSTATUS;

        focusElement(e, item);

        drawingPlaceholderPoint(e, item, builder);

        switch (actionStatus) {
            case SEARCHINGCONNECTION:
                drawingLineConnector(e, builder);
                break;
            case MOVINGBOX:
                updateElementsPositions(e, builder);
                break;
        }
    }

    function updateElementsPositions(e, builder) {
        affectedItems.points.forEach(x => updatePointPosition(x, e, builder));
        affectedItems.lines.forEach(x => updateLinePosition(x, e, builder));
    }

    function updatePointPosition(point, e, builder) {
        switch (point.domElement.dataset.point) {
            case "origin":
                updateOriginPoint(point, e, builder);
                break;
            case "destination":
                updateDestinationPoint(point, e, builder);
                break;
        }
    }

    function updateOriginPoint(point, e, builder) {
        const bounce = affectedItems.element.getBoundingClientRect();
        const x = bounce.left - affectedItems.boxElement.left;
        const y = bounce.top - affectedItems.boxElement.top;
        const pointDestination = document.querySelector(`#diagram-flow-builder .connectors .points [data-connection-id='${point.domElement.dataset.connectionId}'][data-point="destination-reference"]`);

        point.domElement.setAttribute("cx", point.position.x + x);
        point.domElement.setAttribute("cy", point.position.y + y);

        if (pointDestination) {
            var position = getPosition(pointDestination);
            const deg = getDegDirection(pointDestination.dataset.direction,
                position.x, position.y,
                point.position.x + x, point.position.y + y);
            const pointsR = svgUtils.rotatePolygonD(deg);

            pointDestination.setAttribute("points",
                svgUtils.translatePolygonD(
                    pointsR,
                    position.x, position.y));
        }
    }

    function updateDestinationPoint(point, e, builder) {
        const bounce = affectedItems.element.getBoundingClientRect();
        const x = bounce.left - affectedItems.boxElement.left;
        const y = bounce.top - affectedItems.boxElement.top;

        updateDestinationReference(point, x, y);

        const pointOrigin = document.querySelector(`#diagram-flow-builder .connectors .points [data-connection-id='${point.domElement.dataset.connectionId}'][data-point="origin"]`);
        const originX = parseInt(pointOrigin.getAttribute("cx"));
        const originY = parseInt(pointOrigin.getAttribute("cy"));
        const deg = getDegDirection(point.domElement.dataset.direction, point.referencePosition.x + x, point.referencePosition.y + y, originX, originY);
        const pointsR = svgUtils.rotatePolygonD(deg);


        point.domElement.setAttribute("points",
            svgUtils.translatePolygonD(
                pointsR,
                point.referencePosition.x + x, point.referencePosition.y + y));
    }

    function updateDestinationReference(point, x, y) {
        point.referenceDomElement.setAttribute("cx", point.referencePosition.x + x);
        point.referenceDomElement.setAttribute("cy", point.referencePosition.y + y);
    }

    function updateLinePosition(line, e, builder) {
        const position = getPointAttribute(line);

        svgUtils.curveLine(line.domElement,
            position.destinationX,
            position.destinationY,
            position.originX,
            position.originY);
    }

    function getPointAttribute(line) {
        const pointOrigin = document.querySelector(`#diagram-flow-builder .connectors .points [data-connection-id='${line.domElement.dataset.connectionId}'][data-point="origin"]`);
        const pointDestination = document.querySelector(`#diagram-flow-builder .connectors .points [data-connection-id='${line.domElement.dataset.connectionId}'][data-point="destination"]`);

        if (!pointOrigin && pointDestination)
            return {};

        if (!pointDestination)
            return {
                originX: parseInt(pointOrigin.getAttribute("cx")),
                originY: parseInt(pointOrigin.getAttribute("cy"))
            };

        const bbox = pointDestination.getBBox();

        return {
            originX: parseInt(pointOrigin.getAttribute("cx")),
            originY: parseInt(pointOrigin.getAttribute("cy")),
            destinationX: bbox.x + (bbox.width / 2),
            destinationY: bbox.y + (bbox.height / 2),
        };
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
        return createLine(builder);
    }

    function addOriginPoint(builder) {
        var clonedPoint = builder.querySelector(".connectors .points .placeholder-connector").cloneNode();
        const svgPoints = document.querySelector("#diagram-flow-builder .connectors .points");

        clonedPoint.classList.remove("placeholder-connector");
        clonedPoint.classList.add("connector-point");
        clonedPoint.classList.add("connector-point-origin");

        clonedPoint.setAttribute("no-connected", "");
        clonedPoint.setAttribute("data-point", "origin");
        clonedPoint.setAttribute("data-connection-id", generateId(12));
        clonedPoint.setAttribute("data-point-id", clonedPoint.dataset.originId);

        svgPoints.appendChild(clonedPoint);

        currentOriginPath = getOriginData(clonedPoint);
    }

    function addDestinationPoint(e, item, builder) {
        var path = svgUtils.createPolygon();
        const svgPoints = document.querySelector("#diagram-flow-builder .connectors .points");
        const originPoint = document.querySelector(`#diagram-flow-builder .connectors .points [data-origin-id='${currentOriginPath.originId}'][no-connected]`);

        const x0 = currentOriginPath.destinationX;
        const y0 = currentOriginPath.destinationY;
        const x1 = currentOriginPath.originX;
        const y1 = currentOriginPath.originY;
        const rotatedPoints = svgUtils.rotatePolygonD(getDegDirection(positionHoverPoint, x0, y0, x1, y1));
        const bounce = svgUtils.getBoundingBoxSize(rotatedPoints);

        path.classList.add("connector-point");
        path.classList.add("connector-point-destination");
        path.setAttribute("data-point", "destination");
        path.setAttribute("points", svgUtils.translatePolygonD(rotatedPoints, x0, y0));
        path.setAttribute("data-destination-id", currentOriginPath.destinationId);
        path.setAttribute("data-origin-id", currentOriginPath.originId);
        path.setAttribute("data-point-id", currentOriginPath.destinationId);
        path.setAttribute("data-connection-id", currentOriginPath.connectionId);
        path.setAttribute("data-direction", positionHoverPoint);

        originPoint.removeAttribute("no-connected");

        svgPoints.appendChild(path);

        addDestinationReference(item, currentOriginPath.destinationX, currentOriginPath.destinationY);

        return path;
    }

    function addDestinationReference(item, x, y) {
        const svgPoints = document.querySelector("#diagram-flow-builder .connectors .points");
        const circle = svgUtils.createCircle();

        circle.classList.toggle("destination-refence-connector", true);
        circle.setAttribute("cx", x);
        circle.setAttribute("cy", y);
        circle.setAttribute("r", circleWidth);
        circle.setAttribute("data-connection-id", currentOriginPath.connectionId);
        circle.setAttribute("data-point", "destination-reference");
        circle.setAttribute("data-direction", positionHoverPoint);

        svgPoints.appendChild(circle);

        return circle;
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

    function getDegDirection(positionHoverPoint, x0, y0, x1, y1) {
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
            connectionId: point.dataset.connectionId,
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
            && options.events.canFocus(getItemId(item))) {
            options.events.onFocusElement(getItemId(item), "in");
        }

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
            return document.elementsFromPoint(e.x, e.y)
                .filter(d => d.classList.contains("diagram-flow-item"))[0];
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
        path.setAttribute("data-connection-id", currentOriginPath.connectionId);

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

    function getAffectedItems(elementId) {
        const line1 = Array.from(document.querySelectorAll(`.diagram-flow-builder .connectors .lines [data-destination-id='${elementId}']`));
        const line2 = Array.from(document.querySelectorAll(`.diagram-flow-builder .connectors .lines [data-origin-id='${elementId}']`));
        const element = document.querySelector(`.diagram-flow-builder [data-id='${elementId}']`);

        return {
            elementId,
            element,
            boxElement: element.getBoundingClientRect(),
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
                    let position = getPosition(d);
                    let referencePosition;
                    const reference = document.querySelector(`#diagram-flow-builder .connectors .points [data-connection-id='${d.dataset.connectionId}'][data-point="destination-reference"]`);

                    if (d.dataset.point === 'destination')
                        referencePosition = getPosition(reference);

                    return {
                        domElement: d,
                        position: position,
                        referencePosition: referencePosition,
                        referenceDomElement: reference
                    };
                }),
        };
    }

    function getPosition(e) {
        const box = e.getBBox();

        switch (e.tagName) {

            case 'circle':
                return {
                    x: parseInt(e.getAttribute("cx")),
                    y: parseInt(e.getAttribute("cy")),
                    width: box.width,
                    height: box.height
                };

            case 'polygons':
                const pointDestinationReference = document.querySelector(`#diagram-flow-builder .connectors .points [data-connection-id='${e.dataset.connectionId}'][data-point="destination-reference"]`);

                return {
                    x: parseInt(pointDestinationReference.getAttribute("cx")),
                    y: parseInt(pointDestinationReference.getAttribute("cy")),
                    width: box.width,
                    height: box.height
                };
            default:
                return {
                    x: box.x,
                    y: box.y,
                    width: box.width + (box.width / 2),
                    height: box.height + (box.height / 2),
                };
        }
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

    function unDragAndDropSubscribe() {
        window.removeEventListener(options.subscriptionEventOnDrag, onDragItem);
    }

    function dragAndDropSubscribe() {
        window.addEventListener(options.subscriptionEventOnDrag, onDragItem);
    }
    function generateId(length = 11) {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    }

} 