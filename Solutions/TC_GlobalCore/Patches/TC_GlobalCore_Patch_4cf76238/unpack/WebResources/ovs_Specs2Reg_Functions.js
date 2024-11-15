
var Specs2RegFun_Ribbon = (function (window, document) {

   

    function filter_AddExisting(selectedEntityTypeName, selectedControl, firstPrimaryItemId, formConrol) {
        debugger;
     
        var formContext = formConrol;

        //check if container function is not null
        if (formContext.getAttribute("ovs_container_function_id").getValue() != null) {
            //get container function id
            var ContainerId = formContext.getAttribute("ovs_container_function_id").getValue()[0].id;
            var xmlFilter = "";

            Xrm.WebApi.online.retrieveMultipleRecords("fdr_containerfunction_specification", "?$select=fdr_specificationid&$filter=(fdr_containerfunctionid eq " + ContainerId + ")").then(
                function success(results) {
                    if (results.entities != undefined
                        && results.entities != null
                        && results.entities.length > 0) {
                        xmlFilter = "<filter type = 'or' >";

                        for (var i = 0; i < results.entities.length; i++) {
                            xmlFilter += "<condition attribute='fdr_specificationid' operator='eq' value='" + results.entities[i]["fdr_specificationid"] + "' />";

                        }

                        xmlFilter += "</filter>";
                        //execute M:N lookup filter
                        Ribbon_Helper.filter_Subgrid_AddExisting(selectedEntityTypeName, selectedControl, firstPrimaryItemId, "ovs_registration_function", "fdr_specification", "ovs_ovs_registration_function_fdr_specification","fdr_specification", "fdr_specification", "fdr_specification", xmlFilter);
                       

                    }

                },
                function (error) {
                    Xrm.Utility.alertDialog(error.message);
                }
            );

        }
      

    }


    return {

        filter_AddExisting: filter_AddExisting,
    };
}

)(window, document);