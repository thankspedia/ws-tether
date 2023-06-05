const express                = require( 'express' );
const bodyParser             = require( 'body-parser' );
const url                    = require( 'url' );
const { AsyncContextResult } = require( 'asynchronous-context/result' );
const { typesafe_function, get_typesafe_tags }  = require( 'runtime-typesafety' );
const { schema             } = require( 'vanilla-schema-validator' );

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



class CallapiError extends Error {
  constructor(nargs, ...args) {
    super(...args);
    this.callapi_result = {
      ...nargs
    };
  }
  is_callapi_error = true;
}


/**
 *
 *
 */
const resolve_callapi_method_path = typesafe_function(
  function resolve_callapi_method_path( callapi_target, callapi_method_path, required_typesafe_tag ) {
    const accumlator = {
      status       : 'found',
      value                : callapi_target,
      tags                 : [],
      actual_method_path   : [], // was valid_prop_name_list (Fri, 02 Jun 2023 13:12:29 +0900)
    };

    const finallization = (r)=>{
      r.callapi_method_path        = [ ... callapi_method_path ];
      r.callapi_method_path_string = callapi_method_path.join('.');
      r.actual_method_path_string  = r.actual_method_path.join('.');
      return r;
    };

    try{
      const result = callapi_method_path.reduce((accumlator,prop_name)=>{
        if ( prop_name === undefined || prop_name === null ) {
          throw new ReferenceError( `internal error; prop_name value should not be undefined or null ${prop_name}` );
        } else if ( accumlator.status !== 'found' ) {
          // CONDITION_ABOVE
          return accumlator;
        } else if ( prop_name in accumlator.value ) {
          const next_value = accumlator.value[prop_name];
          const tags       = next_value ? ( get_typesafe_tags( next_value ) ?? [] ) : [];

          if ( tags.includes( required_typesafe_tag ) ) {
            return {
              status             : 'found',
              value              : next_value,
              tags               : tags,
              actual_method_path : [ ...accumlator.actual_method_path  , prop_name ],
            };
          } else {
            return {
              status             : 'forbidden', // see the CONDITION_ABOVE
              value              : null,
              tags               : tags,
              actual_method_path : [ ...accumlator.actual_method_path  , prop_name ],
            };
          }
        } else {
          return {
            status         : 'not_found', // see the CONDITION_ABOVE
            value          : null,
            tags           : [],
            actual_method_path   : accumlator.actual_method_path  ,
          };
        }
      }, accumlator );

      // if ( typeof result.value !== 'function' ) {
      //   throw new CallapiError({
      //     ...result,
      //     status : 'forbidden',
      //   });
      // }

      return finallization(result);

    } catch (err) {
      finallization( err.callapi_result );
      throw err;
    }
  },{
    typesafe_input : schema.compile`
      array(
        callapi_target        : object(),
        callapi_method_path   : array_of( string() ),
        required_typesafe_tag : string()
      ),
    `,
    typesafe_output : schema.compile`
      object(
        status : and(
          string(),
          or(
            equals( <<'found'>>     ),
            equals( <<'not_found'>> ),
            equals( <<'forbidden'>> ),
          ),
        ),
        value  : or(
          null(),
          function(),
        ),
        tags                       : array_of( string() ),
        actual_method_path         : array_of( string() ),
        callapi_method_path        : array_of( string() ),
        actual_method_path_string  : string(),
        callapi_method_path_string : string(),
      )
    `,
  }
);

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
  if ( ! text_request_body ) {
    return [];
  }
  text_request_body = text_request_body.trim();
  if ( text_request_body ==='' ) {
    return [];
  }

  try {
    return JSON.parse( text_request_body );
  } catch ( err ) {
    console.error( 'parse_request_body : *** ERROR ***',  err, text_request_body );
    throw new Error( 'JSON error',  { cause : err } );
  }
}

function parse_query_parameter( query ) {
  const p = new URLSearchParams( query );
  p.sort();
  return [ Object.fromEntries( p.entries() ) ];
}

const set_status_code = ( target, nargs )=>{
  target.value = Object.assign(target.value, nargs );
  return target;
};

const get_authentication_token = (req)=>{
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
};

