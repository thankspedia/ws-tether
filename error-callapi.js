
function create_error_callapi_handler( message ) {
  if ( typeof message !== 'string' ) {
    throw new TypeError( `an invalid value was specified as message argument; '${message}' ` );
  }

  return ( nargs )=>{
    const {
      method_args = [],
    } = nargs;
    console.log( 'callapi_handler', '(', ...method_args , ')', nargs );

    return {
      status : 'error',
      value : message,
    }
  };
}

const error_callapi_handler = create_error_callapi_handler( 'Currently the API service is not available. Try it again, later.' );

module.exports.error_callapi_handler         = error_callapi_handler;
module.exports.create_error_callapi_handler  = create_error_callapi_handler;

