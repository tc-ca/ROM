//
// CompanyRegistrationWizard-Contact.js
//
function checkToDisplaycontactAddMessage() {
	debugger;

	var selected_language = '{{website.selected_language.code}}';
	sessionStorage.setItem("selected_language", selected_language);

	tdg.c.page_instructions("page_crw_contact");

	var parentcustomerid = '{{user.parentcustomerid.Id}}';

	if (sessionStorage.getItem("FullName") != null && sessionStorage.getItem("FullName") != "") {
		var m000120 = tdg.error_message.message("m000120").replace("{0}", sessionStorage.getItem("FullName"));
		//"This Contact cannot be added as a Contact with this name and email address already exists in CID, but is assigned to a different Company.";   

		if (parentcustomerid != null) {
			//Add message when first secondary contact  added
			var SecondaryContactResuts = tdg.webapi.SelectedColumnlist("contacts",
				"contactid,firstname,lastname",
				"statecode eq 0 and cid_contacttype eq 100000001 and _parentcustomerid_value eq " + parentcustomerid);

			if (SecondaryContactResuts && SecondaryContactResuts.length == 1) {
				var m000133 = tdg.error_message.message("m000133"); //Instructions message
				var m000134 = tdg.error_message.message("m000134"); //Popup message
				tdg.c.page_instructions(m000133);
				m000120 = m000120 + "\n\n" + m000134;
			}
			else {
				$(".instructions").remove();
			}
		}

		tdg.c.dialog_OK(m000120.replace("{1}", sessionStorage.getItem("Email")));
		sessionStorage.removeItem("FullName");
	}
}

$(document).ready(function () {
	debugger;

	var list = $(".entity-grid");
	list.on("loaded", checkToDisplaycontactAddMessage);

	$("#cid_registrationasof").parent().parent().hide();
	$(".create-action").click(function () {
		//alert("Test");
		$('#ValidationSummaryEntityFormView div').remove();
		$("#ValidationSummaryEntityFormView").css("display", "none");
	});
	var currentUserId = '{{user.contactid}}';
	Disable_ContactTypeFieldsForSecondaryUser(currentUserId);
	//*******Add actions and events to contact grid ******** */
	var gridList = $(".entity-grid");
	//add onload event to grid 
	tdg.grid.Registeration_ContactGrid_Actions(gridList);
	//*********************************************** */

	//$('.create-action').on("click", function () {
	//    //alert("Test");
	//    $('#ValidationSummaryEntityFormView div').remove();
	//})
	debugger;
	sessionStorage.setItem("step_start", 2);
	//root_erap_setup();
	//make for readonly for secondary users
	//var currentUserId = '{{user.contactid}}';
	//Disable_ContactTypeFieldsForSecondaryUser(currentUserId);

	if (sessionStorage.getItem("frominyearsitepage") == "false") {
		var parentcustomerid = '{{user.parentcustomerid.Id}}';
		var filter = "statecode eq 0 and cid_portalrecordcreationdetails ne null and accountid eq " + parentcustomerid ;
		var accData = tdg.webapi.list("accounts", filter);
		if (accData != null && accData.length > 0) {
			if (accData[0].cid_portalrecordcreationdetails) // Net New Site
			{
				var withdrawLabel = tdg.error_message.message("BTN_WITHDRAW");
				$('#NextButton').parent().parent().after('<div role="group" class="pull-right toolbar-actions"><input type="button" data-dismiss="modal" value="' + withdrawLabel + '" id="WithdrawButton" style="margin-left: 10px;" name="WithdrawButton" class="btn btn-default button previous previous-btn"/></div>');
				// bind the click event to this custom buttton
				$("#WithdrawButton").bind("click", function () {
					debugger;

					var message = tdg.error_message.message("m000145");
					tdg.c.dialog_YN(message, (ans) => {
						//var contact_id = '{{user.id}}';
						if (ans) {

							var DeleteAccountFlowData = '{' +
								'"AccountId": "' + parentcustomerid + '",' +
								'}';
							console.log(DeleteAccountFlowData);
							tdg.cid.flow.Call_Flow("CID_Flow_RunCompanySitesDeleting", DeleteAccountFlowData);
							tdg.c.sign_out();
							return false;
						}
						else {
							return false;
						}
					});
				});
			}
		}
	}
	if ('{{user.cid_contacttype.Value}}' !=100000000 ) $("#WithdrawButton").remove();
});

