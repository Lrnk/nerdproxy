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
        var gameSnap = Snap('.game-entities');

        element.find('svg')[0].setAttribute('viewBox', '0 0 ' + stuff.boardWidthCm + ' ' + stuff.boardHeightCm);

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


        scope.$on('refreshState', refreshState);

        function refreshState() {

          $timeout(function () {
            gameSnap.clear();

            angular.forEach(scope.state.models, function (model, modelId) {
              var thisCircle = gameSnap.circle(model.xCm, model.yCm, 1.25);
              thisCircle.addClass('model inf');
              thisCircle.attr('data-model-id', modelId);
            });

          })
        }


        (function initModelMovingStuff() {

          var startPageXPx;
          var startPageYPx;
          var startModelXCm;
          var startModelYCm;
          var $model;
          var modelId;

          $document.on('mousedown', function modelMouseDown(e) {

            if (e.target.tagName !== 'circle') {
              return;
            }

            startPageXPx = e.pageX;
            startPageYPx = e.pageY;
            $model = angular.element(e.target);
            modelId = $model.data('modelId');
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

            // update state
            scope.state.models[modelId].xCm = $model.attr('cx');
            scope.state.models[modelId].yCm = $model.attr('cy');
            scope.saveState();


            // end move
            $model = undefined;
            $document.off('mousemove', modelMouseMove);
            $document.off('mouseup', modelMouseUp);

          }

        })();

        (function initRangeCheckingStuff() {

          var startPageXPx;
          var startPageYPx;
          var leftOffset;
          var topOffset;

          var rangeLine;
          var infoText;

          $document.on('mousedown', function rangeCheckMouseDown(e) {

            //if (!scope.rangeCheckModeOn) {
            //  return;
            //}

            leftOffset = element[0].offsetLeft;
            topOffset = element[0].offsetTop;

            startPageXPx = e.pageX - leftOffset;
            startPageYPx = e.pageY - topOffset;

            rangeLine = gameSnap.line(scope.pxToCm(startPageXPx), scope.pxToCm(startPageYPx), scope.pxToCm(startPageXPx), scope.pxToCm(startPageYPx));
            rangeLine.addClass('range-line');

            infoText = gameSnap.text(scope.pxToCm(startPageXPx), scope.pxToCm(startPageYPx) + 6, '0.0');
            infoText.addClass('range-info-text');

            $document.on('mousemove', rangeCheckMouseMove);
            $document.on('mouseup', rangeCheckMouseUp);

          });

          function rangeCheckMouseMove(e) {

            var posChangeXPx = startPageXPx - (e.pageX - leftOffset);
            var posChangeYPx = startPageYPx - (e.pageY - topOffset);

            var lengthPx = Math.sqrt(posChangeXPx * posChangeXPx + posChangeYPx * posChangeYPx);
            var lengthInches = scope.pxToCm(lengthPx) * 0.393700787;

            rangeLine.attr({
              x2: scope.pxToCm(startPageXPx) - scope.pxToCm(posChangeXPx),
              y2: scope.pxToCm(startPageYPx) - scope.pxToCm(posChangeYPx)
            });

            infoText.attr({
              x: scope.pxToCm(startPageXPx) - scope.pxToCm(posChangeXPx),
              y: (scope.pxToCm(startPageYPx) - scope.pxToCm(posChangeYPx)) + 6,
              text: lengthInches.toFixed(1)
            });
          }

          function rangeCheckMouseUp() {
            // end move
            scope.rangeCheckModeOn = false;
            $document.off('mousemove', rangeCheckMouseMove);
            $document.off('mouseup', rangeCheckMouseUp);

          }


        })();

      }
    };
  });
