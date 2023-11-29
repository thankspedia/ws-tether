import logo from './logo.svg';
import './App.css';
import { createContext  } from  'asynchronous-context-rpc/ws-frontend-callapi-context-factory' ;


function App() {
  async function handleClick() {
    try {
      const {context} =  await createContext({ websocket : 'ws://schizostylis.local:3632/foo' } );
      alert('before');
      alert( await context.say_hello() );
      alert('after');
    } catch (e){
      console.error(e);
      alert('error');
      alert(e);
    }
  }

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
