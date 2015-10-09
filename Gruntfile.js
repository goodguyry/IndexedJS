  module.exports = function(grunt) {
  require('time-grunt')(grunt);

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    banner: '/* <%= pkg.name %> <%= pkg.version %> by <%= pkg.author.name %>\n' +
            ' * Source available at <%= pkg.repository.url %> */',

    jshint: {
      files: ['src/*.js'],
      options: {
        jshintrc: '.jshintrc'
      }
    },

    uglify: {
      options: {
        report: 'min',
        banner: '<%= banner %>\n\n',
        mangle: true,
        compress: {
          drop_console: true
        }
      },
      dist: {
        src: 'src/IndexedJS.js',
        dest: 'dist/IndexedJS.min.js'
      }
    },

    watch: {
      src: {
        files: ['src/*.js'],
        tasks: ['jshint', 'uglify'],
        options: {
          spawn: false
        }
      }
    }


  });

  // Load plugins
  require('load-grunt-tasks')(grunt);

  // Deploy tasks.
  grunt.registerTask('default', ['jshint', 'uglify']);

};
