
const { create_callapi_bridge } = require( './callapi-bridge' );
const { dummy_callapi         } = require( './callapi' );

function createDummyContext( nargs ) {
  const callapi = dummy_callapi;
  return create_callapi_bridge({ ...nargs, callapi });
}
module.exports.createContext = createDummyContext;

