angular.module('complaint.controllers', [])./**
 * Created by User on 12.04.2016.
 */
controller('complaintController',
    [
        '$rootScope', '$scope', 'utils', '$timeout', 'securityService', 'complaintServices',
        function ($rootScope, $scope, utils, $timeout, securityService, complaintServices) {
            $scope.utils = utils;
            $scope.owner = owner;
            $scope.securityService = securityService;
            //default values for new complaint
            $scope.complaint = {
                number: null,
                requestId:null,
                gender: 'MALE',
                applicantType: 'PERSON',
                deliveryType: '0',
                deliveryTypeName: '',
                sentOrganizationName: '',
                sentOrganizationOutNumber: '',
                sentOrganizationOutDate: '',
                deliveryTypeAnswer: '2',
                executiveOrgDetailsList: [],
                sentOrgDetailsList: [],
                complaintDetailsList: [],
                complaintHistory: [],
                answers: [],
                attachments: [],
                action: ''
            };
            $scope.categories = $rootScope.dictionaries.categories;
            $scope.verdictActorList = $rootScope.dictionaries.verdictActorList;
            //initializing empty vehicle additional info data and related complaints for info dialog
            $scope.actionButtonDisabled = false;
            $scope.deliveryTypes = $rootScope.dictionaries.deliveryTypes;
            $scope.isExternalComplaint = function () {
                var deliveryTypes = $.map( $rootScope.app.externalDeliveryTypes, function(item){
                    return item.value;
                });
                return deliveryTypes.indexOf($scope.complaint.deliveryType) != -1;
            };
            // angular does not support dynamic element validation so this is workaround

            $scope.commentDialog = null;
            $scope.rejectDialog = null;
            $scope.redirectAdviceDialog = null;
            $scope.$contactPersonNameEditable = false;
            $scope.creationDateEditMode = false;
            $scope.closingDateEditMode = false;
            $scope.deleteRespFileDialog = null;
            $scope.sendToCheckDialog = null;
            $scope.rejectInfoDialog = null;
            $scope.signInfoDialog = null;
            //Данные для формирования фабул
            $scope.fableGroup = null;
            $scope.fableDocument = null;
            $scope.fableDocumentId = null;
            $scope.fableFirstStepDialog = null;
            $scope.fableSecondStepDialog = null;
            $scope.preparedSections = [];
            $scope.requestId = null;
            $scope.prepareFablesRequest = {};
            $scope.processFableRequest = {};
            $scope.createFileError = false;
            $scope.selectedAttachmentIdForNotification = null ;
            $scope.notifyDocumentsFilter =  function() {
                return function(item) {
                    if (!!item.responseId) {
                        if($scope.complaint.answers) {
                            for( var i = 0 ; i < $scope.complaint.answers.length ; ++i) {
                                if( $scope.complaint.answers[i].addresseeName == "Заявитель") {
                                    if( $scope.complaint.answers[i].attachments) {
                                        for( var j = 0 ; j < $scope.complaint.answers[i].attachments.length; ++j){
                                            if($scope.complaint.answers[i].attachments[j].id == item.id) {
                                                return true ;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    return false ;
                };
            };

            var claimId = utils.getParameterByName('claimid');
            var reSubmit = utils.getParameterByName('reSubmit');
            if (claimId) {
                utils.showAjaxLoader();
                complaintServices.getComplaint(claimId)
                    .then(function (data) {
                        $scope.pageInitAfterComplaintLoading(data);
                    });
                //utils.redirectToUrl();
            } else if (reSubmit) {
                var declarant = utils.getParameterByName('declarant');
                var personFullName = utils.getParameterByName('personFullName');
                var orgName = utils.getParameterByName('orgName');
                var orgInn = utils.getParameterByName('orgInn');
                var orgId = utils.getParameterByName('orgId');
                var personId = utils.getParameterByName('personId');
                utils.showAjaxLoader();
                complaintServices.getComplaintReSubmitt({
                        declarant: declarant, personFullName: personFullName, orgName: orgName,
                        orgInn: orgInn, orgId: orgId, personId: personId
                    })
                    .then(function (data) {
                        $scope.pageInitAfterComplaintLoading(data);
                    });
            } else {
                $scope.commonPageInit($scope.complaint);
            }

            $scope.saveButtonDisabled = true;
            $scope.createFileByFableWarn = false;
            $scope.sendToCheckWarn = false;
            $scope.fillSignerWarn = false;

            $scope.$watch('saveButtonDisabled', function (newValue, oldValue) {
                if (newValue == false) {
                    $scope.createFileByFableWarn = false;
                }
            }, true);

            $scope.getEditTitle = function () {
                var result = '';
                var complaint = $scope.complaint;
                if (complaint.applicantType == 'PERSON') {
                    if (complaint.lastName) {
                        result += 'Заявитель:';
                        result += complaint.lastName ? ' ' + complaint.lastName : '';
                        result += complaint.name ? ' ' + complaint.name.charAt(0) + '.' : '';
                        result += complaint.middleName ? ' ' + complaint.middleName.charAt(0) + '.' : '';
                    }
                } else {
                    if (complaint.orgName) {
                        result += 'Заявитель: ' + complaint.orgName;
                    }
                }
                return result;
            };

            $scope.getStatus = function () {
                var result = '';
                var complaint = $scope.complaint;
                if (complaint.stage) {
                    result += 'Стадия: ' + $.grep($rootScope.dictionaries.stages, function (n, i) {
                            return n.value == complaint.stage;
                        })[0].label;
                }

                return result;
            };
            $scope.getRespExecutor = function () {
                var result = '';
                if ($scope.complaint.respExecutorFullName) {
                    result += "Отв. исполнитель: " + $scope.complaint.respExecutorFullName;
                }

                return result;
            };
            $scope.getController = function () {
                var result = '';
                if ($rootScope.app.owner == 'AMPP' && $scope.complaint.controllerFullName) {
                    result += "Контролер: " + $scope.complaint.controllerFullName;
                }

                return result;
            };
            $scope.getCoexecutorList = function () {
                var result = '';
                if ($scope.complaint.coexecutorFullNames) {
                    result += "Соисполнители: " + $scope.complaint.coexecutorFullNames;
                }

                return result;
            };

            $scope.pageInitAfterComplaintLoading = function (data) {
                $scope.complaint = data;
                $scope.guids = {};
                $scope.guids.locality = data.addressGuid;

                utils.hideAjaxLoader();

                $scope.saveButtonDisabled = true;

                if ($scope.isExternalComplaint()) {
                    $scope.deliveryTypes = $rootScope.dictionaries.externalDeliveryTypes;
                }

                $scope.$watch('complaint', function (newValue, oldValue) {
                    if (newValue !== oldValue) {
                        $scope.saveButtonDisabled = false;
                        $scope.compareAnswers(newValue, oldValue);
                    }
                }, true);

                $scope.compareAnswers = function (newValue, oldValue) {
                    if (newValue.answers.length != oldValue.answers.length) {
                        $scope.answersChanged = true;
                    } else {
                        for (var i in newValue.answers) {
                            if (newValue.answers[i].signerName != oldValue.answers[i].signerName) {
                                $scope.answersChanged = true;
                            }

                            if (typeof newValue.answers[i].attachments == 'undefined' || typeof oldValue.answers[i].attachments == 'undefined') {
                                $scope.answersChanged = true;
                                break;
                            }
                            if (newValue.answers[i].attachments.length != oldValue.answers[i].attachments.length) {
                                $scope.answersChanged = true;
                                break;
                            }
                        }
                    }
                };

                $scope.commonPageInit($scope.complaint);

                $scope.complaint.oldShiftControlDays = 0;

                var answers = $scope.complaint.answers;
                for (var i = 0; i < answers.length; i++) {
                    var answer = answers[i];

                    if(answer.responseKind == 'M' && answer.responseType == 'C' && $scope.complaint.checkingDate && answer.daysQuantity &&
                        answer.daysQuantity != "" && $scope.complaint.creationDate) {
                        $scope.complaint.oldShiftControlDays+= parseInt(answer.daysQuantity);
                    }
                }
                $scope.complaint.deliveryTypeName = $scope.getDeliveryTypeLabel($scope.complaint.deliveryType);
            };

            $scope.showInfoByFIO = function (fio) {
                utils.showAjaxLoader();
                complaintServices.getRelatedComplaintsByFIO(fio)
                    .then(
                        function (data) {
                            utils.hideAjaxLoader();
                            $scope.relatedComplaints = data;
                            $('#tabFineNumber').modal('show');
                        },
                        function () {
                            utils.hideAjaxLoader();
                            $scope.relatedComplaints = $scope.createResolutionErrorMesage(
                                "Ошибка на стороне сервера."
                            );
                        });
            };

            $scope.commonPageInit = function (complaint) {
                complaint.oldStage = complaint.stage;
                securityService.pageInit(complaint);

                var processingStages = $rootScope.dictionaries.PROCESSING_STAGE;
                // Определение этапа обработки обращения
                if (!complaint.stage) {
                    var procStage;
                    if (
                        securityService.canCreateRegularCategory(complaint)
                        && securityService.canCreateLegalCategory(complaint)
                    ) {
                        procStage = processingStages.CREATION_MIX_CYCLE;
                    } else if (securityService.canCreateLegalCategory(complaint)) {
                        procStage = processingStages.JUDICIAL_CYCLE;
                    } else {
                        procStage = processingStages.REGULAR_CYCLE;
                    }
                    $scope.processingStage = procStage;
                } else {
                    if (
                        complaint.complaintDetailsList
                        && (complaint.complaintDetailsList.length > 0)
                        && (complaint.complaintDetailsList[0].typeCode
                        == $rootScope.app.judicialAppealTypeCode)
                    ) {
                        $scope.processingStage = processingStages.JUDICIAL_CYCLE;
                    } else {
                        $scope.processingStage = processingStages.REGULAR_CYCLE;
                    }
                }
            };

            // Сброс обращения после проведенных операций с ними на сервере в то состояние, в
            // котором оно было до вызванных операций.
            $scope.resetClaimState = function (isFullReset) {
                if (isFullReset) {
                    $scope.complaint = $scope.oldComplaint;
                } else {
                    // Частичный сброс флагов
                    $scope.complaint.executorAssignedFlag = "";
                }
            };
            $scope.saveWithCommentDialogAction = function (dialogLnk, comment) {
                utils.showAjaxLoader();
                $scope.actionButtonDisabled = true;

                $scope.complaint.comment = comment;
                complaintServices.saveComplaint($scope.complaint)
                    .then(function (data) {
                        utils.hideAjaxLoader();
                        dialogLnk.dialog('close');
                        $scope.resetClaimState();
                        $scope.saveButtonDisabled = true;
                        if (data.claimNumber) {
                            var url = $rootScope.server.editClaimUrl + "?claimid=" + data.claimNumber + "&success=true&checkingDateExtendingWarning=" + data.checkingDateExtendingWarning + (data.checkRepeatedComplainsWarning ? ("&checkRepeatedComplainsWarning=" + data.checkRepeatedComplainsWarning):'');
                            utils.redirectToUrl(url);
                        } else {
                            $scope.actionButtonDisabled = false;
                        }
                    }, function (error) {
                        utils.hideAjaxLoader();
                        dialogLnk.dialog('close');

                        // Возвращаем состояние
                        $scope.actionButtonDisabled = false;
                        $scope.resetClaimState(true);

                        var errors = error.errors;
                        if (errors) {
                            $scope.complaintSaveServerError = true;
                            var result = "";
                            var isErrorShowing = true;
                            for (var i = 0; i < errors.length; ++i) {
                                if ('claim.save.not.actual.error' == errors[i].code) {
                                    // Случай неактуальности сохраняемой информации.
                                    var redirectDialog = $scope.getRedirectAdviceDialog();
                                    if (redirectDialog.dialog("isOpen")) {
                                        redirectDialog.dialog("close");
                                    }
                                    redirectDialog.dialog("open");
                                    result += "<div><p>";
                                    result += errors[i].defaultMessage;
                                    result += "</p></div>";
                                    isErrorShowing = false;
                                } else if ('claim.validation.required.sent.organization' == errors[i].code) {
                                    $scope.executiveSentDetailsListInvalid = true;
                                    var orgItem = errors[i].field.split("[");
                                    $scope.complaint[orgItem[0]][orgItem[1].substring(0, orgItem[1].length - 1)].$invalid = true;
                                    console.log("message");
                                } else if ('claim.validation.required.control.organization' == errors[i].code) {
                                    $scope.executiveOrgDetailsListInvalid = true;
                                    var orgItem = errors[i].field.split("[");
                                    $scope.complaint[orgItem[0]][orgItem[1].substring(0, orgItem[1].length - 1)].$invalid = true;
                                } else if ('claim.validation.answer.post.id' == errors[i].code) {
                                    result += "<div><p>";
                                    result += errors[i].defaultMessage;
                                    result += "</p></div>";
                                    var answerItem = errors[i].field.split("[");
                                    var answerField = answerItem[1].split("]")[0];
                                    $scope.complaint[answerItem[0]][answerField].$postTrackingNumberInvalid = true;
                                } else if('claim.validation.required.answer.pagesQuantity' == errors[i].code) {
                                    var answerItem = errors[i].field.split("[");
                                    var answerField = answerItem[1].split("]")[0];
                                    $scope.complaint[answerItem[0]][answerField].$invalid = true;
                                    $scope.requiredAnswerPagesQuantity = true ;
                                    //console.log($scope.complaint);
                                } else if('claim.validation.required.answer.deliveryMethod' == errors[i].code) {
                                    var answerItem = errors[i].field.split("[");
                                    var answerField = answerItem[1].split("]")[0];
                                    $scope.complaint[answerItem[0]][answerField].$invalid = true;
                                    $scope.requiredAnswerDeliveryMethod = true ;
                                } else if ('claim.validation.required.complaint.outgoing.signer' == errors[i].code
                                    ||'claim.validation.required.complaint.outgoing.signer.not.exists'==errors[i].code) {
                                    result += "<div><p>";
                                    result += errors[i].defaultMessage;
                                    result += "</p></div>";
                                } else {
                                    if (errors[i].defaultMessage) {
                                        result += "<div><p>";
                                        result += errors[i].defaultMessage;
                                        result += "</p></div>";
                                    }
                                    if (errors[i].field && $scope.complaintForm[errors[i].field] && $scope.complaintForm[errors[i].field].$setValidity ) {
                                        $scope.complaintForm[errors[i].field].$setValidity('invalid', false);
                                    }
                                }
                            }
                            $("#complaintSaveServerError").html(result);
                            if (isErrorShowing) {
                                $scope.showErrors();
                            }
                            $scope.err = error.err;
                        }
                    });
            };

            $scope.showErrors = function () {
                $('#tabsList li:first-child a').tab('show');
                $('html, body').animate({
                    scrollTop: 0
                }, 500);
            };

            $scope.saveComplaintCommonProcess = function (
                preSaveCallback, newStage, dialog, isValidationOff, isCommentRequired
            ) {
                if ($(".ui-dialog-content:visible").length > 0) {
                    // TODO: fix modal modevalidate
                    // Закрываем все открытые диалоги.
                    $(".ui-dialog-content:visible").each(function () {
                        $(this).dialog('close');
                    });
                }

                // Полное копирование объекта обращения
                $scope.oldComplaint = jQuery.extend(true, {}, $scope.complaint);
                if ($scope.complaint.number) {
                    utils.showAjaxLoader();
                    complaintServices.getComplaintHistory($scope.complaint.number)
                        .then(function (data) {
                            utils.hideAjaxLoader();
                            if ($scope.complaint.complaintHistory.length
                                >= data.complaintHistory.length
                            ) {
                                // Если в истории рассмотрения нет новых изменений, то обновляем
                                // историю данного обращения и вызываем его сохранение.
                                $scope.complaint.complaintHistory = data.complaintHistory;
                                $scope.complaint.userCommentNum = data.userCommentNum;

                                $scope.saveComplaintDialogCall(
                                    preSaveCallback, newStage, dialog, isValidationOff, isCommentRequired
                                );
                            } else {
                                // Если история рассмотрения обращения на странице устарела, то
                                // предлагаем вручную перенести изменения в обновленное обращение.
                                $scope.showRedirectAdviceDialog();
                            }
                        }, function (error) {
                            utils.hideAjaxLoader();
                            $scope.historyErrorHandler(error.errors);
                        });
                } else {
                    $scope.saveComplaintDialogCall(
                        preSaveCallback, newStage, dialog, isValidationOff, isCommentRequired
                    );
                }
            };

            $scope.saveComplaintDialogCall = function (
                preSaveCallback, newStage, dialog, isValidationOff, isCommentRequired
            ) {
                if (isValidationOff || (!isValidationOff && $scope.validate(newStage))) {
                    $scope.preSaveCallback = preSaveCallback;
                    if (dialog) {
                        dialog.dialog("open");
                    } else {
                        var dialogLnk = $scope.getCommentDialog();
                        dialogLnk.dialog("option", "isCommentRequired", isCommentRequired == true);
                        dialogLnk.dialog("open");
                    }
                } else {
                    $scope.showErrors();
                }
            };

            $scope.showRedirectAdviceDialog = function () {
                var redirectDialog = $scope.getRedirectAdviceDialog();
                if (redirectDialog.dialog("isOpen")) {
                    redirectDialog.dialog("close");
                }
                redirectDialog.dialog("open");
            };

            $scope.historyErrorHandler = function (errors) {
                if (errors) {
                    $scope.complaintSaveServerError = true;
                    $("#complaintSaveServerError").html("Произошла ошибка при получении данных.");
                    $scope.showErrors();
                }
            };

            // Обработчики основных действий c обращениями {
            $scope.saveComplaintAction = function () {
                $scope.saveComplaintCommonProcess(
                    function () {
                        $scope.complaint.action = 'Сохранение';
                    },
                    $scope.complaint.stage
                );
            };

            $scope.rejectComplaintAction = function () {
                $scope.saveComplaintCommonProcess(
                    function () {
                        $scope.complaint.action = 'Отклонено';
                    },
                    'STAT_REJECTED',
                    $scope.getRejectDialog(),
                    true
                );
            };

            $scope.backStageComplaintAction = function () {
                var newStage;
                switch ($scope.complaint.stage) {
                    case 'STAT_REGISTERED':
                    case 'STAT_MOVED_TO_EXECUTOR':
                        newStage = 'STAT_RETURNED_TO_REGISTRATOR';
                        break;
                    case 'STAT_RESPONSE_PREPARED':
                        newStage = 'STAT_MOVED_TO_EXECUTOR';
                        break;
                }

                $scope.saveComplaintCommonProcess(
                    function () {
                        if ('STAT_RETURNED_TO_REGISTRATOR' == newStage) {
                            // сброс всех исполнителей не РИПов
                            var execList = [];
                            for (var execInd in $scope.complaint.executorList) {
                                var exec = $scope.complaint.executorList[execInd];
                                if (exec.responsible) {
                                    execList.push(exec);
                                }
                            }
                            $scope.complaint.executorList = execList;
                        }
                        $scope.complaint.stage = newStage;
                        $scope.complaint.action = 'Переход на другую стадию';
                    },
                    newStage,
                    null,
                    false,
                    true
                );
            };

            $scope.execAssignComplaintAction = function () {
                $scope.saveComplaintCommonProcess(
                    function () {
                        $scope.complaint.action = 'Назначение исполнителя';
                        $scope.complaint.executorAssignedFlag = "Y";
                    },
                    $scope.complaint.stage,
                    $scope.getExecAssignClaimDialog({stage:$scope.complaint.stage})
                );
            };

            $scope.goNextStageComplaintAction = function () {
                if (
                    (
                        !$scope.complaint.stage
                        && !securityService.canCreateLegalCategory($scope.complaint) // не Исп.Юр.У
                        && securityService.canAssignResponsibleExecutor($scope.complaint) // не РИ
                        && !($rootScope.app.owner == 'AMPP' &&
                        (securityService.isOfficer() || securityService.isServiceEmployee() || securityService.isClrcEmployee()))
                    )
                    || ('STAT_PREPARED' == $scope.complaint.stage)
                    || ('STAT_REGISTERED' == $scope.complaint.stage)
                    || ($rootScope.app.owner == 'AMPP' && 'STAT_MOVED_TO_EXECUTOR' == $scope.complaint.stage)

                ) {
                    // Переход на следующую стадию через диалог назначения
                    var newStage;
                    if ('STAT_REGISTERED' == $scope.complaint.stage) {
                        newStage = 'STAT_MOVED_TO_EXECUTOR';
                    } else if ($rootScope.app.owner == 'AMPP' && 'STAT_MOVED_TO_EXECUTOR' == $scope.complaint.stage){
                        newStage = 'STAT_RESPONSE_PREPARED';
                    } else {
                        newStage = 'STAT_REGISTERED';
                    }

                    $scope.saveComplaintCommonProcess(
                        function () {
                            $scope.complaint.stage = newStage;
                            $scope.complaint.action = 'Переход на другую стадию';
                        },
                        newStage,
                        $scope.getExecAssignClaimDialog({stage:newStage})
                    );
                } else {
                    // Переход на следующую стадию через стандартный диалог
                    var newStage;
                    switch ($scope.complaint.stage) {
                        case null:
                            if (
                                ($scope.complaint.complaintDetailsList.length == 1)
                                && (
                                    $scope.complaint.complaintDetailsList[0].typeCode
                                    == $rootScope.app.judicialAppealTypeCode
                                )
                            ) {
                                // Регистрация обжалования в суде
                                newStage = 'STAT_REGISTERED';
                            } else {
                                // Регистрация обращения сотрудником с ролью РИ
                                newStage = 'STAT_PREPARED';
                            }
                            break;
                        case 'STAT_RETURNED_TO_REGISTRATOR':
                            newStage = 'STAT_REGISTERED';
                            break;
                        case 'STAT_MOVED_TO_EXECUTOR':
                            newStage = 'STAT_RESPONSE_PREPARED';
                            break;
                        case 'STAT_RESPONSE_PREPARED':
                            newStage = 'STAT_SENT';
                            break;
                        case 'STAT_MOVED_TO_LEGAL_EXECUTOR':
                            newStage = 'STAT_SENT';
                            break;
                    }

                    $scope.saveComplaintCommonProcess(
                        function () {
                            $scope.complaint.stage = newStage;
                            $scope.complaint.action = 'Переход на другую стадию';
                        },
                        newStage
                    );
                }
            };

            $scope.isAMPP = function() {
                return $rootScope.app.owner == "AMPP";
            };

            // } Обработчики основных действий c обращениями

            // Конфигурация диалогов при основных действиях c обращениями {
            $scope.getCommentDialog = function () {
                if (!$scope.commentDialog) {
                    $scope.commentDialog = $rootScope.createCommentClaimDialog({
                        commentCallback: function (dialogLnk, comment) {
                            if ($scope.preSaveCallback) {
                                $scope.preSaveCallback();
                            }
                            $scope.saveWithCommentDialogAction(dialogLnk, comment);
                        }
                    });
                }
                return $scope.commentDialog;
            };

            $scope.getRedirectAdviceDialog = function () {
                if (!$scope.redirectAdviceDialog) {
                    $scope.redirectAdviceDialog = $rootScope.createRedirectAdviceDialog({
                        linkText: $scope.complaint.number,
                        linkUrl: $rootScope.server.editClaimUrl + "?claimid=" + $scope.complaint.number
                    });
                }
                return $scope.redirectAdviceDialog;
            };

            $scope.getRejectDialog = function () {
                if (!$scope.rejectDialog) {
                    $scope.rejectDialog = $rootScope.createRejectDialog({
                        rejectCallback: function (dialogLnk, comment) {
                            $scope.complaint.stage = 'STAT_REJECTED';
                            $scope.saveWithCommentDialogAction(dialogLnk, comment);
                        }
                    });
                }
                return $scope.rejectDialog;
            };

            $scope.getSendToCheckDialog = function (config) {
                if (!$scope.sendToCheckDialog) {
                    $scope.sendToCheckDialog = $rootScope.createSendToCheckDialog(config);
                }
                return $scope.sendToCheckDialog;
            };

            $scope.getRejectInfoDialog = function () {
                if (!$scope.rejectInfoDialog) {
                    $scope.rejectInfoDialog = $rootScope.createRejectInfoDialog();
                }
                return $scope.rejectInfoDialog;
            };

            $scope.getSignInfoDialog = function () {
                if (!$scope.signInfoDialog) {
                    $scope.signInfoDialog = $rootScope.createSignInfoDialog();
                }
                return $scope.signInfoDialog;
            };

            $scope.getExecAssignClaimDialog = function (conf) {

                return $rootScope.createAssignClaimDialog({
                    openCallback: function (dialogLnk) {
                        var controllerMode = (function(){
                            var owner = $rootScope.app.owner ;
                            var stage = conf.stage ? conf.stage : $scope.complaint.stage;
                            return owner == 'AMPP' && stage == 'STAT_RESPONSE_PREPARED';
                        })();
                        var isCurator =
                            securityService.canAssignResponsibleExecutor($scope.complaint);
                        dialogLnk.dialog("option", "responsibleMode", isCurator);
                        dialogLnk.dialog("option", "controllerMode", controllerMode);
                        dialogLnk.dialog(
                            "option", "contextPath", complaintServices.getContextPath()
                        );

                        var selectedExecutors = [];
                        if (controllerMode) {
                            dialogLnk.dialog(
                                "option", "respExecutor", $scope.complaint.controllerFamily
                            );
                        } else {
                            for (var ind in $scope.complaint.executorList) {
                                var executor = $scope.complaint.executorList[ind];
                                selectedExecutors.push(executor.family);
                            }
                            dialogLnk.dialog(
                                "option", "respExecutor", $scope.complaint.respExecutorFamily
                            );
                        }
                        dialogLnk.dialog(
                            "option", "selectedExecutors", selectedExecutors
                        );
                    },
                    assignCallback: function (dialogLnk, assignEmplIds, comment, respAssignEmplId) {
                        if ($scope.preSaveCallback) {
                            $scope.preSaveCallback();
                        }

                        // Смена исполнителей на выбранных в диалоге.
                        if (respAssignEmplId) {
                            if ($rootScope.app.owner == 'AMPP' && 'STAT_RESPONSE_PREPARED' == $scope.complaint.stage){
                                $scope.complaint.controllerFamily = respAssignEmplId;
                            } else {
                                $scope.complaint.respExecutorFamily = respAssignEmplId;
                            }
                        }
                        var oldExecutorList = $scope.complaint.executorList;
                        var newExecutorList = [];
                        var isResponsibleMode = dialogLnk.dialog("option", "responsibleMode");
                        for (var ind in oldExecutorList) {
                            // Добавление текущих обычных соисполнителей в случае выбора РИПов
                            // или добавление текущих РИПов в случае выбора обычных соисполнителей
                            var oldExecutor = oldExecutorList[ind];
                            if (
                                (isResponsibleMode && !oldExecutor.responsible)
                                || (!isResponsibleMode && oldExecutor.responsible)
                            ) {
                                newExecutorList.push(oldExecutor);
                            }
                        }
                        for (var ind in assignEmplIds) {
                            // Добавление новых исполнителей
                            newExecutorList.push({
                                family: assignEmplIds[ind]
                            });
                        }
                        $scope.complaint.executorList = newExecutorList;

                        $scope.saveWithCommentDialogAction(dialogLnk, comment);
                    }
                });
            };
            // } Конфигурация диалогов при основных действиях c обращениями

            // Формирование диалога об удалении документа исходящего документа
            $scope.getDeleteRespFileDialog = function (index) {
                $scope.deleteRespFileDialog = $rootScope.createDeleteFromClaimDialog({
                    deleteCallback: function (dialogLnk) {
                        utils.showAjaxLoader();
                        var claimNumber = dialogLnk.dialog("option", "claimNumber");
                        var attachmentId = dialogLnk.dialog("option", "attachmentId");
                        var responseId = dialogLnk.dialog("option", "responseId");
                        var elem = (index || (0 == index)) ? $scope.complaint.answers[index] : null;
                        var answers = $scope.complaint.answers;
                        var attachs = $scope.complaint.attachments;

                        $scope.$apply(function () {
                            complaintServices.deleteAttach(claimNumber, attachmentId, responseId)
                                .then(function (data) {
                                    utils.hideAjaxLoader();
                                    // Удаление строчки в пакете прикрепленных документов в
                                    // рассматриваемом Исходящем документе
                                    if (elem) {
                                        angular.forEach(elem.attachments, function (value, key) {
                                            if (value.id == attachmentId) {
                                                elem.attachments.splice(key, 1);
                                            }
                                        });
                                    } else {
                                        angular.forEach(answers, function (elem, keyAnswer) {
                                            angular.forEach(elem.attachments, function (value, key) {
                                                if (value.id == attachmentId) {
                                                    elem.attachments.splice(key, 1);
                                                }
                                            });
                                        });
                                    }

                                    // Обеспечение синхронизации с вкладкой "Доп. материалы"
                                    angular.forEach(attachs, function (value, key) {
                                        if (value.id == attachmentId) {
                                            attachs.splice(key, 1);
                                        }
                                    });
                                }, function () {
                                    utils.hideAjaxLoader();
                                    alert('Произошла ошибка при удалении вложения.');
                                });
                        });
                        dialogLnk.dialog('close');
                    },
                    deleteMessage: 'Вы уверены, что хотите удалить прикрепленный файл?'
                });
                return $scope.deleteRespFileDialog;
            };

            //Информация о постановлении
            $scope.relatedComplaints = {};
            $scope.resolutionData = {};
            $scope.showInfo = function (resolutionNumber) {
                utils.showAjaxLoader();
                complaintServices.getRelatedComplaints(resolutionNumber, $scope.complaint.number)
                    .then(
                        function (data) {
                            $scope.relatedComplaints = data;
                            $scope.getResolutionInfo(resolutionNumber);
                        },
                        function () {
                            $scope.relatedComplaints = $scope.createResolutionErrorMesage(
                                "Ошибка на стороне сервера."
                            );
                            $scope.getResolutionInfo(resolutionNumber);
                        });
            };
            $scope.getResolutionInfo = function (resolutionNumber) {
                complaintServices.getResolutionInfo(resolutionNumber)
                    .then(
                        function (data) {
                            utils.hideAjaxLoader();
                            if (data.urlToCard) {
                                $scope.resolutionData = {
                                    'urlToCard': data.urlToCard,
                                    'number': resolutionNumber
                                };
                            } else {
                                $scope.resolutionData = $scope.createResolutionErrorMesage(
                                    "Дело с указанным номером постановления в модуле "
                                    + "\"Административная практика\" не найдено."
                                );
                            }
                            $('#tabFineNumber').modal('show');
                        }, function () {
                            utils.hideAjaxLoader();
                            $scope.resolutionData = $scope.createResolutionErrorMesage(
                                "Ошибка на стороне сервера."
                            );
                            $('#tabFineNumber').modal('show');
                        });
            };
            $scope.createResolutionErrorMesage = function (errorMessage) {
                return {
                    'error': true,
                    'errorMessage': errorMessage
                };
            };

            $scope.changeResolutionNumber = function (changedThema) {
                changedThema.$invalidResNumUnique = false;
                $scope.validateResolutionNumber();
            };

            $scope.validateResolutionNumber = function () {
                var resolutionNumberPattern = /(^782\d{17}$)|(^77[А-Яа-я]{2}\d{7}$)/;
                var themesDetails = $scope.complaint.complaintDetailsList;
                $scope.complaintDetailsListInvalid = false;
                for (var i = 0; i < themesDetails.length; ++i) {
                    var resolutionNumber = themesDetails[i].resolutionNumber;
                    var isValid = (
                        ((themesDetails[i].typeCode != $rootScope.app.caseComplaintTypeCode) && !resolutionNumber)
                        || (resolutionNumber && resolutionNumberPattern.test(resolutionNumber))
                    );
                    themesDetails[i].$invalidResNum = !isValid;
                    if (!isValid) {
                        $scope.complaintDetailsListInvalid = true;
                    }
                }
            };
            $scope.validate = function (newStage) {
                // Очистка формы от прошлых валидационных ошибок.
                angular.element('#complaintSaveSuccess').hide();
                $scope.complaintSaveServerError = false;
                utils.formValidationReset($scope.complaintForm);
                $scope.validateResolutionNumber();
                $scope.complaintForm.deliveryType.$setValidity('invalid', $scope.complaint.deliveryType >= 1);
                $scope.complaintForm.lastName.$setValidity('invalid', $scope.complaint.applicantType != 'PERSON' || $scope.complaint.lastName);
                $scope.complaintForm.name.$setValidity('invalid', $scope.complaint.applicantType != 'PERSON' || $scope.complaint.name);
                $scope.complaintForm.orgName.$setValidity('invalid', $scope.complaint.applicantType != 'ORGANIZATION' || $scope.complaint.orgName);
                $scope.complaintForm.inn.$setValidity('invalid', $scope.complaint.applicantType != 'ORGANIZATION' || !$scope.complaint.inn || (/^\d{10}$/.test($scope.complaint.inn)));
                $scope.complaintForm.kpp.$setValidity('invalid', $scope.complaint.applicantType != 'ORGANIZATION' || !$scope.complaint.kpp || (/^\d{9}$/.test($scope.complaint.kpp)));
                $scope.complaintForm.zipCode.$setValidity('invalid', !$scope.complaint.zipCode || (/^\d{6}$/.test($scope.complaint.zipCode)));
                $scope.complaintForm.email.$setValidity('invalid', !$scope.complaint.email || (/(^[_A-Za-zА-ЯЁа-яё0-9\-;~!$&'\(\)\*\,\=\:\+]+(\.[_A-Za-zА-ЯЁа-яё0-9\-;~!$&'\(\)\*\,\=\:]+)*@[A-Za-zА-ЯЁа-яё0-9\-]+(\.[A-Za-zА-ЯЁа-яё0-9\-]+)*(\.[A-Za-zА-ЯЁа-яё0-9]{2,6}))$/.test($scope.complaint.email)));
                $scope.creationDateInvalid = (
                    $scope.complaint.editMode
                    && ('STAT_PREPARED' != $scope.complaint.stage)
                    && ('STAT_REJECTED' != $scope.complaint.stage)
                    && !$scope.complaint.creationDate
                );
                $scope.responseDateInvalid = $scope.complaint.editMode && $scope.complaint.stage == 'STAT_SENT' && !$scope.complaint.responseDate;


//                var noOneSet = !$scope.complaint.sentOrganizationName && !$scope.complaint.sentOrganizationOutNumber && !$scope.complaint.sentOrganizationOutDate;
//                var allAreSet = $scope.complaint.sentOrganizationName && $scope.complaint.sentOrganizationOutNumber && $scope.complaint.sentOrganizationOutDate;
//                $scope.complaintForm.sentOrganizationName.$setValidity('invalid', noOneSet || allAreSet);
//                $scope.complaintForm.sentOrganizationOutNumber.$setValidity('invalid', noOneSet || allAreSet);
//                $scope.complaintForm.sentOrganizationOutDate.$setValidity('invalid', noOneSet || allAreSet);
                {
                    var sentExecutiveOrgs = $scope.complaint.sentOrgDetailsList;
                    $scope.sentExecutiveOrgDetailsListInvalid = false;
                    for( var i = 0 ; i < sentExecutiveOrgs.length; ++i){
                        var noOneSet = !sentExecutiveOrgs[i].orgName && !sentExecutiveOrgs[i].requestNumber && !sentExecutiveOrgs[i].requestDate ;
                        var allAreSet = sentExecutiveOrgs[i].orgName && sentExecutiveOrgs[i].requestNumber && sentExecutiveOrgs[i].requestDate ;
                        sentExecutiveOrgs[i].$invalid = !(!!noOneSet ^ !!allAreSet);
                        if (!(!!noOneSet ^ !!allAreSet)) {
                            $scope.sentExecutiveOrgDetailsListInvalid = true;
                        }
                    }
                }
                var executiveOrgs = $scope.complaint.executiveOrgDetailsList;
                $scope.executiveOrgDetailsListInvalid = false;
                for (var i = 0; i < executiveOrgs.length; ++i) {
                    var noOneSet = !executiveOrgs[i].orgName && !executiveOrgs[i].requestNumber && !executiveOrgs[i].requestDate && !executiveOrgs[i].checkingDate;
                    var allAreSet = executiveOrgs[i].orgName && executiveOrgs[i].requestNumber && executiveOrgs[i].requestDate && executiveOrgs[i].checkingDate;
                    executiveOrgs[i].$invalid = !(!!noOneSet ^ !!allAreSet);
                    if (!(!!noOneSet ^ !!allAreSet)) {
                        $scope.executiveOrgDetailsListInvalid = true;
                    }
                }

                // Проверка корректности заполнения тем.
                var complaintDetailsList = $scope.complaint.complaintDetailsList;
                var isPreFinalStage = (
                    (newStage == 'STAT_RESPONSE_PREPARED') || (newStage == 'STAT_SENT')
                );
                var isThemeAdded = complaintDetailsList.length > 0;
                $scope.complaintDetailsListEmpty = !isThemeAdded;
                $scope.complaintDetailsReasonEmpty = false;
                $scope.complaintDetailsVerdictEmpty = false;
                $scope.complaintDetailsVerdictDateEmpty = false;
                $scope.complaintDetailsResolutionNumNotUnique = false;
                $scope.answersExtendingAvailableDateEmpty = false;
                var themaLastInd = -1;
                var resolutionNumSet = {};
                for (var i = 0; i < complaintDetailsList.length; ++i) {
                    // Проверка корректности заполнения жалоб.
                    if (complaintDetailsList[i].typeCode == $rootScope.app.caseComplaintTypeCode) {
                        // Запрещено создавать в обращении несколько тем с категориями
                        // “Жалоба на постановление” и одинаковыми номерами постановления.
                        complaintDetailsList[i].$invalidResNumUnique = false;
                        var resolutionNumber = complaintDetailsList[i].resolutionNumber;
                        if (resolutionNumber && (resolutionNumber in resolutionNumSet)) {
                            $scope.complaintDetailsResolutionNumNotUnique = true;
                            complaintDetailsList[i].$invalidResNumUnique = true;
                            themaLastInd = i;
                        }
                        resolutionNumSet[resolutionNumber] = i;
                    }

                    // Проверка заполнения решений и дат принятий решений.
                    complaintDetailsList[i].$invalidVerdictCode = false;
                    complaintDetailsList[i].$invalidVerdictDate = false;
                    complaintDetailsList[i].$invalidReason = false;
                    if (isPreFinalStage) {
                        // Дополнительные проверки на заключительных стадиях.
                        // Решение должно быть указано для всех тем
                        var verdictCode = complaintDetailsList[i].verdictCode;
                        var isNotSelected = !verdictCode;
                        complaintDetailsList[i].$invalidVerdictCode = isNotSelected;
                        $scope.complaintDetailsVerdictEmpty =
                            $scope.complaintDetailsVerdictEmpty || isNotSelected;
                        themaLastInd = isNotSelected ? i : themaLastInd;

                        if (
                            (complaintDetailsList[i].typeCode == $rootScope.app.caseComplaintTypeCode)
                            || (complaintDetailsList[i].typeCode == $rootScope.app.finePaymentTypeCode)
                        ) {
                            // Причина должна быть указана обязательно.
                            isNotSelected = !complaintDetailsList[i].reasonCode;
                            complaintDetailsList[i].$invalidReason = isNotSelected;
                            $scope.complaintDetailsReasonEmpty =
                                $scope.complaintDetailsReasonEmpty || isNotSelected;
                            themaLastInd = isNotSelected ? i : themaLastInd;
                        }

                        // Для специфических решений дата принятия решений обязательна
                        if (
                            (
                                (complaintDetailsList[i].typeCode == $rootScope.app.caseComplaintTypeCode)
                                || (complaintDetailsList[i].typeCode == $rootScope.app.judicialAppealTypeCode)
                            )
                            && (
                                (verdictCode == 1) // Постановление отменено, прекращено производство по делу
                                || (verdictCode == 2) // Постановление отменено, дело возвращено на новое рассмотрение
                                || (verdictCode == 8) // Постановление оставлено без изменения, жалоба не удовлетворена
                                || (verdictCode == 24) // Внесены изменения в постановление
                            )
                        ) {
                            isNotSelected = !complaintDetailsList[i].verdictDate;
                            complaintDetailsList[i].$invalidVerdictDate = isNotSelected;
                            $scope.complaintDetailsVerdictDateEmpty =
                                $scope.complaintDetailsVerdictDateEmpty || isNotSelected;
                            themaLastInd = isNotSelected ? i : themaLastInd;
                        }
                    }
                }
                if ((themaLastInd >= 0) && !angular.element('#docsTableRow' + themaLastInd).is(':visible')) {
                    $timeout(
                        function() {
                            angular.element('#themesTableId tr:eq(' + (2 * themaLastInd + 1) + ')').trigger('click');
                        },
                        100
                    );
                }

                // Проверка валидности дней переноса срока контроля
                $scope.answersDaysQuantityOverdue = false;
                if($scope.complaint.checkingDate && $scope.complaint.creationDate) {
                    var checkingDate = moment($scope.complaint.checkingDate, "DD.MM.YYYY");
                    var creationDate = moment($scope.complaint.creationDate, "DD.MM.YYYY");
                    var answers = $scope.complaint.answers;

                    var daysShift = 0;

                    for (var i = 0; i < answers.length; i++) {
                        var answer = answers[i];

                        if(answer.responseKind == 'M' && answer.responseType == 'C' &&
                            answer.daysQuantity && answer.daysQuantity != "") {
                            daysShift += parseInt(answer.daysQuantity);
                        }
                    }

                    $scope.answersDaysQuantityOverdue =
                        (checkingDate.add(daysShift - ($scope.complaint.oldShiftControlDays ? $scope.complaint.oldShiftControlDays : 0), 'days').isAfter(
                            creationDate.add($rootScope.checkingDateExtendingSummInterval, 'days')
                        ));
                }

                $scope.answersExtendingAvailableDateEmpty = $scope.answersDaysQuantityOverdue;

                // Проверка корректности заполнения исходящих документов
                // при переводе обращения в стадии «Исполнено» или «Подготовлен ответ»
                // и при редактировании в стадии «Подготовлен ответ»
                $scope.responseForApplicantAbsent = false;
                $scope.responseForApplicantInvalid = false;
                $scope.finalResponseAttachAbsent = false;
                $scope.answersResponseDateEmpty = false;
                $scope.requiredAnswerPagesQuantity = false ;
                var isTransferToSent = (
                    ('STAT_RESPONSE_PREPARED' == $scope.complaint.stage)
                    && ('STAT_SENT' == newStage)
                );
                var isPreparedStageUpdate = (
                    ('STAT_RESPONSE_PREPARED' == $scope.complaint.stage)
                    && ('STAT_RESPONSE_PREPARED' == newStage)
                );
                if (
                    isTransferToSent
                    || ('STAT_RESPONSE_PREPARED' == $scope.complaint.stage)
                    || ('STAT_RESPONSE_PREPARED' == newStage)
                ) {
                    var answers = $scope.complaint.answers;
                    var isAllResponseDateEmpty = true;
                    var isAppResponseDateEmpty = false;
                    var isAppResponseNumEmpty = false;
                    var isApplicantExists = false;
                    var isFinalResponseAttachAbsent = false;
                    var isFinalResponseAbsent = true;
                    var isPagesQuantityAbsent = false;
                    var isDeliveryMethodAbsent = false;
                    for (var i = 0; i < answers.length; i++) {
                        var answer = answers[i];
                        if (answer.addresseeName == $rootScope.app.claimApplicant) {
                            // Рассматриваем только исходящие документы Заявителя
                            isAppResponseNumEmpty = isAppResponseNumEmpty || (!answer.responseNumber);
                            isAppResponseDateEmpty = isAppResponseDateEmpty || (!answer.responseDate);
                            isPagesQuantityAbsent = isPagesQuantityAbsent || (!answer.pagesQuantity);
                            isDeliveryMethodAbsent = isDeliveryMethodAbsent || (!answer.deliveryMethod);
                            isApplicantExists = true;
                        }
                        isAllResponseDateEmpty = isAllResponseDateEmpty && (!answer.responseDate);
                        if (answer.responseType == $rootScope.app.finalResponseType) {
                            isFinalResponseAbsent = false;
                            isFinalResponseAttachAbsent = (
                                isFinalResponseAttachAbsent
                                || (!answer.attachments)
                                || (answer.attachments.length == 0)
                            );
                        }
                    }
                    // проверка наличия исходящего документа с видом Окончательный ответ
                    $scope.responseForApplicantAbsent = isFinalResponseAbsent;
                    if (!isPreparedStageUpdate) {
                        // проверка прикрепления файла к Заявителю с видом Окончательный ответ
                        // в случае перевода в новую стадию
                        $scope.finalResponseAttachAbsent = isFinalResponseAttachAbsent;
                    }
                    if (isTransferToSent) {
                        // проверка заполнения обязательных полей перед отправкой
                        $scope.responseForApplicantInvalid = isAppResponseNumEmpty || isAppResponseDateEmpty || isPagesQuantityAbsent || isDeliveryMethodAbsent;
                        $scope.answersResponseDateEmpty = !isApplicantExists && isAllResponseDateEmpty;
                    }
                }

                return $scope.complaintForm.$valid
                    && !$scope.executiveOrgDetailsListInvalid
                    && !$scope.sentExecutiveOrgDetailsListInvalid
                    && isThemeAdded
                    && !$scope.complaintDetailsReasonEmpty
                    && !$scope.complaintDetailsVerdictEmpty
                    && !$scope.complaintDetailsVerdictDateEmpty
                    && !$scope.complaintDetailsResolutionNumNotUnique
                    && !$scope.creationDateInvalid
                    && !$scope.responseDateInvalid
                    && !$scope.responseForApplicantAbsent
                    && !$scope.responseForApplicantInvalid
                    && !$scope.answersResponseDateEmpty
                    && !$scope.answersDaysQuantityOverdue
                    && !$scope.finalResponseAttachAbsent;
            };

            $scope.enableCreationDateEditMode = function () {
                if (
                    ('STAT_PREPARED' != $scope.complaint.stage)
                    && ('STAT_REJECTED' != $scope.complaint.stage)
                    && securityService.canEnableEditModeForCreationDate($scope.complaint)
                ) {
                    $scope.creationDateEditMode = true;
                }
            };

            $scope.enableClosingDateEditMode = function () {
                if (securityService.canEnableEditModeForClosingDate($scope.complaint)) {
                    $scope.closingDateEditMode = true;
                }
            };

            $scope.isCheckingDateOverdue = function () {
                if ($scope.complaint.stage == 'STAT_SENT') {
                    return $scope.complaint.checkingDate && $scope.complaint.responseDate
                        && moment($scope.complaint.checkingDate, "DD.MM.YYYY").isBefore(moment($scope.complaint.responseDate, "DD.MM.YYYY"));
                } else {
                    return $scope.complaint.checkingDate
                        && moment($scope.complaint.checkingDate, "DD.MM.YYYY").isBefore(moment().hour(0).minute(0).second(0).millisecond(0));
                }
            };

            //методы для работы с фабулами
            $scope.createFileByFable = function (caseNumber, responseId, caseId, resolutionNumber, fableGroup, needSign) {
                $scope.fableGroup = fableGroup;
                $scope.fableDocument = fableGroup.documents[0];
                $scope.fableDocumentId = fableGroup.documents[0].id;

                $scope.prepareFablesRequest = {};
                $scope.prepareFablesRequest.responseId = responseId;
                $scope.prepareFablesRequest.caseId = caseId;
                $scope.prepareFablesRequest.claimNumber = $scope.complaint.number;
                $scope.prepareFablesRequest.caseNumber = caseNumber;
                $scope.prepareFablesRequest.resolutionNumber = resolutionNumber;
                $scope.prepareFablesRequest.needSign = needSign;

                var continueCallback = $scope.goToFableSecondStep;
                var lastStep = false;

                if (fableGroup.documents[0].groupId == $rootScope.app.fableTemplateGroupUniversal) {
                    continueCallback = $scope.getUniversalFableFile;
                    lastStep = true;
                }

                $scope.getFableFirstStepDialog(lastStep, continueCallback).dialog('open');
            };

            $scope.getFableFirstStepDialog = function (lastStep, continueCallback) {
                $scope.fableFirstStepDialog = $rootScope.createFableFirstStepDialog({
                    closeCallback: $scope.exit,
                    continueCallback: continueCallback,
                    lastStep: lastStep
                });
                return $scope.fableFirstStepDialog;
            };

            $scope.exit = function (dialogLnk) {
                $scope.getExitDialog(dialogLnk).dialog('open');
                return false;
            };

            $scope.getExitDialog = function (dialogLnk) {
                $scope.exitDialog = $rootScope.createExitDialog({
                    closeDialog: dialogLnk,
                    exitMessage: 'Вы уверены, что хотите выйти?<br/>Все изменения и файлы будут потеряны.'
                });
                return $scope.exitDialog;
            };

            $scope.goToFableSecondStep = function (dialogLnk) {
                $scope.createFileError = false;
                $scope.resolutionDataNotFound = null;
                $scope.prepareFablesRequest.documentTemplateId = $scope.fableDocumentId;
                complaintServices.getPreparedSections($scope.prepareFablesRequest)
                    .then(function (data) {
                        var sections = data.preparedFableSections;
                        for (var i in sections) {
                            sections[i].selectedSectionId = sections[i].fableSections[0].id;
                            sections[i].selectedSection = sections[i].fableSections[0];
                            sections[i].selectedSection.verdictLabel = $scope.getVerdictLabel(sections[i].selectedSection.requestVerdictCode);
                        }
                        $scope.preparedSections = sections;

                        $scope.processFableRequest = {};
                        $scope.processFableRequest.responseId = $scope.prepareFablesRequest.responseId;
                        $scope.processFableRequest.resolutionNumber = $scope.prepareFablesRequest.resolutionNumber;
                        $scope.processFableRequest.requestId = data.requestId;
                        $scope.processFableRequest.caseId = $scope.prepareFablesRequest.caseId;
                        $scope.processFableRequest.documentTemplateId = $scope.fableDocumentId;
                        $scope.processFableRequest.needSign = $scope.prepareFablesRequest.needSign;
                        dialogLnk.dialog('close');
                        $scope.getFableSecondStepDialog().dialog('open');
                        if ($scope.preparedSections && $scope.preparedSections.length > 0) {
                            $timeout(function () {
                                $scope.selectSectionItem(0, null);
                            });
                        }
                    }, function (error) {
                        if (error && error.message) {
                            $scope.resolutionDataNotFound = error.message;
                            dialogLnk.dialog('close');
                        }
                    });

                return false;
            };

            $scope.getFableSecondStepDialog = function () {
                $scope.fableSecondStepDialog = $rootScope.createFableSecondStepDialog({
                    closeCallback: $scope.exit,
                    getFileCallback: $scope.getFile
                });
                return $scope.fableSecondStepDialog;
            };

            $scope.getVerdictLabel = function (key) {
                var verdicts = $.grep($rootScope.dictionaries.typeVerdictMap, function (n, i) {
                    return n.description == key;
                });
                if (verdicts && verdicts.length > 0) {
                    return verdicts[0].comment;
                } else {
                    return "";
                }
            };

            $scope.downloadTemplate = function (templateId) {
                complaintServices.downloadTemplate(templateId);
            };

            $scope.getUniversalFableFile = function () {
                $scope.createFileError = false;
                $scope.processFableRequest = {};
                $scope.processFableRequest.responseId = $scope.prepareFablesRequest.responseId;
                $scope.processFableRequest.claimNumber = $scope.complaint.number;
                $scope.processFableRequest.documentTemplateId = $scope.fableDocumentId;

                complaintServices.getFableFile($scope.processFableRequest)
                    .then(function (data) {
                        complaintServices.downloadTemplate(data.id);
                    }, function () {
                        $scope.createFileError = true;
                    });
            };

            $scope.getFile = function (dialogLnk) {
                $scope.createFileError = false;

                var sections = [];
                for (var i in $scope.preparedSections) {
                    sections[sections.length] = $scope.preparedSections[i].selectedSection;
                }
                $scope.processFableRequest.fableSections = sections;
                var fileId = null;
                complaintServices.getFableFile($scope.processFableRequest)
                    .then(function (data) {
                        complaintServices.downloadTemplate(data.id);
                    }, function () {
                        $scope.createFileError = true;
                    });
            };

            $scope.changeFableDocument = function () {
                $scope.fableDocument = $.grep($scope.fableGroup.documents, function (n, i) {
                    return n.id == $scope.fableDocumentId;
                })[0];
            };

            $scope.moveDown = function (index) {
                var toIndex = index == $scope.preparedSections.length - 1 ? 0 : index + 1;
                $scope.swapSections(index, toIndex);
            };

            $scope.moveUp = function (index) {
                var toIndex = index == 0 ? $scope.preparedSections.length - 1 : index - 1;
                $scope.swapSections(index, toIndex);
            };

            $scope.swapSections = function (fromIndex, toIndex) {
                var section = $scope.preparedSections[fromIndex];
                $scope.preparedSections[fromIndex] = $scope.preparedSections[toIndex];
                $scope.preparedSections[toIndex] = section;
                if ($scope.selectedSectionIndex == fromIndex) {
                    $scope.selectedSectionIndex = toIndex;
                } else if ($scope.selectedSectionIndex == toIndex) {
                    $scope.selectedSectionIndex = fromIndex;
                }
            };

            $scope.changeFableSection = function (index) {
                var preparedSection = $scope.preparedSections[index];
                preparedSection.selectedSection = $.grep(preparedSection.fableSections, function (n, i) {
                    return n.id == preparedSection.selectedSectionId;
                })[0];
                preparedSection.selectedSection.verdictLabel = $scope.getVerdictLabel(preparedSection.selectedSection.requestVerdictCode);
            };

            $scope.selectSectionItem = function ($index, event) {
                if (event && ($(event.target).is("select") || $(event.target).is("input"))) return;

                //                if ($scope.fableList == null) {
                //                    complaintServices.getSuggestedFables($scope.$parent.complaint.number)
                //                        .then(function (fableList) {
                //                            $scope.fableList = fableList;
                //                        });
                //                }

                var animationDuration = 500;
                if (jQuery('#detailsSectionRow' + $scope.selectedSectionIndex).length > 0) {
                    if ($scope.selectedSectionIndex == $index) {
                        jQuery('#detailsSectionRow' + $index).slideToggle(animationDuration);
                        $scope.selectedSectionIndex = -1;
                        return;
                    } else {
                        jQuery('#detailsSectionRow' + $scope.selectedSectionIndex).slideUp(animationDuration, function () {
                            jQuery('#detailsSectionRow' + $index).slideDown(animationDuration);
                        });
                    }
                } else {
                    jQuery('#detailsSectionRow' + $index).slideDown(animationDuration);
                }
                $scope.selectedSectionIndex = $index;
            };

            $scope.removeSection = function (index) {
                $scope.getDeleteSectionDialog(index).dialog('open');
                return false;
            };

            $scope.removeSectionAfterDialog = function (dialogLnk, index) {
                $scope.$apply(function () {
                    $scope.preparedSections.splice(index, 1);
                });
                dialogLnk.dialog('close');
            };

            $scope.getDeleteSectionDialog = function (index) {
                $scope.deleteDialog = $rootScope.createDeleteFromClaimDialog({
                    deleteCallback: function (dialogLnk) {
                        $scope.removeSectionAfterDialog(dialogLnk, index);
                    },
                    deleteMessage: 'Вы уверены, что хотите удалить тему?<br/>Все изменения и файлы будут потеряны.'
                });
                return $scope.deleteDialog;
            };

            $scope.changeDeliveryType = function(newDeliveryType){
                $scope.complaint.deliveryType = newDeliveryType.value;
                $scope.complaint.deliveryTypeName = newDeliveryType.label;
            };
            $scope.getDeliveryTypeLabel = function (key) {
                var deliveryTypes = $.grep($rootScope.dictionaries.deliveryTypes, function (n, i) {
                    return n.value == key;
                });
                if (deliveryTypes && deliveryTypes.length > 0) {
                    return deliveryTypes[0].label;
                } else {
                    return "";
                }
            };
            $scope.changeDeliveryTypeLabel = function(deliveryTypeName){

            };
            $scope.hasNewDeliveryType = function(deliveryTypeName){
                if (!deliveryTypeName || deliveryTypeName.length == 0){
                    return false;
                }
                var deliveryTypes = $.grep($rootScope.dictionaries.deliveryTypes, function (n, i) {
                    var text = (n.label && n.label.toUpperCase ? n.label : "");
                    return (text.toUpperCase()) == (deliveryTypeName.toUpperCase());
                });
                return (!deliveryTypes || deliveryTypes.length == 0);
            };

            $scope.addDeliveryType = function(deliveryTypeName){
                complaintServices.addRequestDeliveryType(deliveryTypeName, function(data){
                    var dType = {label:data.description, status: data.status, value: data.code};
                    $scope.dictionaries.deliveryTypes.push(dType);
                    $scope.changeDeliveryType(dType);
                })
            };

            $scope.deleteDeliveryType = function(deliveryTypeCode){
                complaintServices.deleteRequestDeliveryType(deliveryTypeCode, function(){
                    var pos = null;
                    for (var i= 0; i < $scope.dictionaries.deliveryTypes.length; i++){
                        if ($scope.dictionaries.deliveryTypes[i].value == deliveryTypeCode){
                            pos = i;
                            break;
                        }
                    }
                    if (pos) {
                        $scope.dictionaries.deliveryTypes.splice(i,1);
                        if (deliveryTypeCode == $scope.complaint.deliveryType){
                            $scope.changeDeliveryType($scope.dictionaries.deliveryTypes[0]);
                        }
                    }

                })
            };
        }
    ])./**
 * Created by User on 12.04.2016.
 */
controller('fromOrgTableController',
    [
        '$rootScope', '$scope', 'utils',
        function ($rootScope, $scope, utils) {
            $scope.selectedIndex = -1;
            $scope.deleteDialog = null;
            $scope.removeItem = function (index) {
                $scope.getDeleteDialog(index).dialog('open');
            };
            $scope.removeAfterDialog = function (dialogLnk, index) {
                $scope.$apply(function () {
                    $scope.$parent.complaint.sentOrgDetailsList.splice(index, 1);
                });
                dialogLnk.dialog('close');

            };
            $scope.selectItem = function ($index) {
                $scope.selectedIndex = $index;
            };
            $scope.addNewRow = function () {
                $scope.$parent.complaint.sentOrgDetailsList.push({});
                $scope.selectItem($scope.$parent.complaint.sentOrgDetailsList.length - 1);
            };
            $scope.getDeleteDialog = function (index) {

                $scope.deleteDialog = $rootScope.createDeleteFromClaimDialog({
                    deleteCallback: function (dialogLnk) {
                        $scope.removeAfterDialog(dialogLnk, index);
                    },
                    deleteMessage: 'Вы уверены, что хотите удалить организацию?'
                });
                return $scope.deleteDialog;
            };
        }
    ])
./**
 * Created by User on 12.04.2016.
 */
controller('orgTableController',
    [
        '$rootScope', '$scope', 'utils',
        function ($rootScope, $scope, utils) {
            $scope.selectedIndex = -1;
            $scope.deleteDialog = null;
            $scope.removeItem = function (index) {
                $scope.getDeleteDialog(index).dialog('open');
            };
            $scope.removeAfterDialog = function (dialogLnk, index) {
                $scope.$apply(function () {
                    $scope.$parent.complaint.executiveOrgDetailsList.splice(index, 1);
                });
                dialogLnk.dialog('close');

            };
            $scope.selectItem = function ($index) {
                $scope.selectedIndex = $index;
            };
            $scope.addNewRow = function () {
                $scope.$parent.complaint.executiveOrgDetailsList.push({});
                $scope.selectItem($scope.$parent.complaint.executiveOrgDetailsList.length - 1);
            };
            $scope.getDeleteDialog = function (index) {

                $scope.deleteDialog = $rootScope.createDeleteFromClaimDialog({
                    deleteCallback: function (dialogLnk) {
                        $scope.removeAfterDialog(dialogLnk, index);
                    },
                    deleteMessage: 'Вы уверены, что хотите удалить контролирующую организацию?'
                });
                return $scope.deleteDialog;
            };
        }
    ])
./**
 * Created by User on 12.04.2016.
 */
controller('themesTableController',
    [
        '$rootScope', '$scope', 'utils', 'complaintServices', 'securityService', '$timeout',
        function ($rootScope, $scope, utils, complaintServices, securityService, $timeout) {
            $scope.selectedIndex = -1;
            $scope.deleteDialog = null;
            $scope.verdict = {};
            $scope.fableFirstStepDialog = null;
            $scope.selectNotifyDialog = null;
            $scope.$watch(function () {
                return !$scope.$parent.complaint.email
            }, function (expr) {
                $scope.expectedEmailInComplaintShow = expr;
            });

            $scope.showSelectNotifyDialogButton = function (data) {
                return data.presenceDate && data.presenceTime;
            };
            $scope.not_in = owner=="MADI" ? 'Постановление вынесено не в МАДИ.':'Постановление вынесено не в АМПП.';

            $scope.removeItem = function (index) {
                $scope.getDeleteDialog(index).dialog('open');
                return false;
            };
            $scope.removeAfterDialog = function (dialogLnk, index) {
                $scope.$apply(function () {
                    $scope.$parent.complaint.complaintDetailsList.splice(index, 1);
                    $scope.validateResolutionNumber();
                    $scope.selectedIndex = -1;
                });
                dialogLnk.dialog('close');
            };


            $scope.updateValue = function (index) {
                var elem = $scope.$parent.complaint.complaintDetailsList[index];
                elem.typeDescription = $scope.getCategory(elem.typeCode);
                $scope.selectType(elem);
                $scope.validateResolutionNumber();
            };

            $scope.isTypeCodeDeleted = function (typeCode) {
                var type = $scope.getCategory(typeCode);
                return !(type && type.length > 0);
            };

            $scope.selectItem = function ($index, event) {
                if (event && ($(event.target).is("select") || $(event.target).is("input"))) return;
                var animationDuration = 500;
                if (jQuery('#docsTableRow' + $scope.selectedIndex).length > 0) {
                    if ($scope.selectedIndex == $index) {
                        jQuery('#docsTableRow' + $index).slideToggle(animationDuration);
                        $scope.selectedIndex = -1;
                        return;
                    } else {
                        jQuery('#docsTableRow' + $scope.selectedIndex).slideUp(animationDuration, function () {
                            jQuery('#docsTableRow' + $index).slideDown(animationDuration);
                        });
                    }
                } else {
                    jQuery('#docsTableRow' + $index).slideDown(animationDuration);
                }
                $scope.selectedIndex = $index;
            };

            $scope.createFileByFable = function (caseNumber, needSign) {
                $scope.$parent.complaintDetailsCreateFileByFableError = false;

                if (!$scope.saveButtonDisabled && !$scope.createFileByFableWarn) {
                    $scope.$parent.createFileByFableWarn = true;
                    $('html, body').animate({
                        scrollTop: $("#answersHeader").offset().top
                    }, 500);
                } else {
                    var selectedComplaintDetails = $scope.$parent.complaint.complaintDetailsList[$scope.selectedIndex];
                    if (!selectedComplaintDetails.reasonCode || !selectedComplaintDetails.verdictCode) {
                        $scope.createFileByFableErrorHandler('Не указаны решение и/или причина жалобы.');
                    } else {
                        complaintServices.getSuggestedVerdict($scope.$parent.complaint.number, selectedComplaintDetails.resolutionNumber)
                            .then(function (verdict) {
                                verdict.caseId = selectedComplaintDetails.caseId;
                                $scope.verdict = verdict;
                                if (!$scope.verdict.isMadiResolution) {
                                    $scope.createFileByFableErrorHandler($scope.not_in);
                                } else if (!$scope.verdict.hasDocumentTemplates) {
                                    $scope.createFileByFableErrorHandler('Фабула для документа не найдена.');
                                } else {
                                    $scope.$parent.createFileByFable(
                                        caseNumber,
                                        null,
                                        $scope.verdict.caseId,
                                        $scope.verdict.resolutionNumber,
                                        $scope.verdict,
                                        needSign
                                    );
                                }
                            });
                    }
                }
            };

            $scope.createFileByFableErrorHandler = function (errorText) {
                $scope.$parent.complaintDetailsCreateFileByFableError = true;
                var fableErrorDiv = angular.element("#complaintDetailsCreateFileByFableError");
                fableErrorDiv.html('<p>' + errorText + '</p>');
                $('html, body').animate({
                    scrollTop: fableErrorDiv.offset().top
                }, 500);
            };

            $scope.addNewRow = function () {
                $scope.$parent.validateResolutionNumber();
                var typeCode;

                if (
                    $rootScope.dictionaries.PROCESSING_STAGE.JUDICIAL_CYCLE.code
                    == $scope.$parent.processingStage.code
                ) {
                    // В случае обработки обращения в Юридическом цикле мы имеем ровно одну
                    // категорию, которую сразу выбираем по умолчанию
                    typeCode = parseInt($rootScope.app.judicialAppealTypeCode);
                } else {
                    typeCode = parseInt($rootScope.app.caseComplaintTypeCode);
                }

                $scope.$parent.complaint.complaintDetailsList.push({
                    verdictCode: 0,
                    verdictReasonCode: '',
                    reasonCode: 0,
                    typeCode: typeCode,
                    typeDescription: $scope.getCategory(typeCode.toString())
                });

                $timeout(function () {
                    $scope.selectItem($scope.$parent.complaint.complaintDetailsList.length - 1);
                }, 0);

            };
            $scope.selectType = function (selectedComplaintDetails) {
                selectedComplaintDetails.reasonCode = 0;
                selectedComplaintDetails.verdictActorId = '0';
                selectedComplaintDetails.verdictCode = 0;
                selectedComplaintDetails.verdictReasonCode = '';
                selectedComplaintDetails.verdictDate = '';
                selectedComplaintDetails.acting = false;
                selectedComplaintDetails.improperApplicant = false;
                selectedComplaintDetails.expired = false;
                selectedComplaintDetails.presence = false;
            };
            $scope.getCategory = function (key) {
                var el = $.grep($rootScope.dictionaries.categories, function (n, i) {
                    return n.value == key;
                });
                var retVal = (el && el.length > 0) ? el[0].label : "";
                return retVal ;
            };
            $scope.getSolutionsList = function (typeCode) {
                return $.grep($rootScope.dictionaries.typeVerdictMap, function (n, i) {
                    return n.code == typeCode;
                });
            };
            $scope.getVerdictActorList = function (theme) {
                var verdictActors = $scope.$parent.verdictActorList;
                if (theme.verdictActorId) {
                    // Если был выставлен сотрудник, которого уже нет в списке, то мы его добавляем
                    // в этот список для предотвращения потери информации.
                    var isContained = false;
                    for (var verdictActorInd in verdictActors) {
                        var verdictActor = verdictActors[verdictActorInd];
                        isContained = isContained || (verdictActor.value == theme.verdictActorId);
                    }
                    if (!isContained) {
                        var act = [{
                            value: theme.verdictActorId,
                            label: (theme.verdictActorName)
                        }];
                        verdictActors = (act.concat(verdictActors)).sort(
                            function(a, b) { return (a.label > b.label) ? 1 : -1; }
                        );
                    }
                }

                return verdictActors;
            };
            $scope.getCategoryList = function (index) {
                var isLegalThemeShouldBe = false;
                var isReguarThemeShouldBe = false;
                var processingStages = $rootScope.dictionaries.PROCESSING_STAGE;
                switch ($scope.$parent.processingStage.code) {
                    case processingStages.CREATION_MIX_CYCLE.code:
                        // При создании обращения в совмещенных режимах в списке присутсвуют все
                        // обычные категории, судебная категория присутствует для выбора первой и
                        // единственной темы
                        isReguarThemeShouldBe = true;
                        isLegalThemeShouldBe = (
                            $scope.$parent.complaint.complaintDetailsList.length == 1
                        );
                        break;
                    case processingStages.JUDICIAL_CYCLE.code:
                        // При судебном цикле обработки в списке категорий только одна:
                        // “Обжалование постановления в суде”.
                        isReguarThemeShouldBe = false;
                        isLegalThemeShouldBe = true;
                        break;
                    case processingStages.REGULAR_CYCLE.code:
                        // При обычном цикле обработки обращения судебная должна отсутствовать
                        isReguarThemeShouldBe = true;
                        isLegalThemeShouldBe = false;
                        break;
                }

                var categories = [];
                // TODO fdv Move to global constants
                var PETITION_TERM_TRANSFER = 26 ;
                for (var categoryInd in $scope.$parent.categories) {
                    var category = $scope.$parent.categories[categoryInd];
                    if(true) {
                        var petitionTermTransferSelected = false ;
                        for( var i = 0 ; i < $scope.$parent.complaint.complaintDetailsList.length ; i++){
                            if( $scope.$parent.complaint.complaintDetailsList[i].typeCode == PETITION_TERM_TRANSFER && i != index ) {
                                petitionTermTransferSelected  = true;
                            }
                        }
                        if(category.value == PETITION_TERM_TRANSFER && petitionTermTransferSelected) {
                            continue ;
                        }
                    }
                    if (category.value == $rootScope.app.judicialAppealTypeCode) {
                        if (isLegalThemeShouldBe) {
                            categories.push(category);
                        }
                    } else {
                        if (isReguarThemeShouldBe) {
                            categories.push(category);
                        }
                    }
                }
                return categories;
            };
            $scope.getDeleteDialog = function (index) {
                $scope.deleteDialog = $rootScope.createDeleteFromClaimDialog({
                    deleteCallback: function (dialogLnk) {
                        $scope.removeAfterDialog(dialogLnk, index);
                    },
                    deleteMessage: 'Вы уверены, что хотите удалить тему обращения?'
                });
                return $scope.deleteDialog;
            };
            $scope.getSelectNotifyDialog = function () {
                var config = {
                    onConfirm: function () {
                        if (!$scope.$parent.selectedAttachmentIdForNotification) {
                            return false;
                        }
                        complaintServices.sendNotification({
                            email: $scope.$parent.complaint.email
                            , attachmentId: $scope.$parent.selectedAttachmentIdForNotification
                            , requestId: $scope.$parent.complaint.requestId
                            , number: $scope.$parent.complaint.number
                        }, function () {
                            $scope.$parent.operationSuccessMessageShow = true;
                            $scope.$parent.operationSuccessMessage = "Уведомление успешно отправлено";
                            $('html, body').animate({
                                scrollTop: $("#operationSuccessMessage").offset().top
                            }, 500);
                            return true;
                        }, function(errorMessage) {
                            $scope.$parent.operationFailMessageShow = true;
                            $scope.$parent.operationFailMessage = "При отправке уведомления произошла ошибка";
                            $('html, body').animate({
                                scrollTop: $("#operationFailMessage").offset().top
                            }, 500);
                            console.log("OperationFailMessage: ", errorMessage);
                            return true;
                        });
                        return true;
                    }
                };
                $scope.selectNotifyDialog = $rootScope.createSelectNotifyDialog(config);
                $scope.selectNotifyDialog.dialog('open');
                return true;

            } ;

            $scope.isExternalResolutionNumber = function (resolutionNumber) {
                var resolutionNumberPattern = /(^780\d{17}$)|(^188\d{17}$)|(^77[А-Яа-я]{2}\d{7}$)/;
                var exceptResolutionNumberPattern = /^77[Фф][Ээ]\d{7}$/;
                if (organizationName == "AMPP"){
                    resolutionNumberPattern = /(^782\d{17}$)|(^188\d{17}$)|(^77[А-Яа-я]{2}\d{7}$)/;
                    exceptResolutionNumberPattern = /^77[Фф][Яя]\d{7}$/;
                }
                return resolutionNumber && resolutionNumberPattern.test(resolutionNumber) && !exceptResolutionNumberPattern.test(resolutionNumber);
            };
            $scope.isIncorrectResolutionNumber = function (resolutionNumber) {
                var correctResolutionNumberPattern = /(^782\d{17}$)|(^77[Фф][Ээ]\d{7}$)/;
                if (organizationName == "AMPP"){
                    correctResolutionNumberPattern = /(^780\d{17}$)|(^77[Фф][Яя]\d{7}$)/;
                }

                return resolutionNumber && !correctResolutionNumberPattern.test(resolutionNumber) && !$scope.isExternalResolutionNumber(resolutionNumber);
            };
            $scope.getReasons = function (typeCode) {
                return $.grep($rootScope.dictionaries.reasonMap, function (n, i) {
                    return n.code == typeCode;
                });
            };

            $scope.changePresence = function (detail) {
                if (!detail.presence) {
                    detail.presenceDate = null;
                    detail.presenceTime = null;
                }
            };

            //$scope.changePresenceDateTime = function(data){
            //    console.log(data);
            //    var visibility = data.presenceDate.length > 0 && data.presenceTime.length > 0 ;
            //    //$scope.showSelectNotifyDialogButton = visibility;
            //}
        }
    ])

./**
 * Created by User on 12.04.2016.
 */
controller('docsTableController',
    [
        '$rootScope', '$scope', 'utils', '$timeout', 'complaintServices', 'securityService',
        function ($rootScope, $scope, utils, $timeout, complaintServices, securityService) {
            $scope.selectedIndex = -1;
            $scope.selectedSectionIndex = -1;
            $scope.deleteDialog = null;
            $scope.exitDialog = null;
            $scope.fableFirstStepDialog = null;
            $scope.fableSecondStepDialog = null;
            //$scope.fableList = null;
            $scope.fableGroup = null;
            $scope.coveringLetter = null;
            $scope.universalFable = null;
            $scope.noticeFable = null;
            $scope.officememoFable = null;
            $scope.fableDocument = null;
            $scope.fableDocumentId = null;
            $scope.preparedSections = [];
            $scope.requestId = null;
            $scope.responseId = null;
            $scope.createFileError = false;
            $scope.curators = $rootScope.curators;

            $scope.hasPresence = function () {
                return $scope.$parent.complaint.complaintDetailsList.filter(function (d) {
                        return d.presence
                    }).length != 0;
            };

            $scope.selectItem = function ($index, event) {
                if (event && ($(event.target).is("select") || $(event.target).is("input"))) return;

                if ($scope.$parent.complaint.number) {
                    complaintServices.getSuggestedFables(
                        $scope.$parent.complaint.number,
                        $rootScope.app.fableTemplateGroupCoveringLetter
                    ).then(
                        function (fable) {
                            $scope.coveringLetter = fable;
                        }
                    );
                    complaintServices.getSuggestedFables(
                        $scope.$parent.complaint.number,
                        $rootScope.app.fableTemplateGroupUniversal
                    ).then(
                        function (fable) {
                            $scope.universalFable = fable;
                        }
                    );
                    complaintServices.getSuggestedFables(
                        $scope.$parent.complaint.number,
                        $rootScope.app.fableTemplateGroupNotice
                    ).then(
                        function (fable) {
                            $scope.noticeFable = fable;
                        }
                    );
                    complaintServices.getSuggestedFables(
                        $scope.$parent.complaint.number,
                        $rootScope.app.fableTemplateGroupOfficeMemo
                    ).then(
                        function (fable) {
                            $scope.officememoFable = fable;
                        }
                    );
                    complaintServices.getSuggestedFables(
                        $scope.$parent.complaint.number,
                        $rootScope.app.fableTemplateGroupRerouting
                    ).then(
                        function (fable) {
                            $scope.reroutingFable = fable;
                        }
                    );
                }

                var animationDuration = 500;
                if (jQuery('#answersTableRow' + $scope.selectedIndex).length > 0) {
                    if ($scope.selectedIndex == $index) {
                        jQuery('#answersTableRow' + $index).slideToggle(animationDuration);
                        $scope.selectedIndex = -1;
                        return;
                    } else {
                        jQuery('#answersTableRow' + $scope.selectedIndex).slideUp(animationDuration, function () {
                            jQuery('#answersTableRow' + $index).slideDown(animationDuration);
                        });
                    }
                } else {
                    jQuery('#answersTableRow' + $index).slideDown(animationDuration);
                }
                $scope.selectedIndex = $index;
            };

            $scope.createFileByFable = function (responseId, groupId) {
                if (!$scope.saveButtonDisabled && !$scope.createFileByFableWarn) {
                    $scope.$parent.createFileByFableWarn = true;
                    $('html, body').animate({
                        scrollTop: $("#answersHeader").offset().top
                    }, 500);
                } else {
                    var fableGroup;

                    switch(groupId) {
                        case $rootScope.app.fableTemplateGroupCoveringLetter:
                            fableGroup = $scope.coveringLetter;
                            break;
                        case $rootScope.app.fableTemplateGroupOfficeMemo:
                            fableGroup = $scope.officememoFable;
                            break;
                        case $rootScope.app.fableTemplateGroupNotice:
                            fableGroup = $scope.noticeFable;
                            break;
                        case $rootScope.app.fableTemplateGroupRerouting:
                            fableGroup = $scope.reroutingFable;
                            break;
                        default:
                            fableGroup = $scope.universalFable;
                            break;
                    }

                    if (!fableGroup || !fableGroup.hasDocumentTemplates) {
                        $scope.$parent.answersCreateFileByFableError = true;
                        var fableErrorDiv = angular.element("#answersCreateFileByFableError");
                        fableErrorDiv.html('<p>Фабула для документа не найдена.</p>');
                        $('html, body').animate({
                            scrollTop: fableErrorDiv.offset().top
                        }, 500);
                    } else {
                        $scope.$parent.createFileByFable(
                            null,
                            responseId,
                            null,
                            null,
                            fableGroup
                        );
                    }
                }
            };

            $scope.isOrg = function (answer) {
                return answer.isOrg;
            };

            $scope.addNewRow = function () {
                $scope.$parent.complaint.answers.push({isOrg: true});
                $scope.selectItem($scope.$parent.complaint.answers.length - 1, 0);
            };

            $scope.addNewRowForApplicant = function () {
                $scope.$parent.complaint.answers.push({
                    isOrg: false,
                    addresseeCode: 1,
                    addresseeName: $rootScope.app.claimApplicant,
                    responseNumber: $scope.getResponseNumber(),
                    postTrackingNumber: $rootScope.app.madiPostOfficeNumber
                });

                $scope.selectItem($scope.$parent.complaint.answers.length - 1, 0);

            };

            $scope.getResponseNumber = function () {
                if ($rootScope.app.organizationName == 'AMPP'){
                    return $scope.getResponseNumberForAmpp();
                }
                var result = $scope.$parent.complaint.number;
                if (result && result.indexOf('/') != -1) {
                    result = result.substr(0, result.lastIndexOf('/')) + '/06' + result.substr(result.lastIndexOf('/'));
                } else if (result) {
                    var currentYear = (new Date()).getFullYear().toString();
                    result += '/06/' + currentYear.charAt(currentYear.length - 1);
                }

                return result;
            };

            $scope.getResponseNumberForAmpp = function () {
                var result = $scope.$parent.complaint.number;
                var num = (1 + $("#answersTable").find("tr.ng-scope").length / 2);
                var n = (num>9) ? ""+num : "0"+num;
                return result + "/" + n;
            };



            $scope.isAnswerPostEnabled = function (answer) {
                var result = false;
                for (var categoryInd in $scope.$parent.complaint.complaintDetailsList) {
                    var category = $scope.$parent.complaint.complaintDetailsList[categoryInd];
                    if (category.typeCode == $rootScope.app.caseComplaintTypeCode
                        && $.inArray('' + category.verdictCode, $rootScope.app.postTrackingNumSolutionCodes) > -1
                    ) {
                        // Есть хотя бы одна тема с категорией «Жалоба на постановление» и одним из решений: «Постановление оставлено в силе» или «Внесено изменение в постановление».
                        result = true;
                        break;
                    }
                }
                result &= (answer.addresseeName == $rootScope.app.claimApplicant);

                return result;
            };

            $scope.removeItemCompletely = function (index) {
                $scope.getDeletetemCompletelyDialog(index).dialog('open');
                return false;
            };
            $scope.removeItemCompletelyAfterDialog = function (dialogLnk, index) {
                $scope.$apply(function () {
                    var answer = $scope.$parent.complaint.answers[index];
                    $scope.$parent.complaint.answers.splice(index, 1);

                    // Обеспечение синхронизации с вкладкой "Доп. материалы"
                    var attachs = $scope.complaint.attachments;
                    angular.forEach(attachs, function (value, key) {
                        if (value.responseId == answer.id) {
                            attachs.splice(key, 1);
                        }
                    });

                });
                dialogLnk.dialog('close');
            };
            $scope.getDeletetemCompletelyDialog = function (index) {
                var elem = $scope.$parent.complaint.answers[index];
                var message = 'Вы уверены, что хотите удалить исходящий документ? ';
                message += (
                    (elem.attachments && elem.attachments.length > 0)
                        ? 'Документ будет удален вместе с прикрепленными файлами'
                        : ''
                );

                $scope.deleteItemCompletelyDialog = $rootScope.createDeleteFromClaimDialog({
                    deleteCallback: function (dialogLnk) {
                        $scope.removeItemCompletelyAfterDialog(dialogLnk, index);
                    },
                    deleteMessage: message
                });
                return $scope.deleteItemCompletelyDialog;
            };

            $scope.isCheckingDateExtendingAvailable = function () {
                containsComplaintCaseTheme = false;
                containsNotProccessedOfficeMemochecking = false;

                if ($scope.$parent.complaint.complaintDetailsList != null) {
                    for (var i = 0; i < $scope.$parent.complaint.complaintDetailsList.length; i++) {
                        if ($scope.$parent.complaint.complaintDetailsList[i].typeCode == $rootScope.app.caseComplaintTypeCode) {
                            containsComplaintCaseTheme = true;
                            break;
                        }
                    }
                }

                if ($scope.$parent.complaint.answers != null) {
                    for (var i = 0; i < $scope.$parent.complaint.answers.length; i++) {
                        if ($scope.$parent.complaint.answers[i].responseKind == $rootScope.app.checkingDateExtendingResponseKind &&
                            (!$scope.$parent.complaint.answers[i].responseDate || $scope.$parent.complaint.answers[i].responseDate == "")
                        ) {
                            containsNotProccessedOfficeMemochecking = true;
                            break;
                        }
                    }
                }

                var checkingDateNotOverdue = moment($scope.$parent.complaint.checkingDate, "DD.MM.YYYY")
                    .isBefore(moment($scope.$parent.complaint.creationDate, "DD.MM.YYYY").add($rootScope.checkingDateExtendingSummInterval, 'days'));

                return securityService.canEditSendDocs($scope.$parent.complaint) &&
                    !securityService.isOfficer() &&
                    $scope.$parent.complaint.checkingDate != null &&
                    !containsComplaintCaseTheme &&
                    !containsNotProccessedOfficeMemochecking &&
                    checkingDateNotOverdue;
            };

            $scope.downloadRespFile = function (claimNumber, attachmentId, responseId) {
                complaintServices.downloadAttach(claimNumber, attachmentId, responseId);
            };

            $scope.previews = ["png", "jpg", "jpeg", "bmp", "gif", "pdf"];
            $scope.canPreview = function (attach) {
                for (var k in $scope.previews) {
                    if (attach.name.toLowerCase().indexOf($scope.previews[k])!=-1){
                        attach.type = $scope.previews[k];
                        return true;
                    }
                }
                return false;
            };

            $scope.previewFile = function (claimNumber, attachmentId, type) {
                var url = complaintServices.previewAttach(claimNumber, attachmentId);
                if (type == "pdf") {
                    $.fancybox({href: url, type: 'iframe', minWidth:900, minHeight:700});
                } else {
                    $.fancybox({href: url, type: 'image'});
                }
            };

            $scope.addRespFile = function (responseId) {
                if (responseId) {
                    $("#claimRespAttachFile" + responseId).click();
                } else {
                    $("#uploadRespAttachError").text($("#answersWarn").text());
                    $scope.$parent.uploadRespAttachError = true;
                    $('html, body').animate({
                        scrollTop: $("#uploadRespAttachError").offset().top
                    }, 500);
                }
            };
            $scope.deleteRespFile = function (index, attachmentId, responseId) {
                var dialogLnk = $scope.$parent.getDeleteRespFileDialog(index);
                dialogLnk.dialog("option", "claimNumber", $scope.complaint.number);
                dialogLnk.dialog("option", "attachmentId", attachmentId);
                dialogLnk.dialog("option", "responseId", responseId);
                dialogLnk.dialog('open');
            };
            $scope.addRespFileCallback = function (file) {
                if (!$scope.$parent.complaint.attachments) {
                    $scope.$parent.complaint.attachments = [];
                }

                $scope.$parent.complaint.attachments.push(file);
            };

            $scope.addNewRowForCheckingDateExtending = function () {
                $scope.$parent.complaint.answers.push({
                    addresseeCode: $rootScope.app.applicantAddresseeCode,
                    addresseeName: $rootScope.app.claimApplicant,
                    responseNumber: $scope.getResponseNumber(),
                    responseType: $rootScope.app.checkingDateExtendingResponseType,
                    postTrackingNumber: $rootScope.app.madiPostOfficeNumber
                });

                $scope.selectItem($scope.$parent.complaint.answers.length - 1, 0);

                if ($scope.$parent.complaint.executiveOrgDetailsList != null) {
                    for (var i = 0; i < $scope.$parent.complaint.executiveOrgDetailsList.length; i++) {
                        $scope.$parent.complaint.answers.push({
                            addresseeCode: $rootScope.app.orgAddresseeCode,
                            addresseeName: $scope.$parent.complaint.executiveOrgDetailsList[i].orgName,
                            responseNumber: $scope.getResponseNumber(),
                            responseType: $rootScope.app.checkingDateExtendingResponseType
                        });
                    }
                }

                $scope.$parent.complaint.answers.push({
                    addresseeCode: $rootScope.app.applicantAddresseeCode,
                    addresseeName: $rootScope.officeMemoChecking,
                    responseNumber: $scope.getResponseNumber(),
                    responseType: $rootScope.app.checkingDateExtendingResponseType,
                    postTrackingNumber: $rootScope.app.madiPostOfficeNumber,
                    responseKind: $rootScope.app.checkingDateExtendingResponseKind
                });
            };

            $scope.filesToCheck = [];
            $scope.needCheck = false;
            $scope.curator = null;

            $scope.hasSelected = function () {
                for (f in $scope.filesToCheck) {
                    if ($scope.filesToCheck[f].checked) return true;
                }
                return false;
            };

            $scope.hideError = function () {
                $scope.needCheck = false;
            };

            $scope.prepareToCheck = function (data) {
                $scope.$parent.fillSignerWarn = false;
                if ($scope.answersChanged) {
                    $scope.$parent.sendToCheckWarn = true;
                    $('html, body').animate({
                        scrollTop: $("#answersHeader").offset().top
                    }, 500);
                } else {
                    if (typeof data.signerName == 'undefined' || data.signerName == null ||data.signerName == "") {
                        $scope.$parent.fillSignerWarn = true;
                        $('html, body').animate({
                            scrollTop: $("#answersHeader").offset().top
                        }, 500);
                        return;
                    }
                    $scope.currentResponse = data;
                    $scope.needCheck = false;
                    $scope.filesToCheck = $.map(data.attachments, function (a) {
                        if (a.name.indexOf(".docx")!=-1) {
                            return {fileName: a.name, fileId: a.id, responseId: a.responseId};
                        }
                    });
                    $scope.sendToCheckDialog = $scope.getSendToCheckDialog({
                        okCallback: function () {
                            if ($scope.curator == null) {
                                return;
                            }
                            if (!$scope.hasSelected()) {
                                $scope.needCheck = true;
                                $scope.$apply();
                            } else {
                                $scope.sendToCheck($scope.currentResponse);
                            }
                        }
                    });
                    $scope.sendToCheckDialog.dialog("open");
                }
            };

            $scope.hasDocx = function (data) {
                for (var a in data.attachments) {
                    if (data.attachments[a].name.indexOf(".docx") != -1) {
                        return true;
                    }
                }
                return false;
            };

            $scope.sendToCheck = function (response) {
                var documents = $.grep($scope.filesToCheck, function (f) {
                    return f.checked;
                });
                var request = {curator: $scope.curator, documents: documents};
                complaintServices.sendToCheck(request).then(function (data){
                    $scope.sendToCheckDialog.dialog("close");
                    response.status = data.status;
                    angular.copy($scope.curator, response.curator);
                    var files = $.map(data.documents, function (d){
                        return d.fileId;
                    });

                    angular.forEach(response.attachments, function (a){
                        if (files.indexOf(a.id)!=-1) {
                            a.toSign = true;
                        }
                    });

                    angular.forEach($scope.complaint.attachments, function (a){
                        if (files.indexOf(a.id)!=-1) {
                            a.toSign = true;
                        }
                    });
                });
            };

            $scope.isChecking = function (data) {
                return data.status == $rootScope.dictionaries.responseStatuses.SENT_TO_CHECK;
            };

            $scope.isSigning = function (data) {
                return data.status == $rootScope.dictionaries.responseStatuses.SENT_TO_SIGN;
            };

            $scope.isSigned = function (data) {
                return data.status == $rootScope.dictionaries.responseStatuses.SIGNED;
            };

            $scope.isReject = function (data) {
                return data.status == $rootScope.dictionaries.responseStatuses.REJECT;
            };

            $scope.isNoStatus = function (data) {
                return data.status == null || data.status == "";
            };

            $scope.rejectComment = null;
            $scope.showRejectInfo = function (data) {
                $scope.rejectComment = data.rejectComment;
                $scope.getRejectInfoDialog().dialog("open");
            };

            $scope.signInfo = null;
            $scope.x2js = new X2JS();
            $scope.showSignInfo = function (data) {
                $scope.signInfo = $scope.x2js.xml_str2json(data.signedData).responseForSign;
                var date = new Date($scope.signInfo.date);
                $scope.signInfo.date  = dateFormat(date, "dd.mm.yyyy");
                $("#showdXml")
                    .attr("href",  'data:text/xml;charset=utf-8,' + encodeURIComponent(data.signedData))
                    .attr("target", "_blank");
                $("#downloadXml")
                    .attr("href",  'data:text/plain;charset=utf-8,' + encodeURIComponent(data.signedData))
                    .attr("download",  data.responseNumber+'.xml');
                $scope.getSignInfoDialog().dialog("open");
            };
        }
    ])

./**
 * Created by User on 12.04.2016.
 */
controller('historyTableController',
    [
        '$rootScope', '$scope', 'utils',
        function ($rootScope, $scope, utils) {
            $scope.selectedIndex = -1;
            $scope.selectItem = function ($index) {
                $scope.selectedIndex = $index;
            };
        }
    ])
./**
 * Created by User on 12.04.2016.
 */
controller('filesController',
    [
        '$rootScope', '$scope', '$interval', 'utils', 'complaintServices', 'securityService',
        function ($rootScope, $scope, $interval, utils, complaintServices, securityService) {
            $scope.errorMessage = "";
            $scope.successMessage = "";
            $scope.disableScanButton = false;

            var scan;
            var taskId;
            $scope.scanAttachment = function () {
                $scope.successMessage = "";
                $scope.errorMessage = "";
                $scope.disableScanButton = true;
                utils.showAjaxLoader();
                complaintServices.startScan($scope.$parent.complaint.number)
                    .then(function (data) {
                        if (data.success) {
                            taskId = data.taskId;
                            scan = $interval($scope.checkScanState, $rootScope.app.scanApplicationDelay);
                        } else {
                            utils.hideAjaxLoader();
                            $scope.errorMessage = data.message;
                            $scope.disableScanButton = false;
                        }
                    }, function (error) {
                        utils.hideAjaxLoader();
                        $scope.errorMessage = "Произошла ошибка. Проверьте, что приложение, выполняющее сканирование запущено.";
                        $scope.disableScanButton = false;
                    });


            };

            $scope.checkScanState = function () {
                complaintServices.getScanState(taskId)
                    .then(function (data) {
                        if (data.success) {
                            if (data.status.toUpperCase() == "SUCCESS") {
                                $interval.cancel(scan);
                                $scope.complaint.attachments.push(data.fileInfo);
                                $scope.successMessage = "Сканирование успешно выполнено.";
                                $scope.errorMessage = "";
                                $scope.disableScanButton = false;
                                utils.hideAjaxLoader();

                            } else if (data.status.toUpperCase() == "FAILURE") {
                                $interval.cancel(scan);
                                utils.hideAjaxLoader();
                                $scope.errorMessage = "Произошла ошибка в процессе сканирования. Попробуйте ещё раз.";
                                $scope.disableScanButton = false;
                            }
                        } else {
                            $interval.cancel(scan);
                            utils.hideAjaxLoader();
                            $scope.errorMessage = data.message;
                            $scope.disableScanButton = false;
                        }

                    }, function (error) {
                        $interval.cancel(scan);
                        utils.hideAjaxLoader();
                        $scope.errorMessage = "Произошла ошибка. Проверьте, что приложение, выполняющее сканирование запущено.";
                        $scope.disableScanButton = false;

                    });
            };

            $scope.addFile = function () {
                $("#claimAttachmentFile").click();
            };
            $scope.downloadFile = function (claimNumber, attachmentId) {
                complaintServices.downloadAttach(claimNumber, attachmentId);
            };

            $scope.previewFile = function (claimNumber, attachmentId, type) {
                var url = complaintServices.previewAttach(claimNumber, attachmentId);
                if (type == "pdf") {
                    $.fancybox({href: url, type: 'iframe', minWidth:900, minHeight:700});
                } else {
                    $.fancybox({href: url, type: 'image'});
                }
            };
            $scope.downloadRespFile = function (claimNumber, attachmentId, responseId) {
                complaintServices.downloadAttach(claimNumber, attachmentId, responseId);
            };
            $scope.hasAttachments = function() {
                return $scope.complaint.attachments.length > 0;
            };
            $scope.getAttachmentsAsZip = function() {
                complaintServices.downloadAttachmentsAsZip($scope.complaint.number);
            };

            $scope.deleteRespFile = function (index, attachmentId, responseId) {
                var dialogLnk = $scope.$parent.getDeleteRespFileDialog(index);
                dialogLnk.dialog("option", "claimNumber", $scope.complaint.number);
                dialogLnk.dialog("option", "attachmentId", attachmentId);
                dialogLnk.dialog("option", "responseId", responseId);
                dialogLnk.dialog('open');
            };

            $scope.deleteDialog = null;
            $scope.getDeleteDialog = function () {
                $scope.deleteDialog = $rootScope.createDeleteFromClaimDialog({
                    deleteCallback: function (dialogLnk) {
                        utils.showAjaxLoader();
                        var claimNumber = dialogLnk.dialog("option", "claimNumber");
                        var attachmentId = dialogLnk.dialog("option", "attachmentId");

                        $scope.$apply(function () {
                            complaintServices.deleteAttach(claimNumber, attachmentId)
                                .then(function (data) {
                                    utils.hideAjaxLoader();
                                    angular.forEach($scope.complaint.attachments, function (value, key) {
                                        if (value.id == attachmentId) {
                                            $scope.complaint.attachments.splice(key, 1);
                                        }
                                    });
                                }, function () {
                                    utils.hideAjaxLoader();
                                    alert('Произошла ошибка при удалении вложения.');
                                });
                        });
                        dialogLnk.dialog('close');
                    },
                    deleteMessage: 'Вы уверены, что хотите удалить прикрепленный файл?'
                });
                return $scope.deleteDialog;
            };
            $scope.deleteFile = function (claimNumber, attachmentId) {
                var dialogLnk = $scope.getDeleteDialog();
                dialogLnk.dialog("option", "claimNumber", claimNumber);
                dialogLnk.dialog("option", "attachmentId", attachmentId);
                dialogLnk.dialog('open');
            };

            $scope.previews = ["png", "jpg", "jpeg", "bmp", "gif", "pdf"];

            $scope.canPreview = function (attach) {
                for (var k in $scope.previews) {
                    if (attach.name.toLowerCase().indexOf($scope.previews[k])!=-1){
                        attach.type = $scope.previews[k];
                        return true;
                    }
                }
                return false;
            };
        }
    ])
./**
 * Created by User on 12.04.2016.
 */
controller('personInfoController',
    [
        '$rootScope', '$scope', '$timeout', 'utils',
        function ($rootScope, $scope, $timeout, utils) {
            $scope.contactPersonNameFocus = function () {
                if (!$scope.$contactPersonNameEditable) {
                    $scope.$contactPersonNameEditable = true;
                    $timeout(function () {
                        var name = $.trim($scope.complaint.contactPersonName);
                        if (name) {
                            var nameParts = name.split(' ').reverse();
                            $("#contactPersonLastName").val(nameParts.pop());
                            $("#contactPersonFirstName").val(nameParts.pop());
                            $("#contactPersonMiddleName").val(nameParts.reverse().join(" "));
                        }

                        $("#contactPersonLastName").focus();
                    }, 0);
                }
            };
            $scope.contactPersonNameBlur = function ($event) {
                if ($scope.$contactPersonNameEditable) {
                    var $target = $($event.target);
                    $target.val(firstLetterToUpperCase($target.val()));
                    $timeout(function () {
                        var $focusedElem = $(document.activeElement);
                        if (!$focusedElem
                            || ($.inArray($focusedElem.attr('id'),
                                ['contactPersonLastName',
                                    'contactPersonFirstName',
                                    'contactPersonMiddleName']) == -1)
                        ) {
                            $scope.complaint.contactPersonName =
                                $("#contactPersonLastName").val() + ' ' +
                                $("#contactPersonFirstName").val() + ' ' +
                                $("#contactPersonMiddleName").val();
                            $scope.$contactPersonNameEditable = false;
                        }
                    }, 0);
                }
            };
            var firstLetterToUpperCase = function (strVal) {
                if (strVal && strVal != '') {
                    strVal = strVal.substr(0, 1).toUpperCase() + strVal.substr(1);
                }
                return strVal
            };

        }
    ])
./**
 * Created by User on 12.04.2016.
 */
controller('checkInOutController',
    [
        '$rootScope', '$scope', 'utils', 'securityService', 'complaintServices',
        function ($rootScope, $scope, utils, securityService, complaintServices) {
            $scope.selectedActorId;
            $scope.autocompleteUrl = $rootScope.server.contextPath + "/complaint/checkInOutActorSearch";

            $scope.checkOut = function () {
                if (!$scope.validate()) {
                    return;
                }

                $scope.complaint.action = 'Выдано на руки';
                utils.showAjaxLoader();
                complaintServices.checkOutComplaint({complaintNumber: $scope.complaint.number, actorId: $scope.selectedActorId, actorName: $("#checkOutEmployee").val(), date: $scope.checkOutDate})
                    .then(function (data) {
                        utils.hideAjaxLoader();
                        $("#checkOutEmployee").val("");
                        $scope.checkOutDate = "";
                        $scope.selectedActorId = null;
                        $scope.complaint.checkInOutItems.push(data);
                        $scope.complaint.checkedOut = true;
                    }, function () {
                        utils.hideAjaxLoader();
                        alert('Произошла ошибка при выполнении запроса');
                    });
            };

            $scope.checkIn = function () {
                if (!$scope.validate()) {
                    return;
                }

                $scope.complaint.action = 'Возвращено';
                utils.showAjaxLoader();
                complaintServices.checkInComplaint({complaintNumber: $scope.complaint.number, date: $scope.checkInDate})
                    .then(function (data) {
                        utils.hideAjaxLoader();
                        $scope.checkInDate = "";
                        $scope.complaint.checkInOutItems.push(data);
                        $scope.complaint.checkedOut = false;
                    }, function () {
                        utils.hideAjaxLoader();
                        alert('Произошла ошибка при выполнении запроса');
                    });
            };

            $scope.validate = function () {
                $scope.checkOutEmployeeInvalid = false;
                $scope.checkOutDateInvalid = false;
                $scope.checkInDateInvalid = false;

                if ($scope.complaint.checkedOut) {
                    $scope.checkInDateInvalid = !$scope.checkInDate;
                } else {
                    $scope.checkOutEmployeeInvalid = !$("#checkOutEmployee").val();
                    $scope.checkOutDateInvalid = !$scope.checkOutDate;
                }

                return !$scope.checkOutEmployeeInvalid && !$scope.checkOutDateInvalid && !$scope.checkInDateInvalid;
            };

        }
    ])
;