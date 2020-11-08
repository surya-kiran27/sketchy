import React from 'react';
import { ReactSketchCanvas } from './ReactSketchCanvas';
import Background from './bg.png';
// import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
import "./App.css"
import { CompactPicker } from 'react-color';

// const ffmpeg = createFFmpeg({
//   log: true,
// });

class App extends React.Component {
  constructor(props) {
    super(props);

    this.canvas = React.createRef();
  }

  state = {
    videoSrc: "",
    setVideoSrc: "",
    file: "",
    isRecording: false,
    strokeColor: "black",
    background: "",
    videoBlob: "",
    image: "",
    pathsBlob: "",
    fileName: "sample"
  }
  blobToFile = (theBlob, fileName) => {
    theBlob.lastModifiedDate = new Date();
    theBlob.name = fileName;
    return theBlob;
  }

  handleUpload = (event) => {
    this.setState({
      file: event.target.files[0]
    }, () => {
      let fileData = new FileReader();
      fileData.readAsText(this.state.file);
      fileData.onloadend = (e) => {
        console.log(`contents loaded from file are`, e.target.result);
        this.canvas.current.loadPaths(JSON.parse(e.target.result));
      };

    });
  }
  handleBackgroundUpload = (event) => {
    this.setState({
      background: event.target.files[0]
    }, () => {


    });
  }
  getBase64 = (e) => {
    if (e.target.files.length >= 1) {
      var file = e.target.files[0]
      let reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        this.setState({
          background: reader.result
        })
      };
      reader.onerror = function (error) {
        console.log('Error: ', error);
      }
    } else {
      alert("No file uploaded");
    }

  }


  handleChangeComplete = (color) => {
    this.setState({ strokeColor: color.hex });

  };

  render() {
    return (
      <div style={{
        width: "100%",
        height: "100%"
      }}>

        <center>
          <div className="row">
            <div className="container">
              <label>Pick a Sketch color</label>
              <CompactPicker
                className="picker"
                color={this.state.strokeColor}
                onChangeComplete={this.handleChangeComplete}
              />
              <button
                className="clear"
                onClick={() => {
                  this.canvas.current.clearCanvas();
                }}
              >
                Clear
              </button>
              <button
                className="undo"
                onClick={() => {
                  this.canvas.current.undo();
                }}
              >
                undo
               </button>
              <button
                className="redo"
                onClick={() => {
                  this.canvas.current.redo();
                }}
              >
                Redo
            </button>


              {/* {<button className="startRecording" style={{ backgroundColor: `${this.state.isRecording ? "#E64A19" : "#1976D2"} ` }} onClick={async () => {
                this.setState({ isRecording: !this.state.isRecording }, async () => {
                  if (this.state.isRecording) {
                    this.canvas.current.startRecording();
                  } else {
                    const res = await this.canvas.current.stopRecording()
                    this.setState({ videoBlob: res });

                  }
                })
              }
              }>{this.state.isRecording ? "Stop Recording" : "Start Recording"}</button>} */}
              <button
                className="getImage"
                onClick={async () => {
                  const paths = await this.canvas.current.exportPaths(true);
                  const pathsBlob = new Blob([JSON.stringify(paths)], { type: 'application/json' });
                  const image = this.canvas.current.exportImage("png")
                  const videoBlob = await this.canvas.current.stopRecording()


                  // downloading image
                  if (image !== "") {
                    var a = document.createElement("a");
                    a.href = image;
                    a.download = `${this.state.fileName}.png`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                  }
                  if (videoBlob !== "") {
                    var videoUrl = window.URL.createObjectURL(videoBlob);
                    let tempLink = document.createElement('a');
                    tempLink.href = videoUrl;
                    tempLink.setAttribute('download', `${this.state.fileName}.webm`);
                    document.body.appendChild(tempLink);
                    tempLink.click();
                    document.body.removeChild(tempLink);
                  }
                  if (pathsBlob !== "") {
                    const href = URL.createObjectURL(pathsBlob);
                    const link = document.createElement('a');
                    link.href = href;
                    link.download = `${this.state.fileName}.json`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }
                  window.location.reload();
                }}
              >
                Download All
            </button>
              <input className="choose" type="file" onChange={this.handleUpload} />
              <label>upload background image</label>
              <input className="choose" type="file" onChange={this.getBase64} />

              <input placeholder="Enter File Name" className="fileName" onChange={(e) => { this.setState({ fileName: e.target.value }) }} value={this.state.fileName} />

            </div>



            <ReactSketchCanvas
              ref={this.canvas}
              width="1200px"
              strokeWidth={4}
              strokeColor={this.state.strokeColor}
              background={this.state.background !== "" ? this.state.background : Background}
              withTimestamp={true}
            >

            </ReactSketchCanvas>
          </div>



        </center>

      </div>


    );
  }

}
export default App;