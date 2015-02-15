var gulp = require('gulp');
var connect = require('gulp-connect');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var clean = require('gulp-clean');

var CONF = {
	'src' : './src/',
	'dest' : './release/'
};

gulp.task('default', ['release']);

gulp.task('server', ['connect', 'watch']);

gulp.task('release', ['js']);

gulp.task('reflush', ['release']);

gulp.task('watch', function() {
	gulp.watch([CONF.src + '**/*'], ['reflush']);
});

gulp.task('server', function() {
	connect.server({
		port : 8000,
		root : CONF.src,
		livereload : true
	});
});

gulp.task('clean', function() {
	return gulp.src(CONF.dest)
		.pipe(clean());
});

gulp.task('js', function() {
	// ;off
	gulp.src(CONF.src + 'js/Bit.js')
		.pipe(uglify())
		.pipe(rename('Bit.min.js'))
		.pipe(gulp.dest(CONF.dest + 'js/'));
		
    gulp.src(CONF.src + 'js/Bit.js')
        .pipe(rename('Bit.js'))
        .pipe(gulp.dest(CONF.dest + 'js/'));
	// ;on
});

