
require( 'dotenv' ).config();

const assert = require( 'node:assert/strict' );
const { test, describe, it, before, after } = require( 'node:test' );
const { createContext: __createContext } = require( './ws-frontend-callapi-context-factory' );

async function createContext() {
  return await __createContext( 'ws://localhost:3001/foo' );
}

describe( ()=>{
  it('as test1', async()=>{
    const p = new Promise( async (resolve,reject)=>{
      const { context } = await createContext();
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

  it('as test2', async()=>{
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
