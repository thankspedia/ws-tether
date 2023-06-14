
const { create_callapi  } = require( './callapi.js' );
const { http_callapi_handler  } = require( './http-callapi' );

function createContext( nargs ) {
  const callapi_handler = http_callapi_handler;
  return create_callapi( { ...nargs, http_method : 'POST', callapi_handler  });
}
module.exports.createContext = createContext;

