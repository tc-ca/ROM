﻿///<reference path="../../Utilities/GlobalHelper.js"/>
///<reference path="../../Utilities/questionnaireFunctions.js"/>
var QuickCreateHelper = QuickCreateHelper || {};
window.top.QuickCreateHelper = QuickCreateHelper;

var WO_TDG_main = (function (window, document) {

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

    var errorObject = {};
    errorObject.isValid = true;
    errorObject.errorMessage = new Array();


    //********************private methods*******************
    function setReportValidationError(message) {
        errorObject.isValid = false;
        errorObject.errorMessage.push(message);
    }

    function getQuickFormAttributeValue(executionContext, QuickViewControlName, AttributeSchemaName) {

        var formContext = executionContext.getFormContext();
        var quickViewControl = formContext.ui.quickForms.get(QuickViewControlName);
        if (quickViewControl != undefined) {
            if (quickViewControl.isLoaded()) {

                //// Access the value of the column bound to the constituent control
                //var myValue = quickViewControl.getControl(0).getAttribute().getValue();
                //console.log(myValue);

                // Search by a specific column present in the control       
                globalObj.contact = quickViewControl.getControl().find(control => control.getName() == AttributeSchemaName).getAttribute().getValue();
                return;
            }
            else {
                // Wait for some time and check again
                setTimeout(getQuickFormAttributeValue, 1000, executionContext, QuickViewControlName, AttributeSchemaName);
            }
        }
        else {
            console.log("No data to display in the quick view control.");
            globalObj.contact = null;
            return;
        }
    }

    function getLocalizedName(formatedString) {

        var pos = formatedString.indexOf("::");
        if (pos > -1) {
            if (userSettings.languageId == 1036) {
                // French
                return formatedString.substring(pos + 2);
            }
            else if (userSettings.languageId == 1033) {
                // English
                return formatedString.substring(0, pos);
            }
        } else {
            return formatedString;
        }
    }

    /**
     * mobile friendly method
     * @param {context} formContext
     * @param {userid} userid of user owning  bookableresource
     * @param {isCurrentUser} isCurrentUser flag to indicate if quesry execured for current user's bookableresource or new bookable resource owner
     */
    function getSetInspectorRegion(formContext, userid, isCurrentUser = true) {

        var bookableresourceid;
        var _userid_value_formatted;
        var _territoryid_value;
        var _territoryid_value_lookuplogicalname;
        var _territoryid_value_formatted;
        var formattedLang = "";
        var messageRegionFailed = Xrm.Utility.getResourceString(resexResourceName, "msdyn_workorder.FetchRegion.ErrorMessage");


        currentWebApi.retrieveRecord("systemuser", userid.toLowerCase(), "?$select=fullname,_territoryid_value&$expand=systemuser_bookableresource_UserId($select=bookableresourceid,name),territoryid($select=name,ovs_territorynameenglish,ovs_territorynamefrench,territoryid)").then(
            function success(results) {

                if (results != null) {

                    var fullname = results["fullname"];
                    _territoryid_value = results["_territoryid_value"];
                    _territoryid_value_formatted = results["_territoryid_value@OData.Community.Display.V1.FormattedValue"];
                    _territoryid_value_lookuplogicalname = results["_territoryid_value@Microsoft.Dynamics.CRM.lookuplogicalname"];

                    if (results.systemuser_bookableresource_UserId != null
                        && results.systemuser_bookableresource_UserId.length > 0) {

                        bookableresourceid = results.systemuser_bookableresource_UserId[0]["bookableresourceid"];
                        _userid_value_formatted = results.systemuser_bookableresource_UserId[0]["name"];
                    }

                    if (results.hasOwnProperty("territoryid")) {
                        _territoryid_value_formatted = results["territoryid"]["name"];
                        var territoryid_ovs_territorynameenglish = results["territoryid"]["ovs_territorynameenglish"];
                        var territoryid_ovs_territorynamefrench = results["territoryid"]["ovs_territorynamefrench"];
                        var territoryid_territoryid = results["territoryid"]["territoryid"];
                    }

                    //localize region lookup
                    if (_territoryid_value)
                        formattedLang = getLocalizedName(_territoryid_value_formatted);

                    //primary inspector
                    if (isCurrentUser) {
                        glHelper.SetLookup(formContext, "ovs_primaryinspector", "bookableresource", bookableresourceid, _userid_value_formatted);
                    }
                    //inspectors region
                    glHelper.SetLookup(formContext, "msdyn_serviceterritory", _territoryid_value_lookuplogicalname, _territoryid_value, formattedLang);
                }
            },
            function (error) {

                console.log("getSetInspectorRegion method.Error :" + error.message);
                Xrm.Navigation.openAlertDialog({ confirmButtonLabel: "OK", text: messageRegionFailed + " " + error.message });
            }
        );
    }


    //********************private methods end***************

    //********************public methods***************
    return {


        OnLoad: function (executionContext) {

            var globalContext = Xrm.Utility.getGlobalContext();
            var formContext = executionContext.getFormContext();
            isOffLine = glHelper.isOffline(executionContext);
            clientType = glHelper.getClientType(executionContext);

            if (isOffLine && clientType > 0) {

                //mobile or outlook, offline first
                currentWebApi = Xrm.WebApi.offline;
                clientUrl = "https://localhost:2525";
            } else {

                //web, online
                currentWebApi = Xrm.WebApi.online;
                clientUrl = globalContext.getClientUrl();
            }


            if (glHelper.isTopAccessible()) {
                globalObj = window.top.QuickCreateHelper;
                globalObj.formContext = formContext;

                //site
                var site = formContext.getAttribute("msdyn_serviceaccount");
                site.removeOnChange(WO_TDG_main.Site_OnChange); // avoid binding multiple event handlers
                site.addOnChange(WO_TDG_main.Site_OnChange);
            }

            getQuickFormAttributeValue(executionContext, "service_account_details", "primarycontactid");
            userSettings = globalContext.userSettings;

            // 0 = Undefined, 1 = Create, 2 = Update, 3 = Read Only, 4 = Disabled, 6 = Bulk Edit
            formType = glHelper.GetFormType(formContext);

            //Load up resources for English/French labels
            LCID = userSettings.languageId;

            if (LCID == 1033)
                resexResourceName = "ovs_Labels.1033.resx";
            else if (LCID == 1036)
                resexResourceName = "ovs_Labels.1036.resx";


            //rational
            var rational = formContext.getAttribute("ovs_rational");
            rational.removeOnChange(WO_TDG_main.Rational_OnChange);
            rational.addOnChange(WO_TDG_main.Rational_OnChange);
            rational.fireOnChange();

            //fiscal year and quoter
            var fy = formContext.getAttribute("ovs_fiscalyear");
            fy.removeOnChange(WO_TDG_main.FiscalYearOnchange);
            fy.addOnChange(WO_TDG_main.FiscalYearOnchange);

            //wo status - validation will work online only!
            if (!isOffLine) {
                var systemStatus = formContext.getAttribute("msdyn_systemstatus");
                systemStatus.removeOnChange(WO_TDG_main.WO_SystemStatus_OnChange);
                systemStatus.addOnChange(WO_TDG_main.WO_SystemStatus_OnChange);
            }

            //WO Number/msdyn_name
            glHelper.SetControlVisibility(formContext, "msdyn_name", false);

            //Activity Type
            var activityType = formContext.getAttribute("ovs_oversighttype");
            activityType.removeOnChange(WO_TDG_main.ActivityType_OnChange);
            activityType.addOnChange(WO_TDG_main.ActivityType_OnChange);

            //Substatus Type
            WO_TDG_main.Update_WO_Substatus(formContext);

            var primaryInspector = formContext.getAttribute("ovs_primaryinspector");
            primaryInspector.removeOnChange(WO_TDG_main.PrimaryInspector_OnChange);
            primaryInspector.addOnChange(WO_TDG_main.PrimaryInspector_OnChange);

            // Filter WO_SystemStatus (hide "Open - In Progress")
            WO_TDG_main.WO_SystemStatus_FilterOptionSet(formContext);

            //operation
            var operation = formContext.getAttribute("ovs_mocoperationid");
            operation.removeOnChange(WO_TDG_main.Operation_OnChange);
            operation.addOnChange(WO_TDG_main.Operation_OnChange);


            //on create
            if (formType == 1) {

                //WO_TDG_main.SetDefaultInspector(formContext);
                var currentUserId = userSettings.userId;
                currentUserId = currentUserId.replace(/[{}]/g, "");
                getSetInspectorRegion(formContext, currentUserId);

                //fiscal year
                WO_TDG_main.SetDefaultFiscalYear(formContext);
                //Fiscal quarter
                WO_TDG_main.SetDefaultFiscalQuarter(formContext);
            }

            //on update etc
            if (formType > 1) {
                //set global object fo contact quick create form
                site.fireOnChange();                

                //refresh the COC tab
                var cocTab = formContext.ui.tabs.get("tab_ConfirmationOfCompliances");
                cocTab.removeTabStateChange(WO_TDG_main.OnConfirmationOfCompliance_StateChange);
                cocTab.addTabStateChange(WO_TDG_main.OnConfirmationOfCompliance_StateChange);
            }

            // Set Oversight Activity field as Mandatory
            glHelper.SetRequiredLevel(formContext, "ovs_oversighttype", true);

            // make Operation required -> move to designer once testing is done 
            glHelper.SetRequiredLevel(formContext, "ovs_mocoperationid", true);
            //pre-filter Oversith Type and Region
            operation.fireOnChange();

        },

        OnConfirmationOfCompliance_StateChange: function (executionContext) {

            let formContext = executionContext.getFormContext();

            var cocTab = formContext.ui.tabs.get("tab_ConfirmationOfCompliances");
            if (cocTab && cocTab.getDisplayState() == "expanded" && cocTab.getVisible() == true) {
                var gridCOC = formContext.getControl("Subgrid_COC");
                gridCOC.refresh();
            }

        },

        Site_OnChange: function (executionContext) {
            var formContext = executionContext.getFormContext();

            try {
                var site = formContext.getAttribute("msdyn_serviceaccount").getValue()[0];

                globalObj.site = {};
                globalObj.site.id = site.id;
                globalObj.site.et = site.entityType;
                globalObj.site.name = site.name;
            } catch (e) {
                console.log("Site_OnChange failed - lookup is empty");
            }
        },

        PrimaryInspector_OnChange: function (executionContext) {

            var formContext = executionContext.getFormContext();
            var primaryInspector = formContext.getAttribute("ovs_primaryinspector").getValue();
            //If Primary Inspector is being cleared out, do nothing here.
            if (primaryInspector == null) return;

            var messageRegionFailed = Xrm.Utility.getResourceString(resexResourceName, "msdyn_workorder.FetchRegion.ErrorMessage");

            var primaryInspectorId = primaryInspector[0].id;
            currentWebApi.retrieveRecord("bookableresource", primaryInspectorId, "?$select=bookableresourceid,name,_userid_value").then(
                function success(result) {
                    var bookableresourceid = result["bookableresourceid"];
                    var name = result["name"];
                    var _userid_value = result["_userid_value"];
                    var _userid_value_formatted = result["_userid_value@OData.Community.Display.V1.FormattedValue"];
                    var _userid_value_lookuplogicalname = result["_userid_value@Microsoft.Dynamics.CRM.lookuplogicalname"];

                    getSetInspectorRegion(formContext, _userid_value, false);
                },
                function (error) {

                    console.log("Set Region failed. Error :" + error.message);
                    Xrm.Navigation.openAlertDialog({ confirmButtonLabel: "OK", text: messageRegionFailed + " " + error.message });
                }
            );

        },

        ActivityType_OnChange: function (executionContext) {

            var messageWOTypeFailed = Xrm.Utility.getResourceString(resexResourceName, "msdyn_workorder.FetchWorkOrderType.ErrorMessage");
            var formContext = executionContext.getFormContext();
            var sActivityName = glHelper.GetLookupName(formContext, "ovs_oversighttype");

            //offline filter fix
            var filter = (isOffLine && clientType > 0)
                ? "ovs_workordertypenameenglish eq '{0}'"
                : "startswith(ovs_workordertypenameenglish,'{0}')";

            //Set WO Type based on Activity Type
            if (sActivityName == "Civil Aviation Document Review" || sActivityName == "Examen des documents de l'aviation civile" || sActivityName == "Examen documentation de l'aviation civile") {
                currentWebApi.retrieveMultipleRecords("msdyn_workordertype", "?$select=msdyn_workordertypeid,ovs_workordertypenameenglish,ovs_workordertypenamefrench&$filter=" + filter.replace("{0}", "Regulatory Authorization")).then(
                    function success(results) {
                        var englishName = results.entities[0]["ovs_workordertypenameenglish"];
                        var frenchName = results.entities[0]["ovs_workordertypenamefrench"];
                        var workOrderTypeId = results.entities[0]["msdyn_workordertypeid"];

                        if (userSettings.languageId == 1036)
                            glHelper.SetLookup(formContext, "msdyn_workordertype", "msdyn_workordertype", workOrderTypeId, frenchName);
                        if (userSettings.languageId == 1033)
                            glHelper.SetLookup(formContext, "msdyn_workordertype", "msdyn_workordertype", workOrderTypeId, englishName);

                        glHelper.SetDisabled(formContext, "ovs_rational", true);
                    },
                    function (error) {
                        console.log("Fetch Work Order Type Error. error: " + error.message);
                        Xrm.Navigation.openAlertDialog({ confirmButtonLabel: "OK", text: messageWOTypeFailed + " " + error.message });
                    }
                );
            }
            else {
                currentWebApi.retrieveMultipleRecords("msdyn_workordertype", "?$select=msdyn_workordertypeid,ovs_workordertypenameenglish,ovs_workordertypenamefrench&$filter=" + filter.replace("{0}", "Inspection")).then(
                    function success(results) {
                        var englishName = results.entities[0]["ovs_workordertypenameenglish"];
                        var frenchName = results.entities[0]["ovs_workordertypenamefrench"];
                        var workOrderTypeId = results.entities[0]["msdyn_workordertypeid"];

                        if (userSettings.languageId == 1036)
                            glHelper.SetLookup(formContext, "msdyn_workordertype", "msdyn_workordertype", workOrderTypeId, frenchName);
                        if (userSettings.languageId == 1033)
                            glHelper.SetLookup(formContext, "msdyn_workordertype", "msdyn_workordertype", workOrderTypeId, englishName);

                        glHelper.SetDisabled(formContext, "ovs_rational", true);
                    },
                    function (error) {
                        console.log(messageWOTypeFailed + " " + error.message);
                        Xrm.Navigation.openAlertDialog({ confirmButtonLabel: "OK", text: messageWOTypeFailed + " " + error.message });
                    }
                );
            }
        },

        Rational_OnChange: function (executionContext) {

            var messageRationalFailed = Xrm.Utility.getResourceString(resexResourceName, "msdyn_workorder.FetchRational.ErrorMessage");

            var globalContext = Xrm.Utility.getGlobalContext();
            var formContext = executionContext.getFormContext();
            //get current rational
            var rational = glHelper.GetLookupName(formContext, "ovs_rational");
            var isPlanned = (rational == "Planned" || rational == "Planifié");

            var isPlanner = false;
            var isManager = false;
            var isInspector = false;
            var isAnalytic = false;

            //set fields based on app
            globalContext.getCurrentAppName().then(function (appName) {

                var readOnlyArray = new Array();
                var editableArray = new Array();
                var hiddenArray = new Array()
                isPlanner = appName.indexOf("Planner") != -1;
                isManager = appName.indexOf("Management ") != -1;
                isInspector = appName.indexOf("Inspections") != -1 || appName.indexOf("Inspector") != -1;
                isAnalytic = appName.indexOf("Analytics") != -1;



                if (isAnalytic || isPlanner) return;

                if (formType == 1) {
                    //set Rational to default "Unplanned" for Manager or Inspector  and lock readonly!

                    //get rational "ovs_rational" , check it it has french option
                    if (isManager || isInspector) {

                        //offline filter fix
                        var filter = (isOffLine && clientType > 0)
                            ? "ovs_name eq '{0}'"
                            : "startswith(ovs_name,'{0}')";

                        currentWebApi.retrieveMultipleRecords("ovs_tyrational", "?$select=ovs_name,ovs_rationalelbl,ovs_rationalflbl,ovs_tyrationalid&$filter=" + filter.replace("{0}", "Unplanned")).then(
                            function success(results) {

                                var ovs_name = results.entities[0]["ovs_name"];
                                var ovs_rationalelbl = results.entities[0]["ovs_rationalelbl"];
                                var ovs_rationalflbl = results.entities[0]["ovs_rationalflbl"];
                                var ovs_tyrationalid = results.entities[0]["ovs_tyrationalid"];

                                if (userSettings.languageId == 1036)
                                    glHelper.SetLookup(formContext, "ovs_rational", "ovs_tyrational", ovs_tyrationalid, ovs_rationalflbl);
                                if (userSettings.languageId == 1033)
                                    glHelper.SetLookup(formContext, "ovs_rational", "ovs_tyrational", ovs_tyrationalid, ovs_rationalelbl);

                                readOnlyArray = new Array("ovs_rational", "msdyn_closedby", "msdyn_timeclosed", "ovs_qcreviewcomments", "ovs_qcreviewcompletedind", "msdyn_workordertype");

                                if (readOnlyArray.length > 0)
                                    for (var i = 0; i < readOnlyArray.length; i++) {
                                        glHelper.SetDisabled(formContext, readOnlyArray[i], true);
                                    }


                            },
                            function (error) {
                                console.log("Fetch rational Unplanned failed. error: " + error.message);
                                Xrm.Navigation.openAlertDialog({ confirmButtonLabel: "OK", text: messageRationalFailed + " " + error.message });
                            }
                        );

                    }
                }
                else {
                    switch (appName) {
                        //case "TDG Planner / Planificateur TMD":
                        //    editableArray = new Array("msdyn_serviceaccount", "qm_remote", "ovs_oversighttype", "ovs_fiscalyear", "ovs_fiscalquarter", "msdyn_workordertype", "ovs_rational", "msdyn_serviceterritory");
                        //    break;
                        case "TDG Management / Gestion TMD":
                            if (isPlanned) {
                                readOnlyArray = new Array("msdyn_serviceaccount", "ovs_oversighttype", "ovs_fiscalyear", "msdyn_workordertype", "ovs_rational", "msdyn_closedby", "msdyn_timeclosed"); //"ovs_fiscalquarter", "msdyn_serviceterritory",
                                editableArray = new Array("qm_remote");
                            }
                            else {
                                readOnlyArray = new Array("msdyn_workordertype", "ovs_rational");
                                editableArray = new Array("msdyn_serviceaccount", "qm_remote", "ovs_oversighttype", "ovs_fiscalyear", "ovs_fiscalquarter", "msdyn_serviceterritory");
                            }
                            break;
                        case "Inspector Offline":
                        case "TDG Inspections / Inspections TMD":
                            if (isPlanned && formType != glHelper.FORMTYPE_READONLY && formType != glHelper.FORMTYPE_DISABLED) {
                                readOnlyArray = new Array("msdyn_serviceaccount", "ovs_mocoperationid", "ovs_oversighttype", "ovs_fiscalyear", "ovs_fiscalquarter", "ovs_revisedquarterid", "msdyn_workordertype", "ovs_rational", "msdyn_closedby", "msdyn_timeclosed", "ovs_qcreviewcomments", "ovs_qcreviewcompletedind", "ovs_primaryinspector",); //"msdyn_serviceterritory",
                                editableArray = new Array("qm_remote");
                            }
                            else {
                                readOnlyArray = new Array("msdyn_workordertype", "ovs_rational");
                                editableArray = new Array("msdyn_serviceaccount", "ovs_mocoperationid", "qm_remote", "ovs_oversighttype", "ovs_fiscalyear", "ovs_fiscalquarter", "ovs_revisedquarterid", "msdyn_serviceterritory"); //"ovs_rational" - cannot set editable => will set all fields editable

                            }

                            ////hiddenArray = new Array("msdyn_serviceterritory", "msdyn_workordertype");
                            ////msdyn_systemstatus - filter OptionSet (exclude Closed - Cancelled)
                            //if (formType != glHelper.FORMTYPE_READONLY && formType != glHelper.FORMTYPE_DISABLED) {

                            //    var options = new Array(); options[0] = 690970005;
                            //    glHelper.filterOptionSet(formContext, "msdyn_systemstatus", options, false);
                            //}

                            break;
                        default:
                            //        readOnlyArray = new Array("msdyn_serviceaccount", "qm_remote", "ovs_oversighttype", "ovs_fiscalyear", "ovs_fiscalquarter", "msdyn_workordertype", "ovs_rational", "msdyn_serviceterritory");
                            break;
                    }

                }

                if (readOnlyArray.length > 0)
                    for (var i = 0; i < readOnlyArray.length; i++) {
                        glHelper.SetDisabled(formContext, readOnlyArray[i], true);
                    }

                if (editableArray.length > 0)
                    for (var i = 0; i < editableArray.length; i++) {
                        glHelper.SetDisabled(formContext, editableArray[i], false);
                    }

                if (hiddenArray.length > 0)
                    for (var i = 0; i < hiddenArray.length; i++) {
                        glHelper.SetControlVisibility(formContext, hiddenArray[i], false);
                    }

            }, function (error) {

                console.log("Get current app name error: " + error.message);
                Xrm.Navigation.openAlertDialog({ confirmButtonLabel: "OK", text: "Fetch current app name failed. Error :" + error.message });
            });

            //Filter Oversight Lookup
            if (isPlanned) {
                var formContext = executionContext.getFormContext();
                formContext.getControl("ovs_oversighttype").setDefaultView("d54acdca-91a7-eb11-9442-000d3ae99322");
            }
            else {
                var formContext = executionContext.getFormContext();
                formContext.getControl("ovs_oversighttype").setDefaultView("920688A2-94A7-EB11-9442-000D3AE99322");
            }
        },

        SetDefaultFiscalYear: function (formContext) {


            var fiscalYearName;
            var filter = "";
            if (isOffLine && clientType > 0) {
                //offline
                fiscalYearName = glHelper.getFiscalYearFromCurrentDate();
                filter = "tc_name eq '" + fiscalYearName + "'";
            } else {
                //online
                filter = "tc_iscurrentfiscalyear eq true";
            }

            var messageFiscalYearFailed = Xrm.Utility.getResourceString(resexResourceName, "msdyn_workorder.FetchFiscalYear.ErrorMessage");

            currentWebApi.retrieveMultipleRecords("tc_tcfiscalyear", "?$select=tc_name,tc_tcfiscalyearid&$filter=" + filter).then(
                function success(results) {

                    for (var i = 0; i < results.entities.length; i++) {
                        var tc_name = results.entities[i]["tc_name"];
                        var tc_tcfiscalyearid = results.entities[i]["tc_tcfiscalyearid"];

                        glHelper.SetLookup(formContext, "ovs_fiscalyear", "tc_tcfiscalyear", tc_tcfiscalyearid, tc_name);
                    }
                },
                function (error) {
                    console.log("Set Default Fiscal Year failed. Error :" + error.message);
                    Xrm.Navigation.openAlertDialog({ confirmButtonLabel: "OK", text: messageFiscalYearFailed + " " + error.message });
                }
            );
        },

        SetDefaultFiscalQuarter: function (formContext) {
            var firstPartOfPattern = "yyyy-MM-dd";
            var secondPartOfPattern = "HH:mm:ss";
            var nowDate = new Date();
            var sdf1 = nowDate.format(firstPartOfPattern);
            var sdf2 = nowDate.format(secondPartOfPattern);

            var edmDate = sdf1 + "T" + sdf2 + "-00:00";

            var messageFiscalQuarterFailed = Xrm.Utility.getResourceString(resexResourceName, "msdyn_workorder.FetchFiscalQuarter.ErrorMessage");

            currentWebApi.retrieveMultipleRecords("tc_tcfiscalquarter", "?$select=tc_name&$filter=tc_quarterstart lt " + edmDate + " and tc_quarterend gt " + edmDate + "").then(
                function success(results) {
                    for (var i = 0; i < results.entities.length; i++) {
                        var tc_name = results.entities[i]["tc_name"];
                        var tc_tcfiscalquarterid = results.entities[i]["tc_tcfiscalquarterid"];

                        glHelper.SetLookup(formContext, "ovs_fiscalquarter", "tc_tcfiscalquarter", tc_tcfiscalquarterid, tc_name);
                    }
                },
                function (error) {
                    console.log("Set Default Fiscal Quarter failed. Error :" + error.message);
                    Xrm.Navigation.openAlertDialog({ confirmButtonLabel: "OK", text: messageFiscalQuarterFailed + " " + error.message });
                }
            );
        },

        FiscalYearOnchange: function (executionContext) {

            var formContext = executionContext.getFormContext();
            formContext.getAttribute('ovs_fiscalquarter').setValue(null);
        },

        Update_WO_Substatus: function (formContext) {
            var options = new Array();
            var obj = new Object();
            var substatus = formContext.getAttribute("msdyn_substatus");

            if (substatus.getValue() !== null) {
                obj.entityType = substatus.getValue()[0].entityType;
                obj.id = substatus.getValue()[0].id;
                var key = substatus.getValue()[0].name.replace(/\s/g, '');

                obj.name = Xrm.Utility.getResourceString(resexResourceName, "msdyn_workorder.substatus." + key);
                options.push(obj);

                glHelper.SetValue(formContext, "msdyn_substatus", options);
            }
        },

        WO_SystemStatus_OnChange: function (executionContext) {

            var formContext = executionContext.getFormContext();
            var systemStatus = formContext.getAttribute("msdyn_systemstatus").getValue();


            //If system status is set to completed, closed or canceled check business logic called via custom action.
            if (systemStatus == 690970003 || systemStatus == 690970004 || systemStatus == 690970005) {
                var parameters = {};
                parameters.woId = formContext.data.entity.getId().replace("{", "").replace("}", "");
                parameters.targetedSystemStatus = systemStatus.toString();

                var ovs_WO_StatusChangePostRequest = {
                    woId: parameters.woId,
                    targetedSystemStatus: parameters.targetedSystemStatus,
                    getMetadata: function () {
                        return {
                            boundParameter: null,
                            parameterTypes: {
                                "woId": {
                                    "typeName": "Edm.String",
                                    "structuralProperty": 1
                                },
                                "targetedSystemStatus": {
                                    "typeName": "Edm.String",
                                    "structuralProperty": 1
                                }
                            },
                            operationType: 0,
                            operationName: "ovs_WO_StatusChangePost"
                        };
                    }
                };

                Xrm.WebApi.online.execute(ovs_WO_StatusChangePostRequest).then(
                    function success(result) {
                        if (result.ok) {
                            result.json().then(
                                function (responseBody) {

                                    if (responseBody.isValidToSave == false) {
                                        glHelper.SetValue(formContext, "msdyn_systemstatus", null);
                                        Xrm.Navigation.openAlertDialog({ confirmButtonLabel: "OK", text: responseBody.message });
                                    }
                                    else {
                                        //If system status is set to closed
                                        if (systemStatus == 690970004) {
                                            //Set state to Inactive
                                            formContext.getAttribute("statecode").setValue(1);
                                            //Set Status Reason to Closed
                                            formContext.getAttribute("statuscode").setValue(918640000);
                                        }
                                    }
                                }
                            );
                        }
                    },
                    function (error) {
                        Xrm.Navigation.openErrorDialog({ message: error.message });
                    }
                );
            }
            else {
                //Keep record Active
                formContext.getAttribute("statecode").setValue(0);
                formContext.getAttribute("statuscode").setValue(1);
            }
        },

        WO_SystemStatus_FilterOptionSet: function (formContext) {


            ////msdyn_systemstatus - filter OptionSet (hide "Open - In Progress")
            if (formType != glHelper.FORMTYPE_READONLY && formType != glHelper.FORMTYPE_DISABLED) {
                var options = new Array(); options[0] = 690970002;
                glHelper.filterOptionSet(formContext, "msdyn_systemstatus", options, false);
            }
        },

        ReportDataValidate: function (formContext) {

            //Xrm.Utility.showProgressIndicator("Validating ...");

            //check: primary contact with email, phone and job title; primary inspector with RIN and Badge; atleast one booking associated with WO having start date
            var isValid = true;
            errorObject.errorMessage = new Array();

            var messageReportContact = Xrm.Utility.getResourceString(resexResourceName, "msdyn_workorder.ReportValidation.Contact.ErrorMessage");
            var messageReportEmail = Xrm.Utility.getResourceString(resexResourceName, "msdyn_workorder.ReportValidation.Email.ErrorMessage");
            var messageReportFullName = Xrm.Utility.getResourceString(resexResourceName, "msdyn_workorder.ReportValidation.FullName.ErrorMessage");
            var messageReportJobTitle = Xrm.Utility.getResourceString(resexResourceName, "msdyn_workorder.ReportValidation.JobTitle.ErrorMessage");
            var messageReportPrimaryContact = Xrm.Utility.getResourceString(resexResourceName, "msdyn_workorder.ReportValidation.PrimaryContact.ErrorMessage");
            var messagePhone = Xrm.Utility.getResourceString(resexResourceName, "msdyn_workorder.ReportValidation.Phone.ErrorMessage");
            var messageBadge = Xrm.Utility.getResourceString(resexResourceName, "msdyn_workorder.ReportValidation.Badge.ErrorMessage");
            var messageRRIN = Xrm.Utility.getResourceString(resexResourceName, "msdyn_workorder.ReportValidation.RRIN.ErrorMessage");
            var messageWorkOrderNoBookings = Xrm.Utility.getResourceString(resexResourceName, "msdyn_workorder.ReportValidation.Bookings.ErrorMessage");
            var messageWorkOrderFewBookings = Xrm.Utility.getResourceString(resexResourceName, "msdyn_workorder.ReportValidation.FewBookings.ErrorMessage");
            var titlePrimaryInspector = Xrm.Utility.getResourceString(resexResourceName, "msdyn_workorder.ReportValidation.PrimaryInspector.Title");


            //check primary contact
            var site = formContext.getAttribute("msdyn_serviceaccount").getValue()[0];
            var req = new XMLHttpRequest();
            req.open("GET", clientUrl + "/api/data/v9.1/accounts(" + site.id.replace("{", "").replace("}", "") + ")?$select=_primarycontactid_value&$expand=primarycontactid($select=telephone1,emailaddress1,fullname,lastname,jobtitle)", false);
            req.setRequestHeader("OData-MaxVersion", "4.0");
            req.setRequestHeader("OData-Version", "4.0");
            req.setRequestHeader("Accept", "application/json");
            req.setRequestHeader("Content-Type", "application/json; charset=utf-8");
            req.setRequestHeader("Prefer", "odata.include-annotations=\"*\"");
            req.onreadystatechange = function () {
                if (this.readyState === 4) {
                    req.onreadystatechange = null;
                    if (this.status === 200) {
                        var result = JSON.parse(this.response);
                        if (result.hasOwnProperty("primarycontactid")) {

                            if (result["primarycontactid"]["telephone1"] == null) {
                                setReportValidationError("Site " + site.name + " " + messagePhone);
                                isValid = false;
                            }
                            if (result["primarycontactid"]["emailaddress1"] == null) {
                                setReportValidationError("Site " + site.name + " " + messageReportEmail);
                                isValid = false;
                            }
                            if (result["primarycontactid"]["lastname"] == null || result["primarycontactid"]["lastname"] == "") {
                                setReportValidationError("Site " + site.name + " " + messageReportFullName);
                                isValid = false;
                            }
                            if (result["primarycontactid"]["jobtitle"] == null || result["primarycontactid"]["jobtitle"] == "") {
                                setReportValidationError("Site " + site.name + " " + messageReportJobTitle);
                                isValid = false;
                            }
                        }
                        else {
                            setReportValidationError("Site " + site.name + " " + messageReportContact);
                            isValid = false;
                        }

                        //Xrm.Utility.closeProgressIndicator();

                    } else {
                        //Xrm.Utility.closeProgressIndicator();
                        Xrm.Navigation.openErrorDialog({ message: this.statusText });
                    }
                }
            };
            req.send();

            //check primary inspector            
            var prmInspector = formContext.getAttribute("ovs_primaryinspector").getValue()[0];
            var req = new XMLHttpRequest();
            req.open("GET", clientUrl + "/api/data/v9.1/bookableresources(" + prmInspector.id.replace("{", "").replace("}", "") + ")?$select=ovs_registeredinspectornumberrin,ovs_badgenumber&$expand=UserId($select=address1_telephone1,domainname,internalemailaddress,fullname)", false);
            req.setRequestHeader("OData-MaxVersion", "4.0");
            req.setRequestHeader("OData-Version", "4.0");
            req.setRequestHeader("Accept", "application/json");
            req.setRequestHeader("Content-Type", "application/json; charset=utf-8");
            req.setRequestHeader("Prefer", "odata.include-annotations=\"*\"");
            req.onreadystatechange = function () {
                if (this.readyState === 4) {
                    req.onreadystatechange = null;
                    if (this.status === 200) {
                        var result = JSON.parse(this.response);
                        if (result["ovs_badgenumber"] == null || result["ovs_badgenumber"] == "") {
                            setReportValidationError(titlePrimaryInspector + " " + prmInspector.name + " " + messageBadge);
                            isValid = false;
                        } if (result["ovs_registeredinspectornumberrin"] == null || result["ovs_registeredinspectornumberrin"] == "") {
                            setReportValidationError(titlePrimaryInspector + " " + prmInspector.name + " " + messageRRIN);
                            isValid = false;
                        }
                        if (result.hasOwnProperty("UserId")) {
                            if (result["UserId"]["address1_telephone1"] == null) {
                                setReportValidationError(titlePrimaryInspector + " " + prmInspector.name + " " + messagePhone);
                                isValid = false;
                            }
                            if (result["UserId"]["internalemailaddress"] == null
                                && result["UserId"]["domainname"] == null) {
                                setReportValidationError(titlePrimaryInspector + " " + prmInspector.name + " " + messageReportEmail);
                                isValid = false;
                            } if (result["UserId"]["fullname"] == null || result["UserId"]["fullname"] == "") {
                                setReportValidationError(messageReportFullName);
                                isValid = false;
                            }
                        }
                        else {
                            setReportValidationError(titlePrimaryInspector + " " + prmInspector.name + " is not associated with any user in the system");
                            isValid = false;
                        }
                    } else {
                        //Xrm.Utility.closeProgressIndicator();
                        Xrm.Navigation.openErrorDialog({ message: this.statusText });
                    }
                }
            };
            req.send();

            //check booking
            var req = new XMLHttpRequest();
            req.open("GET", clientUrl + "/api/data/v9.1/bookableresourcebookings?$select=starttime&$filter=starttime ne null and statecode eq 0 and _msdyn_workorder_value eq " + formContext.data.entity.getId().replace("{", "").replace("}", ""), false);
            req.setRequestHeader("OData-MaxVersion", "4.0");
            req.setRequestHeader("OData-Version", "4.0");
            req.setRequestHeader("Accept", "application/json");
            req.setRequestHeader("Content-Type", "application/json; charset=utf-8");
            req.setRequestHeader("Prefer", "odata.maxpagesize=1");
            req.onreadystatechange = function () {
                if (this.readyState === 4) {
                    req.onreadystatechange = null;
                    if (this.status === 200) {
                        var results = JSON.parse(this.response);
                        if (results.value.length == 0) {
                            isValid = false;
                            setReportValidationError(messageWorkOrderNoBookings);
                        }
                    } else {
                        //Xrm.Utility.closeProgressIndicator();
                        Xrm.Navigation.openErrorDialog({ message: this.statusText });
                    }

                    //Xrm.Utility.closeProgressIndicator();
                }
            };
            req.send();

            errorObject.isValid = isValid;

            //Xrm.Utility.closeProgressIndicator();
            return isValid;
        },

        filterOversigthType: function () {
            
            var filter = "<filter type='and'><condition attribute='accountcategorycode' operator='eq' value='1'/></filter>";
            formContext.getControl("ovs_oversighttype").addCustomFilter(filter, "ovs_oversighttype");
        },

        filterRegion: function () {

            var filter = "<filter type='and'><condition attribute='accountcategorycode' operator='eq' value='1'/></filter>";
            formContext.getControl("msdyn_serviceterritory").addCustomFilter(filter, "territory");
        },

        Operation_OnChange: function (executionContext) {

            var formContext = executionContext.getFormContext();

            //------------  add pre-filter for Oversight Type ---------------------//

            //if selected operation has a Operation Type value of HOTI, then the Oversight Types should be filtered to only those with the English name starting with "GC"

            //add hoti related OperationType optionset values
            var hoti = new Array();//array of integers

            //if selected operation has a Operation Type value of Civil Aviation Document Review, then Oversight Types should be filtered so that Civil Aviation Document Review is the only Oversight Type.
            //add Civil Aviation related OperationType optionset values
            var avion = new Array();//array of integers


            //ELSE
            //the Oversight Types should be filtered to only those with the English name starting with "MOC".
            //add MOC related OperationType optionset values
            var MOCs = new Array();//array of integers


            var operation = formContext.getAttribute("ovs_mocoperationid").getValue();
            if (operation === null || operation === undefined) return;

            //get Operation type and add pre-search on callback using arrays then add presearch

            //formContext.getControl("ovs_oversighttype").addPreSearch("create method");

            //-------------   end pre-filter for Oversight Type ------------//

            //-------------  add pre-filter for Region ---------------------//

            //if selected operation has a Line of Business value of TDG Region, then HQ-ES should be filtered out of the Work Order region lookup list 

            //if the operation has a Line of Business value of Engineering Services, then HQ - EQ should be automatically selected as the Work Order Region





             //-------------  end pre-filter for Region ---------------------//


        },

        errorObject: errorObject,
    }


    //********************public methods end***************

})(window, document)

