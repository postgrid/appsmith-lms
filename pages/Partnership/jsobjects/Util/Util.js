export default {
	synchronize: async () => {
    await get_user.run();
		await get_user_department.run();
		await get_printernames.run();
		await get_partner.run();
  },
		autrefresh: async () => {
		setInterval(() => get_partner.run(), 2000, "autoupdate");
  
}
}