
const { create_callapi            } = require( './callapi.js' );
const { websocket_callapi_handler } = require( './ws-callapi' );

const {
  await_websocket,
  create_websocket,
} = require( './ws-utils.js' );

function createContext( nargs ) {
  const callapi_handler = websocket_callapi_handler;
  return create_callapi({ ...nargs, callapi_handler  });
}
module.exports.createContext = createContext;

