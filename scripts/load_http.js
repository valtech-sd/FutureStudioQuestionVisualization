const jokes = require('one-liner-joke/jokes.json');
const fetch = require('node-fetch');

const MAX = 20;

let stats = {
  started: 0,
  done: 0,
  error: 0,
};
// Submit in single batch
//(async function () {
//  let submit = 
//  for (let i = 0; i < MAX; i++) {
//    stats.started++;
//    const j = jokes[i % jokes.length];
//  }
//  fetch('http://localhost:3000/api2/post', {
//    method: 'POST',
//    body: JSON.stringify({
//      entry: { body: j.body },
//      addedContexts: 'FutureStudios',
//    }),
//    headers: {
//      authorization: 'Basic ZXJpYzp0ZXN0',
//      'Content-Type': 'application/json',
//    },
//  })
//    .then(() => {
//      stats.done++;
//      console.log(stats);
//    })
//    .catch((e) => {
//      console.log(e);
//      stats.error++;
//      console.log(stats);
//    });
//
//  console.log(stats);
//})();

// 100 per second rate
(async function () {
  for (let i = 0; i < MAX; i++) {
    stats.started++;
    const j = jokes[i % jokes.length];
    fetch('http://localhost:3000/api2/post', {
      method: 'POST',
      body: JSON.stringify({
        entry: { body: j.body },
        addedContexts: 'FutureStudios',
      }),
      headers: {
        authorization: 'Basic ZXJpYzp0ZXN0',
        'Content-Type': 'application/json',
      },
    })
      .then(() => {
        stats.done++;
        console.log(stats);
      })
      .catch((e) => {
        console.log(e);
        stats.error++;
        console.log(stats);
      });

    console.log(stats);

    await new Promise((resolve) => setTimeout(() => resolve(), 10));
  }
})();
