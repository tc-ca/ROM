﻿///<reference path="../../Utilities/GlobalHelper.js"/>
///<reference path="../../Utilities/questionnaireFunctions.js"/>

var SR_main = (function (window, document) {

    //variables
    var formType;
    var userSettings;
    var LCID;
    var clientUrl;
    var resexResourceName;
    var globalObj;
    var currentWebApi;
    var isOffLine;
    var clientType;
    var SR_status;
    var SR_state;
    var SR_Status_origin;
    var serviceRquestType;
    var serviceRquestTypeOptions;
    var isStatusChanged;
    var operationStatus;

    var statusMappingActive = {
        "Draft": {

            "vals": ["Draft", "Submitted"],
            "allowsInactive": true
        },
        "1": {

            "vals": [1, 794600010],
            "allowsInactive": true
        },

        "Submitted": {

            "vals": ["Submitted", "Admin Review", "Cancellation Pending"],
            "allowsInactive": false
        },
        "794600010": {

            "vals": [794600010, 794600006, 794600009],
            "allowsInactive": false
        },

        "Additional Info Required": {

            "vals": ["Additional Info Required", "Admin Review"],
            "allowsInactive": false
        },
        "794600000": {

            "vals": [794600000, 794600006],
            "allowsInactive": false
        },

        "Admin Review": {

            "vals": ["Admin Review", "Additional Info Required", "Technical Review", "Cancellation Pending", "Refused"],
            "allowsInactive": false
        },
        "794600006": {

            "vals": [794600006, 794600000, 794600002, 794600009, 794600008],
            "allowsInactive": false
        },

        "Technical Info Required": {

            "vals": ["Technical Info Required", "Technical Review"],
            "allowsInactive": false
        },
        "794600011": {

            "vals": [794600011, 794600002],
            "allowsInactive": false
        },

        "Technical Review": {

            "vals": ["Technical Review", "Technical Info Required", "Pending Inspection", "Cancellation Pending", "Refused", "Approved"],
            "allowsInactive": false
        },
        "794600002": {

            "vals": [794600002, 794600011, 794600003, 794600009, 794600008, 794600007],
            "allowsInactive": false
        },

        "Pending Inspection": {

            "vals": ["Pending Inspection", "Post Inspection Review"],
            "allowsInactive": false
        },
        "794600003": {

            "vals": [794600003, 794600004],
            "allowsInactive": false
        },

        "Post Inspection Info Required": {

            "vals": ["Post Inspection Info Required", "Post Inspection Review"],
            "allowsInactive": false
        },
        "794600012": {

            "vals": [794600012, 794600004],
            "allowsInactive": false
        },

        "Post Inspection Review": {

            "vals": ["Post Inspection Review", "Post Inspection Info Required", "Refused", "Approved"],
            "allowsInactive": false
        },
        "794600004": {

            "vals": [794600004, 794600012, 794600008, 794600007],
            "allowsInactive": false
        },

        "Refused": {

            "vals": ["Refused", "Completed"],
            "allowsInactive": false
        },
        "794600008": {

            "vals": [794600008, 794600005],
            "allowsInactive": false
        },

        "Cancellation Pending": {

            "vals": ["Cancellation Pending"],
            "allowsInactive": true
        },
        "794600009": {

            "vals": [794600009],
            "allowsInactive": true
        },

        "Completed": {

            "vals": ["Completed"],
            "allowsInactive": true
        },
        "794600005": {

            "vals": [794600005],

            "allowsInactive": true
        },

        "Approved": {

            "vals": ["Approved", "Completed"],
            "allowsInactive": false
        },
        "794600007": {

            "vals": [794600007, 794600005],
            "allowsInactive": false
        }
    };

    var statusMappingFullRevocation_PartialRegistration = {
        "Approved": {

            "vals": ["Approved"],
            "allowsInactive": true
        },
        "794600007": {

            "vals": [794600007],
            "allowsInactive": true
        },
        "Technical Review": {

            "vals": ["Technical Review", "Approved"],
            "allowsInactive": true
        },
        "794600002": {

            "vals": [794600002, 794600007],
            "allowsInactive": true
        },
        "Submitted": {

            "vals": ["Submitted", "Technical Review"],
            "allowsInactive": true
        },
        "794600010": {

            "vals": [794600010, 794600002],
            "allowsInactive": true
        }
    };

    var statusMappingRegistrationClosedOrActive = {
        "Approved": {

            "vals": ["Approved"],
            "allowsInactive": true
        },
        "794600007": {

            "vals": [794600007],
            "allowsInactive": true
        },
        "Admin Review": {

            "vals": ["Admin Review", "Approved"],
            "allowsInactive": true
        },
        "794600006": {

            "vals": [794600006, 794600007],
            "allowsInactive": true
        },
        "Submitted": {

            "vals": ["Submitted", "Admin Review"],
            "allowsInactive": false
        },
        "794600010": {

            "vals": [794600010, 794600006],
            "allowsInactive": false
        }
    };

    var inactiveClosedOrCanceled = {
        "Completed": ["Closed"],
        "794600005": [2],
        "Draft": ["Canceled"],
        "1": [794600001],
        "Cancellation Pending": ["Canceled"],
        "794600009": [794600001],
        "Admin Review": ["Canceled"],
        "794600006": [794600001],
        "Technical Review": ["Canceled"],
        "794600002": [794600001],
        "Approved": ["Closed"],
        "794600007": [2]
    };

    var OperationLevelObj = {
        " ": {
            "New Registration": {

                "Active": statusMappingActive,

                "Inactive": inactiveClosedOrCanceled
            }
        },
        "0": {
            "794600000": {
                "0": statusMappingActive,
                "1": inactiveClosedOrCanceled
            }
        },

        "Expired": {
            "Renewal": {

                "Active": statusMappingActive,
                "Inactive": {}
            },
            "Close Expired Registration": {

                "Active": statusMappingRegistrationClosedOrActive,
                "Inactive": inactiveClosedOrCanceled
            }
        },
        "794600000": {
            "794600001": {
                "0": statusMappingActive,
                "1": inactiveClosedOrCanceled
            },
            "794600006": {

                "0": statusMappingRegistrationClosedOrActive,
                "1": inactiveClosedOrCanceled
            }
        },

        "Registered": {
            "Renewal": {

                "Active": statusMappingActive,
                "Inactive": inactiveClosedOrCanceled
            },
            "Partial Revocation": {

                "Active": statusMappingFullRevocation_PartialRegistration,
                "Inactive": inactiveClosedOrCanceled
            },
            "Amendment": {

                "Active": statusMappingActive,
                "Inactive": inactiveClosedOrCanceled
            },
            "Full Revocation": {

                "Active": statusMappingFullRevocation_PartialRegistration,
                "Inactive": inactiveClosedOrCanceled
            },
            "Close Active Registration": {

                "Active": statusMappingRegistrationClosedOrActive,
                "Inactive": inactiveClosedOrCanceled
            }
        },
        "794600001": {
            "794600001": {
                "0": statusMappingActive,
                "1": inactiveClosedOrCanceled
            },
            "794600003": {

                "0": statusMappingFullRevocation_PartialRegistration,
                "1": inactiveClosedOrCanceled
            },
            "794600002": {
                "0": statusMappingActive,
                "1": inactiveClosedOrCanceled
            },
            "794600004": {

                "0": statusMappingFullRevocation_PartialRegistration,
                "1": inactiveClosedOrCanceled
            },
            "794600005": {
                "0": statusMappingRegistrationClosedOrActive,
                "1": inactiveClosedOrCanceled
            }
        },


        "Unregistered": {
            "New Registration": {

                "Active": statusMappingActive,

                "Inactive": inactiveClosedOrCanceled
            }
        },
        "794600002": {

            "794600000": {
                "0": statusMappingActive,
                "1": inactiveClosedOrCanceled
            }
        },


        "Closed": {

            "Reactivation": {

                "Active": statusMappingActive,

                "Inactive": inactiveClosedOrCanceled
            }
        },
        "794600003": {
            "794600007": {
                "0": statusMappingActive,
                "1": inactiveClosedOrCanceled
            }
        }
    };

    var RegtypeLevelObj = {
        "New Registration": {

            "Active": statusMappingActive,
            "Inactive": inactiveClosedOrCanceled
        },
        "794600000": {

            "0": statusMappingActive,
            "1": inactiveClosedOrCanceled
        },

        "Renewal": {

            "Active": statusMappingActive,
            "Inactive": inactiveClosedOrCanceled
        },
        "794600001": {
            "0": statusMappingActive,
            "1": inactiveClosedOrCanceled
        },

        "Amendment": {

            "Active": statusMappingActive,
            "Inactive": inactiveClosedOrCanceled
        },
        "794600002": {
            "0": statusMappingActive,
            "1": inactiveClosedOrCanceled
        },

        "Partial Revocation": {

            "Active": statusMappingFullRevocation_PartialRegistration,
            "Inactive": inactiveClosedOrCanceled
        },
        "794600003": {

            "0": statusMappingFullRevocation_PartialRegistration,
            "1": inactiveClosedOrCanceled
        },

        "Full Revocation": {

            "Active": statusMappingFullRevocation_PartialRegistration,
            "Inactive": inactiveClosedOrCanceled
        },
        "794600004": {

            "0": statusMappingFullRevocation_PartialRegistration,
            "1": inactiveClosedOrCanceled
        },

        "Close Active Registration": {

            "Active": statusMappingRegistrationClosedOrActive,
            "Inactive": inactiveClosedOrCanceled
        },
        "794600005": {
            "0": statusMappingRegistrationClosedOrActive,
            "1": inactiveClosedOrCanceled
        },

        "Close Expired Registration": {

            "Active": statusMappingRegistrationClosedOrActive,
            "Inactive": inactiveClosedOrCanceled
        },
        "794600006": {

            "0": statusMappingRegistrationClosedOrActive,
            "1": inactiveClosedOrCanceled
        },

        "Reactivation": {

            "Active": statusMappingActive,
            "Inactive": inactiveClosedOrCanceled
        },
        "794600007": {

            "0": statusMappingActive,
            "1": inactiveClosedOrCanceled
        }
    };
    //********************private methods*******************


    function SetStateDependantVisibility(formContext) {

        //Field toggles
        var isJustificationNeeded = false;

        if (SR_status == 794600008) isJustificationNeeded = true;

        //If status is Refused then show and require justification
        glHelper.SetControlVisibility(formContext, "fdr_refusaljustification", isJustificationNeeded);

        glHelper.SetRequiredLevel(formContext, "fdr_refusaljustification", isJustificationNeeded);

    }

    function ServiceRquestTypeFilter(executionContext, formContext) {



        glHelper.filterOptionSetUsingOrigin(formContext, "fdr_srtype", serviceRquestTypeOptions, Object.keys(OperationLevelObj[operationStatus]), true);


        //is single - set value, else clear the field
        if (Object.keys(OperationLevelObj[operationStatus]) && Object.keys(OperationLevelObj[operationStatus]).length == 1) glHelper.SetOptionsetByValue(formContext, "fdr_srtype", Object.keys(OperationLevelObj[operationStatus])[0]);
        else
            glHelper.SetValue(formContext, "fdr_srtype", null);

        serviceRquestTypeOptions = formContext.getAttribute("fdr_srtype").getOptions();
        serviceRquestType = formContext.getAttribute("fdr_srtype").getValue();
        SR_main.OnStatusReason_Change(executionContext);
    }


    //********************private methods end***************

    //********************public methods***************
    return {


        OnLoad: function (executionContext) {

            var globalContext = Xrm.Utility.getGlobalContext();
            var formContext = executionContext.getFormContext();
            isOffLine = glHelper.isOffline(executionContext);
            clientType = glHelper.getClientType(executionContext);
            isOnLoad = true;

            if (isOffLine && clientType > 0) {

                //mobile or outlook, offline first
                currentWebApi = Xrm.WebApi.offline;
                clientUrl = "https://localhost:2525";
            } else {

                //web, online
                currentWebApi = Xrm.WebApi.online;
                clientUrl = globalContext.getClientUrl();
            }

            //will work only in web but mobile
            if (glHelper.isTopAccessible()) {

                //set global object/s here

                //globalObj.formContext = formContext;
            }

            userSettings = globalContext.userSettings;

            // 0 = Undefined, 1 = Create, 2 = Update, 3 = Read Only, 4 = Disabled, 6 = Bulk Edit
            formType = glHelper.GetFormType(formContext);

            //Load up resources for English/French labels
            LCID = userSettings.languageId;

            if (LCID == 1033)
                resexResourceName = "ovs_Labels.1033.resx";
            else if (LCID == 1036)
                resexResourceName = "ovs_Labels.1036.resx";

            //set global values
            SR_status = glHelper.GetOptionsetValue(formContext, "statuscode");
            SR_state = glHelper.GetOptionsetValue(formContext, "statecode");


            //Manage hide/show based on status
            SetStateDependantVisibility(formContext);

            var formState = formContext.getAttribute("statecode");
            formState.removeOnChange(SR_main.OnState_Change);
            formState.addOnChange(SR_main.OnState_Change);

            var formStatus = formContext.getAttribute("statuscode");
            //get original list of options to keep
            SR_Status_origin = formStatus.getOptions();
            formStatus.removeOnChange(SR_main.OnStatusReason_Change);
            formStatus.addOnChange(SR_main.OnStatusReason_Change);

            var site = formContext.getAttribute("fdr_site");
            site.removeOnChange(SR_main.OnSite_Change);
            site.addOnChange(SR_main.OnSite_Change);

            var operation = formContext.getAttribute("fdr_operation");
            operation.removeOnChange(SR_main.OnOperation_Change);
            operation.addOnChange(SR_main.OnOperation_Change);

            serviceRquestTypeOptions = formContext.getAttribute("fdr_srtype").getOptions();
            serviceRquestType = formContext.getAttribute("fdr_srtype").getValue();


            //on create
            if (formType == 1) {

                operation.fireOnChange();
            }

            //on update etc
            if (formType == 2) {

                //get current opeation status (calculated - available after save)
                operationStatus = glHelper.GetValue(formContext, "fdr_operationstatus");
                //operationStatus may be empty if operation is abcent
                if (!operationStatus) operationStatus = 0;


                //run managing object process to set filters etc
                formStatus.fireOnChange();

                //hide the time tracking and performance tabs when the service request type is "full revocation", "partial revocation", "close active registration", or "close expired registration"
                if (serviceRquestType != null) {

                    if (serviceRquestType == 794600003 || serviceRquestType == 794600004 || serviceRquestType == 794600005 || serviceRquestType == 794600006) {
                        glHelper.SetTabVisibility(formContext, "tab_TimeTracking", false);
                        glHelper.SetTabVisibility(formContext, "tab_Performance", false);

                    }
                }
            }

            formContext.data.entity.addOnSave(SR_main.OnSave_Event);
            formContext.data.entity.addOnPostSave(SR_main.OnPostSave_Event);
        },

        OnStatusReason_Change: function (executionContext) {

            var formContext = executionContext.getFormContext();
            serviceRquestType = formContext.getAttribute("fdr_srtype").getValue();
            SR_status = glHelper.GetOptionsetValue(formContext, "statuscode");
            SR_state = glHelper.GetOptionsetValue(formContext, "statecode");

            //no reg type => means submitted or draft => shall not define status
            if (serviceRquestType == null || serviceRquestType == undefined) return;

            //only one state change allowed!
            if (formContext.getAttribute("statuscode").getIsDirty()) return;


            //is instance is active
            if (SR_state != 1) {

                var currentStatuses = RegtypeLevelObj[serviceRquestType]["0"][SR_status]["vals"];
                var allowInactive = RegtypeLevelObj[serviceRquestType]["0"][SR_status]["allowsInactive"];
                //set statecode visibility
                glHelper.SetDisabled(formContext, "header_statecode", !allowInactive);                

                glHelper.filterOptionSetUsingOrigin(formContext, "header_statuscode", SR_Status_origin, currentStatuses, true)
            }//inactive
            else {

                var currentStatuses = RegtypeLevelObj[serviceRquestType]["1"][SR_status];
                if (currentStatuses != null && currentStatuses != undefined) glHelper.filterOptionSetUsingOrigin(formContext, "header_statuscode", SR_Status_origin, currentStatuses, true)

                glHelper.SetDisabled(formContext, "header_statecode", false);
            }

            //Manage hide/show based on status
            SetStateDependantVisibility(formContext);
        },

        OnState_Change: function (executionContext) {

            var formContext = executionContext.getFormContext();
            serviceRquestType = formContext.getAttribute("fdr_srtype").getValue();
            SR_status = glHelper.GetOptionsetValue(formContext, "statuscode");
            SR_state = glHelper.GetOptionsetValue(formContext, "statecode");

            ////only one state change allowed!
            //if (formContext.getAttribute("statecode").getIsDirty()) return;
            //is instance is inactive
            if (SR_state == 1) {

                var currentStatuses = RegtypeLevelObj[serviceRquestType]["1"][SR_status];

                if (currentStatuses != null && currentStatuses != undefined)                glHelper.filterOptionSetUsingOrigin(formContext, "header_statuscode", SR_Status_origin, currentStatuses, true);

                //is single - set value, else clear the field
                if (currentStatuses && currentStatuses.length == 1) glHelper.SetOptionsetByValue(formContext, "statuscode", currentStatuses[0]);
            }//active
            else {

                SR_main.OnStatusReason_Change(executionContext);
            }
        },

        OnSite_Change: function (executionContext) {

            var formContext = executionContext.getFormContext();
            var preID = executionContext.getSharedVariable("fdr_site");
            var operation = formContext.getAttribute("fdr_operation");

            var hSite = formContext.getAttribute("fdr_site").getValue();
            //if account removed => clean operation and registration type
            if (hSite == null) {

                glHelper.SetValue(formContext, "fdr_operation", null);
                glHelper.SetValue(formContext, "fdr_containertype", null);

            }
            //clear operation if changed and registration type
            else {
                if (preID != null && preID != undefined && preID != hSite.id) {
                    executionContext.setSharedVariable("fdr_site", hSite.id);
                    glHelper.SetValue(formContext, "fdr_operation", null);
                    glHelper.SetValue(formContext, "fdr_containertype", null);
                }
            }

            operation.fireOnChange();
        },

        //the event happens only on create as Operation field is readonly rest of the time
        OnOperation_Change: function (executionContext) {

            ////when the operation is selected

            //registration type is populated based on the registration type of operation
            //service request types are filtered to valid types based on the current state of the operation
            //registration type is locked

            ////when operation selection is cleared
            //registration type is cleared

            var formContext = executionContext.getFormContext();

            //if opration selected and account is empty => populate the site/account
            var hSite = formContext.getAttribute("fdr_site").getValue();
            var hOperation = formContext.getAttribute("fdr_operation").getValue();

            if (hOperation != null) {

                glHelper.SetValue(formContext, "fdr_containertype", null);

                var opperationid = hOperation[0].id.replace('{', '').replace('}', '');

                Xrm.WebApi.online.retrieveRecord("ovs_mocregistration", opperationid, "?$select=_fdr_registrationtype_value,fdr_operationstatus,_ovs_siteid_value").then(
                    function success(result) {
                        operationStatus = result["fdr_operationstatus"];
                        //operationStatus may be empty if operation is abcent
                        if (!operationStatus) operationStatus = 0;

                        var fdr_operationstatus_formatted = result["fdr_operationstatus@OData.Community.Display.V1.FormattedValue"];

                        //set Service Rquest Type based on Operation Status
                        ServiceRquestTypeFilter(executionContext, formContext);


                        var siteid = result["_ovs_siteid_value"];
                        var name = result["_ovs_siteid_value@OData.Community.Display.V1.FormattedValue"];
                        var logicalname = result["_ovs_siteid_value@Microsoft.Dynamics.CRM.lookuplogicalname"];

                        //set site lookup
                        if (hSite == null) {
                            glHelper.SetLookup(formContext, "fdr_site", logicalname, siteid, name);
                        }

                        //set Registration Type
                        //var containerType = formContext.getAttribute("fdr_containertype").getValue();
                        //if (containerType == null) {
                        var containerTypeId = result["_fdr_registrationtype_value"];
                        var containerTypeName = result["_fdr_registrationtype_value@OData.Community.Display.V1.FormattedValue"];
                        var clogicalname = result["_fdr_registrationtype_value@Microsoft.Dynamics.CRM.lookuplogicalname"];

                        glHelper.SetLookup(formContext, "fdr_containertype", clogicalname, containerTypeId, containerTypeName);
                        glHelper.SetDisabled(formContext, "fdr_containertype", true);
                        //}
                    },
                    function (error) {
                        Xrm.Navigation.openErrorDialog({ message: error.message });
                    }
                );
            }// no operation
            else {
                operationStatus = 0;
                ServiceRquestTypeFilter(executionContext, formContext);
                glHelper.SetValue(formContext, "fdr_containertype", null);
                glHelper.SetDisabled(formContext, "fdr_containertype", false);
            }

        },

        //the on save event will refresh if the statuscode ATTRIBUTE is dirty
        OnSave_Event: function (executionContext) {
            var formContext = executionContext.getFormContext();

            //statuscode ATTRIBUTE is dirty refresh the form
            if (formContext.getAttribute("statuscode").getIsDirty()) {
                isStatusChanged = true;
            }
        },

        OnPostSave_Event: function (executionContext) {
            var formContext = executionContext.getFormContext();
            var formType = glHelper.GetFormType(formContext);

            //statuscode ATTRIBUTE is dirty refresh the form
            if (formType > 1 && isStatusChanged) {
                Xrm.Utility.openEntityForm(formContext.data.entity.getEntityName(), formContext.data.entity.getId());
            }
        }
    }

    //********************public methods end***************

})(window, document)
