'use strict';

/**
 * @ngdoc overview
 * @name nerdproxyApp
 * @description
 * # nerdproxyApp
 *
 * Main module of the application.
 */
angular.module('nerdproxyApp', [
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'ngTouch',
    'firebase',
    'firebase.ref',
    'firebase.auth'
  ]);
