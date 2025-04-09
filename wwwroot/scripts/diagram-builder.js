function DiagramBuilder(elementId, iOptions) {
    let options = iOptions;
    let scrollParentElement;
    let lastItemOnMouseEnter;
    let control;
    let circleWidth = 6;
    let circleInSpace = 10;
    let delta = 20;
    let inBorderFlag = true;
    let drawingPoint = true;
    let drawingLine = !drawingPoint;
    const itemClassNameSelector = ".diagram-flow-item";

    this.init = function (_options) {
        options = _options;

        unRegisterMouseMove();
        registerMouseMove();

        unRegisterMouseDown();
        registerMouseDown();
    };

    this.stop = function () {
        unRegisterMouseDown(control);
        unRegisterMouseMove();
    };

    function diagramBuilderMouseDown(e) {
        const item = getItemFromPoint(e);

        setFlagDragingLine(inBorderFlag);
        setFlagDrawingPoint(!drawingLine);

        if (!item)
            return;

        unRegisterMouseMove();
        registerMouseMove();
    }

    function diagramBuilderMouseUp(e) {
        //const isdrag = isDragging;

        //isDragging = false;

        //unRegisterMouseMove();

        //setTimeout((options, isdrag) => {
        //    if (isdrag && options && options.dotnetReference)
        //        options.dotnetReference.invokeMethodAsync("DraggingElementStop", iOptions.id);
        //}, 10, options, isdrag);
    }

    function diagramBuilderTouchMove(e) {
        let positions = getTouchScreen(e);

        diagramBuilderMouseMove(positions);
    }

    function diagramBuilderMouseMove(e) {

        if (drawingPoint)
            drawingPlaceholderPoint(e);

        if (drawingLine)
            drawingLineConnector(e);
    }

    function drawingLineConnector(e) {

    }

    function drawingPlaceholderPoint(e) {
        const item = getItemFromPoint(e);

        if (!item) {
            if (!lastItemOnMouseEnter)
                return;

            options.dotnetReference.invokeMethodAsync("OutFocusItem", getItemId(lastItemOnMouseEnter));

            removeConnector(lastItemOnMouseEnter);

            lastItemOnMouseEnter = null;

            return;
        }

        if (item)
            placeholderConnector(e, item);

        if (item.classList.contains(itemClassNameSelector))
            return;

        options.dotnetReference.invokeMethodAsync("InFocusItem", getItemId(item));

        lastItemOnMouseEnter = item;
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

    function placeholderConnector(e, item) {
        const builder = document.querySelector("#diagram-flow-builder");
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
        circle.setAttribute("data-origin-id", getItemId(item) );
        circle.classList.toggle("placeholder-connector", true);

        svgPoints.appendChild(circle);

        return circle;
    }

    function getScrolX() {
        return scrollParentElement ? scrollParentElement.scrollLeft || 0 : 0;
    }
    function getScrolY() {
        return scrollParentElement ? scrollParentElement.scrollTop || 0 : 0;
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

    function dragElement(e) {
        //if (!isDragging)
        //    return;

        //let x = getXPosition(e);
        //let y = getYPosition(e);
        //let deltaX = x;
        //let deltaY = y;

        //if (options.limitBorder && options.isRelative) {
        //    let contentSize = getElementSize(control);
        //    let positionContainerElement = getElementSize(document.querySelector(options.containerElementSelector));

        //    let minWidth = contentSize.left - (contentSize.x - positionContainerElement.x);
        //    let maxWidth = (positionContainerElement.x + positionContainerElement.width) - (contentSize.x + contentSize.width - contentSize.left);
        //    let minHeight = contentSize.top - (contentSize.y - positionContainerElement.y);
        //    let maxHeight = (positionContainerElement.y + positionContainerElement.scrollHeight) - (contentSize.y + contentSize.height - contentSize.top);

        //    x = Math.max(minWidth, Math.min(x, maxWidth));
        //    y = Math.max(minHeight, Math.min(y, maxHeight));
        //}

        //control.setAttribute("style", `left:${x}px;top:${y}px;${options.styles}`);

        //setTimeout((x, y, options) => {
        //    if (options && options.dotnetReference)
        //        options.dotnetReference.invokeMethodAsync("DraggingElement", x, y, getXDirection(deltaX), getYDirection(deltaY));
        //}, 10, x, y, options);
    }

    function getXDirection(x) {
        return x > 0 ? "RIGHT" : "LEFT";
    }
    function getYDirection(y) {
        return y > 0 ? "DOWM" : "UP";
    }

    function getXPosition(e) {
        return (e.clientX - startX);
    }

    function getYPosition(e) {
        return (e.clientY - getScrolY() - startY);
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
        //if (isDragging) {
        //    e.preventDefault();
        //    e.stopImmediatePropagation();
        //}

        //isDragging = false;
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

    function getElementSize(draggableElement) {
        //const style = window.getComputedStyle(draggableElement);
        //const elementBoundingRect = draggableElement.getBoundingClientRect();

        //return {
        //    x: parseInt(elementBoundingRect.left),
        //    y: parseInt(elementBoundingRect.top),
        //    width: elementBoundingRect.width,
        //    height: elementBoundingRect.height,
        //    marginTop: getComputedStyleValue(draggableElement, 'margin-top'),
        //    offSetLeft: parseFloat(draggableElement.offsetLeft),
        //    offSetTop: parseFloat(draggableElement.offsetTop),
        //    left: parseFloat(style.left) || 0,
        //    top: parseFloat(style.top) || 0,
        //    scrollHeight: draggableElement.scrollHeight,
        //    scrollTop: draggableElement.scrollTop,
        //};
    }

    function getComputedStyleValue(element, name) {
        //try {
        //    return parseFloat(window.getComputedStyle(element, null).getPropertyValue(name));
        //} catch (e) {
        //    return 0;
        //}
    }
}

(async function (window) {
    let diagramBuilders = {};

    window.diagramBuilder = {
        init: init,
        stop: stop
    };

    function init(elementId, options, dotnetReference) {
        let control = getElement(elementId, options, dotnetReference);

        options.dotnetReference = dotnetReference;

        control.init(options);
    }

    function stop(elementId, options, dotnetReference) {
        if (!elementId || !options || !dotnetReference)
            return;

        let control = getElement(elementId, options, dotnetReference);

        options.dotnetReference = dotnetReference;

        control.stop();

        diagramBuilders[id] = null;
    }

    function getElement(id, options, dotnetReference) {
        let control = diagramBuilders[id];

        if (!control) {
            control = newElement(id, options, dotnetReference);
            diagramBuilders[id] = control;
        }

        return control;
    }

    function newElement(id, options, dotnetReference) {

        return new DiagramBuilder(id, options);
    }

})(window);