if (window.jQuery) {
	(function ($) {
		webFormClientValidate = function () {
			debugger;
			$("#ValidationSummaryEntityFormView").css("display", "none");
			var validation = false;
			var companyId = $("#EntityFormView_EntityID").val();
			//var filter = "parentcustomerid/Id eq (guid'" + companyId + "')";
			var filter = "statecode eq 0 and _parentcustomerid_value eq " + companyId ;
			//+ "'";
			var data = tdg.webapi.list("contacts", filter);
			data = data.filter(a => a.emailaddress1 != null);
			if (data != null) {
				var primaryFound = false;
				var secondaryFound = false;
				for (i = 0; i < data.length; i++) {
					if (data[i].cid_contacttype == 100000000) primaryFound = true;
					if (data[i].cid_contacttype == 100000001) secondaryFound = true;
				}
				if (primaryFound && secondaryFound) {
					validation = true;
					return true;
				}
			}
			if (!validation) {
				tdg.c.error_message_advanced_form("m000002", true); // You cannot proceed before adding at least one secondary contact.
			}
			return validation;
		}
	}(window.jQuery));
}

function root_erap_setup() {
	debugger;
	var cid_has_cra_bn = '{{user.cid_has_cra_bn}}';
	cid_has_cra_bn = (cid_has_cra_bn == "true" ? true : false);
	var parentcustomerid = '{{user.parentcustomerid.Id}}';
	var contact_id = '{{user.id}}';
	var cid_crabusinessnumber = '{{user.cid_crabusinessnumber}}';
	tdg.root.setup(cid_has_cra_bn, cid_crabusinessnumber, parentcustomerid, contact_id);
}

function Disable_ContactTypeFieldsForSecondaryUser(currentuserId) {
	debugger;
	var cid_usercontacttype = '{{user.cid_contacttype.Value}}';

	//if not primary contact
	if (cid_usercontacttype != 100000000) {		
		$(".create-action").attr("disabled", true);
		$(".create-action").css("pointer-events", "none");
		//Wait till subgrid load
		$("#Contacts").on("loaded", function () {
			$(".btn.btn-default.btn-xs").prop("disabled", true);
			$(".details-link").prop("disabled", true);
			$(".details-link").css("pointer-events", "none");
		});
	}
}

function DeactivateContact(ContactId) {
	var cid_usercontacttype = '{{user.cid_contacttype.Value}}';
	var CurrentUserID = '{{user.id}}';
	var ParentAccount = '{{user.parentcustomerid.id}}';
	var LanguageCode = '{{website.selected_language.code}}';
	invitation.Execute_Invitation_Deactivation_Logic(ContactId, cid_usercontacttype, CurrentUserID, ParentAccount, LanguageCode);
	setTimeout(refreshGrid, 3000);

}
//refresh grid
function refreshGrid() { $(".entity-grid").trigger("refresh"); }
function ResendInvitation(contactid, fullname) {
	// get current user contact type
	var cid_usercontacttype = '{{user.cid_contacttype.Value}}';

	if (cid_usercontacttype == 100000000) {
		// retrieve contact by GUID
		var result = tdg.webapi.SelectedColumnlist("contacts", "msdyn_portaltermsagreementdate,emailaddress1",
			"contactid eq " + contactid);
		//if contact doesn't have agreement date
		if (result[0]["msdyn_portaltermsagreementdate"] == null) {
			//m000117
			var m2 = tdg.error_message.message("m000117");
			//"The Secondary Contact {0} has been re-sent an on-boarding invitation email to {1}.";
			m2 = m2.replace("{0}", fullname).replace("{1}", result[0]["emailaddress1"]);
			tdg.c.dialog_OK(m2);
			var SendEmailFlowData = '{' +
				'"Secondary_Contactid": "' + contactid + '",' +
				'"Email_Code": "S3-1",' +
				'"Portal_URL": "https://' + window.location.hostname + '"' +
				'}';
			console.log(SendEmailFlowData);
			tdg.cid.flow.Call_Flow("CID_Send_Portal_Contact_Invitations", SendEmailFlowData);
		}
		else {
			//m000154
			var m = tdg.error_message.message("m000154");
			//"The Resend Onboarding Invitation is only available to Secondary Admins that have not yet logged into the CID Platform.";
			tdg.c.dialog_OK(m);

		}
	}
	else {
		//m000155
		var mm = tdg.error_message.message("m000155");
		//"Only Primary Admin can Resend invitation.";

		tdg.c.dialog_OK(mm);
	}
}