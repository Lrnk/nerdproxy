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
    ROTATE: 4
  })
  .controller('GameCtrl', function ($scope, Ref, Mode, BoardInfo) {

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

      models: []

    };

    angular.extend($scope, {

      stuff: stuff,
      BoardInfo: BoardInfo,

      toggleMoveMode: toggleMoveMode,
      toggleRangeCheckMode: toggleRangeCheckMode,
      toggleMoveSelectionMode: toggleMoveSelectionMode,
      toggleRotateMode: toggleRotateMode,
      zoomIn: zoomIn,
      zoomOut: zoomOut,

      getXSpaceForMenus: getXSpaceForMenus,
      getYSpaceForMenus: getYSpaceForMenus,

      Mode: Mode,

      getSelectedModels: getSelectedModels
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

  });
