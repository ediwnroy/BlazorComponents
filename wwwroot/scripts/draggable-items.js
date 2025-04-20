(async function (window) {
    var draggableElements = {};

    window.draggable = {
        init: init,
        stop: stop
    };

    function init(elementId, options, dotnetReference) {
        var draggable = getDraggableElement(elementId, options, dotnetReference);

        options.dotnetReference = dotnetReference;

        draggable.init(options);
    }

    function stop(elementId, options, dotnetReference) {
        if (!elementId || !options || !dotnetReference)
            return;

        var draggable = getDraggableElement(elementId, options, dotnetReference);

        options.dotnetReference = dotnetReference;

        draggable.stop();

        draggableElements[id] = null;
    }

    function getDraggableElement(id, options, dotnetReference) {
        let draggable = draggableElements[id];

        if (!draggable) {
            draggable = newDraggableElement(id, options, dotnetReference);
            draggableElements[id] = draggable;
        }

        return draggable;
    }

    function newDraggableElement(id, options, dotnetReference) {
        return new DraggableElement(id, options);
    }
})(window);

function DraggableElement(elementId, iOptions) {
    let isDragging = false;
    let startX, startY;
    let minDistance = 10;
    let draggableElement;
    let scrollParentElement;
    let isTriggered;
    let options = iOptions;
    let preventDrag = false;

    this.preventDefault = function () {
        isDragging = false;
    }


    this.init = function (_options) {
        options = _options;

        unRegisterMouseDown();
        registerMouseDown();
    };

    this.stop = function () {
        isDragging = false;

        unRegisterMouseDown(draggableElement);
        unRegisterMouseMove();
    };

    function dragAndDropMouseDown(e) {
        if (!e.target.closest(elementId) || e.target.closest(".no-trigger-mouse-move")) {
            isDragging = false;
            return;
        }

        draggableElement = document.querySelector(elementId);
        scrollParentElement = document.querySelector(options.scrollContainerQuerySelector);

        const bounce = getDragElementSize(draggableElement);
        const style = window.getComputedStyle(draggableElement);

        isDragging = true;

        startX = options.isRelative ? (e.pageX - parseFloat(style.left)) : (e.clientX - parseInt(bounce.left));
        startY = options.isRelative ? (e.pageY - getScrolY() - parseFloat(style.top)) : (e.clientY - parseInt(bounce.top));

        unRegisterMouseMove();
        registerMouseMove();
    }

    function getScrolX() {
        return scrollParentElement ? scrollParentElement.scrollLeft || 0 : 0;
    }
    function getScrolY() {
        return scrollParentElement ? scrollParentElement.scrollTop || 0 : 0;
    }

    function dragAndDropMouseUp(e) {
        const isdrag = isDragging;
        preventDrag = false
        isDragging = false;

        //unRegisterMouseDown();
        unRegisterMouseMove();

        setTimeout((options, isdrag) => {
            if (isdrag && options && options.dotnetReference)
                options.dotnetReference.invokeMethodAsync("DraggingElementStop", iOptions.id);
        }, 10, options, isdrag);


        triggerEvents("stopDragging");
    }

    function dragAndDropMouseMove(e) {
        e.preventDefault();
        e.stopPropagation();

        dragElement(e);
    }

    function dragElement(e) {
        if (!isDragging)
            return;

        let x = getXPosition(e);
        let y = getYPosition(e);
        let deltaX = x;
        let deltaY = y;

        if (options.limitBorder && options.isRelative) {
            let contentSize = getDragElementSize(draggableElement);
            let positionContainerElement = getDragElementSize(document.querySelector(options.containerElementSelector));

            let minWidth = contentSize.left - (contentSize.x - positionContainerElement.x);
            let maxWidth = (positionContainerElement.x + positionContainerElement.width) - (contentSize.x + contentSize.width - contentSize.left);
            let minHeight = contentSize.top - (contentSize.y - positionContainerElement.y);
            let maxHeight = (positionContainerElement.y + positionContainerElement.scrollHeight) - (contentSize.y + contentSize.height - contentSize.top);

            x = Math.max(minWidth, Math.min(x, maxWidth));
            y = Math.max(minHeight, Math.min(y, maxHeight));
        }

        draggableElement.setAttribute("style", `left:${x}px;top:${y}px;${options.styles}`);

        setTimeout((x, y, options) => {
            if (options && options.dotnetReference)
                options.dotnetReference.invokeMethodAsync("DraggingElement", x, y, getXDirection(deltaX), getYDirection(deltaY));
        }, 10, x, y, options);

        triggerEvents("dragging");
    }

    function triggerEvents(action) {
        if (!options.subscriptionEventOnDrag)
            return;

        var evt = new CustomEvent(options.subscriptionEventOnDrag, {
            detail: {
                sourceId: options.id,
                action : action
            }
        });

        window.dispatchEvent(evt);
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

    function dragAndDropTouchMove(e) {
        var positions = getTouchScreen(e);

        dragAndDropMouseMove(positions);
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
        if (isDragging) {
            e.preventDefault();
            e.stopImmediatePropagation();
        }

        isDragging = false;
    });

    function registerMouseMove() {
        document.body.addEventListener("mousemove", dragAndDropMouseMove);
        document.body.addEventListener("touchstart", dragAndDropTouchMove);
    }

    function unRegisterMouseMove() {
        document.body.removeEventListener("mousemove", dragAndDropMouseMove);
        document.body.removeEventListener("touchstart", dragAndDropTouchMove);
    }


    function registerMouseDown() {
        document.body.addEventListener("mousedown", dragAndDropMouseDown);
        document.body.addEventListener("mouseup", dragAndDropMouseUp);
    }

    function unRegisterMouseDown() {
        document.body.removeEventListener("mousedown", dragAndDropMouseDown);
        document.body.removeEventListener("mouseup", dragAndDropMouseUp);
    }

    function getDragElementSize(draggableElement) {
        const style = window.getComputedStyle(draggableElement);
        const elementBoundingRect = draggableElement.getBoundingClientRect();

        return {
            x: parseInt(elementBoundingRect.left),
            y: parseInt(elementBoundingRect.top),
            width: elementBoundingRect.width,
            height: elementBoundingRect.height,
            marginTop: getComputedStyleValue(draggableElement, 'margin-top'),
            offSetLeft: parseFloat(draggableElement.offsetLeft),
            offSetTop: parseFloat(draggableElement.offsetTop),
            left: parseFloat(style.left) || 0,
            top: parseFloat(style.top) || 0,
            scrollHeight: draggableElement.scrollHeight,
            scrollTop: draggableElement.scrollTop,
        };
    }

    function getComputedStyleValue(element, name) {
        try {
            return parseFloat(window.getComputedStyle(element, null).getPropertyValue(name));
        } catch (e) {
            return 0;
        }
    }
}