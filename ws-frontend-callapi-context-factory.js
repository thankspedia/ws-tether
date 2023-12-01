
import { create_callapi                     } from './callapi.js' ;
import { websocket_callapi_handler          } from './ws-callapi' ;
import { await_websocket, create_websocket, } from './ws-utils' ;
import { createContext,                     } from './ws-callapi-context-factory.js' ;

async function asyncCreateWebsocketClientContext( nargs ) {
  nargs.websocket = create_websocket( nargs.websocket );
  const context   = createContext({...nargs });
  await await_websocket( nargs.websocket );
  return { context };
}
export { asyncCreateWebsocketClientContext as createContext };


