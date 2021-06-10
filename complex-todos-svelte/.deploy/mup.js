module.exports = {
  servers: {
    one: {
      host: '1.2.3.4',
      username: 'root',
      password: 'password',
      opts: {
        port: 22
      }
    }
  },

  app: {
    name: 'complex-todo-svelte',
    path: '../',
    docker: {
      image: 'abernix/meteord:node-12-base',
    },
    servers: {
      one: {},
    },
    buildOptions: {
      serverOnly: true,
    },
    env: {
      ROOT_URL: 'http://app.com',
    },
    deployCheckPort: 80,
    enableUploadProgressBar: true
  },
};
