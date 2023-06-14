
const { create_callapi } = require( './callapi.js' );
const { dummy_callapi_handler } = require( './dummy-callapi' );

function createDummyContext( nargs ) {
  const callapi_handler = dummy_callapi_handler;
  return create_callapi({ ...nargs, callapi_handler });
}
module.exports.createContext = createDummyContext;

