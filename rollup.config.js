import commonjs from '@rollup/plugin-commonjs' // Convert CommonJS modules to ES6
import babel from '@rollup/plugin-babel'
import json from '@rollup/plugin-json'
import { nodeResolve } from '@rollup/plugin-node-resolve'

export default {
  input: 'src/index.js', // Path relative to package.json
  output: [
    {
      format: 'es',
      file: 'lib/analyzer.es.js'
    },
    {
      format: 'umd',
      file: 'lib/analyzer.umd.js',
      name: 'sql-create-table-statement-analyzer'
    },
    {
      format: 'iife',
      file: 'lib/analyzer.iife.js',
      name: 'analyzer'
    }
  ],
  plugins: [
    commonjs(),
    babel(),
    nodeResolve(),
    json()
  ]
}
