
import { createContext,                     } from './ws-callapi-context-factory.mjs' ;

function asyncCreateWebsocketBackendContext( ...nargs ) {
  return createContext(...nargs);
}

export { asyncCreateWebsocketBackendContext as createContext };


