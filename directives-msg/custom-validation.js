var demoApp = angular.module("demoApp", ['ngMessages']);

demoApp.controller("Controller",
    ['$scope', '$timeout',
        function ($scope, $timeout) {
            $scope.messages = [
                {code: 'required', message: 'Поле обязательное для заполнения'},
                {code: 'validateInn', message: 'Это не ИНН'},
                {code: 'cyrilic', message: 'Нерусский?'}
            ];

            $scope.showTooltip = function (id) {
                $(document.getElementsByClassName("validation-tooltip")).removeClass("hovered");
                angular.element(document.getElementById(id)).addClass("hovered");
            };

            $scope.formSubmit = function () {
                console.log($scope.userForm.name.$error);
                $scope.config = {
                    messages: $scope.messages
                };
            };

        }
    ]);

demoApp.directive('madiValidator', function ($compile) {
    return {
        restrict: 'A',
        require: 'ngModel',
        scope: {errors: '=madiValidator'},
        link: function (scope, elem, attr, modelCtrl) {
            var template = angular.element(
                '<div ng-messages="formValidator.$error">' +
                '   <div ng-message-exp="error.code" ng-repeat="error in errors">{{error.message}}</div>' +
                '</div>');

            var validators = {
                required: requiredValidator,
                cyrilic: function (modelValue, viewValue) {
                    return /^[А-ЯЁа-яё]+$/.test(modelValue);
                }
            };

            angular.forEach(scope.errors, function (error) {
                if (validator = validators[error.code]) {
                    modelCtrl.$validators[error.code] = validator;
                }
            });

            scope.formValidator = modelCtrl;
            elem.after(template);
            $compile(template)(scope);

            function requiredValidator(modelValue, viewValue) {
                return modelValue != undefined && modelValue != "";
            }
        }
    }
});

demoApp.directive('validateRequired', function () {
    return {
        require: 'ngModel',
        scope: true,
        link: function (scope, elem, attr, controller) {
            controller.$validators.validateRequired = function (modelValue, viewValue) {
                return modelValue != undefined && modelValue != "";
            };
        }
        ,
        template: '<div ng-messages="elem.$error">' +
        '   <div ng-message="validateRequired">Message from directive</div>' +
        '</div>'
    }
});


