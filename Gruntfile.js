'use strict';

module.exports = function (grunt) {

    grunt.initConfig({
        jshint: {
            files: ['Gruntfile.js', 'lib/**/*.js', 'test/fixtures/*.js'],
            options: {
                jshintrc: '.jshintrc'
            }
        },
        mochatest: {
            src: ['test/*.js'],
            options: {
                globals: ['chai'],
                timeout: 6000,
                ignoreLeaks: false,
                ui: 'bdd',
                reporter: 'spec'
            }
        },
        clean: {
            'tmp': '/tmp/kraken*'
        }
    });

    grunt.loadNpmTasks('grunt-ci-suite');
    grunt.loadNpmTasks('grunt-contrib-clean');

    grunt.registerTask('test', ['jshint', 'mochatest', 'clean:tmp']);

};