
const { respapi } = require( './respapi.js' );
const { schema, trace_validator } = require( 'vanilla-schema-validator' );

const t_handle_message = schema.compile`
  object(
    context   : object(),
    websocket : object(),
    data      : object(),
  ),
`();
module.exports.t_handle_message = t_handle_message;

const t_respapi_message = schema.compile`
  object(
    command_type : string(),
    command_value : object(
      method_path : array_of( string() ),
      method_args : array_of( any() ),
    ),
  )
`();
module.exports.t_respapi_message = t_respapi_message;


async function handle_on_message_of_ws_frontend_respapi( nargs ) {
  {
    const info = trace_validator( t_handle_message, nargs );
    if ( ! info.value ) {
      throw new Error( 'invalid args ' + info.report() );
    }
  }

  const {
    context,
    websocket,
    data,

  } = nargs;

  const message = JSON.parse( data.toString() );
  {
    const info = trace_validator( t_respapi_message, message );
    if ( ! info.value ) {
      throw new Error( 'invalid message' + info.report() );
    }
  }

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
        // await context_initializer.call( context, resolved_callapi_method );

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
module.exports.handle_on_message_of_ws_frontend_respapi = handle_on_message_of_ws_frontend_respapi;



/*
 * See :
 * ```
 *    const { on_init_websocket_of_ws_backend } = require( './ws-middleware' );
 * ```
 */

function on_init_websocket_of_ws_frontend_respapi( websocket, context ) {
  websocket.on( 'message', (data)=>{
    return handle_on_message_of_ws_frontend_respapi({
      context,
      websocket,
      data,
    });
  });
  websocket.on( 'error', (...args)=>{
    console.error( ...args );
  });
}
module.exports.on_init_websocket_of_ws_frontend_respapi = on_init_websocket_of_ws_frontend_respapi;


