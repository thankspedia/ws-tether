
function createContext({ http_server_url, http_authentication_token, callapi }) {
  return create_remote_context({ http_server_url, http_authentication_token, callapi });
}
module.exports.createContext = createContext;

function createDummyContext({ http_server_url, http_authentication_token }) {
  return create_remote_context({ http_server_url, http_authentication_token, callapi: dummy_callapi });
}
module.exports.createDummyContext = createDummyContext;

function createErrorContext({ http_server_url, http_authentication_token, error_message }) {
  return create_remote_context({ http_server_url, http_authentication_token, callapi : create_error_callapi( error_message ) });
}
module.exports.createErrorContext = createErrorContext;


function create_overrider( args ) {
  return function created_overrider( args_to_override ) {
    const overriden_args = {
      ...args,
    };

    // Don't let them override fields other than 'http_method'.
    if ( args_to_override.http_method ) {
      if ( typeof args_to_override.http_method === 'string' ) {
        overriden_args.http_method = args_to_override.http_method;
      } else {
        throw new Error( `the named argument 'http_method' must be a string` );
      }
    } else {
      throw new Error( 'this should not happen' );
    }

    return create_remote_context( overriden_args );
  };
}

function create_remote_context( nargs ) {
  // console.log( nargs );
  const {
    callapi                   = standard_callapi,
    http_method               = 'POST',
    http_server_url           = (()=>{throw new Error( 'http_server_url must be specified' )})(),
    http_authentication_token = (()=>{throw new Error( 'http_authentication_token must be specified' )})(),
    method_path               = [],
  } = nargs;

  return new Proxy(()=>{}, {
    async apply( target, thisArg, args ) {
      const result = await callapi(
        http_method,
        http_server_url,
        http_authentication_token,
        method_path,
        ...args
      );

      if ( 'status' in result ) {
        if ( result.status === 'error' ) {
          throw new Error( 'error', { cause : result } );
        } else if ( result.status === 'succeeded' ) {
          return result.value;
        } else {
          // go to the following code
        }
      } else {
        // go to the following code
      }

      console.error( 'unexpected value', { cause : result } );
      throw new Error( 'unexpected value', { cause : result } );
    },

    get(target, prop, receiver) {
      const args = {
        callapi,
        http_method,
        http_server_url,
        http_authentication_token,
        method_path : [ ...method_path ],
      };

      if ( prop === 'OVERRIDE' ) {
        return create_overrider( args );
      } else {
        args.method_path = [ ...args.method_path, prop ];
        return create_remote_context( args );
      }
    }
  });
}



function process_args_v1( method_args ) {
  // const __convert =  e=> typeof e === 'string' ? e : JSON.stringify( e );

  /*
   * for backward-compatibility, return a plain single object if only one
   * argument is specified; otherwise, return an array, except none is specified.
   */
  if ( method_args.length === 0 ) {
    // if no argument was specified, return null.
    return null;
  } else if ( method_args.length === 1 ) {
    // if only one argument was specified, return a single object.
    return method_args[0];
  } else {
    // if multiple arguments were specified, return an array.
    return [ ...method_args];
  }
}

// MODIFIED (Thu, 18 May 2023 17:45:04 +0900)
// always return array.
function process_args_v2( method_args ) {
  return [ ... method_args ];
};

const process_args = process_args_v2;

function parse_response( text ) {
  try {
    return JSON.parse( text );
  } catch ( e ) {
    return {
      status : 'error',
      value : {
        cause : 'invalid JSON error',
        text  : '```\n' + text + '\n```',
      },
    };
  }
}

const create_fetch_url = ( server_url, method_path, query_string )=>{
  let s = '';

  s += server_url;

  const path_string = method_path.join('/');

  if ( ! s.endsWith( '/' ) && ! path_string.startsWith('/')  ) {
    s+= '/';
  }

  s += path_string;

  if ( ! s.endsWith( '?' ) && ! path_string.startsWith( '?' )  ) {
    s += '?';
  }

  s += query_string;

  return s;
}


// const http_server_url  = http_server_url; // 'http://localhost:2000/api/';
// const http_method      = 'POST';
async function standard_callapi( http_method, http_server_url, http_authentication_token, method_path,  ...method_args ) {
  const http_headers = {
    'Content-Type': 'application/json',
  };

  if ( typeof http_authentication_token === 'string' ) {
    http_authentication_token = http_authentication_token.trim();
    if ( 0<http_authentication_token.length ) {
      http_headers['Authentication'] = 'Bearer ' + http_authentication_token;
    }
  }

  /*
   * === About `query_obj` variable ===
   *
   * If http_method is either 'HEAD' or 'GET', it only accepts the first
   * argument as a dictionary object; otherwise it send all arguments as an
   * array object in the JSON data.
   *
   * (Thu, 01 Jun 2023 14:45:35 +0900)
   */
  const create_fetch_options_and_query = ()=>{
    if ( http_method === 'HEAD' || http_method === 'GET' ) {
      const fetch_options        = { method:http_method, headers:http_headers };
      const query_obj = new URLSearchParams( (method_args.lenght === 0) || (typeof method_args[0] !== 'object') ? {} : method_args[0] );
      query_obj.sort();
      const query_string = query_obj.toString();
      return {
        fetch_options,
        query_string,
      };
    } else {
      const http_body = JSON.stringify( process_args( method_args ), null, 4 );
      const fetch_options        = { method: http_method, headers:http_headers, body:http_body };
      const query_string = '';
      return {
        fetch_options,
        query_string,
      };
    }
  };

  const {
    fetch_options, query_string
  } = create_fetch_options_and_query();

  const result         = await fetch( create_fetch_url( http_server_url , method_path , query_string ) , fetch_options );
  const response_text  = await result.text();
  // console.log( 'respoinse_text',  response_text );
  const response_json  = parse_response( response_text );

  console.log( 'The Result of API', response_json );

  if ( ( 'status' in response_json ) && ( response_json[ 'status' ] === 'succeeded' ) ) {
    return response_json
  } else {
    response_json[ Symbol.for( 'is_from_backend' ) ] = true;
    throw response_json;
  }
}

const dummy_callapi = ( http_method, http_server_url, http_authentication_token, method_path, ...method_args)=>{
  console.log( 'callapi', ...method_args );
  return {
    status : 'succeeded',
    value : method_args
  }
};

function create_error_callapi( message ) {
  if ( typeof message !== 'string' ) {
    throw new TypeError( `an invalid value was specified as message argument; '${message}' ` );
  }
  return ( http_method, http_server_url, http_authentication_token, method_path, ...method_args )=>{
    console.error( 'error callapi', ...method_args );
    return {
      status : 'error',
      value : message,
    }
  };
}

const error_callapi = create_error_callapi( 'Currently the API service is not available. Try it again, later.' );

module.exports.standard_callapi = standard_callapi;
module.exports.dummy_callapi    = dummy_callapi;
module.exports.error_callapi    = error_callapi;
module.exports.callapi          = standard_callapi;


