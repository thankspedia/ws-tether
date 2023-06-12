
function create_error_callapi( message ) {
  if ( typeof message !== 'string' ) {
    throw new TypeError( `an invalid value was specified as message argument; '${message}' ` );
  }

  return ( nargs )=>{
    const {
      method_args = [],
    } = nargs;
    console.log( 'callapi', '(', ...method_args , ')', nargs );

    return {
      status : 'error',
      value : message,
    }
  };
}

const error_callapi = create_error_callapi( 'Currently the API service is not available. Try it again, later.' );

module.exports.error_callapi         = error_callapi;
module.exports.create_error_callapi  = create_error_callapi;

