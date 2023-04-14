export default {
	clearPicker_orders: async () => {
		await resetWidget("FilePicker1");
		storeValue('newList',undefined);
	},

	synchronize: async () => {
		await	get_user.run();
		await	get_user_department.run();

	}/*,
	autorefresh: async () => {
		setInterval(() => {	get_user.run(), get_user_department.run()}, 3000, "autoupdate");
	}*/

}