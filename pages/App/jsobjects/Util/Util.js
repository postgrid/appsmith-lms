export default {
	synchronize: async () => {
        await get_user.run();
        await get_user_department.run();
        await get_partner.run();
				await get_postcard_month_volume.run();
				await get_cheque_month_volume.run();
				await get_letter_month_volume.run();
				await get_current_tier.run();
				await get_partner.run();
				await get_printernames.run();
				await get_total_volume.run();
				await get_total_volume_per_month.run();
    } ,
		autorefresh: async () => 
			{
		setInterval(() => {
			get_user.run(),
			get_user_department.run(),
			get_cheque_month_volume.run(),
			get_letter_month_volume.run(),
			get_cheque_month_volume.run(),
			get_current_tier.run(),
			get_total_volume.run(),
			get_total_volume_per_month.run()
											}, 5000, "autoupdate");
  }
}