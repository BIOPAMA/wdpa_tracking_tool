module.exports = {
	getFeatureStatus: function(feature){
		let status = "";
		switch (feature.layer.id) {
			case window.LYR_TO_CHANGED_ATTRIBUTE:
			case window.LYR_TO_GEOMETRY_POINT_TO_POLYGON:
			case window.LYR_TO_GEOMETRY_POINT_COUNT_CHANGED_POLYGON:
			case window.LYR_TO_GEOMETRY_SHIFTED_POLYGON:
				status = "changed";
				break;
			case window.LYR_TO_NEW_POLYGON:
			case window.LYR_TO_NEW_POINT:
				status = "added";
				break;
			case window.LYR_FROM_DELETED_POLYGON:
			case window.LYR_FROM_DELETED_POINT:
				status = "removed";
				break;
			case window.LYR_TO_POLYGON:
			case window.LYR_TO_POINT:
				status = "no_change";
				break;
			default:
				//code
		}
		return status;
	},
};