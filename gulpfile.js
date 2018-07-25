const gulp = require('gulp');
const babel = require('gulp-babel');
const uglify = require('gulp-uglify');
const htmlmin = require('gulp-htmlmin');
const browserify = require('browserify');
const cleanCSS = require('gulp-clean-css');
const source = require('vinyl-source-stream');
const sourcemaps = require('gulp-sourcemaps');
const autoprefixer = require('gulp-autoprefixer');

const concatCss = require('gulp-concat-css');
const purge = require('gulp-css-purge');
const concat = require('gulp-concat');

const responsive = require('gulp-responsive');

const compression = require('compression');

const browserSync = require('browser-sync').create();

const babelify = require('babelify');
const webp = require('gulp-webp');

gulp.task(
  'default',
  ['html', 'responsive-img', 'copy-manifest', 'sw', 'styles', 'scripts-dist'],
  () => {
    gulp.watch('src/css/*.css', ['styles']);
    gulp.watch('src/js/*.js', ['scripts-dist']);
    gulp.watch('src/*.js', ['sw']);
    gulp.watch('src/*.html', ['html']);
    gulp.watch('./dist/index.html').on('change', browserSync.reload);

    browserSync.init({
      server: './dist',
      middleware: [compression()],
    });
  }
);

gulp.task('dist', ['html', 'sw', 'copy-manifest', 'styles', 'scripts-dist', 'responsive-img']);

// Javscript
gulp.task('scripts', () => {
  gulp
    .src('src/js/*.js')
    .pipe(sourcemaps.init())
    .pipe(
      babel({
        presets: ['babel-preset-env'],
      })
    )
    .pipe(sourcemaps.write())
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
    .pipe(gulp.dest('dist/js'));
});

// CSS
gulp.task('styles', () => {
  gulp
    .src('src/css/*.css')
    // .pipe(sourcemaps.init())
    .pipe(concat('styles.css'))
    .pipe(
      purge({
        trim: false,

        trim_keep_non_standard_inline_comments: false,
        trim_removed_rules_previous_comment: true,
        trim_comments: true,
        trim_whitespace: false,
        trim_breaklines: false,
        trim_last_semicolon: false,

        shorten: false,
        shorten_hexcolor: false,
        shorten_hexcolor_extended_names: false,
        shorten_zero: false,
        verbose: true,
      })
    )
    // .pipe(cleanCSS())
    // .pipe(sourcemaps.write())
    .pipe(
      autoprefixer({
        browsers: ['last 2 versions'],
      })
    )
    .pipe(gulp.dest('dist/css'));
});

// Minify HTML
gulp.task('html', () => {
  gulp
    .src('src/*.html')
    .pipe(htmlmin({ collapseWhitespace: true, removeComments: true }))
    .pipe(gulp.dest('./dist'));
});

gulp.task('copy-manifest', () => {
  gulp.src('src/manifest.json').pipe(gulp.dest('./dist'));
});

// Add idb to Serviceworker
gulp.task('sw', () =>
  browserify('src/sw.js')
    .transform('babelify', { presets: ['env'] })
    .bundle()
    .pipe(source('sw.js'))
    .pipe(gulp.dest('./dist'))
);

// Responsive Images
gulp.task('responsive-img', () => {
  gulp
    .src('src/img/**/*')
    .pipe(
      responsive({
        // produce multiple images from one source
        '*.jpg': [
          {
            quality: 75,
          },
          {
            width: 280,
            quality: 75,
            rename: {
              suffix: '-280px',
            },
          },
          {
            width: 400,
            quality: 75,
            rename: {
              suffix: '-400px',
            },
          },
          {
            width: 500,
            quality: 75,
            blur: 30,
            rename: {
              suffix: '-blur',
            },
          },
        ],
        'icons/*.png': {
          quality: 75,
        },
      })
    )
    .pipe(gulp.dest('dist/img'));
});
