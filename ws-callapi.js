

function websocket_callapi( nargs ) {
  const {
    websocket                  = ((v)=>{ throw new Error(`${v} is not specified`) })( 'websocket' ),
    method_path                = ((v)=>{ throw new Error(`${v} is not specified`) })( 'method_path' ),
    method_args                = ((v)=>{ throw new Error(`${v} is not specified`) })( 'method_args' ),
  } = nargs;

  if ( typeof websocket.send !== 'function' ) {
    throw new Error( `the argument websocket is not a function` );
  }

  const value = {
    command_type : 'invoke_method',
    command_value : {
      method_path,
      method_args,
    },
  };

  websocket.send( JSON.stringify( value ) );
}

module.exports.websocket_callapi = websocket_callapi;
