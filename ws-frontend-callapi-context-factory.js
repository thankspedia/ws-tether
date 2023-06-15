
const { create_callapi                     } = require( './callapi.js' );
const { websocket_callapi_handler          } = require( './ws-callapi' );
const { await_websocket, create_websocket, } = require( './ws-utils.js' );
const { createContext,                     } = require( './ws-callapi-context-factory.js' );

async function asyncCreateWebsocketClientContext( ws_spec ) {
  const websocket = create_websocket( ws_spec );
  const context   = createContext({ websocket });
  return await await_websocket( websocket );
}
module.exports.createContext = asyncCreateWebsocketClientContext;


