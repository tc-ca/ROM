// // OperationRegistrationWizard-Class.js // 
if (window.jQuery) { 
	(function ($) { 
		webFormClientValidate = function () { 
			var validation = true; 
			var errorMessage = ""; 
			var urlParams = new URLSearchParams(window.location.search); 
			
			if (urlParams.has('id')) { 
				var operationId = urlParams.get('id'); 
				if (!SiteHasOperationClasses(operationId, null)) { 
					errorMessage = tdg.error_message.message("m000016"); 
					// You cannot proceed before adding classes(s). 
					validation = false; 
				} 
			
			if (!validation) { 
				$('#ValidationSummaryEntityFormView div').remove();
				var validationSection = $('#ValidationSummaryEntityFormView'); 
				validationSection.append($("<div id='alertMessages' tabindex='0' class='notification alert-danger' role='alert'>" + errorMessage + "</div>")); 
				validationSection.show(); 
				$('#alertMessages').focus(); 
				
				return validation; 
			} 
			else { 
				if (!IsExtendedSite(operationId, null)) { 
					OperationDetailsProvided(operationId, true); 
					if (urlParams.has('siteid')) { 
						var siteId = urlParams.get('siteid');
						if (urlParams.has('in_year')) { 
							window.location.href = "~/en-US/my-sites/in-year-site/?id=" + siteId; 
						} 
						else{ 
							window.location.href = "~/en-US/SiteRegistrationWizard/?id=" + siteId;
						} 
					} 
				}
				else{
					return validation;
				} 
			} 
			//return validation; 
			}
		} 
	}(window.jQuery)); 
} 
	
	async function OperationDetailsProvided(operationId, flag) { 
		await UpdateOperationDetailsProvided(operationId, flag); 
	}
