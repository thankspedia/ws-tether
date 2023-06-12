
const { create_callapi_bridge  } = require( './callapi-bridge' );
const { http_frontend_callapi  } = require( './callapi' );

function createContext( nargs ) {
  const callapi = http_frontend_callapi;
  return create_callapi_bridge( { ...nargs, http_method : 'POST', callapi  });
}
module.exports.createContext = createContext;

