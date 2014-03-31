var Lazy=require("lazy");

var node = process.env.SERF_SELF_NAME;
var role = process.env.SERF_TAG_ROLE;
var eventType = process.env.SERF_EVENT; 

console.log("Handling event. node: %s, role: %s, event: %s, ", node, role, eventType);

var handlerMap = {};

exports.register = function(role) {
	return {		
		role: role,
		event: function(events, handler) {
			var eventNames = events.split(",");
			for(name in eventNames){
				console.log("Registering: " + eventNames[name] + " on role " + role);
				if(!handlerMap[role]) {
					handlerMap[role] = {};
				}
				handlerMap[role][eventNames[name]] = handler;
			}			
			return this;
		}
	};
};

//name, address, role, then tags
var MemberPayload = function(args) {
	this.name = args[0];
	this.address = args[1];
	this.role = args[2];
	this.tags = {};
	
	var arr = args[3].split(/[,=]/);
	for (var i=0; i<arr.length; i++) {
		if(((i + 1) % 2) == 0) {
			this.tags[arr[i - 1]] = arr[i];
		}
	}
}

exports.handle = function(cb) {
	switch(eventType) {
		case "user":
			console.log("user event: " + process.env.SERF_USER_EVENT);
			readPayload(function(line) {
				runHandler(role, process.env.SERF_USER_EVENT, line.toString());
			});
		  break;
		case "query":
			console.log("query event: " + process.env.SERF_QUERY_NAME);
			readPayload(function(line) {
				runHandler(role, process.env.SERF_QUERY_NAME, line.toString());
			});
		  break;
		default:
			console.log("member event");
			readPayload(function(line) {
				runHandler(role, eventType, new MemberPayload(line.toString().split("\t")));
			});
		  
	}
}
	
var runHandler = function(role, event, payload) {
	if(handlerMap[role] && handlerMap[role][event]) {
		handlerMap[role][event](payload);
	} else if(handlerMap["*"] && handlerMap["*"][event]) {
		handlerMap["*"][event](payload);
	} else {
		console.log("No handler for event: %s, role: %s", event, role);
	}
};
	
var readPayload = function(parser) {
	new Lazy(process.stdin)
		.lines
		.forEach(
		function(line) { 
			parser(line); 
		});
		process.stdin.resume();
}	

