
const { WebSocketServer } = require( 'ws' );
const { parse } = require( 'url');
const { respapi } = require( 'asynchronous-context-backend/respapi' );
const { trace_validator }  = require( 'vanilla-schema-validator' );
const { create_callapi_bridge } = require( './callapi-bridge' );
const { websocket_callapi } = require( './ws-callapi' );

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

function createWebSocketUpgrader( on_connection ) {
  const wss = new WebSocketServer({ noServer: true });
  wss.on( 'connection', on_connection );
  return ( request, socket, head )=>{
    wss.handleUpgrade( request, socket, head, function done(websocket) {
      wss.emit('connection', websocket, request);
    });
  };
}
module.exports.createWebSocketUpgrader = createWebSocketUpgrader;

const createMultipleWebSocketUpgrader = ( mapper )=>{
  return async function handle_upgrade(request, socket, head) {
    const { pathname } = parse( request.url );
    console.log( 'handle_upgrade : ', pathname );
    if ( pathname in mapper ) {
      console.log( `handle_upgrade on [${pathname}]` );
      await mapper[ pathname ]( request, socket, head )
    } else {
      console.log( `failed to 'handle_upgrade' on [${pathname}]` );
      socket.destroy();
    }
  };
};
module.exports.createMultipleWebSocketUpgrader = createMultipleWebSocketUpgrader;



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

function createAsyncContextWebsocketConnectionHandler( contextFactory ) {
  return (
    async function on_connection( websocket, req ) {
      websocket.on( 'error', console.error );
      websocket.on( 'message', async function message(data) {
        const message = JSON.parse( data.toString() );
        const info = trace_validator( t_respapi_message, message );
        if ( ! info.value ) {
          throw new Error( 'invalid message' + info.report() );
        }

        const context = await contextFactory();
        context.send_ws_message = async function( value ) {
          websocket.send( JSON.stringify( value ) );
        };
        context.frontend = create_callapi_bridge({
          callapi : websocket_callapi,
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
          if ( 'set_user_identity' in this ) {
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
              const target_method = resolved_callapi_method.value
              const target_method_args = message.command_value.method_args;

              // (Mon, 05 Jun 2023 20:07:53 +0900)
              await context_initializer.call( context, resolved_callapi_method );

              /*
               * Invoking the Resolved Method
               */
              return await (context.executeTransaction( target_method, ... target_method_args ));
            },
          );

        console.log( 'received No.1: %s', data );
        console.log( 'respapi_result', respapi_result );
        console.log( 'context.hello_world', await context.hello_world() );
      });
    }
  );
}
module.exports.createAsyncContextWebsocketConnectionHandler = createAsyncContextWebsocketConnectionHandler;


