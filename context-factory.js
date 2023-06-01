
const { create_callapi_bridge      } = require( './bridge' );
const { standard_callapi : callapi } = require( './callapi' );

function createContext( nargs ) {
  return create_callapi_bridge( { ...nargs, http_method : 'POST', callapi });
}
module.exports.createContext = createContext;

