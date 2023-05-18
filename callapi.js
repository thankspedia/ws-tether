
function createContext({ server_url, authentication_token, callapi }) {
  return create_remote_context({ server_url, authentication_token, callapi });
}
module.exports.createContext = createContext;

function createDummyContext({ server_url, authentication_token }) {
  return create_remote_context({ server_url, authentication_token, callapi: dummy_callapi });
}
module.exports.createDummyContext = createDummyContext;

function createErrorContext({ server_url, authentication_token, error_message }) {
  return create_remote_context({ server_url, authentication_token, callapi : create_error_callapi( error_message ) });
}
module.exports.createErrorContext = createErrorContext;


function create_overrider( args ) {
  return function created_overrider( args_to_override ) {
    const overriden_args = {
      ...args,
    };

    // Don't let them override fields other than 'method'.
    if ( args_to_override.method ) {
      if ( typeof args_to_override.method === 'string' ) {
        overriden_args.method = args_to_override.method;
      } else {
        throw new Error( `the named argument 'method' must be a string` );
      }
    }

    return create_remote_context( overriden_args );
  };
}

function create_remote_context( nargs ) {
  // console.log( nargs );
  const {
    method               = 'POST',
    callapi              = standard_callapi,
    server_url           = (()=>{throw new Error( 'server_url must be specified' )})(),
    authentication_token = (()=>{throw new Error( 'authentication_token must be specified' )})(),
    path                 = [],
  } = nargs;

  return new Proxy(()=>{}, {
    async apply( target, thisArg, args ) {
      const result = await callapi(
        method,
        server_url,
        path.join('/'),
        authentication_token,
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
        method,
        callapi,
        server_url,
        authentication_token,
        path : [ ...path ],
      };

      if ( prop === 'REQUEST' ) {
        return create_overrider( args );
      } else {
        args.path = [ ...args.path, prop ];
        return create_remote_context( args );
      }
    }
  });
}



function process_args_v1( args ) {
  // const __convert =  e=> typeof e === 'string' ? e : JSON.stringify( e );

  /*
   * for backward-compatibility, return a plain single object if only one
   * argument is specified; otherwise, return an array, except none is specified.
   */
  if ( args.length === 0 ) {
    // if no argument was specified, return null.
    return null;
  } else if ( args.length === 1 ) {
    // if only one argument was specified, return a single object.
    return args[0];
  } else {
    // if multiple arguments were specified, return an array.
    return [ ...args];
  }
}

// MODIFIED (Thu, 18 May 2023 17:45:04 +0900)
// always return array.
function process_args_v2( args ) {
  return [ ...args ];
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

const concat_url = (server_url, path, query )=>{
  let s = '';

  s += server_url;

  if ( ! s.endsWith( '/' ) && ! path.startsWith('/')  ) {
    s+= '/';
  }

  s += path;

  if ( ! s.endsWith( '?' ) && ! path.startsWith( '?' )  ) {
    s += '?';
  }

  s += query;

  return s;
}


// const server_url  = server_url; // 'http://localhost:2000/api/';
// const method  = 'POST';
async function standard_callapi( method, server_url, path, authentication_token, ...args ) {
  const headers = {
    'Content-Type': 'application/json',
  };

  if ( typeof authentication_token === 'string' ) {
    authentication_token = authentication_token.trim();
    if ( 0<authentication_token.length ) {
      headers['Authentication'] = 'Bearer ' + authentication_token;
    }
  }

  const create_options_and_query = ()=>{
    if ( method === 'HEAD' || method === 'GET' ) {
      const options        = { method, headers };
      const query_obj = new URLSearchParams( (args.lenght === 0) || (typeof args[0] !== 'object') ? {} : args[0] );
      query_obj.sort();
      const query = query_obj.toString();
      return {
        options,
        query,
      };
    } else {
      const body = JSON.stringify( process_args( args ), null, 4 );
      const options        = { method, headers, body };
      const query = '';
      return {
        options,
        query,
      };
    }
  };

  const {
    options, query
  } = create_options_and_query();

  const result         = await fetch( concat_url( server_url , path , query ) , options );
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

const dummy_callapi =(method, server_url, path, authentication_token, ...args)=>{
  console.log( 'callapi', ...args );
  return {
    status : 'succeeded',
    value : args
  }
};

function create_error_callapi( message ) {
  if ( typeof message !== 'string' ) {
    throw new TypeError( `an invalid value was specified as message argument; '${message}' ` );
  }
  return (method, server_url, path, authentication_token, ...args)=>{
    console.error( 'error callapi', ...args );
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


