import {useEffect} from "react";
import NxWelcome from './nx-welcome';


export function App() {
  useEffect(() => {
    console.log('environment variables', process.env.API_URL)
  }, [])
  return (
    <div>
      <NxWelcome title="render-test" />
    </div>
  );
}

export default App;
