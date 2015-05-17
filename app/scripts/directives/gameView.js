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
              thisCircle.addClass('model inf model-id-' + modelId);
              thisCircle.attr('data-model-id', modelId);

              if (_.contains(stuff.selectedModelIds, modelId)){
                thisCircle.addClass('selected');
              }

              if (scope.state.range) {
                drawRangeLine(scope.state.range);
              }

            })
          });
        }


        (function initModelMovingStuff() {

          var startPageXPx;
          var startPageYPx;
          var leftOffset;
          var topOffset;
          var spaceForThumb = 50;

          var movingModels;

          $document.on('mousedown', modelMouseDown);
          $document.on('touchstart', modelMouseDown);

          function modelMouseDown(e) {

            // if we're in default mode, only move if we're clicking on a model
            // if we're in move_select mode, accept the selection as is and move it
            // else do nothing
            if (stuff.mode === Mode.DEFAULT && e.target.tagName === 'circle') {
              if (!stuff.selectedModelIds || stuff.selectedModelIds.length <= 1) {
                stuff.selectedModelIds = [$(e.target).data('modelId')];
              }
            } else if (stuff.mode !== Mode.MOVE_SELECTION) {
              return;
            }

            leftOffset = element[0].offsetLeft + gameScroll.x;
            topOffset = element[0].offsetTop + gameScroll.y;

            var pointerPosX = e.originalEvent.touches ? e.originalEvent.touches[0].clientX : e.pageX;
            var pointerPosY = e.originalEvent.touches ? e.originalEvent.touches[0].clientY : e.pageY;

            startPageXPx = pointerPosX - leftOffset;
            startPageYPx = pointerPosY - topOffset;

            angular.forEach(gameSnap.selectAll('.model'), function (anyModelSnap) {
              anyModelSnap.removeClass('selected');
            });
            movingModels = _.map(stuff.selectedModelIds, function (modelId) {

              var $model = element.find('.model-id-' + modelId);

              var modelSnap = gameSnap.select('.model-id-' + modelId);
              modelSnap.addClass('selected');
              var modelCloneSnap = modelSnap.clone();
              modelCloneSnap.addClass('move-shadow');
              modelCloneSnap.attr({
                'data-model-id': ''
              });

              return {
                modelId: modelId,
                model: scope.state.models[modelId],
                $model: $model,
                modelCloneSnap: modelCloneSnap,
                startModelXCm: $window.parseInt($model.attr('cx')),
                startModelYCm: $window.parseInt($model.attr('cy'))
              }
            });


            $document.on('mousemove', modelMouseMove);
            $document.on('mouseup', modelMouseUp);

            $document.on('touchmove', modelMouseMove);
            $document.on('touchend', modelMouseUp);
            $document.on('touchcancel', modelMouseUp);

          }

          function modelMouseMove(e) {

            var pointerPosX = e.originalEvent.touches ? e.originalEvent.touches[0].clientX : e.pageX;
            var pointerPosY = e.originalEvent.touches ? e.originalEvent.touches[0].clientY - (stuff.mode !== Mode.MOVE_SELECTION ? spaceForThumb : 0) : e.pageY;

            var posChangeXPx = startPageXPx - (pointerPosX - leftOffset);
            var posChangeYPx = startPageYPx - (pointerPosY - topOffset);

            angular.forEach(movingModels, function (movingModel) {
              movingModel.modelCloneSnap.attr('cx', movingModel.startModelXCm - scope.pxToCm(posChangeXPx));
              movingModel.modelCloneSnap.attr('cy', movingModel.startModelYCm - scope.pxToCm(posChangeYPx));
            });


          }

          function modelMouseUp() {

            angular.forEach(movingModels, function (movingModel) {

              movingModel.model.xCm = movingModel.modelCloneSnap.attr('cx');
              movingModel.model.yCm = movingModel.modelCloneSnap.attr('cy');

              movingModel.$model.attr('cx', movingModel.modelCloneSnap.cx);
              movingModel.$model.attr('cy', movingModel.modelCloneSnap.cy);

              movingModel.modelCloneSnap.remove();
            });

            stuff.selectedModelIds = _.map(movingModels, function (movingModel) {
              return movingModel.modelId;
            });

            movingModels = [];
            $document.off('mousemove', modelMouseMove);
            $document.off('mouseup', modelMouseUp);

            $document.off('touchmove', modelMouseMove);
            $document.off('touchend', modelMouseUp);
            $document.off('touchcancel', modelMouseUp);

            scope.saveState();

            scope.$apply();
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
            var pointerPosY = e.originalEvent.touches ? e.originalEvent.touches[0].clientY - spaceForThumb : e.pageY;

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
            var pointerPosY = e.originalEvent.touches ? e.originalEvent.touches[0].clientY - spaceForThumb : e.pageY;

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

            scope.$apply();
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

        (function initModelSelectionStuff() {

          var startXCm;
          var startYCm;
          var leftOffset;
          var topOffset;
          var selectBoxSnap;
          var modelsWithin;

          $document.on('mousedown', selectBoxMouseDown);
          $document.on('touchstart', selectBoxMouseDown);

          function selectBoxMouseDown(e) {

            if (stuff.mode !== Mode.DEFAULT) {
              return;
            }
            if (!element.has($(e.target)).length) {
              return;
            }
            if (e.target.tagName === 'circle') {
              return;
            }

            leftOffset = element[0].offsetLeft + gameScroll.x;
            topOffset = element[0].offsetTop + gameScroll.y;

            var pointerPosX = e.originalEvent.touches ? e.originalEvent.touches[0].clientX : e.pageX;
            var pointerPosY = e.originalEvent.touches ? e.originalEvent.touches[0].clientY : e.pageY;

            startXCm = scope.pxToCm(pointerPosX - leftOffset);
            startYCm = scope.pxToCm(pointerPosY - topOffset);

            selectBoxSnap = gameSnap.rect(startXCm, startYCm, 0, 0);
            selectBoxSnap.addClass('select-box');

            modelsWithin = [];

            $document.on('mousemove', selectBoxMouseMove);
            $document.on('mouseup', selectBoxMouseUp);

            $document.on('touchmove', selectBoxMouseMove);
            $document.on('touchend', selectBoxMouseUp);
            $document.on('touchcancel', selectBoxMouseUp);

          }

          function selectBoxMouseMove(e) {

            var pointerPosX = e.originalEvent.touches ? e.originalEvent.touches[0].clientX : e.pageX;
            var pointerPosY = e.originalEvent.touches ? e.originalEvent.touches[0].clientY : e.pageY;

            var posChangeXCm = startXCm - scope.pxToCm(pointerPosX - leftOffset);
            var posChangeYCm = startYCm - scope.pxToCm(pointerPosY - topOffset);

            var x = Math.min(startXCm, startXCm - posChangeXCm);
            var y = Math.min(startYCm, startYCm - posChangeYCm);
            var w = Math.abs(posChangeXCm);
            var h = Math.abs(posChangeYCm);

            selectBoxSnap.attr({
              'x': x,
              'y': y,
              'width': w,
              'height': h
            });

            modelsWithin = [];
            angular.forEach(scope.state.models, function (model, modelId) {
              if (model.xCm > x && model.xCm < (x + w) && model.yCm > y && model.yCm < (y + h)) {
                modelsWithin.push(model);
                gameSnap.select('.model-id-' + modelId).addClass('selected');
              } else {
                gameSnap.select('.model-id-' + modelId).removeClass('selected');
              }
            });
          }

          function selectBoxMouseUp() {

            selectBoxSnap.remove();

            stuff.selectedModelIds = _.map(modelsWithin, function (model) {
              return model.id;
            });

            $document.off('mousemove', selectBoxMouseMove);
            $document.off('mouseup', selectBoxMouseUp);

            $document.off('touchmove', selectBoxMouseMove);
            $document.off('touchend', selectBoxMouseUp);
            $document.off('touchcancel', selectBoxMouseUp);

            scope.$apply();
          }

        })();

      }
    };
  });
