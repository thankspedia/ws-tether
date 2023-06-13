
const { create_callapi_bridge  } = require( './callapi-bridge' );
const { websocket_callapi      } = require( './ws-callapi' );
const WebSocket = require( 'ws' );

function createContext( nargs ) {
  const callapi = websocket_callapi;
  return create_callapi_bridge( { ...nargs, http_method : 'POST', callapi  });
}
module.exports.createContext = createContext;


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

function asyncCreateClientWebsocketContext( ws_remote_address, __createContext = createContext ) {
  if ( typeof __createContext !== 'function' ) {
    throw new Error( `incorrect createContext parameter` );
  }
  const websocket = new WebSocket( ws_remote_address );
  const context   = __createContext({ websocket });
  return awaitOpen( websocket ).then( ()=>Promise.resolve({context}) );
}
module.exports.asyncCreateClientWebsocketContext = asyncCreateClientWebsocketContext;


