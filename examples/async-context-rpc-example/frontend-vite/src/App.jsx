import React from "react";
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import {Hello,WS} from './ws.js';
// import {hello} from './hello.mjs';

import { createContext } from  'asynchronous-context-rpc/ws-frontend-callapi-context-factory' ;

// alert( createContext );
// const context = await createContext({ websocket: new WebSocket( 'ws://schizostylis.local:3632/foo' ) })
// alert( context );
// context.hello();
//
// alert( hello);

function App() {
  const [count, setCount] = React.useState(0)

  const ref = React.useRef( null );
  async function handleClick() {
    try {
      alert('before');
      alert( 'how are you' + ':' +  await ref.current.backendContext.how_are_you(1,2,3) );
      alert('after');
    } catch (e){
      console.error(e);
      alert('error');
      alert(e);
    }
  }

  React.useEffect(()=>{
    if ( ref.current === null ) {
      ref.current = new WS( Hello.create() );
    }
    ref.current.addEventListener( 'connect', ()=>{
      console.log( 'App', 'connected!' );
    });
    ref.current.addEventListener( 'disconnect', ()=>{
      console.log( 'App', 'disconnected!' );
    });

    ref.current.start();

    return ()=>{
      ref.current.stop();
      ref.current = null;
    };
  });

  return (
    <>
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <button onClick={ handleClick }>Start</button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
