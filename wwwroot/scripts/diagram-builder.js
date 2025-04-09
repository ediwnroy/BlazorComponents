

function DiagramBuilder(elementId, iOptions) {
    let options = iOptions;
    let scrollParentElement;
    let lastItemOnMouseEnter;
    let control;
    const itemClassNameSelector = ".diagram-flow-item";

    this.init = function (_options) {
        options = _options;

        unRegisterMouseMove();
        registerMouseMove();
    };

    this.stop = function () {
        unRegisterMouseDown(control);
        unRegisterMouseMove();
    };

    function diagramBuilderMouseDown(e) {
        const item = e.target.closest(itemClassNameSelector);

        if (!item) {
            return;
        }

        //control = document.querySelector(elementId);
        //scrollParentElement = document.querySelector(options.scrollContainerQuerySelector);

        //const bounce = getElementSize(control);
        //const style = window.getComputedStyle(control);

        //isDragging = true;

        //startX = options.isRelative ? (e.pageX - parseFloat(style.left)) : (e.clientX - parseInt(bounce.left));
        //startY = options.isRelative ? (e.pageY - getScrolY() - parseFloat(style.top)) : (e.clientY - parseInt(bounce.top));

        unRegisterMouseMove();
        registerMouseMove();
    }

    function getScrolX() {
        return scrollParentElement ? scrollParentElement.scrollLeft || 0 : 0;
    }
    function getScrolY() {
        return scrollParentElement ? scrollParentElement.scrollTop || 0 : 0;
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

    function diagramBuilderMouseMove(e) {
        const item = e.target.closest(itemClassNameSelector);

        if (!item) {
            if (!lastItemOnMouseEnter)
                return;

            options.dotnetReference.invokeMethodAsync("OutFocusItem", getItemId(lastItemOnMouseEnter));

            removeConnector(lastItemOnMouseEnter);

            lastItemOnMouseEnter = null;

            return;
        }

        if (lastItemOnMouseEnter)
            linkConnector(e);

        if (item.classList.contains(itemClassNameSelector))
            return;

        options.dotnetReference.invokeMethodAsync("InFocusItem", getItemId(item));

        lastItemOnMouseEnter = item;
    }

    function linkConnector(e) {
        var newConnector = lastItemOnMouseEnter.querySelector(".connectors .new-connector");

        if (!newConnector)
            newConnector = createConnector();

    }

    function removeConnector() {

    }

    function getItemId(element) {
        if (!element)
            return;

        return element.dataset.id;
    }

    function createConnector() {
        const connectorWrap = lastItemOnMouseEnter.querySelector(".connectors");
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");

        circle.setAttribute("cx", "100"); 
        circle.setAttribute("cy", "100"); 
        circle.setAttribute("r", "10");
        circle.setAttribute("fill", "blue"); 

        svg.classList.toggle("new-connector", true);
        svg.appendChild(circle);

        connectorWrap.appendChild(svg);

        return svg;
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

    function diagramBuilderTouchMove(e) {
        var positions = getTouchScreen(e);

        diagramBuilderMouseMove(positions);
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
    var diagramBuilders = {};

    window.diagramBuilder = {
        init: init,
        stop: stop
    };

    function init(elementId, options, dotnetReference) {
        var control = getElement(elementId, options, dotnetReference);

        options.dotnetReference = dotnetReference;

        control.init(options);
    }

    function stop(elementId, options, dotnetReference) {
        if (!elementId || !options || !dotnetReference)
            return;

        var control = getElement(elementId, options, dotnetReference);

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
