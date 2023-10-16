
// require( 'dotenv' ).config();
// MODIFIED (Wed, 27 Sep 2023 13:28:23 +0900)
require( 'asynchronous-context/settings' ).filenameOfSettings( './ws-callapi-test-context-factory.settings.json' );
require( 'asynchronous-context/env' ).config();

Object.assign( require('util').inspect.defaultOptions, {
  depth  : null,
  colors : false,
  showHidden : false,
  maxStringLength : Infinity,
  // compact: false,
  // breakLength: 1000,
});


const assert = require( 'node:assert/strict' );
const { test, describe, it, before, after } = require( 'node:test' );
const { spawn } = require( 'node:child_process' );
const { createContext: __createContext } = require( 'asynchronous-context-rpc/ws-frontend-callapi-context-factory' );

async function createContext() {
  return await __createContext({ websocket: 'ws://localhost:3954/foo'});
}

const sleep = (t)=>(new Promise((resolve,reject)=>{
  setTimeout(resolve,t);
}));

let service = null;


describe( async ()=>{
  await before( async ()=>{
    console.warn('BEFORE');
    try {
      service = spawn( 'start-ws-service', {
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

  await it('as test1', async()=>{
    const p = new Promise( async (resolve,reject)=>{
      const {context} = await createContext();
      const websocket = (await context.websocket() );
      const close = ()=>websocket.close();

      websocket.on( 'message', ( data )=>{
        const v = JSON.parse( data.toString() );
        if ( v === 'Okay, your request was received.' ) {
          resolve(v);
        } else {
          reject(v);
        }
        close();
      });

      setTimeout( ()=>{
        reject('timeout')
        close();
      }, 100 );

      await context.say_hello();
    });

    //assert.equal( await ( context.hello_world( 'hello world !!' ) ) , 'hello world !!' );
    return await p;
  });

  await it('as test2', async()=>{
    const p = new Promise( async (resolve,reject)=>{
      const { context } = await createContext();
      const websocket = (await context.websocket() );
      const close = ()=>websocket.close();

      websocket.on( 'message', ( data )=>{
        const v = JSON.parse( data.toString() );
        console.log( 'hJGqsnbq5A4', v );
        if ( v.message.join(',') === 'okay,hello,world,foo' ) {
          resolve(v);
        } else {
          reject(v);
        }
        close();
      });

      setTimeout( ()=>{
        reject('timeout')
        close();
      }, 1000 );

      await (context.hello.world.foo.bar.baz( 'hello','world','foo' ));
    });

    //assert.equal( await ( context.hello_world( 'hello world !!' ) ) , 'hello world !!' );
    return await p;
  });


  // it('as test3', async()=>{
  //   await assert.rejects((async()=>{
  //     try {
  //       const context = await createContext();
  //       await (context.hello2.world.foo.bar.baz({hello:'hello world'}));
  //     } catch ( e ) {
  //       console.log( 'expected exception', e );
  //       throw new Error( 'error', { cause : e } );
  //     }

  //   }));
  // });

  // it('as test4', async()=>{
  //   await assert.doesNotReject( async()=>{
  //     try {
  //       const context = await createContext();
  //       const result = await context.multiple(1,2,3,4);
  //       assert.deepEqual( result, [1,2,3,4]);
  //     } catch ( e ) {
  //       console.error( 'unexpected exception', e );
  //       throw new Error( 'error', { cause : e } );
  //     }
  //   });
  // });
});

