function DiagramDomObserver(options) {
    const _this = this;
    const svgUtils = new SVGUtils();

    const ARROW = "M2.5,2.5 L25,12.5 L2.5,22.5 L10,12.5 L2.5,2.5Z";
    const INITIALSTATUS = "INITIALSTATUS";
    const SEARCHINGCONNECTION = "SEARCHINGCONNECTION";
    const CONNECTION = "CONNECTION";
    const MOVINGBOX = "MOVING-BOX";
    const MOVINGPOINT = "MOVING-POINT";
    const ONBORDER = "ONBORDER";
    const ONPOINT = "ONPOINT";
    const ONNONE = "ONNONE";
    const circleWidth = 6;
    const circleInSpace = 10;
    const delta = 20;
    const marginPointCollision = 20;

    let lastItemOnMouseEnter;
    let onStatus = "";
    let currentOriginPath;
    let currentDrawingLine;
    let actionStatus = INITIALSTATUS;
    let positionHoverPoint;
    let affectedItems;
    let currentMovingPoint;
    let backupPosition;

    this.OriginName = "ORIGIN";
    this.DestinationName = "DESTINATION";

    unWindowResizeSubscribe();
    windowResizeSubscribe();

    unRegisterMouseMove();
    registerMouseMove();

    unRegisterMouseDown();
    registerMouseDown();

    unDragAndDropSubscribe();
    dragAndDropSubscribe();

    this.refreshingPosition = function (elementId) {
        removeFailedConnection();

        actionStatus = MOVINGBOX;

        affectedItems = affectedItems || getAffectedItems(elementId);
    };

    this.endRefreshingPosition = function (elementId) {
        affectedItems = null;
    };

    function diagramBuilderMouseDown(e) {
        const item = getItemFromPoint(e);
        const builder = document.querySelector("#diagram-flow-builder");

        switch (actionStatus) {
            //Crea el primer punto de conexíon
            case INITIALSTATUS:

                switch (onStatus) {
                    case ONBORDER:
                        addOriginPoint(builder);
                        actionStatus = SEARCHINGCONNECTION;
                        break;

                    case ONPOINT:
                        setCurrentPoint(e, builder);

                        if (!canEdit())
                            return;

                        backupPointPosition();
                        clearStatus(MOVINGPOINT);
                        break;

                }
                break;

            case SEARCHINGCONNECTION:
                connectPoint(e, item, builder);

                clearStatus();
                break;

            case CONNECTION:
                break;

            case MOVINGPOINT:
                setPointToNewPosition(e, item, builder);
                clearStatus();
                break;
        }
    }

    function diagramBuilderMouseMove(e) {
        const item = getItemFromPoint(e);
        const builder = document.querySelector("#diagram-flow-builder");

        if (!e.buttons && actionStatus == MOVINGBOX)
            actionStatus = INITIALSTATUS;

        focusElement(e, item);

        observerAction(e, item, builder);

        switch (actionStatus) {
            //Buscando conexión
            //Buscando el segundo punto de conexión
            //Dibuja la linea de conexión
            case SEARCHINGCONNECTION:
                drawingLineConnector(e, builder);
                break;

            //Evento cuando se mueve la cajita
            case MOVINGBOX:
                updateElementsPositions(e, builder);
                break;

            //Evento cuando se mueve la cajita
            case MOVINGPOINT:
                movingPoint(e, builder);
                break;
        }
    }

    function canEdit() {
        if (!currentMovingPoint)
            return true;

        const isOrigin = currentMovingPoint.dataset.point == "origin";

        return options.events.canEdit(
            isOrigin ? currentMovingPoint.dataset.originId : currentMovingPoint.dataset.destinationId,
            isOrigin ? _this.OriginName : _this.DestinationName);
    }

    function setPointToNewPosition(e, item, builder) {
        if (!inBorder(e, item) ||
            !canConnectAfterEdit(builder)) {
            rollbackPoint(e, builder);

            return
        }

        updateNewPositionPoint(e, builder);
    }

    function canConnectAfterEdit(builder) {
        if (!currentMovingPoint)
            return false;

        const isOrigin = currentMovingPoint.dataset.point == "origin";
        const connectionId = currentMovingPoint.dataset.connectionId;
        const placeholder = builder.querySelector(".connectors .points .placeholder-connector");
        const destination = getPoint(connectionId, "destination");
        const origin = getPoint(connectionId, "origin");
        const newData = getNewData(placeholder, origin, destination, isOrigin);

        return options.events.canConnect(newData.originId,
            newData.destinationId,
            isOrigin ? _this.OriginName : _this.DestinationName);
    }

    function updateNewPositionPoint(e, builder) {
        const isOrigin = currentMovingPoint.dataset.point == "origin";
        const connectionId = currentMovingPoint.dataset.connectionId;
        const placeholder = builder.querySelector(".connectors .points .placeholder-connector");
        const destination = getPoint(connectionId, "destination");
        const origin = getPoint(connectionId, "origin");

        const newData = getNewData(placeholder, origin, destination, isOrigin);
        const line = document.querySelector(`.diagram-flow-builder .connectors .lines [data-connection-id='${connectionId}']`);

        const x = parseInt(placeholder.getAttribute("cx"));
        const y = parseInt(placeholder.getAttribute("cy"));

        if (isOrigin) {
            origin.setAttribute("cx", x);
            origin.setAttribute("cy", y);
        }
        else {
            const pointDestinationRef = document.querySelector(`#diagram-flow-builder .connectors .points [data-connection-id='${connectionId}'][data-point="destination-reference"]`);
            pointDestinationRef.setAttribute("cx", x);
            pointDestinationRef.setAttribute("cy", y);

            const origin = getPoint(connectionId, "origin");
            const originX = parseInt(origin.getAttribute("cx"));
            const originY = parseInt(origin.getAttribute("cy"));
            const deg = getDegDirection(pointDestinationRef.dataset.direction, x, y, originX, originY);
            const pointsR = svgUtils.rotatePolygonD(deg);
            currentMovingPoint.setAttribute("points",
                svgUtils.translatePolygonD(
                    pointsR,
                    x, y));
        }

        //Actualiza la posicion definitiva de la linea
        updateLineXY(connectionId);

        //actualizacion de referencias de punto de origen
        origin.setAttribute("data-point-id", newData.originId);
        origin.setAttribute("data-origin-id", newData.originId);
        origin.setAttribute("data-destination-id", newData.destinationId);

        //actualizacion de referencias de punto de destino
        destination.setAttribute("data-origin-id", newData.originId);
        destination.setAttribute("data-destination-id", newData.destinationId);

        //actualizacion de referencias de punto de linea conectora
        line.setAttribute("data-origin-id", newData.originId);
        line.setAttribute("data-destination-id", newData.destinationId);
    }

    function getPoint(connectionId, source) {
        return document.querySelector(`#diagram-flow-builder .connectors .points [data-connection-id='${connectionId}'][data-point="${source}"]`);
    }

    function getNewData(placeholder, origin, destination, isOrigin) {

        return {
            connectionId: origin.dataset.connectionId,
            originId: isOrigin ? placeholder.dataset.originId : origin.dataset.originId,
            destinationId: !isOrigin ? placeholder.dataset.originId : destination.dataset.destinationId
        };
    }


    function backupPointPosition() {
        if (!currentMovingPoint)
            return;

        const destination = getPoint(currentMovingPoint.dataset.connectionId, "destination");
        const origin = getPoint(currentMovingPoint.dataset.connectionId, "origin");
        const destinationRef = getPoint(currentMovingPoint.dataset.connectionId, "destination-reference");
        const line = document.querySelector(`.diagram-flow-builder .connectors .lines [data-connection-id='${currentMovingPoint.dataset.connectionId}']`);

        backupPosition = {
            x: parseInt(origin.getAttribute("cx")),
            y: parseInt(origin.getAttribute("cy")),
            destintionRefX: parseInt(destinationRef.getAttribute("cx")),
            destintionRefY: parseInt(destinationRef.getAttribute("cy")),
            points: destination.getAttribute("points"),
            d: line.getAttribute("d")
        };

        //backupPosition.linePath = 
    }

    function rollbackPoint() {
        const line = document.querySelector(`.diagram-flow-builder .connectors .lines [data-connection-id='${currentMovingPoint.dataset.connectionId}']`);
        const destination = getPoint(currentMovingPoint.dataset.connectionId, "destination");
        const origin = getPoint(currentMovingPoint.dataset.connectionId, "origin");
        const destinationRef = getPoint(currentMovingPoint.dataset.connectionId, "destination-reference");

        origin.setAttribute("cx", backupPosition.x);
        origin.setAttribute("cy", backupPosition.y);

        destination.setAttribute("points", backupPosition.points);
        destinationRef.setAttribute("cx", backupPosition.destintionRefX);
        destinationRef.setAttribute("cy", backupPosition.destintionRefY);

        line.setAttribute("d", backupPosition.d);
    }

    function clearStatus(status) {
        actionStatus = status || INITIALSTATUS;
        currentOriginPath = null;
        currentDrawingLine = null;
    }

    function setCurrentPoint(e, builder) {
        currentMovingPoint = getOverPoints(e, builder)[0];
    }

    function movingPoint(e, builder) {
        if (!currentMovingPoint)
            return;

        const isOrigin = currentMovingPoint.dataset.point == "origin";

        if (isOrigin)
            updateOriginPosition(e, builder);
        else
            updateDestinationPosition(e, builder);

        updateLineXY(currentMovingPoint.dataset.connectionId);
    }

    function updateLineXY(connectionId) {
        const line = document.querySelector(`.diagram-flow-builder .connectors .lines [data-connection-id='${connectionId}']`);
        const linePosition = getPointAttribute(line);

        svgUtils.curveLine(line,
            linePosition.destinationX,
            linePosition.destinationY,
            linePosition.originX,
            linePosition.originY);
    }

    function updateOriginPosition(e, builder) {
        const rectContainer = builder.getBoundingClientRect();
        const x = e.clientX - rectContainer.left + builder.scrollLeft;
        const y = e.clientY - rectContainer.top + builder.scrollTop;
        const data = getOriginData(currentMovingPoint);

        currentMovingPoint.setAttribute("cx", x);
        currentMovingPoint.setAttribute("cy", y);

        const pointDestinationRef = document.querySelector(`#diagram-flow-builder .connectors .points [data-connection-id='${data.connectionId}'][data-point="destination-reference"]`);
        const position = getPosition(pointDestinationRef);
        const deg = getDegDirection(pointDestinationRef.dataset.direction, position.x, position.y, x, y);
        const pointsR = svgUtils.rotatePolygonD(deg);

        const pointDestination = document.querySelector(`#diagram-flow-builder .connectors .points [data-connection-id='${data.connectionId}'][data-point="destination"]`);
        pointDestination.setAttribute("points",
            svgUtils.translatePolygonD(
                pointsR,
                position.x, position.y));
    }

    function updateDestinationPosition(e, builder) {

        const rectContainer = builder.getBoundingClientRect();
        const x = e.clientX - rectContainer.left + builder.scrollLeft;
        const y = e.clientY - rectContainer.top + builder.scrollTop;
        const connectionId = currentMovingPoint.dataset.connectionId;

        //Actualizacion de punto de referencia
        const pointDestinationRef = document.querySelector(`#diagram-flow-builder .connectors .points [data-connection-id='${connectionId}'][data-point="destination-reference"]`);
        pointDestinationRef.setAttribute("cx", x);
        pointDestinationRef.setAttribute("cy", y);

        //Actualizacion del punto de destino
        const origin = getPoint(connectionId, "origin");
        const originX = parseInt(origin.getAttribute("cx"));
        const originY = parseInt(origin.getAttribute("cy"));
        const deg = getDegDirection(pointDestinationRef.dataset.direction, x, y, originX, originY);
        const pointsR = svgUtils.rotatePolygonD(deg);


        currentMovingPoint.setAttribute("points",
            svgUtils.translatePolygonD(
                pointsR,
                x, y));
    }

    /**
     * Evento que dispara el cliente de drag and drop
     * @param {any} e
     * @returns
     */
    function onDragItem(e) {
        driagramBuilderWindowResize();

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

    function onCurrent(on) {
        return onStatus === on;
    }

    function setOnStatus(status) {
        onStatus = status;
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
        const pointDestinationRef = document.querySelector(`#diagram-flow-builder .connectors .points [data-connection-id='${point.domElement.dataset.connectionId}'][data-point="destination-reference"]`);

        point.domElement.setAttribute("cx", point.position.x + x);
        point.domElement.setAttribute("cy", point.position.y + y);

        if (pointDestinationRef) {
            let position = getPosition(pointDestinationRef);
            const deg = getDegDirection(pointDestinationRef.dataset.direction,
                position.x, position.y,
                point.position.x + x, point.position.y + y);
            const pointsR = svgUtils.rotatePolygonD(deg);

            const pointDestination = document.querySelector(`#diagram-flow-builder .connectors .points [data-connection-id='${point.domElement.dataset.connectionId}'][data-point="destination"]`);
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
        const position = getPointAttribute(line.domElement);

        svgUtils.curveLine(line.domElement,
            position.destinationX,
            position.destinationY,
            position.originX,
            position.originY);
    }

    function getPointAttribute(line) {
        const pointOrigin = document.querySelector(`#diagram-flow-builder .connectors .points [data-connection-id='${line.dataset.connectionId}'][data-point="origin"]`);
        const pointDestination = document.querySelector(`#diagram-flow-builder .connectors .points [data-connection-id='${line.dataset.connectionId}'][data-point="destination"]`);

        if (!pointOrigin && !pointDestination)
            return {};

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
        try {
            if (!onCurrent(ONBORDER))
                throw new Error("No se encuentra en el borde.");

            connectLine(e, item, builder);
        } catch (e) {
            removeLine(e, item, builder);
            removePoint(e, item, builder);

            console.log(e);
        }
    }

    function connectLine(e, item, builder) {
        setDestinationPoint(builder);

        if (!options.events.canConnect(currentOriginPath.originId, currentOriginPath.destinationId, _this.DestinationName))
            throw new Error("No se permite establecer una conexión final");

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
        const rectContainer = builder.getBoundingClientRect();
        currentDrawingLine = currentDrawingLine || getLine(builder);

        const targetX = e.clientX - rectContainer.left + builder.scrollLeft;
        const targetY = e.clientY - rectContainer.top + builder.scrollTop;

        svgUtils.curveLine(currentDrawingLine, targetX, targetY, currentOriginPath.originX, currentOriginPath.originY);
    }

    function getLine(builder) {
        return createLine(builder);
    }

    function addOriginPoint(builder) {
        let clonedPoint = builder.querySelector(".connectors .points .placeholder-connector").cloneNode();

        if (!options.events.canConnect(clonedPoint.dataset.originId, null, _this.OriginName))
            throw new Error("No se permite establecer una conexión inicial");

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
        let path = svgUtils.createPolygon();
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
        let point = builder.querySelector(".connectors .points .placeholder-connector");
        let originPoint = builder.querySelector(`.connectors .points [data-point-id='${currentOriginPath.originId}']`);

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
        let clonedLine = currentDrawingLine.cloneNode();
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
    function observerAction(e, item, builder) {
        placeholderManager(e, item, builder);

        onStatus = getOnAction(e, item, builder);

        switch (onStatus) {
            case ONPOINT:
                if (actionStatus !== MOVINGPOINT)
                    removeConnector();

                setOnStatus(ONPOINT);
                break;

            case ONBORDER:
                setOnStatus(ONBORDER);
                break;

            case ONNONE:
                removeConnector();
                break;
        }
    }

    function getOnAction(e, item, builder) {
        if (overPoint(e, builder))
            return ONPOINT;

        if (!item)
            return ONNONE;

        if (inBorder(e, item))
            return ONBORDER;

        return ONNONE;
    }

    function overPoint(e, builder) {
        const points = getOverPoints(e, builder);

        return points.length > 0;
    }


    function getOverPoints(e, builder) {
        const rectContainer = builder.getBoundingClientRect();
        const x = e.clientX - rectContainer.left + builder.scrollLeft;
        const y = e.clientY - rectContainer.top + builder.scrollTop;
        const allPoints = builder.querySelectorAll(".connectors .points [data-point]:not([data-point='destination-reference'])");


        const collisions = Array.from(allPoints)
            .filter(p => {
                const isOrigin = p.dataset.point == "origin";
                const position = isOrigin
                    ? getPosition(p)
                    : getPosition(getPoint(p.dataset.connectionId, "destination-reference"));

                const hasCollision = (x >= (position.x - marginPointCollision) && x <= (position.x + marginPointCollision)
                    && y >= (position.y - marginPointCollision) && y <= (position.y + marginPointCollision));

                p.classList.toggle('hover', hasCollision);

                return hasCollision;
            });

        document.body.style.cursor = collisions.length > 0 ? 'url("https://cdn-icons-png.flaticon.com/512/4713/4713181.png"), auto' : 'inherit';
        //document.body.style.cursor = collisions.length > 0 ? 'pointer' : 'inherit';

        return collisions;
    }

    function placeholderManager(e, item, builder) {
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

    function getItemsFromPointByClassNames(e, classNames) {
        try {
            return document.elementsFromPoint(e.x, e.y)
                .filter(d => Array.from(d.classList).some(x => classNames.indexOf(x) >= 0));
        } catch (e) {
            return null;
        }

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
        const rectContainer = builder.getBoundingClientRect();
        const x = e.clientX - rect.left ;
        const y = e.clientY - rect.top ;

        if (!item || !inBorder(e, item)) {
            //removePlaceholder(builder, circle);
            //setOnStatus(ONNONE)
            return;
        }

        //setOnStatus(ONBORDER);

        const top = y;
        const bottom = rect.height - y;
        const left = x;
        const right = rect.width - x;
        const min = Math.min(top, bottom, left, right);

        let px = 0;
        let py = 0;

        if (min === top) {
            px = x + rect.left - rectContainer.left + builder.scrollLeft;
            py = rect.top + circleInSpace - rectContainer.top + builder.scrollTop;
            positionHoverPoint = "TOP";
        } else if (min === bottom) {
            px = x + rect.left - rectContainer.left + builder.scrollLeft;
            py = rect.height + rect.top - circleInSpace - rectContainer.top + builder.scrollTop;
            positionHoverPoint = "BOTTOM";
        } else if (min === left) {
            px = rect.left + circleInSpace - rectContainer.left + builder.scrollLeft;
            py = y + rect.top - rectContainer.top;
            positionHoverPoint = "LEFT";
        } else if (min === right) {
            px = rect.width + rect.left - circleInSpace - rectContainer.left + builder.scrollLeft;
            py = y + rect.top - rectContainer.top + builder.scrollTop;
            positionHoverPoint = "RIGHT";
        }

        circle.setAttribute("cx", px);
        circle.setAttribute("cy", py);
    }

    function inBorder(e, item) {
        if (!item)
            return false;

        const rect = item.getBoundingClientRect();
        let x = e.clientX - rect.left;
        let y = e.clientY - rect.top;

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
        let path = svgUtils.createPath();
        const svgPoints = document.querySelector("#diagram-flow-builder .connectors .lines");

        path.classList.add("placeholder-path");
        path.setAttribute("data-connection-id", currentOriginPath.connectionId);

        svgPoints.appendChild(path);

        return path;
    }

    function removeConnector() {
        setOnStatus(ONNONE);

        const builder = document.querySelector("#diagram-flow-builder");
        const svgPoints = builder.querySelector(".connectors .points");
        const placeholder = svgPoints.querySelector(".placeholder-connector");

        if (!placeholder)
            return;

        svgPoints.removeChild(placeholder);
    }

    function removeFailedConnection() {
        const noConnectedPoins = Array.from(document.querySelectorAll(`.diagram-flow-builder .connectors .points [data-point='origin'][no-connected]`));

        if (noConnectedPoins.length > 0)
            noConnectedPoins.forEach(x => x.remove());

        const noConnectedLines = Array.from(document.querySelectorAll(`.diagram-flow-builder .connectors .lines .placeholder-path`));

        if (noConnectedLines.length > 0)
            noConnectedLines.forEach(x => x.remove());

        if (actionStatus === SEARCHINGCONNECTION) {
            actionStatus = INITIALSTATUS;
            currentOriginPath = null;
            currentDrawingLine = null;
        }
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
                    let position = getPosition(d);
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

    function unWindowResizeSubscribe() {
        window.removeEventListener("resize", driagramBuilderWindowResize);
    }

    function windowResizeSubscribe() {
        window.addEventListener("resize", driagramBuilderWindowResize);
    }

    function driagramBuilderWindowResize() {
        const builders = document.querySelectorAll("#diagram-flow-builder");

        builders.forEach(builder => {
            var connectors = builder.querySelector(".connectors");

            connectors.style.height = `${builder.scrollHeight}px`;
            connectors.style.width = `${builder.scrollWidth}px`;

        });
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