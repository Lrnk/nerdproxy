'use strict';

/**
 * @ngdoc directive
 * @name nerdproxyApp.directive:gameControls
 * @description
 * # gameControls
 */
angular.module('nerdproxyApp')
  .directive('gameControls', function () {
    return {
      restrict: 'E',
      templateUrl: 'views/gameControls.html',
      replace: true,
      link: function postLink() {


      }
    };
  });
