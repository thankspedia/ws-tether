const express                = require( 'express' );
const bodyParser             = require( 'body-parser' );
const url                    = require( 'url' );
const { AsyncContextResult } = require( 'asynchronous-context/result' );
const { get_typesafe_tags }  = require( 'runtime-typesafety' );
const {
  preventUndefined,
  unprevent,
  recursivelyUnprevent
} = require( 'prevent-undefined' );

const AUTO_CONNECTION = '__AUTO_CONNECTION__';
const METHOD_GET      = 'GET';
const METHOD_HEAD     = 'HEAD';
const METHOD_POST     = 'POST';
const METHOD_PUT      = 'PUT';
const METHOD_DELETE   = 'DELETE';
const METHOD_CONNECT  = 'CONNECT';
const METHOD_OPTIONS  = 'OPTIONS';
const METHOD_TRACE    = 'TRACE';
const METHOD_PATCH    = 'PATCH';

module.exports.AUTO_CONNECTION = AUTO_CONNECTION;
module.exports.METHOD_GET      = METHOD_GET;
module.exports.METHOD_HEAD     = METHOD_HEAD;
module.exports.METHOD_POST     = METHOD_POST;
module.exports.METHOD_PUT      = METHOD_PUT;
module.exports.METHOD_DELETE   = METHOD_DELETE;
module.exports.METHOD_CONNECT  = METHOD_CONNECT;
module.exports.METHOD_OPTIONS  = METHOD_OPTIONS;
module.exports.METHOD_TRACE    = METHOD_TRACE;
module.exports.METHOD_PATCH    = METHOD_PATCH;


/**
 *  > var u = url.parse( 'http://localhost:3000/hello/world' );
 *  undefined
 *  > u
 *  Url {
 *    protocol: 'http:',
 *    slashes: true,
 *    auth: null,
 *    host: 'localhost:3000',
 *    port: '3000',
 *    hostname: 'localhost',
 *    hash: null,
 *    search: null,
 *    query: null,
 *    pathname: '/hello/world',
 *    path: '/hello/world',
 *    href: 'http://localhost:3000/hello/world'
 *  }
 *  > const path = require( 'path' );
 *
 *  > var u = url.parse( 'http://localhost:3000/' );
 *  undefined
 *  > u
 *  Url {
 *    protocol: 'http:',
 *    slashes: true,
 *    auth: null,
 *    host: 'localhost:3000',
 *    port: '3000',
 *    hostname: 'localhost',
 *    hash: null,
 *    search: null,
 *    query: null,
 *    pathname: '/',
 *    path: '/',
 *    href: 'http://localhost:3000/'
 *  }
 *  >
 *
 * > var u = url.parse( 'http://localhost:3000' )
 * undefined
 * > u
 * Url {
 *   protocol: 'http:',
 *   slashes: true,
 *   auth: null,
 *   host: 'localhost:3000',
 *   port: '3000',
 *   hostname: 'localhost',
 *   hash: null,
 *   search: null,
 *   query: null,
 *   pathname: '/',
 *   path: '/',
 *   href: 'http://localhost:3000/'
 * }
 *
 *  See : https://developer.mozilla.org/en-US/docs/Web/API/URL/pathname
 *  > URLs such as https and http URLs that have hierarchical schemes (which
 *  > the URL standard calls "special schemes") always have at least one
 *  > (invisible) path segment: the empty string. Thus the pathname value for
 *  > such "special scheme" URLs can never be the empty string, but will
 *  > instead always have a least one / character.
 *
 *  > For example, the URL https: //developer.mozilla.org has just one path
 *  > segment: the empty string, so its pathname value is constructed by
 *  > prefixing a / character to the empty string.
 */

function split_pathname_to_callapi_method_path( urlobj ) {
  const method_path = urlobj.pathname.split( '/' );
  // See the comment above.
  if ( method_path[0] === '' ) {
    method_path.shift();
  }
  return method_path;
}

const LOG_PREFIX = 'middleware-context' ;

const MSG_UNCAUGHT_ERROR = '********************* an uncaught error was detected ***************************\n';

