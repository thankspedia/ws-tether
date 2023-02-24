
const is_remote = true;
function createContext() {
  if ( is_remote ) {
    return require( './callapi' ).createContext({
      server_url           : 'http://localhost:2003/api/',
      authentication_token : 'hello_authentication_token',
      callapi              : require('./callapi' ).standard_callapi,
    });
  } else {
    return require( 'asynchronous-context-backend/middleware-test-context-factory' ).createContext();
  }
}

const __callapi =(...args)=>{
  console.log( 'callapi', ...args );
  return args;
};


test('test1', async()=>{
  debugger;
  const context = createContext();
  expect( await (context.hello_world( 'hello world !!' ))).toEqual( 'hello world !!' );
});

test('test2', async()=>{
  const context = createContext();
  await (context.hello.world.foo.bar.baz('hello world'));
});

test('test3', async()=>{
  await expect(async()=>{
    try {
      const context = createContext();
      await (context.hello2.world.foo.bar.baz({hello:'hello world'}));
    } catch ( e ) {
      throw new Error( 'error', { cause : e } );
    }

  }).rejects.toThrow();
});

test('test4', async()=>{
  await expect(( async()=>{
    try {
      const context = createContext();
      return await context.multiple(1,2,3,4);
    } catch ( e ) {
      throw new Error( 'error', { cause : e } );
    }

  })()).resolves.toEqual( [1,2,3,4] );
});

