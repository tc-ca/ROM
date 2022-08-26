$(document).ready(function() {
	//$('#instructions').hide();
    $('#EntityFormView').hide();
	//$('#redirectInstruction').show();
	$("#NextButton").prop('disabled', true);

	var urlParams = new URLSearchParams(window.location.search);
	if (urlParams.has('id')) {
		var siteid = urlParams.get('id');
		$(".entity-grid").on("loaded", function () {
			var firstRow = $("#Operations .view-grid table tbody").find("tr:first");
			if(firstRow){
				var operationId = firstRow.attr('data-id');

				if(operationId){
					var extendedSite = IsExtendedSite(operationId, null);							
					var operationWizardURL = "~/OperationRegistrationWizard/?id=" + operationId + "&siteid=" + siteid + (extendedSite ? "&isExtended=true" : "&isExtended=false");

					if ($("#further_site_details").length <= 0){
						$("#PreviousButton").parent().after("<div id='further_site_details' role='group' class='btn-group entity-action-button'><a href='" + operationWizardURL + "'><input type='button' name='Previous' value='Previous' class='btn btn-default button previous previous-btn' nonactionlinkbutton='true'></a></div>");
						$("#PreviousButton").hide();	
					}

					var prev_from_mot = sessionStorage.getItem("prev_from_mot");
					//alert(prev_from_mot + ": from mot");
					if(prev_from_mot == 'true'){
						sessionStorage.setItem('prev_from_mot', 'false');
						$("#PreviousButton").click();
					}
					else{
						var from_op_wzrd = sessionStorage.getItem("from_op_wzrd");
						//alert(from_op_wzrd + ": from op wzrd");
						if(from_op_wzrd == null || from_op_wzrd == 'false')
							window.location.href = operationWizardURL;
						else
							sessionStorage.setItem('from_op_wzrd', 'false');
					}
		
					if((!extendedSite && SiteHasOperationClasses(operationId, null)) || (extendedSite && SiteHasOperationClasses(operationId, null) && SiteHasOperationUNNumbers(operationId, null))){
						$("#NextButton").prop('disabled', false);
					}

					//firstRow.find('td').each(function(){
						//var tdElement = $(this);
								
						//if(tdElement.attr('data-attribute') == 'cid_operationdetailsprovided')
						//{
						//	if ($("#HOTI_Details").length <= 0)
						//		$("#PreviousButton").parent().after("<div id='HOTI_Details' role='group' class='btn-group entity-action-button'><a href='~/OperationRegistrationWizard/?id=" + operationId + "&siteid=" + siteid + "'><input type='button' name='further_site_details' value='Further Site Details' class='btn btn-primary button next submit-btn' nonactionlinkbutton='true'></a></div>");
						//	
						//	if((! extendedSite && SiteHasOperationClasses(operationId, null)) ||
						//		(extendedSite && SiteHasOperationUNNumbers(operationId, null)))
						//		$("#NextButton").prop('disabled', false);
						//}
					//})
				}
			}
		});
	}

	webFormClientValidate = function() {
    var validation = true;
    var rows = $("#Operations .view-grid table").find("tbody > tr");
		rows.each(function(){
			$(this).find('td').each(function(){
				var tdElement = $(this);
				
				if(validation == true && tdElement.attr('data-attribute') == 'cid_operationdetailsprovided')
				{
					if(tdElement.attr('data-value') == 'false')
					{
						//validation = false;
						//alert('You cannot proceed before completing site operation details.');
					}
				}
			})
		});
		
	    if(!validation)
    	{
			var errorMessage = 'You cannot proceed before completing site operation details.';
    		$('#ValidationSummaryEntityFormView div').remove(); 

   			var validationSection = $('#ValidationSummaryEntityFormView');
   
            validationSection.append($("<div id='alertMessages' tabindex='0' class='notification alert-danger' role='alert'>" + errorMessage + "</div>"));
            validationSection.show();
			$('#alertMessages').focus();
    	}
        return validation;
    }
});