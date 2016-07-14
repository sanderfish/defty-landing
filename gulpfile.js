var gulp        = require('gulp');
var browserSync = require('browser-sync');
var sass        = require('gulp-sass');
var prefix      = require('gulp-autoprefixer');
var cp          = require('child_process');
var include     = require('gulp-include');
var plumber     = require('gulp-plumber');
var notify      = require('gulp-notify');
var concat      = require('gulp-concat');
var dest        = require('gulp-dest');
var rename      = require('gulp-rename');
var uglify      = require('gulp-uglify');
var jshint      = require('gulp-jshint');
var svgmin      = require('gulp-svgmin');
var ghPages     = require('gulp-gh-pages');

var jekyll   = process.platform === 'win32' ? 'jekyll.bat' : 'jekyll';
var messages = {
    jekyllBuild: '<span style="color: grey">Running:</span> $ jekyll build'
};

/**
 * Build the Jekyll Site
 */
gulp.task('jekyll-build', function (done) {
    browserSync.notify(messages.jekyllBuild);
    return cp.spawn( jekyll , ['build'], {stdio: 'inherit'})
        .on('close', done);
});

/**
 * Rebuild Jekyll & do page reload
 */
gulp.task('jekyll-rebuild', ['jekyll-build'], function () {
    browserSync.reload();
});

/**
 * Wait for jekyll-build, then launch the Server
 */
gulp.task('browser-sync', ['sass', 'scripts', 'jekyll-build'], function() {
    browserSync({
        server: {
            baseDir: '_site'
        }
    });
});

/**
 * Deploy to github pages
**/
gulp.task('deploy', function() {
  return gulp.src('_site/**/**/*')
  .pipe(ghPages());
});

/**
 * Compile files from _scss into both _site/css (for live injecting) and site (for future jekyll builds)
 */
gulp.task('sass', function () {
    return gulp.src('_scss/main.scss')
        .pipe(sass({
            includePaths: ['scss'],
            onError: browserSync.notify
        }))
        .pipe(prefix(['last 15 versions', '> 1%', 'ie 8', 'ie 7'], { cascade: true }))
        .pipe(gulp.dest('_site/css'))
        .pipe(browserSync.reload({stream:true}))
        .pipe(gulp.dest('css'));
});

/** Concat & Minify JS **/

gulp.task('scripts', function() {
    return gulp.src('src/js/*.js')
        .pipe(include())
        .pipe(plumber({
            errorHandler: function(err){
                notify('JS compile error: ' + err);
            }
        }))
        .pipe(concat('main.js'))
        .pipe(gulp.dest('dest/js'))
        .pipe(rename({
            extname: ".min.js"
        }))
        .pipe(uglify())
        .pipe(gulp.dest('dest/js'))
        .pipe(notify('JS Compiled'));
});

/** Lint JS **/

gulp.task('lint', function() {
    return gulp.src('src/js/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

/** Minify SVG **/

gulp.task('svgmin', function(){
  return gulp.src('src/svg/*.svg')
    .pipe(svgmin())
    .pipe(gulp.dest('_site/assets/svg'))
});

/**
 * Watch scss files for changes & recompile
 * Watch html/md files, run jekyll & reload BrowserSync
 */
gulp.task('watch', function () {
    gulp.watch('_scss/**/**/*.scss', ['sass']);
    gulp.watch('src/svg/*.svg', ['svgmin']);
    gulp.watch('src/js/*.js', ['lint', 'scripts']);
    gulp.watch(['*.html', '_layouts/*.html', '_includes/*.html', '_posts/*', 'dest/js/*'], ['jekyll-rebuild']);
});

/**
 * Default task, running just `gulp` will compile the sass,
 * compile the jekyll site, launch BrowserSync & watch files.
 */
gulp.task('default', ['browser-sync', 'watch']);
