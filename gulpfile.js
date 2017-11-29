'use strict'

const gulp = require('gulp')
const del = require('del')
const mocha = require('gulp-mocha')
const ts = require('gulp-typescript')
const tslint = require('gulp-tslint')

const buildSources = 'src/**/*.ts'
const testSources = 'test/**/*.ts'
const exampleSources = 'examples/**/*.ts'

gulp.task('clean', () =>
  del(['*.js', '!gulpfile.js', '*.d.ts', 'examples/**/*.js']))

gulp.task('test', () =>
  gulp.src(testSources)
  .pipe(mocha({
    require: 'ts-node/register',
  })))

gulp.task('lint', () =>
    gulp.src([buildSources, testSources, exampleSources])
        .pipe(tslint({
            formatter: "verbose"
        }))
        .pipe(tslint.report())
)

const examplesTs = ts.createProject('examples/tsconfig.json')

gulp.task('build-examples', ['lint'], () =>
  examplesTs.src()
  .pipe(examplesTs({
    typescript: require('typescript')
  }))
  .pipe(gulp.dest('examples')))

const srcTs = ts.createProject('src/tsconfig.json')

gulp.task('build', ['clean', 'lint', 'test', 'build-examples'], () =>
  srcTs.src()
  .pipe(srcTs())
  .pipe(gulp.dest('.')))

gulp.task('watch', () =>
  gulp.watch([testSources, buildSources], ['test', 'lint']))
