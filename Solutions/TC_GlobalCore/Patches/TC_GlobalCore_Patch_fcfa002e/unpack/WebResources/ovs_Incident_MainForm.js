///<reference path="../../Utilities/GlobalHelper.js"/>
///<reference path="../../Utilities/questionnaireFunctions.js"/>


var TDG_Incident_MainForm = (function (window, document) {
    //variables
    var formType;
    var facilityTypeExcluded = new Array(1, 12, 15, 19, 22);

    var PostalAdressArray = new Array("ovs_street1_txt", "ovs_street2_txt", "ovs_street3_txt", "ovs_city_txt", "ovs_state_province_txt", "ovs_zip_postalcode_txt", "ovs_country_txt");
    var LongLatArray = new Array("ovs_latitude_nbr", "ovs_longitude_nbr");
    var LLD_Array = new Array("ovs_quarter_lsd_cd", "ovs_range_cd", "ovs_section_cd", "ovs_township_cd");


    //********************private methods*******************

    function clearHideEase(formContext, arrayOfFields, doClearHideEase) {

        for (var i = 0; i < arrayOfFields.length; i++) {
            if (doClearHideEase) glHelper.SetValue(formContext, arrayOfFields[i], null);
            glHelper.SetControlVisibility(formContext, arrayOfFields[i], !doClearHideEase);
            glHelper.SetRequiredLevel(formContext, arrayOfFields[i], !doClearHideEase);
        }
    }

    function filterFacilityType(formContext) {

        glHelper.filterOptionSet(formContext, "ovs_facility_type_cd", facilityTypeExcluded, false);
    }

    function seriousJeopardyBehavior(formContext) {

        Xrm.WebApi.online.retrieveMultipleRecords("ovs_incident_report", "?$select=ovs_incident_reportid,ovs_mode_cd,ovs_primary_report_ind&$filter=ovs_mode_cd eq 4 and  _ovs_incident_id_value eq " + formContext.data.entity.getId().replace('{', '').replace('}', '') + " and  ovs_primary_report_ind eq true").then(
            function success(results) {
                glHelper.SetDisabled(formContext, "ovs_serious_jeopardy_cd", !(results.entities.length > 0));
            },
            function (error) {
                glHelper.SetDisabled(formContext, "ovs_serious_jeopardy_cd", true);
                Xrm.Navigation.openErrorDialog({ message: "Something went wrong checking Seriouse Jeopardy. Error: " + error.message });
            }
        );
    }

    //********************private methods end***************

    //********************public methods***************
    return {

        OnLoad: function (executionContext) {

            var formContext = executionContext.getFormContext();
            formType = glHelper.GetFormType(formContext);

            filterFacilityType(formContext);

            var phImpact = formContext.getAttribute("ovs_physical_impact_cds");
            phImpact.removeOnChange(TDG_Incident_MainForm.PhisicalImpact_OnChange);
            phImpact.addOnChange(TDG_Incident_MainForm.PhisicalImpact_OnChange);
           
            var phImpactFlag = formContext.getAttribute("ovs_physical_impact_flag_ind");
            phImpactFlag.removeOnChange(TDG_Incident_MainForm.PhisicalImpactFlag_OnChange);
            phImpactFlag.addOnChange(TDG_Incident_MainForm.PhisicalImpactFlag_OnChange);
            phImpactFlag.fireOnChange();

            var contributingFactors = formContext.getAttribute("ovs_contributing_factors_cds");
            contributingFactors.removeOnChange(TDG_Incident_MainForm.ContributingFactors_OnChange);
            contributingFactors.addOnChange(TDG_Incident_MainForm.ContributingFactors_OnChange);

            var addressDetementFlag = formContext.getAttribute("ovs_address_not_determent_ind");
            addressDetementFlag.removeOnChange(TDG_Incident_MainForm.AddressDeterment_OnChange);
            addressDetementFlag.addOnChange(TDG_Incident_MainForm.AddressDeterment_OnChange);
            addressDetementFlag.fireOnChange();


            //initiate Copy Address control
            var wrControl = formContext.getControl("WebResource_CopyButton");
            if (wrControl) wrControl.getContentWindow().then(function (contentWindow) {contentWindow.setClientApiContext(Xrm, formContext);})  

            if (formType == glHelper.FORMTYPE_CREATE) {


            }
            else {

                seriousJeopardyBehavior(formContext);

                var exceptionExemtion = formContext.getAttribute("ovs_exemption_ind");
                exceptionExemtion.removeOnChange(TDG_Incident_MainForm.Exemtion_OnChange);
                exceptionExemtion.addOnChange(TDG_Incident_MainForm.Exemtion_OnChange);
            }
        },

        PhisicalImpact_OnChange: function (executionContext) {

            var formContext = executionContext.getFormContext();

            glHelper.openOtherFromChoice_s(formContext, "ovs_physical_impact_cds", "9", "ovs_other_physical_impact_txt");
        },

        PhisicalImpactFlag_OnChange: function (executionContext) {

            var formContext = executionContext.getFormContext();

            var flagOn = formContext.getAttribute("ovs_physical_impact_flag_ind").getValue();
            if (!flagOn) glHelper.SetValue(formContext, "ovs_physical_impact_cds", null);
            glHelper.SetControlReadOnly(formContext, "ovs_physical_impact_cds", !flagOn);
            //glHelper.SetControlVisibility(formContext, "ovs_physical_impact_cds", flagOn);
            TDG_Incident_MainForm.PhisicalImpact_OnChange(executionContext);
        },

        ContributingFactors_OnChange: function (executionContext) {

            var formContext = executionContext.getFormContext();

            glHelper.openOtherFromChoice_s(formContext, "ovs_contributing_factors_cds", "9", "ovs_contributing_factor_other_txt");
        },

        AddressType_OnChange: function (executionContext) {

            var formContext = executionContext.getFormContext();

            switch (formContext.getAttribute("ovs_address_type_cd").getValue()) {

                //Postal Address
                case 0: {
                    //clean and hide LongLat, LLD, enabel Postal
                    clearHideEase(formContext, LongLatArray, true);
                    clearHideEase(formContext, PostalAdressArray, false);
                    clearHideEase(formContext, LLD_Array, true);

                    //street2 and 3 are never required
                    glHelper.SetRequiredLevel(formContext, "ovs_street2_txt", false);
                    glHelper.SetRequiredLevel(formContext, "ovs_street3_txt", false);
                } break;
                case 1: {
                    //clean and hide Postal Adress fields, LongLat, enable LLD
                    clearHideEase(formContext, LongLatArray, true);
                    clearHideEase(formContext, PostalAdressArray, true);
                    clearHideEase(formContext, LLD_Array, false);
                } break;
                //LongLat
                case 2: {
                    //clean and hide Postal Adress fields,LLD, enable LongLat
                    clearHideEase(formContext, LongLatArray, false);
                    clearHideEase(formContext, PostalAdressArray, true);
                    clearHideEase(formContext, LLD_Array, true);
                } break;
                default: {
                    //clean and hide all
                    clearHideEase(formContext, LongLatArray, true);
                    clearHideEase(formContext, PostalAdressArray, true);
                    clearHideEase(formContext, LLD_Array, true);
                } break;
            }
        },

        AddressDeterment_OnChange: function (executionContext) {

            var formContext = executionContext.getFormContext();
            var isNotDeterment = glHelper.GetValue(formContext, "ovs_address_not_determent_ind");
            var addressType = formContext.getAttribute("ovs_address_type_cd");

            //set section visibility
            glHelper.SetSectionVisibility(formContext, "tab_5", "tab_5_section_addressAuto", !isNotDeterment);
            glHelper.SetSectionVisibility(formContext, "tab_5", "tab_5_section_siteAddress", !isNotDeterment);
            glHelper.SetSectionVisibility(formContext, "tab_5", "tab_5_section_addressManual", isNotDeterment);
            
            //set fields required
            for (var i = 0; i < PostalAdressArray.length; i++) {
                glHelper.SetRequiredLevel(formContext, PostalAdressArray[i], !isNotDeterment);
            }

            if (isNotDeterment) {

                addressType.removeOnChange(TDG_Incident_MainForm.AddressType_OnChange);
            }//determent
            else {

                addressType.removeOnChange(TDG_Incident_MainForm.AddressType_OnChange);
                addressType.addOnChange(TDG_Incident_MainForm.AddressType_OnChange);
                addressType.fireOnChange();
            }

        },

        Exemtion_OnChange: function (executionContext) {

            var formContext = executionContext.getFormContext();
            glHelper.DisplayFormNotificationModern(formContext, "Change of 'Exception/Exemption' may affect 'Reportable' status  calculation. Please, recalculate the scope.", "WARNING", true, 50000);
        },

    };
    //********************public methods end***************
})(window, document);
