'use strict';

/**
 * @ngdoc function
 * @name nerdproxyApp.controller:GameCtrl
 * @description
 * # GameCtrl
 * Controller of the nerdproxyApp
 */
angular.module('nerdproxyApp')
  .constant('Mode', {
    DEFAULT: 0,
    MOVE_VIEW: 1,
    RANGE: 2,
    MOVE_SELECTION: 3,
    ROTATE: 4,
    ADD_MODELS: 5
  })
  .controller('GameCtrl', function ($scope, $document, $timeout, Ref, Mode, BoardInfo) {

    var stuff = {

      onMobile: (function onMobile() {
        try {
          document.createEvent("TouchEvent");
          return true;
        }
        catch (e) {
          return false;
        }
      })(),

      mode: Mode.DEFAULT,

      models: {}

    };

    angular.extend($scope, {

      stuff: stuff,
      BoardInfo: BoardInfo,

      toggleMoveMode: toggleMoveMode,
      toggleRangeCheckMode: toggleRangeCheckMode,
      toggleMoveSelectionMode: toggleMoveSelectionMode,
      toggleRotateMode: toggleRotateMode,
      toggleAddModelsMode: toggleAddModelsMode,
      zoomIn: zoomIn,
      zoomOut: zoomOut,

      getXSpaceForMenus: getXSpaceForMenus,
      getYSpaceForMenus: getYSpaceForMenus,

      Mode: Mode,

      getSelectedModels: getSelectedModels,
      removeSelectedModels: removeSelectedModels
    });

    function getXSpaceForMenus() {

      if($(window).width() > $(window).height()) {
        return 300;
      } else {
        return 0;
      }

    }

    function getYSpaceForMenus() {

      if($(window).width() <= $(window).height()) {
        return stuff.selectedModelIds && stuff.selectedModelIds.length ? 250 : 200;
      } else {
        return 0;
      }

    }

    function toggleMoveMode() {
      if (stuff.mode === Mode.MOVE_VIEW) {
        stuff.mode = Mode.DEFAULT;
      } else {
        stuff.mode = Mode.MOVE_VIEW;
      }
    }

    function toggleMoveSelectionMode() {
      if (stuff.mode === Mode.MOVE_SELECTION) {
        stuff.mode = Mode.DEFAULT;
      } else {
        stuff.mode = Mode.MOVE_SELECTION;
      }
    }

    function toggleRotateMode() {
      if (stuff.mode === Mode.ROTATE) {
        stuff.mode = Mode.DEFAULT;
      } else {
        stuff.mode = Mode.ROTATE;
      }
    }

    function toggleRangeCheckMode() {
      if (stuff.mode === Mode.RANGE) {
        stuff.mode = Mode.DEFAULT;
      } else {
        stuff.mode = Mode.RANGE;
      }
    }

    function toggleAddModelsMode() {
      if (stuff.mode === Mode.ADD_MODELS) {
        stuff.mode = Mode.DEFAULT;
        $document.off('mousedown', cancelAddModelMode);
      } else {
        stuff.mode = Mode.ADD_MODELS;
        $document.on('mousedown', cancelAddModelMode);

      }

      function cancelAddModelMode(e) {
        if(!$('.model-maker').has($(e.target)).length) {

          $timeout(function() {
            stuff.mode = Mode.DEFAULT;
            $document.off('mousedown', cancelAddModelMode);
            $document.trigger(e);
          });
        }
      }
    }

    function zoomIn() {

      if (stuff.mode === Mode.MOVE_VIEW) {
        BoardInfo.zoomFactor *= 1.5;
      }
    }

    function zoomOut() {
      if (stuff.mode === Mode.MOVE_VIEW) {
        BoardInfo.zoomFactor /= 1.5;
        BoardInfo.zoomFactor = Math.max(BoardInfo.zoomFactor, 1);
      }
    }

    function getSelectedModels() {
      return _.filter(stuff.models, function(model) {return _.contains(stuff.selectedModelIds, model.id)});
    }

    function removeSelectedModels() {
      _.each(
        _.filter(stuff.models,
          function (model) {
            return _.contains(stuff.selectedModelIds, model.id)
          }),
        function (selectedModel) {
          selectedModel.removeFromGame();
        });
    }

  });
