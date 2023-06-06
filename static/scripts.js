
"use strict";

function displayMenuBox(e) {
	$(".message").empty();
	$(".message").css("display", "none");
	$(".container").css("display", "none");
	//set the login button to display the login form and disable the account creation form
	$("#createAccount").css("display", "none");
	$("#accountLogin").css("display", "block");
	$(e.target).closest(".menuButton").find(".container").css("display", "block");
	//check if the button clicked was the 'create account' button
	if ($(e.target).attr("id") == "createAccountButton") {
		$("#accountLogin").css("display", "none");
		$("#createAccount").css("display", "block");
	}
}

function displayContainer(e) {
	$(".container").css("display", "none");
	if ($(".topicList").attr("id") == "active") {
		$("#topicButtonContainer").css("display", "block");
	}
	else if ($(".claimList").attr("id") == "active") {
		$("#claimButtonContainer").css("display", "block");
	}
}

function hideBox(target) {
	// if there are no parent elements called container, then hide all containers
	if ($(".contentButton").attr("id") == "replyMove" || $(".contentButton").attr("id") == "replyDelete" || $(".contentButton").attr("id") == "reply") {
		$(".contentButton").removeAttr("id");
	}
	if ($(target).closest(".container").length == 0) {
		$(".message").empty();
		$(".container").css("display", "none");
	}
}

function loginUser(response, status) {
	$("#accountLogin .load").css("display", "none");
	$("#loginForm").css("visibility", "visible");
	$("#createAccountButton").css("visibility", "visible");
	if (response.status == 200) {
		let listObject = $.parseJSON(response.responseText);
		$("#accountLogin .message").empty();
		if (listObject.Login == "false") {
			if (listObject.username == "true") {
				//username has been found. wrong password
				$(".message").css("display", "block");
				$(".message").append("Password incorrect");
			}
			else if (listObject.username == "false") {
				//no user found
				$(".message").css("display", "block");
				$(".message").append("No user found");

			}
		}
		else if (listObject.Login == "true") {
			//enable admin features
			if (listObject.admin == "1") {
				$("#adminButton").css("display", "block");
				$(".replyAdmin > button").css("visibility", "visible");
				$(".admin").css("display", "block");

			}

			$(".container").css("display", "none");
			$("#loginButton").css("display", "none");
			$("#logout").css("display", "block");
			$(".contentButton").css("visibility", "visible");
			$(".replyButton").css("visibility", "visible");
			$(".message").empty();
			$("#loggedIn p").empty();
			$("#loggedIn p").append("Logged in as: " + listObject.username);
		}
	}
	else if (status == "timeout") {
		$("#topicButtonContainer .message").append("request timed out");
	}
}

function logoutUser(response, status) {
	if (response.status == 200) {
		let listObject = $.parseJSON(response.responseText);
		if (listObject.Logout == "true") {
			$("#adminButton").css("display", "none");
			$(".admin").css("display", "none");
			$(".replyAdmin > button").css("visibility", "hidden");
			$("#postTopicButton").css("visibility", "hidden");
			$("#postClaimButton").css("visibility", "hidden");
			$("body").removeClass("loading");
			$("#logout").css("display", "none");
			$("#loginButton").css("display", "block");
			$(".contentButton").css("visibility", "hidden");
			$(".replyButton").css("visibility", "hidden");
			$("#loggedIn p").empty();
			$("#loggedIn p").append("Logged in as: ");
		}
		else {
			alert("unable to log out. Please try again.");
		}
	}
	else if (status == "timeout") {
		alert("request timed out");
	}
}

function createTopic(response, status) {
	$("#topicButtonContainer .load").css("display", "none");
	$("#postTopic").css("visibility", "visible");
	if (response.status == 200) {
		$("#topicButtonContainer .message").empty();
		let listObject = $.parseJSON(response.responseText);
		$("body").removeClass("loading");
		$(".message").empty();
		if (listObject.Login == "true") {
			$("#topicTemplate").clone(true).insertAfter("#topicTemplate").attr("id", listObject.id);
			let topicId = "#" + listObject.id
			$(topicId + " .header").append(listObject.topic);
			$(topicId + " .author").append(listObject.username);
			$(topicId + " .time").append(listObject.timeAdded);
			$(topicId).css("display", "block");
		}
		else {
			//user is not logged in, redirect to login
			$("#postTopicButton").css("display", "none");
			$("#postTopicButton").css("visibility", "hidden");
			$("#loginButton").css("display", "block");
			$("#topicButtonContainer .message").append("You need to log in!");

		}
	}
	else if (status == "timeout") {
		$("#topicButtonContainer .message").append("request timed out");
	}
}

function createClaim(response, status) {
	$("#claimButtonContainer .load").css("display", "none");
	$("#postClaim").css("visibility", "visible");
	if (response.status == 200) {
		$("#claimButtonContainer .message").empty();
		let listObject = $.parseJSON(response.responseText);
		if (listObject.Login == "true") {
			$("#claimTemplate").clone(true).insertAfter("#claimTemplate").attr("id", listObject.ClaimId);
			$("#claimPageTemplate").clone(true).appendTo(".claimPage").attr("id", "claimPage" + listObject.ClaimId);
			let claimPageId = "#claimPage" + listObject.ClaimId;
			let claimId = "#" + listObject.ClaimId;
			$(".claimList " + claimId + " .header").append(listObject.claimHeader);
			$(".claimList " + claimId + " .author").append(listObject.username);
			$(".claimList " + claimId + " .time").append(listObject.timeAdded);
			$(".claimList " + claimId).css("display", "block");
			//add topic id to claim for future reference when deciding which topics to display
			$(".claimList " + claimId + " > .claim").attr("id", listObject.TopicId);
			$(claimPageId + " .formClaimId").val(listObject.ClaimId);
			$(claimPageId + " .claimHead").append(listObject.claimHeader);
			$(claimPageId + " .claimContent > .contents").append(listObject.claimContent);
			$(claimPageId + " .claimAuthor").append(listObject.username);
			$(claimPageId + " .claimTime").append(listObject.timeAdded);
			for (let i = 0; i < listObject.Relationship.length; i++) {
				if (listObject.Relationship[i].type == 0) {
					$(claimPageId + " .opposed > .contents").append("<a href ='#' onclick = 'findClaimPage(event);' id = " + listObject.Relationship[i].relatedClaim + ">Link to claim</a><br>");
				}
				else if (listObject.Relationship[i].type == 1) {
					$(claimPageId + " .equivalent > .contents").append("<a href ='#' onclick = 'findClaimPage(event);' id = " + listObject.Relationship[i].relatedClaim + ">Link to claim</a><br>");
				}

			}
			// remove opposed/equivalent stored within form
			$("#postClaimSubmit").nextAll().remove();
		}
		else {
			//user is not logged in, redirect to login
			$("#postClaimButton").css("visibility", "hidden");
			$("#loginButton").css("display", "block");
			$("#claimButtonContainer .message").append("You need to log in!");
		}
	}
	else if (status == "timeout") {
		$("#claimButtonContainer .message").append("request timed out");
	}
}

function createAccount(response, status) {
	$("#createAccountForm").css("visibility", "visible");
	$("#createAccount .load").css("display", "none");
	if (response.status == 200) {

		$("#accountLogin").css("display", "block");
		$("#createAccount .message").empty();
		let listObject = $.parseJSON(response.responseText);
		if (listObject.created == "false" || listObject.username == "false") {
			$("#accountLogin .message").css("display", "block");
			$("#accountLogin .message").append("Unable to create account");
			$("#createAccount").css("display", "none");
		}
		else if (listObject.created == "true" && listObject.username == "true") {
			$("#accountLogin .message").css("display", "block");
			$("#accountLogin .message").append("Account created successfully");
			$("#createAccount").css("display", "none");
		}
	}
	else if (status == "timeout") {
		$("#claimButtonContainer .message").append("request timed out");
	}
}

