export const dummy_callapi_handler = (nargs)=>{
  const {
    method_args = [],
  } = nargs;
  console.log( 'callapi_handler', '(', ...method_args , ')', nargs );
  return {
    status : 'succeeded',
    value : method_args
  }
};

// module.exports.dummy_callapi_handler = dummy_callapi_handler;


