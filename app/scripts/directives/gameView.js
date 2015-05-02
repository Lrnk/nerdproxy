'use strict';

/**
 * @ngdoc directive
 * @name nerdproxyApp.directive:gameControls
 * @description
 * # gameControls
 */
angular.module('nerdproxyApp')
  .directive('gameView', function () {
    return {
      restrict: 'E',
      templateUrl: 'views/gameView.html',
      replace: true,
      link: function postLink(scope, element) {
        var gameScroll = new IScroll(element[0], {
          scrollbars: true,
          freeScroll: true,
          scrollX: true,
          scrollY: true,
          bounce: false
        });

        scope.$watch('stuff.zoomFactor', function(newVal) {
          if(newVal) {
            gameScroll.refresh();
          }
        });
      }
    };
  });