function accountValidation() {
	let username = document.forms["createAccountForm"]["userNameCreate"].value;
	let pass = document.forms["createAccountForm"]["passwordCreate"].value;
	let passConfirm = document.forms["createAccountForm"]["passwordConfirm"].value;
	$(".message").empty();
	if (username.length < 6 || username.length > 10) {
		$(".message").css("display", "block");

		$(".message").append("Invalid username length. Please enter a username between 6 and 10 characters.");

		return false;
	}
	if (pass.length < 8 || pass.length > 15) {
		$(".message").css("display", "block");

		$(".message").append("Invalid password length. Please enter a password between 8 and 15 characters.");
		return false
	}
	if (pass != passConfirm) {
		$(".message").css("display", "block");

		$(".message").append("Passwords do not match");
		return false;
	}
	return true;
}



function liveUpdate(response, status) {
	if (response.status == 200) {
		let listObject = $.parseJSON(response.responseText);

		if (listObject.Topics !== undefined && $(".searchResult").attr("id") !== "active") {
			if ($(".topicList").attr("id") == "active") {
				if (listObject.Login === "true") {
					$("#loginButton").css("display", "none");
					$("#logout").css("display", "block");
					if (listObject.AdminStatus == 1) {
						//enable admin features for user
						$(".admin").css("display", "block");
						$("#adminButton").css("display", "block");
						$(".replyAdmin > button").css("visibility", "visible");

					}
					$("#postTopicButton").css("visibility", "visible");
				}
				else {
					$("#postTopicButton").css("visibility", "hidden");
					$("#loginButton").css("display", "block");
					$("#loginButton").css("visibility", "visible");
					$("#logout").css("display", "none");
				}
			}
			let topics = [];
			//load each topic already in the DOM into an array
			$(".topicList .listContainer:not(:first)").each(function () {
				topics.push($(this).attr("id"));
			});
			for (let i = 0; i < listObject.Topics.length; i++) {
				let topicId = listObject.Topics[i].id;
				let removeTopic = topics.indexOf(topicId);
				//remove topic from array if the topic is present in the json
				if (removeTopic > -1) {
					topics.splice(removeTopic, 1);
				}
				//add any topics that are present in the json but not on the dom

				if ($(".topicList #" + topicId).length == 0) {
					$("#topicTemplate").clone(true).appendTo(".topicList").attr("id", topicId);
					$(".topicList #" + topicId + " .header").append(listObject.Topics[i].topic);
					$(".topicList #" + topicId + " .author").append(listObject.Topics[i].username);
					$(".topicList #" + topicId + " .time").append(listObject.Topics[i].timeAdded);
					$(".topicList #" + topicId).css("display", "block");
				}
			}
			//any topics left in array are searched through and used to remove from dom.
			//any dom elements that are not present in json data are therefore removed
			for (let i = 0; i < topics.length; i++) {
				$(".topicList #" + topics[i]).remove();

			}


		}

		else if (listObject.ClaimList !== undefined && $(".searchResult").attr("id") !== "active") {
			if ($(".claimList").attr("id") == "active") {
				//remove claim pages so when user goes to claim list it reupdates
				$(".claimPage").empty();
				if (listObject.Login == "true") {
					$("#loginButton").css("display", "none");
					$("#logout").css("display", "block");
					//the create claim button will not be visible if the user is selecting a claim to relate to.
					if ($(".contentButton").attr("id") === undefined) {
						$("#postClaimButton").css("visibility", "visible");
					}
					if (listObject.AdminStatus == 1) {
						$(".admin").css("display", "block");
						$("#adminButton").css("display", "block");
						$(".replyAdmin > button").css("visibility", "visible");
					}
					else {
						$(".admin").css("display", "none");
						$("#adminButton").css("display", "none");
						$(".replyAdmin > button").css("visibility", "hidden");
					}
				}
				else {
					$("#postClaimButton").css("visibility", "hidden");
					$("#loginButton").css("display", "block");
					$("#logout").css("display", "none");
				}
			}
			let claims = []
			//load each topic already in the DOM into an array
			$(".claimList .listContainer:not(:first)").each(function () {
				claims.push($(this).attr("id"));
			});
			for (let i = 0; i < listObject.ClaimList.length; i++) {
				let claimId = listObject.ClaimList[i].claimId;
				let topicId = listObject.ClaimList[i].topicId;
				let removeClaim = claims.indexOf(claimId);
				if (removeClaim > -1) {
					claims.splice(removeClaim, 1);
				}
				//remove topic from array if the topic is present in the json
				//add any topics that are present in the json but not on the dom
				if ($(".claimList #" + claimId).length == 0) {
					$("#claimTemplate").clone(true).appendTo(".claimList").attr("id", claimId);
					$(".claimList #" + claimId + " > .claim").attr("id", topicId);
					$(".claimList #" + claimId + " .header").append(listObject.ClaimList[i].claimHeader);
					$(".claimList #" + claimId + " .author").append(listObject.ClaimList[i].username);
					$(".claimList #" + claimId + " .time").append(listObject.ClaimList[i].timeAdded);
					if ($(".currentTopic").attr("id") == topicId) {
						$(".claimList #" + claimId).css("display", "block");
					}
					if ($(".contentButton").attr("id") == "opposedSelect" || $(".contentButton").attr("id") == "equivalentSelect") {
						$(".claimList #" + claimId + " > .claimListCheckBox").css("display", "block");
					}
				}
				//remove any duplicates that could potentially appear
			}
			for (let i = 0; i < claims.length; i++) {
				$(".claimList #" + claims[i]).remove();
			}
		}
		if (listObject.ClaimAuthor !== undefined && $(".claimPage").attr("id") == "active") {

			let claimId = "#claimPage" + listObject.ClaimId;
			if (listObject.Login === "true") {
				$("#loginButton").css("display", "none");
				$("#logout").css("display", "block");
				$(".replyButton").css("visibility", "visible");
				if (listObject.AdminStatus == 1) {
					$(".admin").css("display", "block");
					$("#adminButton").css("display", "block");
					//only show buttons when the user is an admin and they are not currently in the middle of moving, deleting or replying
					if ($(".contentButton").attr("id") == undefined) {
						$(".replyAdmin > button").css("visibility", "visible");
					}

				}
				else {

					$(".admin").css("display", "none");
					$("#adminButton").css("display", "none");
					$(".replyAdmin > button").css("visibility", "hidden");
				}

			}
			else if (listObject.Login === "false") {

				$("#logout").css("display", "none");
				$("#loginButton").css("display", "block");
				$(".replyButton").css("visibility", "hidden");
			}

			if ($(".claimPage").find(claimId).length < 1) {
				$("#claimPageTemplate").clone(true).appendTo(".claimPage").attr("id", "claimPage" + listObject.ClaimId);
				$(claimId + " .claimHead").append(listObject.claimHeader);
				$(claimId + " .claimContent > .contents").append(listObject.ClaimContent);
				$(claimId + " .claimAuthor").append(listObject.ClaimAuthor);
				$(claimId + " .claimTime").append(listObject.timeAdded);
				$(claimId + " .formClaimId").val(listObject.ClaimId);
				$(".claimPage").find(claimId).css("display", "block");
			}
			//update the opposed and equivalent relationships for the claim page
			for (let i = 0; i < listObject.claimRelationship.length; i++) {
				if (listObject.claimRelationship[i].type == 0 && $(claimId + " .opposed #" + listObject.claimRelationship[i].relatedClaim).length == 0) {
					$(claimId + " .opposed > .contents").append("<a href ='#' onclick = 'findClaimPage(event);' id = " + listObject.claimRelationship[i].relatedClaim + ">Link to claim</a><br>");
				}
				else if (listObject.claimRelationship[i].type == 1 && $(claimId + " .opposed #" + listObject.claimRelationship[i].relatedClaim).length == 0) {
					$(claimId + " .equivalent > .contents").append("<a href ='#' onclick = 'findClaimPage(event);' id = " + listObject.claimRelationship[i].relatedClaim + ">Link to claim</a><br>");
				}
			}
			//loop through the replies creating the reply and subreply structure				
			for (let i = 0; i < listObject.Replies.length; i++) {
				let replyId = "#reply" + listObject.Replies[i].replyId;
				let parentReply = "#subReply" + listObject.Replies[i].parentReply;
				$(".claimPage").find(claimId).find(".noReplies").css("display", "none");
				if ($(replyId).length == 0) {
					$("#replyTemplate").clone(true).appendTo(claimId).attr("id", "reply" + listObject.Replies[i].replyId);
					$(replyId).val(listObject.Replies[i].replyId);
					$(replyId + " .claimAuthor").append(listObject.Replies[i].username);
					$(replyId + " .claimTime").append(listObject.Replies[i].timeAdded);
					$(replyId + " .replyContents").append(listObject.Replies[i].replyContent);
					$(replyId + " .replyTypeContent").append(listObject.Replies[i].relationship);
					$(replyId + " .noReplies").css("display", "none");
					$(replyId + " .parentReplyId").val(listObject.Replies[i].replyId);
					$(replyId + " > .replyContainer .showReplies").val("reply");
					$(replyId).css("display", "block");
				}
				if (listObject.Replies[i].parentReply == "None") {
					parentReply = "#reply" + listObject.Replies[i].replyId;
				}
				let subReplyId = "#subReply" + listObject.Replies[i].subReply;
				if ($(subReplyId).length == 0 && $(parentReply + " > " + subReplyId).length == 0 && listObject.Replies[i].subReply != null) {
					$("#replyTemplate").clone(true).appendTo($(parentReply)).attr("id", "subReply" + listObject.Replies[i].subReply);
					$(subReplyId + " > .replyContainer .showReplies").val("subReply");
					$(subReplyId + " > .replyContainer .parentType").val("ancestor");
					$(subReplyId).parent().find(" > .replyContainer .showReplies").css("display", "block");
				}
			}
			$(".currentClaim").attr("id", listObject.ClaimId);
		}
	}

}

