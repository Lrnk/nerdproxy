'use strict';

angular.module('nerdproxyApp')
  .factory('Model', function (Ref, $timeout) {

    function Model(modelId, modelData) {
      if (this.constructor === Model) {
        throw new Error("Tried to instantiate abstract class!");
      }

      this.firebaseRef = Ref.child('game1/models/' + modelId);

      this.firebaseRef.child('colour').on("value", function (snapshot) {
        this.colour = snapshot.val() || '#008000'; // default green;

        $timeout(function () {
          this.snap.attr('fill', this.colour);
        }.bind(this));

      }.bind(this));

      this.firebaseRef.on("child_changed", function (snapshot) {

        if (snapshot.key() === 'xCm' || snapshot.key() === 'yCm') {

          var property = snapshot.key();
          this[property] = snapshot.val();

          this.setPos(this.xCm, this.yCm);
        }

      }.bind(this));

    }

    Model.prototype = {

      setPos: abstractMethod,
      startMove: abstractMethod,
      continueMove: abstractMethod,
      endMove: abstractMethod,

      select: function () {
        this.snap.addClass('selected');
      },

      deselect: function () {
        this.snap.removeClass('selected');
      },

      setColour: function (colourHex) {
        this.firebaseRef.update({
          colour: colourHex
        });
      },

      getContextMenuItems: function () {
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
