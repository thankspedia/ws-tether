
import { create_callapi                     } from './callapi.js' ;
import { websocket_callapi_handler          } from './ws-callapi' ;
import { await_websocket, create_websocket, } from './ws-utils' ;
import { createContext,                     } from './ws-callapi-context-factory.js' ;

async function asyncCreateWebsocketBackendContext( ...nargs ) {
  const context   = createContext(...nargs);
  return {context};
}

export { asyncCreateWebsocketClientContext as createContext };


