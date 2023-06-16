
const { create_callapi                     } = require( './callapi.js' );
const { websocket_callapi_handler          } = require( './ws-callapi' );
const { await_websocket, create_websocket, } = require( './ws-utils.js' );
const { createContext,                     } = require( './ws-callapi-context-factory.js' );

async function asyncCreateWebsocketBackendContext( ...nargs ) {
  const context   = createContext(...nargs);
  return {context};
}
module.exports.createContext = asyncCreateWebsocketClientContext;


