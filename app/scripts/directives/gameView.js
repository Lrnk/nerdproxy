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

        var rangeLineSnap = gameSnap.line(0, 0, 0, 0);
        rangeLineSnap.addClass('range-line');

        var rangeInfoSnap = gameSnap.text(0, 0, '');
        rangeInfoSnap.addClass('range-info-text');

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

            gameSnap.selectAll('circle').remove();
            angular.forEach(scope.state.models, function (model, modelId) {
              var thisCircle = gameSnap.circle(model.xCm, model.yCm, 1.25);
              thisCircle.addClass('model inf');
              thisCircle.attr('data-model-id', modelId);
            });

            if (scope.state.range) {
              drawRangeLine(scope.state.range);
            }

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
          var range;

          $document.on('mousedown', function rangeCheckMouseDown(e) {

            if (!stuff.rangeCheckModeOn) {
              return;
            }

            leftOffset = element[0].offsetLeft + gameScroll.x;
            topOffset = element[0].offsetTop + gameScroll.y;

            startPageXPx = e.pageX - leftOffset;
            startPageYPx = e.pageY - topOffset;

            $document.on('mousemove', rangeCheckMouseMove);
            $document.on('mouseup', rangeCheckMouseUp);

            range = {
              x1Cm: scope.pxToCm(startPageXPx),
              y1Cm: scope.pxToCm(startPageYPx),
              x2Cm: scope.pxToCm(startPageXPx),
              y2Cm: scope.pxToCm(startPageYPx),
              infoText: '0.0'
            };

            drawRangeLine(range);

          });

          function rangeCheckMouseMove(e) {

            var posChangeXPx = startPageXPx - (e.pageX - leftOffset);
            var posChangeYPx = startPageYPx - (e.pageY - topOffset);

            var lengthPx = Math.sqrt(posChangeXPx * posChangeXPx + posChangeYPx * posChangeYPx);
            var lengthInches = scope.pxToCm(lengthPx) * 0.393700787;

            range.x2Cm = range.x1Cm - scope.pxToCm(posChangeXPx);
            range.y2Cm = range.y1Cm - scope.pxToCm(posChangeYPx);
            range.infoText = lengthInches.toFixed(1);

            drawRangeLine(range);
          }

          function rangeCheckMouseUp() {
            // end move
            scope.rangeCheckModeOn = false;
            $document.off('mousemove', rangeCheckMouseMove);
            $document.off('mouseup', rangeCheckMouseUp);

            scope.state.range = range;
            scope.saveState();

          }


        })();

        function drawRangeLine(range) {
          rangeLineSnap.attr({
            x1: range.x1Cm,
            y1: range.y1Cm,
            x2: range.x2Cm,
            y2: range.y2Cm
          });

          rangeInfoSnap.attr({
            x: range.x2Cm,
            y: range.y2Cm + 6,
            text: range.infoText
          });

        }

      }
    };
  });
