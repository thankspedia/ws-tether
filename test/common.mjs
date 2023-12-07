
global.console = new console.Console({
  stdout : process.stdout,
  stdin : process.stdin,
  inspectOptions : {
    depth  : null,
    colors : true,
    showHidden : false,
    maxStringLength : Infinity,
  },
});

console.log( console.Console );

