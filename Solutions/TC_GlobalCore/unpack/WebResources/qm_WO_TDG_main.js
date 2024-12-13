///<reference path="../../Utilities/GlobalHelper.js"/>
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
    var OperationTypeGlobalValue;
    var OperationTypeGlobalText;
    var isOnLoad = false;
    var isSiteOnLoad = false;
    var k_inspection_setting_onsite = 0;
    var k_inspection_setting_remote = 1;
    var k_inspection_setting_hybrid = 2;
    var msdyn_systemstatus_list = [];
    var CurrentWoStatus;
    var GC_Oversites_Types_Id = [
        "018d22b2-c3fe-eb11-94f0-0022483c6f5e",
        "460b6c2a-5f9c-eb11-b1ac-000d3ae92708",
        "1cd7bd09-279e-eb11-b1ac-000d3ae924d1",
        "50d0bdf1-269e-eb11-b1ac-000d3ae924d1",
        "07966e1c-5f9c-eb11-b1ac-000d3ae92708",
        "72afccd3-269e-eb11-b1ac-000d3ae924d1",
        "9dee7316-5f9c-eb11-b1ac-000d3ae92708"
    ];

    //********************private methods*******************

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

                    debugger;

                    if (results.hasOwnProperty("territoryid") && results["territoryid"] != null) {
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
                    if (_territoryid_value)
                        glHelper.SetLookup(formContext, "msdyn_serviceterritory", _territoryid_value_lookuplogicalname, _territoryid_value, formattedLang);
                }
            },
            function (error) {

                console.log("getSetInspectorRegion method.Error :" + error.message);
                Xrm.Navigation.openAlertDialog({ confirmButtonLabel: "OK", text: messageRegionFailed + " " + error.message });
            }
        );
    }

    function setInspectionType(formContext, inspectionType) {

        var messageWOTypeFailed = Xrm.Utility.getResourceString(resexResourceName, "msdyn_workorder.FetchWorkOrderType.ErrorMessage");
        var sActivityName = glHelper.GetLookupName(formContext, "ovs_oversighttype");

        //offline filter fix
        var filter = (isOffLine && clientType > 0)
            ? "ovs_workordertypenameenglish eq '{0}'"
            : "startswith(ovs_workordertypenameenglish,'{0}')";

        //unmanaged change 2022-02-14
        //determine if user is in Planner app, do not lock rational if so
        //========================================================
        var globalContext = Xrm.Utility.getGlobalContext();
        globalContext.getCurrentAppName().then(function (appName) {
            var isPlannerApp = appName.indexOf("Planner") != -1;

            if (!isPlannerApp) {
                glHelper.SetDisabled(formContext, "ovs_rational", true);
            }
        });
        //========================================================

        //Set WO Type based on Activity Type
        if (inspectionType == 0) {
            currentWebApi.retrieveMultipleRecords("msdyn_workordertype", "?$select=msdyn_workordertypeid,ovs_workordertypenameenglish,ovs_workordertypenamefrench&$filter=" + filter.replace("{0}", "Regulatory Authorization")).then(
                function success(results) {
                    debugger;

                    var englishName = results.entities[0]["ovs_workordertypenameenglish"];
                    var frenchName = results.entities[0]["ovs_workordertypenamefrench"];
                    var workOrderTypeId = results.entities[0]["msdyn_workordertypeid"];

                    if (userSettings.languageId == 1036)
                        glHelper.SetLookup(formContext, "msdyn_workordertype", "msdyn_workordertype", workOrderTypeId, frenchName);
                    if (userSettings.languageId == 1033)
                        glHelper.SetLookup(formContext, "msdyn_workordertype", "msdyn_workordertype", workOrderTypeId, englishName);

                    currentWebApi.retrieveMultipleRecords("msdyn_incidenttype", "?$select=msdyn_incidenttypeid,ovs_incidenttypenameenglish,ovs_incidenttypenamefrench&$filter=ovs_incidenttypenameenglish eq 'Regulatory%20Authorization'").then(
                        function success(results) {
                            var msdyn_incidenttypeid = results.entities[0]["msdyn_incidenttypeid"];
                            var ovs_incidenttypenameenglish = results.entities[0]["ovs_incidenttypenameenglish"];
                            var ovs_incidenttypenamefrench = results.entities[0]["ovs_incidenttypenamefrench"];

                            if (userSettings.languageId == 1036)
                                glHelper.SetLookup(formContext, "msdyn_primaryincidenttype", "msdyn_incidenttype", msdyn_incidenttypeid, ovs_incidenttypenamefrench);
                            if (userSettings.languageId == 1033)
                                glHelper.SetLookup(formContext, "msdyn_primaryincidenttype", "msdyn_incidenttype", msdyn_incidenttypeid, ovs_incidenttypenameenglish);
                        },
                        function (error) {
                            Xrm.Navigation.openErrorDialog({ message: error.message });
                        }
                    );

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
                    debugger;

                    var englishName = results.entities[0]["ovs_workordertypenameenglish"];
                    var frenchName = results.entities[0]["ovs_workordertypenamefrench"];
                    var workOrderTypeId = results.entities[0]["msdyn_workordertypeid"];

                    if (userSettings.languageId == 1036)
                        glHelper.SetLookup(formContext, "msdyn_workordertype", "msdyn_workordertype", workOrderTypeId, frenchName);
                    if (userSettings.languageId == 1033)
                        glHelper.SetLookup(formContext, "msdyn_workordertype", "msdyn_workordertype", workOrderTypeId, englishName);

                    currentWebApi.retrieveMultipleRecords("msdyn_incidenttype", "?$select=msdyn_incidenttypeid,ovs_incidenttypenameenglish,ovs_incidenttypenamefrench&$filter=ovs_incidenttypenameenglish eq 'Inspection'")
                        .then(
                            function success(results) {
                                var msdyn_incidenttypeid = results.entities[0]["msdyn_incidenttypeid"];
                                var ovs_incidenttypenameenglish = results.entities[0]["ovs_incidenttypenameenglish"];
                                var ovs_incidenttypenamefrench = results.entities[0]["ovs_incidenttypenamefrench"];

                                if (userSettings.languageId == 1036)
                                    glHelper.SetLookup(formContext, "msdyn_primaryincidenttype", "msdyn_incidenttype", msdyn_incidenttypeid, ovs_incidenttypenamefrench);
                                if (userSettings.languageId == 1033)
                                    glHelper.SetLookup(formContext, "msdyn_primaryincidenttype", "msdyn_incidenttype", msdyn_incidenttypeid, ovs_incidenttypenameenglish);
                            },
                            function (error) {
                                Xrm.Navigation.openErrorDialog({ message: error.message });
                            }
                        );
                },
                function (error) {
                    console.log(messageWOTypeFailed + " " + error.message);
                    Xrm.Navigation.openAlertDialog({ confirmButtonLabel: "OK", text: messageWOTypeFailed + " " + error.message });
                }
            );
        }
    }

    function hideOrShowTabs(formContext, isCivilAviationDocument) {
        var profileTab = formContext.ui.tabs.get("tab_14");
        var violationTab = formContext.ui.tabs.get("tab_10");
        var tab_InspectionReport = formContext.ui.tabs.get("tab_InspectionReport");
        var cocTab = formContext.ui.tabs.get("tab_ConfirmationOfCompliances");
        var postinspectTab = formContext.ui.tabs.get("tab_PostInspection");
        var statTab = formContext.ui.tabs.get("tab_cepdata");
        var recommendation = formContext.getControl("ovs_recommendation");
        //var remote = formContext.getControl("qm_remote");

        profileTab.setVisible(isCivilAviationDocument);
        violationTab.setVisible(isCivilAviationDocument);
        //inspectReportTab.setVisible(isCivilAviationDocument);
        cocTab.setVisible(isCivilAviationDocument);
        postinspectTab.setVisible(isCivilAviationDocument);
        statTab.setVisible(isCivilAviationDocument);
        recommendation.setVisible(!isCivilAviationDocument);
        //remote.setVisible(isCivilAviationDocument);

        var ovs_oversighttype = formContext.getAttribute("ovs_oversighttype").getValue()[0].id;
        if (ovs_oversighttype == '{A4965081-5F9C-EB11-B1AC-000D3AE92708}')
        {
            tab_InspectionReport.setVisible(false);
        }
    }

    function manager_approval(formContext) {
        //debugger;

        var ma = formContext.getAttribute("ovs_manager_approval").getValue();
        ma = (ma == null ? -1 : ma);
        glHelper.SetDisabled(formContext, "ovs_inspection_setting", false);
    }

    function inspection_setting(formContext) {
        debugger;

        glHelper.SetRequiredLevel(formContext, "ovs_manager_approval", false);
        var ma = formContext.getControl("ovs_manager_approval");
        ma.setVisible(false);

        var is = formContext.getAttribute("ovs_inspection_setting").getValue();
        if (is == k_inspection_setting_remote || is == k_inspection_setting_hybrid) {
            var pre_approved = formContext.getAttribute("ovs_pre_approved_for_remote_inspection").getValue();
            if (!pre_approved) {
                ma.setVisible(true);

                var isManager = (glHelper.hasCurrentUserRole("TDG Manager"))
                glHelper.SetControlReadOnly(formContext, "ovs_manager_approval", !isManager);
                glHelper.SetRequiredLevel(formContext, "ovs_manager_approval", isManager);
            }
        }
        //manager_approval(formContext);
    }

    function suitability_assessment(formContext) {
        //debugger;

        var sa = formContext.getAttribute("ovs_suitability_assessment").getValue();
        if (sa) {
            glHelper.SetDisabled(formContext, "ovs_inspection_setting", false);
        }
        else {
            glHelper.SetDisabled(formContext, "ovs_inspection_setting", true);
            formContext.getAttribute("ovs_inspection_setting").setValue(k_inspection_setting_onsite);
        }
        inspection_setting(formContext);

        //var isAnalyst = (glHelper.hasCurrentUserRole("TDG Analyst"))
        //glHelper.SetDisabled(formContext, "ovs_suitability_assessment", isAnalyst);
    }

    function inspection_setting_setup(formContext) {
        debugger;

        var pre_approved = formContext.getAttribute("ovs_pre_approved_for_remote_inspection").getValue();
        if (pre_approved) {
            formContext.getControl("ovs_manager_approval").setVisible(false);
            //formContext.getAttribute("ovs_inspection_setting").setValue(k_inspection_setting_remote);
        }
        else {
            glHelper.SetDisabled(formContext, "ovs_inspection_setting", false);
            suitability_assessment(formContext);
        }

        //var isAnalyst = (glHelper.hasCurrentUserRole("TDG Analyst"))
        //glHelper.SetDisabled(formContext, "ovs_suitability_assessment", isAnalyst);
    }

    //********************private methods end***************

    //********************public methods***************
    return {

        OnLoad: function (executionContext) {
            debugger;
            isSiteOnLoad = true;
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

            //oversight activity
            
            var ovs_oversighttype = formContext.getAttribute("ovs_oversighttype");
            ovs_oversighttype.removeOnChange(WO_TDG_main.ovs_oversighttype_OnChange);
            ovs_oversighttype.addOnChange(WO_TDG_main.ovs_oversighttype_OnChange);
            ovs_oversighttype.fireOnChange();
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
            CurrentWoStatus = formContext.getAttribute("msdyn_systemstatus").getValue();

            //WO Number/msdyn_name
            glHelper.SetControlVisibility(formContext, "msdyn_name", false);

            //move to operation on change to work sequentialy - no Oversight Type can be selected befor operation is set.
            ////Activity Type
            //var activityType = formContext.getAttribute("ovs_oversighttype");
            //activityType.removeOnChange(WO_TDG_main.ActivityType_OnChange);
            //activityType.addOnChange(WO_TDG_main.ActivityType_OnChange);

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

                // hide inspection section
                var sect_is = formContext.ui.tabs.get("tab_summary").sections.get("sect_inspection_setting");
                sect_is.setVisible(false);
            }

            //on update etc
            if (formType > 1) {
                //set global object fo contact quick create form
                site.fireOnChange();

                //refresh the COC tab
                var cocTab = formContext.ui.tabs.get(
                    "tab_ConfirmationOfCompliances"
                );
                cocTab.removeTabStateChange(
                    WO_TDG_main.OnConfirmationOfCompliance_StateChange
                );
                cocTab.addTabStateChange(
                    WO_TDG_main.OnConfirmationOfCompliance_StateChange
                );

                ///////// SEAT popup warning message
                var gridSEAT = formContext.getControl("subgrid_safetyAssessment");
                gridSEAT.removeOnLoad(WO_TDG_main.SubgridSafetyAssessment_OnLoad);
                gridSEAT.addOnLoad(WO_TDG_main.SubgridSafetyAssessment_OnLoad);
                //need to referesh the grid after page onload, sometimes it does not automatically do it for the above event to get called.
                gridSEAT.refresh();
                ///////////

                // hide inspection section
                var sect_is = formContext.ui.tabs.get("tab_summary").sections.get("sect_inspection_setting");
                sect_is.setVisible(true);

                if (formContext.getAttribute("msdyn_workordertype").getValue()[0].id.replace(/[{}]/g, '').toUpperCase() == "46706C0A-AD60-EB11-A812-000D3AE9471C") sect_is.setVisible(false);

                var pre_approved = formContext.getAttribute("ovs_pre_approved_for_remote_inspection");
                pre_approved.addOnChange(function () { inspection_setting_setup(formContext) });
                inspection_setting_setup(formContext);

                if (!pre_approved.getValue()) {
                    var sa = formContext.getAttribute("ovs_suitability_assessment");
                    sa.addOnChange(function () { suitability_assessment(formContext) });

                    var ma = formContext.getAttribute("ovs_manager_approval");
                    ma.addOnChange(function () { manager_approval(formContext) });

                    var is = formContext.getAttribute("ovs_inspection_setting");
                    is.addOnChange(function () { inspection_setting(formContext) });
                }

                var isPlanner = (glHelper.hasCurrentUserRole("TDG Planner"))
                glHelper.SetDisabled(formContext, "ovs_pre_approved_for_remote_inspection", !isPlanner);
            }

            // Set Oversight Activity field as Mandatory
            glHelper.SetRequiredLevel(formContext, "ovs_oversighttype", true);

            // make Operation required -> move to designer once testing is done 
            //glHelper.SetRequiredLevel(formContext, "ovs_mocoperationid", true);
            //pre-filter Oversith Type and Region
            operation.fireOnChange();

            WO_TDG_main.getOverSightType(executionContext);

            //WO_TDG_main.setRecommendationRequired(executionContext);

            //WO_TDG_main.setDefaultInspectionSynopsis(executionContext);  
            var sect_ins = formContext.ui.tabs.get("tab_summary").sections.get("sect_inspection_setting");

            debugger;
            var msdyn_workordertype = formContext.getAttribute("msdyn_workordertype").getValue();
            if (msdyn_workordertype != null) {
                if (msdyn_workordertype[0].id.replace(/[{}]/g, '').toUpperCase() == "46706C0A-AD60-EB11-A812-000D3AE9471C")
                    sect_ins.setVisible(false);
            }
        },

        SubgridSafetyAssessment_OnLoad: function (executionContext) {

            // if active status, remind the user to mark complete with pop up message.
            let formContext = executionContext.getFormContext();
            let workOrderId = formContext.data.entity.getId().replace("{", "").replace("}", "")
            const seatWarningMessage = Xrm.Utility.getResourceString(resexResourceName, "msdyn_workorder.ActiveSEAT.WarningMessage");
            let active = 1;

            currentWebApi.retrieveMultipleRecords("ovs_cysafetyassessment", `?$select=ovs_name&$filter=statuscode eq ${active} and _ovs_inspectionid_value eq ${workOrderId}`).then(
                function success(result) {
                    const count = result.entities.length;
                    if (count > 0) {
                        glHelper.DisplayFormNotification(seatWarningMessage, "WARNING", 10000);
                    }
                },
                function (error) {

                    Xrm.Navigation.openErrorDialog({ message: error.message });
                }
            );
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
            //debugger;
            if (isSiteOnLoad == true)
            {
                isSiteOnLoad = false;
                return;
            }
            var formContext = executionContext.getFormContext();

            try
            {
                var site = formContext.getAttribute("msdyn_serviceaccount").getValue()[0];

                globalObj.site = {};
                globalObj.site.id = site.id;
                globalObj.site.et = site.entityType;
                globalObj.site.name = site.name;
            }
            catch (e) {
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

        ovs_oversighttype_OnChange: function (executionContext) {
            var globalContext = Xrm.Utility.getGlobalContext();
            var formContext = executionContext.getFormContext();
            //get current rational
            var oversightType = glHelper.GetLookupName(formContext, "ovs_oversighttype");
            var oversightTypeId;
            if (formContext.getAttribute("ovs_oversighttype").getValue() != null) {
                oversightTypeId = glHelper.GetLookupAttrId(formContext, "ovs_oversighttype").replace('{', '').replace('}', '');

                if (GC_Oversites_Types_Id.includes(oversightTypeId.toLowerCase())) {
                    //show modes section
                    glHelper.SetSectionVisibility(formContext, "tab_summary", "tab_summary_section_modes", true);
                }
                else {
                    glHelper.SetSectionVisibility(formContext, "tab_summary", "tab_summary_section_modes", false);
                }

                if (oversightType == "GC Consignment"
                    || oversightType == "Envoi CG"
                    || oversightType == "GC Undeclared/ Misdeclared"
                    || oversightType == "CG non déclaré / mal déclaré"
                    || oversightType == "MOC Consignment"
                    || oversightType == "Envoi MOC") {
                    //show section of the consignment address
                    glHelper.SetSectionVisibility(formContext, "tab_summary", "tab_summary_section_8", true);
                    glHelper.SetSectionVisibility(formContext, "tab_summary", "tab_8_section_2", true);
                    //set address required
                    glHelper.SetRequiredLevel(formContext, "msdyn_address1", true);
                    glHelper.SetRequiredLevel(formContext, "msdyn_stateorprovince", true);
                    glHelper.SetRequiredLevel(formContext, "msdyn_postalcode", true);
                    glHelper.SetRequiredLevel(formContext, "msdyn_country", true);
                    glHelper.SetRequiredLevel(formContext, "msdyn_city", true);
                }
                else {
                    glHelper.SetSectionVisibility(formContext, "tab_summary", "tab_summary_section_8", false);
                    glHelper.SetSectionVisibility(formContext, "tab_summary", "tab_8_section_2", false);

                    //set address not required
                    glHelper.SetRequiredLevel(formContext, "msdyn_address1", false);
                    glHelper.SetRequiredLevel(formContext, "msdyn_stateorprovince", false);
                    glHelper.SetRequiredLevel(formContext, "msdyn_postalcode", false);
                    glHelper.SetRequiredLevel(formContext, "msdyn_country", false);
                    glHelper.SetRequiredLevel(formContext, "msdyn_city", false);
                }
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

                if (isAnalytic
                    //|| isPlanner
                ) return;

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

                                readOnlyArray = new Array("ovs_rational", "msdyn_closedby", "msdyn_timeclosed", "ovs_qcreviewcomments", "ovs_qcreviewcompletedind", "msdyn_workordertype", "ovs_source");

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
                    else if (isPlanner)
                    {
                        glHelper.SetRequiredLevel(formContext, "ovs_rational", true);
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
                                readOnlyArray = new Array("msdyn_serviceaccount", "ovs_mocoperationid", "ovs_oversighttype", "ovs_fiscalyear", "msdyn_workordertype", "ovs_rational", "msdyn_closedby", "msdyn_timeclosed", "ovs_source"); //"ovs_fiscalquarter", "msdyn_serviceterritory",
                                //editableArray = new Array("qm_remote");
                            }
                            else {
                                readOnlyArray = new Array("msdyn_workordertype", "ovs_rational", "ovs_source");
                                //editableArray = new Array("msdyn_serviceaccount", "qm_remote", "ovs_oversighttype", "ovs_fiscalyear", "ovs_fiscalquarter", "msdyn_serviceterritory");
                                editableArray = new Array("msdyn_serviceaccount", "ovs_oversighttype", "ovs_fiscalyear", "ovs_fiscalquarter", "msdyn_serviceterritory");
                            }
                            break;
                        case "Inspector Offline":
                        case "TDG Inspections / Inspections TMD":
                            if (isPlanned && formType != glHelper.FORMTYPE_READONLY && formType != glHelper.FORMTYPE_DISABLED) {
                                readOnlyArray = new Array("msdyn_serviceaccount", "ovs_mocoperationid", "ovs_oversighttype", "ovs_fiscalyear", "ovs_fiscalquarter", "ovs_revisedquarterid", "msdyn_workordertype", "ovs_rational", "msdyn_closedby", "msdyn_timeclosed", "ovs_qcreviewcomments", "ovs_qcreviewcompletedind", "ovs_primaryinspector", "ovs_source"); //"msdyn_serviceterritory",
                                //editableArray = new Array("qm_remote");
                            }
                            else {
                                readOnlyArray = new Array("msdyn_workordertype", "ovs_rational", "ovs_source");
                                //editableArray = new Array("msdyn_serviceaccount", "ovs_mocoperationid", "qm_remote", "ovs_oversighttype", "ovs_fiscalyear", "ovs_fiscalquarter", "ovs_revisedquarterid", "msdyn_serviceterritory"); //"ovs_rational" - cannot set editable => will set all fields editable
                                editableArray = new Array("msdyn_serviceaccount", "ovs_mocoperationid", "ovs_oversighttype", "ovs_fiscalyear", "ovs_fiscalquarter", "ovs_revisedquarterid", "msdyn_serviceterritory"); //"ovs_rational" - cannot set editable => will set all fields editable
                            }

                            ////hiddenArray = new Array("msdyn_serviceterritory", "msdyn_workordertype");
                            ////msdyn_systemstatus - filter OptionSet (exclude Closed - Cancelled)
                            //if (formType != glHelper.FORMTYPE_READONLY && formType != glHelper.FORMTYPE_DISABLED) {

                            //    var options = new Array(); options[0] = 690970005;
                            //    glHelper.filterOptionSet(formContext, "msdyn_systemstatus", options, false);
                            //}

                            break;
                        case "TDG Planner / Planificateur TMD":
                            {
                                glHelper.SetRequiredLevel(formContext, "ovs_rational", true);

                            }
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

            // Filter WO_SystemStatus (hide "Open - In Progress")
            WO_TDG_main.WO_SystemStatus_FilterOptionSet(formContext, isPlanned);

           
            //Filter Oversight Lookup
            if (isPlanned) {
                var formContext = executionContext.getFormContext();
                formContext.getControl("ovs_oversighttype").setDefaultView("d54acdca-91a7-eb11-9442-000d3ae99322");
            }
            else {
                var formContext = executionContext.getFormContext();
                formContext.getControl("ovs_oversighttype").setDefaultView("920688A2-94A7-EB11-9442-000D3AE99322");
            }

            //reset oversight type so that user must re-pick
            //dont erase the value onload as this function is fired at that event, only run when rational actually changes
            if (!isOnLoad)
            {
              glHelper.SetValue(formContext, "ovs_oversighttype", null);
            }
            isOnLoad = false; //set to false so next time when the event is fired we can go inside the condition.
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
            debugger;
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
                                        //set modes fields requirement level based on status and display message if anyone of them is null when user trying to close WO
                                        WO_TDG_main.setModesRequiredBasedOnWOStatus(formContext, systemStatus);
                                        //refresh system status because system might reset back the value of modes are entered for certain scenarios
                                        systemStatus = formContext.getAttribute("msdyn_systemstatus").getValue();
                                        //If system status is set to closed
                                        if (systemStatus == 690970004) {
                                            //Set required Recommendation - 244620
                                            WO_TDG_main.setRecommendationRequired(executionContext);
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

        WO_SystemStatus_FilterOptionSet: function (formContext, isPlanned) {
            //debugger;
            var ovs_oversighttypeOBJ = formContext.getAttribute("ovs_oversighttype").getValue();
            if (ovs_oversighttypeOBJ == null) return;
            var ovs_oversighttype = ovs_oversighttypeOBJ[0].id;
            ////msdyn_systemstatus - filter OptionSet (hide "Open - In Progress")
            if (formType != glHelper.FORMTYPE_READONLY && formType != glHelper.FORMTYPE_DISABLED) {
                var options = new Array();
                options.push(690970002);
                //if it's wo is planned then exclude Closed - Cancelled
                if (isPlanned) options.push(690970005);
                // If it's wo oversight activity = Civil Aviation Document Review then exclude " Open - Complete "
                if (ovs_oversighttype == '{A4965081-5F9C-EB11-B1AC-000D3AE92708}') options.push(690970003);
                
                glHelper.filterOptionSet(formContext, "msdyn_systemstatus", options, false);
            }
        },

        filterOversigthType: function (executionContext) {

            var filter = "";
            var formContext = executionContext.getFormContext();
            var filterTemplate = "<filter type='and'><condition attribute='ovs_oversighttypenameenglish' operator='like' value='{0}'/></filter>";

            switch (OperationTypeGlobalValue) {

                case 918640038: case 918640042: filter = filterTemplate.replace('{0}', 'GC%'); break;//HOTI and HOTI-GOA
                case 918640040: filter = filterTemplate.replace('{0}', 'Civil%'); break;
                default: filter = filterTemplate.replace('{0}', 'MOC%');
            }

            formContext.getControl("ovs_oversighttype").addCustomFilter(filter, "ovs_oversighttype");
        },

        Operation_OnChange: function (executionContext) {

            var formContext = executionContext.getFormContext();

            var operation = formContext.getAttribute("ovs_mocoperationid").getValue();
            if (operation === null || operation === undefined) {

                //set oversight type and inspection type empty

                glHelper.SetValue(formContext, "ovs_oversighttype", null);
                glHelper.SetValue(formContext, "msdyn_workordertype", null);
                glHelper.SetDisabled(formContext, "ovs_oversighttype", true);
                return;
            }

            currentWebApi.retrieveRecord("ovs_mocregistration", operation[0].id, "?$select=_ovs_lineofbusiness_value,ovs_mocregistrationid,ovs_name,ovs_operationtype").then(
                function success(result) {
                    var _ovs_lineofbusiness_value = result["_ovs_lineofbusiness_value"];
                    var _ovs_lineofbusiness_value_formatted = result["_ovs_lineofbusiness_value@OData.Community.Display.V1.FormattedValue"];
                    var _ovs_lineofbusiness_value_lookuplogicalname = result["_ovs_lineofbusiness_value@Microsoft.Dynamics.CRM.lookuplogicalname"];
                    var ovs_mocregistrationid = result["ovs_mocregistrationid"];
                    var ovs_name = result["ovs_name"];
                    OperationTypeGlobalValue = result["ovs_operationtype"];
                    OperationTypeGlobalText = result["ovs_operationtype@OData.Community.Display.V1.FormattedValue"];

                    //-----  add pre-filter for Oversight Type -------------//
                    formContext.getControl("ovs_oversighttype").removePreSearch(WO_TDG_main.filterOversigthType)
                    formContext.getControl("ovs_oversighttype").addPreSearch(WO_TDG_main.filterOversigthType);

                    if (OperationTypeGlobalValue == 918640040) {

                        var sActivityName = glHelper.GetLookupName(formContext, "ovs_oversighttype");

                        //If aviation is already selected
                        if (sActivityName == "Civil Aviation Document Review" || sActivityName == "Examen des documents de l'aviation civile" || sActivityName == "Examen documentation de l'aviation civile") {

                            glHelper.SetDisabled(formContext, "ovs_oversighttype", true);
                            WO_TDG_main.getOverSightType(executionContext);
                        }
                        else {

                            //offline filter fix
                            var filter = (isOffLine && clientType > 0)
                                ? "ovs_oversighttypenameenglish eq 'Civil%20Aviation%20Document%20Review'"
                                : "startswith(ovs_oversighttypenameenglish,'Civil%20Aviation%20Document%20Review')";

                            currentWebApi.retrieveMultipleRecords("ovs_oversighttype", "?$select=ovs_oversighttypeid,ovs_oversighttypenameenglish,ovs_oversighttypenamefrench&$filter=" + filter).then(
                                function success(results) {
                                    var ovs_oversighttypeid = results.entities[0]["ovs_oversighttypeid"];
                                    var ovs_oversighttypenameenglish = results.entities[0]["ovs_oversighttypenameenglish"];
                                    var ovs_oversighttypenamefrench = results.entities[0]["ovs_oversighttypenamefrench"];


                                    if (userSettings.languageId == 1036)
                                        glHelper.SetLookup(formContext, "ovs_oversighttype", "ovs_oversighttype", ovs_oversighttypeid, ovs_oversighttypenamefrench);
                                    if (userSettings.languageId == 1033)
                                        glHelper.SetLookup(formContext, "ovs_oversighttype", "ovs_oversighttype", ovs_oversighttypeid, ovs_oversighttypenameenglish);

                                    glHelper.SetDisabled(formContext, "ovs_oversighttype", true);

                                    setInspectionType(formContext, 0);

                                    WO_TDG_main.getOverSightType(executionContext);
                                },
                                function (error) {
                                    Xrm.Navigation.openErrorDialog({ message: error.message });
                                }
                            );

                        }
                    }//not an aviation
                    else {
                        setInspectionType(formContext, 1);
                        glHelper.SetDisabled(formContext, "ovs_oversighttype", false);
                    }

                    //-------------   end pre-filter for Oversight Type ------------//

                },
                function (error) {
                    Xrm.Navigation.openErrorDialog({ message: error.message });

                }
            );
        },

        getOverSightType: function (executionContext) {
            
            var formContext = executionContext.getFormContext();
            var osTypeObj = formContext.getAttribute("ovs_oversighttype").getValue();

            if (osTypeObj != null) {

                var osType = glHelper.GetLookupName(formContext, "ovs_oversighttype");

                if (osType.toString() == "Civil Aviation Document Review" || osType.toString() == "Examen des documents de l'aviation civile") {
                    hideOrShowTabs(formContext, false);
                } else {
                    hideOrShowTabs(formContext, true);
                }
            }
        },
        setRecommendationRequired: function (executionContext) {
            var formContext = executionContext.getFormContext();

            if (formType == 1) {
                glHelper.SetRequiredLevel(formContext, "ovs_recommendation", false);
            } else {
                glHelper.SetRequiredLevel(formContext, "ovs_recommendation", true);
            }
        },

        setModesRequiredBasedOnWOStatus: function (formContext, systemStatus) {
            var oversightTypeId = glHelper.GetLookupAttrId(formContext, "ovs_oversighttype").replace('{', '').replace('}', '');
 
            debugger;
            if (systemStatus == 690970004 && GC_Oversites_Types_Id.includes(oversightTypeId.toLowerCase())) {
                glHelper.SetRequiredLevel(formContext, "ovs_air_cd", true);
                glHelper.SetRequiredLevel(formContext, "ovs_road_cd", true);
                glHelper.SetRequiredLevel(formContext, "ovs_rail_cd", true);
                glHelper.SetRequiredLevel(formContext, "ovs_marine_cd", true);

                var ModeAirValue = formContext.getAttribute("ovs_air_cd").getValue(); 
                var ModeRoadValue = formContext.getAttribute("ovs_road_cd").getValue(); 
                var ModeRailValue = formContext.getAttribute("ovs_rail_cd").getValue(); 
                var ModeMarineValue = formContext.getAttribute("ovs_marine_cd").getValue(); 

                if (ModeAirValue != null &&  ModeRoadValue != null && ModeMarineValue != null && ModeRailValue != null) {
                   
                    CurrentWoStatus = systemStatus;

                }
                else {
                   
                    var ModesErrorMessage = "";
                    if (LCID == 1033)
                        ModesErrorMessage = "The user must indicate which Modes of Transportation were or were not inspected before this Work Order can be set as Closed - Posted.";
                    else if (LCID == 1036)
                        ModesErrorMessage = "L'utilisateur doit indiquer quels modes de transport ont été ou n'ont pas été inspectés avant que l'ordre de travail puisse être défini comme étant Fermé-Publié.";
                    //reset back the status to pervious one
                    glHelper.SetValue(formContext, "msdyn_systemstatus", CurrentWoStatus);
                    Xrm.Navigation.openAlertDialog({ confirmButtonLabel: "OK", text: ModesErrorMessage });
                }

            }
            else {
                glHelper.SetRequiredLevel(formContext, "ovs_air_cd", false);
                glHelper.SetRequiredLevel(formContext, "ovs_road_cd", false);
                glHelper.SetRequiredLevel(formContext, "ovs_rail_cd", false);
                glHelper.SetRequiredLevel(formContext, "ovs_marine_cd", false);
                CurrentWoStatus = systemStatus;

            }

        },

        /*setDefaultInspectionSynopsis: function (executionContext) {
            var formContext = executionContext.getFormContext();

            if (formType == 1) {
                if (userSettings.languageId == 1033) {
                    formContext.getAttribute("ovs_inspectionsynopsis").setValue("<h3>PART 1</h3><br /><h3>PART 2</h3><br /><h3>PART 3</h3><br /><h3>PART 4</h3><br /><h3>PART 5</h3><br /><h3>PART 6</h3><br /><h3>PART 7</h3><br /><h3>PART 8</h3><br /><h3>PART 9</h3><br /><h3>PART 10</h3><br /><h3>PART 11</h3><br /><h3>PART 12</h3><br />");
                } else if (userSettings.languageId == 1036) {
                    formContext.getAttribute("ovs_inspectionsynopsis").setValue("<h3>PARTIE 1</h3><br /><h3>PARTIE 2</h3><br /><h3>PARTIE 3</h3><br /><h3>PARTIE 4</h3><br /><h3>PARTIE 5</h3><br /><h3>PARTIE 6</h3><br /><h3>PARTIE 7</h3><br /><h3>PARTIE 8</h3><br /><h3>PARTIE 9</h3><br /><h3>PARTIE 10</h3><br /><h3>PARTIE 11</h3><br /><h3>PARTIE 12</h3><br />");
                }
            }
        }, */

    }


    //********************public methods end***************

})(window, document)

