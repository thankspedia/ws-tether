
const { create_callapi_bridge } = require( './bridge' );
const { create_error_callapi  } = require( './callapi' );

function createErrorContext( nargs ) {
  if ( ! ( 'error_message' in  nargs ) ) {
    throw new Error( 'error_message is not specified' );
  }
  const callapi = create_error_callapi( nargs.error_message );
  return create_callapi_bridge({ ...nargs, callapi });
}
module.exports.createContext = createErrorContext;

