/**
 * @license
 * Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import filesize from 'rollup-plugin-filesize';
import {terser} from 'rollup-plugin-terser';
import resolve from 'rollup-plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import copy from 'rollup-plugin-copy';

const copyConfig = {
  targets: [
    { src: 'images', dest: 'build-modern' },
    { src: 'sound', dest: 'build-modern' },
    { src: 'auxtel.html', dest: 'build-modern', transform: (contents) => contents.toString().replace('./recent-images.js', './recent-images.bundled.js') },
    { src: 'comcam.html', dest: 'build-modern', transform: (contents) => contents.toString().replace('./recent-images.js', './recent-images.bundled.js')},
    { src: 'lsstcam.html', dest: 'build-modern', transform: (contents) => contents.toString().replace('./recent-images.js', './recent-images.bundled.js')},
    { src: 'lsstcam-bts.html', dest: 'build-modern', transform: (contents) => contents.toString().replace('./recent-images.js', './recent-images.bundled.js')},
    { src: 'index.html', dest: 'build-modern', transform: (contents) => contents.toString().replace('./recent-images.js', './recent-images.bundled.js')},
    { src: 'ts8.html', dest: 'build-modern', transform: (contents) => contents.toString().replace('./recent-images.js', './recent-images.bundled.js')},
  ],
};

export default {
  input: 'recent-images.js',
  output: {
    file: 'build-modern/recent-images.bundled.js',
    format: 'esm',
  },
  onwarn(warning) {
    if (warning.code !== 'THIS_IS_UNDEFINED') {
      console.error(`(!) ${warning.message}`);
    }
  },
  plugins: [
    replace({'Reflect.decorate': 'undefined'}),
    resolve(),
    terser({
      module: true,
      warnings: true,
    }),
    copy(copyConfig),
    filesize({
      showBrotliSize: true,
    })
  ]
}
