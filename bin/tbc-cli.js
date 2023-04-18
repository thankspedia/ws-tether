#!/bin/env node

const { shutdownDatabaseContext } = require( 'database-postgresql-context' );

function createContext() {
  return require( 'coretbc/context' ).createContext( 'tBC-CLI' ).setOptions({autoCommit:false, showReport:true});
}

async function tbc(f) {
  const context = createContext();
  await context.executeTransaction(f);
  await context.logger.reportResult();
}

function initializeContext(context) {
  context.tbc = tbc;
  context.createContext = createContext;
}

async function execute () {
  const process = require('process');
  const argv =  process.argv.slice(2);
  if ( argv.length == 0 ) {
    const repl = require('node:repl');
    const replInstance = repl.start('> ')
    initializeContext( replInstance.context );
    replInstance.on( 'reset', initializeContext );

  } else {
    try {
      let  f = argv[0];
      try {
        const ff = require('path').join( require( 'process' ).cwd() , f );
        require.resolve(ff)
        f = ff;
      } catch (e){
        // f = require('path').join( require( 'process' ).cwd() , f );
      }
      await tbc( require( f ) );
    } finally {
      shutdownDatabaseContext();
    }
  }
}

execute();
