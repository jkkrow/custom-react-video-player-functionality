import VideoPlayer from './components/Player/VideoPlayer';
import './App.css';

const src =
  'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4';

function App() {
  return (
    <div className="App">
      <VideoPlayer src={src} autoPlay={true} />
    </div>
  );
}

export default App;
