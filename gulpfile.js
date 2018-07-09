const gulp = require('gulp');
const babel = require('gulp-babel');
const uglify = require('gulp-uglify');
const imagemin = require('gulp-imagemin');
const cleanCSS = require('gulp-clean-css');
const sourcemaps = require('gulp-sourcemaps');
const autoprefixer = require('gulp-autoprefixer');
const imageminMozjpeg = require('imagemin-mozjpeg');

const browserSync = require('browser-sync').create();

const webp = require('gulp-webp');

gulp.task('default', ['copy-html', 'optimize-img', 'styles', 'scripts'], () => {
  gulp.watch('src/css/*.css', ['styles']);
  gulp.watch('src/js/*.js', ['scripts']);
  gulp.watch('src/*.html', ['copy-html']);

  // reload when [copy-html runs]
  gulp.watch('./dist/index.html').on('change', browserSync.reload);

  browserSync.init({
    server: './dist',
  });
});

gulp.task('dist', [
  'copy-html',
  'copy-sw',
  'copy-manifest',
  'styles',
  'scripts-dist',
  'optimize-img',
]);

// Images
gulp.task('optimize-img', () => {
  gulp
    .src('src/img/**/*')
    // .pipe(imagemin([imagemin.jpegtran({ progressive: true })]))
    .pipe(
      imagemin([
        imageminMozjpeg({
          quality: 75,
        }),
      ])
    )
    // .pipe(webp())
    // Move development files to dist folder
    .pipe(gulp.dest('dist/img'));
});

// Javscript
gulp.task('scripts', () => {
  gulp
    .src('src/js/*.js')
    .pipe(sourcemaps.init())
    .pipe(
      babel({
        presets: ['env'],
      })
    )
    // .pipe(concat('bundle.js'))
    .pipe(sourcemaps.write())
    // Move development files to dist folder
    .pipe(gulp.dest('dist/js'));
});

gulp.task('scripts-dist', () => {
  gulp
    .src('src/js/*.js')
    .pipe(sourcemaps.init())
    .pipe(
      babel({
        presets: ['babel-preset-env'],
      })
    )
    // .pipe(concat('bundle.js'))
    .pipe(uglify())
    .pipe(sourcemaps.write())
    // Move development files to dist folder
    .pipe(gulp.dest('dist/js'));
});

// CSS
gulp.task('styles', () => {
  gulp
    .src('src/css/*.css')
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

// Copy Files
gulp.task('copy-html', () => {
  gulp.src('src/*.html').pipe(gulp.dest('./dist'));
});

gulp.task('copy-sw', () => {
  gulp.src('src/sw.js').pipe(gulp.dest('./dist'));
});

gulp.task('copy-manifest', () => {
  gulp.src('src/manifest.json').pipe(gulp.dest('./dist'));
});
