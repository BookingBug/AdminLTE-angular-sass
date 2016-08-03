//Gulp components
var gulp           = require('gulp'),
    coffee         = require('gulp-coffee');                //Coffee to js compiler
    concat         = require('gulp-concat'),                //concats files
    uglify         = require('gulp-uglify'),                //uglifies files
    ngAnnotate     = require('gulp-ng-annotate'),           //annotates (angular brakes without this)
    cleanCSS       = require('gulp-clean-css'),             //minifies css files
    imagemin       = require('gulp-imagemin');              //optimises images
    runSequence    = require('run-sequence'),               //runs gulp tasks in sequence (tasks as array)
    sass           = require('gulp-sass'),                  //sass compiler
    mainBowerFiles = require('main-bower-files'),           //gets the main bower dependencies files
    fs             = require('fs'),                         //filesystem util
    path           = require('path'),                       //path for fs
    gulpif         = require('gulp-if'),                    //execute tasks conditionally
    gutil          = require('gulp-util'),                  //utilities for gulp plugins
    connect        = require('gulp-connect'),               //spawns local server for testing
    modRewrite     = require('connect-modrewrite'),         //modrewrite for tmp server
    open           = require('gulp-open'),                  //opens the browser
    streamqueue    = require('streamqueue'),                //merges different streams
    templateCache  = require('gulp-angular-templatecache'), //Add templates to templateCache
    rename         = require('gulp-rename'),
    sourcemaps     = require('gulp-sourcemaps');            //creates sourcemaps for debugging


/**
 * IF GULP IS TYPED WITH NO OTHER ARGUMENTS THIS WILL BE EXECUTED
 */
gulp.task('default', function() {
    return runSequence(
        //everything in square brackets executes in parallel
        //to force sequential execution put your task outside brackets
        [
            'dependencies-js',
            'js',
            'css-main',
            'css-skins',
            // 'css-vendor',
            // 'fonts',
            // 'images'
        ]
    );
});

/**
 * START ALL THE WATCHERS
 */
gulp.task('watch-init', function() {
    return runSequence(
        //everything in square brackets executes in parallel
        //to force sequential execution put your task outside brackets
        [
            'watch-js',
            'watch-css',
            // 'watch-images',
            'open-browser'
        ]
    );
});

/**
 * JAVASCRIPT RELATED TASKS
 */

gulp.task('dependencies-js', function () {
    //Get the vendor files
    var src = mainBowerFiles({
        includeDev : true,
        filter     : new RegExp('.js$')
    });

    //Concat the vendor with the core scripts
    return gulp.src(src)
        .pipe(concat('admin-layout-dependencies.min.js'))
        .pipe(ngAnnotate())
        .pipe(uglify())
        .pipe(gulp.dest('dist/js'));
});

// Process js files
gulp.task('js', function () {
    return gulp.src([
            'src/js/**/**/*.js.coffee'
        ]).pipe(gulpif(/.*coffee$/, coffee().on('error', gutil.log)))
        .pipe(concat('admin-layout.min.js'))
        .pipe(ngAnnotate())
        .pipe(uglify())
        .pipe(gulp.dest('dist/js'));
});

//File watcher: if a js is edited run concat compressor again
gulp.task('watch-js', ['js'], function () {
    gulp.watch('src/js/**/**/*.js.coffee', ['js']);
});

/**
 * END OF JAVASCRIPT RELATED TASKS
 */

/**
 * CSS RELATED TASKS
 */
//compile app specific scss to css
gulp.task('css-main', function() {
   gulp.src('src/stylesheets/AdminLTE.scss')
        .pipe(sourcemaps.init())
        .pipe(sass({onError: function(e) { console.log(e); }, outputStyle: 'compressed'}).on('error', gutil.log))
        .pipe(concat('admin-layout.min.css'))
        // .pipe(sourcemaps.write('maps', {includeContent: false}))
        .pipe(gulp.dest('dist/css'));
});

gulp.task('css-skins', function() {
     gulp.src(['src/stylesheets/skins/*.scss'])
        .pipe(sourcemaps.init())
        .pipe(sass({onError: function(e) { console.log(e); }, outputStyle: 'compressed'}).on('error', gutil.log))
        .pipe(rename({
            suffix: '.min'
        }))
        // .pipe(sourcemaps.write('maps', {includeContent: false}))
        .pipe(gulp.dest('dist/css'));
});

gulp.task('css-vendor', function() {
    //Get the vendor files

    var src = mainBowerFiles({
        includeDev : true,
        filter     : new RegExp('.css$'),
        overrides  : {
            "bootstrap-sass": {
                "ignore": true
            }
        }
    });

    var bootstrapSCSS, dependenciesCSS;

    bootstrapSCSS = gulp.src('src/stylesheets/bootstrap.scss')
        .pipe(sourcemaps.init())
        .pipe(sass({onError: function(e) { console.log(e); }, outputStyle: 'compressed'}).on('error', gutil.log));
    dependenciesCSS = gulp.src(src)
        .pipe(sourcemaps.init())
        .pipe(cleanCSS({compatibility: 'ie8'}));

    streamqueue({objectMode: true }, bootstrapSCSS, dependenciesCSS)
        .pipe(concat('admin-layout-dependencies.min.css'))
        // .pipe(sourcemaps.write('maps', {includeContent: false}))
        .pipe(gulp.dest('dist/css'));
});

//watch app specific scss
gulp.task('watch-css', ['css-main', 'css-skins'], function () {
    gulp.watch('src/stylesheets/**/*.scss', ['css-main', 'css-skins']);
});

/**
 * END OF CSS RELATED TASKS
 */

/**
 * FONTS RELATED TASKS
 */
gulp.task('fonts', function() {
    //for now copy over the bootstrap fonts
    gulp.src('bower_components/bootstrap-sass/assets/fonts/**/*.{ttf,woff,woff2,eof,eot,svg}')
        .pipe(gulp.dest('dist/fonts'));
});
/**
 * END OF FONTS RELATED TASKS
 */

/**
 * TMP LOCAL SERVER for DEV
 */
gulp.task('web-server', function() {
    //@todo Update connect version (here 2.3.1) when issue is fixed, a bug in later versions ignores index.html in directories.
    connect.server({
        root: [
            'dist'
        ],
        port: 8000,
        livereload: true,
        middleware: function(connect, options) {
            var middleware = [];

            //1. the rules that shape our mod-rewrite behavior
            var rules = [
                '!\\.html|\\.js|\\.css|\\.svg|\\woff|\\ttf|\\eot|\\woff2|\\.jp(e?)g|\\.png|\\.gif$ /index.html'
            ];

            middleware.push(modRewrite(rules));

            //2. original middleware behavior
            var base = options.root;
            if (!Array.isArray(base)) {
                base = [base];
            }

            base.forEach(function(path) {
                console.log(path);
                middleware.push(connect.static(path));
            });

            return middleware;
        }
    });
});

gulp.task('open-browser', ['web-server'], function() {
    return gulp.src(__filename)
        .pipe(open({uri: 'http://localhost:8000'}));
});
/**
 * END OF LOCAL TMP SERVER
 */

/**
 * Image optimisation
 */
gulp.task('images', function() {
    gulp.src('src/img/*')
        .pipe(imagemin())
        .pipe(gulp.dest('dist/img'));
});

gulp.task('watch-images', ['images'], function () {
    gulp.watch('src/img/*', ['images']);
});
/**
 * END of image optimisation
 */