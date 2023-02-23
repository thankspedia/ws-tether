

let testService = null; 

beforeAll( async ()=>{
});

afterAll( async ()=>{
});

test( 'test01', async()=>{
  expect( 
    await (
      fetch( 'http://localhost:2003/api/hello-world', { method:'POST' } )
      .then( response=>Promise.resolve( response.json() ) )
    )
  ).toEqual({
    status : 'succeeded',
    value  : 'hello world !!',
  });
});
