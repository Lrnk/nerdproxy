'use strict';

/**
 * @ngdoc directive
 * @name nerdproxyApp.directive:gameControls
 * @description
 * # gameControls
 */
angular.module('nerdproxyApp')
  .directive('gameView', function ($document, $timeout, $window) {
    return {
      restrict: 'E',
      templateUrl: 'views/gameView.html',
      replace: true,
      link: function postLink(scope, element) {

        // init

        var stuff = scope.stuff;

        var gameScroll = new IScroll(element[0], {
          scrollbars: true,
          freeScroll: true,
          scrollX: true,
          scrollY: true,
          bounce: false,
          momentum: false
        });

        scope.$watch('stuff.zoomFactor', function (newVal) {
          if (newVal) {
            gameScroll.refresh();
          }
        });

        refreshWindowSize();

        angular.element($window).on('resize', function () {
          $timeout(function () {
            refreshWindowSize();
          });
        });

        function refreshWindowSize() {

          stuff.boardWidth = Math.min(stuff.maxBoardWidth, $window.innerWidth);
          stuff.boardHeight = Math.min(stuff.maxBoardHeight, $window.innerHeight);

          stuff.boardWidth = Math.min(stuff.boardWidth, stuff.boardHeight / (1 / 1.5)); // 0.6 recurring
          stuff.boardHeight = Math.min(stuff.boardHeight, stuff.boardWidth * (1 / 1.5)); // 0.6 recurring
        }


        scope.$watch('stuff.moveModeOn', function () {
          if (scope.stuff.moveModeOn) {
            gameScroll.enable();
          } else {
            gameScroll.disable();
          }
        });


        function refreshState() {

          $timeout(function() {
            var $entities = element.find('svg');

            $entities.empty();

            angular.forEach(scope.testState.models, function (model) {
              $entities.append('<circle data-model-id="' + model.id + '" class="model inf" cx="' + model.xCm + '" cy="' + model.yCm + '" r="1.25"/>')
            });

            element.html(element.html()); // refresh the html so the svg is redrawn

          })
        }

        refreshState();


        // Moving models

        var startPageXPx;
        var startPageYPx;
        var startModelXCm;
        var startModelYCm;
        var $model;

        $document.on('mousedown', function (e) {

          if (e.target.tagName !== 'circle') {
            return;
          }

          startPageXPx = e.pageX;
          startPageYPx = e.pageY;
          $model = angular.element(e.target);
          startModelXCm = $window.parseInt($model.attr('cx'));
          startModelYCm = $window.parseInt($model.attr('cy'));


          $document.on('mousemove', modelMouseMove);
          $document.on('mouseup', modelMouseUp);

        });

        function modelMouseMove(e) {

          var posChangeXPx = startPageXPx - e.pageX;
          var posChangeYPx = startPageYPx - e.pageY;

          $model.attr('cx', startModelXCm - scope.pxToCm(posChangeXPx));
          $model.attr('cy', startModelYCm - scope.pxToCm(posChangeYPx));
        }

        function modelMouseUp() {
          $model = undefined;
          $document.off('mousemove', modelMouseMove);
          $document.off('mouseup', modelMouseUp);
        }

      }
    };
  });