function showClaimsList() {
	window.scrollTo(0, 0);
	if ($(".topicList").attr("id") === "active") {
		$(".topicList").removeAttr("id");
		$("#postTopicButton").css("display", "none");
		$(".topicList .listContainer").css("display", "none");
		$(".container").css("display", "none");
	}
	else if ($(".claimPage").attr("id") === "active") {
		//and remove the id that shows the page is active for the user
		$(".claimPage").removeAttr("id");
		$(".claimContainer").css("display", "none");
		$(".container").css("display", "none");
	}
	if ($(".searchResult").attr("id") == "active") {
		$(".searchResult").css("display", "none");
		$(".claimPage").css("display", "block");
		$("#noResults").nextAll().remove();
		$(".searchResult").removeAttr("id");
	}
	//set the claim list to active and show any claims that may be hidden on the DOM
	$(".claimList").attr("id", "active");
	$("#postClaimButton").css("display", "block");
	$(".claimList").css("display", "block");
	$("#closeClaimList").click(e => { showTopicList(); });
	if ($(".contentButton").attr("id") == "opposedSelect" || $(".contentButton").attr("id") == "equivalentSelect" || $(".contentButton").attr("id") == "move") {
		$("#closeClaimList").css("display", "none");
		$("#selectClaimList").css("display", "block");
		$("#cancelSelector").css("display", "block");
		$(".topicCheckBox").css("display", "none");
	}
	else {
		$("#selectClaimList").css("display", "none");
		$("#cancelSelector").css("display", "none");
		$("#closeClaimList").css("display", "block");
	}
	$(".claimList .listContainer:not(:first)").each(function () {
		if ($(".currentTopic").attr("id") == $(this).find(".claim").attr("id")) {
			if ($(this).height() != $("#claimTemplate").height()) {
				$(this).animate({ width: '80%' }, 500);
			}
			if ($(".contentButton").attr("id") == "opposedSelect" || $(".contentButton").attr("id") == "equivalentSelect") {
				$(this).find(".claimListCheckBox").css("display", "block");
			}
			$(this).find(".claimListCheckBox:checked").prop("checked", false);
			$(this).css("display", "block");
		}
		else {
			$(this).css("display", "none");
		}
	});
}
function showClaimPage(id) {
	window.scrollTo(0, 0);
	$(".container").css("display", "none");
	if ($(".searchResult").attr("id") == "active") {
		$(".searchResult").css("display", "none");
		if ($(".topicList").attr("id") === "active") {
			$(".topicList").removeAttr("id");
			$(".claimList").attr("id", "active");
		}
		$("#noResults").nextAll().remove();
		$(".searchResult").removeAttr("id");
	}
	if ($(".claimList").attr("id") === "active" || $(".claimPage").attr("id") === "active") {
		$(".claimList").css("display", "none");
		$("#postClaimButton").css("visibility", "hidden");
		$(".claimList .listContainer").css("display", "none");
		$(".claimList").removeAttr("id");
		$(".claimPage").attr("id", "active");
		$(".currentClaim").attr("id", id);
		let claimPresent = false;
		$(".claimPage > .claimContainer").each(function () {
			let claimPageid = "claimPage" + id;
			if (claimPageid == $(this).attr("id")) {
				claimPresent == true;
				$(this).css("display", "block");
			}
		});
		if (claimPresent === false) {
			ajaxGetRequest("claimPage", id);
		}
	}
}
function createReply(response, status) {
	$(".container .load").css("display", "none");
	$(".postReply").css("visibility", "visible");
	if (response.status == 200) {
		$(".container .message").empty();
		let listObject = $.parseJSON(response.responseText);
		if (listObject.Login == "true") {
			let claimId = "#claimPage" + listObject.ClaimId;
			let replyId = "#reply" + listObject.replyId;
			$("#replyTemplate").clone(true).appendTo($(claimId)).attr("id", "reply" + listObject.replyId);
			$(replyId).val(listObject.replyId);
			$(replyId + " > .replyContainer .claimAuthor").append(listObject.username);
			$(replyId + " > .replyContainer .claimTime").append(listObject.timeAdded);
			$(replyId + " > .replyContainer .replyContents").append(listObject.replyContent);
			$(replyId + " > .replyContainer .replyTypeContent").append(listObject.relationship);
			//$(replyId + " .showReplies").css("display", "none");
			$(replyId + " > .replyContainer .parentReplyId").val(listObject.replyId);
			$(replyId + " > .replyContainer .showReplies").val("reply");
			$(claimId + " .noReplies").css("display", "none");
			$(replyId).css("display", "block");
		}
		else {
			//user is not logged in, redirect to login
			$(".replyButton").css("visibility", "hidden");
			$("#loginButton").css("display", "block");
			$(".message").append("You need to log in!");
		}
	}
	else if (status == "timeout") {
		$(".container .message").append("request timed out.");
	}
}
function createSubReply(response, status) {
	$(".replyAdmin .load").css("display", "none");
	$(".formSubReply").css("visibility", "visible");
	if (response.status == 200) {

		$(".replyAdmin .message").empty();
		let listObject = $.parseJSON(response.responseText);
		let subReplyId = "#subReply" + listObject.subReplyId;
		if (listObject.Login == "true") {
			if (listObject.parentType == "ancestor") { $("#replyTemplate").clone(true).appendTo($("#subReply" + listObject.topReply)).attr("id", "subReply" + listObject.subReplyId); }
			else if (listObject.parentType == "parent") { $("#replyTemplate").clone(true).appendTo($("#reply" + listObject.topReply)).attr("id", "subReply" + listObject.subReplyId); }
			$(subReplyId).val(listObject.subReplyId);
			$(subReplyId + " > .replyContainer .claimAuthor").append(listObject.username);
			$(subReplyId + " > .replyContainer .claimTime").append(listObject.timeAdded);
			$(subReplyId + " > .replyContainer .replyContents").append(listObject.replyContent);
			$(subReplyId + " > .replyContainer .replyTypeContent").append(listObject.relationship);
			$(subReplyId + " > .replyContainer .parentType").val("ancestor");
			$(subReplyId + " > .replyContainer .parentReplyId").val(listObject.topReply);
			$(subReplyId + " > .replyContainer .currentReplyId").val(listObject.subReplyId);
			$(subReplyId + " > .replyContainer .showReplies").val("subReply");
			$(subReplyId).val(listObject.subReplyId);
			$(subReplyId).css("display", "block");
			$(".replyAdmin .message").append("SubReply created!");
		}
		else {
			//user is not logged in, redirect to login
			$("#logoutButton").css("display", "none");
			$("#loginButton").css("display", "block");
			$(".replyAdmin .message").append("You need to log in!");
		}
	}
	else if (status == "timeout") {
		$(".replyAdmin .message").append("request timed out.");
	}
}
function showSubReplies(response, status) {
	$(".replyShow .load").css("display", "none");
	$(".showReplies").css("visibility", "visible");
	if (response.status == 200) {
		let listObject = $.parseJSON(response.responseText);
		$(".message").empty();
		for (let i = 0; i < listObject.subReplies.length; i++) {
			let topReply = "#reply" + listObject.subReplies[i].topReply;
			let subReplyId = "#subReply" + listObject.subReplies[i].subReplyId;
			if (($(subReplyId).is(":hidden"))) {
				$(subReplyId).val(listObject.subReplies[i].subReplyId);
				$(subReplyId + " > .replyContainer .claimAuthor").append(listObject.subReplies[i].username);
				$(subReplyId + " > .replyContainer .claimTime").append(listObject.subReplies[i].timeAdded);
				$(subReplyId + " > .replyContainer .replyContents").append("<p>" + listObject.subReplies[i].replyContent + "</p>");
				$(subReplyId + " > .replyContainer .replyTypeContent").append(listObject.subReplies[i].relationship);
				$(subReplyId + " > .replyContainer .parentReplyId").val(listObject.subReplies[i].topReply);
				$(subReplyId + " > .replyContainer .currentReplyId").val(listObject.subReplies[i].subReplyId);
				$(subReplyId).css("display", "block");
			}
			if (($(subReplyId).is(":visible"))) {
				$(subReplyId).parent("> .replyContainer .showReplies").css("display", "none");
			}
		}
	}
	else if (status == "timeout") {
		$(".replyShow .message").append("request timed out.");
	}
}
function displaySubReplies(e) {
	let replyType = e.target.value;
	let id = $(e.target).closest(".replies").val();
	$(".replyShow .load").css("display", "block");
	$(".showReplies").css("visibility", "hidden");
	e.preventDefault();
	$.ajax({
		url: "../showSubReplies",
		method: "get",
		data: {
			replyType: replyType,
			replyId: id
		},
		timeout: 500,
		complete: showSubReplies
	});
}


