'use strict';

/**
 * @ngdoc function
 * @name nerdproxyApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the nerdproxyApp
 */
angular.module('nerdproxyApp')
  .controller('MainCtrl', function ($scope) {
    $scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];
  });
