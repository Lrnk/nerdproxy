'use strict';

/**
 * @ngdoc directive
 * @name nerdproxyApp.directive:gameControls
 * @description
 * # gameControls
 */
angular.module('nerdproxyApp')
  .directive('gameView', function ($rootScope, $document, $timeout, $window, Model, Inf, LargeInf, Tank, Mode, BoardInfo, BoardPointerEvents, Ref) {
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

        BoardInfo.setGameScroll(gameScroll);

        scope.$watch('BoardInfo.zoomFactor', function (newVal) {
          if (newVal) {
            gameScroll.refresh();
          }
        });

        scope.$watch('stuff.mode', function () {
          if (stuff.mode === Mode.MOVE_VIEW) {
            gameScroll.enable();
          } else {
            gameScroll.disable();
          }
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

        //handle removing models
        $rootScope.$on('model-removed', function(e, modelId) {
          delete stuff.models[modelId];

          var selectedModelIndex = stuff.selectedModelIds.indexOf(modelId);
          if (~selectedModelIndex) {
            stuff.selectedModelIds.splice(selectedModelIndex, 1);
          }
        });

        (function initModelMovingStuff() {

          var movingModels;

          BoardPointerEvents.addEvent(modelMouseDown, checkForModelMove, modelMouseMove, modelMouseUp, {spaceForThumbMove: true});

          function checkForModelMove(e) {

            if (!isElementOnBoard(e.target)) {
              return false;
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
                return false;
              }
            } else if (stuff.mode !== Mode.MOVE_SELECTION) {
              return false;
            }

            return true;

          }

          function modelMouseDown(e) {

            movingModels = _.map(stuff.selectedModelIds, function (modelId) {
              stuff.models[modelId].startMove(e.startXPx, e.startYPx);
              return stuff.models[modelId];
            });

          }

          function modelMouseMove(e) {

            angular.forEach(movingModels, function (movingModel) {
              movingModel.continueMove(e.pointerPosXPx, e.pointerPosYPx);
            });

          }

          function modelMouseUp() {

            angular.forEach(movingModels, function (movingModel) {
              movingModel.endMove();
            });

            movingModels = [];
            scope.$apply();
          }

        })();


        (function initModelRotatingStuff() {

          var model;
          var startAngleDegrees;

          BoardPointerEvents.addEvent(modelRotateMouseDown, checkForRotate, modelRotateMouseMove, modelRotateMouseUp);

          function checkForRotate() {

            if (stuff.mode !== Mode.ROTATE) {
              return false;
            }

            if (stuff.selectedModelIds.length !== 1) {
              console.log('invalid number of models selected: ' + stuff.selectedModelIds.length);
              return false;
            }

            return true;

          }

          function modelRotateMouseDown(e) {

            model = stuff.models[stuff.selectedModelIds[0]];

            var xDistFromModelCm = model.xCm - e.startXCm;
            var yDistFromModelCm = model.yCm - e.startYCm;

            var angleRadians = Math.atan(yDistFromModelCm / xDistFromModelCm);
            startAngleDegrees = angleRadians * (180 / Math.PI);

            model.startRotation();

          }

          function modelRotateMouseMove(e) {

            var xDistFromModelCm = model.xCm - e.pointerPosXCm;
            var yDistFromModelCm = model.yCm - e.pointerPosYCm;

            var angleRadians = Math.atan(yDistFromModelCm / xDistFromModelCm);
            var angleDegrees = angleRadians * (180 / Math.PI);

            model.continueRotation(angleDegrees - startAngleDegrees);

          }

          function modelRotateMouseUp() {

            model.endRotation();
            scope.$apply();

          }

        })();


        (function initRangeCheckingStuff() {

          var firebaseRef = Ref.child('game1/range');
          var range;

          BoardPointerEvents.addEvent(rangeCheckMouseDown, checkForRangeCheck, rangeCheckMouseMove, rangeCheckMouseUp, {spaceForThumbStart: true,  spaceForThumbMove: true});

          firebaseRef.on('value', function (snapshot) {
            drawRangeLine(snapshot.val());
          });

          function checkForRangeCheck(e) {
            return stuff.mode === Mode.RANGE && isElementOnBoard(e.target);
          }

          function rangeCheckMouseDown(e) {

            range = {
              x1Cm: BoardInfo.pxToCm(e.startXPx),
              y1Cm: BoardInfo.pxToCm(e.startYPx),
              x2Cm: BoardInfo.pxToCm(e.startXPx),
              y2Cm: BoardInfo.pxToCm(e.startYPx),
              infoText: '0.0'
            };

            drawRangeLine(range);

          }

          function rangeCheckMouseMove(e) {

            var lengthPx = Math.sqrt(e.posChangeXPx * e.posChangeXPx + e.posChangeYPx * e.posChangeYPx);
            var lengthInches = BoardInfo.pxToCm(lengthPx) * 0.393700787;

            range.x2Cm = range.x1Cm - e.posChangeXCm;
            range.y2Cm = range.y1Cm - e.posChangeYCm;
            range.infoText = lengthInches.toFixed(1);

            drawRangeLine(range);
          }

          function rangeCheckMouseUp() {
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

          var selectBoxSnap;
          var modelsWithin;

          BoardPointerEvents.addEvent(dragSelectMouseDown, checkForDragSelect, dragSelectMouseMove, dragSelectMouseUp, {spaceForThumbStart: true,  spaceForThumbMove: true});

          function checkForDragSelect(e) {
            if (stuff.mode !== Mode.DEFAULT) {
              return false;
            }
            if (!isElementOnBoard(e.target)) {
              return false;
            }
            // if we're clicking on a model, don't start a drag
            if (Model.getModelIdFromElement(e.target) !== undefined) {
              scope.$broadcast('modelSelection');
              return false;
            }

            return true;
          }

          function dragSelectMouseDown(e) {

            selectBoxSnap = BoardInfo.snap.rect(e.startXCm, e.startYCm, 0, 0);
            selectBoxSnap.addClass('select-box');

            modelsWithin = [];

          }

          function dragSelectMouseMove(e) {

            var x = Math.min(e.startXCm, e.startXCm - e.posChangeXCm);
            var y = Math.min(e.startYCm, e.startYCm - e.posChangeYCm);
            var w = Math.abs(e.posChangeXCm);
            var h = Math.abs(e.posChangeYCm);

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

          function dragSelectMouseUp() {

            selectBoxSnap.remove();

            stuff.selectedModelIds = _.map(modelsWithin, function (model) {
              return model.id;
            });

            scope.$broadcast('modelSelection');

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
