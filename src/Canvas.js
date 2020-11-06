import React from "react";
import recorder from 'react-canvas-recorder';

/* Default settings */
const defaultProps = {
    width: "100%",
    height: "100%",
    className: "",
    canvasColor: "red",
    background: "",
    allowOnlyPointerType: "all",
    style: {
        border: "0.0625rem solid #9c9c9c",
        borderRadius: "0.25rem",
    },
    withTimeStamp: true,
};
export class Canvas extends React.Component {
    constructor(props) {
        super(props);
        this.handlePointerDown = this.handlePointerDown.bind(this);
        this.handlePointerMove = this.handlePointerMove.bind(this);
        this.handlePointerUp = this.handlePointerUp.bind(this);
        this.exportImage = this.exportImage.bind(this);
        this.canvas = React.createRef();
        this.canvasRef = React.createRef();
        this.draw = this.draw.bind(this);
        this.clearCanvas = this.clearCanvas.bind(this);

    }
    state = {
        paths: {}
    }
    /* Add event listener to Mouse up and Touch up to
    release drawing even when point goes out of canvas */
    componentDidMount() {
        document.addEventListener("pointerup", this.handlePointerUp);
        const canvas = this.canvas.current;
        const context = canvas.getContext("2d")
        var background = new Image();
        background.src = this.props.background;

        // Make sure the image is loaded first otherwise nothing will draw.
        background.onload = function () {
            context.drawImage(background, 0, 0, canvas.width, canvas.height);
        }
        context.lineCap = "round";
        context.lineJoin = "round";
        context.strokeStyle = this.props.strokeColor
        context.lineWidth = 5

        this.canvas.current = context;
    }
    async componentDidUpdate(prevProps) {
        const paths = this.props.paths;
        console.log();
        if (prevProps.paths.length > this.props.paths.length) {
            await this.clearCanvas();
            paths.forEach(element => {
                this.draw(element.paths, element.strokeWidth, element.strokeColor);
            });
        }
        if (paths.length === 0) {
            this.clearCanvas();
        }
        else
            paths.forEach(element => {
                this.draw(element.paths, element.strokeWidth, element.strokeColor);
            });
    }
    componentWillUnmount() {
        document.removeEventListener("pointerup", this.handlePointerUp);
    }

    clearCanvas() {
        const canvas = this.canvas.current.canvas;
        const context = canvas.getContext("2d");

        context.clearRect(0, 0, canvas.width, canvas.height);

        var background = new Image();
        background.src = this.props.background;
        return new Promise((resolve, reject) => {
            background.onload = () => {
                context.drawImage(background, 0, 0, canvas.width, canvas.height);
                resolve();
            }
        });

    }

    draw(paths, lineWidth, strokeColor) {
        const canvas = this.canvas.current.canvas;
        const context = canvas.getContext("2d");
        context.lineCap = "round";
        context.lineJoin = "round";
        context.strokeStyle = strokeColor
        this.canvas.current.beginPath();
        this.canvas.current.lineWidth = lineWidth;
        paths.forEach(element => {
            this.canvas.current.lineTo(element.x, element.y)
        });
        this.canvas.current.stroke();
    }
    getCoordinatesCanvas(pointerEvent) {
        const point = {
            x: (pointerEvent.pageX - this.canvas.current.canvas.offsetLeft),
            y: (pointerEvent.pageY - this.canvas.current.canvas.offsetTop)
        };
        return point
    }
    /* Mouse Handlers - Mouse down, move and up */
    handlePointerDown(event) {

        // Allow only chosen pointer type
        const { allowOnlyPointerType, onPointerDown } = this.props;
        if (allowOnlyPointerType !== "all" &&
            event.pointerType !== allowOnlyPointerType) {
            return;
        }
        if (event.pointerType === "mouse" && event.button !== 0)
            return;
        // const point = this.getCoordinates(event);
        let point = this.getCoordinatesCanvas(event);
        point.pressure = event.pressure;
        point.tiltX = event.tiltX;
        point.tiltY = event.tiltY;
        onPointerDown(point, event);
    }
    handlePointerMove(event) {
        const { isDrawing, allowOnlyPointerType, onPointerMove } = this.props;
        if (!isDrawing)
            return;
        // Allow only chosen pointer type
        if (allowOnlyPointerType !== "all" &&
            event.pointerType !== allowOnlyPointerType) {
            return;
        }

        // const point = this.getCoordinates(event);
        let point = this.getCoordinatesCanvas(event);
        point.pressure = event.pressure;
        point.tiltX = event.tiltX;
        point.tiltY = event.tiltY;
        onPointerMove(point, event);
    }
    handlePointerUp(event) {
        if (event.pointerType === "mouse" && event.button !== 0)
            return;
        // Allow only chosen pointer type
        const { allowOnlyPointerType, onPointerUp } = this.props;
        if (allowOnlyPointerType !== "all" &&
            event.pointerType !== allowOnlyPointerType) {
            return;
        }
        onPointerUp();
    }
    startRecording = (() => {
        recorder.createStream(this.canvas.current.canvas);
        recorder.start();
    })

    stopRecording = (() => {
        return new Promise((resolve, reject) => {
            recorder.stop();
            const file = recorder.save();
            resolve(file);
        })

    });
    /* Mouse Handlers ends */
    // Creates a image from SVG and renders it on canvas, then exports the canvas as image
    exportImage(imageType) {
        return this.canvas.current.canvas.toDataURL();

    }

    /* Finally!!! Render method */
    render() {
        const { width, height, background, style } = this.props;
        return (
            <div>
                <canvas
                    onPointerDown={this.handlePointerDown}
                    onPointerMove={this.handlePointerMove}
                    onPointerUp={this.handlePointerUp}
                    ref={this.canvas}
                    height={height}
                    width={width}
                    style={{
                        touchAction: "none",
                        ...style
                    }}
                >
                </canvas>
            </div>

        );
    }
}
Canvas.defaultProps = defaultProps