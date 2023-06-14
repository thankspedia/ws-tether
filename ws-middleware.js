
const { WebSocketServer } = require( 'ws' );
const { parse } = require( 'url');
const { respapi } = require( './respapi.js' );
const { trace_validator }  = require( 'vanilla-schema-validator' );
const { create_callapi } = require( './callapi.js' );
const { websocket_callapi_handler } = require( './ws-callapi' );

const { schema } = require( 'vanilla-schema-validator' );
const t_respapi_message = schema.compile`
  object(
    command_type : string(),
    command_value : object(
      method_path : array_of( string() ),
      method_args : array_of( any() ),
    ),
  )
`();

const AUTO_CONNECTION = '__AUTO_CONNECTION__';



function create_websocket_upgrader( on_init_websocket ) {
  const wss = new WebSocketServer({ noServer: true });

  wss.on( 'connection', (websocket, req )=>{
    return on_init_websocket( websocket, req );
  });

  return ( request, socket, head )=>{
    wss.handleUpgrade( request, socket, head, function done(websocket) {
      wss.emit('connection', websocket, request);
    });
  };
}
module.exports.create_websocket_upgrader = create_websocket_upgrader;


const handle_multi_path_upgrade = ( mapper, request, socket, head )=>{
  const { pathname } = parse( request.url );
  console.log( 'handle_upgrade : ', pathname );
  if ( pathname in mapper ) {
    console.log( `handle_upgrade on [${pathname}]` );
    mapper[ pathname ]( request, socket, head )
  } else {
    console.log( `failed to 'handle_upgrade' on [${pathname}]` );
    socket.destroy();
  }
};

module.exports.handle_multi_path_upgrade = handle_multi_path_upgrade;


const create_multi_path_upgrade_handler = (mapper)=>(
  function handle_upgrade( request, socket, head ) {
    return handle_multi_path_upgrade( mapper, request, socket, head );
  }
);
module.exports.create_multi_path_upgrade_handler = create_multi_path_upgrade_handler;



const get_authentication_token = (req)=>{
  let auth = req.get( 'Authentication' );
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

async function handle_on_init_of_ws_backend( nargs ) {
  const {
    event_handlers  = {},
    context         = ((name)=>{throw new Error(`${name} is not defined`)})('context'),
    websocket       = ((name)=>{throw new Error(`${name} is not defined`)})('websocket'),
    req             = null,
  } = nargs;

  if ( 'on_init' in event_handlers ) {
    try {
      event_handlers.on_init();
    } catch( e ){
      console.error('WARNING on_init handler threw an error. ignored. ', e );
    }
  }
};


async function handle_on_message_of_ws_backend( nargs ) {
  const {
    event_handlers  = {},
    context         = ((name)=>{throw new Error('${name} is not defined')})('context'),
    websocket       = ((name)=>{throw new Error('${name} is not defined')})('websocket'),
    req             = null,
    data            = ((name)=>{throw new Error('${name} is not defined')})('data'),
  } = nargs;

  const message = JSON.parse( data.toString() );

  const info = trace_validator( t_respapi_message, message );

  if ( ! info.value ) {
    throw new Error( 'invalid message' + info.report() );
  }


  context.send_ws_message = async function( value ) {
    websocket.send( JSON.stringify( value ) );
  };

  context.frontend = create_callapi({
    callapi_handler : websocket_callapi_handler,
    websocket,
  });

  // COPIED FROM http-middleware
  /*
   * The procedure to execute before invocation of the method.
   */
  async function context_initializer( resolved_callapi_method ) {
    this.logger.output({
      type : 'begin_of_method_invocation',
      info : {
        resolved_callapi_method
      }
    });

    console.log( 'sZc3Uifcwh0',  resolved_callapi_method );

    // 4) get the current authentication token.
    if ( ( req ) && ( 'set_user_identity' in this ) ) {
      const authentication_token = get_authentication_token( req );

      // (Wed, 07 Sep 2022 20:13:01 +0900)
      await this.set_user_identity( authentication_token );
    }

    this.setOptions({ showReport : false, coloredReport:true });

    if ( resolved_callapi_method.tags.includes( AUTO_CONNECTION ) ) {
      console.log( 'ew6pMCEV3o', resolved_callapi_method );
      this.setOptions({ autoCommit : true });

      console.log( 'ew6pMCEV3o', this.getOptions() );
    }
  }

  console.log('AAAAAAAAAAA NO2', req.headers );

  const respapi_result  =
    await respapi(
      /* callapi_target */
      context,

      /* callapi_method_path */
      message.command_value.method_path,

      /* http-method as TAGS */
      'WEBSOCKET_METHOD',

      /* on_execution */
      async ( resolved_callapi_method )=>{

        // (Mon, 05 Jun 2023 20:07:53 +0900)
        await context_initializer.call( context, resolved_callapi_method );

        /*
         * Invoking the Resolved Method
         */
        const target_method      = resolved_callapi_method.value
        const target_method_args = message.command_value.method_args;
        return await (context.executeTransaction( target_method, ... target_method_args ));
      },
    );

  console.log( 'received No.1: %s', data );
  console.log( 'respapi_result', respapi_result );
  // console.log( 'context.hello_world', await context.hello_world() );

  return context
}

async function handle_on_error_of_ws_backend( nargs ) {
  const {
    event_handlers  = {},
    // context         = ((name)=>{throw new Error('${name} is not defined')})('context'),
    // websocket       = ((name)=>{throw new Error('${name} is not defined')})('websocket'),
    // req             = null,
    // data            = ((name)=>{throw new Error('${name} is not defined')})('data'),
  } = nargs;

  console.error(...args);

  if ( 'on_error' in event_handlers ) {
    try {
      event_handlers.on_error( ...args );
    } catch( e ){
      console.error('WARNING on_error handler threw an error. ignored. ', e );
    }
  }
}



function create_backend_websocket_initializer( context_factory, event_handlers ={}) {
  return (

    /*
     * websocket : an argument to specify a websocket instance from
     *             websocket/ws module.
     * req       : an optional argument to specify request header object from
     *             the common Request object.
     *
     *             https://developer.mozilla.org/en-US/docs/Web/API/Headers
     */
    async function on_init_websocket( websocket, req ) {

      const context = await context_factory();
      console.log( 'oMQGOcTggnA' , context );

      websocket.on( 'error', ()=>(
        handle_on_error_of_ws_backend(
          {
            event_handlers  ,
            context         ,
            websocket       ,
            req             ,
            // data            ,
          }
        )
      ));

      websocket.on( 'message', async (data)=>(
        handle_on_message_of_ws_backend(
          {
            event_handlers  ,
            context         ,
            websocket       ,
            req             ,
            data            ,
          }
        )
      ));

      handle_on_init_of_ws_backend(
        {
          event_handlers  ,
          context         ,
          websocket       ,
          req             ,
          // data            ,
        }
      )
    }
  );
}
module.exports.create_backend_websocket_initializer = create_backend_websocket_initializer;


