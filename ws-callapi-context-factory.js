
const { create_callapi  } = require( './callapi.js' );
const { websocket_callapi_handler } = require( './ws-callapi' );

const { create_backend_websocket_initializer } = require( './ws-backend-respapi.js' );

const {
  await_websocket,
  create_websocket,
} = require( './ws-utils.js' );



function createContext( nargs ) {
  const callapi_handler = websocket_callapi_handler;
  return create_callapi( { ...nargs, http_method : 'POST', callapi_handler  });
}
module.exports.createContext = createContext;


function asyncCreateWebsocketClientContext( ws_spec, __createContext = createContext ) {
  if ( typeof __createContext !== 'function' ) {
    throw new Error( `incorrect createContext parameter` );
  }
  const websocket = create_websocket( ws_spec );
  const context   = __createContext({ websocket });
  return await_websocket( websocket ).then( ()=>Promise.resolve({context}) );
}
module.exports.asyncCreateWebsocketClientContext = asyncCreateWebsocketClientContext;


function asyncCreateWebsocketServerContext( ws_spec, createContext ) {
  const on_init_websocket = create_backend_websocket_initializer( createContext );
  const websocket = create_websocket( ws_spec );
  websocket.on( 'open' , ()=>{
    on_init_websocket( websocket );
  });
}
module.exports.asyncCreateWebsocketServerContext = asyncCreateWebsocketServerContext;


