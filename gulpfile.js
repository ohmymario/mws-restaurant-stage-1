const gulp = require('gulp');
const babel = require('gulp-babel');
const uglify = require('gulp-uglify');
const htmlmin = require('gulp-htmlmin');
const browserify = require('browserify');
const imagemin = require('gulp-imagemin');
const cleanCSS = require('gulp-clean-css');
const source = require('vinyl-source-stream');
const sourcemaps = require('gulp-sourcemaps');
const autoprefixer = require('gulp-autoprefixer');
const imageminMozjpeg = require('imagemin-mozjpeg');

const compression = require('compression');

const babelify = require('babelify');

const browserSync = require('browser-sync').create();

const webp = require('gulp-webp');

gulp.task(
  'default',
  ['html', 'optimize-img', 'placeholder', 'copy-manifest', 'sw', 'styles', 'scripts-dist'],
  () => {
    gulp.watch('src/css/*.css', ['styles']);
    gulp.watch('src/js/*.js', ['scripts-dist']);
    gulp.watch('src/*.js', ['sw']);
    gulp.watch('src/*.html', ['html']);

    // reload when [copy-html runs]
    gulp.watch('./dist/index.html').on('change', browserSync.reload);

    browserSync.init({
      server: './dist',
      middleware: [compression()],
    });
  }
);

gulp.task('dist', ['html', 'sw', 'copy-manifest', 'styles', 'scripts-dist', 'optimize-img']);

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

// Placeholder
gulp.task('placeholder', () => {
  gulp
    .src('src/img/**/*')
    .pipe(
      imagemin([
        imageminMozjpeg({
          quality: 5,
        }),
      ])
    )
    .pipe(gulp.dest('dist/img/placeholder'));
});

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

// Minify HTML
gulp.task('html', () => {
  gulp
    .src('src/*.html')
    .pipe(htmlmin({ collapseWhitespace: true, removeComments: true }))
    .pipe(gulp.dest('./dist'));
});

// Add idb to serviceworker
gulp.task('sw', () =>
  browserify('src/sw.js')
    .transform('babelify', { presets: ['env'] })

    // NEED HARSHER PRESET
    .bundle()
    .pipe(source('sw.js'))
    .pipe(gulp.dest('./dist'))
);

gulp.task('copy-manifest', () => {
  gulp.src('src/manifest.json').pipe(gulp.dest('./dist'));
});
