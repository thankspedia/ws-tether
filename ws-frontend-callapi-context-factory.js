
const { create_callapi                     } = require( './callapi.js' );
const { websocket_callapi_handler          } = require( './ws-callapi' );
const { await_websocket, create_websocket, } = require( './ws-utils' );
const { createContext,                     } = require( './ws-callapi-context-factory.js' );

async function asyncCreateWebsocketClientContext( nargs ) {
  nargs.websocket = create_websocket( nargs.websocket );
  const context   = createContext({...nargs });
  await await_websocket( nargs.websocket );
  return { context };
}
module.exports.createContext = asyncCreateWebsocketClientContext;


