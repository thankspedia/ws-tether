// require( 'dotenv' ).config();
// MODIFIED (Wed, 27 Sep 2023 13:28:23 +0900)
require('asynchronous-context/settings').filenameOfSettings('http-middleware-test-context-factory.settings.json' );
require('asynchronous-context/env').config();


Object.assign( require('util').inspect.defaultOptions, {
  depth  : null,
  colors : false,
  showHidden : false,
  maxStringLength : Infinity,
  // compact: false,
  // breakLength: 1000,
});

const assert = require( 'node:assert/strict' );
const { test, describe, it, before, after }  = require( 'node:test' );
const { spawn } = require( 'node:child_process' );

let testService = null;

const filter = (v, allowed_fields =[ 'reason','status_code'])=>({
  ...v,
  value :
    Object.fromEntries(
      Object
        .entries(v.value)
        .filter( ([k,v])=>allowed_fields.includes(k)))
});

const sleep = (t)=>(new Promise((resolve,reject)=>{
  setTimeout(resolve,t);
}));
let service = null;

describe( 'http-middleware-test', async ()=>{
  await before( async ()=>{
    console.warn('BEFORE');
    try {
      service = spawn( 'start-http-middleware-service', {
        // detached:true,
        shell:false,
        env: Object.assign({},process.env,{})
      });
      service.stdout.on('data', (data)=>{
        console.log( data.toString().trim().replaceAll( /^/gm, 'stdout >> ' ) );
      });
      service.stderr.on('data', (data)=>{
        console.log( data.toString().trim().replaceAll( /^/gm, 'stderr >> ' ) );
      });
    } catch (e) {
      console.error(e);
    }

    await sleep( 1000 );
    console.error( 'BEFORE', service != null );
    await sleep( 1000 );
  });


  await after(  async ()=>{
    console.warn('AFTER');
    try{
      service.kill();
      service.unref();
      console.error( 'DISCONNECTED', service.pid );
    } catch(e){
      console.error(e);
    }
    await sleep( 1000 );
  });

  await it( 'as no.1' , async()=>{
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

  await it( 'as no.2' , async()=>{

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

  await it( 'as no.3' , async()=>{

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

  await it( 'as no.4' , async()=>{

    assert.deepEqual(
      filter(
        await (
          fetch( 'http://localhost:2003/api/throw-hello-world', {
            method:'POST',
            body :'[]',
          }).then(
            response=>Promise.resolve( response.json() )
          )
        )
      ,['message']),
      {
        status : 'error',
        value : {
          message : 'hello world !!',
        },
      }
    )
  });
});

