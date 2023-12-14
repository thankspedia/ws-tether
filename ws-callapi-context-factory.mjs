
import { create_callapi            } from './callapi.mjs' ;
import { websocket_callapi_handler } from './ws-callapi.mjs' ;

function createContext( nargs ) {
  const callapi_handler = websocket_callapi_handler;
  return create_callapi({ ...nargs, callapi_handler  });
}
export { createContext as createContext };

