var demoApp = angular.module("demoApp", ['ngMessages']);

demoApp.run(['$rootScope', function ($rootScope) {
    $rootScope.user = {
        login: 'test@test'
    };
}]);

demoApp.controller("TestCrl", function () {
});

demoApp.controller("NewTest", function ($scope) {
    $scope.user = {login: 'pff@pfff'}
});

demoApp.controller("Controller",
    ['$scope', '$timeout',
        function ($scope, $timeout) {
            var self = this;

            $scope.validation = false;
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
                //$scope.validation = true;
                //$scope.userForm.submitted = true;
                console.log($scope.userForm.name.$error);

                //console.log($scope.userForm.name.$error);
                //console.log(userForm.lastName.$error);
                //console.log(/[_А-ЯЁа-яё]/.test($scope.user.lastName));

                /*
                 $scope.validation = true;
                 $timeout(function () {
                 var x = document.getElementsByClassName("has-error");
                 if (x.length > 0) {
                 $scope.showTooltip(x[0].id);
                 }
                 }, 300);
                 */
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
                //var validator = validators[error.code];
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
            //scope.myVar = {invalidName: true};
            //console.log(scope);

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
demoApp.directive('validateCyrilic', function () {
    return {
        require: 'ngModel',
        scope: true,
        link: function (scope, elem, attr, controller) {
            controller.$parsers.unshift(function (value) {
                controller.$setValidity('validateCyrilic', /^[А-ЯЁа-яё]+$/.test(value));
                //console.log("validateCyrilic");
                return value;
            });
        }
    }
});
demoApp.directive('validateInn', function () {
    return {
        require: 'ngModel',
        link: function (scope, elem, attr, controller) {
            controller.$parsers.unshift(function (value) {
                controller.$setValidity('validateInn', /^[0-9]{10}$/.test(value));
                return value;
            });
        }
    }
});
demoApp.directive('uiValidationMessages', function ($compile) {
    return {

        scope: {
            messages: '=',
            form: '=',
            validation: '='
        },

        replace: true,
        templateUrl: 'messages-template.html',
        link: function ($scope, $element, $attrs) {


            wrapper = angular.element(document.getElementById($attrs.wrapperId));
            wrapper.attr("ng-mouseleave", "onMouseLeave($event)");
            wrapper.attr("ng-mouseenter", "onMouseEnter($event)");

            $scope.onMouseLeave = function ($event) {
                angular.element(document.getElementById($event.currentTarget.id)).removeClass("hovered");
            };

            $scope.onMouseEnter = function ($event) {
                $(document.getElementsByClassName("validation-tooltip")).removeClass("hovered");
                angular.element(document.getElementById($event.currentTarget.id)).addClass("hovered");
            };

            $compile(wrapper)($scope);
        }
    }
});
demoApp.directive('uiValidationMessage', function () {
    return {
        scope: {
            message: "=",
            msg: "@"
        },
        replace: true,
        require: '^^uiValidationMessages',
        templateUrl: 'message-template.html'
    }
});

