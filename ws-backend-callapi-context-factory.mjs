
import { create_callapi                     } from './callapi.mjs' ;
import { websocket_callapi_handler          } from './ws-callapi.mjs' ;
import { await_websocket, create_websocket, } from './ws-utils.mjs' ;
import { createContext,                     } from './ws-callapi-context-factory.mjs' ;

async function asyncCreateWebsocketBackendContext( ...nargs ) {
  const context   = createContext(...nargs);
  return {context};
}

export { asyncCreateWebsocketClientContext as createContext };