function showTopicList() {
	if ($(".claimList").attr("id") === "active") {
		$(".claimList").css("display", "none");
		$(".claimList").removeAttr("id");
		$(".claimList .listContainer").css("display", "none");
		$("#postClaimButton").css("display", "none");
		$("#equivDisplay").empty();
		$("#opposedDisplay").empty();
		$("#postClaimSubmit").nextAll('input').remove();
	}
	$("#postTopicButton").css("display", "block");
	$(".topicList").attr("id", "active");
	$(".topicList .listContainer:not(:first)").each(function () {
		$(this).css("display", "block");
	});
}

function showTopicListSelector() {
	if ($(".claimList").attr("id") === "active") {
		//resizes and unchecks any claims that might have been selected before choosing the opposed/equivalent selector
		$(".claimList .listContainer:not(:first)").each(function () {
			if ($(".currentTopic").attr("id") == $(this).find(".claim").attr("id")) {
				if ($(this).height() != $("#claimTemplate").height()) {
					$(this).animate({ width: '80%' }, 500);
				}
				$(this).find(".claimListCheckBox:checked").prop("checked", false);
			}
		});
		$(".claimList").css("display", "none");
		$(".claimList").removeAttr("id");
		$(".claimList .listContainer").css("display", "none");
		$("#postClaimButton").css("visibility", "hidden");
	}
	$(".topicList").attr("id", "active");
	$(".topicList .listContainer:not(:first)").each(function () {
		$(this).find(".topicCheckBox").css("display", "block");
		$(this).css("display", "block");
	});
}

function placeDisplay(response, status) {
	$(".moveDisplay .load").css("display", "none");
	$(".moveDisplay > button").css("visibility", "visible");
	$(".admin > button").css("visibility", "visible");
	if (response.status == 200) {
		$(".moveDisplay .message").empty();
		let listObject = $.parseJSON(response.responseText);
		if (listObject.login == "true") {
			if (listObject.admin == "true") {
				if (listObject.move == "true") {
					$("#" + listObject.currentId).find(".moveDisplay").css("display", "none");
					$("#" + listObject.currentId).find(".moveDisplay").removeAttr("id");
					$("#" + listObject.currentId).find(".topic, .claim").css("visibility", "visible");
				}
				else {
					$("#" + listObject.currentId).find(".moveDisplay").css("display", "block");
					$(".moveDisplay .message").append("Unable to move selected.");
				}
			}
			else {
				$("#" + listObject.currentId).find(".moveDisplay").css("display", "block");
				$(".moveDisplay .message").append("You are not an admin!");
			}
		}
		else {
			$("#logoutButton").css("display", "none");
			$("#loginButton").css("display", "block");
			$(".moveDisplay .message").append("You need to log in!");
		}
	}
	else if (status == "timeout") {
		alert("request timed out.");
	}
}

function placeReplyDisplay(response, status) {
	$(".moveReplyDisplay > button").css("visibility", "visible");
	$(".moveReplyDisplay .load").css("display", "none");
	$(".contentButton").removeAttr("id");
	if (response.status == 200) {
		$(".moveReplyDisplay .message").empty();
		let listObject = $.parseJSON(response.responseText);
		if (listObject.login == "true") {
			if (listObject.admin == "true") {
				if (listObject.move == "true") {
					$("#" + listObject.currentId).find(".movereplyDisplay").css("display", "none");
					$("#" + listObject.currentId).find(".movereplyDisplay").removeAttr("id");
					$("#" + listObject.currentId).find(".replyContents").css("display", "block");
				}
				else {
					$(".moveReplyDisplay .message").append("unable to move reply. please try again.");
				}
			}
			else {
				$("#" + listObject.currentId).find(".moveReplyDisplay").css("display", "block");
				$(".moveReplyDisplay .message").append("You are not an admin!");
			}
		}
		else {
			$("#logoutButton").css("display", "none");
			$("#loginButton").css("display", "block");
			$(".moveReplyDisplay .message").append("You need to log in!");
		}
	}
	else if (status == "timeout") {
		$(".moveReplyDisplay .message").append("request timed out.");
	}
}

