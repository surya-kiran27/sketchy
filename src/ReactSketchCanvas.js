import React from "react";
import { produce } from "immer";
import { Canvas } from "./Canvas";
/* Default settings */
const defaultProps = {
    width: "100%",
    height: "100%",
    className: "",
    canvasColor: "white",
    strokeColor: "red",
    background: "",
    strokeWidth: 4,
    eraserWidth: 8,
    allowOnlyPointerType: "all",
    style: {
        border: "0.0625rem solid #9c9c9c",
        borderRadius: "0.25rem",
    },

    onUpdate: (_) => { },
    withTimestamp: false,
};
export class ReactSketchCanvas extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            // eslint-disable-next-line react/no-unused-state
            drawMode: true,
            isDrawing: false,
            // eslint-disable-next-line react/no-unused-state
            resetStack: [],
            undoStack: [],
            currentPaths: [],
        };
        this.handlePointerDown = this.handlePointerDown.bind(this);
        this.handlePointerMove = this.handlePointerMove.bind(this);
        this.handlePointerUp = this.handlePointerUp.bind(this);
        this.exportImage = this.exportImage.bind(this);
        this.exportPaths = this.exportPaths.bind(this);
        this.loadPaths = this.loadPaths.bind(this);
        this.eraseMode = this.eraseMode.bind(this);
        this.clearCanvas = this.clearCanvas.bind(this);
        this.undo = this.undo.bind(this);
        this.redo = this.redo.bind(this);
        this.getSketchingTime = this.getSketchingTime.bind(this);
        this.liftPathsUp = this.liftPathsUp.bind(this);
        this.svgCanvas = React.createRef();
    }
    getSketchingTime() {
        const { withTimestamp } = this.props;
        const { currentPaths } = this.state;
        return new Promise((resolve, reject) => {
            if (!withTimestamp) {
                reject(new Error("Set 'withTimestamp' prop to get sketching time"));
            }
            try {
                const sketchingTime = currentPaths.reduce((totalSketchingTime, path) => {
                    var _a, _b;
                    const startTimestamp = (_a = path.startTimestamp) !== null && _a !== void 0 ? _a : 0;
                    const endTimestamp = (_b = path.endTimestamp) !== null && _b !== void 0 ? _b : 0;
                    return totalSketchingTime + (endTimestamp - startTimestamp);
                }, 0);
                resolve(sketchingTime);
            }
            catch (e) {
                reject(e);
            }
        });
    }
    liftPathsUp() {
        const { currentPaths } = this.state;
        const { onUpdate } = this.props;
        onUpdate(currentPaths);
    }
    /* Mouse Handlers - Mouse down, move and up */
    handlePointerDown(point, event) {

        const { strokeColor, canvasColor, withTimestamp, } = this.props;
        this.setState(produce((draft) => {
            draft.isDrawing = true;
            draft.undoStack = [];
            let stroke = {
                drawMode: draft.drawMode,
                strokeColor: strokeColor,
                strokeWidth: this.getLineWidth(event),
                pointerType: event.pointerType,
                pressure: event.pressure,
                tiltX: event.tiltX,
                tiltY: event.tiltY,
                paths: [point],
            };
            if (withTimestamp) {
                stroke = Object.assign(Object.assign({}, stroke), { startTimestamp: Date.now(), endTimestamp: 0 });
            }

            draft.currentPaths.push(stroke);
        }), this.liftPathsUp);
    }
    handlePointerMove(point, event) {

        const { isDrawing } = this.state;

        if (!isDrawing)
            return;
        this.setState(produce((draft) => {
            const currentStroke = draft.currentPaths[draft.currentPaths.length - 1];
            if (this.state.currentPaths[draft.currentPaths.length - 1].strokeWidth !== this.getLineWidth(event)) {

                const { strokeColor, canvasColor, withTimestamp, } = this.props;
                let stroke = {
                    drawMode: draft.drawMode,
                    strokeColor: strokeColor,
                    strokeWidth: this.getLineWidth(event),
                    pressure: event.pressure,
                    paths: [point],
                    pointerType: event.pointerType,
                    tiltX: event.tiltX,
                    tiltY: event.tiltY,

                };
                draft.currentPaths.push(stroke);
                if (withTimestamp) {
                    stroke = Object.assign(Object.assign({}, stroke), { startTimestamp: Date.now(), endTimestamp: 0 });
                }
            }
            currentStroke.paths.push(point);
        }), this.liftPathsUp);
    }
    getLineWidth = function getLineWidth(e) {
        switch (e.pointerType) {
            case 'touch': {
                if (e.width < 10 && e.height < 10) {
                    return (e.width + e.height) * 2 + 10;
                } else {
                    return (e.width + e.height - 70) / 6;
                }
            }
            case 'pen': return e.pressure * 4;//increase or decrease stroke width
            default: return (e.pressure) ? e.pressure * 6 : 6;
        }
    }
    handlePointerUp() {
        const { withTimestamp } = this.props;
        const { isDrawing } = this.state;
        if (!isDrawing) {
            return;
        }
        this.setState(produce((draft) => {
            draft.isDrawing = false;
            if (!withTimestamp) {
                return;
            }
            let currentStroke = draft.currentPaths.pop();

            if (currentStroke) {
                currentStroke = Object.assign(Object.assign({}, currentStroke), { endTimestamp: Date.now() });
                draft.currentPaths.push(currentStroke);

            }
        }), this.liftPathsUp);
    }
    /* Mouse Handlers ends */
    /* Canvas operations */
    eraseMode(erase) {
        this.setState(produce((draft) => {
            draft.drawMode = !erase;
        }), this.liftPathsUp);
    }
    clearCanvas() {
        this.setState(produce((draft) => {
            draft.resetStack = draft.currentPaths;
            draft.currentPaths = [];
        }), this.liftPathsUp);

    }
    undo() {
        const { resetStack } = this.state;
        // If there was a last reset then
        if (resetStack.length !== 0) {
            this.setState(produce((draft) => {
                draft.currentPaths = draft.resetStack;
                draft.resetStack = [];
            }), () => {
                const { currentPaths } = this.state;
                const { onUpdate } = this.props;
                onUpdate(currentPaths);
            });
            return;
        }
        this.setState(produce((draft) => {
            const lastSketchPath = draft.currentPaths.pop();
            if (lastSketchPath) {
                draft.undoStack.push(lastSketchPath);
            }
        }),
            this.liftPathsUp()

        );


    }
    redo() {
        const { undoStack } = this.state;
        // Nothing to Redo
        if (undoStack.length === 0)
            return;
        this.setState(produce((draft) => {
            const lastUndoPath = draft.undoStack.pop();
            if (lastUndoPath) {
                draft.currentPaths.push(lastUndoPath);
            }
        }), this.liftPathsUp);
    }
    /* Exporting options */
    // Creates a image from SVG and renders it on canvas, then exports the canvas as image
    exportImage(imageType) {
        var _a;
        const exportImage = (_a = this.svgCanvas.current) === null || _a === void 0 ? void 0 : _a.exportImage;
        if (!exportImage) {
            throw Error("Export function called before canvas loaded");
        }
        else {
            return exportImage(imageType);
        }
    }
    startRecording() {
        this.svgCanvas.current.startRecording();
    }
    async stopRecording() {
        return await this.svgCanvas.current.stopRecording();
    }

    exportPaths() {
        const { currentPaths } = this.state;
        return new Promise((resolve, reject) => {
            try {
                resolve(currentPaths);
            }
            catch (e) {
                reject(e);
            }
        });
    }
    loadPaths(paths) {

        this.setState(produce((draft) => {
            draft.currentPaths = draft.currentPaths.concat(paths);
        }), this.liftPathsUp);
    }
    /* Finally!!! Render method */
    render() {
        const { width, height, className, canvasColor, background, style, allowOnlyPointerType, strokeColor } = this.props;
        const { currentPaths, isDrawing } = this.state;

        return (

            <Canvas
                ref={this.svgCanvas}
                width={width}
                height={height}
                className={className}
                canvasColor={canvasColor}
                strokeColor={strokeColor}
                background={background}
                allowOnlyPointerType={allowOnlyPointerType}
                style={style}
                paths={currentPaths}
                isDrawing={isDrawing}
                onPointerDown={this.handlePointerDown}
                onPointerMove={this.handlePointerMove}
                onPointerUp={this.handlePointerUp}
            />

        );
    }
}
ReactSketchCanvas.defaultProps = defaultProps;