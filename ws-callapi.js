

function websocket_callapi_handler( nargs ) {
  const {
    websocket                  = ((v)=>{ throw new Error(`${v} is not specified`) })( 'websocket' ),
    method_path                = ((v)=>{ throw new Error(`${v} is not specified`) })( 'method_path' ),
    method_args                = ((v)=>{ throw new Error(`${v} is not specified`) })( 'method_args' ),
  } = nargs;

  if ( 1<=method_path.length && method_path[0] === 'websocket' ) {
    console.log( 'websocket_callapi_handler','6yvjkMQ7s9Q', { method_path, method_path } );
    if ( method_path.length === 1 ) {
      return ({
        status : 'succeeded',
        value :  websocket,
      });
    } else {
      const method_name = method_path[1] ?? null;
      const result = websocket[method_name]( ...method_args );
      return {
        status : 'succeeded',
        value : result,
      };
    }
  } else {

    if ( typeof websocket.send !== 'function' ) {
      throw new Error( `the argument websocket.send is not a function` );
    }

    const value = {
      command_type : 'invoke_method',
      command_value : {
        method_path,
        method_args,
      },
    };
    console.log( 'websocket_callapi_handler','2esIyrlhAi8', value );

    websocket.send( JSON.stringify( value ) );
    return {
      status : 'succeeded',
      value : null,
    };
  }


}

module.exports.websocket_callapi_handler = websocket_callapi_handler;