function deleteReply(response, status) {
	$(".contentButton").removeAttr("id");
	$(".deleteDisplay > button").css("visibility", "visible");
	$(".deleteDisplay .load").css("display", "none");
	if (response.status == 200) {
		$(".deleteDisplay .message").empty();
		let listObject = $.parseJSON(response.responseText);
		if (listObject.login == "true") {
			if (listObject.admin == "true") {
				if (listObject.deleted == "true") {
					$("#" + listObject.replyId + " > .replyContainer").find(".deleteDisplay").css("display", "none");
					$("#" + listObject.replyId + " > .replyContainer .replyContents").empty();
					$("#" + listObject.replyId + " > .replyContainer .replyContents").append("reply deleted");
					$("#" + listObject.replyId + " > .replyContainer").find(".replyContents").css("display", "block");
				}
				else {
					$(".deleteDisplay .message").append("unable to delete reply. please try again.");
				}
			}
			else {
				$("#" + listObject.replyId).find(".deleteDisplay").css("display", "block");
				$(".deleteDisplay .message").append("You are not an admin!");
			}
		}
		else {
			$("#logoutButton").css("display", "none");
			$("#loginButton").css("display", "block");
			$(".deleteDisplay .message").append("You need to log in!");
		}
	}
	else if (status == "timeout") {
		$(".deleteDisplay .message").append("request timed out.");
	}
}
function deleteClaim(response, status) {
	$(".deleteDisplay > button").css("visibility", "visible");
	$(".deleteDisplay .load").css("display", "none");
	if (response.status == 200) {
		let listObject = $.parseJSON(response.responseText);
		if (listObject.login == "true") {
			if (listObject.admin == "true") {
				if (listObject.deleted == "true") {
					$(".admin > button").css("visibility", "visible");
					$(".claimList #" + listObject.claimId).remove();
					$(".claimPage #claimPage" + listObject.claimId).remove();
				}
				else {
					$(".deleteDisplay .message").append("unable to delete claim. please try again.");
				}

			}
			else {
				$("#" + listObject.claimId).find(".deleteDisplay").css("display", "block");
				$(".deleteDisplay .message").append("You are not an admin!");
			}
		}
		else {
			$("#logoutButton").css("display", "none");
			$("#loginButton").css("display", "block");
			$(".deleteDisplay .message").append("You need to log in!");
		}
	}
	else if (status == "timeout") {
		$(".deleteDisplay .message").append("request timed out.");
	}

}

function deleteTopic(response, status) {
	$(".deleteDisplay > button").css("visibility", "visible");
	$(".deleteDisplay .load").css("display", "none");
	$(".deleteDisplay .message").css("display", "block");
	if (response.status == 200) {
		let listObject = $.parseJSON(response.responseText);
		if (listObject.login == "true") {
			if (listObject.admin == "true") {
				if (listObject.deleted == "true") {
					$(".admin > button").css("visibility", "visible");
					$(".claimList .listContainer").each(function () {
						if ($(this).find(".claim").attr("id") == listObject.topicId) {
							$("#claimPage" + $(this).attr("id")).remove();
							$(this).remove();
						}
					})
					$(".topicList #" + listObject.topicId).remove();
				}
				else {
					$(".deleteDisplay .message").append("unable to delete topic. please try again.");
				}
			}
			else {
				$("#" + listObject.topicId).find(".deleteDisplay").css("display", "block");
				$(".deleteDisplay .message").append("You are not an admin!");
			}
		}
		else {
			$("#logoutButton").css("display", "none");
			$("#loginButton").css("display", "block");
			$(".deleteDisplay .message").append("You need to log in!");
		}
	}
	else if (status == "timeout") {
		$(".deleteDisplay .message").append("request timed out.");
	}
}

function findClaimPage(e) {
	//set the current claim to the one the user has been linked to
	$(".currentClaim").attr("id", $(e.target).attr("id"));
	$(e.target).closest(".claimContainer").css("display", "none");
	showClaimPage($(e.target).attr("id"));
}

function assignAdmin(response, status) {

	$("#adminPanel > form").css("visibility", "visible");
	$("#adminPanel .load").css("display", "none");

	if (response.status == 200) {

		$("#adminPanel .message").empty();
		let listObject = response.responseJSON;

		if (listObject.login == "true") {
			if (listObject.admin == "true") {
				if (listObject.successful == "true") {
					$("#confirmChangeDisplay").append("<p>Assign admin to " + $("#adminAssign").val() + " </p>");
					$("#confirmChangeDisplay").append("<input type = 'hidden' name = 'adminCreate' id = 'adminCreate' value = '" + $("#adminAssign").val() + "'>");
				}
				else {
					$("#adminPanel .message").css("display", "block");
					$("#adminPanel .message").append("Unable to find username.");
				}
			}
			else {
				$("#adminPanel .message").css("display", "block");
				$("#adminPanel .message").append("You are not an admin!");
			}
		}
		else {
			$("#logoutButton").css("display", "none");
			$("#loginButton").css("display", "block");
			$("#adminPanel .message").css("display", "block");
			$("#adminPanel .message").append("You need to log in!");
		}


	}
	else if (status == "timeout") {
		$("#adminPanel .message").css("display", "block");
		$("#adminPanel .message").append("request timed out.");
	}

}
function deleteUserCheck(response, status) {
	$("#adminPanel > form").css("visibility", "visible");
	$("#adminPanel .load").css("display", "none");
	if (response.status == 200) {
		$("#adminPanel .message").empty();
		let listObject = response.responseJSON;
		if (listObject.login == "true") {
			if (listObject.admin == "true") {
				if (listObject.successful == "true") {
					$("#confirmChangeDisplay").append("<p>Delete user : " + $("#deleteUser").val() + " </p>");
					$("#confirmChangeDisplay").append("<input type = 'hidden' name = 'deleteUser' id = 'deleteUserAdmin' value = '" + $("#deleteUser").val() + "'>");
				}
				else {
					$("#adminPanel .message").css("display", "block");
					$("#adminPanel .message").append("Unable to find username.");
				}

			}
			else {
				$("#adminPanel .message").css("display", "block");
				$("#adminPanel .message").append("You are not an admin!");
			}

		}
		else {
			$("#logoutButton").css("display", "none");
			$("#loginButton").css("display", "block");
			$("#adminPanel .message").css("display", "block");
			$("#adminPanel .message").append("You need to log in!");
		}


	}
	else if (status == "timeout") {
		$("#adminPanel .message").css("display", "block");
		$("#adminPanel .message").append("request timed out.");
	}

}
function confirmChanges(response, status) {
	$("#adminPanel > form").css("visibility", "visible");
	$("#adminPanel .load").css("display", "none");
	$("#adminPanel .message").css("display", "block");
	if (response.status == 200) {

		$("#adminPanel .message").empty();
		let listObject = response.responseJSON;

		$("#confirmChangeDisplay").empty();
		if (listObject.login == "true") {
			if (listObject.admin == "true") {
				for (let i = 0; i < listObject.operations.length; i++) {
					let count = i + 1;
					if (listObject.operations[i].successful == "true") {
						$("#adminPanel .message").append(listObject.operations[i].action + ":change successful!<br>");
					}
					else {
						$("#adminPanel .message").append(listObject.operations[i].action + ":unable to change!<br>");
					}
				}

			}
			else {
				$("#adminPanel .message").append("You are not an admin!");
			}

		}
		else {
			$("#logoutButton").css("display", "none");
			$("#loginButton").css("display", "block");
			$("#adminPanel .message").append("You need to log in!");
		}

	}
	else if (status == "timeout") {
		$("#adminPanel .message").append("request timed out.");
	}
}
function search(response, status) {
	$("#searchForm").css("visibility", "visible");
	$("#searchContainer .load").css("display", "none");
	if (response.status == 200) {

		let listObject = response.responseJSON;

		$("#searchForm").closest(".container").css("display", "none");
		if ($(".claimPage").attr("id") === "active") {
			$(".claimPage").css("display", "none");
		}
		else if ($(".topicList").attr("id") === "active") {
			$(".topicList .listContainer").css("display", "none");
		}
		else if ($(".claimList").attr("id") === "active") {
			$(".claimList").css("display", "none");
		}
		$(".searchResult").css("display", "block");
		if (listObject.ClaimData !== undefined) {
			$(".searchResult").attr("id", "active");
			if (listObject.ClaimData.length > 0) {
				$("#noResults").css("display", "none");
				for (let i = 0; i < listObject.ClaimData.length; i++) {
					$(".claimList #" + listObject.ClaimData[i].id).clone(true).insertAfter("#noResults");
					$(".searchResult #" + listObject.ClaimData[i].id).css("display", "block");
				}
			}
			else {
				$("#noResult").css("display", "block");
			}
		}
		else if (listObject.TopicData !== undefined) {
			$(".searchResult").attr("id", "active");
			if (listObject.TopicData.length > 0) {
				$("#noResults").css("display", "none");
				for (let i = 0; i < listObject.TopicData.length; i++) {
					$(".topicList #" + listObject.TopicData[i].id).clone(true).insertAfter("#noResults");
					$(".searchResult #" + listObject.TopicData[i].id).css("display", "block");
				}
			}
			else {
				$("#noResult").css("display", "block");
			}
		}
	}
	else if (status == "timeout") {
		$("#searchContainer .message").append("request timed out.");
	}

}