function resolve_callapi_method_path( callapi_target, callapi_method_path, required_typesafe_tags ) {
  const accumlator = {
    status_code          : 200,
    value                : callapi_target,
    tags                 : [],
    actual_method_path   : [], // was valid_prop_name_list (Fri, 02 Jun 2023 13:12:29 +0900)
  };

  const result = callapi_method_path.reduce((accumlator,prop_name)=>{
    if ( prop_name === undefined || prop_name === null ) {
      throw new ReferenceError( `internal error; prop_name value should not be undefined or null ${prop_name}` );
    } else if ( accumlator.status_code !== 200 ) {
      // CONDITION_ABOVE
      return accumlator;
    } else if ( prop_name in accumlator.value ) {
      const next_value = accumlator.value[prop_name];
      const tags       = next_value ? ( get_typesafe_tags( next_value ) ?? [] ) : [];

      if ( tags.includes( required_typesafe_tags ) ) {
        return {
          status_code : 200,
          value       : next_value,
          tags        : tags,
          actual_method_path   : [ ...accumlator.actual_method_path  , prop_name ],
        };
      } else {
        return {
          status_code : 403, // see the CONDITION_ABOVE
          value       : null,
          tags        : tags,
          actual_method_path   : [ ...accumlator.actual_method_path  , prop_name ],
        };
      }
    } else {
      return {
        status_code : 404, // see the CONDITION_ABOVE
        value       : null,
        tags        : [],
        actual_method_path   : accumlator.actual_method_path  ,
      };
    }
  }, accumlator );

  return {
    ...result,
  };
}

function ensure_method( value ) {
  if ( typeof value === 'function' ) {
    return value;
  } else {
    async function property_value() {
      return value;
    };
    return property_value;
  }
}

function filter_property_name( name ) {
  name = name.replace( /-/g, '_' );
  if ( name === '' ) {
    name = '__index';
  }
  return name;
}

function parse_request_body( text_request_body ) {
  try {
    return JSON.parse( text_request_body );
  } catch ( e ) {
    console.error( 'parse_request_body : *** ERROR ***',  e, text_request_body );
    throw new Error( 'JSON error',  { cause : e } );
  }
}

function parse_query_parameter( query ) {
  const p = new URLSearchParams( query );
  p.sort();
  return [ Object.fromEntries( p.entries() ) ];
}


