require( 'dotenv' ).config();

const assert = require( 'node:assert/strict' );
const { test, describe, it, before, after }  = require( 'node:test' );

let testService = null;

const filter = (v)=>({
  ...v,
  value :
    Object.fromEntries(
      Object
        .entries(v.value)
        .filter( ([k,v])=>k!=='info'))
});

describe( 'middleware-test', ()=>{
  before(()=>{
  });
  after(()=>{
  });

  it( 'as no.1' , async()=>{

    assert.deepEqual(
      await (
        fetch( 'http://localhost:2003/api/hello-world', {
          method:'POST',
          body : JSON.stringify([]),
        }).then(
          response=>Promise.resolve( response.json() )
        )
      ),{
        status : 'succeeded',
        value  : 'hello world !!',
      }
    )

  });

  it( 'as no.2' , async()=>{

    assert.deepEqual(
      filter(
        await (
          fetch( 'http://localhost:2003/api/not/found', {
            method:'POST',
            body : JSON.stringify([ 'foo', 'bar' ]),
          }).then(
            response=>Promise.resolve( response.json() )
          )
      )),{
        status : 'error',
        value : {
          reason : "Not Found",
          status_code : 404,
        },
      }
    )

  });

  it( 'as no.3' , async()=>{

    assert.deepEqual(
      filter(
        await (
          fetch( 'http://localhost:2003/api/hello-world', {
            method:'GET',
          }).then(
            response=>Promise.resolve( response.json() )
          )
      )),{
        status : 'error',
        value : {
          reason : "Forbidden",
          status_code : 403,
        },
      }
    )

  });
});

