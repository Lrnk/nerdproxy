'use strict';

/**
 * @ngdoc directive
 * @name nerdproxyApp.directive:gameControls
 * @description
 * # gameControls
 */
angular.module('nerdproxyApp')
  .directive('gameView', function ($document, $timeout, $window, Mode) {
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

        var hammertime = new Hammer(element[0]);
        hammertime.get('pinch').set({enable: true});

        var initialZoom;
        hammertime.on('pinchstart', function () {

          if (stuff.mode !== Mode.MOVE_VIEW) {
            return;
          }

          initialZoom = stuff.zoomFactor;
          hammertime.on('pinchmove', pinchMoveZoom);

          hammertime.on('pinchend', removePinchMoveZoom);
          hammertime.on('pinchcancel', removePinchMoveZoom);

          function removePinchMoveZoom() {
            hammertime.off('pinchmove', pinchMoveZoom);
          }

        });

        function pinchMoveZoom(e) {
          scope.$apply(function () {
            stuff.zoomFactor = Math.max(initialZoom + (e.scale - 1), 1);
          })
        }

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


        scope.$watch('stuff.mode', function () {
          if (stuff.mode === Mode.MOVE_VIEW) {
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
          var spaceForThumb = 50;

          $document.on('mousedown', rangeCheckMouseDown);
          $document.on('touchstart', rangeCheckMouseDown);

          function rangeCheckMouseDown(e) {

            if (stuff.mode !== Mode.RANGE) {
              return;
            }
            if (!element.has($(e.target)).length) {
              return;
            }

            leftOffset = element[0].offsetLeft + gameScroll.x;
            topOffset = element[0].offsetTop + gameScroll.y;

            var pointerPosX = e.originalEvent.touches ? e.originalEvent.touches[0].clientX : e.pageX;
            var pointerPosY = e.originalEvent.touches ? e.originalEvent.touches[0].clientY - spaceForThumb: e.pageY;

            startPageXPx = pointerPosX - leftOffset;
            startPageYPx = pointerPosY - topOffset;

            $document.on('mousemove', rangeCheckMouseMove);
            $document.on('mouseup', rangeCheckMouseUp);

            $document.on('touchmove', rangeCheckMouseMove);
            $document.on('touchend', rangeCheckMouseUp);
            $document.on('touchcancel', rangeCheckMouseUp);

            range = {
              x1Cm: scope.pxToCm(startPageXPx),
              y1Cm: scope.pxToCm(startPageYPx),
              x2Cm: scope.pxToCm(startPageXPx),
              y2Cm: scope.pxToCm(startPageYPx),
              infoText: '0.0'
            };

            drawRangeLine(range);

          }

          function rangeCheckMouseMove(e) {

            var pointerPosX = e.originalEvent.touches ? e.originalEvent.touches[0].clientX : e.pageX;
            var pointerPosY = e.originalEvent.touches ? e.originalEvent.touches[0].clientY - spaceForThumb: e.pageY;

            var posChangeXPx = startPageXPx - (pointerPosX - leftOffset);
            var posChangeYPx = startPageYPx - (pointerPosY - topOffset);


            var lengthPx = Math.sqrt(posChangeXPx * posChangeXPx + posChangeYPx * posChangeYPx);
            var lengthInches = scope.pxToCm(lengthPx) * 0.393700787;

            range.x2Cm = range.x1Cm - scope.pxToCm(posChangeXPx);
            range.y2Cm = range.y1Cm - scope.pxToCm(posChangeYPx);
            range.infoText = lengthInches.toFixed(1);

            drawRangeLine(range);
          }

          function rangeCheckMouseUp() {
            // end move
            $document.off('mousemove', rangeCheckMouseMove);
            $document.off('mouseup', rangeCheckMouseUp);

            $document.off('touchmove', rangeCheckMouseMove);
            $document.off('touchend', rangeCheckMouseUp);
            $document.off('touchcancel', rangeCheckMouseUp);

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
            y: range.y2Cm - 6,
            text: range.infoText
          });

        }

      }
    };
  });
