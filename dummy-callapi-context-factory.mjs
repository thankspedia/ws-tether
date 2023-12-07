
import  { create_callapi } from './callapi.mjs' ;
import  { dummy_callapi_handler } from './dummy-callapi.mjs' ;

function createDummyContext( nargs ) {
  const callapi_handler = dummy_callapi_handler;
  return create_callapi({ ...nargs, callapi_handler });
}

export { createDummyContext as createContext };

