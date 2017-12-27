'use strict'

const gulp = require('gulp')
const del = require('del')
const ts = require('gulp-typescript')

const buildSources = 'src/**/*.ts'
const exampleSources = 'examples/**/*.ts'

gulp.task('clean', () =>
  del(['*.js', '!gulpfile.js', '*.d.ts', 'examples/**/*.js']))

const examplesTs = ts.createProject('examples/tsconfig.json')

gulp.task('build-examples', () =>
  examplesTs.src()
  .pipe(examplesTs({
    typescript: require('typescript')
  }))
  .pipe(gulp.dest('examples')))

const srcTs = ts.createProject('src/tsconfig.json')

gulp.task('build', ['clean', 'build-examples'], () =>
  srcTs.src()
  .pipe(srcTs())
  .pipe(gulp.dest('.')))
