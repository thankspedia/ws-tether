
const { create_callapi_bridge  } = require( './callapi-bridge' );
const { websocket_callapi      } = require( './ws-callapi' );
const WebSocket = require( 'ws' );

const { createAsyncContextWebsocketInitializer } = require( './ws-middleware' );


function createContext( nargs ) {
  const callapi = websocket_callapi;
  return create_callapi_bridge( { ...nargs, http_method : 'POST', callapi  });
}
module.exports.createContext = createContext;

function awaitOpenWeird( websocket, iterationCount = 100 ) {
  let ctr = iterationCount;
  return new Promise( (resolve,reject)=>{
    let ctr2=iterationCount;

    const exec = ()=>{
      console.log( 'ctr2', ctr2 );
      if ( 0 < ctr2--  ) {
        websocket.on( 'open', ()=>{
          console.log( 'ctr', ctr );
          if ( --ctr === 0 ) {
            resolve();
          }
        });
        setTimeout( exec, 100 );
        // exec();
      }
    };
    exec();
  });
}

function awaitOpen( websocket ) {
  let flag = false;
  return new Promise( (resolve,reject)=>{
    websocket.on( 'open', ()=>{
      if ( ! flag ) {
        flag = true;
        resolve();
      }
    });
  });
}

function realize_websocket_spec( ws_spec ) {
  if ( typeof ws_spec === 'string' ) {
    return new WebSocket( ws_spec );
  } else {
    return ws_spec;
  }
}

function asyncCreateWebsocketClientContext( ws_spec, __createContext = createContext ) {
  if ( typeof __createContext !== 'function' ) {
    throw new Error( `incorrect createContext parameter` );
  }
  const websocket = realize_websocket_spec( ws_spec );
  const context   = __createContext({ websocket });
  return awaitOpen( websocket ).then( ()=>Promise.resolve({context}) );
}
module.exports.asyncCreateWebsocketClientContext = asyncCreateWebsocketClientContext;


function asyncCreateWebsocketServerContext( ws_spec, createContext ) {
  const on_init_websocket = createAsyncContextWebsocketInitializer( createContext );
  const websocket = realize_websocket_spec( ws_spec );
  websocket.on( 'open' , ()=>{
    on_init_websocket( websocket );
  });
}
module.exports.asyncCreateWebsocketServerContext = asyncCreateWebsocketServerContext;


