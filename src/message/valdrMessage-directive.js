angular.module('valdr')

  /**
   * This directive appends a validation message after each input element, which is nested in a valdr-type
   * directive and has an ng-model bound to it.
   * To prevent adding messages to specific input fields, the attribute 'no-valdr-message' can be added to those input
   * fields. The valdr-message directive is used to do the actual rendering of the violation messages.
   */
  .directive('input',
  ['$compile', function ($compile) {
    return  {
      restrict: 'E',
      require: ['?^valdrType', '?^ngModel', '?^form'],
      link: function (scope, element, attrs, controllers) {

        var valdrTypeController = controllers[0],
          ngModelController = controllers[1],
          formController = controllers[2],
          fieldName = attrs.name;

        // Stop right here if this is an <input> that's either not inside of a valdr-type block
        // or there is no ng-model bound to it.
        if (!valdrTypeController || !ngModelController || !formController) {
          return;
        }

        // Add violation message if there is no 'no-valdr-message' attribute on this input field.
        if (angular.isUndefined(attrs.noValdrMessage)) {
          var formField = formController.$name + '.' + fieldName;
          var valdrMessageElement = angular.element('<span valdr-message="' + formField + '"></span>');
          element.after(valdrMessageElement);
          $compile(valdrMessageElement)(scope);
        }
      }
    };
  }])

  /**
  * The valdr-message directive is responsible for the rendering of violation messages. The template used for rendering
  * is defined in the valdrMessage service where it can be overridden or a template URL can be configured.
  */
  .directive('valdrMessage',
  ['$rootScope', '$injector', 'valdrMessage', function ($rootScope, $injector, valdrMessage) {
    return {
      replace: true,
      restrict: 'A',
      scope: {
        formField: '=valdrMessage'
      },
      templateUrl: function () {
        return valdrMessage.templateUrl;
      },
      link: function (scope) {

        var updateTranslations = function () {
          if (valdrMessage.translateAvailable && angular.isArray(scope.violations)) {
            angular.forEach(scope.violations, function (violation) {
              valdrMessage.$translate(violation.field).then(function (translation) {
                violation.fieldName = translation;
              });
            });
          }
        };

        scope.$watch('formField.valdrViolations', function (valdrViolations) {
          if (valdrViolations && valdrViolations.length) {
            scope.violations = valdrViolations;
            scope.violation = valdrViolations[0];
            updateTranslations();
          } else {
            scope.violation = undefined;
            scope.violations = undefined;
          }
        });

        $rootScope.$on('$translateChangeSuccess', function () {
          updateTranslations();
        });
      }
    };
  }]);
