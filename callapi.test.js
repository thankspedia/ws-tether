
require( 'dotenv' ).config();

const assert = require( 'node:assert/strict' );
const { test, describe, it, before, after }  = require( 'node:test' );
const { create_callapi } = require( './callapi.js' );

const callapi_debug_handler = (nargs)=>{
  return {
    status : 'succeeded',
    value : `${nargs.method_path.join('.')}(${nargs.method_args.join(',')})`,
  };
};

describe( 'callapi_test', ()=>{
  it( 'as No.1', async()=>{
    console.log({ create_callapi });
    const obj = create_callapi({
      callapi_handler : callapi_debug_handler,
    });
    assert.equal(await obj.hello.world('foo','bar') , 'hello.world(foo,bar)' );
  });
});
