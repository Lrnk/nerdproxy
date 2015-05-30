'use strict';

angular.module('nerdproxyApp')
  .factory('Model', function (Ref) {

    function Model(modelData) {
      if (this.constructor === Model) {
        throw new Error("Tried to instantiate abstract class!");
      }

      this.firebaseRef = Ref.child('game1/models/' + modelData.id);
    }

    Model.prototype = {

      setPos: abstractMethod,
      startMove: abstractMethod,
      continueMove: abstractMethod,
      endMove: abstractMethod,
      getSyncData: abstractMethod,

      select: function () {
        this.snap.addClass('selected');
      },

      deselect: function () {
        this.snap.removeClass('selected');
      },

      setColourLocal: function(colourHex) {
        this.colour = colourHex;
        this.snap.attr('fill', colourHex);
      },

      setColourRemote: function(colourHex) {
        this.setColourLocal(colourHex);
        this.firebaseRef.update({
          colour: colourHex
        });
      },

      getContextMenuItems: function() {
        return [
          'move',
          'colour'
        ]
      }

    };

    _.extend(Model, {

      getModelIdFromElement: function getModelIdFromElement(element) {

        if (!element || !element instanceof SVGElement) {
          return undefined;

        } else if (element.className && element.className.baseVal && ~element.className.baseVal.indexOf('model ')) {
          return $(element).data('modelId');

        } else {
          return getModelIdFromElement(element.parentElement);
        }

      }
    });


    return (Model);


    function abstractMethod() {
      throw new Error("Tried to call abstract method");
    }

  }
);
