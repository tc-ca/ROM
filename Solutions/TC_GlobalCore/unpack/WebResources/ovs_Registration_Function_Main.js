///<reference path="../../Utilities/GlobalHelper.js"/>
///<reference path="../../Utilities/RNOP_ValidationFunctions.js"/>


var containerId;

var RegFunctions_FDR_main = (function (window, document) {

    //**************** Variables

    var globalFormContext;
    var globalContext;
    var formType;
    var clientUrl;

    var containerFunctions = new Array();
   


    //**************** Private methods


    function get_Registration_ContainerType(formContext, Reg_id) {

      
        var containerF = formContext.getControl("ovs_container_function_id");

        var fetchData = {
            fdr_servicerequestid: Reg_id
        };
        var fetchXml = [
            "<fetch>",
            "  <entity name='ovs_registration'>",
            "    <attribute name='ovs_registration_type_id' />",
            "    <filter>",
            "      <condition attribute='ovs_registrationid' operator='eq' value='", Reg_id, "'/>",
            "    </filter>",
            "    <link-entity name='fdr_containertype' from='fdr_containertypeid' to='ovs_registration_type_id' alias='CT'>",
            "      <link-entity name='fdr_containerfunction' from='fdr_containertype' to='fdr_containertypeid' alias='CF'>",
            "        <attribute name='fdr_containerfunctionid' />",
            "      </link-entity>",
            "    </link-entity>",
            "  </entity>",
            "</fetch>",
        ].join("");

        /*5b658d22-02cb-ec11-a7b5-0022483cebf0*/
        var encodedFetchXML = encodeURIComponent(fetchXml);

        var req = new XMLHttpRequest();
        req.open("GET", clientUrl + "/api/data/v9.2/ovs_registrations?fetchXml=" + encodedFetchXML, true);
        req.setRequestHeader("OData-MaxVersion", "4.0");
        req.setRequestHeader("OData-Version", "4.0");
        req.setRequestHeader("Accept", "application/json");

        req.setRequestHeader("Prefer", "odata.include-annotations=\"*\"");
        req.onreadystatechange = function () {
            if (this.readyState === 4) {
                req.onreadystatechange = null;
                if (this.status === 200) {

                    var results = JSON.parse(this.response);
                    //if Service Request has container type => get list of related container functions => filter
                    if (results.value != null && results.value != undefined && results.value.length > 0)
                        for (var i = 0; i < results.value.length; i++) {

                            containerFunctions.push(results.value[i]["CF.fdr_containerfunctionid"]);
                        }
                    else {
                        console.log("Cannot find Container Type relate Container Functions");
                        containerFunctions = new Array();
                        Xrm.Navigation.openAlertDialog({ confirmButtonLabel: "OK", text: "Cannot find Container Type relate Container Functions" });
                    }

                } else {
                    console.log("Something went wrong " + this.statusText);
                    containerFunctions = new Array();
                    Xrm.Navigation.openErrorDialog({ message: "Something went wrong " + this.statusText });
                }

                containerF.addPreSearch(RegFunctions_FDR_main.Pre_filterContainerFunction);
            }
        };
        req.send();

    }

    function getSpecAndLimitations() {

        var containerId = globalFormContext.data.entity.getId();

        //212216 show specs and limitations comma seperated in the functions grid
        Xrm.WebApi.online.retrieveRecord("ovs_registration_function", containerId, "?$select=ovs_name_txt&$expand=ovs_ovs_registration_function_fdr_functionlimitation($select=_fdr_limitation_value,fdr_texten,fdr_textfr,statecode),ovs_ovs_registration_function_fdr_specification($select=fdr_englishname,fdr_name,statecode)").then(
            function success(result) {
                console.log(result);
                var limitations = "";
                var specifications = "";
                var limitationsEn = "";
                var limitationsFr = "";
                // Limitations
                for (var j = 0; j < result.ovs_ovs_registration_function_fdr_functionlimitation.length; j++) {
                    var fdr_limitation_formatted = result.ovs_ovs_registration_function_fdr_functionlimitation[j]["_fdr_limitation_value@OData.Community.Display.V1.FormattedValue"];
                    var statecode_formatted = result.ovs_ovs_registration_function_fdr_functionlimitation[j]["statecode@OData.Community.Display.V1.FormattedValue"];
                    if (statecode_formatted == "Active") {

                        //if (limitations.length > 0)
                        //  limitations = limitations + ", ";

                        if (limitationsEn.length > 0)
                            limitationsEn = limitationsEn + ", ";
                        if (limitationsFr.length > 0)
                            limitationsFr = limitationsFr + ", ";
                        var splitLimitation = fdr_limitation_formatted.split("::");

                        limitationsEn = limitationsEn + splitLimitation[0];
                        limitationsFr = limitationsFr + splitLimitation[1];
                        // limitations = limitations + fdr_limitation_formatted;

                    }
                }

                if (limitationsEn.length > 0 && limitationsFr.length > 0) {
                    limitations = limitationsEn + "::" + limitationsFr;
                }

                var specificationsEn = "";
                var specificationsFr = "";
                // Specifications
                for (var j = 0; j < result.ovs_ovs_registration_function_fdr_specification.length; j++) {
                    var fdr_name = result.ovs_ovs_registration_function_fdr_specification[j]["fdr_name"];
                    var statecode_formatted = result.ovs_ovs_registration_function_fdr_specification[j]["statecode@OData.Community.Display.V1.FormattedValue"];
                    //if (statecode_formatted == "Active") {
                    // if (specifications.length > 0)
                    //    specifications = specifications + ", ";

                    var splitName = fdr_name.split("::");
                    if (specificationsEn.length > 0)
                        specificationsEn = specificationsEn + ", ";

                    if (specificationsFr.length > 0)
                        specificationsFr = specificationsFr + ", ";

                    specificationsEn = specificationsEn + splitName[0];
                    specificationsFr = specificationsFr + splitName[1];

                    // specifications = specifications + fdr_name;
                    //}
                }
                if (specificationsEn.length > 0 && specificationsFr.length > 0) {
                    specifications = specificationsEn + "::" + specificationsFr;
                }

                //fdr_limitations
                //fdr_specifications

                if (glHelper.GetValue(globalFormContext, "ovs_limitations_txt") != limitations
                    || glHelper.GetValue(globalFormContext, "ovs_specifications_txt") != specifications) {

                    glHelper.SetValue(globalFormContext, "ovs_limitations_txt", limitations);
                    glHelper.SetValue(globalFormContext, "ovs_specifications_txt", specifications);
                    globalFormContext.data.save();
                }
            },
            function (error) {
                console.log(error.message);
            }
        );
    }

    function get_Specs_Related_to_Container(containerFunction) {

        SpecsXmlfilter = "";
        
        Xrm.WebApi.online.retrieveMultipleRecords("fdr_containerfunction_specification", "?$select=fdr_specificationid&$filter=(fdr_containerfunctionid eq " + containerFunction + ")").then(
            function success(results) {
                if (results.entities != undefined
                    && results.entities != null
                    && results.entities.length > 0) {
                    SpecsXmlfilter = "<filter type = 'or' >";

                    for (var i = 0; i < results.entities.length; i++) {
                        SpecsXmlfilter += "<condition attribute='fdr_specificationid' operator='eq' value='" + results.entities[i]["fdr_specificationid"] + "' />";

                    }

                    SpecsXmlfilter += "</filter>";

                }
               
            },
            function (error) {
                Xrm.Utility.alertDialog(error.message);
            }
        );




    }


  

    //**************** Public methods
    return {

        OnLoad: function (executionContext) {
            //get context
            globalContext = glHelper.getGlobalContext();
            var formContext = executionContext.getFormContext();
            globalFormContext = formContext;

            clientUrl = globalContext.getClientUrl();

            // 0 = Undefined, 1 = Create, 2 = Update, 3 = Read Only, 4 = Disabled, 6 = Bulk Edit
            formType = glHelper.GetFormType(formContext);

            var cf = formContext.getAttribute("ovs_container_function_id");
            cf.removeOnChange(RegFunctions_FDR_main.On_ContainerFunctionChange);
            cf.addOnChange(RegFunctions_FDR_main.On_ContainerFunctionChange);

            if (glHelper.GetLookupAttrId(formContext, "ovs_container_function_id") != null) {
                containerId = glHelper.GetLookupAttrId(formContext, "ovs_container_function_id").replace('{', '').replace('}', '');
            }

      
            Reg_id = glHelper.GetLookupAttrId(formContext, "ovs_registration_id").replace('{', '').replace('}', '');

          

            if (formType == 1) {

                 containerId =   glHelper.SetControlReadOnly(formContext, "ovs_container_function_id", false);

                //if Service Request is populated check for its container type
                if (Reg_id != null)
                    get_Registration_ContainerType(formContext, Reg_id);
                else {
                    Xrm.Navigation.openAlertDialog({ confirmButtonLabel: "OK", text: "No Service Request is associated with current Registration Function" });
                }
            }
            else if (formType == 2) {

                //get list of spec match current container
                get_Specs_Related_to_Container(containerId);
                //make container function read only
                glHelper.SetControlReadOnly(formContext, "ovs_container_function_id", true);
                //set design or specs visible
                cf.fireOnChange();
               
                //212216 show specs and limitations comma seperated in the functions grid
                getSpecAndLimitations();

                var specGrid = globalFormContext.getControl("Subgrid_specification");
                var limitationGrid = globalFormContext.getControl("Subgrid_limitation");
                if (specGrid != null) {
                    var recs = specGrid.getGrid().getTotalRecordCount();
                    specGrid.addOnLoad(getSpecAndLimitations);
                }
                if (limitationGrid != null) {
                    limitationGrid.addOnLoad(getSpecAndLimitations);
                }
            }

        },

        Pre_filterContainerFunction: function () {

            var strTemplate = "<value>{0}</value>";
            var currentLine = "";

            //no primary/related contacts
            if (containerFunctions.length == 0) {
                // filter have to return an empty result
                var functionFilter = "<filter type='and'><condition attribute='fdr_containerfunctionid' operator='eq' value='00000000-0000-0000-0000-000000000000'></condition></filter>";

            }
            else {

                for (var i = 0; i < containerFunctions.length; i++) {

                    currentLine = currentLine + strTemplate.replace("{0}", containerFunctions[i]);
                }
                var functionFilter = "<filter type='and'><condition attribute='fdr_containerfunctionid' operator='in'>" + currentLine + "</condition></filter>";
            }
            globalFormContext.getControl("ovs_container_function_id").addCustomFilter(functionFilter, "ovs_container_function_id");

        },

        On_ContainerFunctionChange: function (executionContext) {

            var formContext = executionContext.getFormContext();
            //get container function id
            var containerId = glHelper.GetLookupAttrId(formContext, "ovs_container_function_id");

            if (containerId != null) {


                if (formType == 1) {

                    //populate Service Request Function name
                    var currentName = glHelper.GetValue(formContext, "ovs_name_txt");
                    //glHelper.SetValue(formContext, "fdr_name", glHelper.GetLookupName(formContext, "fdr_containerfunction"));

                    //select Container Functions that have already been added to a Service Request.
                    var Reg_id = glHelper.GetLookupAttrId(formContext, "ovs_registration_id");
                    if (Reg_id != null) {
                        var filter = "?$select=_ovs_container_function_id_value&$filter=(_ovs_container_function_id_value eq " + containerId;
                        filter = filter + " and _ovs_registration_id_value eq " + Reg_id + " and statecode eq 0) ";
                        Xrm.WebApi.online.retrieveMultipleRecords("ovs_registration_function", filter).then(
                            function success(results) {
                                if (results.entities.length > 0) {
                                    glHelper.SetFieldNotification(formContext, "ovs_container_function_id", "Selected Container Function has already been added to the current Service Request.");
                                } else {
                                    glHelper.ClearFieldNotification(formContext, "ovs_container_function_id");

                                }
                            },
                            function (error) {
                                console.log(error.message);
                            }
                        );
                    }

                }
                //update, Michael. September 1, 2022
                //logic changed to make design registration option to change on Container function level, task 198729
                //get and save design allowence value on create only, no futher mutations!
                Xrm.WebApi.online.retrieveRecord("fdr_containerfunction", containerId, "?$select=fdr_supportsdesignregistration, fdr_englishname, fdr_frenchname").then(
                    function success(result) {

                        

                        // set service request function full name: english_containerfunctionname::french_containerfunctionname
                        if (formType == 1) {
                            var containerfunction_englishname = result["fdr_englishname"];
                            var containerfunction_frenchname = result["fdr_frenchname"];
                            var containerfunction_fullname;
                            if (containerfunction_englishname != null && containerfunction_frenchname != null)
                                containerfunction_fullname = containerfunction_englishname + "::" + containerfunction_frenchname;
                            else if (containerfunction_frenchname != null)
                                containerfunction_fullname = containerfunction_frenchname;
                            else containerfunction_fullname = containerfunction_englishname;
                            glHelper.SetValue(formContext, "ovs_name_txt", containerfunction_fullname);
                        }
                       
                   
                       
                        debugger;
                       
                    },
                    function (error) {
                        Xrm.Navigation.openErrorDialog({ message: "Something went wrong with Container Function query. Error: " + error.message });
                    }
                );

            }
            else {
             
               
                glHelper.SetSectionVisibility(formContext, "General", "section_Specs", false);
                glHelper.SetControlVisibility(formContext, "Subgrid_specification", false);
                //throw a message?
            }
        },
    }

})(window, document)