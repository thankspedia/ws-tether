
const { create_callapi         } = require( './callapi.js' );
const { create_error_callapi_handler  } = require( './error-callapi' );

function createErrorContext( nargs ) {
  if ( ! ( 'error_message' in  nargs ) ) {
    throw new Error( 'error_message is not specified' );
  }
  const callapi_handler = create_error_callapi_handler( nargs.error_message );
  return create_callapi({ ...nargs, callapi_handler });
}
module.exports.createContext = createErrorContext;