function setup() {
	$("#closeSearchList").click(e => {
		$(".searchResult").css("display", "none");

		if ($(".claimPage").attr("id") === "active") {
			$(".claimPage").css("display", "block");
		}
		else if ($(".topicList").attr("id") === "active") {
			$(".topicList .listContainer:not(:first)").css("display", "block");
		}
		else if ($(".claimList").attr("id") === "active") {
			$(".claimList").css("display", "block");
		}
		$("#noResults").nextAll().remove();
		$(".searchResult").removeAttr("id");


	})
	$("#searchForm").on("submit", function (e) {
		$("#searchForm").css("visibility", "hidden");
		$("#searchContainer .load").css("display", "block");
		e.preventDefault();
		$.ajax({
			url: "../search",
			method: "post",
			dataType: "json",
			data: $(this).serialize(),
			timeout: 500,
			complete: search
		});
	})
	$("#adminButton").click(e => { e.stopPropagation(); displayMenuBox(e); });
	$("div.deleteDisplay > .noDelete").click(e => {
		$(".admin > button").css("visibility", "visible");
		$(e.target).closest(".deleteDisplay").css("display", "none");
		$(e.target).closest(".listContainer").find(".claim, .topic").css("visibility", "visible");

	});

	$("td.deleteDisplay > .noDelete").click(e => {
		$(e.target).closest(".deleteDisplay").css("display", "none");
		$(e.target).closest(".replies").find(".replyContents").css("display", "block");
	});

	$(".topicList .yesDelete").click(e => {
		$(".delete").css("visibility", "hidden");
		$(".deleteDisplay > button").css("visibility", "hidden");
		$(".deleteDisplay .load").css("display", "block");
		let topicId = $(e.target).closest(".listContainer").attr("id");
		$.ajax({
			url: "../deleteTopic",
			method: "get",
			data: {
				topicId: topicId
			}
			,
			timeout: 500,
			complete: deleteTopic
		});
	});
	$(".claimList .yesDelete").click(e => {
		$(".deleteDisplay > button").css("visibility", "hidden");
		$(".deleteDisplay .load").css("display", "block");
		let claimId = $(e.target).closest(".listContainer").attr("id");
		$.ajax({
			url: "../deleteClaim",
			method: "get",
			data: {
				claimId: claimId
			}
			,
			timeout: 500,
			complete: deleteClaim
		});
	});
	$("td.deleteDisplay > .yesDelete").click(e => {

		$(".deleteDisplay > button").css("visibility", "hidden");
		$(".deleteDisplay .load").css("display", "block");
		let replyId = $(e.target).closest(".replies").attr("id");
		let replyType = $(e.target).parent().parent().find(".parentType").val();
		if (replyType == "ancestor") {
			replyId = replyId.replace("subReply", "");
		}
		else if (replyType == "parent") {
			replyId = replyId.replace("reply", "");

		}
		$.ajax({
			url: "../deleteReply",
			method: "get",
			data: {
				replyId: replyId,
				replyType: replyType
			}
			,
			timeout: 500,
			complete: deleteReply
		});
	});
	$("#claimPageTemplate .closeClaimPage").click(e => { showClaimsList(); });
	$("#loginButton").click(e => { e.stopPropagation(); displayMenuBox(e); });
	$("#searchButton").click(e => { e.stopPropagation(); displayMenuBox(e); });
	$("#createAccountButton").click(e => { e.stopPropagation(); displayMenuBox(e); });
	$("#postTopicButton").click(e => { e.stopPropagation(); displayContainer(e); });
	$("#postClaimButton").click(e => { e.stopPropagation(); $("#postClaim > #formTopicId").val($(".currentTopic").attr("id")); displayContainer(e); });
	$(".showReplies").on("click", function (e) { e.stopPropagation(); displaySubReplies(e); });
	$(".replyAdmin .subReplySubmit").on("click", function (e) {
		e.stopPropagation();
		$(".contentButton").attr("id", "reply");
		$(".moveReply").css("visiblity", "hidden");
		$(".deleteReply").css("visiblity", "hidden");
		$(".subReplySubmit").not(e.target).css("visiblity", "hidden");
		$(this).closest(".replyContainer").find(".container").css("display", "block");
	});
	$("#claimPageTemplate .replyButton").click(function (e) { e.stopPropagation(); $(e.target).closest(".claimContent").find(".container").css("display", "block"); });
	$(".move").click(function showDisplay(e) {
		e.stopPropagation();

		$(e.target).closest(".listContainer").find(".topic, .claim").css("visibility", "hidden");
		$(e.target).closest(".listContainer").find(".moveDisplay").css("display", "block");
		let target = e;
		$(".delete").css("visibility", "hidden");
		$(".move").not(e.target).css("visibility", "hidden");
		$(document).click(e => {
			if ($(e.target).closest(".listContainer .admin").length == 1 || $(e.target).closest(".listContainer").length == 0) {
				$(target.target).closest(".listContainer").find(".moveDisplay").css("display", "none");
				$(target.target).closest(".listContainer").find(".topic, .claim").css("visibility", "visible");
				$(".delete").css("visibility", "visible");
				$(".move").css("visibility", "visible");
			}
		});
	});
	$(".moveReply").click(function showReplyDisplay(e) {
		e.stopPropagation();
		$(".contentButton").attr("id", "replyMove");
		$(e.target).closest(".replyContainer").find(".replyContents").css("display", "none");
		$(e.target).closest(".replyContainer").find(".movereplyDisplay").css("display", "block");
		$(".deleteReply").css("visibility", "hidden");
		$(".subReplySubmit").css("visibility", "hidden");
		$(".moveReply").not(e.target).css("visibility", "hidden");
		let target = e;
		$(document).click(e => {
			if ($(e.target).closest(".replyContainer .replyAdmin").length == 1 || $(e.target).closest(".replyContainer").length == 0) {
				$(".deleteReply").css("visibility", "visible");
				$(".subReplySubmit").css("visibility", "visible");
				$(".moveReply").css("visibility", "visible");
				$(target.target).closest(".replyContainer").find(".replyContents").css("display", "block");
				$(target.target).closest(".replyContainer").find(".movereplyDisplay").css("display", "none");

			}
		});
	});
	$("#selectClaimList").click(e => {
		e.stopPropagation();
		if ($(".contentButton").attr("id") == "opposedSelect" || $(".contentButton").attr("id") == "equivalentSelect") {
			$(".contentButton").removeAttr("id");
			$("#claimButtonContainer").css("display", "block");
			$("#finalSelection").remove();
			$(".claimListCheckBox").css("display", "none");

			$("#postClaim").append("<div id = 'finalSelection'></div>");
			$(".currentTopic").attr("id", $("#formTopicId").val());
			showClaimsList();
		}
		else if ($(".contentButton").attr("id") == "move") {
			$(".contentButton").removeAttr("id");
			let currentClaim = $(".currentClaim").attr("id");
			let targetTopic = $(".currentTopic").attr("id");
			$(".claimList > #" + currentClaim).find(".claim").attr("id", $(".currentTopic").attr("id"));
			$("#cancelSelector").css("display", "none");
			$("#selectClaimList").css("display", "none");
			$("#closeClaimList").css("display", "block");
			$(".claimList > #" + currentClaim).insertAfter("#claimTemplate");
			$(".claimList > #" + currentClaim).css("display", "block");
			$.ajax({
				url: "../moveClaimTopic",
				method: "get",
				data: {
					targetTopic: targetTopic,
					currentClaim: currentClaim
				}
				,
				timeout: 500,
				complete: placeDisplay
			});

		}
	});

	$("#selectTopicMove").click(e => {
		e.stopPropagation();
		$(".currentClaim").attr("id", $(e.target).closest(".listContainer").attr("id"));
		$(".contentButton").attr("id", "move");
		showTopicListSelector();

	});

	$(".moveBoxUp").click(e => {
		e.stopPropagation();
		$(".moveDisplay .message").empty();
		$(e.target).closest(".moveDisplay, .movereplyDisplay").attr("id", $(e.target).closest(".listContainer, .replies").prev().attr("id"));
		$(e.target).closest(".listContainer, .replies").insertBefore($(e.target).closest(".listContainer, .replies").prev());

	});

	$(".moveBoxDown").click(e => {
		e.stopPropagation();
		$(".moveDisplay .message").empty();
		$(e.target).closest(".moveDisplay, .movereplyDisplay").attr("id", $(e.target).closest(".listContainer, .replies").next().attr("id"));
		$(e.target).closest(".listContainer, .replies").insertAfter($(e.target).closest(".listContainer, .replies").next());

	});

	$("#placeTopic").click(e => {
		e.stopPropagation();
		$(".moveDisplay .load").css("display", "block");
		$(".moveDisplay > button").css("visibility", "hidden");
		let cTopic = $(e.target).closest(".listContainer").attr("id");
		let tTopic = $(e.target).closest(".moveDisplay").attr("id");
		$(e.target).closest(".moveDisplay").css("display", "none");
		$(e.target).closest(".moveDisplay").find(".load").css("display", "block");
		$.ajax({
			url: "../moveTopic",
			method: "get",
			data: {
				targetTopic: tTopic,
				currentTopic: cTopic
			},
			timeout: 500,
			complete: placeDisplay
		});
	});

	$("#placeClaim").click(e => {
		e.stopPropagation();
		$(".moveDisplay .load").css("display", "block");
		$(".moveDisplay > button").css("visibility", "hidden");
		let cClaim = $(e.target).closest(".listContainer").attr("id");
		let tClaim = $(e.target).closest(".moveDisplay").attr("id");
		$.ajax({
			url: "../moveClaim",
			method: "get",
			data: {
				targetClaim: tClaim,
				currentClaim: cClaim
			}
			,
			timeout: 500,
			complete: placeDisplay
		});
	});

	$(".placeReply").click(e => {
		e.stopPropagation();
		$(".moveReplyDisplay > button").css("visibility", "hidden");
		$(".moveReplyDisplay .load").css("display", "block");
		let cReply = $(e.target).closest(".replies").attr("id");
		let tReply = $(e.target).closest(".movereplyDisplay").attr("id");
		let replyType = $(e.target).parent().parent().find(".parentType").val();
		if (replyType == "ancestor") {
			cReply = cReply.replace("subReply", "");
			tReply = tReply.replace("subReply", "");
		}
		else if (replyType == "parent") {
			cReply = cReply.replace("reply", "");
			tReply = tReply.replace("reply", "");
		}
		$.ajax({
			url: "../moveReply",
			method: "get",
			data: {
				replyType: replyType,
				targetReply: tReply,
				currentReply: cReply
			}
			,
			timeout: 500,
			complete: placeReplyDisplay
		});
	});

	$(".deleteReply").click(function (e) {
		e.stopPropagation();
		$(".contentButton").attr("id", "replyDelete");
		$(".moveReply").css("visibility", "hidden");
		$(".subReplySubmit").css("visibility", "hidden");
		$(".deleteReply").not(e.target).css("visibility", "hidden");
		$(e.target).closest(".replyContainer").find(".replyContents").css("display", "none");
		$(e.target).closest(".replyContainer").find(".deleteDisplay").css("display", "block");
		let target = e;
		$(document).click(e => {
			if ($(e.target).closest(".replyContainer .replyAdmin").length == 1 || $(e.target).closest(".replyContainer").length == 0) {
				$(".moveReply").css("visibility", "visible");
				$(".subReplySubmit").css("visibility", "visible");
				$(".deleteReply").css("visibility", "visible");
				$(target.target).closest(".replyContainer").find(".replyContents").css("display", "block");
				$(target.target).closest(".replyContainer").find(".deleteDisplay").css("display", "none");
			}
		});

	});

	$(".delete").click(function (e) {
		e.stopPropagation();


		$(e.target).closest(".listContainer").find(".topic, .claim").css("visibility", "hidden");
		$(e.target).closest(".listContainer").find(".deleteDisplay").css("display", "block");
		let target = e;
		$(".move").css("visibility", "hidden");
		$(".delete").not(e.target).css("visibility", "hidden");
		$(document).click(e => {
			if ($(e.target).closest(".listContainer .admin").length == 1 || $(e.target).closest(".listContainer").length == 0) {
				$(target.target).closest(".listContainer").find(".topic, .claim").css("visibility", "visible");
				$(target.target).closest(".listContainer").find(".deleteDisplay").css("display", "none");
				$(".move").css("visibility", "visible");
				$(".delete").css("visibility", "visible");

			}

		});
	});

	$("#opposedClaim").click(e => { e.preventDefault(); $(".contentButton").attr("id", "opposedSelect"); $(e.target).closest(".container").css("display", "none"); showTopicListSelector(); });
	$("#equivalentClaim").click(e => { e.preventDefault(); $(".contentButton").attr("id", "equivalentSelect"); $(e.target).closest(".container").css("display", "none"); showTopicListSelector(); });

	$(".postReply").on("submit", function (e) {
		$(".container .load").css("display", "block");
		$(".postReply").css("visibility", "hidden");
		e.preventDefault();

		$.ajax({
			url: "../createReply",
			method: "post",
			data: $(this).serialize(),
			timeout: 500,
			complete: createReply
		});


	});
	$(".formSubReply").on("submit", function (e) {
		e.preventDefault();
		$(".replyAdmin .load").css("display", "block");
		$(".formSubReply").css("visibility", "hidden");
		$.ajax({
			url: "../createSubReply",
			method: "post",
			data: $(this).serialize(),
			timeout: 500,
			complete: createSubReply
		});
	});

	$(".topic").click(e => {
		e.stopPropagation();
		let topicContain = $(e.target).parents(".listContainer");
		if ($(e.target).closest(".listContainer").parent().find(".topicCheckBox:checked").length === 0) {
			topicContain.animate({ width: '90%' }, 500);
			topicContain.find(".topicCheckBox").prop("checked", true);
			$("#content").on("click", function () {
				topicContain.animate({ width: '80%' }, 500);
				topicContain.find(".topicCheckBox").prop("checked", false);
			});
		}
		else if ($(e.target).parents(".listContainer").find(".topicCheckBox:checked").length === 1) {
			$("#content").off("click");
			topicContain.find(".topicCheckBox").prop("checked", false);
			topicContain.animate({ width: '80%' });
			$(".currentTopic").attr("id", $(e.target).parents(".listContainer").attr("id"));
			showClaimsList();
		}
		else if ($(e.target).closest(".listContainer").parent().find("input:checked").length > 0) {
			$(e.target).closest(".listContainer").parent().find("input:checked").parents(".listContainer").animate({ width: '80%' }, 500);
			$(e.target).closest(".listContainer").parent().find("input:checked").parents(".listContainer").find("input").prop("checked", false);

		}
	});

	$(".claim").click(e => {
		e.stopPropagation();
		let claimContain = $(e.target).parents(".listContainer");
		if ($(e.target).closest(".listContainer").parent().find("input:checked").length === 0) {
			claimContain.animate({ width: '90%' }, 500);
			claimContain.find("input").prop("checked", true);
			if ($(".contentButton").attr("id") == "opposedSelect" && $("form#postClaim").find("#claimSelect" + $(e.target).parents(".listContainer").attr("id")).length == 0) {
				$("form#postClaim").append('<input type="hidden" id = "claimSelect' + $(e.target).parents(".listContainer").attr("id") + '" name= ' + $(e.target).parents(".listContainer").attr("id") + ' value= "0" />');
				$(".relationShipDisplay > #opposedDisplay").append("<p>Claim" + $(e.target).parents(".listContainer").attr("id") + "</p><br>");
			}
			else if ($(".contentButton").attr("id") == "equivalentSelect" && $("form#postClaim").find("#claimSelect" + $(e.target).parents(".listContainer").attr("id")).length == 0) {
				$("form#postClaim").append('<input type="hidden" id = "claimSelect' + $(e.target).parents(".listContainer").attr("id") + '" name= ' + $(e.target).parents(".listContainer").attr("id") + ' value= "1" />');
				$(".relationShipDisplay > #equivDisplay").append("<p>Claim" + $(e.target).parents(".listContainer").attr("id") + "</p><br>");
			}
			else {
				$("#content").on("click", function () {
					if (claimContain.find("input:checked").length === 1) {
						claimContain.animate({ width: '80%' }, 500);
						claimContain.find("input:checked").prop("checked", false);
					}
				});
			}
		}
		else if ($(e.target).closest(".listContainer").find("input:checked").length === 1) {
			$("#content").off("click");
			claimContain.find("input").prop("checked", false);
			claimContain.animate({ width: '80%' });
			let id = $(e.target).parents(".listContainer").attr("id");
			if ($(".contentButton").attr("id") == "opposedSelect" || $(".contentButton").attr("id") == "equivalentSelect") {
				$("#claimSelect" + $(e.target).parents(".listContainer").attr("id")).remove();
			}
			else {
				showClaimPage(id);
			}
		}
		else if ($(e.target).closest(".listContainer").parent().find("input:checked").length > 0) {
			if ($(".contentButton").attr("id") == "opposedSelect" && $(e.target).parents(".listContainer").find("input:checked").length === 0) {
				claimContain.animate({ width: '90%' }, 500);
				claimContain.find("input").prop("checked", true);
				$("form#postClaim").append('<input type="hidden" id = "claimSelect' + $(e.target).parents(".listContainer").attr("id") + '" name= ' + $(e.target).parents(".listContainer").attr("id") + ' value= "0" />');
			}
			else if ($(".contentButton").attr("id") == "equivalentSelect" && $(e.target).parents(".listContainer").find("input:checked").length === 0) {
				claimContain.animate({ width: '90%' }, 500);
				claimContain.find("input").prop("checked", true);
				$("form#postClaim").append('<input type="hidden" id = "claimSelect' + $(e.target).parents(".listContainer").attr("id") + '" name= ' + $(e.target).parents(".listContainer").attr("id") + ' value= "1" />');
			}
			else {
				if ($(e.target).closest(".searchResult").find("input:checked").length > 0) {
					$(e.target).parents(".searchResult").find("input:checked").parents(".listContainer").animate({ width: '80%' }, 500);
					$(e.target).parents(".searchResult").find("input:checked").parents(".listContainer").find("input").prop("checked", false);
				}
				else {
					$(e.target).parents(".claimList").find("input:checked").parents(".listContainer").animate({ width: '80%' }, 500);
					$(e.target).parents(".claimList").find("input:checked").parents(".listContainer").find("input").prop("checked", false);
				}
			}
		}
	});


	$("#adminNoConfirm").click(e => {
		e.preventDefault();
		$(e.target).parent().find("#confirmChangeDisplay").empty();
	});

	$("#cancelSelector").click(e => {
		e.stopPropagation();
		$(".contentButton").removeAttr("id");
		$("#finalSelection").nextAll().remove();
		$(".claimListCheckBox").css("display", "none");
		$("#claimButtonContainer").css("display", "block");
		$(".currentTopic").attr("id", $("#formTopicId").val());
		showClaimsList();
	});

	$(document).click(e => { hideBox($(e.target)); });

	$("#assignAdmin").on("submit", function (e) {
		$("#adminPanel > form").css("visibility", "hidden");
		$("#adminPanel .load").css("display", "block");
		e.preventDefault();
		$.ajax({
			url: "../assignAdmin",
			method: "post",
			dataType: 'json',
			data: $(this).serialize(),
			timeout: 500,
			complete: assignAdmin
		});
	});

	$("#adminDeleteUser").on("submit", function (e) {
		$("#adminPanel > form").css("visibility", "hidden");
		$("#adminPanel .load").css("display", "block");
		e.preventDefault();
		$.ajax({
			url: "../deleteUser",
			method: "post",
			dataType: 'json',
			data: $(this).serialize(),
			timeout: 500,
			complete: deleteUserCheck
		});
	});

	$("#confirmChanges").on("submit", function (e) {
		$("#adminPanel > form").css("visibility", "hidden");
		$("#adminPanel .load").css("display", "block");
		e.preventDefault();

		$.ajax({
			url: "../confirmChanges",
			method: "post",
			dataType: 'json',
			data: $(this).serialize(),
			timeout: 500,
			complete: confirmChanges
		});
	});

	$("#createAccountForm").on("submit", function (e) {
		e.preventDefault();

		if (accountValidation()) {
			$("#createAccountForm").css("visibility", "hidden");
			$("#createAccount .load").css("display", "block");
			$.ajax({
				url: "../createAccount",
				method: "post",
				data: $(this).serialize(),
				timeout: 500,
				complete: createAccount
			});
		}

	});

	$("#loginForm").on("submit", function (e) {
		e.preventDefault();
		$("#accountLogin .load").css("display", "block");
		$("#loginForm").css("visibility", "hidden");
		$("#createAccountButton").css("visibility", "hidden");
		$.ajax({
			url: "../login",
			method: "post",
			data: $(this).serialize(),
			timeout: 500,
			complete: loginUser
		});

	});
	$("#logoutButton").click(e => {
		e.preventDefault();

		$.ajax({
			url: "../logout",
			method: "get",
			timeout: 500,
			complete: logoutUser
		});

	});

	$("#postTopic").on("submit", function (e) {
		e.preventDefault();
		$("#topicButtonContainer .load").css("display", "block");
		$("#postTopic").css("visibility", "hidden");
		$.ajax({
			url: "../createTopic",
			method: "post",
			data: $(this).serialize(),
			timeout: 500,
			complete: createTopic
		});
	});

	$("#postClaim").on("submit", function (e) {
		e.preventDefault();
		$("#claimButtonContainer .load").css("display", "block");
		$("#postClaim").css("visibility", "hidden");

		$.ajax({
			url: "../createClaim",
			method: "post",
			data: $(this).serialize(),
			timeout: 500,
			complete: createClaim
		});

	});
}
function ajaxGetRequest(value, id) {
	$.ajax({
		url: "../liveUpdate",
		method: "get",
		data: {
			updateType: value,
			currentId: id
		},
		timeout: 500,
		complete: liveUpdate
	});
}
setInterval(function () {
	if ($(".topicList").attr("id") == "active" || $(".claimList").attr("id") == "active") {
		ajaxGetRequest("topic", "none");
		ajaxGetRequest("claimList", "none");
	}
	else if ($(".claimPage").attr("id") == "active") {
		let id = $(".currentClaim").attr("id");
		ajaxGetRequest("claimPage", id);
	}
}, 3000);
$(setup);
