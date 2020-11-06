import React from 'react';
import { ReactSketchCanvas } from './ReactSketchCanvas';
import Background from './bg.png';
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
import "./App.css"
const ffmpeg = createFFmpeg({
  log: true,
});

class App extends React.Component {
  constructor(props) {
    super(props);

    this.canvas = React.createRef();
  }

  state = {
    videoSrc: "",
    setVideoSrc: "",
    file: "",
    isRecording: false
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


  render() {
    return (
      <div style={{
        width: "100%",
        height: "100%"
      }}>

        <center>
          <ReactSketchCanvas
            ref={this.canvas}
            width="1200px"
            height="600px"
            strokeWidth={4}
            strokeColor="red"
            background={Background}
            withTimestamp={true}
          >

          </ReactSketchCanvas>
        </center>
        <div className="container">
          <button
            className="getImage"
            onClick={() => {
              const data = this.canvas.current.exportImage("png")
              console.log(data);
              var a = document.createElement("a"); //Create <a>
              a.href = data;
              a.download = `Image_${new Date.now()}.png`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);

            }}
          >
            Get Image
        </button>

          <input className="choose" type="file" onChange={this.handleUpload} />

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
              link.download = `paths_${new Date.now()}.json`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
          >
            Export paths
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
                tempLink.setAttribute('download', `video_${new Date.now()}.webm`);
                document.body.appendChild(tempLink);
                tempLink.click();
                document.body.removeChild(tempLink);
              }
            })
          }
          }>{this.state.isRecording ? "Stop Recording" : "Start Recording"}</button>
        </div>


      </div>


    );
  }

}
export default App;