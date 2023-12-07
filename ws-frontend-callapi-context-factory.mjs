
import { create_callapi                     } from './callapi.mjs' ;
import { websocket_callapi_handler          } from './ws-callapi.mjs' ;
import { await_websocket, create_websocket, } from './ws-utils.mjs' ;
import { createContext,                     } from './ws-callapi-context-factory.mjs' ;

async function asyncCreateWebsocketClientContext( nargs ) {
  nargs.websocket = create_websocket( nargs.websocket );
  const context   = createContext({...nargs });
  await await_websocket( nargs.websocket );
  return { context };
}
export { asyncCreateWebsocketClientContext as createContext };


