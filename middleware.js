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

function split_url_path( urlobj ) {
  const path_elements = urlobj.pathname.split( '/' );
  // See the comment above.
  if ( path_elements[0] === '' ) {
    path_elements.shift();
  }
  return path_elements;
}

const LOG_PREFIX = 'middleware-context' ;

const MSG_UNCAUGHT_ERROR = '********************* an uncaught error was detected ***************************\n';

function resolve_method( method, context, path_elements ) {
  const prop_name_list = [ ...path_elements ].map( filter_property_name );

  const accumlator = {
    status_code          : 200,
    value                : context,
    tags                 : [],
    valid_prop_name_list : [],
  };

  const result = prop_name_list.reduce((accumlator,prop_name)=>{
    if ( prop_name === undefined || prop_name === null ) {
      throw new ReferenceError( `internal error; prop_name value should not be undefined or null ${prop_name}` );
    } else if ( accumlator.status_code !== 200 ) {
      // CONDITION_ABOVE
      return accumlator;
    } else if ( prop_name in accumlator.value ) {
      const next_value = accumlator.value[prop_name];
      const tags       = next_value ? ( get_typesafe_tags( next_value ) ?? [] ) : [];

      if ( tags.includes( method ) ) {
        return {
          status_code : 200,
          value       : next_value,
          tags        : tags,
          valid_prop_name_list : [ ...accumlator.valid_prop_name_list, prop_name ],
        };
      } else {
        return {
          status_code : 403, // see the CONDITION_ABOVE
          value       : null,
          tags        : tags,
          valid_prop_name_list : [ ...accumlator.valid_prop_name_list, prop_name ],
        };
      }
    } else {
      return {
        status_code : 404, // see the CONDITION_ABOVE
        value       : null,
        tags        : [],
        valid_prop_name_list : accumlator.valid_prop_name_list,
      };
    }
  }, accumlator );

  return {
    ...result,
    method,
    prop_name_list,
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
      // console.log( LOG_PREFIX, 'method',  req.method );
      // console.log( LOG_PREFIX, 'body',    req.body );
      // console.log( LOG_PREFIX, 'url',     req.url );
      // console.log( LOG_PREFIX, 'baseurl', req.baseUrl );
      // console.log( LOG_PREFIX, req.body.name );

      let done    = false;
      let context = null;
      let contextResult = {
        is_successful : null,
        value : null,
      };

      let __session_info = null;

      const urlobj        = url.parse( req.url, true );
      const path_elements = split_url_path( urlobj );

      try {

        // 1) Check if the current path is the root path.
        // This should not be executed since the number of the set of elements
        // will never lower than two.
        if ( path_elements.length === 0 ) {
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

        const resolved            = resolve_method( req.method, context, path_elements );
        const request_prop_name   = resolved.prop_name_list.join( '.' );
        const available_prop_name = resolved.valid_prop_name_list.join('.');
        const json_request_body   = ( req.method === 'GET' || req.method === 'HEAD' ) ? parse_query_parameter( urlobj.query ) : parse_request_body( req.body );

        session_info = {
          request_prop_name,
          available_prop_name,
          available_request_method : resolved.tags,
          url_path                 : urlobj.pathname,
          url_query                : { ...urlobj.query },
          request_method           : req.method,
          request_body             : json_request_body,
        };

        __session_info = {
          ...session_info
        };

        context.logger.output({
          type : 'begin_of_method_invocation',
          ...session_info,
        });

        if ( resolved.status_code === 404 ) {
          const result = {
            reason : 'Not Found',
            ...session_info,
          };
          res.status(404).json({status:'error_occured_in_method_invocation', ...result }).end();
          context.logger.output(  {type  :'error_occured_in_method_invocation', ...result });
          (async()=>{
            console.log(LOG_PREFIX,'http result:', 404 );
          })().catch(e=>console.error(MSG_UNCAUGHT_ERROR,e) );
          done = true;
          // Abort the process.
          return;
        }

        // 3) Check if the specified request method is allowed for the method.
        if ( resolved.status_code === 403 ) {
          const result = {
            reason : 'Forbidden',
            ...session_info,
          };
          res.status(403).json({ status:'error_occured_in_method_invocation', ...result }).end();
          context.logger.output(  { type  :'error_occured_in_method_invocation', ...result });
          (async()=>{
            console.log( LOG_PREFIX, 'request_prop_name'  , request_prop_name );
            console.log( LOG_PREFIX, 'http result:', 403 );
          })().catch(e=>console.error(MSG_UNCAUGHT_ERROR,e) );;
          done = true;
          // Abort the process.
          return;
        }

        // 4) status_code must be 200 in here
        if ( resolved.status_code !== 200 ) {
          const status_code = typeof resolved.status_code === 'number' ? solved.status_code : 500;
          const result = {
            reason : 'Server Error',
            status_code,
            ...session_info,
          };
          res.status(status_code).json({ status:'error_occured_in_method_invocation', ...result }).end();
          context.logger.output(       { type  :'error_occured_in_method_invocation', ...result });
          (async()=>{
            console.log( LOG_PREFIX, 'request_prop_name'  , request_prop_name );
            console.log( LOG_PREFIX, 'http result:', 403 );
          })().catch(e=>console.error( MSG_UNCAUGHT_ERROR,e) );;
          done = true;

          // Abort the process.
          return;
        }

        const resolved_method = resolved.value;

        if (
          ( typeof resolved_method !== 'function')  ||
          ( resolved_method.constructor.name !== 'AsyncFunction' )
        ) {
          res.status(403).json( {status:'error_occured_in_method_invocation', reason : 'Forbidden' } ).end();
          context.logger.output({type  :'error_occured_in_method_invocation', ...result });
          (async()=>{
            console.log( LOG_PREFIX, 'request_prop_name'  , request_prop_name );
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

        if ( resolved.tags.includes( AUTO_CONNECTION ) ) {
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
          // if ( Array.isArray( json_request_body  ) ) {
          //   contextResult.value = await (context.executeTransaction( resolved_method, ... json_request_body ));
          // } else {
          //   contextResult.value = await (context.executeTransaction( resolved_method,     json_request_body ));
          // }
          // <<< MODIFIED (Thu, 18 May 2023 17:45:04 +0900)

          contextResult.value = await (context.executeTransaction( resolved_method, ... json_request_body ));

          contextResult.is_successful = true;
        } catch ( e ) {
          contextResult.value = e;
          contextResult.is_successful = false;
        }

        if ( resolved.tags.includes( AUTO_CONNECTION ) ) {
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

