'use strict';

/**
 * @ngdoc directive
 * @name nerdproxyApp.directive:gameControls
 * @description
 * # gameControls
 */
angular.module('nerdproxyApp')
  .directive('gameView', function ($document, $timeout, $window, Model, Inf, LargeInf, Tank, Mode, BoardInfo, Ref) {
    return {
      restrict: 'E',
      templateUrl: 'views/gameView.html',
      replace: true,
      link: function postLink(scope, element) {

        // init

        var stuff = scope.stuff;
        BoardInfo.snap = Snap('.game-entities');

        var modelsRef = Ref.child('game1/models');

        var rangeLineSnap = BoardInfo.snap.line(0, 0, 0, 0);
        rangeLineSnap.addClass('range-line');

        var rangeInfoSnap = BoardInfo.snap.text(0, 0, '');
        rangeInfoSnap.addClass('range-info-text');

        element.find('svg')[0].setAttribute('viewBox', '0 0 ' + BoardInfo.widthCm + ' ' + BoardInfo.heightCm);

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

          initialZoom = BoardInfo.zoomFactor;
          hammertime.on('pinchmove', pinchMoveZoom);

          hammertime.on('pinchend', removePinchMoveZoom);
          hammertime.on('pinchcancel', removePinchMoveZoom);

          function removePinchMoveZoom() {
            hammertime.off('pinchmove', pinchMoveZoom);
          }

        });

        function pinchMoveZoom(e) {
          scope.$apply(function () {
            BoardInfo.zoomFactor = Math.max(initialZoom + (e.scale - 1), 1);
          })
        }

        scope.$watch('BoardInfo.zoomFactor', function (newVal) {
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

        // this affects context menu being open
        scope.$on('modelSelection', function () {
          $timeout(function () {
            refreshWindowSize();
          });
        });

        function refreshWindowSize() {

          BoardInfo.widthPx = Math.min(BoardInfo.maxWidthPx, $window.innerWidth - scope.getXSpaceForMenus());
          BoardInfo.heightPx = Math.min(BoardInfo.maxHeightPx, $window.innerHeight - scope.getYSpaceForMenus());

          var point6Recurring = (1 / 1.5);

          BoardInfo.widthPx = Math.min(BoardInfo.widthPx, BoardInfo.heightPx / point6Recurring);
          BoardInfo.heightPx = Math.min(BoardInfo.heightPx, BoardInfo.widthPx * point6Recurring);
        }


        scope.$watch('stuff.mode', function () {
          if (stuff.mode === Mode.MOVE_VIEW) {
            gameScroll.enable();
          } else {
            gameScroll.disable();
          }
        });


        // get models
        modelsRef.on("child_added", function (snapshot) {

          var modelId = snapshot.key();
          var modelData = snapshot.val();
          var model;

          switch (modelData.type) {
            case 'inf':
              model = new Inf(modelId, modelData);
              break;
            case 'largeInf':
              model = new LargeInf(modelId, modelData);
              break;
            case 'tank':
              model = new Tank(modelId, modelData);
              break;
            default:
              console.log('Unrecognised model type: ' + modelData.type);
              return;
          }

          stuff.models[modelId] = model;

        });

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

            if (!isElementOnBoard(e.target)) {
              return;
            }

            // if we're in default mode, only move if we're clicking on a model, else unselect
            // if we're in move_select mode, accept the selection as is and move it
            // else do nothing

            if (stuff.mode === Mode.DEFAULT) {
              var modelId = Model.getModelIdFromElement(e.target);
              if (modelId !== undefined) {

                var targetIsAlreadySelected = stuff.selectedModelIds && _.contains(stuff.selectedModelIds, modelId);
                if (!targetIsAlreadySelected) {
                  _.each(stuff.selectedModelIds, function (modelId) {
                    stuff.models[modelId].deselect();
                  });
                  stuff.selectedModelIds = [modelId];
                  stuff.models[modelId].select();
                  scope.$broadcast('modelSelection');
                }

              } else {
                _.each(stuff.selectedModelIds, function (modelId) {
                  stuff.models[modelId].deselect();
                });
                stuff.selectedModelIds = [];
                return;
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

            movingModels = _.map(stuff.selectedModelIds, function (modelId) {
              stuff.models[modelId].startMove(startPageXPx, startPageYPx);
              return stuff.models[modelId];
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

            angular.forEach(movingModels, function (movingModel) {
              movingModel.continueMove((pointerPosX - leftOffset), (pointerPosY - topOffset));
            });

          }

          function modelMouseUp() {

            angular.forEach(movingModels, function (movingModel) {
              movingModel.endMove();
            });

            movingModels = [];
            $document.off('mousemove', modelMouseMove);
            $document.off('mouseup', modelMouseUp);

            $document.off('touchmove', modelMouseMove);
            $document.off('touchend', modelMouseUp);
            $document.off('touchcancel', modelMouseUp);

            scope.$apply();
          }

        })();


        (function initModelRotatingStuff() {

          var model;
          var leftOffset;
          var topOffset;
          var startAngleDegrees;

          $document.on('mousedown', modelRotateMouseDown);
          $document.on('touchstart', modelRotateMouseDown);

          function modelRotateMouseDown(e) {

            if (stuff.mode !== Mode.ROTATE) {
              return;
            }
            if (stuff.selectedModelIds.length !== 1) {
              console.log('invalid number of models selected: ' + stuff.selectedModelIds.length);
              return;
            }

            model = stuff.models[stuff.selectedModelIds[0]];

            leftOffset = element[0].offsetLeft + gameScroll.x;
            topOffset = element[0].offsetTop + gameScroll.y;

            var pointerPosX = e.originalEvent.touches ? e.originalEvent.touches[0].clientX : e.pageX;
            var pointerPosY = e.originalEvent.touches ? e.originalEvent.touches[0].clientY : e.pageY;

            var startPageXPx = pointerPosX - leftOffset;
            var startPageYPx = pointerPosY - topOffset;

            var xDistFromModelCm = model.xCm - BoardInfo.pxToCm(startPageXPx);
            var yDistFromModelCm = model.yCm - BoardInfo.pxToCm(startPageYPx);

            var angleRadians = Math.atan(yDistFromModelCm / xDistFromModelCm);
            startAngleDegrees = angleRadians * (180 / Math.PI);

            model.startRotation();

            $document.on('mousemove', modelRotateMouseMove);
            $document.on('mouseup', modelRotateMouseUp);

            $document.on('touchmove', modelRotateMouseMove);
            $document.on('touchend', modelRotateMouseUp);
            $document.on('touchcancel', modelRotateMouseUp);

          }

          function modelRotateMouseMove(e) {

            var pointerPosX = e.originalEvent.touches ? e.originalEvent.touches[0].clientX : e.pageX;
            var pointerPosY = e.originalEvent.touches ? e.originalEvent.touches[0].clientY : e.pageY;

            var xDistFromModelCm = model.xCm - BoardInfo.pxToCm(pointerPosX - leftOffset);
            var yDistFromModelCm = model.yCm - BoardInfo.pxToCm(pointerPosY - topOffset);

            var angleRadians = Math.atan(yDistFromModelCm / xDistFromModelCm);
            var angleDegrees = angleRadians * (180 / Math.PI);

            model.continueRotation(angleDegrees - startAngleDegrees);

          }

          function modelRotateMouseUp() {

            model.endRotation();

            $document.off('mousemove', modelRotateMouseMove);
            $document.off('mouseup', modelRotateMouseUp);

            $document.off('touchmove', modelRotateMouseMove);
            $document.off('touchend', modelRotateMouseUp);
            $document.off('touchcancel', modelRotateMouseUp);

            scope.$apply();
          }

        })();


        (function initRangeCheckingStuff() {

          var firebaseRef = Ref.child('game1/range');
          var startPageXPx;
          var startPageYPx;
          var leftOffset;
          var topOffset;
          var range;
          var spaceForThumb = 50;

          $document.on('mousedown', rangeCheckMouseDown);
          $document.on('touchstart', rangeCheckMouseDown);

          firebaseRef.on('value', function (snapshot) {
            drawRangeLine(snapshot.val());
          });

          function rangeCheckMouseDown(e) {

            if (stuff.mode !== Mode.RANGE) {
              return;
            }
            if (!isElementOnBoard(e.target)) {
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
              x1Cm: BoardInfo.pxToCm(startPageXPx),
              y1Cm: BoardInfo.pxToCm(startPageYPx),
              x2Cm: BoardInfo.pxToCm(startPageXPx),
              y2Cm: BoardInfo.pxToCm(startPageYPx),
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
            var lengthInches = BoardInfo.pxToCm(lengthPx) * 0.393700787;

            range.x2Cm = range.x1Cm - BoardInfo.pxToCm(posChangeXPx);
            range.y2Cm = range.y1Cm - BoardInfo.pxToCm(posChangeYPx);
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

            firebaseRef.set(range);
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
            if (!isElementOnBoard(e.target)) {
              return;
            }
            if (Model.getModelIdFromElement(e.target) !== undefined) {
              scope.$broadcast('modelSelection');
              return;
            }

            leftOffset = element[0].offsetLeft + gameScroll.x;
            topOffset = element[0].offsetTop + gameScroll.y;

            var pointerPosX = e.originalEvent.touches ? e.originalEvent.touches[0].clientX : e.pageX;
            var pointerPosY = e.originalEvent.touches ? e.originalEvent.touches[0].clientY : e.pageY;

            startXCm = BoardInfo.pxToCm(pointerPosX - leftOffset);
            startYCm = BoardInfo.pxToCm(pointerPosY - topOffset);

            selectBoxSnap = BoardInfo.snap.rect(startXCm, startYCm, 0, 0);
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

            var posChangeXCm = startXCm - BoardInfo.pxToCm(pointerPosX - leftOffset);
            var posChangeYCm = startYCm - BoardInfo.pxToCm(pointerPosY - topOffset);

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

            modelsWithin = {};
            angular.forEach(stuff.models, function (model) {
              if (model.xCm > x && model.xCm < (x + w) && model.yCm > y && model.yCm < (y + h)) {
                modelsWithin[model.id] = model;
                model.select();
              } else {
                model.deselect();
              }
            });
          }

          function selectBoxMouseUp() {

            selectBoxSnap.remove();

            stuff.selectedModelIds = _.map(modelsWithin, function (model) {
              return model.id;
            });

            scope.$broadcast('modelSelection');

            $document.off('mousemove', selectBoxMouseMove);
            $document.off('mouseup', selectBoxMouseUp);

            $document.off('touchmove', selectBoxMouseMove);
            $document.off('touchend', selectBoxMouseUp);
            $document.off('touchcancel', selectBoxMouseUp);

            scope.$apply();
          }

        })();


        (function initAddModelStuff() {

          var spawningPit = $('.spawning-pit');
          var modelType;

          $document.on('mousedown', addModelMouseDown);
          $document.on('touchstart', addModelMouseDown);

          function addModelMouseDown(e) {

            if (stuff.mode !== Mode.ADD_MODELS) {
              return;
            }
            if (!spawningPit.has($(e.target)).length) {
              return;
            }

            modelType = $('.model-picker').find(":selected").attr('name');

            $document.on('mousemove', addModelMouseMove);
            $document.on('mouseup', addModelMouseUp);

            $document.on('touchmove', addModelMouseMove);
            $document.on('touchend', addModelMouseUp);
            $document.on('touchcancel', addModelMouseUp);

          }

          function addModelMouseMove(e) {

            //var pointerPosX = e.originalEvent.touches ? e.originalEvent.touches[0].clientX : e.pageX;
            //var pointerPosY = e.originalEvent.touches ? e.originalEvent.touches[0].clientY : e.pageY;
            //
            //var posChangeXCm = startXCm - BoardInfo.pxToCm(pointerPosX - leftOffset);
            //var posChangeYCm = startYCm - BoardInfo.pxToCm(pointerPosY - topOffset);
            //
            //var x = Math.min(startXCm, startXCm - posChangeXCm);
            //var y = Math.min(startYCm, startYCm - posChangeYCm);
            //var w = Math.abs(posChangeXCm);
            //var h = Math.abs(posChangeYCm);
            //
            //selectBoxSnap.attr({
            //  'x': x,
            //  'y': y,
            //  'width': w,
            //  'height': h
            //});
            //
            //modelsWithin = [];
            //angular.forEach(stuff.models, function (model) {
            //  if (model.xCm > x && model.xCm < (x + w) && model.yCm > y && model.yCm < (y + h)) {
            //    modelsWithin.push(model);
            //    model.select();
            //  } else {
            //    model.deselect();
            //  }
            //});
          }

          function addModelMouseUp() {

            var newModelRef = modelsRef.push({
              xCm: 100,
              yCm: 100,
              type: modelType
            });
            newModelRef.update({
              id: newModelRef.key()
            });

            $document.off('mousemove', addModelMouseMove);
            $document.off('mouseup', addModelMouseUp);

            $document.off('touchmove', addModelMouseMove);
            $document.off('touchend', addModelMouseUp);
            $document.off('touchcancel', addModelMouseUp);
          }

        })();


        function isElementOnBoard(el) {
          return !!element.has($(el)).length;
        }
      }
    };
  });
