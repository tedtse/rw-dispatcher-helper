export default {
  input: `./lib/index.js`,
  output: {
    file: `lib/index.umd.js`,
    format: 'umd',
    name: 'RWDispatcherHelper',
    globals: {
      vue: 'Vue',
      lodash: '_',
      'uuid/v4': 'UUID',
      'change-case': 'changeCase'
    },
    exports: 'named'
  },
  external: ['vue', 'lodash', 'uuid/v4', 'change-case']
}
