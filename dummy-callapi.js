const dummy_callapi = (nargs)=>{
  const {
    method_args = [],
  } = nargs;
  console.log( 'callapi', '(', ...method_args , ')', nargs );
  return {
    status : 'succeeded',
    value : method_args
  }
};

module.exports.dummy_callapi         = dummy_callapi;


