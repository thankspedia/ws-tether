#!/bin/env node

function start() {
  require( 'libtbc/service/start' ).start();

  /*
   * require( './app/simple00/start' ).start();
   */

  // {
  //   const { exec } = require("child_process");
  //   exec("cd apps/simple00/ && npm start", (error, stdout, stderr) => {
  //     if (error) {
  //       console.log(`error: ${error.message}`);
  //       return;
  //     }
  //     if (stderr) {
  //       console.log(`stderr: ${stderr}`);
  //       return;
  //     }
  //     console.log(`stdout: ${stdout}`);
  //   });
  // }
}

start();
