function DiagramBuilder(elementId, iOptions) {
    let options = iOptions;

    this.init = function (_options) {
        domBuilder = new DiagramDomObserver({
            elementId: elementId,
            events: {
                onFocusElement: onFocusElement,
                canFocus: canFocus,
                canConnect: canConnect,
                connected: connected,
            }
        });
    };

    this.stop = function () {
        domBuilder.stop();
    };

    function onFocusElement(elementId, focusName) {
        switch (focusName) {
            case "out":
                options.dotnetReference.invokeMethodAsync("OutFocusItem", elementId);
                break;

            case "in":
                options.dotnetReference.invokeMethodAsync("InFocusItem", elementId);
                break;
        }
    }

    function connected(originid, targeId) {
        
    }

    function canFocus(elementId) {
        return true;
    }

    function canConnect(elementId) {
        return true;
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
