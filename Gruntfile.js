  module.exports = function(grunt) {
  require('time-grunt')(grunt);

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    banner: '/*! Copyright <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>\n' +
            ' * Source available at <%= pkg.repository.url %> */',

    jshint: {
      files: ['src/*.js', 'dist/main.js'],
      options: {
        expr: true,
        globals: {
          jQuery: false,
          console: true,
          module: true,
          eqeqeq: true
        }
      }
    },

    uglify: {
      options: {
        report: 'min',
        banner: '<%= banner %>\n\n',
        mangle: false
      },
      min: {
        options: {
          compress: {
            drop_console: true
          }
        },
        src: 'src/IndexedJS.js',
        dest: 'dist/IndexedJS.min.js'
      },
      dev: {
        src: 'src/IndexedJS.js',
        dest: 'dist/IndexedJS.dev.min.js'
      }
    },

    watch: {
      src: {
        files: ['src/*.js'],
        tasks: ['uglify', 'src-copy'],
        options: {
          spawn: false,
          livereload: true
        }
      }
    }


  });

  // Load plugins
  require('load-grunt-tasks')(grunt);

  // Deploy tasks.
  grunt.registerTask('default', ['jshint', 'uglify']);

};