///<reference path="../../Utilities/GlobalHelper.js"/>
///<reference path="../../Utilities/DGAIS _SpecsMapping.js"/>


var IncidentERAP_MainForm = (function (window, document) {

    //variables
    var formType;
    var globalContext;
    var clientUrl;
    var incidentGuid;



    //********************private methods*******************

    function basedOnModeBehavior(executionContext, formContext) {

        Xrm.WebApi.online.retrieveRecord("ovs_incident_report", incidentGuid, "?$select=ovs_mode_cd").then(
            function success(result) {
                if (result != null) {
                    var ovs_mode_cd = result["ovs_mode_cd"];
                    var ovs_mode_cd_formatted = result["ovs_mode_cd@OData.Community.Display.V1.FormattedValue"];
                    if (ovs_mode_cd != null) {
                        //road,rail or marine. (!= 4) means "not air"
                        glHelper.SetRequiredLevel(formContext, "ovs_erap_holder_name_txt", (ovs_mode_cd != 4))
                        glHelper.SetRequiredLevel(formContext, "ovs_erap_report_submitted_ind", (ovs_mode_cd != 4))
                    }
                    else {

                        glHelper.filterOptionSet(formContext, "ovs_vehicle_type_cd", mode[0], true);
                        Xrm.Navigation.openErrorDialog({ message: "Parent Incident Report is missing the Mode.\n Vehicle Type and Configuration are not accessible!" });
                    }
                }
            },
            function (error) {
                Xrm.Navigation.openErrorDialog({ message: error.message });
            }
        );
    }

    //********************private methods end***************

    //********************public methods***************
    return {

        OnLoad: function (executionContext) {

            var formContext = executionContext.getFormContext();
            globalContext = glHelper.getGlobalContext();
            clientUrl = globalContext.getClientUrl();


            formType = glHelper.GetFormType(formContext);
            
            incidentGuid = glHelper.GetLookupAttrId(formContext, "ovs_incident_report_id");

            if (incidentGuid == null) {
                Xrm.Navigation.openErrorDialog({ message: "Incident Report must be populated" });
                glHelper.SetFieldNotification(formContext, "header_ovs_incident_report_id", "Incident Report must be populated");
                return;
            } else incidentGuid = incidentGuid.replace('{', '').replace('}', '');

            var reportSubmitted = formContext.getAttribute("ovs_erap_report_submitted_ind");
            reportSubmitted.removeOnChange(IncidentERAP_MainForm.ReportSubmitted_OnChange);
            reportSubmitted.addOnChange(IncidentERAP_MainForm.ReportSubmitted_OnChange);
            reportSubmitted.fireOnChange();


            if (formType == glHelper.FORMTYPE_CREATE) {

                
            }
            else {

            }

            basedOnModeBehavior(executionContext, formContext);
        },

        ReportSubmitted_OnChange: function (executionContext) {

            var formContext = executionContext.getFormContext();
            var isSubmitted = glHelper.GetValue(formContext, "ovs_erap_report_submitted_ind");
            glHelper.SetRequiredLevel(formContext, "ovs_erap_report_submitted_dte", isSubmitted);

        }

    };
    //********************public methods end***************
})(window, document);
