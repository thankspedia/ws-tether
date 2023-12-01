
function create_error_callapi_handler( message ) {
  if ( typeof message !== 'string' ) {
    throw new TypeError( `an invalid value was specified as message argument; '${message}' ` );
  }

  if ( message.trim() === '' ) {
    throw new TypeError( `must specify a message` );
  }

  return ( nargs )=>{
    const {
      method_args = [],
    } = nargs;
    console.log( 'callapi_handler', '(', ...method_args , ')', nargs );

    return {
      status : 'error',
      value : new Error( message ),
    }
  };
}

const error_callapi_handler = create_error_callapi_handler( 'Currently the API service is not available. Try it again, later.' );

export { error_callapi_handler  };
export { create_error_callapi_handler   } ;

