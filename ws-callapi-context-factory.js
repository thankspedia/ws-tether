
import { create_callapi            } from './callapi.js' ;
import { websocket_callapi_handler } from './ws-callapi' ;

import {
  await_websocket,
  create_websocket,
} from './ws-utils' ;

function createContext( nargs ) {
  const callapi_handler = websocket_callapi_handler;
  return create_callapi({ ...nargs, callapi_handler  });
}
export { createContext as createContext };

