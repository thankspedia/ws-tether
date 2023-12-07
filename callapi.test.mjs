
// require( 'dotenv' ).config();
// MODIFIED (Wed, 27 Sep 2023 13:28:23 +0900)
// MODIFIED (Thu, 05 Oct 2023 19:35:35 +0900)
// require('asynchronous-context/env').config();
import   assert from 'node:assert/strict' ;
import  { test, describe, it, before, after }  from 'node:test' ;
import  { create_callapi } from './callapi.js' ;

import settings from 'asynchronous-context/settings';

settings.filenameOfSettings( 'http-callapi-test.settings.json' );

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

