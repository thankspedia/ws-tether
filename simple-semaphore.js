
function createSimpleSemaphore() {
  let __msg = null;
  let __fn = null;

  const result =  function simple_semaphore( msg ) {
    if ( msg !== undefined ) {
      __msg = msg;
    }
    if ( __fn ) {
      __fn(__msg);
    } else {
      __fn = true;
    }
  };

  result.set = function(fn) {
    if ( __fn ) {
      fn(__msg);
    } else {
      __fn = fn;
    }
  };

  return result;
}

module.exports.createSimpleSemaphore = createSimpleSemaphore;
