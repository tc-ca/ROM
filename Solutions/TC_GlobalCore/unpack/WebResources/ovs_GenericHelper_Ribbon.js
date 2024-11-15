


var Ribbon_Helper = (function (window, document) {
   
    function associateAddExistingResults(relationshipName, primaryEntitySetName, relatedEntitySetName, relatedEntity, parentRecordId, gridControl, results, index) {
        var formContext = gridControl.formContext || gridControl.getParentForm();

        if (index >= results.length) {
            // Refresh the grid once completed
            formContext.ui.setFormNotification("Associated " + index + " record" + (index > 1 ? "s" : ""), "INFO", "associate");
            if (gridControl) { gridControl.refresh(); }

            // Clear the final notification after 2 seconds
            setTimeout(function () {
                formContext.ui.clearFormNotification("associate");
            }, 2000);

            return;
        }

        formContext.ui.setFormNotification("Associating record " + (index + 1) + " of " + results.length, "INFO", "associate");

        var lookupId = results[index].id.replace("{", "").replace("}", "");
        var lookupEntity = results[index].entityType || results[index].typename;

        var primaryId = parentRecordId;
        var relatedId = lookupId;
        if (lookupEntity.toLowerCase() != relatedEntity.toLowerCase()) {
            // If the related entity is different to the lookup entity flip the primary and related id's
            primaryId = lookupId;
            relatedId = parentRecordId;
        }

        var association = { '@odata.id': formContext.context.getClientUrl() + "/api/data/v9.0/" + relatedEntitySetName + "(" + relatedId + ")" };

        var req = new XMLHttpRequest();
        req.open("POST", formContext.context.getClientUrl() + "/api/data/v9.0/" + primaryEntitySetName + "(" + primaryId + ")/" + relationshipName + "/$ref", true);
        req.setRequestHeader("Accept", "application/json");
        req.setRequestHeader("Content-Type", "application/json; charset=utf-8");
        req.setRequestHeader("OData-MaxVersion", "4.0");
        req.setRequestHeader("OData-Version", "4.0");
        req.onreadystatechange = function () {
            if (this.readyState === 4) {
                req.onreadystatechange = null;
                index++;
                if (this.status === 204 || this.status === 1223) {
                    // Success
                    // Process the next item in the list
                    associateAddExistingResults(relationshipName, primaryEntitySetName, relatedEntitySetName, relatedEntity, parentRecordId, gridControl, results, index);
                }
                else {
                    // Error
                    var error = JSON.parse(this.response).error.message;
                    if (error == "A record with matching key values already exists.") {
                        // Process the next item in the list
                        associateAddExistingResults(relationshipName, primaryEntitySetName, relatedEntitySetName, relatedEntity, parentRecordId, gridControl, results, index);
                    }
                    else {
                        Xrm.Utility.alertDialog(error);
                        formContext.ui.clearFormNotification("associate");
                        if (gridControl) { gridControl.refresh(); }
                    }
                }
            }
        };
        req.send(JSON.stringify(association));
    }
    // relationshipName = the schema name of the N:N or 1:N relationship
    // primaryEntity = the 1 in the 1:N or the first entity in the N:N - for N:N this is the entity which was used to create the N:N (may need to trial and error this)
    // relatedEntity = the N in the 1:N or the secondary entity in the N:N
    // parentRecordId = the guid of the record this subgrid/related entity is used on
    // gridControl = the grid control parameter passed from the ribbon context
    // lookupOptions = options for creating the custom lookup with filters: https://docs.microsoft.com/en-us/powerapps/developer/model-driven-apps/clientapi/reference/xrm-utility/lookupobjects
    function lookupAddExistingRecords(relationshipName, primaryEntity, relatedEntity, parentRecordId, gridControl, lookupOptions) {
        Xrm.Utility.lookupObjects(lookupOptions).then(function (results) {
            if (results.length > 0) {
                // Get the entitySet name for the primary entity
                Xrm.Utility.getEntityMetadata(primaryEntity).then(function (primaryEntityData) {
                    var primaryEntitySetName = primaryEntityData.EntitySetName;

                    // Get the entitySet name for the related entity
                    Xrm.Utility.getEntityMetadata(relatedEntity).then(function (relatedEntityData) {
                        var relatedEntitySetName = relatedEntityData.EntitySetName;

                        // Call the associate web api for each result (recursive)
                        associateAddExistingResults(relationshipName, primaryEntitySetName, relatedEntitySetName, relatedEntity, parentRecordId.replace("{", "").replace("}", ""), gridControl, results, 0)
                    });
                });
            }
        });
    }


    function filter_Subgrid_AddExisting(selectedEntityTypeName, selectedControl, firstPrimaryItemId, PrimaryEntity, related_Entity, relationShip_Name, default_EntityType, entity_Types, entity_LogicaName, fetchXml)
    {

        debugger;
        if (selectedControl.getRelationship().name == relationShip_Name)
        //"ovs_ovs_registration_function_fdr_specification") 
        {


            // Custom Account -> Contact N:N - filters 
            var options = {
                allowMultiSelect: true,
                defaultEntityType: default_EntityType,
                //"fdr_specification",
                entityTypes: [entity_Types],
                //"fdr_specification"],
                disableMru: true,
                showNew: true,
                searchText: "\n", // Search by default
                filters: [{
                    entityLogicalName: entity_LogicaName,
                    //"fdr_specification",
                    filterXml: fetchXml

                }]
            };

            lookupAddExistingRecords(relationShip_Name, PrimaryEntity, related_Entity, firstPrimaryItemId, selectedControl, options);
        }
        else {
            // Any other contact relationship (N:N or 1:N) - use default behaviour
            XrmCore.Commands.AddFromSubGrid.addExistingFromSubGridAssociated(selectedEntityTypeName, selectedControl);
        }
    }
    return {
       
        filter_Subgrid_AddExisting : filter_Subgrid_AddExisting
    };
})(window, document);
