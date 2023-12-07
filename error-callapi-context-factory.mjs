
import  { create_callapi                } from './callapi.mjs' ;
import  { create_error_callapi_handler  } from './error-callapi.mjs' ;

function createErrorContext( nargs ) {
  if ( ! ( 'error_message' in  nargs ) ) {
    throw new Error( 'error_message is not specified' );
  }
  const callapi_handler = create_error_callapi_handler( nargs.error_message );
  return create_callapi({ ...nargs, callapi_handler });
}

export { createErrorContext as createContext };
// module.exports.createContext = createErrorContext;

