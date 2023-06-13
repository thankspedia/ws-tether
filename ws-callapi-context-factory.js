
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

function asyncCreateWebsocketContext( ws_spec, __createContext = createContext ) {
  if ( typeof __createContext !== 'function' ) {
    throw new Error( `incorrect createContext parameter` );
  }
  const websocket = (()=>{
    if ( typeof ws_spec === 'string' ) {
      return new WebSocket( ws_spec );
    } else {
      return ws_spec;
    }
  })();
  const context   = __createContext({ websocket });
  return awaitOpen( websocket ).then( ()=>Promise.resolve({context}) );
}
module.exports.asyncCreateWebsocketContext = asyncCreateWebsocketContext;







