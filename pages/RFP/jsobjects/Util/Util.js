export default {
		Synchronize: async () => {
			await get_user.run();
			await get_user_department.run();
			await get_all_tier.run();
			await get_partner.run();
			await get_printernames.run();
			await PackageTier.run();
			await get_RFP_Comparison_1.run();
			await get_RFP_Comparison_2.run();
			await get_RFP_T1.run();
			await get_RFP_T2.run();
			await get_RFP_T3.run();
			await get_RFP_T4.run();
			await get_RFP_T5.run();
  }

}