///<reference path="../../Utilities/GlobalHelper.js"/>
///<reference path="../../Utilities/questionnaireFunctions.js"/>


var Incident_Report= (function (window, document) {
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

    //********************private methods end***************

    //********************public methods***************
    return {

        OnLoad: function (executionContext) {

            var formContext = executionContext.getFormContext();
            formType = glHelper.GetFormType(formContext);

            var source = formContext.getAttribute("ovs_source_cd");
            source.removeOnChange(Incident_Report.Source_OnChange);
            source.addOnChange(Incident_Report.Source_OnChange);
            source.fireOnChange();

            var releasetype = formContext.getAttribute("ovs_release_type_cds");
            releasetype.removeOnChange(Incident_Report.ReleaseType_OnChange);
            releasetype.addOnChange(Incident_Report.ReleaseType_OnChange);
            releasetype.fireOnChange();

            var closure = formContext.getAttribute("ovs_closure_ind");
            closure.removeOnChange(Incident_Report.Closure_OnChange);
            closure.addOnChange(Incident_Report.Closure_OnChange);
            closure.fireOnChange();

            var closuretype = formContext.getAttribute("ovs_closure_type_cds");
            closuretype.removeOnChange(Incident_Report.ClosureType_OnChange);
            closuretype.addOnChange(Incident_Report.ClosureType_OnChange);            


            var evacuatioFlag = formContext.getAttribute("ovs_evacuation_due_incident_ind");
            evacuatioFlag.removeOnChange(Incident_Report.EvacuationProfileFlag_OnChange);
            evacuatioFlag.addOnChange(Incident_Report.EvacuationProfileFlag_OnChange);
            evacuatioFlag.fireOnChange();

            var emergencyPers = formContext.getAttribute("ovs_emergency_response_personnel_cds");
            emergencyPers.removeOnChange(Incident_Report.EmergencyPersonnel_OnChange);
            emergencyPers.addOnChange(Incident_Report.EmergencyPersonnel_OnChange);


            var addressDetementFlag = formContext.getAttribute("ovs_address_not_determent_ind");
            addressDetementFlag.removeOnChange(Incident_Report.AddressDeterment_OnChange);
            addressDetementFlag.addOnChange(Incident_Report.AddressDeterment_OnChange);
            addressDetementFlag.fireOnChange();            

            //initiate Copy Address control
            var wrControl = formContext.getControl("WebResource_CopyButton");
            if (wrControl) wrControl.getContentWindow().then(function (contentWindow) {contentWindow.setClientApiContext(Xrm, formContext);})  

            if (formType == glHelper.FORMTYPE_CREATE) {


            }
            else {
                emergencyPers.fireOnChange();
            }
        },

        Source_OnChange: function (executionContext) {

            var formContext = executionContext.getFormContext();

            glHelper.openOtherFromChoice(formContext, "ovs_source_cd", "23", "ovs_other_source_txt");
            glHelper.openOtherFromChoice(formContext, "ovs_source_cd", "1", "ovs_initial_30day_follow_up_receipt_date_dte");
       },

        ReleaseType_OnChange: async function (executionContext) {
            try {
                var formContext = executionContext.getFormContext();
                var multiSelectOptionSet = formContext.getAttribute("ovs_release_type_cds").getValue();
                if (multiSelectOptionSet != null) {
                    let optionString = multiSelectOptionSet.toString();
                    if (optionString.indexOf("918640008") !== -1) {
                        formContext.getControl("ovs_release_type_other_txt").setVisible(true);
                        formContext.getAttribute("ovs_release_type_other_txt").setRequiredLevel("required");
                    } else {
                        formContext.getControl("ovs_release_type_other_txt").setVisible(false);
                        formContext.getAttribute("ovs_release_type_other_txt").setRequiredLevel("none");
                    }
                    if (optionString.indexOf("918640004") !== -1) {
                        formContext.getAttribute("ovs_release_type_cds").setValue([918640004])
                        formContext.getControl("ovs_release_type_other_txt").setVisible(false);
                        formContext.getAttribute("ovs_release_type_other_txt").setRequiredLevel("none");
                    }
               } else {
                    formContext.getControl("ovs_release_type_other_txt").setVisible(false);
                    formContext.getAttribute("ovs_release_type_other_txt").setRequiredLevel("none");
                }
            } catch (error) {
                Xrm.Navigation.openErrorDialog({ message: error })

            } finally {
            }
        },

        ClosureType_OnChange: async function (executionContext) {
            try {
                var formContext = executionContext.getFormContext();
                glHelper.openOtherFromChoice_s(formContext, "ovs_closure_type_cds", "11", "ovs_closure_type_other_txt");


            } catch (error) {
                Xrm.Navigation.openErrorDialog({ message: error })
            } finally {
            }
        },

        Closure_OnChange: function (executionContext) {

            var formContext = executionContext.getFormContext();
   
            var isClosure = formContext.getAttribute("ovs_closure_ind").getValue() ;

            if (!isClosure) {
                formContext.getAttribute("ovs_closure_type_cds").setValue(null);
                formContext.getControl("ovs_closure_type_other_txt").setVisible(false);
                formContext.getAttribute("ovs_closure_type_other_txt").setRequiredLevel("none");
            }
            glHelper.SetDisabled(formContext, "ovs_closure_type_cds", !isClosure);
            glHelper.SetDisabled(formContext, "ovs_duration_num", !isClosure);

            glHelper.SetRequiredLevel(formContext, "ovs_closure_type_cds", isClosure);

            Incident_Report.ClosureType_OnChange(executionContext);

        },

        EvacuationProfileFlag_OnChange: function (executionContext) {

            var formContext = executionContext.getFormContext();
            var evacuationFields = new Array("ovs_evacuation_profile_cds", "ovs_evacuation_count_num", "ovs_duration_evacuation_nbr");
            var flagOn = formContext.getAttribute("ovs_evacuation_due_incident_ind").getValue();

            for (var i = 0; i < evacuationFields.length; i++) {

                if (!flagOn) glHelper.SetValue(formContext, evacuationFields[i], null);
                glHelper.SetControlReadOnly(formContext, evacuationFields[i], !flagOn);
            }
        },

        EmergencyPersonnel_OnChange: function (executionContext) {

            var formContext = executionContext.getFormContext();

            glHelper.openOtherFromChoice_s(formContext, "ovs_emergency_response_personnel_cds", "21", "ovs_other_emergency_response_personnel_txt");
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
            glHelper.SetSectionVisibility(formContext, "tab_location", "tab_location_section_populated", !isNotDeterment);
            glHelper.SetSectionVisibility(formContext, "tab_location", "tab_location_section_site", !isNotDeterment);
            glHelper.SetSectionVisibility(formContext, "tab_location", "tab_location_section_addressManual", isNotDeterment);
            
            //set fields required
            for (var i = 0; i < PostalAdressArray.length; i++) {
                glHelper.SetRequiredLevel(formContext, PostalAdressArray[i], !isNotDeterment);
            }

            if (isNotDeterment) {

                addressType.removeOnChange(Incident_Report.AddressType_OnChange);
            }//determent
            else {

                addressType.removeOnChange(Incident_Report.AddressType_OnChange);
                addressType.addOnChange(Incident_Report.AddressType_OnChange);
                addressType.fireOnChange();
            }

        },

    };
    //********************public methods end***************
})(window, document);