function __create_middleware( contextFactory ) {
  // the arguments are already validated in `create_middleware` function.

  return (
    async function (req, res, next) {
      let done    = false;
      let context = null;
      let is_successful = false;
      let session_info = {};

      const urlobj              =
        url.parse( req.url, true );
      const callapi_method_path =
        split_pathname_to_callapi_method_path( urlobj ).map( filter_property_name );

      session_info.http_pathname              = urlobj.pathname;
      session_info.http_query_parameter       = { ...urlobj.query };
      session_info.http_request_method        = req.method;
      session_info.target_method              = null;
      session_info.target_method_args         = null;

      try {

        // 1) Check if the current path is the root path.
        // This should not be executed since the number of the set of elements
        // will never lower than two.

        if ( callapi_method_path.length === 0 ) {
          res.status(404).json({status:'error', reason : 'not found' } ).end();
          (async()=>{
            console.log(LOG_PREFIX,'http result:', 404 );
          })().catch(err=>console.error(MSG_UNCAUGHT_ERROR,err) );
          done = true;

          // Abort the process.
          return;
        }

        // Create a context object.
        context = await contextFactory({});

        // The procedure to execute before invocation of the method.
        context.contextInitializers.unshift( async function context_initializer() {
          this.logger.output({
            type : 'begin_of_method_invocation',
            info : {
              ...session_info,
            }
          });

          // 4) get the current authentication token.
          if ( 'set_user_identity' in this ) {
            const authentication_token = get_authentication_token( req );

            // (Wed, 07 Sep 2022 20:13:01 +0900)
            await this.set_user_identity( authentication_token );
          }

          this.setOptions({ showReport : false, coloredReport:true });

          if ( resolved_callapi_method.tags.includes( AUTO_CONNECTION ) ) {
            this.setOptions({ autoCommit : true });
          }
        });


        /*
         * Resolving Method
         */
        let resolved_callapi_method =null;

        resolved_callapi_method   =
          resolve_callapi_method_path( context, callapi_method_path, req.method /* http-method as TAGS */ );

        if ( resolved_callapi_method.status !== 'found' ) {
          /*
           * Process errors from callapi.js
           */
          context.logger.output({ type  : 'detected_callapi_error' });

          const result = {
            status:'error',
            value:{
              status_code : null,
              reason : null,
              ...session_info,
              ...resolved_callapi_method,
            },
          };

          console.log( '0aCa8xD0oY0', resolved_callapi_method );

          if ( false ) {
            // dummy
          } else if ( resolved_callapi_method.status === 'not_found' ) {
            Object.assign( result.value, {
              status_code : 404,
              reason : 'Not Found',
            });
          } else if ( resolved_callapi_method.status === 'forbidden' ) {
            Object.assign( result.value, {
              status_code : 403,
              reason : 'Forbidden',
            });
          } else {
            Object.assign( result.value, {
              status_code : 500,
              reason : 'Internal Server Error',
            });
          }

          res.status( result.value.status_code ).json(result).end();
          done = true;

          context.logger.output({ type  : 'error_occured_in_method_invocation', ... value, });

          (async()=>{
            console.log( LOG_PREFIX, 'http result:', value.status_code );
          })().catch(err=>console.error(MSG_UNCAUGHT_ERROR,err) );

          // Abort the process.
          return;
        }


        /*
         * Preparing the Arguments
         */
        const target_method             = resolved_callapi_method.value
        session_info.target_method      = resolved_callapi_method.value;

        const target_method_args        = ( req.method === 'GET' || req.method === 'HEAD' ) ? parse_query_parameter( urlobj.query ) : parse_request_body( req.body );
        session_info.target_method_args = target_method_args;

        if ( ! Array.isArray( target_method_args ) ) {
          context.logger.output({
            type  : 'error_occured_before_method_invocation',
            reason : 'the specified argument is not an array',
            value : target_method_args,
          });

          // 8) Send the generated response.
          res.status(400).json(
            recursivelyUnprevent(
              AsyncContextResult.createErroneous(
                new Error('found malformed formatted data in body')
              ))).end();

          done = true;
          // Abort the process.
          return;
        }

        /*
         * Invoking the Resolved Method
         */
        try {
          // 5) Execute the method.
          const value =  await (context.executeTransaction( target_method, ... target_method_args ));

          // 6) Set the flag `is_successful`
          is_successful = true;

          // 7) Send the generated response.
          res.status(200).json(
            recursivelyUnprevent(
              AsyncContextResult.createSuccessful( value ))).end();

          done = true;

          // Abort the process.
          return;
        } catch (err) {
          console.log( 'zvlSApLK8T4', err );

          // 8) Send the generated response.
          res.status(200).json(
            recursivelyUnprevent(
              AsyncContextResult.createErroneous( err )
            )
          ).end();

          done = true;
          // Abort the process.
          return;
        }
      } catch ( err ) {
        /*
         * Processing an Unexpected Error
         */
        console.error( '6qbDKEbt6Y', err );

        try {

          console.log( 'zvlSApLK8T4', err );

          // 8) Send the generated response.
          res.status(500).json(
            recursivelyUnprevent(
              AsyncContextResult.createErroneous( err )
            )
          ).end();

          done = true;
          // Abort the process.
          return;
        } catch (err) {
          console.error( 'INTERNAL ERROR : pCzB87JiGgo', err );
        }

      } finally {
        try {
          if ( ! done ) {
            console.error( 'Unexpected Internal Server Error', 'v83dIlsq4' );
            if ( context ) {
              context.logger.output(
                {
                  type  : 'double_unexpected_error',
                  value : null,
                }
              );
            }
            res.status(500).json({
              status : 'error',
              value : {
                status_code : 500,
                reason : 'Unexpected Internal Server Error',
              },
            }).end();
            done=true;
          }
        } catch ( err ) {
          try {
            console.error( 'Double Unexpected Internal Server Error', 'v83dIlsq4', err );
            if ( context ) {
              context.logger.output(
                {
                  type  : 'double_unexpected_error',
                  value : recursivelyUnprevent( AsyncContextResult.createErroneous(err) ),
                }
              );
            }
          } catch (err) {
            console.error( 'Triple Unexpected Internal Server Error', 'v83dIlsq4', err );
          }
        }

        // 9) close the indentation of the nested log.
        try {
          if ( context ) {
            context.logger.output({
              type: 'end_of_method_invocation',
              ...session_info,
            });
          }
        } catch ( err ) {
          console.error( 'Unexpected Internal Server Error', 'v83dIlsq4', err );
        }

        // 10) Output the log of the execution.
        try {
          if ( context != null ) {
            context.logger.reportResult( is_successful ?? false )
              .then(err=>{console.log('logging finished');console.error('logging2',err)} )
              .catch(err=>{console.error(MSG_UNCAUGHT_ERROR);console.error(err)});
          }
        } catch ( err ) {
          console.error( 'Unexpected Internal Server Error', 'v83dIlsq4', err );
        }

        try {
          if ( ! done ) {
            next();
          }
        } catch (err) {
          console.error('FINAL ERROR',err);
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

