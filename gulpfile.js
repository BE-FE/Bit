var gulp = require('gulp');
var connect = require('gulp-connect');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var clean = require('gulp-clean');

var CONF = {
    'src' : './src/',
    'dest' : './release/',
    'test' : './test/'
};

gulp.task('default', ['release']);

gulp.task('server', ['connect']);

gulp.task('release', ['js']);

gulp.task('reflush', ['release']);

gulp.task('test', ['test-watch'], function() {

    gulp.watch([CONF.src + '**/*'], ['test-watch']);
    
    connect.server({
        port : 8000,
        root : CONF.test
    });
});

gulp.task('test-watch', function() {
    return gulp.src(CONF.src + 'Bit.js').pipe(gulp.dest(CONF.test));
});

gulp.task('clean', function() {
    return gulp.src(CONF.dest).pipe(clean());
});

gulp.task('js', function() {
    // ;off
	gulp.src(CONF.src + 'Bit.js')
	    .pipe(gulp.dest(CONF.dest))
		.pipe(uglify())
		.pipe(rename('Bit.min.js'))
		.pipe(gulp.dest(CONF.dest));
	// ;on
});

