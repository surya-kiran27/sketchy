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
    background: ""
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

  timeStamp() {
    // Create a date object with the current time
    var now = new Date();

    // Create an array with the current month, day and time
    var date = [now.getMonth() + 1, now.getDate(), now.getFullYear()];

    // Create an array with the current hour, minute and second
    var time = [now.getHours(), now.getMinutes(), now.getSeconds()];

    // Determine AM or PM suffix based on the hour
    var suffix = (time[0] < 12) ? "AM" : "PM";

    // Convert hour from military time
    time[0] = (time[0] < 12) ? time[0] : time[0] - 12;

    // If hour is 0, set it to 12
    time[0] = time[0] || 12;

    // If seconds and minutes are less than 10, add a zero
    for (var i = 1; i < 3; i++) {
      if (time[i] < 10) {
        time[i] = "0" + time[i];
      }
    }

    // Return the formatted string
    return date.join("/") + "_" + time.join(":") + "_" + suffix;
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


              <button className="startRecording" style={{ backgroundColor: `${this.state.isRecording ? "#E64A19" : "#1976D2"} ` }} onClick={async () => {
                this.setState({ isRecording: !this.state.isRecording }, async () => {
                  if (this.state.isRecording) {
                    this.canvas.current.startRecording();
                  } else {
                    const res = await this.canvas.current.stopRecording()
                    console.log(res);
                    //convert to mp4
                    // var myFile = this.blobToFile(res, "test.webm");
                    // await ffmpeg.load();
                    // ffmpeg.FS('writeFile', "test.webm", await fetchFile(myFile));
                    // await ffmpeg.run('-i', "test.webm", 'video.mp4');
                    // const data = ffmpeg.FS('readFile', 'video.mp4');
                    // var csvURL = window.URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));
                    var csvURL = window.URL.createObjectURL(res);//disable for mp4
                    let tempLink = document.createElement('a');
                    tempLink.href = csvURL;
                    tempLink.setAttribute('download', `video_${this.timeStamp()}.webm`);
                    document.body.appendChild(tempLink);
                    tempLink.click();
                    document.body.removeChild(tempLink);
                  }
                })
              }
              }>{this.state.isRecording ? "Stop Recording" : "Start Recording"}</button>
              <button
                className="getImage"
                onClick={() => {
                  const data = this.canvas.current.exportImage("png")
                  var a = document.createElement("a"); //Create <a>
                  a.href = data;
                  a.download = `Image_${this.timeStamp()}.png`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);

                }}
              >
                Download Image
        </button>
              <input className="choose" type="file" onChange={this.handleUpload} />
              <label>upload background image</label>
              <input className="choose" type="file" onChange={this.getBase64} />
              <button
                className="exportPaths"
                onClick={async () => {

                  const paths = await this.canvas.current.exportPaths(true);
                  if (paths.length === 0)
                    alert("Please draw something!");
                  const blob = new Blob([JSON.stringify(paths)], { type: 'application/json' });
                  const href = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = href;
                  link.download = `paths_${this.timeStamp()}.json`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
              >
                Export paths
        </button>
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