function __create_middleware( contextFactory ) {
  // the arguments are already validated in `create_middleware` function.

  return (
    async function (req, res, next) {
      // console.log( LOG_PREFIX, 'middleware(.*)'  );
      // console.log( LOG_PREFIX, 'http_method',  req.method );
      // console.log( LOG_PREFIX, 'body',         req.body );
      // console.log( LOG_PREFIX, 'url',          req.url );
      // console.log( LOG_PREFIX, 'baseurl',      req.baseUrl );
      // console.log( LOG_PREFIX,                 req.body.name );

      let done    = false;
      let context = null;
      let contextResult = {
        is_successful : null,
        value : null,
      };

      let __session_info = null;

      const urlobj      = url.parse( req.url, true );
      const callapi_method_path =
        split_pathname_to_callapi_method_path( urlobj ).map( filter_property_name );

      try {

        // 1) Check if the current path is the root path.
        // This should not be executed since the number of the set of elements
        // will never lower than two.
        if ( callapi_method_path.length === 0 ) {
          res.status(404).json({status:'error', reason : 'not found' } ).end();
          (async()=>{
            console.log(LOG_PREFIX,'http result:', 404 );
          })().catch(e=>console.error(MSG_UNCAUGHT_ERROR,e) );
          done = true;
          // Abort the process.
          return;
        }

        // Create a context object.
        context = await contextFactory({});

        const resolved_callapi_method = resolve_callapi_method_path( context, callapi_method_path, req.method /* http-method as TAGS */ );

        const target_method           = resolved_callapi_method.value;
        const target_method_args      = ( req.method === 'GET' || req.method === 'HEAD' ) ? parse_query_parameter( urlobj.query ) : parse_request_body( req.body );

        session_info = {
          callapi_method_path          : callapi_method_path.join( '.' ), // request_prop_name
          callapi_actual_method_path   : resolved_callapi_method.actual_method_path.join('.'),
          callapi_actual_method_tags   : resolved_callapi_method.tags,
          http_pathname                : urlobj.pathname,
          http_query_parameter         : { ...urlobj.query },
          http_request_method          : req.method,
          target_method                : target_method,
          target_method_args           : target_method_args,
        };

        __session_info = {
          ...session_info
        };

        context.logger.output({
          type : 'begin_of_method_invocation',
          ...session_info,
        });

        if ( resolved_callapi_method.status_code === 404 ) {

          const result = {
            reason : 'Not Found',
            status_code : 404,
            info : {
              ...session_info,
            },
          };

          res.status(404).json( { status:'error',  value : { ...result }}).end();

          context.logger.output(  {type  :'error_occured_in_method_invocation', ...result });

          (async()=>{
            console.log(LOG_PREFIX,'http result:', 404 );
          })().catch(e=>console.error(MSG_UNCAUGHT_ERROR,e) );
          done = true;
          // Abort the process.
          return;
        }

        // 3) Check if the specified request method is allowed for the method.
        if ( resolved_callapi_method.status_code === 403 ) {
          const result = {
            reason : 'Forbidden',
            status_code: 403,
            info : {
              ...session_info,
            },
          };
          res.status(403).json({ status:'error', value: {...result}}).end();
          context.logger.output(  { type  :'error_occured_in_method_invocation', ...result });
          (async()=>{
            console.log( LOG_PREFIX, 'callapi_method_path'  , session_info.callapi_method_path );
            console.log( LOG_PREFIX, 'http result:', 403 );
          })().catch(e=>console.error(MSG_UNCAUGHT_ERROR,e) );;
          done = true;
          // Abort the process.
          return;
        }

        // 4) status_code must be 200 in here
        if ( resolved_callapi_method.status_code !== 200 ) {
          const status_code = typeof resolved_callapi_method.status_code === 'number' ? solved.status_code : 500;
          const result = {
            reason : 'Server Error',
            status_code,
            info : {
              ...session_info,
            },
          };
          res.status(status_code).json({ status:'error', value:{...result}}).end();
          context.logger.output(       { type  :'error_occured_in_method_invocation', ...result });
          (async()=>{
            console.log( LOG_PREFIX, 'callapi_method_path'  , session_info.callapi_method_path );
            console.log( LOG_PREFIX, 'http result:', 403 );
          })().catch(e=>console.error( MSG_UNCAUGHT_ERROR,e) );;
          done = true;

          // Abort the process.
          return;
        }


        if (
          ( typeof target_method !== 'function')  ||
          ( target_method.constructor.name !== 'AsyncFunction' )
        ) {
          res.status(403).json( {status:'error_occured_in_method_invocation', reason : 'Forbidden' } ).end();
          context.logger.output({type  :'error_occured_in_method_invocation', ...result });
          (async()=>{
            console.log( LOG_PREFIX, 'callapi_method_path'  , session_info.callapi_method_path );
            console.log( LOG_PREFIX, 'http result:', 403 );
          })().catch(e=>console.error( MSG_UNCAUGHT_ERROR,e));;

          done = true;

          // Abort the process.
          return;
        }


        // 4) get the current authentication token.
        if ( 'set_user_identity' in context ) {
          const authentication_token = (()=>{
            let auth = req.get('Authentication');
            if ( auth == null ) {
              return null;
            } else {
              if ( Array.isArray( auth ) ) {
                new Error( 'Invalid Authentication Token' );
              }
              auth = auth.trim();
              let ma = auth.match( /^Bearer +(.*)$/ );
              if ( ma ) {
                return ma[1].trim();
              } else {
                return null;
              }
            }
          })();

          // (Wed, 07 Sep 2022 20:13:01 +0900)
          await context.set_user_identity( authentication_token );
        }

        context.setOptions({ showReport : false, coloredReport:true });

        if ( resolved_callapi_method.tags.includes( AUTO_CONNECTION ) ) {
          context.setOptions({ autoCommit : true });
        }

        try {

          /*
           * Now the frontend client always returns arrays.
           * See asynchronous-context-frontend.
           * (Thu, 18 May 2023 17:45:04 +0900)
           */
          // >>> MODIFIED (Thu, 18 May 2023 17:45:04 +0900)
          // // 5) Execute the method.
          // if ( Array.isArray( target_method_args  ) ) {
          //   contextResult.value = await (context.executeTransaction( target_method, ... target_method_args ));
          // } else {
          //   contextResult.value = await (context.executeTransaction( target_method,     target_method_args ));
          // }
          // <<< MODIFIED (Thu, 18 May 2023 17:45:04 +0900)

          contextResult.value = await (context.executeTransaction( target_method, ... target_method_args ));

          contextResult.is_successful = true;
        } catch ( e ) {
          contextResult.value = e;
          contextResult.is_successful = false;
        }

        if ( resolved_callapi_method.tags.includes( AUTO_CONNECTION ) ) {
          //
        }

        // 6) Send the generated response.
        if ( contextResult.is_successful ) {
          res.status(200).json(
            recursivelyUnprevent(
              AsyncContextResult.createSuccessful(
                contextResult.value ))).end();
          done = true;
        } else {
          res.status(500).json(
            recursivelyUnprevent(
              AsyncContextResult.createErroneous(
              contextResult.value ))).end();
          done = true;
        }

      } catch ( e ) {
        const asyncContestResult = recursivelyUnprevent( AsyncContextResult.createErroneous(e) );

        if ( context == null ) {
          console.error( 'an error was thrown while the context had not been initialized', e );
        } else {
          context.logger.output(
            {
              type  : 'unexpected_error',
              value : asyncContestResult,
            }
          );
        }

        try {
          if ( ! done ) {
            res.status(500).json( asyncContestResult ).end();
            done=true;
          }
        } catch ( e ) {
          if ( context == null ) {
            console.error( 'double error: an error was thrown while the context had not been initialized', e );
          } else {
            context.logger.output(
              {
                type  : 'double_unexpected_error',
                value : recursivelyUnprevent( AsyncContextResult.createErroneous(e) ),
              }
            );
          }
        }
      } finally {

        // 7) close the indentation of the nested log.
        if ( context != null ) {
          console.log( '__session_info', __session_info )
          context.logger.output({
            type: 'end_of_method_invocation',
            ...__session_info,
          });
        }

        // 8) Output the log of the execution.
        if ( context != null ) {
          context.logger.reportResult( contextResult.is_successful ?? false )
            .then(e=>{console.log('logging finished');console.error('logging2',e)} )
            .catch(e=>{console.error(MSG_UNCAUGHT_ERROR);console.error(e)});
        }

        try {
          if ( ! done ) {
            next();
          }
        } catch (e) {
          console.error('FINAL ERROR',e);
        }
      }
    }
  );
}

function create_middleware( contextFactory ) {
  if ( contextFactory === undefined || contextFactory === null ) {
    throw new ReferenceError( 'contextFactory must be specified' );
  }
  if ( typeof contextFactory !== 'function' ) {
    throw new TypeError( 'contextFactory must be a function' );
  }

  const router = express.Router();
  router.use((req,res,next)=>{
    console.log( LOG_PREFIX, "middleware:", req.url );
    next();
  });

  // router.use(express.json());
  // router.use(bodyParser.urlencoded({ extended: true }));
  // router.use(bodyParser.text({type:"*/*"}));
  router.use( express.urlencoded({ extended: true }));
  router.use( express.text({type:"*/*", limit: '50mb' }));
  router.all( '/(.*)', __create_middleware( contextFactory ) );
  router.all( '(.*)', function ( req, res, next ) {
    // console.trace('(.*)');
    res.status(404).json({status:'error', reason : 'not found' } ).end();
  });
  return router;
}

module.exports.create = create_middleware;

