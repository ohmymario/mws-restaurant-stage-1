const gulp = require('gulp');
const babel = require('gulp-babel');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const imagemin = require('gulp-imagemin');
const cleanCSS = require('gulp-clean-css');
const sourcemaps = require('gulp-sourcemaps');
const autoprefixer = require('gulp-autoprefixer');

const webp = require('gulp-webp');

gulp.task('default', ['copy-html', 'copy-images', 'styles', 'scripts'], () => {
  gulp.watch('css/*.css', ['styles']);
  gulp.watch('js/*.js', ['scripts']);

  gulp.watch('/index.html', ['copy-html']);
});

gulp.task('dist', ['copy-html', 'copy-images', 'styles', 'scripts-dist']);

gulp.task('copy-html', () => {
  gulp.src('./index.html').pipe(gulp.dest('./dist'));
});

gulp.task('copy-images', () => {
  gulp
    .src('img/*.jpg')
    // .pipe(imagemin([imagemin.jpegtran({ progressive: true })]))
    .pipe(webp())
    // Move development files to dist folder
    .pipe(gulp.dest('dist/img'));
});

gulp.task('scripts', () => {
  gulp
    .src('js/*.js')
    .pipe(sourcemaps.init())
    .pipe(
      babel({
        presets: ['env'],
      })
    )
    .pipe(concat('bundle.js'))
    .pipe(sourcemaps.write())
    // Move development files to dist folder
    .pipe(gulp.dest('dist/js'));
});

gulp.task('scripts-dist', () => {
  gulp
    .src('js/*.js')
    .pipe(sourcemaps.init())
    .pipe(
      babel({
        presets: ['env'],
      })
    )
    .pipe(concat('bundle.js'))
    .pipe(uglify())
    .pipe(sourcemaps.write())
    // Move development files to dist folder
    .pipe(gulp.dest('dist/js'));
});

gulp.task('styles', () => {
  gulp
    .src('css/*.css')
    // .pipe(sourcemaps.init())
    .pipe(cleanCSS())
    // .pipe(sourcemaps.write())
    .pipe(
      autoprefixer({
        browsers: ['last 2 versions'],
      })
    )
    // Move development files to dist folder
    .pipe(gulp.dest('dist/css'));
});
