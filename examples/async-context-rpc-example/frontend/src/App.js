import React from "react";

import logo from './logo.svg';
import './App.css';
import { createContext  } from  'asynchronous-context-rpc/ws-frontend-callapi-context-factory' ;
import {WS} from './ws.js';



function App() {
  const ref = React.useRef( null );
  async function handleClick() {
    try {
      const ws =  ref.current;
      alert('before');
      alert( await ws.backend.how_are_you(1,2,3) );
      alert('after');
    } catch (e){
      console.error(e);
      alert('error');
      alert(e);
    }
  }

  React.useEffect(()=>{
    if ( ref.current === null ) {
      ref.current = new WS();
    }

    ref.current.start();
    return ()=>{
      ref.current.stop();
      ref.current = null;
    };
  });

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
        <button onClick={ handleClick }>Foo</button>
      </header>
    </div>
  );
}

export default App;
